import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { CategorySlug, Remark, Poi, Category } from "@/types";

interface SearchRemarksParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  category?: CategorySlug;
  keywords?: string[];
  limit?: number;
}

type RemarkWithPoi = Remark & {
  poi: Poi & { category?: Category };
};

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
    .select({
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
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(...conditions))
    .limit(limit);

  const mappedResults = results.map((row): RemarkWithPoi => ({
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
  }));

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
