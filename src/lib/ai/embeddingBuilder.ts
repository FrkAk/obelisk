import type { Poi, Tag, Cuisine, PoiProfile } from "@/types";

/**
 * Builds a semantically rich embedding text string from POI data and its JSONB profile.
 * Format: "name | subtype | keywords | products | summary | tags | cuisines | address"
 *
 * Args:
 *     poi: The POI record.
 *     profile: The JSONB profile data from pois.profile column.
 *     tags: Array of tags associated with the POI.
 *     cuisines: Array of cuisines associated with the POI.
 *     accessibility: Optional accessibility flags.
 *
 * Returns:
 *     A pipe-delimited text string optimized for embedding generation.
 */
export function buildEmbeddingText(
  poi: Poi,
  profile: PoiProfile | null,
  tags: Tag[],
  cuisines?: Cuisine[],
  accessibility?: {
    wheelchair?: boolean | null;
    dogFriendly?: boolean | null;
    elevator?: boolean | null;
    parkingAvailable?: boolean | null;
  } | null,
): string {
  const parts: Array<string | null | undefined | false> = [];

  parts.push(poi.name);

  if (profile) {
    parts.push(profile.subtype);
    if (profile.keywords.length > 0) parts.push(profile.keywords.join(", "));
    if (profile.products.length > 0) parts.push(profile.products.join(", "));
    if (profile.summary) parts.push(profile.summary);

    const attrs = profile.attributes;
    if (attrs.brand && typeof attrs.brand === "string") parts.push(`Brand: ${attrs.brand}`);
  }

  const tagNames = tags.map((t) => t.name).join(", ");
  if (tagNames) parts.push(tagNames);

  const cuisineNames = cuisines?.map((c) => c.name).join(", ");
  if (cuisineNames) parts.push(cuisineNames);

  if (accessibility) {
    if (accessibility.wheelchair) parts.push("Wheelchair accessible");
    if (accessibility.elevator) parts.push("Elevator access");
    if (accessibility.dogFriendly) parts.push("Dog-friendly");
    if (accessibility.parkingAvailable) parts.push("Parking available");
  }

  parts.push(poi.address);

  const osmTags = poi.osmTags as Record<string, string> | null;
  if (osmTags?.cuisine) parts.push(osmTags.cuisine);

  return parts.filter(Boolean).join(" | ");
}
