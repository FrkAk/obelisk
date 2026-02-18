import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  remarks,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  poiTranslations,
  poiTags,
  tags,
  poiDishes,
  dishes,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { initCollection, upsertDocuments } from "../src/lib/search/typesense";
import type { TypesensePoiDocument } from "../src/lib/search/typesense";
import { createLogger } from "../src/lib/logger";

const log = createLogger("sync-typesense");

const BATCH_SIZE = 100;

const PRICE_LEVEL_MAP: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

const PRICE_LEVEL_LABEL: Record<number, string> = {
  1: "Budget",
  2: "Moderate",
  3: "Upscale",
  4: "Fine dining",
};

/**
 * Builds a natural language profile summary for a food POI.
 *
 * Args:
 *     fp: The food profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildFoodSummary(fp: typeof foodProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (fp.establishmentType) parts.push(capitalize(fp.establishmentType));
  if (fp.priceLevel) parts.push(PRICE_LEVEL_LABEL[fp.priceLevel] ?? `Price ${fp.priceLevel}`);
  if (fp.ambiance) parts.push(capitalize(fp.ambiance));
  if (fp.dietVegetarian === "yes") parts.push("Vegetarian options");
  if (fp.dietVegetarian === "only") parts.push("Vegetarian only");
  if (fp.dietVegan === "yes") parts.push("Vegan options");
  if (fp.dietVegan === "only") parts.push("Vegan only");
  if (fp.dietHalal === "yes" || fp.dietHalal === "only") parts.push("Halal");
  if (fp.dietGlutenFree === "yes") parts.push("Gluten-free options");
  if (fp.hasOutdoorSeating) parts.push("Outdoor seating");
  if (fp.hasWifi) parts.push("WiFi");
  if (fp.hasLiveMusic) parts.push("Live music");
  if (fp.michelinStars && fp.michelinStars > 0) parts.push(`${fp.michelinStars} Michelin star${fp.michelinStars > 1 ? "s" : ""}`);
  if (fp.michelinBib) parts.push("Bib Gourmand");
  if (fp.reservationPolicy) parts.push(`Reservations: ${fp.reservationPolicy}`);
  if (fp.kidFriendly) parts.push("Kid-friendly");

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for a history POI.
 *
 * Args:
 *     hp: The history profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildHistorySummary(hp: typeof historyProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (hp.subtype) parts.push(capitalize(hp.subtype));
  if (hp.yearBuilt) parts.push(`Built ${hp.yearBuilt}`);
  if (hp.yearDestroyed) parts.push(`Destroyed ${hp.yearDestroyed}`);
  if (hp.heritageLevel) parts.push(`${capitalize(hp.heritageLevel)} heritage`);
  if (hp.preservationStatus) parts.push(capitalize(hp.preservationStatus));
  if (hp.originalPurpose) parts.push(`Originally: ${hp.originalPurpose}`);
  if (hp.currentUse) parts.push(`Now: ${hp.currentUse}`);
  if (hp.keyFigures && hp.keyFigures.length > 0) parts.push(`Key figures: ${hp.keyFigures.slice(0, 3).join(", ")}`);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for an architecture POI.
 *
 * Args:
 *     ap: The architecture profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildArchitectureSummary(ap: typeof architectureProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (ap.subtype) parts.push(capitalize(ap.subtype));
  if (ap.primaryStyle) parts.push(ap.primaryStyle);
  if (ap.architect) parts.push(`Architect: ${ap.architect}`);
  if (ap.yearBuilt) parts.push(`Built ${ap.yearBuilt}`);
  if (ap.yearRenovated) parts.push(`Renovated ${ap.yearRenovated}`);
  if (ap.denomination) parts.push(capitalize(ap.denomination));
  if (ap.towerAccessible) parts.push("Tower accessible");
  if (ap.heightMeters) parts.push(`${ap.heightMeters}m tall`);
  if (ap.constructionMaterials && ap.constructionMaterials.length > 0) {
    parts.push(ap.constructionMaterials.join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for a nature POI.
 *
 * Args:
 *     np: The nature profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildNatureSummary(np: typeof natureProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (np.subtype) parts.push(capitalize(np.subtype));
  if (np.areaHectares) parts.push(`${np.areaHectares} hectares`);
  if (np.trailDifficulty) parts.push(`${capitalize(np.trailDifficulty)} trails`);
  if (np.trailLengthKm) parts.push(`${np.trailLengthKm}km of trails`);
  if (np.picnicAllowed) parts.push("Picnic area");
  if (np.swimmingAllowed) parts.push("Swimming");
  if (np.cyclingAllowed) parts.push("Cycling");
  if (np.litAtNight) parts.push("Lit at night");
  if (np.facilities && np.facilities.length > 0) {
    parts.push(np.facilities.slice(0, 4).join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for an art/culture POI.
 *
 * Args:
 *     ac: The art/culture profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildArtCultureSummary(ac: typeof artCultureProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (ac.subtype) parts.push(capitalize(ac.subtype));
  if (ac.collectionFocus) parts.push(ac.collectionFocus);
  if (ac.genreFocus) parts.push(ac.genreFocus);
  if (ac.foundedYear) parts.push(`Founded ${ac.foundedYear}`);
  if (ac.guidedTours) parts.push("Guided tours");
  if (ac.audioGuide) parts.push("Audio guide");
  if (ac.photographyAllowed) parts.push("Photography allowed");
  if (ac.avgVisitMinutes) parts.push(`~${ac.avgVisitMinutes} min visit`);
  if (ac.capacity) parts.push(`Capacity: ${ac.capacity}`);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for a nightlife POI.
 *
 * Args:
 *     nl: The nightlife profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildNightlifeSummary(nl: typeof nightlifeProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (nl.subtype) parts.push(capitalize(nl.subtype));
  if (nl.dressCode) parts.push(`Dress code: ${nl.dressCode}`);
  if (nl.coverCharge) parts.push(`Cover: ${nl.coverCharge}${nl.coverCurrency ?? "EUR"}`);
  if (nl.happyHour) parts.push(`Happy hour: ${nl.happyHour}`);
  if (nl.hasDancefloor) parts.push("Dancefloor");
  if (nl.hasLiveMusic) parts.push("Live music");
  if (nl.hasDj) parts.push("DJ");
  if (nl.outdoorArea) parts.push("Outdoor area");
  if (nl.ageDemographic) parts.push(nl.ageDemographic);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for a shopping POI.
 *
 * Args:
 *     sp: The shopping profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildShoppingSummary(sp: typeof shoppingProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (sp.subtype) parts.push(capitalize(sp.subtype));
  if (sp.isLuxury) parts.push("Luxury");
  if (sp.isSecondhand) parts.push("Secondhand");
  if (sp.isLocalCrafts) parts.push("Local crafts");
  if (sp.marketDays) parts.push(`Market days: ${sp.marketDays}`);
  if (sp.cashOnly) parts.push("Cash only");
  if (sp.productHighlights && sp.productHighlights.length > 0) {
    parts.push(sp.productHighlights.slice(0, 4).join(", "));
  }
  if (sp.brands && sp.brands.length > 0) {
    parts.push(sp.brands.slice(0, 4).join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Builds a natural language profile summary for a viewpoint POI.
 *
 * Args:
 *     vp: The viewpoint profile row.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no data.
 */
