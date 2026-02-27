import { db } from "../client";
import {
  pois,
  categories,
  contactInfo,
  accessibilityInfo,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
} from "../schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { geoBounds } from "@/lib/geo/distance";
import type {
  Tag,
  Cuisine,
  ContactInfo as ContactInfoType,
} from "@/types";

/**
 * Fetches POIs within a bounding box around a center point, with category data.
 *
 * Args:
 *     latitude: Center latitude.
 *     longitude: Center longitude.
 *     radiusMeters: Radius in meters to search within.
 *
 * Returns:
 *     Array of POIs with their categories and contact info.
 */
export async function getNearbyPois(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
) {
  const { minLat, maxLat, minLon, maxLon } = geoBounds(latitude, longitude, radiusMeters);

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
      profile: pois.profile,
      createdAt: pois.createdAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      },
      contact: {
        phone: contactInfo.phone,
        email: contactInfo.email,
        website: contactInfo.website,
        openingHoursRaw: contactInfo.openingHoursRaw,
      },
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
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
 * Loads all tags associated with a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of tags, or empty array if none.
 */
export async function loadTags(poiId: string): Promise<Tag[]> {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      group: tags.group,
      displayOrder: tags.displayOrder,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id))
    .where(eq(poiTags.poiId, poiId));
}

/**
 * Loads all cuisines associated with a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Array of cuisines, or empty array if none.
 */
export async function loadCuisines(poiId: string): Promise<Cuisine[]> {
  return db
    .select({
      id: cuisines.id,
      slug: cuisines.slug,
      name: cuisines.name,
      region: cuisines.region,
      parentSlug: cuisines.parentSlug,
      icon: cuisines.icon,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id))
    .where(eq(poiCuisines.poiId, poiId));
}

/**
 * Loads the contact info for a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     The contact info record, or null if none exists.
 */
export async function loadContactInfo(
  poiId: string
): Promise<ContactInfoType | null> {
  const results = await db
    .select()
    .from(contactInfo)
    .where(eq(contactInfo.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Loads accessibility info for a POI.
 *
 * Args:
 *     poiId: The POI's UUID.
 *
 * Returns:
 *     Object with wheelchair, dogFriendly, elevator, parkingAvailable, or null if none exists.
 */
export async function loadAccessibilityInfo(
  poiId: string
): Promise<{
  wheelchair: boolean | null;
  dogFriendly: boolean | null;
  elevator: boolean | null;
  parkingAvailable: boolean | null;
} | null> {
  const results = await db
    .select({
      wheelchair: accessibilityInfo.wheelchair,
      dogFriendly: accessibilityInfo.dogFriendly,
      elevator: accessibilityInfo.elevator,
      parkingAvailable: accessibilityInfo.parkingAvailable,
    })
    .from(accessibilityInfo)
    .where(eq(accessibilityInfo.poiId, poiId))
    .limit(1);

  return results[0] ?? null;
}

