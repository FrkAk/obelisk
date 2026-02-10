import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  remarks,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
  poiDishes,
  dishes,
  contactInfo,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { checkOllamaHealth } from "../src/lib/ai/ollama";
import { generateStory } from "../src/lib/ai/storyGenerator";
import type { StoryPoiContext, ProfileUnion } from "../src/lib/ai/storyGenerator";
import type {
  Poi,
  Tag,
  Cuisine,
  PoiDish,
  Dish,
  ContactInfo as ContactInfoType,
} from "../src/types";

const STORY_MODEL = process.env.OLLAMA_MODEL || "gemma3:27b";
const BATCH_LIMIT = parseInt(process.env.STORY_BATCH_LIMIT || "20", 10);

const CATEGORY_PROFILE_TABLE: Record<string, typeof foodProfiles | typeof historyProfiles | typeof architectureProfiles | typeof natureProfiles | typeof artCultureProfiles | typeof nightlifeProfiles | typeof shoppingProfiles | typeof viewpointProfiles> = {
  food: foodProfiles,
  history: historyProfiles,
  architecture: architectureProfiles,
  nature: natureProfiles,
  art: artCultureProfiles,
  culture: artCultureProfiles,
  views: viewpointProfiles,
  nightlife: nightlifeProfiles,
  shopping: shoppingProfiles,
};

async function loadProfile(poiId: string, categorySlug: string) {
  const table = CATEGORY_PROFILE_TABLE[categorySlug];
  if (!table) return null;

  const results = await db
    .select()
    .from(table)
    .where(eq(table.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

async function loadTags(poiId: string): Promise<Tag[]> {
  const results = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      group: tags.group,
      displayOrder: tags.displayOrder,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id))
    .where(eq(poiTags.poiId, poiId));

  return results;
}

async function loadCuisines(poiId: string): Promise<Cuisine[]> {
  const results = await db
    .select({
      id: cuisines.id,
      slug: cuisines.slug,
      name: cuisines.name,
      region: cuisines.region,
      parentSlug: cuisines.parentSlug,
      icon: cuisines.icon,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id))
    .where(eq(poiCuisines.poiId, poiId));

  return results;
}

async function loadDishes(poiId: string): Promise<Array<PoiDish & { dish: Dish }>> {
  const results = await db
    .select()
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .where(eq(poiDishes.poiId, poiId));

  return results.map((r) => ({
    ...r.poi_dishes,
    dish: r.dishes,
  }));
}

async function loadContactInfo(poiId: string): Promise<ContactInfoType | null> {
  const results = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

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

  console.log(`[stories] Found ${poisWithoutRemarks.length} POIs without remarks`);

  let savedCount = 0;

  for (const row of poisWithoutRemarks) {
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
        wikipediaUrl: row.wikipediaUrl,
        imageUrl: row.imageUrl,
        embedding: row.embedding,
        searchVector: row.searchVector,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      const [profile, poiTagList, cuisineList, dishList, contact] =
        await Promise.all([
          loadProfile(poi.id, categorySlug),
          loadTags(poi.id),
          loadCuisines(poi.id),
          loadDishes(poi.id),
          loadContactInfo(poi.id),
        ]);

      const ctx: StoryPoiContext = {
        poi,
        categorySlug,
        categoryName,
        profile: profile as ProfileUnion,
        tags: poiTagList,
        cuisines: cuisineList,
        dishes: dishList,
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

      await db.insert(enrichmentLog).values({
        poiId: poi.id,
        source: "llm_story",
        status: "success",
        fieldsUpdated: [
          "remarks.title",
          "remarks.teaser",
          "remarks.content",
          "remarks.local_tip",
        ],
        metadata: {
          model: story.modelId,
          confidence: story.confidence,
          contextSources: story.contextSources,
        },
      });

      savedCount++;
      console.log(
        `[stories] [${savedCount}/${poisWithoutRemarks.length}] Saved: ${poi.name} (confidence: ${story.confidence})`,
      );

      await new Promise((r) => setTimeout(r, 300));
    } catch (error) {
      console.error(
        `[stories] Failed for ${row.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(`[stories] Generated and saved ${savedCount} stories`);
  console.log("[stories] Story generation complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("[stories] Fatal error:", error);
  process.exit(1);
});
