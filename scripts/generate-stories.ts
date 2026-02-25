import { db } from "../src/lib/db/client";
import { pois, categories, remarks } from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { checkOllamaHealth } from "../src/lib/ai/ollama";
import { generateStory } from "../src/lib/ai/storyGenerator";
import type { StoryPoiContext } from "../src/lib/ai/storyGenerator";
import type { Poi, PoiProfile } from "../src/types";
import { processWithConcurrency } from "./lib/concurrency";
import { loadTags, loadContactInfo } from "../src/lib/db/queries/pois";

const STORY_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";
const BATCH_LIMIT = parseInt(process.env.STORY_BATCH_LIMIT || "20", 10);
const CONCURRENCY = parseInt(process.env.STORY_CONCURRENCY || "3", 10);

async function main() {
  console.log("[stories] Checking Ollama availability...");
  const isHealthy = await checkOllamaHealth(STORY_MODEL);

  if (!isHealthy) {
    console.error(`[stories] Ollama not available or model ${STORY_MODEL} not loaded.`);
    console.log(`Run: ollama pull ${STORY_MODEL}`);
    process.exit(1);
  }

  console.log("[stories] Ollama is ready!");
  console.log("[stories] Fetching POIs without current remarks...");

  const poisWithoutRemarks = await db
    .select({
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
      searchVector: pois.searchVector,
      createdAt: pois.createdAt,
      updatedAt: pois.updatedAt,
      categorySlug: categories.slug,
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
    console.log("[stories] All POIs already have current remarks!");
    process.exit(0);
  }

  console.log(`[stories] Found ${poisWithoutRemarks.length} POIs without remarks (concurrency: ${CONCURRENCY})`);

  let savedCount = 0;
  let failedCount = 0;

  type PoiRow = (typeof poisWithoutRemarks)[number];
  await processWithConcurrency<PoiRow, void>(poisWithoutRemarks, CONCURRENCY, async (row) => {
    try {
      const categorySlug = row.categorySlug ?? "hidden";
      const categoryName = row.categoryName ?? "Hidden Gems";

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
        searchVector: row.searchVector,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

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

      await db.insert(remarks).values({
        poiId: poi.id,
        locale: poi.locale,
        version: 1,
        isCurrent: true,
        title: story.title.slice(0, 100),
        teaser: story.teaser.slice(0, 100),
        content: story.content,
        localTip: story.localTip,
        durationSeconds: story.durationSeconds,
        modelId: story.modelId,
        confidence: story.confidence,
        contextSources: story.contextSources,
      });

      savedCount++;
      console.log(
        `[stories] [${savedCount + failedCount}/${poisWithoutRemarks.length}] Saved: ${poi.name} (confidence: ${story.confidence})`,
      );
    } catch (error) {
      failedCount++;
      console.error(
        `[stories] Failed for ${row.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  });

  console.log(`[stories] Generated and saved ${savedCount} stories (${failedCount} failed)`);
  console.log("[stories] Story generation complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("[stories] Fatal error:", error);
  process.exit(1);
});
