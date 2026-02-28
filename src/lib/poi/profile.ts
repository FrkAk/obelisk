/**
 * Builds a PoiProfile from OSM tags for the given category.
 *
 * @module poi/profile
 */

import type { CategorySlug, PoiProfile } from "@/types/api";

/**
 * Extracts a year number from a date string.
 *
 * @param dateStr - Date string, potentially with leading negative sign.
 * @returns Parsed year as integer, or null if unparseable.
 */
function parseYear(dateStr: string): number | null {
  const match = dateStr.match(/^(-?\d{1,4})/);
  if (match) return parseInt(match[1]);
  return null;
}

/**
 * Maps an OSM heritage tag value to a standardized level string.
 *
 * @param heritage - Raw heritage tag value.
 * @returns Heritage level: "unesco", "national", "regional", or "local".
 */
function parseHeritageLevel(heritage: string): string {
  if (heritage.includes("1") || heritage.toLowerCase().includes("world")) return "unesco";
  if (heritage.includes("2") || heritage.toLowerCase().includes("national")) return "national";
  if (heritage.includes("3") || heritage.toLowerCase().includes("regional")) return "regional";
  return "local";
}

/**
 * Maps a SAC hiking scale value to a simplified difficulty string.
 *
 * @param sacScale - SAC scale value (e.g. "hiking", "T1", "mountain_hiking").
 * @returns Difficulty level: "easy", "moderate", or "difficult".
 */
function mapTrailDifficulty(sacScale: string): string {
  if (sacScale === "hiking" || sacScale === "T1") return "easy";
  if (sacScale === "mountain_hiking" || sacScale === "T2") return "moderate";
  return "difficult";
}

/**
 * Builds a PoiProfile from OSM tags for the given category.
 *
 * @param osmTags - Raw OSM tags from the PBF element.
 * @param categorySlug - Determined category for this POI.
 * @returns A PoiProfile with seed-time data (keywords/products/summary filled by enrich-taxonomy).
 */
export function buildProfile(osmTags: Record<string, string>, categorySlug: CategorySlug): PoiProfile {
  const osmExtracted: Record<string, string> = {};
  const attributes: Record<string, unknown> = {};

  const subtypeExtractors: Record<string, () => string | undefined> = {
    food: () => osmTags.amenity ?? osmTags.shop,
    nightlife: () => osmTags.amenity,
    shopping: () => osmTags.shop,
    history: () => osmTags.historic,
    architecture: () => {
      const buildingSubtypes: Record<string, string> = {
        church: "church", cathedral: "cathedral", chapel: "chapel",
        mosque: "mosque", synagogue: "synagogue", temple: "temple",
      };
      return buildingSubtypes[osmTags.building] ?? (osmTags.amenity === "place_of_worship" ? "church" : undefined);
    },
    nature: () => osmTags.leisure ?? osmTags.natural,
    art: () => osmTags.tourism ?? osmTags.amenity,
    culture: () => osmTags.tourism ?? osmTags.amenity,
    views: () => osmTags["tower:type"] === "observation" ? "tower" : "viewpoint",
    sports: () => osmTags.leisure ?? osmTags.sport,
    health: () => osmTags.amenity ?? osmTags.healthcare,
    transport: () => osmTags.railway ?? osmTags.amenity,
    education: () => osmTags.amenity,
    services: () => osmTags.amenity ?? osmTags.tourism,
    hidden: () => osmTags.amenity ?? osmTags.tourism,
  };

  const subtype = subtypeExtractors[categorySlug]?.() ?? undefined;

  const osmSubtagKeys = [
    "clothes", "shoes", "beauty", "books", "cuisine", "sport",
    "brand", "brand:wikidata", "operator:wikidata", "description",
  ];
  for (const key of osmSubtagKeys) {
    if (osmTags[key]) {
      osmExtracted[key.replace(":", "")] = osmTags[key];
    }
  }

  switch (categorySlug) {
    case "food": {
      if (osmTags.outdoor_seating) attributes.outdoorSeating = osmTags.outdoor_seating === "yes";
      if (osmTags.takeaway) attributes.takeaway = osmTags.takeaway === "yes";
      if (osmTags.delivery) attributes.delivery = osmTags.delivery === "yes";
      if (osmTags["diet:vegetarian"]) attributes.vegetarian = osmTags["diet:vegetarian"];
      if (osmTags["diet:vegan"]) attributes.vegan = osmTags["diet:vegan"];
      break;
    }
    case "history": {
      if (osmTags.start_date) attributes.yearBuilt = parseYear(osmTags.start_date);
      if (osmTags.heritage) attributes.heritageLevel = parseHeritageLevel(osmTags.heritage);
      if (osmTags.ruins === "yes") attributes.preservationStatus = "ruins";
      break;
    }
    case "architecture": {
      const style = osmTags.architecture ?? osmTags["building:architecture"];
      if (style) attributes.primaryStyle = style;
      if (osmTags.architect) attributes.architect = osmTags.architect;
      if (osmTags.start_date) attributes.yearBuilt = parseYear(osmTags.start_date);
      if (osmTags.denomination) attributes.denomination = osmTags.denomination;
      break;
    }
    case "nature": {
      if (osmTags["sac_scale"]) attributes.trailDifficulty = mapTrailDifficulty(osmTags["sac_scale"]);
      if (osmTags.lit) attributes.litAtNight = osmTags.lit === "yes";
      break;
    }
    case "views": {
      if (osmTags.ele) attributes.elevationM = osmTags.ele;
      if (osmTags.direction) attributes.viewDirection = osmTags.direction;
      break;
    }
    default:
      break;
  }

  return {
    subtype,
    osmExtracted: Object.keys(osmExtracted).length > 0 ? osmExtracted : undefined,
    keywords: [],
    products: [],
    summary: "",
    enrichmentSource: "seed",
    attributes,
  };
}
