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

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";
export const SEARCH_MODEL = process.env.OLLAMA_SEARCH_MODEL || "gemma3:4b";
export const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "mxbai-embed-large";

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
