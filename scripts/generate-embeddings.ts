import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { EMBED_MODEL } from "../src/lib/ai/ollama";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const BATCH_SIZE = 10;

interface EmbedResponse {
  embeddings: number[][];
}

async function embedText(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
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

  return data.embeddings[0];
}

function buildEmbeddingText(poi: {
  name: string;
  osmAmenity: string | null;
  osmCuisine: string | null;
  description: string | null;
}): string {
  const parts = [poi.name];
  if (poi.osmAmenity) parts.push(poi.osmAmenity);
  if (poi.osmCuisine) parts.push(poi.osmCuisine);
  if (poi.description) parts.push(poi.description);
  return parts.join(". ");
}

async function generateEmbeddings() {
  console.log("[embeddings] Starting embedding generation...");

  const unembeddedPois = await db
    .select({
      id: pois.id,
      name: pois.name,
      osmAmenity: pois.osmAmenity,
      osmCuisine: pois.osmCuisine,
      description: pois.description,
    })
    .from(pois)
    .where(isNull(pois.embedding));

  console.log(`[embeddings] Found ${unembeddedPois.length} POIs without embeddings`);

  if (unembeddedPois.length === 0) {
    console.log("[embeddings] Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < unembeddedPois.length; i += BATCH_SIZE) {
    const batch = unembeddedPois.slice(i, i + BATCH_SIZE);

    for (const poi of batch) {
      try {
        const text = buildEmbeddingText(poi);
        const embedding = await embedText(text);
        const vectorStr = `[${embedding.join(",")}]`;

        await db.execute(
          sql`UPDATE pois SET embedding = ${vectorStr}::vector WHERE id = ${poi.id}`
        );

        processed++;
      } catch (error) {
        errors++;
        console.error(`[embeddings] Error for "${poi.name}":`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`[embeddings] Progress: ${processed + errors}/${unembeddedPois.length} (${errors} errors)`);
  }

  console.log(`[embeddings] Done! Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

generateEmbeddings().catch((error) => {
  console.error("[embeddings] Fatal error:", error);
  process.exit(1);
});
