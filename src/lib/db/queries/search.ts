import { db } from "../client";
import { remarks, pois, categories, foodProfiles, natureProfiles } from "../schema";
import { eq, and, gte, lte, sql, or } from "drizzle-orm";
import type { CategorySlug } from "@/types";

export interface RemarkWithPoi {
  id: string;
  poiId: string;
  title: string;
  teaser: string | null;
  content: string;
  localTip: string | null;
  durationSeconds: number;
  audioUrl: string | null;
  createdAt: Date;
  poi: {
    id: string;
    osmId: number | null;
    name: string;
    categoryId: string;
    latitude: number;
    longitude: number;
    address: string | null;
    wikipediaUrl: string | null;
    imageUrl: string | null;
    osmTags: Record<string, string> | null;
    createdAt: Date;
    category?: {
      id: string;
      name: string;
      slug: CategorySlug;
      icon: string;
      color: string;
    };
  };
}

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
 * Searches remarks and POI names using tsvector full-text search within a geo bounding box.
 * Falls back to ILIKE if search_vector columns are not populated.
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
  const lonDelta =
    radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  const tsQuery = sql`plainto_tsquery('simple', ${query})`;

  const results = await db
    .select({
      ...remarkPoiSelect(),
      rank: sql<number>`COALESCE(ts_rank(${remarks.searchVector}, ${tsQuery}), 0) + COALESCE(ts_rank(${pois.searchVector}, ${tsQuery}), 0)`.as("rank"),
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        eq(remarks.isCurrent, true),
        gte(pois.latitude, minLat),
        lte(pois.latitude, maxLat),
        gte(pois.longitude, minLon),
        lte(pois.longitude, maxLon),
        or(
          sql`${remarks.searchVector} @@ ${tsQuery}`,
          sql`${pois.searchVector} @@ ${tsQuery}`,
          sql`${pois.name} ILIKE ${"%" + query + "%"}`
        )
      )
    )
    .orderBy(sql`rank DESC`)
    .limit(limit);

  return results.map(mapRowToRemarkWithPoi);
}

/**
 * Searches with profile-aware filters using tsvector full-text search.
 *
 * Args:
 *     query: The text to search for.
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Search radius in meters.
 *     filters: Optional profile-specific filters.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of remarks matching the query and filters.
 */
export async function searchWithFilters(
  query: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
  filters: {
    priceLevel?: number;
    cuisine?: string;
    outdoor?: boolean;
    trailDifficulty?: string;
    category?: CategorySlug;
  } = {},
  limit: number = 20
): Promise<RemarkWithPoi[]> {
  const baseResults = await searchRemarksByText(
    query,
    latitude,
    longitude,
    radiusMeters,
    limit * 3
  );

  let filtered = baseResults;

  if (filters.category) {
    filtered = filtered.filter(
      (r) => r.poi.category?.slug === filters.category
    );
  }

  if (
    filters.priceLevel !== undefined ||
    filters.outdoor !== undefined ||
    filters.cuisine !== undefined
  ) {
    const poiIds = filtered.map((r) => r.poi.id);
    if (poiIds.length > 0) {
      const profiles = await db
        .select({
          poiId: foodProfiles.poiId,
          priceLevel: foodProfiles.priceLevel,
          hasOutdoorSeating: foodProfiles.hasOutdoorSeating,
        })
        .from(foodProfiles)
        .where(sql`${foodProfiles.poiId} = ANY(${poiIds})`);

      const profileMap = new Map(profiles.map((p) => [p.poiId, p]));

      filtered = filtered.filter((r) => {
        const fp = profileMap.get(r.poi.id);
        if (!fp) {
          return (
            filters.priceLevel === undefined && filters.outdoor === undefined
          );
        }
        if (
          filters.priceLevel !== undefined &&
          fp.priceLevel !== filters.priceLevel
        )
          return false;
        if (
          filters.outdoor !== undefined &&
          fp.hasOutdoorSeating !== filters.outdoor
        )
          return false;
        return true;
      });
    }
  }

  if (filters.trailDifficulty !== undefined) {
    const poiIds = filtered.map((r) => r.poi.id);
    if (poiIds.length > 0) {
      const profiles = await db
        .select({
          poiId: natureProfiles.poiId,
          trailDifficulty: natureProfiles.trailDifficulty,
        })
        .from(natureProfiles)
        .where(sql`${natureProfiles.poiId} = ANY(${poiIds})`);

      const profileMap = new Map(profiles.map((p) => [p.poiId, p]));

      filtered = filtered.filter((r) => {
        const np = profileMap.get(r.poi.id);
        if (!np) return false;
        return np.trailDifficulty === filters.trailDifficulty;
      });
    }
  }

  return filtered.slice(0, limit);
}

/**
 * Gets a random remark within a geo bounding box, optionally filtered by category.
 * Only returns current (is_current = true) remarks.
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
  const lonDelta =
    radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const conditions = [
    eq(remarks.isCurrent, true),
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
