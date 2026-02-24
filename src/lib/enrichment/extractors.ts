import { chatExtract } from "@/lib/ai/ollama";
import { createLogger } from "@/lib/logger";

const log = createLogger("extractors");

const EXTRACTION_SYSTEM_PROMPT = `You are a structured data extractor for points of interest in Munich, Germany.

RULES:
1. Return ONLY a valid JSON object. No markdown, no explanation.
2. Only include fields you can confidently determine from the text. Omit uncertain fields entirely.
3. The input text may be in German, English, or both. Extract data regardless of language.
4. For boolean fields: use true or false.
5. For enum fields: use EXACTLY the allowed values listed. Do not invent new values.
6. For diet/availability fields expecting "yes"/"no"/"only":
   - "yes" = options available alongside others
   - "only" = exclusively this (e.g., fully vegan restaurant)
   - "no" = not available
   - Map German equivalents: "vegetarisch" → "yes", "rein vegan" → "only"
7. For array fields: provide short, factual items. Max 5 items per array.
8. Do NOT hallucinate or invent data not present in the text.
9. Translate German values to the appropriate English enum value.
10. If the text is mostly noise/irrelevant, return an empty object {}.`;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateEnum(value: unknown, allowed: string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim();
  if (allowed.includes(normalized)) return normalized;
  const mappings: Record<string, string> = {
    "true": "yes",
    "false": "no",
    "available": "yes",
    "unavailable": "no",
    "none": "no",
    "full": "yes",
  };
  return allowed.includes(mappings[normalized] ?? "") ? mappings[normalized] : undefined;
}

function truncate(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLen);
}

function clampInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function calculateConfidence(
  extracted: Record<string, unknown>,
  totalFields: number,
  keyFields: string[],
  textLength: number,
): number {
  const populated = Object.keys(extracted).filter(k =>
    k !== "confidence_score" && extracted[k] !== null && extracted[k] !== undefined && extracted[k] !== ""
  ).length;

  let score = Math.round((populated / totalFields) * 70);

  const hasKeyFields = keyFields.every(k =>
    extracted[k] !== null && extracted[k] !== undefined && extracted[k] !== ""
  );
  if (hasKeyFields) score += 15;

  if (textLength > 2000) score += 15;

  return Math.min(100, score);
}

/**
 * Strips null/undefined values from an extracted object so only real data is returned.
 *
 * Args:
 *     obj: Raw extraction result.
 *
 * Returns:
 *     Object with only non-null, non-undefined values.
 */
