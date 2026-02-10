import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import type { CategorySlug, Remark, Poi, Category } from "@/types";

export type RemarkWithPoi = Remark & {
  poi: Poi & { category?: Category };
};

function remarkPoiSelect() {
  return {
    remarkId: remarks.id,
    remarkPoiId: remarks.poiId,
    remarkTitle: remarks.title,
    remarkTeaser: remarks.teaser,
    remarkContent: remarks.content,
    remarkLocalTip: remarks.localTip,
    remarkDurationSeconds: remarks.durationSeconds,
    remarkAudioUrl: remarks.audioUrl,
    remarkCreatedAt: remarks.createdAt,
    poiId: pois.id,
    poiOsmId: pois.osmId,
    poiName: pois.name,
    poiCategoryId: pois.categoryId,
    poiLatitude: pois.latitude,
    poiLongitude: pois.longitude,
    poiAddress: pois.address,
    poiWikipediaUrl: pois.wikipediaUrl,
    poiImageUrl: pois.imageUrl,
    poiOsmTags: pois.osmTags,
    poiCreatedAt: pois.createdAt,
    categoryId: categories.id,
    categoryName: categories.name,
    categorySlug: categories.slug,
    categoryIcon: categories.icon,
    categoryColor: categories.color,
  };
}

interface RemarkPoiRow {
  remarkId: string;
  remarkPoiId: string | null;
  remarkTitle: string;
  remarkTeaser: string | null;
  remarkContent: string;
  remarkLocalTip: string | null;
  remarkDurationSeconds: number | null;
  remarkAudioUrl: string | null;
  remarkCreatedAt: Date | null;
  poiId: string;
  poiOsmId: number | null;
  poiName: string;
  poiCategoryId: string | null;
  poiLatitude: number;
  poiLongitude: number;
  poiAddress: string | null;
  poiWikipediaUrl: string | null;
  poiImageUrl: string | null;
  poiOsmTags: Record<string, string> | null;
  poiCreatedAt: Date | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

function mapRowToRemarkWithPoi(row: RemarkPoiRow): RemarkWithPoi {
  return {
    id: row.remarkId,
    poiId: row.remarkPoiId!,
    title: row.remarkTitle,
    teaser: row.remarkTeaser,
    content: row.remarkContent,
    localTip: row.remarkLocalTip,
    durationSeconds: row.remarkDurationSeconds ?? 45,
    audioUrl: row.remarkAudioUrl,
    createdAt: row.remarkCreatedAt ?? new Date(),
    poi: {
      id: row.poiId,
      osmId: row.poiOsmId,
      name: row.poiName,
      categoryId: row.poiCategoryId!,
      latitude: row.poiLatitude,
      longitude: row.poiLongitude,
      address: row.poiAddress,
      wikipediaUrl: row.poiWikipediaUrl,
      imageUrl: row.poiImageUrl,
      osmTags: row.poiOsmTags,
      createdAt: row.poiCreatedAt ?? new Date(),
      category: row.categoryId
        ? {
            id: row.categoryId,
            name: row.categoryName!,
            slug: row.categorySlug! as CategorySlug,
            icon: row.categoryIcon!,
            color: row.categoryColor!,
          }
        : undefined,
    },
  };
}

/**
 * Searches remarks and POI names for text matches within a geo bounding box.
 *
 * Args:
 *     query: The text to search for.
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Search radius in meters.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of remarks with their associated POIs matching the query.
 */
export async function searchRemarksByText(
  query: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
  limit: number = 20
): Promise<RemarkWithPoi[]> {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  const pattern = `%${query}%`;

  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        gte(pois.latitude, minLat),
        lte(pois.latitude, maxLat),
        gte(pois.longitude, minLon),
        lte(pois.longitude, maxLon),
        or(
          ilike(remarks.title, pattern),
          ilike(remarks.content, pattern),
          ilike(pois.name, pattern)
        )
      )
    )
    .limit(limit);

  return results.map(mapRowToRemarkWithPoi);
}

/**
 * Gets a random remark within a geo bounding box, optionally filtered by category.
 *
 * Args:
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Search radius in meters.
 *     category: Optional category slug to filter by.
 *
 * Returns:
 *     A random remark with its POI, or undefined if none found.
 */
export async function getRandomRemark(
  latitude: number,
  longitude: number,
  radiusMeters: number = 2000,
  category?: CategorySlug
): Promise<RemarkWithPoi | undefined> {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const conditions = [
    gte(pois.latitude, latitude - latDelta),
    lte(pois.latitude, latitude + latDelta),
    gte(pois.longitude, longitude - lonDelta),
    lte(pois.longitude, longitude + lonDelta),
  ];

  if (category) {
    conditions.push(eq(categories.slug, category));
  }

  const results = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (results.length === 0) return undefined;

  return mapRowToRemarkWithPoi(results[0]);
}
