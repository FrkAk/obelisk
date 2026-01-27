import { db } from "../src/lib/db/client";
import { categories, pois } from "../src/lib/db/schema";
import type { CategorySlug } from "../src/types";

const MUNICH_CENTER = {
  lat: 48.137154,
  lon: 11.576124,
};

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

async function fetchMunichPois(): Promise<OverpassElement[]> {
  const overpassQuery = `
    [out:json][timeout:90];
    (
      node["historic"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
      node["tourism"="museum"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
      node["amenity"="place_of_worship"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
      node["amenity"="biergarten"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
      node["amenity"="theatre"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
      node["tourism"="viewpoint"]["name"](around:2000,${MUNICH_CENTER.lat},${MUNICH_CENTER.lon});
    );
    out body;
  `;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Attempt ${attempt}/3...`);
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data: OverpassResponse = await response.json();
      return data.elements;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      if (attempt === 3) {
        console.log("Using fallback POI data...");
        return getFallbackPois();
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return getFallbackPois();
}

function getFallbackPois(): OverpassElement[] {
  return [
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
}

function determineCategorySlug(tags: Record<string, string>): CategorySlug {
  if (tags.historic) return "history";
  if (tags.tourism === "museum") return "art";
  if (tags.tourism === "viewpoint") return "views";
  if (tags.amenity === "biergarten" || tags.amenity === "restaurant") return "food";
  if (tags.leisure === "park" || tags.natural) return "nature";
  if (tags.amenity === "theatre") return "culture";
  if (tags.architect || tags.building === "church") return "architecture";
  return "hidden";
}

async function main() {
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

  console.log("Fetching Munich POIs from Overpass API...");
  const elements = await fetchMunichPois();
  console.log(`Found ${elements.length} elements from Overpass`);

  const poiData = elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;

      if (!lat || !lon) return null;

      const tags = el.tags || {};
      const categorySlug = determineCategorySlug(tags);
      const categoryId = categoryMap.get(categorySlug);

      return {
        osmId: el.id,
        name: tags.name!,
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
      };
    })
    .filter((poi): poi is NonNullable<typeof poi> => poi !== null);

  console.log(`Prepared ${poiData.length} POIs for insertion`);

  if (poiData.length > 0) {
    const inserted = await db
      .insert(pois)
      .values(poiData)
      .onConflictDoNothing()
      .returning();

    console.log(`Inserted ${inserted.length} new POIs`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