function stripNulls<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== null && v !== undefined && v !== "") {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

// ---------------------------------------------------------------------------
// Extraction result types
// ---------------------------------------------------------------------------

export interface FoodExtraction {
  establishment_type?: string;
  price_level?: number;
  noise_level?: string;
  ambiance?: string;
  vibe?: string;
  dress_code?: string;
  has_outdoor_seating?: boolean;
  kid_friendly?: boolean;
  has_wifi?: boolean;
  has_live_music?: boolean;
  reservation_policy?: string;
  smoking_policy?: string;
  diet_vegetarian?: string;
  diet_vegan?: string;
  diet_halal?: string;
  diet_gluten_free?: string;
  diet_kosher?: string;
  diet_lactose_free?: string;
  diet_pescetarian?: string;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_cocktails?: boolean;
  alcohol_policy?: string;
  good_for_groups?: boolean;
  signature_dishes?: string[];
  michelin_stars?: number;
  confidence_score?: number;
}

export interface HistoryExtraction {
  subtype?: string;
  year_built?: number;
  year_destroyed?: number;
  historical_significance?: string;
  key_figures?: string[];
  key_events?: string[];
  original_purpose?: string;
  current_use?: string;
  heritage_level?: string;
  preservation_status?: string;
  construction_materials?: string[];
  confidence_score?: number;
}

export interface ArchitectureExtraction {
  subtype?: string;
  primary_style?: string;
  architect?: string;
  year_built?: number;
  year_renovated?: number;
  height_meters?: number;
  building_levels?: number;
  construction_materials?: string[];
  interior_highlights?: string[];
  denomination?: string;
  is_active_worship?: boolean;
  tower_accessible?: boolean;
  notable_features?: string;
  best_photo_angle?: string;
  confidence_score?: number;
}

export interface NatureExtraction {
  subtype?: string;
  area_hectares?: number;
  trail_length_km?: number;
  trail_difficulty?: string;
  elevation_gain_m?: number;
  flora_highlights?: string[];
  wildlife_highlights?: string[];
  facilities?: string[];
  picnic_allowed?: boolean;
  swimming_allowed?: boolean;
  cycling_allowed?: boolean;
  lit_at_night?: boolean;
  notable_features?: string;
  entry_points?: string[];
  confidence_score?: number;
}

export interface ArtCultureExtraction {
  subtype?: string;
  collection_focus?: string;
  notable_works?: string[];
  has_permanent_collection?: boolean;
  has_rotating_exhibitions?: boolean;
  guided_tours?: boolean;
  audio_guide?: boolean;
  photography_allowed?: boolean;
  avg_visit_minutes?: number;
  genre_focus?: string;
  capacity?: number;
  notable_performers?: string[];
  founded_year?: number;
  vibe?: string;
  confidence_score?: number;
}

export interface NightlifeExtraction {
  subtype?: string;
  signature_drinks?: string[];
  dress_code?: string;
  cover_charge?: number;
  happy_hour?: string;
  peak_hours?: string;
  age_demographic?: string;
  has_dancefloor?: boolean;
  has_live_music?: boolean;
  has_dj?: boolean;
  outdoor_area?: boolean;
  smoking_area?: boolean;
  capacity?: number;
  food_served?: boolean;
  vibe?: string;
  music_genres?: string[];
  confidence_score?: number;
}

export interface ShoppingExtraction {
  subtype?: string;
  product_highlights?: string[];
  brands?: string[];
  is_secondhand?: boolean;
  is_local_crafts?: boolean;
  is_luxury?: boolean;
  market_days?: string;
  cash_only?: boolean;
  vibe?: string;
  confidence_score?: number;
}

export interface ViewpointExtraction {
  subtype?: string;
  elevation_m?: number;
  view_direction?: string;
  visible_landmarks?: string[];
  best_time?: string;
  weather_dependent?: boolean;
  indoor_viewing?: boolean;
  telescope_available?: boolean;
  requires_climb?: boolean;
  steps_count?: number;
  photography_tips?: string;
  crowd_level?: string;
  confidence_score?: number;
}

export interface TransportExtraction {
  subtype?: string;
  lines?: string[];
  operator?: string;
  year_opened?: number;
  daily_ridership?: number;
  is_interchange?: boolean;
  has_elevator?: boolean;
  has_bike_parking?: boolean;
  notable_features?: string;
  nearby_connections?: string[];
  confidence_score?: number;
}

export interface EducationExtraction {
  subtype?: string;
  founded_year?: number;
  specialization?: string;
  notable_alumni?: string[];
  student_count?: number;
  is_public?: boolean;
  has_public_access?: boolean;
  has_library?: boolean;
  architectural_note?: string;
  notable_features?: string;
  confidence_score?: number;
}

export interface HealthExtraction {
  subtype?: string;
  specialization?: string;
  founded_year?: number;
  is_emergency?: boolean;
  accepts_insurance?: boolean;
  has_appointment_booking?: boolean;
  spoken_languages?: string[];
  facilities?: string[];
  notable_features?: string;
  vibe?: string;
  confidence_score?: number;
}

export interface SportsExtraction {
  subtype?: string;
  sports?: string[];
  home_team?: string;
  capacity?: number;
  year_built?: number;
  is_public_access?: boolean;
  has_equipment_rental?: boolean;
  has_coaching?: boolean;
  notable_events?: string[];
  notable_features?: string;
  vibe?: string;
  confidence_score?: number;
}

export interface ServicesExtraction {
  subtype?: string;
  service_type?: string;
  operator?: string;
  founded_year?: number;
  has_online_booking?: boolean;
  spoken_languages?: string[];
  wait_time_note?: string;
  historical_note?: string;
  notable_features?: string;
  confidence_score?: number;
}

export interface MenuDishExtraction {
  name: string;
  local_name?: string;
  description?: string;
  price?: number;
  currency?: string;
  menu_section?: string;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  contains_pork?: boolean;
  contains_alcohol?: boolean;
  spicy_level?: number;
}

export interface MenuExtraction {
  dishes: MenuDishExtraction[];
}

// ---------------------------------------------------------------------------
// Per-category validators
// ---------------------------------------------------------------------------

function validateFoodExtraction(raw: FoodExtraction): Partial<FoodExtraction> {
  const result: Partial<FoodExtraction> = {};

  const dietAllowed = ["yes", "no", "only"];
  result.diet_vegetarian = validateEnum(raw.diet_vegetarian, dietAllowed);
  result.diet_vegan = validateEnum(raw.diet_vegan, dietAllowed);
  result.diet_halal = validateEnum(raw.diet_halal, dietAllowed);
  result.diet_gluten_free = validateEnum(raw.diet_gluten_free, dietAllowed);
  result.diet_kosher = validateEnum(raw.diet_kosher, dietAllowed);
  result.diet_lactose_free = validateEnum(raw.diet_lactose_free, dietAllowed);
  result.diet_pescetarian = validateEnum(raw.diet_pescetarian, dietAllowed);

  result.establishment_type = truncate(raw.establishment_type, 30);
  result.noise_level = validateEnum(raw.noise_level, ["quiet", "moderate", "loud", "very_loud"]);
  result.ambiance = validateEnum(raw.ambiance, ["fine_dining", "casual", "fast_casual", "street_food", "food_hall"]);
  result.dress_code = validateEnum(raw.dress_code, ["none", "smart_casual", "formal"]);
  result.reservation_policy = validateEnum(raw.reservation_policy, ["walk_in_only", "accepted", "recommended", "required"]);
  result.smoking_policy = validateEnum(raw.smoking_policy, ["no_smoking", "outdoor_only", "designated_area", "allowed"]);
  result.alcohol_policy = validateEnum(raw.alcohol_policy, ["full_bar", "beer_wine", "byob", "no_alcohol"]);
  result.price_level = clampInt(raw.price_level, 1, 4);
  result.michelin_stars = clampInt(raw.michelin_stars, 0, 3);

  if (typeof raw.has_outdoor_seating === "boolean") result.has_outdoor_seating = raw.has_outdoor_seating;
  if (typeof raw.kid_friendly === "boolean") result.kid_friendly = raw.kid_friendly;
  if (typeof raw.has_wifi === "boolean") result.has_wifi = raw.has_wifi;
  if (typeof raw.has_live_music === "boolean") result.has_live_music = raw.has_live_music;
  if (typeof raw.serves_beer === "boolean") result.serves_beer = raw.serves_beer;
  if (typeof raw.serves_wine === "boolean") result.serves_wine = raw.serves_wine;
  if (typeof raw.serves_cocktails === "boolean") result.serves_cocktails = raw.serves_cocktails;
  if (typeof raw.good_for_groups === "boolean") result.good_for_groups = raw.good_for_groups;
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.signature_dishes)) result.signature_dishes = raw.signature_dishes.slice(0, 5);

  return stripNulls(result);
}

