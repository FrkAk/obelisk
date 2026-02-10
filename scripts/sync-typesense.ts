import { db } from "../src/lib/db/client";
import { pois, categories, remarks } from "../src/lib/db/schema";
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
      description: pois.description,
      reviewSummary: pois.reviewSummary,
      osmAmenity: pois.osmAmenity,
      osmCuisine: pois.osmCuisine,
      attributes: pois.attributes,
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

  const documents: TypesensePoiDocument[] = allPois.map((poi) => {
    const attrs = poi.attributes as Record<string, unknown> | null;

    return {
      id: poi.id,
      poiId: poi.id,
      osmId: poi.osmId ?? undefined,
      name: poi.name,
      description: poi.description ?? "",
      reviewSummary: poi.reviewSummary ?? "",
      category: poi.categorySlug ?? "hidden",
      amenityType: poi.osmAmenity ?? "",
      cuisine: poi.osmCuisine ?? "",
      priceRange: (attrs?.priceRange as string) ?? "",
      atmosphere: (attrs?.atmosphere as string[]) ?? [],
      location: [poi.latitude, poi.longitude],
      hasStory: remarkPoiIds.has(poi.id),
      hasOutdoorSeating: poi.osmTags?.outdoor_seating === "yes",
      hasWifi: poi.osmTags?.internet_access === "wlan" || poi.osmTags?.internet_access === "yes",
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
