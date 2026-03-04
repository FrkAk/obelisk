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
    top_k?: number;
    repeat_penalty?: number;
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
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";
export const SEARCH_MODEL = process.env.OLLAMA_SEARCH_MODEL || "qwen3.5:4b";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "embeddinggemma:300m";

/**
 * Generates text using Ollama.
 *
 * Args:
 *     prompt: The prompt to send to the model.
 *     model: The model to use (defaults to OLLAMA_MODEL env or qwen3.5:9b).
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
        temperature: 0.8,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        num_predict: 640,
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
    const modelNames: string[] = models.map((m: { name: string }) => m.name);
    const found = modelNames.some((n) => n === model || n === `${model}:latest`);

    log.info(`Health check — ${found ? "found" : "missing"}: ${model}`);

    return found;
  } catch (error) {
    log.error("Health check failed:", error);
    return false;
  }
}

