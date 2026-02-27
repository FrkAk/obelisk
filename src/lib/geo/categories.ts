import type { CategorySlug } from "@/types";

/**
 * Maps OSM tag values, Mapbox maki icons, and Nominatim types to category slugs.
 * This is the single source of truth for all OSM-to-category classification.
 */
export const OSM_CATEGORY_MAP: Record<string, CategorySlug> = {
  restaurant: "food",
  cafe: "food",
  fast_food: "food",
  biergarten: "food",
  food_court: "food",
  ice_cream: "food",
  bakery: "food",
  deli: "food",
  confectionery: "food",
  food_and_drink: "food",
  food_and_drink_stores: "food",

  bar: "nightlife",
  pub: "nightlife",
  nightclub: "nightlife",

  museum: "art",
  gallery: "art",

  theatre: "culture",
  cinema: "culture",
  arts_centre: "culture",
  community_centre: "culture",
  arts_and_entertainment: "culture",

  university: "education",
  school: "education",
  college: "education",
  library: "education",
  education: "education",
  kindergarten: "education",

  hospital: "health",
  clinic: "health",
  pharmacy: "health",
  doctors: "health",
  dentist: "health",
  veterinary: "health",

  police: "services",
  fire_station: "services",
  bank: "services",
  post_office: "services",
  atm: "services",
  bureau_de_change: "services",
  commercial_services: "services",

  shop: "shopping",
  clothes: "shopping",
  supermarket: "shopping",
  mall: "shopping",
  department_store: "shopping",
  marketplace: "shopping",

  stadium: "sports",
  sports_centre: "sports",
  swimming_pool: "sports",
  fitness_centre: "sports",
  pitch: "sports",

  bus_station: "transport",
  station: "transport",
  parking: "transport",
  fuel: "transport",
  car_rental: "transport",
  taxi: "transport",
  motorist: "transport",

  park: "nature",
  garden: "nature",
  nature_reserve: "nature",
  zoo: "nature",
  aquarium: "nature",
  botanical_garden: "nature",
  playground: "nature",
  dog_park: "nature",
  park_like: "nature",

  church: "architecture",
  cathedral: "architecture",
  chapel: "architecture",
  mosque: "architecture",
  synagogue: "architecture",
  temple: "architecture",
  shrine: "architecture",
  place_of_worship: "architecture",
  monastery: "architecture",
  tower: "architecture",
  townhall: "architecture",
  courthouse: "architecture",
  religion: "architecture",
  "religious-christian": "architecture",
  "religious-muslim": "architecture",
  "religious-jewish": "architecture",
  "religious-buddhist": "architecture",
  "religious-shinto": "architecture",

  castle: "history",
  monument: "history",
  memorial: "history",
  archaeological_site: "history",
  ruins: "history",
  battlefield: "history",
  city_gate: "history",
  wayside_shrine: "history",
  wayside_cross: "history",
  historic: "history",

  viewpoint: "views",

  attraction: "hidden",
  hotel: "hidden",
  hostel: "hidden",
  fountain: "hidden",
  lodging: "hidden",
  general: "hidden",
  visitor_amenities: "hidden",
  industrial: "hidden",
};

/**
 * Resolves a category slug from a raw string (OSM value, Mapbox maki, etc.).
 *
 * Args:
 *     value: Raw category/amenity/type string to look up.
 *
 * Returns:
 *     The matching CategorySlug, or "hidden" if no match is found.
 */
export function getCategorySlug(value: string): CategorySlug {
  return OSM_CATEGORY_MAP[value.toLowerCase()] ?? "hidden";
}

/**
 * Determines a category slug from a full set of OSM tags using key-level heuristics.
 * Checks tag keys (historic, tourism, amenity, leisure, etc.) in priority order.
 *
 * Args:
 *     tags: OSM tag key-value pairs.
 *
 * Returns:
 *     The best-matching CategorySlug based on tag keys and values.
 */
export function getCategorySlugFromTags(tags: Record<string, string>): CategorySlug {
  if (tags.historic) return "history";
  if (tags.tourism === "museum") return "art";
  if (tags.tourism === "viewpoint") return "views";
  if (tags.amenity && OSM_CATEGORY_MAP[tags.amenity]) return OSM_CATEGORY_MAP[tags.amenity];
  if (tags.leisure === "park" || tags.natural) return "nature";
  if (tags.architect || tags.building === "church") return "architecture";
  if (tags.shop) return "shopping";
  if (tags.tourism) return "hidden";
  return "hidden";
}
