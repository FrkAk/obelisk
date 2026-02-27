import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
} from "../src/lib/db/schema";
import { eq, isNull, sql, or } from "drizzle-orm";
import { EMBED_MODEL, checkOllamaHealth } from "../src/lib/ai/ollama";
import { buildEmbeddingText } from "../src/lib/ai/embeddingBuilder";
import { embedTexts } from "../src/lib/ai/embeddings";
import {
  loadTags,
  loadCuisines,
  loadAccessibilityInfo,
} from "../src/lib/db/queries/pois";
import type { Poi, PoiProfile } from "../src/types";
import { createLogger } from "../src/lib/logger";

const log = createLogger("embeddings");

const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE || "25", 10);
const STALE_MODE = process.argv.includes("--stale");

const POI_SELECT_FIELDS = {
  id: pois.id,
  osmId: pois.osmId,
  name: pois.name,
  categoryId: pois.categoryId,
  regionId: pois.regionId,
  latitude: pois.latitude,
  longitude: pois.longitude,
  address: pois.address,
  locale: pois.locale,
  osmType: pois.osmType,
  osmTags: pois.osmTags,
  profile: pois.profile,
  wikipediaUrl: pois.wikipediaUrl,
  imageUrl: pois.imageUrl,
  embedding: pois.embedding,
  createdAt: pois.createdAt,
  updatedAt: pois.updatedAt,
  categorySlug: categories.slug,
} as const;

/**
 * Fetches POIs that need embedding generation.
 * In default mode, selects all POIs without embeddings.
 * In stale mode, also includes POIs whose profile was updated after embedding.
 *
 * Args:
 *     stale: Whether to include stale embeddings.
 *
 * Returns:
 *     Array of POI rows with category slug.
 */
async function fetchTargetPois(stale: boolean) {
  if (!stale) {
    return db
      .select(POI_SELECT_FIELDS)
      .from(pois)
      .leftJoin(categories, eq(pois.categoryId, categories.id))
      .where(isNull(pois.embedding));
  }

  return db
    .select(POI_SELECT_FIELDS)
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      or(
        isNull(pois.embedding),
        sql`${pois.updatedAt} > ${pois.createdAt}`,
      ),
    );
}

/**
 * Generates vector embeddings for POIs missing them (or stale ones).
 * Processes POIs in batches, building embedding text from profile + related
 * data, then calling Ollama to produce 768-dim vectors stored in pgvector.
 */
async function generateEmbeddings() {
  const modeLabel = STALE_MODE ? "stale + missing" : "missing only";
  log.info(`Starting embedding generation (mode: ${modeLabel})...`);

  const healthy = await checkOllamaHealth(EMBED_MODEL);
  if (!healthy) {
    log.error(`Ollama not available or model ${EMBED_MODEL} not loaded.`);
    log.info(`Run: ollama pull ${EMBED_MODEL}`);
    process.exit(1);
  }

  const targetPois = await fetchTargetPois(STALE_MODE);

  log.info(`Found ${targetPois.length} POIs to embed (batch size: ${BATCH_SIZE})`);

  if (targetPois.length === 0) {
    log.info("Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < targetPois.length; i += BATCH_SIZE) {
    const batch = targetPois.slice(i, i + BATCH_SIZE);

    const contexts: Array<{ poi: Poi; text: string }> = [];

    const contextResults = await Promise.allSettled(
      batch.map(async (row) => {
        const poi: Poi = {
          id: row.id,
          osmId: row.osmId,
          name: row.name,
          categoryId: row.categoryId,
          regionId: row.regionId,
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
          locale: row.locale,
          osmType: row.osmType,
          osmTags: row.osmTags,
          profile: row.profile as PoiProfile | null,
          wikipediaUrl: row.wikipediaUrl,
          imageUrl: row.imageUrl,
          embedding: row.embedding,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };

        const profile = (row.profile as PoiProfile) ?? null;

        const [poiTagList, poiCuisineList, accessibility] =
          await Promise.all([
            loadTags(poi.id),
            loadCuisines(poi.id),
            loadAccessibilityInfo(poi.id),
          ]);

        const text = buildEmbeddingText(
          poi,
          profile,
          poiTagList,
          poiCuisineList,
          accessibility,
        );

        return { poi, text };
      }),
    );

    for (let j = 0; j < contextResults.length; j++) {
      const result = contextResults[j];
      if (result.status === "fulfilled") {
        contexts.push(result.value);
      } else {
        errors++;
        log.error(`Context load failed for "${batch[j].name}": ${result.reason}`);
      }
    }

    if (contexts.length === 0) continue;

    try {
      const texts = contexts.map((c) => c.text);
      const embeddings = await embedTexts(texts);

      await Promise.all(
        contexts.map(async (ctx, j) => {
          const vectorStr = `[${embeddings[j].join(",")}]`;

          await db.execute(
            sql`UPDATE pois
                SET embedding = ${vectorStr}::vector,
                    updated_at = now()
                WHERE id = ${ctx.poi.id}`,
          );

          processed++;
        }),
      );
    } catch (error) {
      errors += contexts.length;
      log.error(
        "Batch embed failed:",
        error instanceof Error ? error.message : error,
      );
    }

    log.info(
      `Progress: ${processed + errors}/${targetPois.length} (${errors} errors)`,
    );
  }

  log.success(`Done! Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

generateEmbeddings().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
