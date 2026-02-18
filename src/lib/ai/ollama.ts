import { createLogger } from "@/lib/logger";

const log = createLogger("ollama");

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  think?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b-it-qat";
export const SEARCH_MODEL = process.env.OLLAMA_SEARCH_MODEL || "gemma3:4b-it-qat";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "embeddinggemma:300m";
export const TRANSLATE_MODEL = process.env.OLLAMA_TRANSLATE_MODEL || "translategemma:4b";

/**
 * Generates text using Ollama.
 *
 * Args:
 *     prompt: The prompt to send to the model.
 *     model: The model to use (defaults to OLLAMA_MODEL env or gemma3:27b).
 *     options: Generation options (temperature, top_p, num_predict).
 *
 * Returns:
 *     The generated text.
 */
export async function generateText(
  prompt: string,
  model: string = DEFAULT_MODEL,
  options?: OllamaGenerateRequest["options"]
): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      think: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024,
        ...options,
      },
    } satisfies OllamaGenerateRequest),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data: OllamaGenerateResponse = await response.json();

  if (!data.response) {
    throw new Error(`Ollama returned empty response: ${JSON.stringify(data)}`);
  }

  return data.response;
}

/**
 * Extracts structured JSON from text using Ollama's chat API with format enforcement.
 *
 * Args:
 *     systemPrompt: System message defining extraction rules.
 *     userPrompt: User message containing the text to extract from.
 *     model: The model to use (defaults to OLLAMA_SEARCH_MODEL).
 *     options: Generation options (temperature, top_p, num_predict).
 *
 * Returns:
 *     Parsed JSON object of type T, or null if extraction failed.
 */
export async function chatExtract<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = SEARCH_MODEL,
  options?: { temperature?: number; top_p?: number; num_predict?: number },
): Promise<T | null> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        format: "json",
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.7,
          num_predict: 2048,
          ...options,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      log.error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
      return null;
    }

    const data: { message?: { content?: string }; done: boolean } = await response.json();
    const content = data.message?.content;

    if (!content) {
      log.warn("Chat API returned empty message content");
      return null;
    }

    return JSON.parse(content) as T;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error(`chatExtract failed: ${msg}`);
    return null;
  }
}

/**
 * Checks if Ollama is available and the model is loaded.
 *
 * Args:
 *     model: The model to check for.
 *
 * Returns:
 *     True if Ollama is available and the model exists.
 */
export async function checkOllamaHealth(
  model: string = DEFAULT_MODEL
): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models || [];
    const modelNames = models.map((m: { name: string }) => m.name);
    const modelPrefix = model.split(":")[0];
    const found = models.some((m: { name: string }) => m.name.startsWith(modelPrefix));

    log.info(`Health check — found: ${found ? modelNames.find((n: string) => n.startsWith(modelPrefix)) : "none"} (looking for: ${modelPrefix})`);

    return found;
  } catch (error) {
    log.error("Health check failed:", error);
    return false;
  }
}

const LANG_CODE_TO_NAME: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese",
  tr: "Turkish",
  el: "Greek",
  ja: "Japanese",
  pl: "Polish",
  cs: "Czech",
  hu: "Hungarian",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  ru: "Russian",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
};

function buildTranslatePrompt(
  text: string,
  sourceLangName: string,
  sourceCode: string,
  targetLangName: string,
  targetCode: string,
): string {
  return `You are a professional ${sourceLangName} (${sourceCode}) to ${targetLangName} (${targetCode}) translator.
Your goal is to accurately convey the meaning and nuances of the original ${sourceLangName} text while adhering to ${targetLangName} grammar, vocabulary, and cultural sensitivities.
Produce only the ${targetLangName} translation, without any additional explanations or commentary.
Please translate the following ${sourceLangName} text into ${targetLangName}:


${text}`;
}

/**
 * Translates text between languages using Ollama with translategemma.
 * For long texts (>2500 chars), splits at section delimiters and translates each part
 * sequentially to avoid overwhelming Ollama with concurrent requests.
 *
 * Args:
 *     text: The text to translate.
 *     sourceLang: Source language name (e.g., "German") — used for skip-if-English and logging.
 *     targetLangCode: Target language code (e.g., "en", "de"). Defaults to "en".
 *     model: Translation model to use.
 *
 * Returns:
 *     Translated text, or original text if source matches target or translation fails.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLangCode: string = "en",
  model: string = TRANSLATE_MODEL,
): Promise<string> {
  const targetLangName = LANG_CODE_TO_NAME[targetLangCode] ?? "English";
  if (sourceLang.toLowerCase() === targetLangName.toLowerCase()) return text;
  if (!text.trim()) return text;

  const sourceLangLower = sourceLang.toLowerCase();
  const sourceCode = Object.entries(LANG_CODE_TO_NAME)
    .find(([, name]) => name.toLowerCase() === sourceLangLower)?.[0] ?? "en";

  try {
    const sections = text.length > 2500
      ? text.split("\n---").map((s) => s.trim()).filter(Boolean)
      : [text];

    const translated: string[] = [];
    for (const section of sections) {
      const prompt = buildTranslatePrompt(section, sourceLang, sourceCode, targetLangName, targetLangCode);
      const result = await generateText(prompt, model, {
        temperature: 0.1,
        num_predict: 4096,
      });
      translated.push(result);
    }

    return translated.join("\n---\n");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.warn(`Translation failed (${sourceLang} → ${targetLangName}): ${msg}`);
    return text;
  }
}