function buildViewpointSummary(vp: typeof viewpointProfileRows[number]): string | undefined {
  const parts: string[] = [];

  if (vp.subtype) parts.push(capitalize(vp.subtype));
  if (vp.elevationM) parts.push(`${vp.elevationM}m elevation`);
  if (vp.viewDirection) parts.push(`Facing ${vp.viewDirection}`);
  if (vp.bestTime) parts.push(`Best time: ${vp.bestTime}`);
  if (vp.requiresClimb) parts.push("Requires climb");
  if (vp.stepsCount) parts.push(`${vp.stepsCount} steps`);
  if (vp.telescopeAvailable) parts.push("Telescope available");
  if (vp.indoorViewing) parts.push("Indoor viewing");
  if (vp.visibleLandmarks && vp.visibleLandmarks.length > 0) {
    parts.push(`Views: ${vp.visibleLandmarks.slice(0, 4).join(", ")}`);
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let foodProfileRows: Awaited<ReturnType<typeof loadFoodProfiles>>;
let historyProfileRows: Awaited<ReturnType<typeof loadHistoryProfiles>>;
let architectureProfileRows: Awaited<ReturnType<typeof loadArchitectureProfiles>>;
let natureProfileRows: Awaited<ReturnType<typeof loadNatureProfiles>>;
let artCultureProfileRows: Awaited<ReturnType<typeof loadArtCultureProfiles>>;
let nightlifeProfileRows: Awaited<ReturnType<typeof loadNightlifeProfiles>>;
let shoppingProfileRows: Awaited<ReturnType<typeof loadShoppingProfiles>>;
let viewpointProfileRows: Awaited<ReturnType<typeof loadViewpointProfiles>>;

async function loadFoodProfiles() {
  return db
    .select({
      poiId: foodProfiles.poiId,
      establishmentType: foodProfiles.establishmentType,
      priceLevel: foodProfiles.priceLevel,
      ambiance: foodProfiles.ambiance,
      dietVegetarian: foodProfiles.dietVegetarian,
      dietVegan: foodProfiles.dietVegan,
      dietHalal: foodProfiles.dietHalal,
      dietGlutenFree: foodProfiles.dietGlutenFree,
      hasOutdoorSeating: foodProfiles.hasOutdoorSeating,
      hasWifi: foodProfiles.hasWifi,
      hasLiveMusic: foodProfiles.hasLiveMusic,
      michelinStars: foodProfiles.michelinStars,
      michelinBib: foodProfiles.michelinBib,
      reservationPolicy: foodProfiles.reservationPolicy,
      kidFriendly: foodProfiles.kidFriendly,
    })
    .from(foodProfiles);
}

async function loadHistoryProfiles() {
  return db
    .select({
      poiId: historyProfiles.poiId,
      subtype: historyProfiles.subtype,
      yearBuilt: historyProfiles.yearBuilt,
      yearDestroyed: historyProfiles.yearDestroyed,
      heritageLevel: historyProfiles.heritageLevel,
      preservationStatus: historyProfiles.preservationStatus,
      originalPurpose: historyProfiles.originalPurpose,
      currentUse: historyProfiles.currentUse,
      keyFigures: historyProfiles.keyFigures,
    })
    .from(historyProfiles);
}

async function loadArchitectureProfiles() {
  return db
    .select({
      poiId: architectureProfiles.poiId,
      subtype: architectureProfiles.subtype,
      primaryStyle: architectureProfiles.primaryStyle,
      architect: architectureProfiles.architect,
      yearBuilt: architectureProfiles.yearBuilt,
      yearRenovated: architectureProfiles.yearRenovated,
      heightMeters: architectureProfiles.heightMeters,
      constructionMaterials: architectureProfiles.constructionMaterials,
      denomination: architectureProfiles.denomination,
      towerAccessible: architectureProfiles.towerAccessible,
    })
    .from(architectureProfiles);
}

async function loadNatureProfiles() {
  return db
    .select({
      poiId: natureProfiles.poiId,
      subtype: natureProfiles.subtype,
      areaHectares: natureProfiles.areaHectares,
      trailLengthKm: natureProfiles.trailLengthKm,
      trailDifficulty: natureProfiles.trailDifficulty,
      picnicAllowed: natureProfiles.picnicAllowed,
      swimmingAllowed: natureProfiles.swimmingAllowed,
      cyclingAllowed: natureProfiles.cyclingAllowed,
      litAtNight: natureProfiles.litAtNight,
      facilities: natureProfiles.facilities,
    })
    .from(natureProfiles);
}

async function loadArtCultureProfiles() {
  return db
    .select({
      poiId: artCultureProfiles.poiId,
      subtype: artCultureProfiles.subtype,
      collectionFocus: artCultureProfiles.collectionFocus,
      genreFocus: artCultureProfiles.genreFocus,
      foundedYear: artCultureProfiles.foundedYear,
      guidedTours: artCultureProfiles.guidedTours,
      audioGuide: artCultureProfiles.audioGuide,
      photographyAllowed: artCultureProfiles.photographyAllowed,
      avgVisitMinutes: artCultureProfiles.avgVisitMinutes,
      capacity: artCultureProfiles.capacity,
    })
    .from(artCultureProfiles);
}

async function loadNightlifeProfiles() {
  return db
    .select({
      poiId: nightlifeProfiles.poiId,
      subtype: nightlifeProfiles.subtype,
      dressCode: nightlifeProfiles.dressCode,
      coverCharge: nightlifeProfiles.coverCharge,
      coverCurrency: nightlifeProfiles.coverCurrency,
      happyHour: nightlifeProfiles.happyHour,
      hasDancefloor: nightlifeProfiles.hasDancefloor,
      hasLiveMusic: nightlifeProfiles.hasLiveMusic,
      hasDj: nightlifeProfiles.hasDj,
      outdoorArea: nightlifeProfiles.outdoorArea,
      ageDemographic: nightlifeProfiles.ageDemographic,
    })
    .from(nightlifeProfiles);
}

async function loadShoppingProfiles() {
  return db
    .select({
      poiId: shoppingProfiles.poiId,
      subtype: shoppingProfiles.subtype,
      productHighlights: shoppingProfiles.productHighlights,
      brands: shoppingProfiles.brands,
      isSecondhand: shoppingProfiles.isSecondhand,
      isLocalCrafts: shoppingProfiles.isLocalCrafts,
      isLuxury: shoppingProfiles.isLuxury,
      marketDays: shoppingProfiles.marketDays,
      cashOnly: shoppingProfiles.cashOnly,
    })
    .from(shoppingProfiles);
}

async function loadViewpointProfiles() {
  return db
    .select({
      poiId: viewpointProfiles.poiId,
      subtype: viewpointProfiles.subtype,
      elevationM: viewpointProfiles.elevationM,
      viewDirection: viewpointProfiles.viewDirection,
      bestTime: viewpointProfiles.bestTime,
      requiresClimb: viewpointProfiles.requiresClimb,
      stepsCount: viewpointProfiles.stepsCount,
      telescopeAvailable: viewpointProfiles.telescopeAvailable,
      indoorViewing: viewpointProfiles.indoorViewing,
      visibleLandmarks: viewpointProfiles.visibleLandmarks,
    })
    .from(viewpointProfiles);
}

/**
 * Loads all POI tags as a map from poiId to tag name array.
 *
 * Returns:
 *     Map of poiId to string array of tag names.
 */
async function loadTagMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiTags.poiId,
      tagName: tags.name,
    })
    .from(poiTags)
    .innerJoin(tags, eq(poiTags.tagId, tags.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.tagName);
    } else {
      map.set(row.poiId, [row.tagName]);
    }
  }
  return map;
}

