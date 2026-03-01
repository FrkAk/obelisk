/**
 * Generates AI remarks for POIs that lack current remarks.
 * Fetches POIs without remarks, builds context from profile and tags,
 * generates remarks via Ollama, and inserts them as remarks.
 *
 * @module generate-remarks
 */

import { db } from "../src/lib/db/client";
import { pois, categories, remarks } from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { checkOllamaHealth } from "../src/lib/ai/ollama";
import { generateRemark } from "../src/lib/ai/remarkGenerator";
import type { RemarkPoiContext } from "../src/lib/ai/remarkGenerator";
import { processWithConcurrency } from "./lib/concurrency";
import { loadTagMap, loadContactMap } from "./lib/bulk-loaders";
import { insertRemark } from "../src/lib/db/queries/remarks";
import { createLogger, formatEta } from "../src/lib/logger";
import { POI_SELECT_FIELDS, toPoi } from "./lib/poi-row";
import type { Tag } from "../src/types/api";

const log = createLogger("remarks");

const REMARK_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";
const BATCH_LIMIT = parseInt(process.env.REMARK_BATCH_LIMIT || "100", 10);
const CONCURRENCY = parseInt(process.env.REMARK_CONCURRENCY || "3", 10);

/**
 * Generates and saves remarks for all POIs missing current remarks.
 */
async function main(): Promise<void> {
  log.info("Checking Ollama availability...");
  const isHealthy = await checkOllamaHealth(REMARK_MODEL);

  if (!isHealthy) {
    log.error(`Ollama not available or model ${REMARK_MODEL} not loaded.`);
    log.info(`Run: ollama pull ${REMARK_MODEL}`);
    process.exit(1);
  }

  log.info("Ollama is ready!");
  log.info("Fetching POIs without current remarks...");

  const poisWithoutRemarks = await db
    .select({
      ...POI_SELECT_FIELDS,
      categoryName: categories.name,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .leftJoin(
      remarks,
      sql`${remarks.poiId} = ${pois.id} AND ${remarks.isCurrent} = true`,
    )
    .where(isNull(remarks.id))
    .limit(BATCH_LIMIT);

  if (poisWithoutRemarks.length === 0) {
    log.info("All POIs already have current remarks!");
    process.exit(0);
  }

  log.info(
    `Found ${poisWithoutRemarks.length} POIs without remarks (concurrency: ${CONCURRENCY})`,
  );

  log.info("Bulk-loading context maps...");
  const [tagMap, contactMap] = await Promise.all([
    loadTagMap(),
    loadContactMap(),
  ]);
  log.info(`Context: ${tagMap.size} tags, ${contactMap.size} contacts`);

  let savedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const startMs = Date.now();

  type PoiRow = (typeof poisWithoutRemarks)[number];
  await processWithConcurrency<PoiRow, void>(
    poisWithoutRemarks,
    CONCURRENCY,
    async (row) => {
      try {
        const categorySlug = row.categorySlug ?? "hidden";
        const categoryName = row.categoryName ?? "Hidden Gems";
        const poi = toPoi(row);

        const tagNames = tagMap.get(poi.id) ?? [];
        const poiTagList = tagNames.map((name) => ({ name })) as Tag[];
        const contact = contactMap.get(poi.id) ?? null;

        const ctx: RemarkPoiContext = {
          poi,
          categorySlug,
          categoryName,
          profile: poi.profile,
          tags: poiTagList,
          contactInfo: contact,
        };

        const remark = await generateRemark(ctx, REMARK_MODEL);

        if (!remark) {
          skippedCount++;
          log.info(`Skipped: ${poi.name} (insufficient data)`);
          return;
        }

        await insertRemark({ poiId: poi.id, locale: poi.locale, remark: remark });

        savedCount++;
        const done = savedCount + failedCount + skippedCount;
        log.info(
          `${formatEta(startMs, done, poisWithoutRemarks.length)} — Saved: ${poi.name} (confidence: ${remark.confidence})`,
        );
      } catch (error) {
        failedCount++;
        log.error(
          `Failed for ${row.name}:`,
          error instanceof Error ? error.message : error,
        );
      }
    },
  );

  log.success(
    `Generated ${savedCount} remarks (${failedCount} failed, ${skippedCount} skipped)`,
  );
  process.exit(0);
}

main().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
