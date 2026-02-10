import { db } from "../src/lib/db/client";
import {
  categories,
  pois,
  regions,
  contactInfo,
  accessibilityInfo,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  cuisines,
  poiCuisines,
  poiTags,
  poiTranslations,
  tags,
} from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { CategorySlug } from "../src/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MUNICH_CENTER = { lat: 48.137154, lon: 11.576124 };
const SEED_RADIUS = parseInt(process.env.SEED_RADIUS || "10000", 10);

const CATEGORY_DATA: Array<{
  name: string;
  slug: CategorySlug;
  icon: string;
  color: string;
}> = [
  { name: "History", slug: "history", icon: "monument", color: "#FF6B4A" },
  { name: "Food", slug: "food", icon: "utensils", color: "#FF9F9F" },
  { name: "Art", slug: "art", icon: "palette", color: "#BF5AF2" },
  { name: "Nature", slug: "nature", icon: "leaf", color: "#34C759" },
  { name: "Architecture", slug: "architecture", icon: "building", color: "#5AC8FA" },
  { name: "Hidden Gems", slug: "hidden", icon: "diamond", color: "#FFD60A" },
  { name: "Views", slug: "views", icon: "eye", color: "#64D2FF" },
  { name: "Culture", slug: "culture", icon: "masks", color: "#5E5CE6" },
  { name: "Shopping", slug: "shopping", icon: "bag", color: "#FF8A65" },
  { name: "Nightlife", slug: "nightlife", icon: "moon", color: "#CE93D8" },
  { name: "Sports", slug: "sports", icon: "ball", color: "#4CAF50" },
  { name: "Health", slug: "health", icon: "cross", color: "#EF5350" },
  { name: "Transport", slug: "transport", icon: "train", color: "#78909C" },
  { name: "Education", slug: "education", icon: "book", color: "#FFAB40" },
  { name: "Services", slug: "services", icon: "briefcase", color: "#A1887F" },
];

// ---------------------------------------------------------------------------
// Overpass types
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface QueryGroup {
  label: string;
  filters: string[];
}

const QUERY_GROUPS: QueryGroup[] = [
  {
    label: "Food & Drink",
    filters: [
      '["amenity"="restaurant"]["name"]',
      '["amenity"="cafe"]["name"]',
      '["amenity"="bar"]["name"]',
      '["amenity"="pub"]["name"]',
      '["amenity"="fast_food"]["name"]',
      '["amenity"="biergarten"]["name"]',
      '["amenity"="ice_cream"]["name"]',
      '["amenity"="food_court"]["name"]',
    ],
  },
  {
    label: "Culture & Entertainment",
    filters: [
      '["amenity"="theatre"]["name"]',
      '["amenity"="cinema"]["name"]',
      '["tourism"="museum"]["name"]',
      '["tourism"="gallery"]["name"]',
      '["amenity"="library"]["name"]',
      '["amenity"="community_centre"]["name"]',
      '["amenity"="nightclub"]["name"]',
    ],
  },
  {
    label: "Services",
    filters: [
      '["amenity"="hospital"]["name"]',
      '["amenity"="pharmacy"]["name"]',
      '["amenity"="clinic"]["name"]',
      '["amenity"="doctors"]["name"]',
      '["amenity"="dentist"]["name"]',
      '["amenity"="bank"]["name"]',
      '["amenity"="post_office"]["name"]',
      '["amenity"="police"]["name"]',
      '["amenity"="fire_station"]["name"]',
    ],
  },
  {
    label: "Education",
    filters: [
      '["amenity"="university"]["name"]',
      '["amenity"="school"]["name"]',
      '["amenity"="college"]["name"]',
      '["amenity"="kindergarten"]["name"]',
    ],
  },
  {
    label: "Tourism",
    filters: [
      '["tourism"="hotel"]["name"]',
      '["tourism"="hostel"]["name"]',
      '["tourism"="guest_house"]["name"]',
      '["tourism"="attraction"]["name"]',
      '["tourism"="artwork"]["name"]',
      '["tourism"="viewpoint"]["name"]',
      '["tourism"="information"]["name"]',
    ],
  },
  {
    label: "Historic",
    filters: ['["historic"]["name"]'],
  },
  {
    label: "Leisure",
    filters: [
      '["leisure"="park"]["name"]',
      '["leisure"="garden"]["name"]',
      '["leisure"="nature_reserve"]["name"]',
      '["leisure"="sports_centre"]["name"]',
      '["leisure"="stadium"]["name"]',
      '["leisure"="fitness_centre"]["name"]',
      '["leisure"="swimming_pool"]["name"]',
      '["leisure"="pitch"]["name"]',
      '["leisure"="playground"]["name"]',
    ],
  },
  {
    label: "Shopping",
    filters: ['["shop"]["name"]'],
  },
  {
    label: "Healthcare",
    filters: ['["healthcare"]["name"]'],
  },
  {
    label: "Transport",
    filters: [
      '["amenity"="bus_station"]["name"]',
      '["railway"="station"]["name"]',
      '["railway"="tram_stop"]["name"]',
    ],
  },
];

