import { db } from "../client";
import { pois, categories } from "../schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Fetches POIs within a bounding box around a center point.
 *
 * Args:
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Radius in meters to search within.
 *
 * Returns:
 *     Array of POIs with their categories.
 */
export async function getNearbyPois(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
) {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  return db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        gte(pois.latitude, minLat),
        lte(pois.latitude, maxLat),
        gte(pois.longitude, minLon),
        lte(pois.longitude, maxLon)
      )
    );
}

/**
 * Fetches a single POI by ID.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The POI with its category, or undefined.
 */
export async function getPoiById(poiId: string) {
  const results = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      imageUrl: pois.imageUrl,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(pois.id, poiId))
    .limit(1);

  return results[0];
}

/**
 * Fetches all categories.
 *
 * Returns:
 *     Array of all categories.
 */
export async function getAllCategories() {
  return db.select().from(categories);
}
