import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";
import type { CategorySlug, Remark, Poi, Category } from "@/types";

interface SearchRemarksParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  category?: CategorySlug;
  keywords?: string[];
  limit?: number;
}

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
 * Searches remarks by location, category, and keywords.
 *
 * Args:
 *     params: Search parameters including location, category filter, and keywords.
 *
 * Returns:
 *     Array of remarks matching the search criteria with their POIs.
 */
export async function searchRemarks({
  latitude,
  longitude,
  radiusMeters = 1000,
  category,
  keywords = [],
  limit = 50,
}: SearchRemarksParams): Promise<RemarkWithPoi[]> {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  const conditions = [
    gte(pois.latitude, minLat),
    lte(pois.latitude, maxLat),
    gte(pois.longitude, minLon),
    lte(pois.longitude, maxLon),
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
    .limit(limit);

  const mappedResults = results.map(mapRowToRemarkWithPoi);

  if (keywords.length === 0) {
    return mappedResults;
  }

  return mappedResults.filter((remark) => {
    const searchableText = [
      remark.title,
      remark.teaser,
      remark.content,
      remark.poi?.name,
      remark.poi?.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return keywords.some((keyword) =>
      searchableText.includes(keyword.toLowerCase())
    );
  });
}

/**
 * Searches remarks by place name using ILIKE matching on POI and remark names.
 *
 * Args:
 *     placeName: The name to search for.
 *     category: Optional category slug to filter by.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of remarks matching the name with their POIs.
 */
export async function searchRemarksByName(
  placeName: string,
  category?: CategorySlug,
  limit: number = 20
): Promise<RemarkWithPoi[]> {
  const conditions = [
    or(
      ilike(pois.name, `%${placeName}%`),
      ilike(remarks.title, `%${placeName}%`)
    ),
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
    .limit(limit);

  console.log(`[search-db] Name search: "${placeName}", results: ${results.length}`);
  return results.map(mapRowToRemarkWithPoi);
}

/**
 * Searches POIs by name without requiring remarks.
 *
 * Args:
 *     placeName: The name to search for.
 *     category: Optional category slug to filter by.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of POIs matching the name with their categories.
 */
export async function searchPoisByName(
  placeName: string,
  category?: CategorySlug,
  limit: number = 20
): Promise<(Poi & { category?: Category })[]> {
  const conditions = [ilike(pois.name, `%${placeName}%`)];

  if (category) {
    conditions.push(eq(categories.slug, category));
  }

  const results = await db
    .select({
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
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(...conditions))
    .limit(limit);

  console.log(`[search-db] POI name search: "${placeName}", results: ${results.length}`);

  return results.map((row) => ({
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
  }));
}

/**
 * Gets a random remark from a specific category within range.
 *
 * Args:
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Search radius.
 *     category: Optional category to filter by.
 *
 * Returns:
 *     A random remark or undefined if none found.
 */
export async function getRandomRemark(
  latitude: number,
  longitude: number,
  radiusMeters: number = 2000,
  category?: CategorySlug
): Promise<RemarkWithPoi | undefined> {
  const results = await searchRemarks({
    latitude,
    longitude,
    radiusMeters,
    category,
    limit: 100,
  });

  if (results.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * results.length);
  return results[randomIndex];
}
