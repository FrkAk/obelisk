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
 * @param tags - OSM tag key-value pairs.
 * @returns The best-matching CategorySlug based on tag keys and values.
 */
export function getCategorySlugFromTags(tags: Record<string, string>): CategorySlug {
  if (tags.historic) return "history";
  if (tags.tourism === "museum" || tags.tourism === "gallery") return "art";
  if (tags.tourism === "viewpoint") return "views";
  if (tags.tourism === "artwork") return "art";
  if (tags.tourism === "attraction") return "culture";

  const foodAmenities = ["restaurant", "cafe", "fast_food", "biergarten", "ice_cream", "food_court"];
  if (foodAmenities.includes(tags.amenity)) return "food";

  const nightlifeAmenities = ["bar", "pub", "nightclub"];
  if (nightlifeAmenities.includes(tags.amenity)) return "nightlife";

  const healthAmenities = ["hospital", "pharmacy", "clinic", "doctors", "dentist"];
  if (healthAmenities.includes(tags.amenity) || tags.healthcare) return "health";

  const educationAmenities = ["university", "school", "college", "kindergarten", "library"];
  if (educationAmenities.includes(tags.amenity)) return "education";

  const serviceAmenities = ["police", "fire_station", "bank", "post_office"];
  if (serviceAmenities.includes(tags.amenity)) return "services";

  if (tags.shop) return "shopping";

  const natureLeisure = ["park", "garden", "nature_reserve"];
  if (natureLeisure.includes(tags.leisure) || tags.natural) return "nature";

  const sportsLeisure = ["sports_centre", "stadium", "fitness_centre", "swimming_pool", "pitch"];
  if (sportsLeisure.includes(tags.leisure)) return "sports";

  if (tags.amenity === "theatre" || tags.amenity === "cinema" || tags.amenity === "community_centre") {
    return "culture";
  }

  if (tags.amenity === "bus_station" || tags.railway) return "transport";

  if (tags.tourism === "hotel" || tags.tourism === "hostel" || tags.tourism === "guest_house") {
    return "services";
  }

  if (tags.architect || tags.building === "church" || tags.amenity === "place_of_worship") {
    return "architecture";
  }

  return "hidden";
}
