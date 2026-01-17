import { db } from "../client";
import { remarks, pois, categories } from "../schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Fetches remarks for the given POI IDs.
 *
 * Args:
 *     poiIds: Array of POI UUIDs.
 *
 * Returns:
 *     Array of remarks with their POIs and categories.
 */
export async function getRemarksByPoiIds(poiIds: string[]) {
  if (poiIds.length === 0) return [];

  return db
    .select({
      id: remarks.id,
      poiId: remarks.poiId,
      title: remarks.title,
      teaser: remarks.teaser,
      content: remarks.content,
      localTip: remarks.localTip,
      durationSeconds: remarks.durationSeconds,
      audioUrl: remarks.audioUrl,
      createdAt: remarks.createdAt,
      poi: {
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
      },
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(inArray(remarks.poiId, poiIds));
}

/**
 * Fetches a single remark by ID.
 *
 * Args:
 *     remarkId: The remark's UUID.
 *
 * Returns:
 *     The remark with its POI and category, or undefined.
 */
export async function getRemarkById(remarkId: string) {
  const results = await db
    .select({
      id: remarks.id,
      poiId: remarks.poiId,
      title: remarks.title,
      teaser: remarks.teaser,
      content: remarks.content,
      localTip: remarks.localTip,
      durationSeconds: remarks.durationSeconds,
      audioUrl: remarks.audioUrl,
      createdAt: remarks.createdAt,
      poi: {
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
      },
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(eq(remarks.id, remarkId))
    .limit(1);

  return results[0];
}
