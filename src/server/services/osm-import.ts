import { db, pois } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { NewPoi } from "@/lib/db/schema";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

type CategoryFilter = "tourism" | "historic" | "amenity" | "shop" | "leisure";

const AMENITY_SUBTYPES = [
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "museum",
  "theatre",
  "cinema",
  "library",
  "place_of_worship",
  "pharmacy",
  "hospital",
  "marketplace",
];

/**
 * Build an Overpass QL query for the given bounding box and categories.
 *
 * Args:
 *     bbox: Bounding box coordinates.
 *     categories: List of OSM category filters.
 *
 * Returns:
 *     Overpass QL query string.
 */
function buildOverpassQuery(
  bbox: BoundingBox,
  categories: CategoryFilter[]
): string {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const queries: string[] = [];

  for (const category of categories) {
    if (category === "amenity") {
      const amenityRegex = AMENITY_SUBTYPES.join("|");
      queries.push(`node["amenity"~"${amenityRegex}"](${bboxStr});`);
      queries.push(`way["amenity"~"${amenityRegex}"](${bboxStr});`);
    } else {
      queries.push(`node["${category}"](${bboxStr});`);
      queries.push(`way["${category}"](${bboxStr});`);
    }
  }

  return `
    [out:json][timeout:60];
    (
      ${queries.join("\n      ")}
    );
    out center body;
  `;
}

/**
 * Parse categories from OSM tags.
 *
 * Args:
 *     tags: OSM tags object.
 *
 * Returns:
 *     Array of category strings.
 */
function parseCategories(tags: Record<string, string>): string[] {
  const categories: string[] = [];

  if (tags.tourism) categories.push(tags.tourism);
  if (tags.historic) categories.push(tags.historic);
  if (tags.amenity) categories.push(tags.amenity);
  if (tags.shop) categories.push(tags.shop);
  if (tags.leisure) categories.push(tags.leisure);
  if (tags.building && !tags.amenity && !tags.tourism) {
    categories.push(tags.building);
  }

  return categories;
}

/**
 * Build an address string from OSM tags.
 *
 * Args:
 *     tags: OSM tags object.
 *
 * Returns:
 *     Address string or undefined.
 */
function buildAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];

  if (tags["addr:street"]) {
    const street = tags["addr:housenumber"]
      ? `${tags["addr:street"]} ${tags["addr:housenumber"]}`
      : tags["addr:street"];
    parts.push(street);
  }

  if (tags["addr:postcode"] && tags["addr:city"]) {
    parts.push(`${tags["addr:postcode"]} ${tags["addr:city"]}`);
  } else if (tags["addr:city"]) {
    parts.push(tags["addr:city"]);
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Transform an Overpass element to our POI schema.
 *
 * Args:
 *     element: Overpass API element.
 *
 * Returns:
 *     NewPoi object or null if invalid.
 */
function transformElement(element: OverpassElement): NewPoi | null {
  const tags = element.tags || {};
  const name = tags.name || tags["name:en"] || tags["name:de"];

  if (!name) return null;

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  if (!lat || !lon) return null;

  const categories = parseCategories(tags);
  const cuisine = tags.cuisine?.split(";").map((c) => c.trim()) || undefined;

  return {
    name,
    longitude: lon.toString(),
    latitude: lat.toString(),
    source: "osm",
    osmNodeId: `${element.type}/${element.id}`,
    categories: categories.length > 0 ? categories : null,
    tags,
    wikipediaUrl: tags.wikipedia
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia)}`
      : tags.wikidata
        ? `https://www.wikidata.org/wiki/${tags.wikidata}`
        : null,
    descriptionRaw: tags.description || null,
    address: buildAddress(tags) || null,
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || tags.url || null,
    openingHours: tags.opening_hours || null,
    wheelchair: tags.wheelchair || null,
    cuisine: cuisine && cuisine.length > 0 ? cuisine : null,
    operator: tags.operator || null,
  };
}

interface ImportOptions {
  bbox: BoundingBox;
  categories?: CategoryFilter[];
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Import POIs from OpenStreetMap Overpass API.
 *
 * Args:
 *     options: Import options including bounding box and category filters.
 *
 * Returns:
 *     Import statistics.
 */
export async function importPoisFromOsm(
  options: ImportOptions
): Promise<ImportResult> {
  const categories = options.categories || ["tourism", "historic", "amenity"];
  const query = buildOverpassQuery(options.bbox, categories);

  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data: OverpassResponse = await response.json();
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (const element of data.elements) {
    try {
      const poi = transformElement(element);

      if (!poi) {
        result.skipped++;
        continue;
      }

      const existing = await db.query.pois.findFirst({
        where: eq(pois.osmNodeId, poi.osmNodeId!),
      });

      if (existing) {
        await db
          .update(pois)
          .set({
            ...poi,
            updatedAt: new Date(),
          })
          .where(eq(pois.id, existing.id));
        result.updated++;
      } else {
        await db.insert(pois).values(poi);
        result.imported++;
      }
    } catch (error) {
      console.error(`Error processing element ${element.id}:`, error);
      result.errors++;
    }
  }

  return result;
}

export { type BoundingBox, type CategoryFilter, type ImportResult };