/**
 * Loads signature dishes for food POIs as a map from poiId to dish name array.
 *
 * Returns:
 *     Map of poiId to string array of signature dish names.
 */
async function loadSignatureDishMap(): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      poiId: poiDishes.poiId,
      dishName: dishes.name,
    })
    .from(poiDishes)
    .innerJoin(dishes, eq(poiDishes.dishId, dishes.id))
    .where(eq(poiDishes.isSignature, true));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.poiId);
    if (existing) {
      existing.push(row.dishName);
    } else {
      map.set(row.poiId, [row.dishName]);
    }
  }
  return map;
}

async function syncTypesense() {
  log.info("Starting sync...");

  await initCollection();
  log.info("Collection initialized");

  const allPois = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      osmTags: pois.osmTags,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id));

  log.info(`Found ${allPois.length} POIs in database`);

  const remarkRows = await db
    .select({ poiId: remarks.poiId })
    .from(remarks);

  const remarkPoiIds = new Set(
    remarkRows
      .map((r) => r.poiId)
      .filter((id): id is string => id !== null)
  );

  log.info(`${remarkPoiIds.size} POIs have stories`);

  const translationRows = await db
    .select({
      poiId: poiTranslations.poiId,
      description: poiTranslations.description,
      reviewSummary: poiTranslations.reviewSummary,
    })
    .from(poiTranslations);

  const translationMap = new Map(
    translationRows.map((t) => [t.poiId, t])
  );

  log.info("Loading profiles...");

  foodProfileRows = await loadFoodProfiles();
  historyProfileRows = await loadHistoryProfiles();
  architectureProfileRows = await loadArchitectureProfiles();
  natureProfileRows = await loadNatureProfiles();
  artCultureProfileRows = await loadArtCultureProfiles();
  nightlifeProfileRows = await loadNightlifeProfiles();
  shoppingProfileRows = await loadShoppingProfiles();
  viewpointProfileRows = await loadViewpointProfiles();

  const foodProfileMap = new Map(foodProfileRows.map((r) => [r.poiId, r]));
  const historyProfileMap = new Map(historyProfileRows.map((r) => [r.poiId, r]));
  const architectureProfileMap = new Map(architectureProfileRows.map((r) => [r.poiId, r]));
  const natureProfileMap = new Map(natureProfileRows.map((r) => [r.poiId, r]));
  const artCultureProfileMap = new Map(artCultureProfileRows.map((r) => [r.poiId, r]));
  const nightlifeProfileMap = new Map(nightlifeProfileRows.map((r) => [r.poiId, r]));
  const shoppingProfileMap = new Map(shoppingProfileRows.map((r) => [r.poiId, r]));
  const viewpointProfileMap = new Map(viewpointProfileRows.map((r) => [r.poiId, r]));

  log.info("Loading tags and dishes...");

  const tagMap = await loadTagMap();
  const signatureDishMap = await loadSignatureDishMap();

  log.info(`${tagMap.size} POIs have tags, ${signatureDishMap.size} POIs have signature dishes`);

  const documents: TypesensePoiDocument[] = allPois.map((poi) => {
    const translation = translationMap.get(poi.id);
    const fp = foodProfileMap.get(poi.id);
    const hp = historyProfileMap.get(poi.id);
    const ap = architectureProfileMap.get(poi.id);
    const np = natureProfileMap.get(poi.id);
    const ac = artCultureProfileMap.get(poi.id);
    const nl = nightlifeProfileMap.get(poi.id);
    const sp = shoppingProfileMap.get(poi.id);
    const vp = viewpointProfileMap.get(poi.id);
    const osmTags = poi.osmTags;
    const category = poi.categorySlug ?? "hidden";

    let profileSummary: string | undefined;
    if (fp) profileSummary = buildFoodSummary(fp);
    else if (hp) profileSummary = buildHistorySummary(hp);
    else if (ap) profileSummary = buildArchitectureSummary(ap);
    else if (np) profileSummary = buildNatureSummary(np);
    else if (ac) profileSummary = buildArtCultureSummary(ac);
    else if (nl) profileSummary = buildNightlifeSummary(nl);
    else if (sp) profileSummary = buildShoppingSummary(sp);
    else if (vp) profileSummary = buildViewpointSummary(vp);

    return {
      id: poi.id,
      poiId: poi.id,
      osmId: poi.osmId ?? undefined,
      name: poi.name,
      description: translation?.description ?? "",
      reviewSummary: translation?.reviewSummary ?? "",
      category,
      amenityType: osmTags?.amenity ?? osmTags?.tourism ?? "",
      cuisine: osmTags?.cuisine ?? "",
      priceRange: fp?.priceLevel ? PRICE_LEVEL_MAP[fp.priceLevel] ?? "" : "",
      atmosphere: [],
      location: [poi.latitude, poi.longitude],
      hasStory: remarkPoiIds.has(poi.id),
      hasOutdoorSeating:
        fp?.hasOutdoorSeating ?? osmTags?.outdoor_seating === "yes",
      hasWifi:
        fp?.hasWifi ??
        (osmTags?.internet_access === "wlan" ||
        osmTags?.internet_access === "yes"),
      address: poi.address ?? "",
      dietVegetarian: fp?.dietVegetarian ?? undefined,
      dietVegan: fp?.dietVegan ?? undefined,
      dietHalal: fp?.dietHalal ?? undefined,
      michelinStars: fp?.michelinStars ?? undefined,
      establishmentType: fp?.establishmentType ?? undefined,
      profileSummary,
      tags: tagMap.get(poi.id) ?? undefined,
      signatureDishes: signatureDishMap.get(poi.id) ?? undefined,
      ambiance: fp?.ambiance ?? undefined,
    };
  });

  let synced = 0;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await upsertDocuments(batch);
    synced += batch.length;
    log.info(`Synced ${synced}/${documents.length}`);
  }

  log.success(`Done! Synced ${synced} documents to Typesense`);
  process.exit(0);
}

syncTypesense().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
