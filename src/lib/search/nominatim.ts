import type {
  NominatimResult,
  ExternalPOI,
  SearchLocation,
  ParsedIntent,
} from "./types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Obelisk/1.0 (https://obelisk.app)";

const CATEGORY_TO_OSM_TYPE: Record<string, string[]> = {
  food: ["restaurant", "cafe", "fast_food", "bar", "pub", "biergarten"],
  history: ["museum", "memorial", "archaeological_site", "castle", "monument"],
  art: ["gallery", "artwork", "theatre"],
  nature: ["park", "garden", "viewpoint", "nature_reserve"],
  architecture: ["church", "cathedral", "tower", "palace", "historic"],
  hidden: ["attraction", "place_of_worship"],
  views: ["viewpoint", "observation_tower"],
  culture: ["theatre", "cinema", "library", "community_centre"],
};

function mapOsmToCategory(osmClass: string, osmType: string): string {
  if (osmClass === "amenity") {
    if (["restaurant", "cafe", "fast_food", "bar", "pub", "biergarten"].includes(osmType)) {
      return "food";
    }
    if (["theatre", "cinema", "library"].includes(osmType)) {
      return "culture";
    }
  }
  if (osmClass === "tourism") {
    if (["museum", "gallery"].includes(osmType)) return "art";
    if (["viewpoint"].includes(osmType)) return "views";
    if (["attraction", "artwork"].includes(osmType)) return "hidden";
  }
  if (osmClass === "historic") return "history";
  if (osmClass === "leisure" && ["park", "garden", "nature_reserve"].includes(osmType)) {
    return "nature";
  }
  if (osmClass === "building" || osmClass === "place") return "architecture";
  return "hidden";
}

function buildSearchQuery(intent: ParsedIntent): string {
  const keywords: string[] = [...intent.keywords];

  if (intent.category && CATEGORY_TO_OSM_TYPE[intent.category]) {
    const types = CATEGORY_TO_OSM_TYPE[intent.category];
    const hasOsmType = keywords.some((kw) =>
      types.some((t) => kw.toLowerCase().includes(t) || t.includes(kw.toLowerCase()))
    );

    if (!hasOsmType && types.length > 0) {
      keywords.push(types[0]);
    }
  }

  const osmFriendlyTerms = ["cafe", "restaurant", "bar", "pub", "museum", "park", "gallery", "church", "theatre", "cinema"];
  const priorityKeyword = keywords.find((kw) =>
    osmFriendlyTerms.includes(kw.toLowerCase())
  );

  if (priorityKeyword) {
    return priorityKeyword;
  }

  if (intent.category && CATEGORY_TO_OSM_TYPE[intent.category]) {
    return CATEGORY_TO_OSM_TYPE[intent.category][0];
  }

  return keywords[0] || "cafe";
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Searches for POIs using the Nominatim API.
 *
 * Args:
 *     intent: Parsed search intent from query parser.
 *     location: User's current location.
 *     radius: Search radius in meters.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of external POI results.
 */
export async function searchNominatim(
  intent: ParsedIntent,
  location: SearchLocation,
  radius: number = 1000,
  limit: number = 20
): Promise<ExternalPOI[]> {
  const query = buildSearchQuery(intent);

  const viewbox = calculateViewbox(location, radius);
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: limit.toString(),
    viewbox: viewbox,
    bounded: "1",
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.statusText}`);
  }

  const results: NominatimResult[] = await response.json();

  return results
    .filter((r) => r.name)
    .map((result) => ({
      id: `nominatim-${result.osm_id}`,
      osmId: result.osm_id,
      osmType: result.osm_type,
      name: result.name,
      category: mapOsmToCategory(result.class, result.type),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        parseFloat(result.lat),
        parseFloat(result.lon)
      ),
      address: formatAddress(result.address),
      source: "nominatim" as const,
    }))
    .filter((poi) => poi.distance !== undefined && poi.distance <= radius)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Searches for a specific type of amenity near a location.
 *
 * Args:
 *     amenityType: The OSM amenity type (cafe, restaurant, etc).
 *     location: User's current location.
 *     radius: Search radius in meters.
 *     limit: Maximum number of results.
 *
 * Returns:
 *     Array of external POI results.
 */
export async function searchByAmenity(
  amenityType: string,
  location: SearchLocation,
  radius: number = 1000,
  limit: number = 20
): Promise<ExternalPOI[]> {
  const viewbox = calculateViewbox(location, radius);
  const params = new URLSearchParams({
    q: amenityType,
    format: "json",
    limit: limit.toString(),
    viewbox: viewbox,
    bounded: "1",
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.statusText}`);
  }

  const results: NominatimResult[] = await response.json();

  return results
    .filter((r) => r.name)
    .map((result) => ({
      id: `nominatim-${result.osm_id}`,
      osmId: result.osm_id,
      osmType: result.osm_type,
      name: result.name,
      category: mapOsmToCategory(result.class, result.type),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        parseFloat(result.lat),
        parseFloat(result.lon)
      ),
      address: formatAddress(result.address),
      source: "nominatim" as const,
    }))
    .filter((poi) => poi.distance !== undefined && poi.distance <= radius)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

function calculateViewbox(location: SearchLocation, radius: number): string {
  const latOffset = radius / 111320;
  const lonOffset = radius / (111320 * Math.cos((location.latitude * Math.PI) / 180));

  const minLon = location.longitude - lonOffset;
  const minLat = location.latitude - latOffset;
  const maxLon = location.longitude + lonOffset;
  const maxLat = location.latitude + latOffset;

  return `${minLon},${maxLat},${maxLon},${minLat}`;
}

function formatAddress(address?: NominatimResult["address"]): string | undefined {
  if (!address) return undefined;

  const parts: string[] = [];
  if (address.road) parts.push(address.road);
  if (address.suburb) parts.push(address.suburb);
  if (address.city) parts.push(address.city);

  return parts.length > 0 ? parts.join(", ") : undefined;
}
