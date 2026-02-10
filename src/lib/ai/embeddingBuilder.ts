import type {
  Poi,
  Tag,
  FoodProfile,
  HistoryProfile,
  ArchitectureProfile,
  NatureProfile,
  ArtCultureProfile,
  NightlifeProfile,
  ShoppingProfile,
  ViewpointProfile,
  Cuisine,
  PoiDish,
  Dish,
  ContactInfo,
} from "@/types";

type ProfileUnion =
  | FoodProfile
  | HistoryProfile
  | ArchitectureProfile
  | NatureProfile
  | ArtCultureProfile
  | NightlifeProfile
  | ShoppingProfile
  | ViewpointProfile
  | null;

interface EmbeddingContext {
  poi: Poi;
  profile: ProfileUnion;
  tags: Tag[];
  cuisines?: Cuisine[];
  dishes?: Array<PoiDish & { dish: Dish }>;
  contactInfo?: ContactInfo | null;
}

/**
 * Builds a semantically rich embedding text string from structured POI profile data.
 * The category is detected from the POI's category slug and the appropriate
 * builder is dispatched.
 *
 * Args:
 *     ctx: The full POI context with profile, tags, cuisines, and dishes.
 *
 * Returns:
 *     A pipe-delimited text string optimized for embedding generation.
 */
export function buildEmbeddingText(ctx: EmbeddingContext): string {
  const slug = detectCategorySlug(ctx.tags);
  const builder = CATEGORY_BUILDERS[slug];

  if (builder && ctx.profile) {
    return builder(ctx);
  }

  return buildGenericText(ctx);
}

type CategoryBuilder = (ctx: EmbeddingContext) => string;

const CATEGORY_BUILDERS: Record<string, CategoryBuilder> = {
  food: buildFoodText,
  history: buildHistoryText,
  architecture: buildArchitectureText,
  nature: buildNatureText,
  art: buildArtCultureText,
  culture: buildArtCultureText,
  nightlife: buildNightlifeText,
  shopping: buildShoppingText,
  views: buildViewpointText,
};

function detectCategorySlug(tags: Tag[]): string {
  for (const tag of tags) {
    if (tag.group === "category") return tag.slug;
  }
  return "";
}

function joinParts(parts: Array<string | null | undefined | false>): string {
  return parts.filter(Boolean).join(" | ");
}

function priceLevelLabel(level: number | null | undefined): string | null {
  if (level == null) return null;
  const labels: Record<number, string> = {
    1: "Budget-friendly",
    2: "Moderate price",
    3: "Upscale",
    4: "Fine dining price",
  };
  return labels[level] ?? null;
}

function buildFoodText(ctx: EmbeddingContext): string {
  const { poi, profile, tags, cuisines, dishes, contactInfo } = ctx;
  const fp = profile as FoodProfile;

  const cuisineNames = cuisines?.map((c) => c.name).join(", ");
  const signatureDishes = dishes
    ?.filter((d) => d.isSignature || d.isPopular)
    .map((d) => d.dish?.name ?? d.localName)
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");

  const allDishNames = dishes
    ?.map((d) => d.dish?.name ?? d.localName)
    .filter(Boolean)
    .slice(0, 10)
    .join(", ");

  const tagNames = tags.map((t) => t.name).join(", ");

  const dietaryFlags: string[] = [];
  if (fp.dietVegetarian === "yes" || fp.dietVegetarian === "only")
    dietaryFlags.push("Vegetarian");
  if (fp.dietVegan === "yes" || fp.dietVegan === "only")
    dietaryFlags.push("Vegan");
  if (fp.dietHalal === "yes" || fp.dietHalal === "only")
    dietaryFlags.push("Halal");
  if (fp.dietKosher === "yes" || fp.dietKosher === "only")
    dietaryFlags.push("Kosher");
  if (fp.dietGlutenFree === "yes" || fp.dietGlutenFree === "only")
    dietaryFlags.push("Gluten-free");

  const amenities: string[] = [];
  if (fp.hasOutdoorSeating) amenities.push("Outdoor seating");
  if (fp.hasCommunalTables) amenities.push("Communal tables");
  if (fp.hasBarSeating) amenities.push("Bar seating");
  if (fp.hasPrivateDining) amenities.push("Private dining");
  if (fp.hasLiveMusic) amenities.push("Live music");
  if (fp.hasWifi) amenities.push("WiFi");
  if (fp.hasParking) amenities.push("Parking");

  const services: string[] = [];
  if (fp.servesBeer) services.push("Beer");
  if (fp.servesWine) services.push("Wine");
  if (fp.servesCocktails) services.push("Cocktails");

  const familyFlags: string[] = [];
  if (fp.kidFriendly) familyFlags.push("Family-friendly");
  if (fp.hasKidsMenu) familyFlags.push("Kids menu");
  if (fp.hasHighchair) familyFlags.push("Highchairs");

  return joinParts([
    poi.name,
    fp.establishmentType,
    cuisineNames,
    signatureDishes && `Signature: ${signatureDishes}`,
    priceLevelLabel(fp.priceLevel),
    amenities.length > 0 && amenities.join(", "),
    fp.vibe,
    fp.ambiance,
    services.length > 0 && services.join(", "),
    dietaryFlags.length > 0 && dietaryFlags.join(", "),
    familyFlags.length > 0 && familyFlags.join(", "),
    fp.reservationPolicy && `Reservation: ${fp.reservationPolicy}`,
    fp.michelinStars && fp.michelinStars > 0
      ? `${fp.michelinStars} Michelin star${fp.michelinStars > 1 ? "s" : ""}`
      : null,
    fp.michelinBib && "Bib Gourmand",
    allDishNames && `Dishes: ${allDishNames}`,
    tagNames,
    poi.address,
    contactInfo?.openingHoursDisplay,
  ]);
}

