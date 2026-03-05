import { generateText, checkOllamaHealth } from "@/lib/ai/ollama";
import { downloadToBase64 } from "@/lib/media/download";
import { createLogger } from "@/lib/logger";

const log = createLogger("visual-description");

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";

/**
 * Generates a visual description of a POI from available thumbnail images.
 * Uses the vision model to describe facade, signage, architecture, and surroundings.
 *
 * @param name - POI name for prompt context.
 * @param mapillaryThumbUrl - Mapillary street-level thumbnail URL.
 * @param wikiImageUrl - Wikimedia image URL.
 * @param model - Ollama model to use (defaults to OLLAMA_MODEL env).
 * @returns Visual description string, or null if no images available or generation fails.
 */
export async function generateVisualDescription(
  name: string,
  mapillaryThumbUrl: string | undefined,
  wikiImageUrl: string | undefined,
  model: string = OLLAMA_MODEL,
): Promise<string | null> {
  const imageUrls: string[] = [];
  if (mapillaryThumbUrl) imageUrls.push(mapillaryThumbUrl);
  if (wikiImageUrl) imageUrls.push(wikiImageUrl);
  if (imageUrls.length === 0) return null;

  const images: string[] = [];
  for (const url of imageUrls) {
    const b64 = await downloadToBase64(url);
    if (b64) images.push(b64);
  }
  if (images.length === 0) return null;

  const prompt = `Describe what you see in these photos of ${name}. Focus on facade, signage, outdoor features, architecture, surroundings. 2-4 sentences.`;
  try {
    return await generateText(prompt, model, { temperature: 0.3, num_predict: 256 }, images);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.warn(`${name}: vision description failed — ${msg}`);
    return null;
  }
}

/**
 * Checks if Ollama is healthy and generates a visual description.
 * Returns null silently if Ollama is unavailable.
 *
 * @param name - POI name for prompt context.
 * @param mapillaryThumbUrl - Mapillary street-level thumbnail URL.
 * @param wikiImageUrl - Wikimedia image URL.
 * @returns Visual description string, or null.
 */
export async function generateVisualDescriptionSafe(
  name: string,
  mapillaryThumbUrl: string | undefined,
  wikiImageUrl: string | undefined,
): Promise<string | null> {
  const healthy = await checkOllamaHealth(OLLAMA_MODEL);
  if (!healthy) {
    log.info("Ollama unavailable, skipping visual description");
    return null;
  }
  return generateVisualDescription(name, mapillaryThumbUrl, wikiImageUrl);
}
