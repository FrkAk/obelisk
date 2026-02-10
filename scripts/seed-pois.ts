import { db } from "../src/lib/db/client";
import { categories, pois } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";
import type { CategorySlug } from "../src/types";

const MUNICH_CENTER = {
  lat: 48.137154,
  lon: 11.576124,
};

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
    filters: [
      '["historic"]["name"]',
    ],
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
    filters: [
      '["shop"]["name"]',
    ],
  },
  {
    label: "Healthcare",
    filters: [
      '["healthcare"]["name"]',
    ],
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

/**
 * Fetches POIs from Overpass API for a single query group.
 *
 * Args:
 *     group: Query group containing label and OSM filters.
 *
 * Returns:
 *     Array of Overpass elements matching the filters.
 */
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

/**
 * Fetches all Munich POIs by querying Overpass in groups to avoid timeouts.
 *
 * Returns:
 *     Combined array of all Overpass elements across all query groups.
 */
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

/**
 * Determines the category slug based on OSM tags.
 *
 * Args:
 *     tags: OSM tag key-value pairs.
 *
 * Returns:
 *     The most appropriate category slug for the given tags.
 */
function determineCategorySlug(tags: Record<string, string>): CategorySlug {
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

  const natureLeiure = ["park", "garden", "nature_reserve"];
  if (natureLeiure.includes(tags.leisure) || tags.natural) return "nature";

  const sportsLeisure = ["sports_centre", "stadium", "fitness_centre", "swimming_pool", "pitch"];
  if (sportsLeisure.includes(tags.leisure)) return "sports";

  if (tags.amenity === "theatre" || tags.amenity === "cinema" || tags.amenity === "community_centre") return "culture";

  if (tags.amenity === "bus_station" || tags.railway) return "transport";

  if (tags.tourism === "hotel" || tags.tourism === "hostel" || tags.tourism === "guest_house") return "services";

  if (tags.architect || tags.building === "church" || tags.amenity === "place_of_worship") return "architecture";

  return "hidden";
}

/**
 * Extracts the primary amenity type from OSM tags.
 *
 * Args:
 *     tags: OSM tag key-value pairs.
 *
 * Returns:
 *     The primary amenity type string or null.
 */
function extractAmenityType(tags: Record<string, string>): string | null {
  return tags.amenity || tags.tourism || tags.shop || tags.leisure || tags.historic || tags.healthcare || tags.railway || null;
}

/**
 * Converts an Overpass element to a POI database row.
 *
 * Args:
 *     el: Overpass element with coordinates and tags.
 *     categoryMap: Map from category slug to category UUID.
 *
 * Returns:
 *     POI data object ready for database insertion, or null if invalid.
 */
function elementToPoi(
  el: OverpassElement,
  categoryMap: Map<CategorySlug, string>
): Record<string, unknown> | null {
  const tags = el.tags;
  if (!tags?.name) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) return null;

  const categorySlug = determineCategorySlug(tags);
  const categoryId = categoryMap.get(categorySlug);

  return {
    osmId: el.id,
    name: tags.name,
    categoryId: categoryId ?? null,
    latitude: lat,
    longitude: lon,
    address: tags["addr:street"]
      ? `${tags["addr:street"]} ${tags["addr:housenumber"] ?? ""}, Munich`
      : null,
    wikipediaUrl: tags.wikipedia
      ? `https://en.wikipedia.org/wiki/${tags.wikipedia.split(":")[1]}`
      : null,
    imageUrl: tags.image ?? null,
    osmTags: tags,
    osmAmenity: extractAmenityType(tags),
    osmCuisine: tags.cuisine ?? null,
  };
}

/**
 * Inserts POIs into the database in batches, upserting on OSM ID conflict.
 *
 * Args:
 *     poiData: Array of POI data objects to insert.
 *
 * Returns:
 *     Total number of upserted rows.
 */
