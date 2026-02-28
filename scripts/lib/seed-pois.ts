/**
 * Seeds POIs from a local OSM PBF extract into the database.
 *
 * @module seed-pois
 */

import { db } from "../../src/lib/db/client";
import {
  categories,
  pois,
  regions,
  contactInfo,
  accessibilityInfo,
  cuisines,
  poiCuisines,
  poiTags,
  tags,
} from "../../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { CategorySlug } from "../../src/types";
import type { OverpassElement } from "../../src/types/api";
import { readPoisFromPbf } from "./pbf-reader";
import { processWithConcurrency } from "./concurrency";
import { createLogger } from "../../src/lib/logger";
import type { LocationConfig } from "../../src/lib/geo/locations";
import { getCategorySlugFromTags } from "../../src/lib/geo/categories";
import { buildProfile } from "../../src/lib/poi/profile";

const log = createLogger("seed-pois");

/**
 * Builds a full Wikipedia URL from an OSM wikipedia tag value.
 *
 * @param osmTag - OSM wikipedia tag (format: "lang:Title", e.g. "de:Maximilianeum").
 * @returns Full Wikipedia URL with correct language subdomain, or undefined if malformed.
 */
function buildWikipediaUrl(osmTag: string): string | undefined {
  const match = osmTag.match(/^([a-z]{2,3}):(.+)$/);
  if (!match) return undefined;
  const [, lang, title] = match;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

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

/**
 * Splits a semicolon-delimited OSM tag value into trimmed parts.
 *
 * @param value - Semicolon-separated string or undefined.
 * @returns Array of non-empty trimmed strings, or null if empty/undefined.
 */
function splitSemicolon(value: string | undefined): string[] | null {
  if (!value) return null;
  const parts = value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

/**
 * Extracts contact information from OSM tags.
 *
 * @param osmTags - Raw OSM tags from the element.
 * @returns Object with phone, email, website, social media, and opening hours fields.
 */
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

/**
 * Checks if any contact fields are populated.
 *
 * @param data - Parsed contact info object.
 * @returns True if at least one field is non-null.
 */
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

/**
 * Extracts accessibility information from OSM tags.
 *
 * @param osmTags - Raw OSM tags from the element.
 * @returns AccessibilityData with wheelchair, elevator, dog-friendly, and parking fields.
 */
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

/**
 * Checks if any accessibility fields are populated.
 *
 * @param data - Parsed accessibility data object.
 * @returns True if at least one field is non-null.
 */
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

/**
 * Parses an OSM cuisine tag into normalized slug values.
 *
 * @param cuisineValue - Semicolon-separated cuisine string from OSM.
 * @returns Array of lowercase, underscore-separated cuisine slugs.
 */
function parseCuisineTag(cuisineValue: string): string[] {
  return cuisineValue
    .split(";")
    .map((c) => c.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

/**
 * Extracts tag slugs from OSM tags for linking to the tags table.
 *
 * @param osmTags - Raw OSM tags from the element.
 * @param categorySlug - Determined category for this POI.
 * @returns Array of tag slug strings matching known tags.
 */
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

interface ProcessResult {
  pois: number;
  contacts: number;
  accessibility: number;
  cuisines: number;
  tags: number;
}

/**
 * Creates an empty ProcessResult with all counters at zero.
 *
 * @returns ProcessResult with zeroed counters.
 */
function emptyResult(): ProcessResult {
  return { pois: 0, contacts: 0, accessibility: 0, cuisines: 0, tags: 0 };
}

/**
 * Sums an array of ProcessResult objects into a single total.
 *
 * @param results - Array of ProcessResult objects.
 * @returns Aggregated ProcessResult with summed counters.
 */
function sumResults(results: ProcessResult[]): ProcessResult {
  const totals = emptyResult();
  for (const r of results) {
    totals.pois += r.pois;
    totals.contacts += r.contacts;
    totals.accessibility += r.accessibility;
    totals.cuisines += r.cuisines;
    totals.tags += r.tags;
  }
  return totals;
}

/**
 * Inserts cuisine links for a POI based on its OSM cuisine tag.
 *
 * @param poiId - Database ID of the POI.
 * @param osmTags - Raw OSM tags from the element.
 * @param cuisineSlugMap - Map of cuisine slug to database ID.
 * @returns Number of cuisine links inserted.
 */
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

/**
 * Inserts tag links for a POI based on its OSM tags and category.
 *
 * @param poiId - Database ID of the POI.
 * @param osmTags - Raw OSM tags from the element.
 * @param categorySlug - Determined category for this POI.
 * @param tagSlugMap - Map of tag slug to database ID.
 * @returns Number of tag links inserted.
 */
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

/**
 * Seeds POIs from a local OSM PBF extract for the given location.
 * Processes elements in batches with concurrent database writes.
 *
 * @param location - Location config providing city center, PBF path, and seed radius.
 */
export async function seedPois(location: LocationConfig): Promise<void> {
  const seedRadius = location.seedRadius;
  log.info(`Seeding POIs for ${location.city.name} (radius: ${seedRadius}m)`);

  log.info("Seeding categories...");
  await db.insert(categories).values(CATEGORY_DATA).onConflictDoNothing();
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  log.info(`Categories ready: ${categoryMap.size}`);

  const cityRegion = await db
    .select()
    .from(regions)
    .where(eq(regions.slug, location.city.slug));
  const cityRegionId = cityRegion.at(0)?.id ?? null;
  if (!cityRegionId) {
    log.warn(
      `${location.city.name} region not found. Run seed --step regions first. Proceeding without region_id.`,
    );
  }

  const allCuisines = await db.select().from(cuisines);
  const cuisineSlugMap = new Map<string, string>();
  for (const c of allCuisines) {
    cuisineSlugMap.set(c.slug, c.id);
  }
  if (cuisineSlugMap.size === 0) {
    log.warn("No cuisines found. Run seed --step cuisines first. Cuisine linking will be skipped.");
  }

  const allTags = await db.select().from(tags);
  const tagSlugMap = new Map<string, string>();
  for (const t of allTags) {
    tagSlugMap.set(t.slug, t.id);
  }
  if (tagSlugMap.size === 0) {
    log.warn("No tags found. Run seed --step tags first. Tag linking will be skipped.");
  }

  const pbfPath = process.env.PBF_FILE_PATH || `data/${location.pbfFilename}`;
  const center = { lat: location.city.lat, lon: location.city.lon };

  log.info(`Reading POIs from PBF extract (${pbfPath})...`);
  const elements = await readPoisFromPbf(pbfPath, center, seedRadius);
  log.info(`Total unique elements: ${elements.length}`);

  if (elements.length === 0) {
    log.warn("No POIs found in PBF extract. Check SEED_RADIUS and PBF file.");
    return;
  }

  log.info("Processing POIs...");

  const totals = emptyResult();
  const BATCH_SIZE = 50;
  const CONCURRENCY = 20;

  /**
   * Processes a single OSM element: upserts the POI and inserts related data.
   *
   * @param el - OverpassElement from the PBF reader.
   * @returns ProcessResult with counts of inserted rows.
   */
  async function processElement(el: OverpassElement): Promise<ProcessResult> {
    const result = emptyResult();

    const osmTags = el.tags;
    if (!osmTags?.name) return result;

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) return result;

    const categorySlug = getCategorySlugFromTags(osmTags);
    const categoryId = categoryMap.get(categorySlug);

    const address = osmTags["addr:street"]
      ? `${osmTags["addr:street"]} ${osmTags["addr:housenumber"] ?? ""}, ${location.city.name}`.trim()
      : null;

    const wikipediaUrl = osmTags.wikipedia ? buildWikipediaUrl(osmTags.wikipedia) ?? null : null;

    const profile = buildProfile(osmTags, categorySlug);

    const [insertedPoi] = await db
      .insert(pois)
      .values({
        osmId: el.id,
        name: osmTags.name,
        categoryId: categoryId ?? null,
        regionId: cityRegionId,
        latitude: lat,
        longitude: lon,
        address,
        locale: location.locale,
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

    await Promise.all(
      [
        hasContactData(contact)
          ? db
              .insert(contactInfo)
              .values({ poiId, ...contact })
              .onConflictDoUpdate({ target: contactInfo.poiId, set: contact })
              .then(() => {
                result.contacts++;
              })
          : null,

        hasAccessibilityData(access)
          ? db
              .insert(accessibilityInfo)
              .values({ poiId, ...access })
              .onConflictDoUpdate({ target: accessibilityInfo.poiId, set: access })
              .then(() => {
                result.accessibility++;
              })
          : null,

        insertCuisinesForPoi(poiId, osmTags, cuisineSlugMap).then((n) => {
          result.cuisines += n;
        }),

        insertTagsForPoi(poiId, osmTags, categorySlug, tagSlugMap).then((n) => {
          result.tags += n;
        }),
      ].filter(Boolean),
    );

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

    log.info(
      `Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(elements.length / BATCH_SIZE)} (${Math.min(i + BATCH_SIZE, elements.length)}/${elements.length} elements)`,
    );
  }

  log.success(
    `Seeding complete! POIs: ${totals.pois}, contacts: ${totals.contacts}, accessibility: ${totals.accessibility}, cuisines: ${totals.cuisines}, tags: ${totals.tags}`,
  );
}
