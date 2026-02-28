/**
 * Shared POI query fields and row-to-Poi mapper used by generate-stories
 * and generate-embeddings scripts.
 *
 * @module poi-row
 */

import { pois, categories } from "../../src/lib/db/schema";
import type { Poi, PoiProfile } from "../../src/types";

/**
 * Drizzle select fields for POI queries that need a full Poi object.
 * Join with categories via `leftJoin(categories, eq(pois.categoryId, categories.id))`.
 */
export const POI_SELECT_FIELDS = {
  id: pois.id,
  osmId: pois.osmId,
  name: pois.name,
  categoryId: pois.categoryId,
  regionId: pois.regionId,
  latitude: pois.latitude,
  longitude: pois.longitude,
  address: pois.address,
  locale: pois.locale,
  osmType: pois.osmType,
  osmTags: pois.osmTags,
  profile: pois.profile,
  wikipediaUrl: pois.wikipediaUrl,
  imageUrl: pois.imageUrl,
  embedding: pois.embedding,
  createdAt: pois.createdAt,
  updatedAt: pois.updatedAt,
  categorySlug: categories.slug,
} as const;

/** Row shape returned by a select using POI_SELECT_FIELDS. */
export type PoiRow = {
  [K in keyof typeof POI_SELECT_FIELDS]: K extends "categorySlug"
    ? string | null
    : K extends "profile"
      ? PoiProfile | null
      : K extends "osmTags"
        ? Record<string, string> | null
        : K extends "embedding"
          ? number[] | null
          : K extends "osmId"
            ? number | null
            : K extends "latitude" | "longitude"
              ? number
              : K extends "createdAt" | "updatedAt"
                ? Date | null
                : string | null;
};

/**
 * Maps a raw query row (from POI_SELECT_FIELDS) to a typed Poi object.
 *
 * @param row - A row returned from a query using POI_SELECT_FIELDS.
 * @returns Typed Poi object.
 */
export function toPoi(row: PoiRow): Poi {
  return {
    id: row.id as string,
    osmId: row.osmId,
    name: row.name as string,
    categoryId: row.categoryId,
    regionId: row.regionId,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    locale: row.locale as string,
    osmType: row.osmType,
    osmTags: row.osmTags,
    profile: row.profile as PoiProfile | null,
    wikipediaUrl: row.wikipediaUrl,
    imageUrl: row.imageUrl,
    embedding: row.embedding,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
