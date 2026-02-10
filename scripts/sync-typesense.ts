import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  remarks,
  foodProfiles,
  poiTranslations,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { initCollection, upsertDocuments } from "../src/lib/search/typesense";
import type { TypesensePoiDocument } from "../src/lib/search/typesense";

const BATCH_SIZE = 100;

async function syncTypesense() {
  console.log("[sync-typesense] Starting sync...");

  await initCollection();
  console.log("[sync-typesense] Collection initialized");

  const allPois = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      osmTags: pois.osmTags,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id));

  console.log(`[sync-typesense] Found ${allPois.length} POIs in database`);

  const remarkRows = await db
    .select({ poiId: remarks.poiId })
    .from(remarks);

  const remarkPoiIds = new Set(
    remarkRows
      .map((r) => r.poiId)
      .filter((id): id is string => id !== null)
  );

  console.log(`[sync-typesense] ${remarkPoiIds.size} POIs have stories`);

  const translationRows = await db
    .select({
      poiId: poiTranslations.poiId,
      description: poiTranslations.description,
      reviewSummary: poiTranslations.reviewSummary,
    })
    .from(poiTranslations);

  const translationMap = new Map(
    translationRows.map((t) => [t.poiId, t])
  );

  const foodProfileRows = await db
    .select({
      poiId: foodProfiles.poiId,
      priceLevel: foodProfiles.priceLevel,
      hasOutdoorSeating: foodProfiles.hasOutdoorSeating,
      hasWifi: foodProfiles.hasWifi,
    })
    .from(foodProfiles);

  const foodProfileMap = new Map(
    foodProfileRows.map((fp) => [fp.poiId, fp])
  );

  const documents: TypesensePoiDocument[] = allPois.map((poi) => {
    const translation = translationMap.get(poi.id);
    const fp = foodProfileMap.get(poi.id);
    const osmTags = poi.osmTags;

    const priceLevelMap: Record<number, string> = {
      1: "$",
      2: "$$",
      3: "$$$",
      4: "$$$$",
    };

    return {
      id: poi.id,
      poiId: poi.id,
      osmId: poi.osmId ?? undefined,
      name: poi.name,
      description: translation?.description ?? "",
      reviewSummary: translation?.reviewSummary ?? "",
      category: poi.categorySlug ?? "hidden",
      amenityType: osmTags?.amenity ?? osmTags?.tourism ?? "",
      cuisine: osmTags?.cuisine ?? "",
      priceRange: fp?.priceLevel ? priceLevelMap[fp.priceLevel] ?? "" : "",
      atmosphere: [],
      location: [poi.latitude, poi.longitude],
      hasStory: remarkPoiIds.has(poi.id),
      hasOutdoorSeating:
        fp?.hasOutdoorSeating ?? osmTags?.outdoor_seating === "yes",
      hasWifi:
        fp?.hasWifi ??
        (osmTags?.internet_access === "wlan" ||
        osmTags?.internet_access === "yes"),
      address: poi.address ?? "",
    };
  });

  let synced = 0;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await upsertDocuments(batch);
    synced += batch.length;
    console.log(`[sync-typesense] Synced ${synced}/${documents.length}`);
  }

  console.log(`[sync-typesense] Done! Synced ${synced} documents to Typesense`);
  process.exit(0);
}

syncTypesense().catch((error) => {
  console.error("[sync-typesense] Fatal error:", error);
  process.exit(1);
});