async function batchInsertPois(poiData: Array<Record<string, unknown>>): Promise<number> {
  const BATCH_SIZE = 100;
  let total = 0;

  for (let i = 0; i < poiData.length; i += BATCH_SIZE) {
    const batch = poiData.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(pois)
      .values(batch as typeof pois.$inferInsert[])
      .onConflictDoUpdate({
        target: pois.osmId,
        set: {
          name: sql`EXCLUDED.name`,
          categoryId: sql`EXCLUDED.category_id`,
          latitude: sql`EXCLUDED.latitude`,
          longitude: sql`EXCLUDED.longitude`,
          address: sql`EXCLUDED.address`,
          wikipediaUrl: sql`EXCLUDED.wikipedia_url`,
          imageUrl: sql`EXCLUDED.image_url`,
          osmTags: sql`EXCLUDED.osm_tags`,
          osmAmenity: sql`EXCLUDED.osm_amenity`,
          osmCuisine: sql`EXCLUDED.osm_cuisine`,
        },
      })
      .returning({ id: pois.id });

    total += result.length;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: upserted ${result.length} POIs`);
  }

  return total;
}

async function main() {
  console.log(`Seeding Obelisk POIs (radius: ${SEED_RADIUS}m)`);
  console.log("");

  console.log("Seeding categories...");
  const insertedCategories = await db
    .insert(categories)
    .values(CATEGORY_DATA)
    .onConflictDoNothing()
    .returning();

  const categoryMap = new Map<CategorySlug, string>();
  const allCategories = insertedCategories.length > 0
    ? insertedCategories
    : await db.select().from(categories);

  for (const cat of allCategories) {
    categoryMap.set(cat.slug as CategorySlug, cat.id);
  }
  console.log(`Categories ready: ${categoryMap.size}`);
  console.log("");

  console.log("Fetching Munich POIs from Overpass API...");
  const elements = await fetchAllPois();
  console.log(`Total unique elements: ${elements.length}`);
  console.log("");

  const poiData = elements
    .map((el) => elementToPoi(el, categoryMap))
    .filter((poi): poi is NonNullable<typeof poi> => poi !== null);

  console.log(`Prepared ${poiData.length} POIs for insertion`);

  if (poiData.length > 0) {
    const total = await batchInsertPois(poiData);
    console.log(`Upserted ${total} POIs total`);
  }

  if (poiData.length === 0) {
    console.log("No POIs found from Overpass, inserting fallback data...");
    const fallback = getFallbackPois(categoryMap);
    if (fallback.length > 0) {
      const total = await batchInsertPois(fallback);
      console.log(`Inserted ${total} fallback POIs`);
    }
  }

  console.log("");
  console.log("Seeding complete!");
  process.exit(0);
}

/**
 * Returns hardcoded fallback POIs when Overpass API is unavailable.
 *
 * Args:
 *     categoryMap: Map from category slug to category UUID.
 *
 * Returns:
 *     Array of fallback POI data objects.
 */
function getFallbackPois(categoryMap: Map<CategorySlug, string>): Array<Record<string, unknown>> {
  const fallbackElements: OverpassElement[] = [
    { type: "node", id: 1, lat: 48.1374, lon: 11.5755, tags: { name: "Marienplatz", historic: "square" } },
    { type: "node", id: 2, lat: 48.1386, lon: 11.5730, tags: { name: "Frauenkirche", amenity: "place_of_worship", building: "church" } },
    { type: "node", id: 3, lat: 48.1351, lon: 11.5820, tags: { name: "Viktualienmarkt", amenity: "marketplace" } },
    { type: "node", id: 4, lat: 48.1416, lon: 11.5770, tags: { name: "Residenz München", historic: "palace", tourism: "museum" } },
    { type: "node", id: 5, lat: 48.1500, lon: 11.5819, tags: { name: "Englischer Garten", leisure: "park" } },
    { type: "node", id: 6, lat: 48.1394, lon: 11.5792, tags: { name: "Hofbräuhaus", amenity: "biergarten" } },
    { type: "node", id: 7, lat: 48.1397, lon: 11.5785, tags: { name: "Bayerische Staatsoper", amenity: "theatre" } },
    { type: "node", id: 8, lat: 48.1362, lon: 11.5767, tags: { name: "Altes Rathaus", historic: "monument" } },
    { type: "node", id: 9, lat: 48.1363, lon: 11.5761, tags: { name: "Neues Rathaus", historic: "building", tourism: "attraction" } },
    { type: "node", id: 10, lat: 48.1451, lon: 11.5579, tags: { name: "Pinakothek der Moderne", tourism: "museum" } },
    { type: "node", id: 11, lat: 48.1482, lon: 11.5700, tags: { name: "Chinesischer Turm", amenity: "biergarten" } },
    { type: "node", id: 12, lat: 48.1324, lon: 11.5830, tags: { name: "Deutsches Museum", tourism: "museum" } },
    { type: "node", id: 13, lat: 48.1433, lon: 11.5678, tags: { name: "Theatinerkirche", amenity: "place_of_worship" } },
    { type: "node", id: 14, lat: 48.1395, lon: 11.5670, tags: { name: "Feldherrnhalle", historic: "monument" } },
    { type: "node", id: 15, lat: 48.1456, lon: 11.5582, tags: { name: "Alte Pinakothek", tourism: "museum" } },
    { type: "node", id: 16, lat: 48.1519, lon: 11.5915, tags: { name: "Eisbachwelle", tourism: "attraction" } },
    { type: "node", id: 17, lat: 48.1230, lon: 11.5500, tags: { name: "Schloss Nymphenburg", historic: "castle", tourism: "museum" } },
    { type: "node", id: 18, lat: 48.1411, lon: 11.5599, tags: { name: "Königsplatz", historic: "square" } },
    { type: "node", id: 19, lat: 48.1528, lon: 11.5817, tags: { name: "Monopteros", historic: "monument", tourism: "viewpoint" } },
    { type: "node", id: 20, lat: 48.1343, lon: 11.5648, tags: { name: "Sendlinger Tor", historic: "city_gate" } },
    { type: "node", id: 21, lat: 48.1378, lon: 11.5716, tags: { name: "Asamkirche", amenity: "place_of_worship" } },
    { type: "node", id: 22, lat: 48.1405, lon: 11.5648, tags: { name: "Michaelskirche", amenity: "place_of_worship" } },
    { type: "node", id: 23, lat: 48.1352, lon: 11.5749, tags: { name: "Peterskirche", amenity: "place_of_worship", tourism: "viewpoint" } },
    { type: "node", id: 24, lat: 48.1377, lon: 11.5892, tags: { name: "Maximilianeum", historic: "building" } },
    { type: "node", id: 25, lat: 48.1420, lon: 11.5770, tags: { name: "Odeonsplatz", historic: "square" } },
  ];

  return fallbackElements
    .map((el) => elementToPoi(el, categoryMap))
    .filter((poi): poi is NonNullable<typeof poi> => poi !== null);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
