import { EMBED_MODEL } from "./ollama";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

interface EmbedResponse {
  embeddings: number[][];
}

/**
 * Sends texts to Ollama for embedding generation.
 *
 * Args:
 *     texts: Array of text strings to embed.
 *
 * Returns:
 *     Array of embedding vectors.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Ollama embed error: ${response.status} - ${errorText}`);
  }

  const data: EmbedResponse = await response.json();

  if (!data.embeddings || data.embeddings.length === 0) {
    throw new Error("Ollama returned empty embeddings");
  }

  return data.embeddings;
}
