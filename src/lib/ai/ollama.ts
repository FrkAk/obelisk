interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
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
const DEFAULT_MODEL = "gemma3:4b-it-q4_K_M";

/**
 * Generates text using Ollama.
 *
 * Args:
 *     prompt: The prompt to send to the model.
 *     model: The model to use (defaults to gemma3:4b-it-q4_K_M).
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
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 500,
        ...options,
      },
    } satisfies OllamaGenerateRequest),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data: OllamaGenerateResponse = await response.json();
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
    return models.some((m: { name: string }) => m.name.startsWith(model.split(":")[0]));
  } catch {
    return false;
  }
}
