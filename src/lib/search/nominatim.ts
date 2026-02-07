import type {
  NominatimResult,
  ExternalPOI,
  SearchLocation,
  ParsedIntent,
  ViewportBounds,
} from "./types";
import { haversineDistance } from "@/lib/geo/distance";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Obelisk/1.0 (https://obelisk.app)";
const MUNICH_VIEWBOX = "11.36,48.25,11.79,48.06";

const CATEGORY_TO_OSM_TYPE: Record<string, string[]> = {
  food: ["restaurant", "cafe", "fast_food", "biergarten", "ice_cream", "food_court"],
  history: ["museum", "memorial", "archaeological_site", "castle", "monument"],
  art: ["gallery", "artwork", "theatre"],
  nature: ["park", "garden", "viewpoint", "nature_reserve"],
  architecture: ["church", "cathedral", "tower", "palace", "historic"],
  hidden: ["attraction", "place_of_worship"],
  views: ["viewpoint", "observation_tower"],
  culture: ["theatre", "cinema", "library", "community_centre"],
  shopping: ["clothes", "supermarket", "mall", "department_store", "shop"],
  nightlife: ["nightclub", "bar", "pub"],
  sports: ["stadium", "sports_centre", "swimming_pool", "fitness_centre"],
  health: ["hospital", "pharmacy", "clinic", "doctors"],
  transport: ["bus_station", "station", "parking"],
  education: ["university", "school", "college", "library"],
  services: ["bank", "post_office", "police", "fire_station"],
};

function mapOsmToCategory(osmClass: string, osmType: string): string {
  if (osmClass === "amenity") {
    if (["restaurant", "cafe", "fast_food", "biergarten", "ice_cream", "food_court"].includes(osmType)) {
      return "food";
    }
    if (["bar", "pub", "nightclub"].includes(osmType)) {
      return "nightlife";
    }
    if (["hospital", "clinic", "doctors", "dentist", "pharmacy", "veterinary"].includes(osmType)) {
      return "health";
    }
    if (["school", "university", "college", "library", "kindergarten"].includes(osmType)) {
      return "education";
    }
    if (["bank", "post_office", "police", "fire_station", "atm", "bureau_de_change"].includes(osmType)) {
      return "services";
    }
    if (["theatre", "cinema", "community_centre"].includes(osmType)) {
      return "culture";
    }
    if (["bus_station", "taxi", "parking", "fuel", "car_rental"].includes(osmType)) {
      return "transport";
    }
    if (["swimming_pool", "sports_centre", "stadium"].includes(osmType)) {
      return "sports";
    }
  }
  if (osmClass === "shop") return "shopping";
  if (osmClass === "tourism") {
    if (["museum", "gallery"].includes(osmType)) return "art";
    if (["viewpoint"].includes(osmType)) return "views";
    if (["attraction", "artwork"].includes(osmType)) return "hidden";
  }
  if (osmClass === "historic") return "history";
  if (osmClass === "leisure") {
    if (["park", "garden", "nature_reserve"].includes(osmType)) {
      return "nature";
    }
    if (["sports_centre", "stadium", "fitness_centre", "swimming_pool", "pitch"].includes(osmType)) {
      return "sports";
    }
  }
  if (osmClass === "railway" || (osmClass === "highway" && osmType === "bus_stop")) return "transport";
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

/**
 * Searches for POIs using the Nominatim API.
 *
 * Args:
 *     intent: Parsed search intent from query parser.
 *     location: User's current location.
 *     radius: Search radius in meters.
 *     limit: Maximum number of results.
 *     viewportBounds: Optional viewport bounds to use instead of radius-based viewbox.
 *
 * Returns:
 *     Array of external POI results.
 */
export async function searchNominatim(
  intent: ParsedIntent,
  location: SearchLocation,
  radius: number = 1000,
  limit: number = 20,
  viewportBounds?: ViewportBounds
): Promise<ExternalPOI[]> {
  const query = buildSearchQuery(intent);

  let finalQuery = query;
  if (intent.cuisineTypes?.[0]) {
    finalQuery = intent.cuisineTypes[0];
    console.log(`[nominatim] Cuisine query: "${finalQuery}"`);
  }

  const viewbox = viewportBounds
    ? `${viewportBounds.west},${viewportBounds.north},${viewportBounds.east},${viewportBounds.south}`
    : calculateViewbox(location, radius);
  const params = new URLSearchParams({
    q: finalQuery,
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

  const mapped = results
    .filter((r) => r.name)
    .map((result) => ({
      id: `nominatim-${result.osm_id}`,
      osmId: result.osm_id,
      osmType: result.osm_type,
      name: result.name,
      category: mapOsmToCategory(result.class, result.type),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      distance: haversineDistance(
        location.latitude,
        location.longitude,
        parseFloat(result.lat),
        parseFloat(result.lon)
      ),
      address: formatAddress(result.address),
      source: "nominatim" as const,
    }))
    .filter((poi) => viewportBounds || (poi.distance !== undefined && poi.distance <= radius))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  console.log(`[nominatim] Keyword search: "${finalQuery}", results: ${mapped.length}`);
  return mapped;
}

/**
 * Searches Nominatim by place name using a two-phase bounded strategy.
 * Phase 1 uses viewport or Munich viewbox with bounded=1 for local results.
 * Phase 2 falls back to bounded=0 with countrycodes=de if no results found.
 *
 * Args:
 *     placeName: The name of the place to search for.
 *     location: User's current location for distance calculation.
 *     limit: Maximum number of results.
 *     viewportBounds: Optional viewport bounds from the map.
 *
 * Returns:
 *     Array of external POI results.
 */
export async function searchNominatimByName(
  placeName: string,
  location: SearchLocation,
  limit: number = 15,
  viewportBounds?: ViewportBounds
): Promise<ExternalPOI[]> {
  const viewbox = viewportBounds
    ? `${viewportBounds.west},${viewportBounds.north},${viewportBounds.east},${viewportBounds.south}`
    : MUNICH_VIEWBOX;

  let results = await fetchNominatim(placeName, viewbox, "1", limit);

  if (results.length === 0) {
    console.log(`[nominatim] Phase 1 empty, falling back to unbounded DE search`);
    results = await fetchNominatim(placeName, MUNICH_VIEWBOX, "0", limit, "de");
  }

  const mapped = results
    .filter((r) => r.name)
    .map((result) => ({
      id: `nominatim-${result.osm_id}`,
      osmId: result.osm_id,
      osmType: result.osm_type,
      name: result.name,
      category: mapOsmToCategory(result.class, result.type),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      distance: haversineDistance(
        location.latitude,
        location.longitude,
        parseFloat(result.lat),
        parseFloat(result.lon)
      ),
      address: formatAddress(result.address),
      source: "nominatim" as const,
    }));

  console.log(`[nominatim] Name search: "${placeName}", results: ${mapped.length}`);
  return mapped;
}

async function fetchNominatim(
  query: string,
  viewbox: string,
  bounded: string,
  limit: number,
  countrycodes?: string
): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: limit.toString(),
    viewbox,
    bounded,
    addressdetails: "1",
  });
  if (countrycodes) {
    params.set("countrycodes", countrycodes);
  }

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.statusText}`);
  }

  return response.json();
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
      distance: haversineDistance(
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
