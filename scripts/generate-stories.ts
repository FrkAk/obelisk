/**
 * Generates AI stories for POIs that lack current remarks.
 * Fetches POIs without stories, builds context from profile and tags,
 * generates stories via Ollama, and inserts them as remarks.
 *
 * @module generate-stories
 */

import { db } from "../src/lib/db/client";
import { pois, categories, remarks } from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { checkOllamaHealth } from "../src/lib/ai/ollama";
import { generateStory } from "../src/lib/ai/storyGenerator";
import type { StoryPoiContext } from "../src/lib/ai/storyGenerator";
import { processWithConcurrency } from "./lib/concurrency";
import { loadTags, loadContactInfo } from "../src/lib/db/queries/pois";
import { insertRemark } from "../src/lib/db/queries/remarks";
import { createLogger, formatEta } from "../src/lib/logger";
import { POI_SELECT_FIELDS, toPoi } from "./lib/poi-row";

const log = createLogger("stories");

const STORY_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";
const BATCH_LIMIT = parseInt(process.env.STORY_BATCH_LIMIT || "20", 10);
const CONCURRENCY = parseInt(process.env.STORY_CONCURRENCY || "3", 10);

/**
 * Generates and saves stories for all POIs missing current remarks.
 */
async function main(): Promise<void> {
  log.info("Checking Ollama availability...");
  const isHealthy = await checkOllamaHealth(STORY_MODEL);

  if (!isHealthy) {
    log.error(`Ollama not available or model ${STORY_MODEL} not loaded.`);
    log.info(`Run: ollama pull ${STORY_MODEL}`);
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

        const [poiTagList, contact] = await Promise.all([
          loadTags(poi.id),
          loadContactInfo(poi.id),
        ]);

        const ctx: StoryPoiContext = {
          poi,
          categorySlug,
          categoryName,
          profile: poi.profile,
          tags: poiTagList,
          contactInfo: contact,
        };

        const story = await generateStory(ctx, STORY_MODEL);

        if (!story) {
          skippedCount++;
          log.info(`Skipped: ${poi.name} (insufficient data)`);
          return;
        }

        await insertRemark({ poiId: poi.id, locale: poi.locale, story });

        savedCount++;
        const done = savedCount + failedCount + skippedCount;
        log.info(
          `${formatEta(startMs, done, poisWithoutRemarks.length)} — Saved: ${poi.name} (confidence: ${story.confidence})`,
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
    `Generated ${savedCount} stories (${failedCount} failed, ${skippedCount} skipped)`,
  );
  process.exit(0);
}

main().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
