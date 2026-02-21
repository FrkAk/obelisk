import type { TypesensePoiDocument } from "./typesense";

export const PRICE_LEVEL_MAP: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};

export const PRICE_LEVEL_LABEL: Record<number, string> = {
  1: "Budget",
  2: "Moderate",
  3: "Upscale",
  4: "Fine dining",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildFoodSummary(fp: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (fp.establishmentType) parts.push(capitalize(fp.establishmentType as string));
  if (fp.priceLevel) parts.push(PRICE_LEVEL_LABEL[fp.priceLevel as number] ?? `Price ${fp.priceLevel}`);
  if (fp.ambiance) parts.push(capitalize(fp.ambiance as string));
  if (fp.dietVegetarian === "yes") parts.push("Vegetarian options");
  if (fp.dietVegetarian === "only") parts.push("Vegetarian only");
  if (fp.dietVegan === "yes") parts.push("Vegan options");
  if (fp.dietVegan === "only") parts.push("Vegan only");
  if (fp.dietHalal === "yes" || fp.dietHalal === "only") parts.push("Halal");
  if (fp.dietGlutenFree === "yes") parts.push("Gluten-free options");
  if (fp.hasOutdoorSeating) parts.push("Outdoor seating");
  if (fp.hasWifi) parts.push("WiFi");
  if (fp.hasLiveMusic) parts.push("Live music");
  if (fp.michelinStars && (fp.michelinStars as number) > 0) parts.push(`${fp.michelinStars} Michelin star${(fp.michelinStars as number) > 1 ? "s" : ""}`);
  if (fp.michelinBib) parts.push("Bib Gourmand");
  if (fp.reservationPolicy) parts.push(`Reservations: ${fp.reservationPolicy}`);
  if (fp.kidFriendly) parts.push("Kid-friendly");

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildHistorySummary(hp: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (hp.subtype) parts.push(capitalize(hp.subtype as string));
  if (hp.yearBuilt) parts.push(`Built ${hp.yearBuilt}`);
  if (hp.yearDestroyed) parts.push(`Destroyed ${hp.yearDestroyed}`);
  if (hp.heritageLevel) parts.push(`${capitalize(hp.heritageLevel as string)} heritage`);
  if (hp.preservationStatus) parts.push(capitalize(hp.preservationStatus as string));
  if (hp.originalPurpose) parts.push(`Originally: ${hp.originalPurpose}`);
  if (hp.currentUse) parts.push(`Now: ${hp.currentUse}`);
  if (hp.keyFigures && (hp.keyFigures as string[]).length > 0) parts.push(`Key figures: ${(hp.keyFigures as string[]).slice(0, 3).join(", ")}`);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildArchitectureSummary(ap: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (ap.subtype) parts.push(capitalize(ap.subtype as string));
  if (ap.primaryStyle) parts.push(ap.primaryStyle as string);
  if (ap.architect) parts.push(`Architect: ${ap.architect}`);
  if (ap.yearBuilt) parts.push(`Built ${ap.yearBuilt}`);
  if (ap.yearRenovated) parts.push(`Renovated ${ap.yearRenovated}`);
  if (ap.denomination) parts.push(capitalize(ap.denomination as string));
  if (ap.towerAccessible) parts.push("Tower accessible");
  if (ap.heightMeters) parts.push(`${ap.heightMeters}m tall`);
  if (ap.constructionMaterials && (ap.constructionMaterials as string[]).length > 0) {
    parts.push((ap.constructionMaterials as string[]).join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildNatureSummary(np: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (np.subtype) parts.push(capitalize(np.subtype as string));
  if (np.areaHectares) parts.push(`${np.areaHectares} hectares`);
  if (np.trailDifficulty) parts.push(`${capitalize(np.trailDifficulty as string)} trails`);
  if (np.trailLengthKm) parts.push(`${np.trailLengthKm}km of trails`);
  if (np.picnicAllowed) parts.push("Picnic area");
  if (np.swimmingAllowed) parts.push("Swimming");
  if (np.cyclingAllowed) parts.push("Cycling");
  if (np.litAtNight) parts.push("Lit at night");
  if (np.facilities && (np.facilities as string[]).length > 0) {
    parts.push((np.facilities as string[]).slice(0, 4).join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildArtCultureSummary(ac: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (ac.subtype) parts.push(capitalize(ac.subtype as string));
  if (ac.collectionFocus) parts.push(ac.collectionFocus as string);
  if (ac.genreFocus) parts.push(ac.genreFocus as string);
  if (ac.foundedYear) parts.push(`Founded ${ac.foundedYear}`);
  if (ac.guidedTours) parts.push("Guided tours");
  if (ac.audioGuide) parts.push("Audio guide");
  if (ac.photographyAllowed) parts.push("Photography allowed");
  if (ac.avgVisitMinutes) parts.push(`~${ac.avgVisitMinutes} min visit`);
  if (ac.capacity) parts.push(`Capacity: ${ac.capacity}`);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildNightlifeSummary(nl: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (nl.subtype) parts.push(capitalize(nl.subtype as string));
  if (nl.dressCode) parts.push(`Dress code: ${nl.dressCode}`);
  if (nl.coverCharge) parts.push(`Cover: ${nl.coverCharge}${(nl.coverCurrency as string) ?? "EUR"}`);
  if (nl.happyHour) parts.push(`Happy hour: ${nl.happyHour}`);
  if (nl.hasDancefloor) parts.push("Dancefloor");
  if (nl.hasLiveMusic) parts.push("Live music");
  if (nl.hasDj) parts.push("DJ");
  if (nl.outdoorArea) parts.push("Outdoor area");
  if (nl.ageDemographic) parts.push(nl.ageDemographic as string);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildShoppingSummary(sp: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (sp.subtype) parts.push(capitalize(sp.subtype as string));
  if (sp.isLuxury) parts.push("Luxury");
  if (sp.isSecondhand) parts.push("Secondhand");
  if (sp.isLocalCrafts) parts.push("Local crafts");
  if (sp.marketDays) parts.push(`Market days: ${sp.marketDays}`);
  if (sp.cashOnly) parts.push("Cash only");
  if (sp.productHighlights && (sp.productHighlights as string[]).length > 0) {
    parts.push((sp.productHighlights as string[]).slice(0, 4).join(", "));
  }
  if (sp.brands && (sp.brands as string[]).length > 0) {
    parts.push((sp.brands as string[]).slice(0, 4).join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function buildViewpointSummary(vp: Record<string, unknown>): string | undefined {
  const parts: string[] = [];

  if (vp.subtype) parts.push(capitalize(vp.subtype as string));
  if (vp.elevationM) parts.push(`${vp.elevationM}m elevation`);
  if (vp.viewDirection) parts.push(`Facing ${vp.viewDirection}`);
  if (vp.bestTime) parts.push(`Best time: ${vp.bestTime}`);
  if (vp.requiresClimb) parts.push("Requires climb");
  if (vp.stepsCount) parts.push(`${vp.stepsCount} steps`);
  if (vp.telescopeAvailable) parts.push("Telescope available");
  if (vp.indoorViewing) parts.push("Indoor viewing");
  if (vp.visibleLandmarks && (vp.visibleLandmarks as string[]).length > 0) {
    parts.push(`Views: ${(vp.visibleLandmarks as string[]).slice(0, 4).join(", ")}`);
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}

const SUMMARY_BUILDERS: Record<string, (profile: Record<string, unknown>) => string | undefined> = {
  food: buildFoodSummary,
  history: buildHistorySummary,
  architecture: buildArchitectureSummary,
  nature: buildNatureSummary,
  art: buildArtCultureSummary,
  culture: buildArtCultureSummary,
  nightlife: buildNightlifeSummary,
  shopping: buildShoppingSummary,
  views: buildViewpointSummary,
};

/**
 * Builds a natural language profile summary for a POI based on its category.
 *
 * Args:
 *     categorySlug: The POI's category slug (e.g., "food", "history").
 *     profile: The category-specific profile record.
 *
 * Returns:
 *     A comma-separated summary string, or undefined if no builder exists or no data.
 */
export function buildProfileSummary(
  categorySlug: string,
  profile: Record<string, unknown>,
): string | undefined {
  const builder = SUMMARY_BUILDERS[categorySlug];
  return builder ? builder(profile) : undefined;
}

export interface TypesenseDocInput {
  id: string;
  osmId: number | null;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  osmTags: Record<string, string> | null;
  categorySlug: string;
  description: string | null;
  reviewSummary: string | null;
  profile: Record<string, unknown> | null;
  profileSummary: string | undefined;
  tags: string[];
  signatureDishes: string[];
  hasStory: boolean;
}

/**
 * Constructs a Typesense document from pre-loaded POI data.
 *
 * Args:
 *     input: Pre-loaded data for a single POI.
 *
 * Returns:
 *     A fully constructed TypesensePoiDocument ready for upsert.
 */
export function buildTypesenseDocument(input: TypesenseDocInput): TypesensePoiDocument {
  const osmTags = input.osmTags;
  const fp = input.categorySlug === "food" ? input.profile : null;

  return {
    id: input.id,
    poiId: input.id,
    osmId: input.osmId ?? undefined,
    name: input.name,
    description: input.description ?? "",
    reviewSummary: input.reviewSummary ?? "",
    category: input.categorySlug,
    amenityType: osmTags?.amenity ?? osmTags?.tourism ?? "",
    cuisine: osmTags?.cuisine ?? "",
    priceRange: fp && typeof (fp as Record<string, unknown>).priceLevel === "number"
      ? PRICE_LEVEL_MAP[(fp as Record<string, unknown>).priceLevel as number] ?? ""
      : "",
    atmosphere: [],
    location: [input.latitude, input.longitude],
    hasStory: input.hasStory,
    hasOutdoorSeating:
      (fp && (fp as Record<string, unknown>).hasOutdoorSeating as boolean | undefined) ?? osmTags?.outdoor_seating === "yes",
    hasWifi:
      (fp && (fp as Record<string, unknown>).hasWifi as boolean | undefined) ??
      (osmTags?.internet_access === "wlan" || osmTags?.internet_access === "yes"),
    address: input.address ?? "",
    dietVegetarian: fp ? (fp as Record<string, unknown>).dietVegetarian as string | undefined : undefined,
    dietVegan: fp ? (fp as Record<string, unknown>).dietVegan as string | undefined : undefined,
    dietHalal: fp ? (fp as Record<string, unknown>).dietHalal as string | undefined : undefined,
    michelinStars: fp ? (fp as Record<string, unknown>).michelinStars as number | undefined : undefined,
    establishmentType: fp ? (fp as Record<string, unknown>).establishmentType as string | undefined : undefined,
    profileSummary: input.profileSummary,
    tags: input.tags.length > 0 ? input.tags : undefined,
    signatureDishes: input.signatureDishes.length > 0 ? input.signatureDishes : undefined,
    ambiance: fp ? (fp as Record<string, unknown>).ambiance as string | undefined : undefined,
  };
}