function validateHistoryExtraction(raw: HistoryExtraction): Partial<HistoryExtraction> {
  const result: Partial<HistoryExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.heritage_level = validateEnum(raw.heritage_level, ["unesco", "national", "regional", "local"]);
  result.preservation_status = validateEnum(raw.preservation_status, ["intact", "restored", "partial_ruins", "ruins"]);

  if (typeof raw.year_built === "number" && Number.isFinite(raw.year_built)) result.year_built = Math.round(raw.year_built);
  if (typeof raw.year_destroyed === "number" && Number.isFinite(raw.year_destroyed)) result.year_destroyed = Math.round(raw.year_destroyed);
  if (typeof raw.historical_significance === "string") result.historical_significance = raw.historical_significance;
  if (typeof raw.original_purpose === "string") result.original_purpose = truncate(raw.original_purpose, 200);
  if (typeof raw.current_use === "string") result.current_use = truncate(raw.current_use, 200);
  if (Array.isArray(raw.key_figures)) result.key_figures = raw.key_figures.slice(0, 5);
  if (Array.isArray(raw.key_events)) result.key_events = raw.key_events.slice(0, 5);
  if (Array.isArray(raw.construction_materials)) result.construction_materials = raw.construction_materials.slice(0, 5);

  return stripNulls(result);
}

function validateArchitectureExtraction(raw: ArchitectureExtraction): Partial<ArchitectureExtraction> {
  const result: Partial<ArchitectureExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.primary_style = truncate(raw.primary_style, 100);
  result.denomination = validateEnum(raw.denomination, ["catholic", "protestant", "sunni", "shia", "jewish"]);

  if (typeof raw.architect === "string") result.architect = truncate(raw.architect, 200);
  if (typeof raw.year_built === "number" && Number.isFinite(raw.year_built)) result.year_built = Math.round(raw.year_built);
  if (typeof raw.year_renovated === "number" && Number.isFinite(raw.year_renovated)) result.year_renovated = Math.round(raw.year_renovated);
  if (typeof raw.height_meters === "number" && Number.isFinite(raw.height_meters)) result.height_meters = raw.height_meters;
  if (typeof raw.building_levels === "number" && Number.isFinite(raw.building_levels)) result.building_levels = Math.round(raw.building_levels);
  if (typeof raw.is_active_worship === "boolean") result.is_active_worship = raw.is_active_worship;
  if (typeof raw.tower_accessible === "boolean") result.tower_accessible = raw.tower_accessible;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (typeof raw.best_photo_angle === "string") result.best_photo_angle = raw.best_photo_angle;
  if (Array.isArray(raw.construction_materials)) result.construction_materials = raw.construction_materials.slice(0, 5);
  if (Array.isArray(raw.interior_highlights)) result.interior_highlights = raw.interior_highlights.slice(0, 5);

  return stripNulls(result);
}

function validateNatureExtraction(raw: NatureExtraction): Partial<NatureExtraction> {
  const result: Partial<NatureExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.trail_difficulty = validateEnum(raw.trail_difficulty, ["easy", "moderate", "difficult"]);

  if (typeof raw.area_hectares === "number" && Number.isFinite(raw.area_hectares)) result.area_hectares = raw.area_hectares;
  if (typeof raw.trail_length_km === "number" && Number.isFinite(raw.trail_length_km)) result.trail_length_km = raw.trail_length_km;
  if (typeof raw.elevation_gain_m === "number" && Number.isFinite(raw.elevation_gain_m)) result.elevation_gain_m = Math.round(raw.elevation_gain_m);
  if (typeof raw.picnic_allowed === "boolean") result.picnic_allowed = raw.picnic_allowed;
  if (typeof raw.swimming_allowed === "boolean") result.swimming_allowed = raw.swimming_allowed;
  if (typeof raw.cycling_allowed === "boolean") result.cycling_allowed = raw.cycling_allowed;
  if (typeof raw.lit_at_night === "boolean") result.lit_at_night = raw.lit_at_night;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (Array.isArray(raw.flora_highlights)) result.flora_highlights = raw.flora_highlights.slice(0, 5);
  if (Array.isArray(raw.wildlife_highlights)) result.wildlife_highlights = raw.wildlife_highlights.slice(0, 5);
  if (Array.isArray(raw.facilities)) result.facilities = raw.facilities.slice(0, 5);
  if (Array.isArray(raw.entry_points)) result.entry_points = raw.entry_points.slice(0, 5);

  return stripNulls(result);
}

