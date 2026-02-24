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
  transportProfiles,
  educationProfiles,
  healthProfiles,
  sportsProfiles,
  servicesProfiles,
  poiTranslations,
  poiTags,
  tags,
  poiDishes,
  dishes,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { initCollection, upsertDocuments } from "../src/lib/search/typesense";
import { buildProfileSummary, buildTypesenseDocument } from "../src/lib/search/profileSummary";
import { createLogger } from "../src/lib/logger";

const log = createLogger("sync-typesense");

const BATCH_SIZE = 100;

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
 * Loads transport profile fields for all POIs from the database.
 *
 * @returns Array of transport profile rows with search-relevant fields.
 */
async function loadTransportProfiles() {
  return db
    .select({
      poiId: transportProfiles.poiId,
      subtype: transportProfiles.subtype,
      lines: transportProfiles.lines,
      operator: transportProfiles.operator,
      yearOpened: transportProfiles.yearOpened,
      dailyRidership: transportProfiles.dailyRidership,
      isInterchange: transportProfiles.isInterchange,
      hasElevator: transportProfiles.hasElevator,
      hasBikeParking: transportProfiles.hasBikeParking,
    })
    .from(transportProfiles);
}

/**
 * Loads education profile fields for all POIs from the database.
 *
 * @returns Array of education profile rows with search-relevant fields.
 */
async function loadEducationProfiles() {
  return db
    .select({
      poiId: educationProfiles.poiId,
      subtype: educationProfiles.subtype,
      foundedYear: educationProfiles.foundedYear,
      specialization: educationProfiles.specialization,
      notableAlumni: educationProfiles.notableAlumni,
      isPublic: educationProfiles.isPublic,
      hasPublicAccess: educationProfiles.hasPublicAccess,
      hasLibrary: educationProfiles.hasLibrary,
    })
    .from(educationProfiles);
}

/**
 * Loads health profile fields for all POIs from the database.
 *
 * @returns Array of health profile rows with search-relevant fields.
 */
async function loadHealthProfiles() {
  return db
    .select({
      poiId: healthProfiles.poiId,
      subtype: healthProfiles.subtype,
      specialization: healthProfiles.specialization,
      isEmergency: healthProfiles.isEmergency,
      spokenLanguages: healthProfiles.spokenLanguages,
      facilities: healthProfiles.facilities,
    })
    .from(healthProfiles);
}

/**
 * Loads sports profile fields for all POIs from the database.
 *
 * @returns Array of sports profile rows with search-relevant fields.
 */
async function loadSportsProfiles() {
  return db
    .select({
      poiId: sportsProfiles.poiId,
      subtype: sportsProfiles.subtype,
      sports: sportsProfiles.sports,
      homeTeam: sportsProfiles.homeTeam,
      capacity: sportsProfiles.capacity,
      isPublicAccess: sportsProfiles.isPublicAccess,
      hasEquipmentRental: sportsProfiles.hasEquipmentRental,
      hasCoaching: sportsProfiles.hasCoaching,
    })
    .from(sportsProfiles);
}

/**
 * Loads services profile fields for all POIs from the database.
 *
 * @returns Array of services profile rows with search-relevant fields.
 */
async function loadServicesProfiles() {
  return db
    .select({
      poiId: servicesProfiles.poiId,
      subtype: servicesProfiles.subtype,
      serviceType: servicesProfiles.serviceType,
      operator: servicesProfiles.operator,
      hasOnlineBooking: servicesProfiles.hasOnlineBooking,
      spokenLanguages: servicesProfiles.spokenLanguages,
    })
    .from(servicesProfiles);
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

  await initCollection(true);
  log.info("Collection initialized (force recreated)");

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
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(sql`${pois.id} IN (
      SELECT ${enrichmentLog.poiId} FROM ${enrichmentLog}
      WHERE ${enrichmentLog.source} = 'enrich'
        AND ${enrichmentLog.status} IN ('success', 'success_fb')
    )`);

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

  const [
    foodRows, historyRows, architectureRows, natureRows,
    artCultureRows, nightlifeRows, shoppingRows, viewpointRows,
    transportRows, educationRows, healthRows, sportsRows, servicesRows,
  ] = await Promise.all([
    loadFoodProfiles(),
    loadHistoryProfiles(),
    loadArchitectureProfiles(),
    loadNatureProfiles(),
    loadArtCultureProfiles(),
    loadNightlifeProfiles(),
    loadShoppingProfiles(),
    loadViewpointProfiles(),
    loadTransportProfiles(),
    loadEducationProfiles(),
    loadHealthProfiles(),
    loadSportsProfiles(),
    loadServicesProfiles(),
  ]);

  const profileMaps: Record<string, Map<string, Record<string, unknown>>> = {
    food: new Map(foodRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    history: new Map(historyRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    architecture: new Map(architectureRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    nature: new Map(natureRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    art: new Map(artCultureRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    culture: new Map(artCultureRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    nightlife: new Map(nightlifeRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    shopping: new Map(shoppingRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    views: new Map(viewpointRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    transport: new Map(transportRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    education: new Map(educationRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    health: new Map(healthRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    sports: new Map(sportsRows.map((r) => [r.poiId, r as Record<string, unknown>])),
    services: new Map(servicesRows.map((r) => [r.poiId, r as Record<string, unknown>])),
  };

  log.info("Loading tags and dishes...");

  const tagMap = await loadTagMap();
  const signatureDishMap = await loadSignatureDishMap();

  log.info(`${tagMap.size} POIs have tags, ${signatureDishMap.size} POIs have signature dishes`);

  const documents = allPois.map((poi) => {
    const category = poi.categorySlug ?? "hidden";
    const translation = translationMap.get(poi.id);
    const profile = profileMaps[category]?.get(poi.id) ?? null;
    const profileSummary = profile ? buildProfileSummary(category, profile) : undefined;

    return buildTypesenseDocument({
      id: poi.id,
      osmId: poi.osmId,
      name: poi.name,
      latitude: poi.latitude,
      longitude: poi.longitude,
      address: poi.address,
      osmTags: poi.osmTags,
      categorySlug: category,
      description: translation?.description ?? null,
      reviewSummary: translation?.reviewSummary ?? null,
      profile,
      profileSummary,
      tags: tagMap.get(poi.id) ?? [],
      signatureDishes: signatureDishMap.get(poi.id) ?? [],
      hasStory: remarkPoiIds.has(poi.id),
    });
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
