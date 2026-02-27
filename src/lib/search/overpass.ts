import type { OverpassElement, ExternalPOI } from "@/types/api";

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
 * Executes an Overpass API query with automatic server failover.
 *
 * Args:
 *     query: The Overpass QL query string.
 *     retryCount: Current retry attempt (used for server rotation).
 *
 * Returns:
 *     Parsed JSON response containing Overpass elements.
 *
 * Raises:
 *     Error: When all Overpass servers fail.
 */
export async function executeOverpassQuery(
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

/**
 * Extracts structured POI details from raw Overpass element tags.
 *
 * Args:
 *     element: Raw Overpass element with tags.
 *
 * Returns:
 *     Partial ExternalPOI with opening hours, phone, website, etc.
 */
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

/**
 * Waits for a specified number of milliseconds.
 *
 * Args:
 *     ms: Delay duration in milliseconds.
 *
 * Returns:
 *     Promise that resolves after the delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