function validateArtCultureExtraction(raw: ArtCultureExtraction): Partial<ArtCultureExtraction> {
  const result: Partial<ArtCultureExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.genre_focus = truncate(raw.genre_focus, 100);

  if (typeof raw.collection_focus === "string") result.collection_focus = raw.collection_focus;
  if (typeof raw.has_permanent_collection === "boolean") result.has_permanent_collection = raw.has_permanent_collection;
  if (typeof raw.has_rotating_exhibitions === "boolean") result.has_rotating_exhibitions = raw.has_rotating_exhibitions;
  if (typeof raw.guided_tours === "boolean") result.guided_tours = raw.guided_tours;
  if (typeof raw.audio_guide === "boolean") result.audio_guide = raw.audio_guide;
  if (typeof raw.photography_allowed === "boolean") result.photography_allowed = raw.photography_allowed;
  if (typeof raw.avg_visit_minutes === "number" && Number.isFinite(raw.avg_visit_minutes)) result.avg_visit_minutes = Math.round(raw.avg_visit_minutes);
  if (typeof raw.capacity === "number" && Number.isFinite(raw.capacity)) result.capacity = Math.round(raw.capacity);
  if (typeof raw.founded_year === "number" && Number.isFinite(raw.founded_year)) result.founded_year = Math.round(raw.founded_year);
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.notable_works)) result.notable_works = raw.notable_works.slice(0, 5);
  if (Array.isArray(raw.notable_performers)) result.notable_performers = raw.notable_performers.slice(0, 5);

  return stripNulls(result);
}

function validateNightlifeExtraction(raw: NightlifeExtraction): Partial<NightlifeExtraction> {
  const result: Partial<NightlifeExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.dress_code = truncate(raw.dress_code, 100);
  result.age_demographic = truncate(raw.age_demographic, 50);

  if (typeof raw.cover_charge === "number" && Number.isFinite(raw.cover_charge)) result.cover_charge = raw.cover_charge;
  if (typeof raw.happy_hour === "string") result.happy_hour = truncate(raw.happy_hour, 100);
  if (typeof raw.peak_hours === "string") result.peak_hours = truncate(raw.peak_hours, 100);
  if (typeof raw.has_dancefloor === "boolean") result.has_dancefloor = raw.has_dancefloor;
  if (typeof raw.has_live_music === "boolean") result.has_live_music = raw.has_live_music;
  if (typeof raw.has_dj === "boolean") result.has_dj = raw.has_dj;
  if (typeof raw.outdoor_area === "boolean") result.outdoor_area = raw.outdoor_area;
  if (typeof raw.smoking_area === "boolean") result.smoking_area = raw.smoking_area;
  if (typeof raw.capacity === "number" && Number.isFinite(raw.capacity)) result.capacity = Math.round(raw.capacity);
  if (typeof raw.food_served === "boolean") result.food_served = raw.food_served;
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.signature_drinks)) result.signature_drinks = raw.signature_drinks.slice(0, 5);
  if (Array.isArray(raw.music_genres)) result.music_genres = raw.music_genres.slice(0, 5);

  return stripNulls(result);
}

function validateShoppingExtraction(raw: ShoppingExtraction): Partial<ShoppingExtraction> {
  const result: Partial<ShoppingExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.market_days = truncate(raw.market_days, 100);

  if (typeof raw.is_secondhand === "boolean") result.is_secondhand = raw.is_secondhand;
  if (typeof raw.is_local_crafts === "boolean") result.is_local_crafts = raw.is_local_crafts;
  if (typeof raw.is_luxury === "boolean") result.is_luxury = raw.is_luxury;
  if (typeof raw.cash_only === "boolean") result.cash_only = raw.cash_only;
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.product_highlights)) result.product_highlights = raw.product_highlights.slice(0, 5);
  if (Array.isArray(raw.brands)) result.brands = raw.brands.slice(0, 5);

  return stripNulls(result);
}

function validateViewpointExtraction(raw: ViewpointExtraction): Partial<ViewpointExtraction> {
  const result: Partial<ViewpointExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  result.view_direction = truncate(raw.view_direction, 50);
  result.crowd_level = validateEnum(raw.crowd_level, ["low", "moderate", "high", "very_high"]);

  if (typeof raw.elevation_m === "number" && Number.isFinite(raw.elevation_m)) result.elevation_m = raw.elevation_m;
  if (typeof raw.best_time === "string") result.best_time = truncate(raw.best_time, 100);
  if (typeof raw.weather_dependent === "boolean") result.weather_dependent = raw.weather_dependent;
  if (typeof raw.indoor_viewing === "boolean") result.indoor_viewing = raw.indoor_viewing;
  if (typeof raw.telescope_available === "boolean") result.telescope_available = raw.telescope_available;
  if (typeof raw.requires_climb === "boolean") result.requires_climb = raw.requires_climb;
  if (typeof raw.steps_count === "number" && Number.isFinite(raw.steps_count)) result.steps_count = Math.round(raw.steps_count);
  if (typeof raw.photography_tips === "string") result.photography_tips = raw.photography_tips;
  if (Array.isArray(raw.visible_landmarks)) result.visible_landmarks = raw.visible_landmarks.slice(0, 5);

  return stripNulls(result);
}

/**
 * Validates and sanitizes raw transport extraction output from LLM.
 *
 * @param raw - Raw LLM extraction result.
 * @returns Sanitized partial transport extraction with only valid fields.
 */
function validateTransportExtraction(raw: TransportExtraction): Partial<TransportExtraction> {
  const result: Partial<TransportExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  if (typeof raw.operator === "string") result.operator = truncate(raw.operator, 200);
  result.year_opened = clampInt(raw.year_opened, 0, 2100);
  result.daily_ridership = clampInt(raw.daily_ridership, 0, 100000000);
  if (typeof raw.is_interchange === "boolean") result.is_interchange = raw.is_interchange;
  if (typeof raw.has_elevator === "boolean") result.has_elevator = raw.has_elevator;
  if (typeof raw.has_bike_parking === "boolean") result.has_bike_parking = raw.has_bike_parking;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (Array.isArray(raw.lines)) result.lines = raw.lines.slice(0, 10);
  if (Array.isArray(raw.nearby_connections)) result.nearby_connections = raw.nearby_connections.slice(0, 5);

  return stripNulls(result);
}

