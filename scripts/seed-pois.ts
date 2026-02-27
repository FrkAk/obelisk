import { db } from "../src/lib/db/client";
import {
  categories,
  pois,
  regions,
  contactInfo,
  accessibilityInfo,
  cuisines,
  poiCuisines,
  poiTags,
  poiTranslations,
  tags,
} from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { CategorySlug } from "../src/types";
import type { PoiProfile } from "../src/types/api";
import { readPoisFromPbf } from "./lib/pbf-reader";
import { processWithConcurrency } from "./lib/concurrency";
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a full Wikipedia URL from an OSM wikipedia tag value.
 *
 * Args:
 *     osmTag: OSM wikipedia tag (format: "lang:Title", e.g. "de:Maximilianeum").
 *
 * Returns:
 *     Full Wikipedia URL with correct language subdomain, or undefined if the tag is malformed.
 */
function buildWikipediaUrl(osmTag: string): string | undefined {
  const match = osmTag.match(/^([a-z]{2,3}):(.+)$/);
  if (!match) return undefined;
  const [, lang, title] = match;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MUNICH_CENTER = { lat: 48.137154, lon: 11.576124 };
const SEED_RADIUS = parseInt(process.env.SEED_RADIUS || "100", 10);

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
// PBF element type (matches shape produced by pbf-reader)
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const PBF_PATH = process.env.PBF_FILE_PATH || "data/Muenchen.osm.pbf";

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

function splitSemicolon(value: string | undefined): string[] | null {
  if (!value) return null;
  const parts = value.split(";").map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parseContactInfo(osmTags: Record<string, string>) {
  return {
    phone: splitSemicolon(osmTags.phone ?? osmTags["contact:phone"]),
    email: splitSemicolon(osmTags.email ?? osmTags["contact:email"]),
    website: splitSemicolon(osmTags.website ?? osmTags["contact:website"]),
    bookingUrl: osmTags["reservation:url"] ?? null,
    instagram: osmTags["contact:instagram"] ?? null,
    facebook: osmTags["contact:facebook"] ?? null,
    openingHoursRaw: osmTags.opening_hours ?? null,
  };
}

function hasContactData(data: ReturnType<typeof parseContactInfo>): boolean {
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
// Profile builder — extracts OSM data into a unified PoiProfile JSONB
// ---------------------------------------------------------------------------

/**
 * Builds a PoiProfile from OSM tags for the given category.
 * Extracts subtype, OSM-specific subtag values, and category-specific attributes.
 *
 * Args:
 *     osmTags: Raw OSM tags from the PBF element.
 *     categorySlug: Determined category for this POI.
 *
 * Returns:
 *     A PoiProfile with seed-time data (keywords/products/summary filled by enrich-taxonomy).
 */
function buildProfile(osmTags: Record<string, string>, categorySlug: CategorySlug): PoiProfile {
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
// Concurrency utilities
// ---------------------------------------------------------------------------

interface ProcessResult {
  pois: number;
  contacts: number;
  accessibility: number;
  cuisines: number;
  tags: number;
  translations: number;
}

function emptyResult(): ProcessResult {
  return { pois: 0, contacts: 0, accessibility: 0, cuisines: 0, tags: 0, translations: 0 };
}

function sumResults(results: ProcessResult[]): ProcessResult {
  const totals = emptyResult();
  for (const r of results) {
    totals.pois += r.pois;
    totals.contacts += r.contacts;
    totals.accessibility += r.accessibility;
    totals.cuisines += r.cuisines;
    totals.tags += r.tags;
    totals.translations += r.translations;
  }
  return totals;
}

// processWithConcurrency imported from ./lib/concurrency

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
  console.log("Reading Munich POIs from PBF extract...");
  let elements = await readPoisFromPbf(PBF_PATH, MUNICH_CENTER, SEED_RADIUS);
  console.log(`Total unique elements: ${elements.length}`);

  if (elements.length === 0) {
    console.log("No POIs from PBF extract, using fallback data...");
    elements = getFallbackElements();
  }

  // --- Process and insert POIs ---

  console.log("");
  console.log("Processing POIs...");

  const totals = emptyResult();
  const BATCH_SIZE = 50;
  const CONCURRENCY = 20;

  async function processElement(el: OverpassElement): Promise<ProcessResult> {
    const result = emptyResult();

    const osmTags = el.tags;
    if (!osmTags?.name) return result;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return result;

    const categorySlug = determineCategorySlug(osmTags);
    const categoryId = categoryMap.get(categorySlug);

    const address = osmTags["addr:street"]
      ? `${osmTags["addr:street"]} ${osmTags["addr:housenumber"] ?? ""}, Munich`.trim()
      : null;

    const wikipediaUrl = osmTags.wikipedia
      ? buildWikipediaUrl(osmTags.wikipedia) ?? null
      : null;

    const profile = buildProfile(osmTags, categorySlug);

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
        profile,
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
          profile: sql`EXCLUDED.profile`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: pois.id });

    if (!insertedPoi) return result;
    const poiId = insertedPoi.id;
    result.pois++;

    const contact = parseContactInfo(osmTags);
    const access = parseAccessibility(osmTags);

    await Promise.all([
      hasContactData(contact)
        ? db
            .insert(contactInfo)
            .values({ poiId, ...contact })
            .onConflictDoUpdate({ target: contactInfo.poiId, set: contact })
            .then(() => { result.contacts++; })
        : null,

      hasAccessibilityData(access)
        ? db
            .insert(accessibilityInfo)
            .values({ poiId, ...access })
            .onConflictDoUpdate({ target: accessibilityInfo.poiId, set: access })
            .then(() => { result.accessibility++; })
        : null,

      insertCuisinesForPoi(poiId, osmTags, cuisineSlugMap)
        .then((n) => { result.cuisines += n; }),

      insertTagsForPoi(poiId, osmTags, categorySlug, tagSlugMap)
        .then((n) => { result.tags += n; }),

      insertTranslationsForPoi(poiId, osmTags)
        .then((n) => { result.translations += n; }),
    ].filter(Boolean));

    return result;
  }

  for (let i = 0; i < elements.length; i += BATCH_SIZE) {
    const batch = elements.slice(i, i + BATCH_SIZE);

    const batchResults = await processWithConcurrency(batch, CONCURRENCY, processElement);
    const batchTotals = sumResults(batchResults);

    totals.pois += batchTotals.pois;
    totals.contacts += batchTotals.contacts;
    totals.accessibility += batchTotals.accessibility;
    totals.cuisines += batchTotals.cuisines;
    totals.tags += batchTotals.tags;
    totals.translations += batchTotals.translations;

    console.log(`  Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(elements.length / BATCH_SIZE)} (${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} elements)`);
  }

  console.log("");
  console.log("Seeding complete!");
  console.log(`  POIs: ${totals.pois}`);
  console.log(`  Contact info: ${totals.contacts}`);
  console.log(`  Accessibility info: ${totals.accessibility}`);
  console.log(`  Cuisine links: ${totals.cuisines}`);
  console.log(`  Tag links: ${totals.tags}`);
  console.log(`  Translations: ${totals.translations}`);
  process.exit(0);
}


// ---------------------------------------------------------------------------
// Batch insert helpers (Layer 3: multi-row inserts)
// ---------------------------------------------------------------------------

async function insertCuisinesForPoi(
  poiId: string,
  osmTags: Record<string, string>,
  cuisineSlugMap: Map<string, string>,
): Promise<number> {
  if (!osmTags.cuisine || cuisineSlugMap.size === 0) return 0;

  const cuisineSlugs = parseCuisineTag(osmTags.cuisine);
  const cuisineValues = cuisineSlugs
    .map((slug, i) => {
      const cuisineId = cuisineSlugMap.get(slug);
      return cuisineId ? { poiId, cuisineId, isPrimary: i === 0 } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (cuisineValues.length === 0) return 0;
  await db.insert(poiCuisines).values(cuisineValues).onConflictDoNothing();
  return cuisineValues.length;
}

async function insertTagsForPoi(
  poiId: string,
  osmTags: Record<string, string>,
  categorySlug: CategorySlug,
  tagSlugMap: Map<string, string>,
): Promise<number> {
  if (tagSlugMap.size === 0) return 0;

  const tagSlugs = extractTagSlugs(osmTags, categorySlug);
  const tagValues = tagSlugs
    .map((slug) => {
      const tagId = tagSlugMap.get(slug);
      return tagId ? { poiId, tagId } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (tagValues.length === 0) return 0;
  await db.insert(poiTags).values(tagValues).onConflictDoNothing();
  return tagValues.length;
}

async function insertTranslationsForPoi(
  poiId: string,
  osmTags: Record<string, string>,
): Promise<number> {
  const translationValues: Array<{ poiId: string; locale: string; name: string; source: string }> = [];

  const nameDE = osmTags["name:de"];
  const nameEN = osmTags["name:en"];

  if (nameDE) translationValues.push({ poiId, locale: "de-DE", name: nameDE, source: "osm" });
  if (nameEN) translationValues.push({ poiId, locale: "en-US", name: nameEN, source: "osm" });

  if (translationValues.length === 0) return 0;
  await db.insert(poiTranslations).values(translationValues).onConflictDoNothing();
  return translationValues.length;
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
