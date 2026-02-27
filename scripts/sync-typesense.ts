import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  remarks,
  poiTags,
  tags,
  poiCuisines,
  cuisines,
  accessibilityInfo,
  contactInfo,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { initCollection, upsertDocuments } from "../src/lib/search/typesense";
import { buildTypesenseDocument } from "../src/lib/search/profileSummary";
import { createLogger } from "../src/lib/logger";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("sync-typesense");

const BATCH_SIZE = 100;

/**
 * Loads all POI tags as a map from poiId to tag name array.
 *
 * Returns:
 *     Map of poiId to string array of tag names.
 */
async function loadTagMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiTags.poiId,
      tagName: tags.name,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.tagName);
    } else {
      map.set(row.poiId, [row.tagName]);
    }
  }
  return map;
}

/**
 * Loads all POI cuisines as a map from poiId to cuisine name array.
 *
 * Returns:
 *     Map of poiId to string array of cuisine names.
 */
async function loadCuisineMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiCuisines.poiId,
      cuisineName: cuisines.name,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.cuisineName);
    } else {
      map.set(row.poiId, [row.cuisineName]);
    }
  }
  return map;
}

/**
 * Loads accessibility data for all POIs as a map from poiId to accessibility fields.
 *
 * Returns:
 *     Map of poiId to object with wheelchair, dogFriendly, elevator, parkingAvailable.
 */
async function loadAccessibilityMap(): Promise<
  Map<string, { wheelchair: boolean | null; dogFriendly: boolean | null; elevator: boolean | null; parkingAvailable: boolean | null }>
> {
  const rows = await db
    .select({
      poiId: accessibilityInfo.poiId,
      wheelchair: accessibilityInfo.wheelchair,
      dogFriendly: accessibilityInfo.dogFriendly,
      elevator: accessibilityInfo.elevator,
      parkingAvailable: accessibilityInfo.parkingAvailable,
    })
    .from(accessibilityInfo);

  return new Map(rows.map((r) => [r.poiId, r]));
}

/**
 * Loads contact data for all POIs as a map from poiId to opening hours display.
 *
 * Returns:
 *     Map of poiId to object with openingHoursDisplay.
 */
async function loadContactMap(): Promise<Map<string, { openingHoursDisplay: string | null }>> {
  const rows = await db
    .select({
      poiId: contactInfo.poiId,
      openingHoursDisplay: contactInfo.openingHoursDisplay,
    })
    .from(contactInfo);

  return new Map(rows.map((r) => [r.poiId, r]));
}

/**
 * Syncs all POIs from PostgreSQL to Typesense search index.
 * Recreates the collection, loads related data (tags, cuisines,
 * accessibility, contact), builds documents, and upserts in batches.
 */
async function syncTypesense() {
  log.info("Starting sync...");

  await initCollection(true);
  log.info("Collection initialized (force recreated)");

  const allPois = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      osmTags: pois.osmTags,
      profile: pois.profile,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id));

  log.info(`Found ${allPois.length} POIs in database`);

  const remarkRows = await db
    .select({ poiId: remarks.poiId })
    .from(remarks);

  const remarkPoiIds = new Set(
    remarkRows
      .map((r) => r.poiId)
      .filter((id): id is string => id !== null)
  );

  log.info(`${remarkPoiIds.size} POIs have stories`);

  log.info("Loading tags, cuisines, accessibility, contact...");

  const [tagMap, cuisineMap, accessibilityMap, contactMap] = await Promise.all([
    loadTagMap(),
    loadCuisineMap(),
    loadAccessibilityMap(),
    loadContactMap(),
  ]);

  log.info(
    `${tagMap.size} POIs have tags, ${cuisineMap.size} have cuisines, ` +
    `${accessibilityMap.size} have accessibility, ${contactMap.size} have contact`
  );

  const documents = allPois.map((poi) => {
    const category = poi.categorySlug ?? "hidden";
    const profile = (poi.profile as PoiProfile) ?? null;
    const accessibility = accessibilityMap.get(poi.id);
    const contact = contactMap.get(poi.id);

    return buildTypesenseDocument({
      id: poi.id,
      osmId: poi.osmId,
      name: poi.name,
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.address,
      osmTags: poi.osmTags,
      categorySlug: category,
      profile,
      tags: tagMap.get(poi.id) ?? [],
      hasStory: remarkPoiIds.has(poi.id),
      cuisines: cuisineMap.get(poi.id) ?? [],
      wheelchair: accessibility?.wheelchair ?? null,
      dogFriendly: accessibility?.dogFriendly ?? null,
      elevator: accessibility?.elevator ?? null,
      parkingAvailable: accessibility?.parkingAvailable ?? null,
      freeEntry: null,
      openingHours: contact?.openingHoursDisplay ?? null,
    });
  });

  let synced = 0;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await upsertDocuments(batch);
    synced += batch.length;
    log.info(`Synced ${synced}/${documents.length}`);
  }

  log.success(`Done! Synced ${synced} documents to Typesense`);
  process.exit(0);
}

syncTypesense().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