/**
 * Validates and sanitizes raw education extraction output from LLM.
 *
 * @param raw - Raw LLM extraction result.
 * @returns Sanitized partial education extraction with only valid fields.
 */
function validateEducationExtraction(raw: EducationExtraction): Partial<EducationExtraction> {
  const result: Partial<EducationExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  if (typeof raw.specialization === "string") result.specialization = truncate(raw.specialization, 200);
  result.founded_year = clampInt(raw.founded_year, 0, 2100);
  result.student_count = clampInt(raw.student_count, 0, 1000000);
  if (typeof raw.is_public === "boolean") result.is_public = raw.is_public;
  if (typeof raw.has_public_access === "boolean") result.has_public_access = raw.has_public_access;
  if (typeof raw.has_library === "boolean") result.has_library = raw.has_library;
  if (typeof raw.architectural_note === "string") result.architectural_note = raw.architectural_note;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (Array.isArray(raw.notable_alumni)) result.notable_alumni = raw.notable_alumni.slice(0, 5);

  return stripNulls(result);
}

/**
 * Validates and sanitizes raw health extraction output from LLM.
 *
 * @param raw - Raw LLM extraction result.
 * @returns Sanitized partial health extraction with only valid fields.
 */
function validateHealthExtraction(raw: HealthExtraction): Partial<HealthExtraction> {
  const result: Partial<HealthExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  if (typeof raw.specialization === "string") result.specialization = truncate(raw.specialization, 200);
  result.founded_year = clampInt(raw.founded_year, 0, 2100);
  if (typeof raw.is_emergency === "boolean") result.is_emergency = raw.is_emergency;
  if (typeof raw.accepts_insurance === "boolean") result.accepts_insurance = raw.accepts_insurance;
  if (typeof raw.has_appointment_booking === "boolean") result.has_appointment_booking = raw.has_appointment_booking;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.spoken_languages)) result.spoken_languages = raw.spoken_languages.slice(0, 5);
  if (Array.isArray(raw.facilities)) result.facilities = raw.facilities.slice(0, 5);

  return stripNulls(result);
}

/**
 * Validates and sanitizes raw sports extraction output from LLM.
 *
 * @param raw - Raw LLM extraction result.
 * @returns Sanitized partial sports extraction with only valid fields.
 */
function validateSportsExtraction(raw: SportsExtraction): Partial<SportsExtraction> {
  const result: Partial<SportsExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  if (typeof raw.home_team === "string") result.home_team = truncate(raw.home_team, 200);
  result.capacity = clampInt(raw.capacity, 0, 500000);
  result.year_built = clampInt(raw.year_built, 0, 2100);
  if (typeof raw.is_public_access === "boolean") result.is_public_access = raw.is_public_access;
  if (typeof raw.has_equipment_rental === "boolean") result.has_equipment_rental = raw.has_equipment_rental;
  if (typeof raw.has_coaching === "boolean") result.has_coaching = raw.has_coaching;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (typeof raw.vibe === "string") result.vibe = raw.vibe;
  if (Array.isArray(raw.sports)) result.sports = raw.sports.slice(0, 5);
  if (Array.isArray(raw.notable_events)) result.notable_events = raw.notable_events.slice(0, 5);

  return stripNulls(result);
}

/**
 * Validates and sanitizes raw services extraction output from LLM.
 *
 * @param raw - Raw LLM extraction result.
 * @returns Sanitized partial services extraction with only valid fields.
 */
function validateServicesExtraction(raw: ServicesExtraction): Partial<ServicesExtraction> {
  const result: Partial<ServicesExtraction> = {};

  result.subtype = truncate(raw.subtype, 50);
  if (typeof raw.service_type === "string") result.service_type = truncate(raw.service_type, 100);
  if (typeof raw.operator === "string") result.operator = truncate(raw.operator, 200);
  result.founded_year = clampInt(raw.founded_year, 0, 2100);
  if (typeof raw.has_online_booking === "boolean") result.has_online_booking = raw.has_online_booking;
  if (typeof raw.wait_time_note === "string") result.wait_time_note = raw.wait_time_note;
  if (typeof raw.historical_note === "string") result.historical_note = raw.historical_note;
  if (typeof raw.notable_features === "string") result.notable_features = raw.notable_features;
  if (Array.isArray(raw.spoken_languages)) result.spoken_languages = raw.spoken_languages.slice(0, 5);

  return stripNulls(result);
}

// ---------------------------------------------------------------------------
// User prompt builders
// ---------------------------------------------------------------------------

function buildFoodUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured restaurant/food data from the following text about "${poiName}".