function buildHistoryText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const hp = profile as HistoryProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const yearRange =
    hp.yearBuilt != null
      ? hp.yearDestroyed != null
        ? `${formatYear(hp.yearBuilt)}-${formatYear(hp.yearDestroyed)}`
        : formatYear(hp.yearBuilt)
      : null;

  return joinParts([
    poi.name,
    hp.subtype,
    yearRange && `Era: ${yearRange}`,
    hp.keyFigures?.length ? `Key figures: ${hp.keyFigures.join(", ")}` : null,
    hp.keyEvents?.length ? `Key events: ${hp.keyEvents.join(", ")}` : null,
    hp.historicalSignificance,
    hp.originalPurpose && `Original purpose: ${hp.originalPurpose}`,
    hp.currentUse && `Current use: ${hp.currentUse}`,
    hp.heritageLevel && `${hp.heritageLevel} heritage site`,
    hp.preservationStatus && `Status: ${hp.preservationStatus}`,
    hp.constructionMaterials?.length
      ? `Materials: ${hp.constructionMaterials.join(", ")}`
      : null,
    hp.inscription && `Inscription: ${hp.inscription}`,
    tagNames,
    poi.address,
  ]);
}

function buildArchitectureText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const ap = profile as ArchitectureProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  return joinParts([
    poi.name,
    ap.subtype,
    ap.primaryStyle,
    ap.architect && `Architect: ${ap.architect}`,
    ap.yearBuilt != null ? `Built: ${formatYear(ap.yearBuilt)}` : null,
    ap.yearRenovated != null ? `Renovated: ${ap.yearRenovated}` : null,
    ap.heightMeters && `Height: ${ap.heightMeters}m`,
    ap.constructionMaterials?.length
      ? `Materials: ${ap.constructionMaterials.join(", ")}`
      : null,
    ap.interiorHighlights?.length
      ? `Interior: ${ap.interiorHighlights.join(", ")}`
      : null,
    ap.denomination,
    ap.isActiveWorship ? "Active place of worship" : null,
    ap.towerAccessible ? "Tower accessible" : null,
    ap.notableFeatures,
    tagNames,
    poi.address,
  ]);
}

function buildNatureText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const np = profile as NatureProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const activities: string[] = [];
  if (np.picnicAllowed) activities.push("Picnic");
  if (np.swimmingAllowed) activities.push("Swimming");
  if (np.cyclingAllowed) activities.push("Cycling");

  return joinParts([
    poi.name,
    np.subtype,
    np.areaHectares && `${np.areaHectares} hectares`,
    np.trailLengthKm && `Trail: ${np.trailLengthKm}km`,
    np.trailDifficulty && `Difficulty: ${np.trailDifficulty}`,
    np.elevationGainM ? `Elevation gain: ${np.elevationGainM}m` : null,
    np.floraHighlights?.length
      ? `Flora: ${np.floraHighlights.join(", ")}`
      : null,
    np.wildlifeHighlights?.length
      ? `Wildlife: ${np.wildlifeHighlights.join(", ")}`
      : null,
    np.facilities?.length ? `Facilities: ${np.facilities.join(", ")}` : null,
    activities.length > 0 ? `Activities: ${activities.join(", ")}` : null,
    np.litAtNight ? "Lit at night" : null,
    np.notableFeatures,
    tagNames,
    poi.address,
  ]);
}

