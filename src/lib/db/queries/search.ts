import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { geoBounds } from "@/lib/geo/distance";
import type { CategorySlug } from "@/types";
import {
  type RemarkWithPoi,
  remarkPoiSelect,
  mapRowToRemarkWithPoi,
} from "./remarks";

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
  const { minLat, maxLat, minLon, maxLon } = geoBounds(latitude, longitude, radiusMeters);

  const conditions = [
    eq(remarks.isCurrent, true),
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
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (results.length === 0) return undefined;

  return mapRowToRemarkWithPoi(results[0]);
}