Fields to extract:
- establishment_type: string (max 30 chars, e.g. "restaurant", "cafe", "bakery", "beer_garden", "bar")
- price_level: integer 1 (budget) to 4 (luxury)
- noise_level: "quiet" | "moderate" | "loud" | "very_loud"
- ambiance: "fine_dining" | "casual" | "fast_casual" | "street_food" | "food_hall"
- vibe: one descriptive sentence
- dress_code: "none" | "smart_casual" | "formal"
- has_outdoor_seating: boolean
- kid_friendly: boolean
- has_wifi: boolean
- has_live_music: boolean
- reservation_policy: "walk_in_only" | "accepted" | "recommended" | "required"
- smoking_policy: "no_smoking" | "outdoor_only" | "designated_area" | "allowed"
- diet_vegetarian: "yes" | "no" | "only"
- diet_vegan: "yes" | "no" | "only"
- diet_halal: "yes" | "no" | "only"
- diet_gluten_free: "yes" | "no" | "only"
- diet_kosher: "yes" | "no" | "only"
- diet_lactose_free: "yes" | "no" | "only"
- diet_pescetarian: "yes" | "no" | "only"
- serves_beer: boolean
- serves_wine: boolean
- serves_cocktails: boolean
- alcohol_policy: "full_bar" | "beer_wine" | "byob" | "no_alcohol"
- good_for_groups: boolean
- signature_dishes: array of dish name strings (max 5)
- michelin_stars: integer 0 to 3

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildHistoryUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured historical data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "castle", "monument", "memorial", "ruins", "palace", "city_gate", "fortress", "battlefield")
- year_built: integer (negative for BC)
- year_destroyed: integer or null
- historical_significance: 1-2 sentence summary
- key_figures: array of person names (max 5)
- key_events: array of event descriptions (max 5)
- original_purpose: string
- current_use: string
- heritage_level: "unesco" | "national" | "regional" | "local"
- preservation_status: "intact" | "restored" | "partial_ruins" | "ruins"
- construction_materials: array of material names (max 5)

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildArchitectureUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured architectural data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "church", "cathedral", "mosque", "tower", "bridge", "townhall", "synagogue", "temple")
- primary_style: string (max 100 chars, e.g. "Late Gothic with Baroque interior")
- architect: architect name
- year_built: integer
- year_renovated: integer
- height_meters: number
- building_levels: integer
- construction_materials: array of material names (max 5)
- interior_highlights: array of notable interior features (max 5)
- denomination: "catholic" | "protestant" | "sunni" | "shia" | "jewish"
- is_active_worship: boolean
- tower_accessible: boolean
- notable_features: one descriptive sentence
- best_photo_angle: photography tip

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildNatureUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured nature/park data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "park", "garden", "nature_reserve", "zoo", "trail", "lake", "forest", "botanical_garden")
- area_hectares: number
- trail_length_km: number
- trail_difficulty: "easy" | "moderate" | "difficult"
- elevation_gain_m: integer
- flora_highlights: array of notable plant species or features (max 5)
- wildlife_highlights: array of notable animal species (max 5)
- facilities: array of available facilities (max 5, e.g. "Playground", "Beer garden", "Toilets", "Parking")
- picnic_allowed: boolean
- swimming_allowed: boolean
- cycling_allowed: boolean
- lit_at_night: boolean
- notable_features: one descriptive sentence
- entry_points: array of entry point descriptions (max 5)

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildArtCultureUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured art/culture venue data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "museum", "gallery", "theatre", "cinema", "concert_hall", "opera_house", "cultural_center")
- collection_focus: what the collection centers on
- notable_works: array of famous works or pieces (max 5)
- has_permanent_collection: boolean
- has_rotating_exhibitions: boolean
- guided_tours: boolean
- audio_guide: boolean
- photography_allowed: boolean
- avg_visit_minutes: integer
- genre_focus: string (max 100 chars, e.g. "Contemporary Art", "Classical Music")
- capacity: integer seating/visitor capacity
- notable_performers: array of famous performers or artists associated (max 5)
- founded_year: integer
- vibe: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildNightlifeUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured nightlife venue data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "bar", "pub", "nightclub", "cocktail_bar", "speakeasy", "lounge", "rooftop_bar")
- signature_drinks: array of drink names (max 5)
- dress_code: string (max 100 chars, e.g. "casual", "smart_casual", "club_wear")
- cover_charge: number in EUR
- happy_hour: description of happy hour times/deals
- peak_hours: string (e.g. "Fri-Sat after midnight")
- age_demographic: string (max 50 chars, e.g. "20s-30s", "mixed")
- has_dancefloor: boolean
- has_live_music: boolean
- has_dj: boolean
- outdoor_area: boolean
- smoking_area: boolean
- capacity: integer
- food_served: boolean
- vibe: one descriptive sentence
- music_genres: array of genre names (max 5, e.g. "techno", "house", "jazz")

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildShoppingUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured shopping venue data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "boutique", "mall", "market", "vintage", "bookstore", "department_store", "souvenir")
- product_highlights: array of notable products or product categories (max 5)
- brands: array of brand names carried (max 5)
- is_secondhand: boolean
- is_local_crafts: boolean
- is_luxury: boolean
- market_days: string (max 100 chars, e.g. "Every Saturday 8am-2pm")
- cash_only: boolean
- vibe: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildViewpointUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured viewpoint/scenic spot data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "rooftop", "tower", "hill", "observation_deck", "bridge", "terrace")
- elevation_m: number in meters
- view_direction: string (max 50 chars, e.g. "360 degrees", "South toward Alps")
- visible_landmarks: array of landmark names visible from here (max 5)
- best_time: string (e.g. "Sunset", "Clear winter mornings")
- weather_dependent: boolean
- indoor_viewing: boolean
- telescope_available: boolean
- requires_climb: boolean
- steps_count: integer
- photography_tips: one sentence tip
- crowd_level: "low" | "moderate" | "high" | "very_high"

