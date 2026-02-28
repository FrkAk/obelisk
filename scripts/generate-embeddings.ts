/**
 * Generates vector embeddings for POIs missing them (or stale ones).
 * Processes POIs in batches, building embedding text from profile + related
 * data, then calling Ollama to produce 768-dim vectors stored in pgvector.
 *
 * @module generate-embeddings
 */

import { db } from "../src/lib/db/client";
import { pois, categories } from "../src/lib/db/schema";
import { eq, isNull, sql, or } from "drizzle-orm";
import { EMBED_MODEL, checkOllamaHealth } from "../src/lib/ai/ollama";
import { buildEmbeddingText } from "../src/lib/ai/embeddingBuilder";
import { embedTexts } from "../src/lib/ai/embeddings";
import {
  loadTags,
  loadCuisines,
  loadAccessibilityInfo,
} from "../src/lib/db/queries/pois";
import type { PoiProfile } from "../src/types";
import { createLogger, formatEta } from "../src/lib/logger";
import { POI_SELECT_FIELDS, toPoi } from "./lib/poi-row";

const log = createLogger("embeddings");

const BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE || "25", 10);
const STALE_MODE = process.argv.includes("--stale");

/**
 * Fetches POIs that need embedding generation.
 * In default mode, selects all POIs without embeddings.
 * In stale mode, also includes POIs whose profile was updated after embedding.
 *
 * @param stale - Whether to include stale embeddings.
 * @returns Array of POI rows with category slug.
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
 * Generates and stores vector embeddings for POIs.
 */
async function generateEmbeddings(): Promise<void> {
  const modeLabel = STALE_MODE ? "stale + missing" : "missing only";
  log.info(`Starting embedding generation (mode: ${modeLabel})...`);

  const healthy = await checkOllamaHealth(EMBED_MODEL);
  if (!healthy) {
    log.error(`Ollama not available or model ${EMBED_MODEL} not loaded.`);
    log.info(`Run: ollama pull ${EMBED_MODEL}`);
    process.exit(1);
  }

  const targetPois = await fetchTargetPois(STALE_MODE);

  log.info(
    `Found ${targetPois.length} POIs to embed (batch size: ${BATCH_SIZE})`,
  );

  if (targetPois.length === 0) {
    log.info("Nothing to do");
    process.exit(0);
  }

  let processed = 0;
  let errors = 0;
  const startMs = Date.now();

  for (let i = 0; i < targetPois.length; i += BATCH_SIZE) {
    const batch = targetPois.slice(i, i + BATCH_SIZE);

    const contexts: Array<{ poi: ReturnType<typeof toPoi>; text: string }> = [];

    const contextResults = await Promise.allSettled(
      batch.map(async (row) => {
        const poi = toPoi(row);
        const profile = (row.profile as PoiProfile) ?? null;

        const [poiTagList, poiCuisineList, accessibility] = await Promise.all([
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
        log.error(
          `Context load failed for "${batch[j].name}": ${result.reason}`,
        );
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
      `${formatEta(startMs, processed + errors, targetPois.length)} (${errors} errors)`,
    );
  }

  log.success(`Done! Processed: ${processed}, Errors: ${errors}`);
  process.exit(0);
}

generateEmbeddings().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
