/**
 * Shared bulk-loading functions for pre-fetching POI relation data as Maps.
 * Eliminates N+1 query patterns by loading all rows in a single query.
 *
 * @module bulk-loaders
 */

import { db } from "../../src/lib/db/client";
import {
  poiTags,
  tags,
  poiCuisines,
  cuisines,
  accessibilityInfo,
  contactInfo,
} from "../../src/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ContactInfo as ContactInfoType } from "../../src/types/api";

/**
 * Loads all POI tags as a map from poiId to tag name array.
 *
 * @returns Map of poiId to string array of tag names.
 */
export async function loadTagMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiTags.poiId,
      tagName: tags.name,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.tagName);
    } else {
      map.set(row.poiId, [row.tagName]);
    }
  }
  return map;
}

/**
 * Loads all POI cuisines as a map from poiId to cuisine name array.
 *
 * @returns Map of poiId to string array of cuisine names.
 */
export async function loadCuisineMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiCuisines.poiId,
      cuisineName: cuisines.name,
    })
    .from(poiCuisines)
    .innerJoin(cuisines, eq(poiCuisines.cuisineId, cuisines.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.cuisineName);
    } else {
      map.set(row.poiId, [row.cuisineName]);
    }
  }
  return map;
}

/**
 * Loads accessibility data for all POIs as a map from poiId to accessibility fields.
 *
 * @returns Map of poiId to accessibility fields object.
 */
export async function loadAccessibilityMap(): Promise<
  Map<string, { wheelchair: boolean | null; dogFriendly: boolean | null; elevator: boolean | null; parkingAvailable: boolean | null }>
> {
  const rows = await db
    .select({
      poiId: accessibilityInfo.poiId,
      wheelchair: accessibilityInfo.wheelchair,
      dogFriendly: accessibilityInfo.dogFriendly,
      elevator: accessibilityInfo.elevator,
      parkingAvailable: accessibilityInfo.parkingAvailable,
    })
    .from(accessibilityInfo);

  return new Map(rows.map((r) => [r.poiId, r]));
}

/**
 * Loads contact info for all POIs as a map from poiId to contact record.
 *
 * @returns Map of poiId to ContactInfo.
 */
export async function loadContactMap(): Promise<Map<string, ContactInfoType>> {
  const rows = await db.select().from(contactInfo);
  return new Map(rows.map((r) => [r.poiId, r]));
}