TEXT:
${scrapedText.slice(0, 6000)}`;
}

/**
 * Builds an LLM user prompt for extracting transport hub profile data.
 *
 * @param poiName - Name of the POI for prompt context.
 * @param scrapedText - Scraped text to extract from (truncated to 6000 chars).
 * @returns Formatted prompt string with field definitions.
 */
function buildTransportUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured transport hub data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "metro_station", "bus_stop", "tram_stop", "train_station", "ferry")
- lines: array of line names/numbers (max 10)
- operator: operator name
- year_opened: integer
- daily_ridership: integer
- is_interchange: boolean
- has_elevator: boolean
- has_bike_parking: boolean
- notable_features: one descriptive sentence
- nearby_connections: array of nearby transport connections (max 5)

TEXT:
${scrapedText.slice(0, 6000)}`;
}

/**
 * Builds an LLM user prompt for extracting education institution profile data.
 *
 * @param poiName - Name of the POI for prompt context.
 * @param scrapedText - Scraped text to extract from (truncated to 6000 chars).
 * @returns Formatted prompt string with field definitions.
 */
function buildEducationUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured education institution data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "university", "school", "library", "research_institute", "academy")
- founded_year: integer
- specialization: field of study or focus
- notable_alumni: array of notable alumni names (max 5)
- student_count: integer
- is_public: boolean
- has_public_access: boolean
- has_library: boolean
- architectural_note: one sentence about the building
- notable_features: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

/**
 * Builds an LLM user prompt for extracting health facility profile data.
 *
 * @param poiName - Name of the POI for prompt context.
 * @param scrapedText - Scraped text to extract from (truncated to 6000 chars).
 * @returns Formatted prompt string with field definitions.
 */
function buildHealthUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured health facility data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "hospital", "clinic", "pharmacy", "dental", "spa", "wellness_center")
- specialization: medical specialty or focus
- founded_year: integer
- is_emergency: boolean
- accepts_insurance: boolean
- has_appointment_booking: boolean
- spoken_languages: array of languages spoken (max 5)
- facilities: array of available facilities (max 5)
- notable_features: one descriptive sentence
- vibe: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

/**
 * Builds an LLM user prompt for extracting sports venue profile data.
 *
 * @param poiName - Name of the POI for prompt context.
 * @param scrapedText - Scraped text to extract from (truncated to 6000 chars).
 * @returns Formatted prompt string with field definitions.
 */
function buildSportsUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured sports venue data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "stadium", "gym", "sports_center", "swimming_pool", "tennis_court", "climbing_wall")
- sports: array of sports played/available (max 5)
- home_team: name of home team if applicable
- capacity: integer seating/visitor capacity
- year_built: integer
- is_public_access: boolean
- has_equipment_rental: boolean
- has_coaching: boolean
- notable_events: array of notable events held here (max 5)
- notable_features: one descriptive sentence
- vibe: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

/**
 * Builds an LLM user prompt for extracting public service profile data.
 *
 * @param poiName - Name of the POI for prompt context.
 * @param scrapedText - Scraped text to extract from (truncated to 6000 chars).
 * @returns Formatted prompt string with field definitions.
 */
function buildServicesUserPrompt(poiName: string, scrapedText: string): string {
  return `Extract structured public service data from the following text about "${poiName}".

Fields to extract:
- subtype: string (max 50 chars, e.g. "post_office", "bank", "police_station", "fire_station", "embassy", "government_office")
- service_type: string (max 100 chars, type of service provided)
- operator: operator or governing body
- founded_year: integer
- has_online_booking: boolean
- spoken_languages: array of languages spoken (max 5)
- wait_time_note: typical wait time description
- historical_note: historical significance note
- notable_features: one descriptive sentence

TEXT:
${scrapedText.slice(0, 6000)}`;
}

function buildMenuUserPrompt(poiName: string, scrapedText: string, currency: string): string {
  return `Extract menu items from the following restaurant menu text for "${poiName}".
Return a JSON object with a "dishes" array. Each dish should have:

- name: dish name in English (required)
- local_name: dish name in original language if different
- description: brief description if available
- price: number (without currency symbol)
- currency: "${currency}"
- menu_section: one of "appetizer", "main", "dessert", "drink", "side", "soup", "salad", "breakfast"
- is_vegetarian: boolean if determinable
- is_vegan: boolean if determinable
- is_gluten_free: boolean if determinable
- contains_pork: boolean if determinable
- contains_alcohol: boolean if determinable
- spicy_level: 0-5 if determinable

Extract up to 30 dishes maximum. Omit fields you cannot determine.

MENU TEXT:
${scrapedText.slice(0, 6000)}`;
}

// ---------------------------------------------------------------------------
// Extractor functions
// ---------------------------------------------------------------------------

/**
 * Extracts food profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial food profile data with confidence score, or null on failure.
 */
