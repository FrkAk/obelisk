import type { TypesensePoiDocument } from "./typesense";
import type { PoiProfile } from "@/types/api";

const SEARCHABLE_OSM_KEYS = new Set([
  "cuisine", "shop", "amenity", "tourism", "historic", "leisure",
  "natural", "sport", "brand", "healthcare", "railway",
]);

const SKIP_OSM_VALUE_PREFIXES = ["addr:", "name:", "source", "note", "wikidata"];

/**
 * Extracts searchable values from OSM tags for Typesense indexing.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Array of searchable values, or undefined if none found.
 */
export function extractSearchableOsmValues(osmTags: Record<string, string> | null): string[] | undefined {
  if (!osmTags) return undefined;

  const values: string[] = [];

  for (const [key, value] of Object.entries(osmTags)) {
    if (SKIP_OSM_VALUE_PREFIXES.some((p) => key.startsWith(p))) continue;

    if (SEARCHABLE_OSM_KEYS.has(key) || key.startsWith("diet:")) {
      for (const part of value.split(/[;,]/)) {
        const trimmed = part.trim();
        if (trimmed && trimmed !== "yes" && trimmed !== "no") {
          values.push(trimmed);
        }
      }
    }
  }

  return values.length > 0 ? values : undefined;
}

/**
 * Builds a text summary from a PoiProfile JSONB for Typesense indexing.
 *
 * Args:
 *     profile: The POI's JSONB profile data.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if profile has no useful data.
 */
export function buildProfileSummary(profile: PoiProfile | null): string | undefined {
  if (!profile) return undefined;

  const parts: string[] = [];

  if (profile.subtype) parts.push(profile.subtype);
  if (profile.summary) parts.push(profile.summary);
  if (profile.keywords.length > 0) parts.push(profile.keywords.join(", "));
  if (profile.products.length > 0) parts.push(profile.products.join(", "));

  const attrs = profile.attributes;
  if (attrs.brand && typeof attrs.brand === "string") parts.push(attrs.brand);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

export interface TypesenseDocInput {
  id: string;
  osmId: number | null;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  osmTags: Record<string, string> | null;
  categorySlug: string;
  profile: PoiProfile | null;
  tags: string[];
  hasRemark: boolean;
  cuisines: string[];
  wheelchair: boolean | null;
  dogFriendly: boolean | null;
  elevator: boolean | null;
  parkingAvailable: boolean | null;
  freeEntry: boolean | null;
  openingHours: string | null;
}

/**
 * Constructs a Typesense document from pre-loaded POI data.
 *
 * Args:
 *     input: Pre-loaded data for a single POI.
 *
 * Returns:
 *     A fully constructed TypesensePoiDocument ready for upsert.
 */
export function buildTypesenseDocument(input: TypesenseDocInput): TypesensePoiDocument {
  const osmTags = input.osmTags;
  const profile = input.profile;

  return {
    id: input.id,
    poiId: input.id,
    osmId: input.osmId ?? undefined,
    name: input.name,
    category: input.categorySlug,
    amenityType: osmTags?.amenity ?? osmTags?.tourism ?? "",
    cuisines: input.cuisines.length > 0
      ? input.cuisines
      : osmTags?.cuisine
        ? osmTags.cuisine.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
    wheelchair: input.wheelchair ?? undefined,
    dogFriendly: input.dogFriendly ?? undefined,
    elevator: input.elevator ?? undefined,
    parkingAvailable: input.parkingAvailable ?? undefined,
    freeEntry: input.freeEntry ?? undefined,
    openingHours: input.openingHours ?? undefined,
    location: [input.latitude, input.longitude],
    hasRemark: input.hasRemark,
    hasOutdoorSeating: osmTags?.outdoor_seating === "yes",
    hasWifi: osmTags?.internet_access === "wlan" || osmTags?.internet_access === "yes",
    address: input.address ?? "",
    profileSummary: buildProfileSummary(profile),
    products: profile?.products.length ? profile.products : undefined,
    keywords: profile?.keywords.length ? profile.keywords : undefined,
    tags: input.tags.length > 0 ? input.tags : undefined,
    description: profile?.summary || undefined,
    osmTagValues: extractSearchableOsmValues(input.osmTags),
  };
}
