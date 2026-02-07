import type { OverpassElement, ExternalPOI, SearchLocation } from "./types";
import { haversineDistance } from "@/lib/geo/distance";

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

/**
 * Fetches detailed POI information from Overpass API.
 *
 * Args:
 *     osmId: OpenStreetMap ID of the element.
 *     osmType: Type of the element (node, way, relation).
 *
 * Returns:
 *     Enriched POI data with opening hours, phone, website, etc.
 */
export async function fetchPOIDetails(
  osmId: number,
  osmType: string
): Promise<Partial<ExternalPOI> | null> {
  const typeShort = osmType === "node" ? "node" : osmType === "way" ? "way" : "rel";
  const query = `
    [out:json][timeout:10];
    ${typeShort}(${osmId});
    out body;
  `;

  const data = await executeOverpassQuery(query);
  if (!data.elements || data.elements.length === 0) return null;

  const element = data.elements[0];
  return extractPOIDetails(element);
}

/**
 * Enriches multiple POIs with detailed information from Overpass.
 *
 * Args:
 *     pois: Array of POIs to enrich.
 *
 * Returns:
 *     Array of enriched POIs.
 */
export async function enrichPOIs(pois: ExternalPOI[]): Promise<ExternalPOI[]> {
  const enrichedPois: ExternalPOI[] = [];

  for (const poi of pois.slice(0, 10)) {
    try {
      const details = await fetchPOIDetails(poi.osmId, poi.osmType);
      if (details) {
        enrichedPois.push({ ...poi, ...details });
      } else {
        enrichedPois.push(poi);
      }
      await delay(100);
    } catch {
      enrichedPois.push(poi);
    }
  }

  return enrichedPois;
}

/**
 * Searches for POIs by amenity type within a bounding box using Overpass.
 *
 * Args:
 *     amenityTypes: Array of OSM amenity types to search for.
 *     location: Center location for the search.
 *     radius: Search radius in meters.
 *
 * Returns:
 *     Array of POIs matching the criteria.
 */
export async function searchByAmenityOverpass(
  amenityTypes: string[],
  location: SearchLocation,
  radius: number = 500
): Promise<ExternalPOI[]> {
  const amenityFilter = amenityTypes.map((t) => `["amenity"="${t}"]`).join("");

  const query = `
    [out:json][timeout:25];
    (
      node${amenityFilter}(around:${radius},${location.latitude},${location.longitude});
      way${amenityFilter}(around:${radius},${location.latitude},${location.longitude});
    );
    out body center;
  `;

  const data = await executeOverpassQuery(query);
  if (!data.elements) return [];

  return data.elements
    .filter((el: OverpassElement) => el.tags?.name)
    .map((el: OverpassElement) => {
      const lat = el.lat ?? el.center?.lat ?? 0;
      const lon = el.lon ?? el.center?.lon ?? 0;

      return {
        id: `overpass-${el.id}`,
        osmId: el.id,
        osmType: el.type,
        name: el.tags?.name ?? "Unknown",
        category: mapAmenityToCategory(el.tags?.amenity ?? ""),
        latitude: lat,
        longitude: lon,
        distance: haversineDistance(location.latitude, location.longitude, lat, lon),
        ...extractPOIDetails(el),
        source: "overpass" as const,
      };
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Searches for POIs with specific tags (e.g., wifi, outdoor seating).
 *
 * Args:
 *     tags: Record of tag key-value pairs to search for.
 *     location: Center location for the search.
 *     radius: Search radius in meters.
 *
 * Returns:
 *     Array of POIs matching the tag criteria.
 */
export async function searchByTags(
  tags: Record<string, string>,
  location: SearchLocation,
  radius: number = 500
): Promise<ExternalPOI[]> {
  const tagFilters = Object.entries(tags)
    .map(([k, v]) => `["${k}"="${v}"]`)
    .join("");

  const query = `
    [out:json][timeout:25];
    (
      node${tagFilters}(around:${radius},${location.latitude},${location.longitude});
      way${tagFilters}(around:${radius},${location.latitude},${location.longitude});
    );
    out body center;
  `;

  const data = await executeOverpassQuery(query);
  if (!data.elements) return [];

  return data.elements
    .filter((el: OverpassElement) => el.tags?.name)
    .map((el: OverpassElement) => {
      const lat = el.lat ?? el.center?.lat ?? 0;
      const lon = el.lon ?? el.center?.lon ?? 0;

      return {
        id: `overpass-${el.id}`,
        osmId: el.id,
        osmType: el.type,
        name: el.tags?.name ?? "Unknown",
        category: mapAmenityToCategory(el.tags?.amenity ?? el.tags?.tourism ?? ""),
        latitude: lat,
        longitude: lon,
        distance: haversineDistance(location.latitude, location.longitude, lat, lon),
        ...extractPOIDetails(el),
        source: "overpass" as const,
      };
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

async function executeOverpassQuery(
  query: string,
  retryCount: number = 0
): Promise<{ elements?: OverpassElement[] }> {
  const serverUrl = OVERPASS_SERVERS[retryCount % OVERPASS_SERVERS.length];

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      if (retryCount < OVERPASS_SERVERS.length - 1) {
        await delay(500);
        return executeOverpassQuery(query, retryCount + 1);
      }
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (retryCount < OVERPASS_SERVERS.length - 1) {
      await delay(500);
      return executeOverpassQuery(query, retryCount + 1);
    }
    throw error;
  }
}

function extractPOIDetails(element: OverpassElement): Partial<ExternalPOI> {
  const tags = element.tags ?? {};

  return {
    openingHours: tags.opening_hours,
    phone: tags.phone ?? tags["contact:phone"],
    website: tags.website ?? tags["contact:website"],
    cuisine: tags.cuisine,
    hasWifi: tags.internet_access === "wlan" || tags.internet_access === "yes",
    hasOutdoorSeating: tags.outdoor_seating === "yes",
  };
}

function mapAmenityToCategory(amenity: string): string {
  const foodAmenities = ["restaurant", "cafe", "fast_food", "bar", "pub", "biergarten"];
  const cultureAmenities = ["theatre", "cinema", "library", "community_centre"];

  if (foodAmenities.includes(amenity)) return "food";
  if (cultureAmenities.includes(amenity)) return "culture";
  if (amenity === "museum" || amenity === "gallery") return "art";
  return "hidden";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