export async function extractFoodProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<FoodExtraction> | null> {
  const raw = await chatExtract<FoodExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildFoodUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateFoodExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    21,
    ["establishment_type", "price_level"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts history profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial history profile data with confidence score, or null on failure.
 */
export async function extractHistoryProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<HistoryExtraction> | null> {
  const raw = await chatExtract<HistoryExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildHistoryUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateHistoryExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    11,
    ["year_built", "historical_significance"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts architecture profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial architecture profile data with confidence score, or null on failure.
 */
export async function extractArchitectureProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<ArchitectureExtraction> | null> {
  const raw = await chatExtract<ArchitectureExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildArchitectureUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateArchitectureExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    13,
    ["primary_style", "year_built"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts nature profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial nature profile data with confidence score, or null on failure.
 */
export async function extractNatureProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<NatureExtraction> | null> {
  const raw = await chatExtract<NatureExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildNatureUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateNatureExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    14,
    ["subtype", "facilities"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts art/culture profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial art/culture profile data with confidence score, or null on failure.
 */
export async function extractArtCultureProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<ArtCultureExtraction> | null> {
  const raw = await chatExtract<ArtCultureExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildArtCultureUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateArtCultureExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    13,
    ["subtype", "collection_focus"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts nightlife profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial nightlife profile data with confidence score, or null on failure.
 */
export async function extractNightlifeProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<NightlifeExtraction> | null> {
  const raw = await chatExtract<NightlifeExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildNightlifeUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateNightlifeExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    15,
    ["subtype", "vibe"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts shopping profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial shopping profile data with confidence score, or null on failure.
 */
export async function extractShoppingProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<ShoppingExtraction> | null> {
  const raw = await chatExtract<ShoppingExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildShoppingUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateShoppingExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    8,
    ["subtype", "product_highlights"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts viewpoint profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial viewpoint profile data with confidence score, or null on failure.
 */
export async function extractViewpointProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<ViewpointExtraction> | null> {
  const raw = await chatExtract<ViewpointExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildViewpointUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateViewpointExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    11,
    ["subtype", "visible_landmarks"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts transport profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial transport profile data with confidence score, or null on failure.
 */
export async function extractTransportProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<TransportExtraction> | null> {
  const raw = await chatExtract<TransportExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildTransportUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateTransportExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    10,
    ["subtype", "lines"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts education profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial education profile data with confidence score, or null on failure.
 */
export async function extractEducationProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<EducationExtraction> | null> {
  const raw = await chatExtract<EducationExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildEducationUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateEducationExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    10,
    ["subtype", "founded_year"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts health profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial health profile data with confidence score, or null on failure.
 */
export async function extractHealthProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<HealthExtraction> | null> {
  const raw = await chatExtract<HealthExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildHealthUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateHealthExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    10,
    ["subtype", "specialization"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts sports profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial sports profile data with confidence score, or null on failure.
 */
export async function extractSportsProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<SportsExtraction> | null> {
  const raw = await chatExtract<SportsExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildSportsUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateSportsExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    11,
    ["subtype", "sports"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts services profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Partial services profile data with confidence score, or null on failure.
 */
export async function extractServicesProfile(
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Partial<ServicesExtraction> | null> {
  const raw = await chatExtract<ServicesExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildServicesUserPrompt(poiName, scrapedText),
  );
  if (!raw) return null;

  const validated = validateServicesExtraction(raw);
  validated.confidence_score = calculateConfidence(
    validated as Record<string, unknown>,
    9,
    ["subtype", "service_type"],
    textLength ?? scrapedText.length,
  );
  return validated;
}

/**
 * Extracts menu/dish data from scraped menu page text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from a menu page.
 *     poiName: Name of the restaurant for context.
 *     currency: Expected currency code (default EUR).
 *
 * Returns:
 *     Array of extracted dish data, or empty array on failure.
 */
export async function extractMenuDishes(
  scrapedText: string,
  poiName: string,
  currency: string = "EUR",
): Promise<MenuDishExtraction[]> {
  const result = await chatExtract<MenuExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    buildMenuUserPrompt(poiName, scrapedText, currency),
  );
  if (!result?.dishes || !Array.isArray(result.dishes)) {
    return [];
  }
  return result.dishes.filter((d) => d.name && d.name.length > 0);
}

/**
 * Dispatches extraction to the appropriate category-specific extractor.
 *
 * Args:
 *     categorySlug: The category slug to determine which extractor to use.
 *     scrapedText: The scraped text to extract from.
 *     poiName: Name of the POI for context.
 *     textLength: Full scraped text length before truncation, for confidence calculation.
 *
 * Returns:
 *     Extracted profile data as a partial record, or null if unsupported/failed.
 */
export async function extractProfileByCategory(
  categorySlug: string,
  scrapedText: string,
  poiName: string,
  textLength?: number,
): Promise<Record<string, unknown> | null> {
  switch (categorySlug) {
    case "food":
      return (await extractFoodProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "history":
      return (await extractHistoryProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "architecture":
      return (await extractArchitectureProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "nature":
      return (await extractNatureProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "art":
    case "culture":
      return (await extractArtCultureProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "nightlife":
      return (await extractNightlifeProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "shopping":
      return (await extractShoppingProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "views":
      return (await extractViewpointProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "transport":
      return (await extractTransportProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "education":
      return (await extractEducationProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "health":
      return (await extractHealthProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "sports":
      return (await extractSportsProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    case "services":
      return (await extractServicesProfile(scrapedText, poiName, textLength)) as Record<string, unknown> | null;
    default:
      log.warn(`No extractor for category: ${categorySlug}`);
      return null;
  }
}
