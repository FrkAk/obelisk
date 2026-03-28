import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  remarks,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { initCollection, upsertDocuments } from "../src/lib/search/typesense";
import { buildTypesenseDocument } from "../src/lib/search/profileSummary";
import { createLogger, formatEta } from "../src/lib/logger";
import { loadTagMap, loadCuisineMap, loadAccessibilityMap } from "./lib/bulk-loaders";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("sync-typesense");

const BATCH_SIZE = 100;

/**
 * Syncs all POIs from PostgreSQL to Typesense search index.
 * Recreates the collection, loads related data (tags, cuisines,
 * accessibility), builds documents, and upserts in batches.
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

  log.info(`${remarkPoiIds.size} POIs have remarks`);

  log.info("Loading tags, cuisines, accessibility...");

  const [tagMap, cuisineMap, accessibilityMap] = await Promise.all([
    loadTagMap(),
    loadCuisineMap(),
    loadAccessibilityMap(),
  ]);

  log.info(
    `${tagMap.size} POIs have tags, ${cuisineMap.size} have cuisines, ` +
    `${accessibilityMap.size} have accessibility`
  );

  const documents = allPois.map((poi) => {
    const category = poi.categorySlug ?? "hidden";
    const profile = (poi.profile as PoiProfile) ?? null;
    const accessibility = accessibilityMap.get(poi.id);

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
      hasRemark: remarkPoiIds.has(poi.id),
      cuisines: cuisineMap.get(poi.id) ?? [],
      wheelchair: accessibility?.wheelchair ?? null,
      dogFriendly: accessibility?.dogFriendly ?? null,
      elevator: accessibility?.elevator ?? null,
      parkingAvailable: accessibility?.parkingAvailable ?? null,
      freeEntry: null,
      openingHours: null,
    });
  });

  let synced = 0;
  const startMs = Date.now();
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await upsertDocuments(batch);
    synced += batch.length;
    log.info(formatEta(startMs, synced, documents.length));
  }

  log.success(`Done! Synced ${synced} documents to Typesense`);
  process.exit(0);
}

syncTypesense().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