function buildArtCultureText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const ac = profile as ArtCultureProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const features: string[] = [];
  if (ac.hasPermanentCollection) features.push("Permanent collection");
  if (ac.hasRotatingExhibitions) features.push("Rotating exhibitions");
  if (ac.guidedTours) features.push("Guided tours");
  if (ac.audioGuide) features.push("Audio guide");
  if (ac.photographyAllowed) features.push("Photography allowed");

  return joinParts([
    poi.name,
    ac.subtype,
    ac.collectionFocus,
    ac.genreFocus && `Genre: ${ac.genreFocus}`,
    ac.notableWorks?.length
      ? `Notable works: ${ac.notableWorks.join(", ")}`
      : null,
    ac.notablePerformers?.length
      ? `Performers: ${ac.notablePerformers.join(", ")}`
      : null,
    features.length > 0 ? features.join(", ") : null,
    ac.avgVisitMinutes ? `Visit time: ~${ac.avgVisitMinutes} min` : null,
    ac.foundedYear ? `Founded: ${ac.foundedYear}` : null,
    ac.vibe,
    tagNames,
    poi.address,
  ]);
}

function buildNightlifeText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const nl = profile as NightlifeProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const features: string[] = [];
  if (nl.hasDancefloor) features.push("Dancefloor");
  if (nl.hasDj) features.push("DJ");
  if (nl.hasLiveMusic) features.push("Live music");
  if (nl.outdoorArea) features.push("Outdoor area");

  return joinParts([
    poi.name,
    nl.subtype,
    tagNames,
    nl.coverCharge
      ? `Cover: ${nl.coverCurrency ?? "EUR"} ${nl.coverCharge}`
      : null,
    nl.peakHours && `Peak: ${nl.peakHours}`,
    nl.ageDemographic && `Crowd: ${nl.ageDemographic}`,
    features.length > 0 ? features.join(", ") : null,
    nl.signatureDrinks?.length
      ? `Drinks: ${nl.signatureDrinks.join(", ")}`
      : null,
    nl.dressCode && `Dress code: ${nl.dressCode}`,
    nl.vibe,
    nl.capacity ? `Capacity: ${nl.capacity}` : null,
    poi.address,
  ]);
}

function buildShoppingText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const sp = profile as ShoppingProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const flags: string[] = [];
  if (sp.isSecondhand) flags.push("Secondhand");
  if (sp.isLocalCrafts) flags.push("Local crafts");
  if (sp.isLuxury) flags.push("Luxury");
  if (sp.cashOnly) flags.push("Cash only");

  return joinParts([
    poi.name,
    sp.subtype,
    sp.productHighlights?.length
      ? `Products: ${sp.productHighlights.join(", ")}`
      : null,
    sp.brands?.length ? `Brands: ${sp.brands.join(", ")}` : null,
    flags.length > 0 ? flags.join(", ") : null,
    sp.marketDays && `Market days: ${sp.marketDays}`,
    sp.vibe,
    tagNames,
    poi.address,
  ]);
}

function buildViewpointText(ctx: EmbeddingContext): string {
  const { poi, profile, tags } = ctx;
  const vp = profile as ViewpointProfile;
  const tagNames = tags.map((t) => t.name).join(", ");

  const features: string[] = [];
  if (vp.telescopeAvailable) features.push("Telescope");
  if (vp.indoorViewing) features.push("Indoor viewing");
  if (vp.requiresClimb) features.push("Requires climb");

  return joinParts([
    poi.name,
    vp.subtype,
    vp.elevationM && `Elevation: ${vp.elevationM}m`,
    vp.viewDirection && `View: ${vp.viewDirection}`,
    vp.visibleLandmarks?.length
      ? `Landmarks: ${vp.visibleLandmarks.join(", ")}`
      : null,
    vp.bestTime && `Best time: ${vp.bestTime}`,
    features.length > 0 ? features.join(", ") : null,
    vp.stepsCount ? `${vp.stepsCount} steps` : null,
    vp.photographyTips,
    vp.crowdLevel && `Crowd: ${vp.crowdLevel}`,
    tagNames,
    poi.address,
  ]);
}

function buildGenericText(ctx: EmbeddingContext): string {
  const { poi, tags } = ctx;
  const tagNames = tags.map((t) => t.name).join(", ");

  return joinParts([
    poi.name,
    tagNames,
    poi.address,
    poi.wikipediaUrl && "Wikipedia article available",
  ]);
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return String(year);
}

/**
 * Counts the number of non-null, non-empty fields in a profile object.
 * Used for confidence scoring: more populated fields = higher confidence.
 *
 * Args:
 *     profile: A profile row from any category profile table.
 *
 * Returns:
 *     An object with populated field count, total field count, and ratio.
 */
export function profileCompleteness(profile: ProfileUnion): {
  populated: number;
  total: number;
  ratio: number;
} {
  if (!profile) return { populated: 0, total: 0, ratio: 0 };

  const entries = Object.entries(profile);
  const skipped = new Set(["poiId", "confidenceScore", "createdAt", "updatedAt"]);
  const relevantEntries = entries.filter(([key]) => !skipped.has(key));
  const total = relevantEntries.length;
  const populated = relevantEntries.filter(([, value]) => {
    if (value == null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }).length;

  return {
    populated,
    total,
    ratio: total > 0 ? populated / total : 0,
  };
}