// ---------------------------------------------------------------------------
// Overpass fetching (reused from existing script)
// ---------------------------------------------------------------------------

async function fetchQueryGroup(group: QueryGroup): Promise<OverpassElement[]> {
  const around = `around:${SEED_RADIUS},${MUNICH_CENTER.lat},${MUNICH_CENTER.lon}`;

  const nodeQueries = group.filters.map((f) => `node${f}(${around});`).join("\n      ");
  const wayQueries = group.filters.map((f) => `way${f}(${around});`).join("\n      ");

  const query = `
    [out:json][timeout:120];
    (
      ${nodeQueries}
      ${wayQueries}
    );
    out body center;
  `;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(180000),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data: OverpassResponse = await response.json();
      return data.elements;
    } catch (error) {
      console.log(`  Attempt ${attempt}/3 failed:`, error instanceof Error ? error.message : error);
      if (attempt === 3) return [];
      await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
  return [];
}

async function fetchAllPois(): Promise<OverpassElement[]> {
  const allElements: OverpassElement[] = [];
  const seenIds = new Set<number>();

  for (const group of QUERY_GROUPS) {
    console.log(`Fetching ${group.label}...`);
    const elements = await fetchQueryGroup(group);
    let newCount = 0;

    for (const el of elements) {
      if (!seenIds.has(el.id)) {
        seenIds.add(el.id);
        allElements.push(el);
        newCount++;
      }
    }

    console.log(`  Found ${elements.length} elements (${newCount} new, ${elements.length - newCount} duplicates)`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  return allElements;
}

// ---------------------------------------------------------------------------
// Category classification
// ---------------------------------------------------------------------------

function determineCategorySlug(osmTags: Record<string, string>): CategorySlug {
  if (osmTags.historic) return "history";
  if (osmTags.tourism === "museum" || osmTags.tourism === "gallery") return "art";
  if (osmTags.tourism === "viewpoint") return "views";
  if (osmTags.tourism === "artwork") return "art";
  if (osmTags.tourism === "attraction") return "culture";

  const foodAmenities = ["restaurant", "cafe", "fast_food", "biergarten", "ice_cream", "food_court"];
  if (foodAmenities.includes(osmTags.amenity)) return "food";

  const nightlifeAmenities = ["bar", "pub", "nightclub"];
  if (nightlifeAmenities.includes(osmTags.amenity)) return "nightlife";

  const healthAmenities = ["hospital", "pharmacy", "clinic", "doctors", "dentist"];
  if (healthAmenities.includes(osmTags.amenity) || osmTags.healthcare) return "health";

  const educationAmenities = ["university", "school", "college", "kindergarten", "library"];
  if (educationAmenities.includes(osmTags.amenity)) return "education";

  const serviceAmenities = ["police", "fire_station", "bank", "post_office"];
  if (serviceAmenities.includes(osmTags.amenity)) return "services";

  if (osmTags.shop) return "shopping";

  const natureLeisure = ["park", "garden", "nature_reserve"];
  if (natureLeisure.includes(osmTags.leisure) || osmTags.natural) return "nature";

  const sportsLeisure = ["sports_centre", "stadium", "fitness_centre", "swimming_pool", "pitch"];
  if (sportsLeisure.includes(osmTags.leisure)) return "sports";

  if (osmTags.amenity === "theatre" || osmTags.amenity === "cinema" || osmTags.amenity === "community_centre") {
    return "culture";
  }

  if (osmTags.amenity === "bus_station" || osmTags.railway) return "transport";

  if (osmTags.tourism === "hotel" || osmTags.tourism === "hostel" || osmTags.tourism === "guest_house") {
    return "services";
  }

  if (osmTags.architect || osmTags.building === "church" || osmTags.amenity === "place_of_worship") {
    return "architecture";
  }

  return "hidden";
}

// ---------------------------------------------------------------------------
// OSM tag parsers for related tables
// ---------------------------------------------------------------------------

function parseContactInfo(osmTags: Record<string, string>): Record<string, string | null> {
  return {
    phone: osmTags.phone ?? osmTags["contact:phone"] ?? null,
    email: osmTags.email ?? osmTags["contact:email"] ?? null,
    website: osmTags.website ?? osmTags["contact:website"] ?? null,
    bookingUrl: osmTags["reservation:url"] ?? null,
    instagram: osmTags["contact:instagram"] ?? null,
    facebook: osmTags["contact:facebook"] ?? null,
    openingHoursRaw: osmTags.opening_hours ?? null,
  };
}

function hasContactData(data: Record<string, string | null>): boolean {
  return Object.values(data).some((v) => v !== null);
}

interface AccessibilityData {
  wheelchair: boolean | null;
  elevator: boolean | null;
  accessibleRestroom: boolean | null;
  strollerFriendly: boolean | null;
  dogFriendly: boolean | null;
  parkingAvailable: boolean | null;
  notes: string | null;
}

function parseAccessibility(osmTags: Record<string, string>): AccessibilityData {
  const wheelchairRaw = osmTags.wheelchair;
  let wheelchair: boolean | null = null;
  let notes: string | null = null;

  if (wheelchairRaw === "yes" || wheelchairRaw === "designated") {
    wheelchair = true;
  } else if (wheelchairRaw === "no") {
    wheelchair = false;
  } else if (wheelchairRaw === "limited") {
    wheelchair = false;
    notes = "Wheelchair access limited";
  }

  return {
    wheelchair,
    elevator: osmTags.elevator === "yes" ? true : osmTags.elevator === "no" ? false : null,
    accessibleRestroom: osmTags["toilets:wheelchair"] === "yes" ? true : null,
    strollerFriendly: null,
    dogFriendly: osmTags.dog === "yes" ? true : osmTags.dog === "no" ? false : null,
    parkingAvailable: osmTags.parking ? true : null,
    notes,
  };
}

function hasAccessibilityData(data: AccessibilityData): boolean {
  return (
    data.wheelchair !== null ||
    data.elevator !== null ||
    data.accessibleRestroom !== null ||
    data.dogFriendly !== null ||
    data.parkingAvailable !== null ||
    data.notes !== null
  );
}

// ---------------------------------------------------------------------------
// Profile builders per category
// ---------------------------------------------------------------------------

function buildFoodProfile(osmTags: Record<string, string>): Record<string, unknown> {
  const amenity = osmTags.amenity;
  const typeMap: Record<string, string> = {
    restaurant: "restaurant",
    cafe: "cafe",
    fast_food: "fast_food",
    biergarten: "biergarten",
    ice_cream: "ice_cream",
    food_court: "food_court",
    bakery: "bakery",
  };

  return {
    establishmentType: typeMap[amenity] ?? osmTags.shop === "bakery" ? "bakery" : null,
    dineIn: osmTags["indoor_seating"] === "yes" || osmTags["dine_in"] === "yes" ? true : null,
    takeaway: osmTags.takeaway === "yes" ? true : osmTags.takeaway === "no" ? false : null,
    delivery: osmTags.delivery === "yes" ? true : osmTags.delivery === "no" ? false : null,
    driveThrough: osmTags.drive_through === "yes" ? true : null,
    catering: osmTags.catering === "yes" ? true : null,
    servesBreakfast: osmTags["breakfast"] === "yes" ? true : null,
    servesBrunch: osmTags["brunch"] === "yes" ? true : null,
    servesLunch: osmTags["lunch"] === "yes" ? true : null,
    servesDinner: osmTags["dinner"] === "yes" ? true : null,
    dietVegetarian: osmTags["diet:vegetarian"] ?? null,
    dietVegan: osmTags["diet:vegan"] ?? null,
    dietHalal: osmTags["diet:halal"] ?? null,
    dietKosher: osmTags["diet:kosher"] ?? null,
    dietGlutenFree: osmTags["diet:gluten_free"] ?? null,
    dietLactoseFree: osmTags["diet:lactose_free"] ?? null,
    dietPescetarian: osmTags["diet:pescetarian"] ?? null,
    servesBeer: osmTags["brewery"] || osmTags["real_ale"] === "yes" ? true : null,
    servesWine: null,
    servesCocktails: null,
    hasOutdoorSeating: osmTags.outdoor_seating === "yes" ? true : osmTags.outdoor_seating === "no" ? false : null,
    hasWifi: osmTags.internet_access === "wlan" || osmTags.internet_access === "yes" ? true : null,
    hasLiveMusic: osmTags.live_music === "yes" ? true : null,
    hasParking: osmTags.parking ? true : null,
    smokingPolicy:
      osmTags.smoking === "no" ? "no_smoking" :
      osmTags.smoking === "outside" ? "outdoor_only" :
      osmTags.smoking === "separated" ? "designated_area" :
      osmTags.smoking === "yes" ? "allowed" : null,
    cashOnly: osmTags["payment:cash"] === "only" ? true : null,
    hasHighchair: osmTags.highchair === "yes" ? true : null,
    hasChangingTable: osmTags.changing_table === "yes" ? true : null,
    hasAirConditioning: osmTags.air_conditioning === "yes" ? true : null,
  };
}

function buildHistoryProfile(osmTags: Record<string, string>): Record<string, unknown> {
  return {
    subtype: osmTags.historic ?? null,
    yearBuilt: osmTags.start_date ? parseYear(osmTags.start_date) : null,
    yearDestroyed: osmTags.end_date ? parseYear(osmTags.end_date) : null,
    historicalSignificance: osmTags.description ?? null,
    originalPurpose: osmTags.original_use ?? null,
    currentUse: osmTags.current_use ?? null,
    heritageLevel: osmTags.heritage ? parseHeritageLevel(osmTags.heritage) : null,
    inscription: osmTags.inscription ?? null,
    preservationStatus: osmTags.ruins === "yes" ? "ruins" : null,
  };
}

function buildArchitectureProfile(osmTags: Record<string, string>): Record<string, unknown> {
  const subtypeMap: Record<string, string> = {
    church: "church",
    cathedral: "cathedral",
    chapel: "chapel",
    mosque: "mosque",
    synagogue: "synagogue",
    temple: "temple",
  };

  return {
    subtype: subtypeMap[osmTags.building] ?? osmTags.amenity === "place_of_worship" ? "church" : null,
    primaryStyle: osmTags["architecture"] ?? osmTags["building:architecture"] ?? null,
    architect: osmTags.architect ?? null,
    yearBuilt: osmTags.start_date ? parseYear(osmTags.start_date) : null,
    heightMeters: osmTags.height ? osmTags.height.replace("m", "").trim() : null,
    buildingLevels: osmTags["building:levels"] ? parseInt(osmTags["building:levels"]) || null : null,
    denomination: osmTags.denomination ?? null,
    isActiveWorship: osmTags.amenity === "place_of_worship" ? true : null,
    towerAccessible: osmTags["tower:type"] === "observation" ? true : null,
  };
}

function buildNatureProfile(osmTags: Record<string, string>): Record<string, unknown> {
  return {
    subtype: osmTags.leisure ?? osmTags.natural ?? null,
    areaHectares: osmTags.area ? (parseFloat(osmTags.area) / 10000).toFixed(2) : null,
    trailDifficulty: osmTags["sac_scale"] ? mapTrailDifficulty(osmTags["sac_scale"]) : null,
    picnicAllowed: osmTags.picnic === "yes" ? true : null,
    swimmingAllowed: osmTags.swimming === "yes" ? true : osmTags.swimming === "no" ? false : null,
    cyclingAllowed: osmTags.bicycle === "yes" || osmTags.bicycle === "designated" ? true : osmTags.bicycle === "no" ? false : null,
    litAtNight: osmTags.lit === "yes" ? true : osmTags.lit === "no" ? false : null,
  };
}

function buildArtCultureProfile(osmTags: Record<string, string>): Record<string, unknown> {
  const subtypeMap: Record<string, string> = {
    museum: "museum",
    gallery: "gallery",
    theatre: "theatre",
    cinema: "cinema",
  };

  return {
    subtype: subtypeMap[osmTags.tourism] ?? subtypeMap[osmTags.amenity] ?? null,
    collectionFocus: osmTags["museum:type"] ?? osmTags.subject ?? null,
    guidedTours: osmTags.guided_tours === "yes" ? true : null,
    audioGuide: osmTags.audio_guide === "yes" ? true : null,
    photographyAllowed: osmTags.photography === "yes" ? true : osmTags.photography === "no" ? false : null,
    genreFocus: osmTags.genre ?? null,
    foundedYear: osmTags.start_date ? parseYear(osmTags.start_date) : null,
  };
}

function buildNightlifeProfile(osmTags: Record<string, string>): Record<string, unknown> {
  const subtypeMap: Record<string, string> = {
    bar: "bar",
    pub: "pub",
    nightclub: "nightclub",
  };

  return {
    subtype: subtypeMap[osmTags.amenity] ?? null,
    hasDancefloor: osmTags.amenity === "nightclub" ? true : null,
    hasLiveMusic: osmTags.live_music === "yes" ? true : null,
    hasDj: osmTags.amenity === "nightclub" ? true : null,
    outdoorArea: osmTags.outdoor_seating === "yes" ? true : null,
    smokingArea: osmTags.smoking === "outside" || osmTags.smoking === "separated" ? true : null,
    foodServed: osmTags.food === "yes" ? true : null,
  };
}

function buildShoppingProfile(osmTags: Record<string, string>): Record<string, unknown> {
  const shopType = osmTags.shop;
  let subtype: string | null = null;

  if (shopType === "clothes" || shopType === "fashion") subtype = "boutique";
  else if (shopType === "mall" || shopType === "department_store") subtype = "mall";
  else if (shopType === "supermarket" || shopType === "convenience") subtype = "supermarket";
  else if (shopType === "books") subtype = "bookstore";
  else if (shopType === "second_hand" || shopType === "charity") subtype = "vintage";
  else if (shopType === "bakery") subtype = "bakery";
  else if (shopType === "marketplace") subtype = "market";

  return {
    subtype,
    isSecondhand: shopType === "second_hand" || shopType === "charity" ? true : null,
    isLocalCrafts: osmTags.craft ? true : null,
    isLuxury: shopType === "jewelry" || osmTags.brand ? null : null,
    cashOnly: osmTags["payment:cash"] === "only" ? true : null,
  };
}

function buildViewpointProfile(osmTags: Record<string, string>): Record<string, unknown> {
  return {
    subtype: osmTags["tower:type"] === "observation" ? "tower" : "viewpoint",
    elevationM: osmTags.ele ?? null,
    viewDirection: osmTags.direction ?? null,
    weatherDependent: true,
    indoorViewing: osmTags["tower:type"] === "observation" ? true : null,
    requiresClimb: osmTags["tower:type"] === "observation" ? true : null,
  };
}

// ---------------------------------------------------------------------------
// Helper parsers
// ---------------------------------------------------------------------------

function parseYear(dateStr: string): number | null {
  const match = dateStr.match(/^(-?\d{1,4})/);
  if (match) return parseInt(match[1]);
  return null;
}

function parseHeritageLevel(heritage: string): string | null {
  if (heritage.includes("1") || heritage.toLowerCase().includes("world")) return "unesco";
  if (heritage.includes("2") || heritage.toLowerCase().includes("national")) return "national";
  if (heritage.includes("3") || heritage.toLowerCase().includes("regional")) return "regional";
  if (heritage.includes("4") || heritage.toLowerCase().includes("local")) return "local";
  return "local";
}

function mapTrailDifficulty(sacScale: string): string | null {
  if (sacScale === "hiking" || sacScale === "T1") return "easy";
  if (sacScale === "mountain_hiking" || sacScale === "T2") return "moderate";
  return "difficult";
}

function parseCuisineTag(cuisineValue: string): string[] {
  return cuisineValue
    .split(";")
    .map((c) => c.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// OSM tags -> tag slugs mapping
// ---------------------------------------------------------------------------

function extractTagSlugs(osmTags: Record<string, string>, categorySlug: CategorySlug): string[] {
  const slugs: string[] = [];

  if (osmTags.outdoor_seating === "yes") slugs.push("outdoor-seating");
  if (osmTags.internet_access === "wlan" || osmTags.internet_access === "yes") slugs.push("wifi");
  if (osmTags.parking) slugs.push("parking");
  if (osmTags.wheelchair === "yes" || osmTags.wheelchair === "designated") slugs.push("wheelchair-accessible");
  if (osmTags.dog === "yes") slugs.push("pet-friendly");
  if (osmTags.playground === "yes") slugs.push("playground");
  if (osmTags["toilets"] === "yes") slugs.push("restrooms");
  if (osmTags.changing_table === "yes") slugs.push("changing-table");
  if (osmTags.air_conditioning === "yes") slugs.push("air-conditioning");
  if (osmTags.elevator === "yes") slugs.push("elevator");
  if (osmTags["bicycle_parking"] === "yes") slugs.push("bike-parking");
  if (osmTags.guided_tours === "yes") slugs.push("guided-tours");
  if (osmTags.audio_guide === "yes") slugs.push("audio-guide");

  if (osmTags["diet:vegetarian"] === "yes" || osmTags["diet:vegetarian"] === "only") slugs.push("vegetarian");
  if (osmTags["diet:vegan"] === "yes" || osmTags["diet:vegan"] === "only") slugs.push("vegan");
  if (osmTags["diet:halal"] === "yes") slugs.push("halal");
  if (osmTags["diet:kosher"] === "yes") slugs.push("kosher");
  if (osmTags["diet:gluten_free"] === "yes") slugs.push("gluten-free");
  if (osmTags["diet:lactose_free"] === "yes") slugs.push("lactose-free");

  if (osmTags.architecture) {
    const style = osmTags.architecture.toLowerCase();
    if (style.includes("baroque")) slugs.push("baroque");
    if (style.includes("gothic")) slugs.push("gothic");
    if (style.includes("romanesque")) slugs.push("romanesque");
    if (style.includes("renaissance")) slugs.push("renaissance");
    if (style.includes("neoclassical")) slugs.push("neoclassical");
    if (style.includes("art_nouveau") || style.includes("jugendstil")) slugs.push("jugendstil");
    if (style.includes("modernist")) slugs.push("modernist");
  }

  if (osmTags.live_music === "yes") slugs.push("lively");

  if (categorySlug === "nature") {
    slugs.push("year-round");
  }

  return slugs;
}

// ---------------------------------------------------------------------------
// Main seeding logic
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding Obelisk POIs (radius: ${SEED_RADIUS}m)`);
  console.log("");

  // --- Load reference data ---

  console.log("Seeding categories...");
  await db.insert(categories).values(CATEGORY_DATA).onConflictDoNothing();
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  console.log(`Categories ready: ${categoryMap.size}`);

  const munichRegion = await db
    .select()
    .from(regions)
    .where(eq(regions.slug, "munich"));
  const munichRegionId = munichRegion.at(0)?.id ?? null;
  if (!munichRegionId) {
    console.warn("Warning: Munich region not found. Run seed-regions.ts first. Proceeding without region_id.");
  }

  const allCuisines = await db.select().from(cuisines);
  const cuisineSlugMap = new Map<string, string>();
  for (const c of allCuisines) {
    cuisineSlugMap.set(c.slug, c.id);
  }
  if (cuisineSlugMap.size === 0) {
    console.warn("Warning: No cuisines found. Run seed-cuisines.ts first. Cuisine linking will be skipped.");
  }

  const allTags = await db.select().from(tags);
  const tagSlugMap = new Map<string, string>();
  for (const t of allTags) {
    tagSlugMap.set(t.slug, t.id);
  }
  if (tagSlugMap.size === 0) {
    console.warn("Warning: No tags found. Run seed-tags.ts first. Tag linking will be skipped.");
  }

  // --- Fetch POIs ---

  console.log("");
  console.log("Fetching Munich POIs from Overpass API...");
  let elements = await fetchAllPois();
  console.log(`Total unique elements: ${elements.length}`);

  if (elements.length === 0) {
    console.log("No POIs from Overpass, using fallback data...");
    elements = getFallbackElements();
  }

  // --- Process and insert POIs ---

  console.log("");
  console.log("Processing POIs...");

  let poiCount = 0;
  let contactCount = 0;
  let accessibilityCount = 0;
  let profileCount = 0;
  let cuisineCount = 0;
  let tagCount = 0;
  let translationCount = 0;

  const BATCH_SIZE = 50;

  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE);

    for (const el of batch) {
      const osmTags = el.tags;
      if (!osmTags?.name) continue;

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!lat || !lon) continue;

      const categorySlug = determineCategorySlug(osmTags);
      const categoryId = categoryMap.get(categorySlug);

      const address = osmTags["addr:street"]
        ? `${osmTags["addr:street"]} ${osmTags["addr:housenumber"] ?? ""}, Munich`.trim()
        : null;

      const wikipediaUrl = osmTags.wikipedia
        ? `https://en.wikipedia.org/wiki/${osmTags.wikipedia.split(":").pop()}`
        : null;

      // --- Upsert POI ---
      const [insertedPoi] = await db
        .insert(pois)
        .values({
          osmId: el.id,
          name: osmTags.name,
          categoryId: categoryId ?? null,
          regionId: munichRegionId,
          latitude: lat,
          longitude: lon,
          address,
          locale: "de-DE",
          osmType: el.type === "way" ? "way" : el.type === "relation" ? "relation" : "node",
          osmTags,
          wikipediaUrl,
          imageUrl: osmTags.image ?? null,
        })
        .onConflictDoUpdate({
          target: pois.osmId,
          set: {
            name: sql`EXCLUDED.name`,
            categoryId: sql`EXCLUDED.category_id`,
            regionId: sql`EXCLUDED.region_id`,
            latitude: sql`EXCLUDED.latitude`,
            longitude: sql`EXCLUDED.longitude`,
            address: sql`EXCLUDED.address`,
            osmType: sql`EXCLUDED.osm_type`,
            osmTags: sql`EXCLUDED.osm_tags`,
            wikipediaUrl: sql`EXCLUDED.wikipedia_url`,
            imageUrl: sql`EXCLUDED.image_url`,
            updatedAt: sql`now()`,
          },
        })
        .returning({ id: pois.id });

      if (!insertedPoi) continue;
      const poiId = insertedPoi.id;
      poiCount++;

      // --- Contact info ---
      const contact = parseContactInfo(osmTags);
      if (hasContactData(contact)) {
        await db
          .insert(contactInfo)
          .values({ poiId, ...contact })
          .onConflictDoUpdate({
            target: contactInfo.poiId,
            set: contact,
          });
        contactCount++;
      }

      // --- Accessibility info ---
      const access = parseAccessibility(osmTags);
      if (hasAccessibilityData(access)) {
        await db
          .insert(accessibilityInfo)
          .values({ poiId, ...access })
          .onConflictDoUpdate({
            target: accessibilityInfo.poiId,
            set: access,
          });
        accessibilityCount++;
      }

      // --- Profile row ---
      try {
        await insertProfile(poiId, categorySlug, osmTags);
        profileCount++;
      } catch {
        // Profile insertion may fail if category doesn't have a profile table
      }

      // --- Cuisines ---
      if (osmTags.cuisine && cuisineSlugMap.size > 0) {
        const cuisineSlugs = parseCuisineTag(osmTags.cuisine);
        let isFirst = true;
        for (const slug of cuisineSlugs) {
          const cuisineId = cuisineSlugMap.get(slug);
          if (cuisineId) {
            await db
              .insert(poiCuisines)
              .values({ poiId, cuisineId, isPrimary: isFirst })
              .onConflictDoNothing();
            cuisineCount++;
            isFirst = false;
          }
        }
      }

      // --- Tags ---
      if (tagSlugMap.size > 0) {
        const tagSlugs = extractTagSlugs(osmTags, categorySlug);
        for (const slug of tagSlugs) {
          const tagId = tagSlugMap.get(slug);
          if (tagId) {
            await db.insert(poiTags).values({ poiId, tagId }).onConflictDoNothing();
            tagCount++;
          }
        }
      }

      // --- Translations ---
      const nameDE = osmTags["name:de"];
      const nameEN = osmTags["name:en"];

      if (nameDE) {
        await db
          .insert(poiTranslations)
          .values({ poiId, locale: "de-DE", name: nameDE, source: "osm" })
          .onConflictDoNothing();
        translationCount++;
      }

      if (nameEN) {
        await db
          .insert(poiTranslations)
          .values({ poiId, locale: "en-US", name: nameEN, source: "osm" })
          .onConflictDoNothing();
        translationCount++;
      }
    }

    console.log(`  Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(elements.length / BATCH_SIZE)} (${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} elements)`);
  }

  console.log("");
  console.log("Seeding complete!");
  console.log(`  POIs: ${poiCount}`);
  console.log(`  Contact info: ${contactCount}`);
  console.log(`  Accessibility info: ${accessibilityCount}`);
  console.log(`  Profiles: ${profileCount}`);
  console.log(`  Cuisine links: ${cuisineCount}`);
  console.log(`  Tag links: ${tagCount}`);
  console.log(`  Translations: ${translationCount}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Profile insertion dispatcher
// ---------------------------------------------------------------------------

async function insertProfile(
  poiId: string,
  categorySlug: CategorySlug,
  osmTags: Record<string, string>,
): Promise<void> {
  switch (categorySlug) {
    case "food": {
      const profile = buildFoodProfile(osmTags);
      await db
        .insert(foodProfiles)
        .values({ poiId, ...profile } as typeof foodProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: foodProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "history": {
      const profile = buildHistoryProfile(osmTags);
      await db
        .insert(historyProfiles)
        .values({ poiId, ...profile } as typeof historyProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: historyProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "architecture": {
      const profile = buildArchitectureProfile(osmTags);
      await db
        .insert(architectureProfiles)
        .values({ poiId, ...profile } as typeof architectureProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: architectureProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "nature": {
      const profile = buildNatureProfile(osmTags);
      await db
        .insert(natureProfiles)
        .values({ poiId, ...profile } as typeof natureProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: natureProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "art":
    case "culture": {
      const profile = buildArtCultureProfile(osmTags);
      await db
        .insert(artCultureProfiles)
        .values({ poiId, ...profile } as typeof artCultureProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: artCultureProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "nightlife": {
      const profile = buildNightlifeProfile(osmTags);
      await db
        .insert(nightlifeProfiles)
        .values({ poiId, ...profile } as typeof nightlifeProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: nightlifeProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "shopping": {
      const profile = buildShoppingProfile(osmTags);
      await db
        .insert(shoppingProfiles)
        .values({ poiId, ...profile } as typeof shoppingProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: shoppingProfiles.poiId,
          set: profile,
        });
      break;
    }
    case "views": {
      const profile = buildViewpointProfile(osmTags);
      await db
        .insert(viewpointProfiles)
        .values({ poiId, ...profile } as typeof viewpointProfiles.$inferInsert)
        .onConflictDoUpdate({
          target: viewpointProfiles.poiId,
          set: profile,
        });
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Fallback data (when Overpass is unavailable)
// ---------------------------------------------------------------------------

function getFallbackElements(): OverpassElement[] {
  return [
    { type: "node", id: 1, lat: 48.1374, lon: 11.5755, tags: { name: "Marienplatz", historic: "square", "name:en": "Mary's Square", "name:de": "Marienplatz" } },
    { type: "node", id: 2, lat: 48.1386, lon: 11.5730, tags: { name: "Frauenkirche", amenity: "place_of_worship", building: "church", architecture: "Gothic", "name:en": "Cathedral of Our Dear Lady", "name:de": "Frauenkirche" } },
    { type: "node", id: 3, lat: 48.1351, lon: 11.5820, tags: { name: "Viktualienmarkt", amenity: "marketplace", "name:de": "Viktualienmarkt" } },
    { type: "node", id: 4, lat: 48.1416, lon: 11.5770, tags: { name: "Residenz München", historic: "palace", tourism: "museum", "name:en": "Munich Residence", "name:de": "Residenz München" } },
    { type: "node", id: 5, lat: 48.1500, lon: 11.5819, tags: { name: "Englischer Garten", leisure: "park", "name:en": "English Garden", "name:de": "Englischer Garten" } },
    { type: "node", id: 6, lat: 48.1394, lon: 11.5792, tags: { name: "Hofbräuhaus", amenity: "biergarten", cuisine: "bavarian;german", "name:de": "Hofbräuhaus" } },
    { type: "node", id: 7, lat: 48.1397, lon: 11.5785, tags: { name: "Bayerische Staatsoper", amenity: "theatre", "name:en": "Bavarian State Opera", "name:de": "Bayerische Staatsoper" } },
    { type: "node", id: 8, lat: 48.1362, lon: 11.5767, tags: { name: "Altes Rathaus", historic: "monument", "name:en": "Old Town Hall", "name:de": "Altes Rathaus" } },
    { type: "node", id: 9, lat: 48.1363, lon: 11.5761, tags: { name: "Neues Rathaus", historic: "building", tourism: "attraction", "name:en": "New Town Hall", "name:de": "Neues Rathaus" } },
    { type: "node", id: 10, lat: 48.1451, lon: 11.5579, tags: { name: "Pinakothek der Moderne", tourism: "museum", "name:de": "Pinakothek der Moderne" } },
    { type: "node", id: 11, lat: 48.1482, lon: 11.5700, tags: { name: "Chinesischer Turm", amenity: "biergarten", cuisine: "bavarian", "name:en": "Chinese Tower", "name:de": "Chinesischer Turm" } },
    { type: "node", id: 12, lat: 48.1324, lon: 11.5830, tags: { name: "Deutsches Museum", tourism: "museum", "name:en": "German Museum", "name:de": "Deutsches Museum" } },
    { type: "node", id: 13, lat: 48.1433, lon: 11.5678, tags: { name: "Theatinerkirche", amenity: "place_of_worship", architecture: "Baroque", "name:de": "Theatinerkirche" } },
    { type: "node", id: 14, lat: 48.1395, lon: 11.5670, tags: { name: "Feldherrnhalle", historic: "monument", "name:de": "Feldherrnhalle" } },
    { type: "node", id: 15, lat: 48.1456, lon: 11.5582, tags: { name: "Alte Pinakothek", tourism: "museum", "name:en": "Old Pinakothek", "name:de": "Alte Pinakothek" } },
    { type: "node", id: 16, lat: 48.1519, lon: 11.5915, tags: { name: "Eisbachwelle", tourism: "attraction", "name:en": "Eisbach Wave", "name:de": "Eisbachwelle" } },
    { type: "node", id: 17, lat: 48.1230, lon: 11.5500, tags: { name: "Schloss Nymphenburg", historic: "castle", tourism: "museum", "name:en": "Nymphenburg Palace", "name:de": "Schloss Nymphenburg" } },
    { type: "node", id: 18, lat: 48.1411, lon: 11.5599, tags: { name: "Königsplatz", historic: "square", "name:de": "Königsplatz" } },
    { type: "node", id: 19, lat: 48.1528, lon: 11.5817, tags: { name: "Monopteros", historic: "monument", tourism: "viewpoint", "name:de": "Monopteros" } },
    { type: "node", id: 20, lat: 48.1343, lon: 11.5648, tags: { name: "Sendlinger Tor", historic: "city_gate", "name:en": "Sendling Gate", "name:de": "Sendlinger Tor" } },
    { type: "node", id: 21, lat: 48.1378, lon: 11.5716, tags: { name: "Asamkirche", amenity: "place_of_worship", architecture: "Baroque", "name:de": "Asamkirche" } },
    { type: "node", id: 22, lat: 48.1405, lon: 11.5648, tags: { name: "Michaelskirche", amenity: "place_of_worship", architecture: "Renaissance", "name:en": "St. Michael's Church", "name:de": "Michaelskirche" } },
    { type: "node", id: 23, lat: 48.1352, lon: 11.5749, tags: { name: "Peterskirche", amenity: "place_of_worship", tourism: "viewpoint", "name:en": "St. Peter's Church", "name:de": "Peterskirche" } },
    { type: "node", id: 24, lat: 48.1377, lon: 11.5892, tags: { name: "Maximilianeum", historic: "building", "name:de": "Maximilianeum" } },
    { type: "node", id: 25, lat: 48.1420, lon: 11.5770, tags: { name: "Odeonsplatz", historic: "square", "name:de": "Odeonsplatz" } },
  ];
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
