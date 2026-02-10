import { generateText, SEARCH_MODEL } from "@/lib/ai/ollama";
import { createLogger } from "@/lib/logger";

const log = createLogger("extractors");

const EXTRACTION_OPTIONS = { temperature: 0.1, num_predict: 2048 };

/**
 * Calls Ollama to extract structured JSON from unstructured text.
 *
 * Args:
 *     prompt: The full extraction prompt.
 *
 * Returns:
 *     Parsed JSON object, or null if extraction failed.
 */
async function extractJson<T>(
  prompt: string,
): Promise<T | null> {
  try {
    const raw = await generateText(prompt, SEARCH_MODEL, EXTRACTION_OPTIONS);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log.warn("No JSON block found in LLM response");
      return null;
    }
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error(`JSON extraction failed: ${msg}`);
    return null;
  }
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
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_cocktails?: boolean;
  alcohol_policy?: string;
  good_for_groups?: boolean;
  signature_dishes?: string[];
  michelin_stars?: number;
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
// Extractor functions
// ---------------------------------------------------------------------------

/**
 * Extracts food profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial food profile data, or null on failure.
 */
export async function extractFoodProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<FoodExtraction> | null> {
  const prompt = `Extract structured restaurant/food data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- establishment_type: one of "restaurant", "cafe", "bakery", "food_truck", "bistro", "diner", "buffet", "tea_house", "juice_bar", "brewery", "food_stall", "beer_garden", "bar"
- price_level: 1 (budget) to 4 (luxury)
- noise_level: one of "quiet", "moderate", "loud", "very_loud"
- ambiance: one of "fine_dining", "casual", "fast_casual", "street_food", "food_hall"
- vibe: one descriptive sentence about the atmosphere
- dress_code: one of "none", "smart_casual", "formal"
- has_outdoor_seating: boolean
- kid_friendly: boolean
- has_wifi: boolean
- has_live_music: boolean
- reservation_policy: one of "walk_in_only", "accepted", "recommended", "required"
- smoking_policy: one of "no_smoking", "outdoor_only", "designated_area", "allowed"
- diet_vegetarian: one of "yes", "no", "only"
- diet_vegan: one of "yes", "no", "only"
- diet_halal: one of "yes", "no", "only"
- diet_gluten_free: one of "yes", "no", "only"
- serves_beer: boolean
- serves_wine: boolean
- serves_cocktails: boolean
- alcohol_policy: one of "full_bar", "beer_wine", "byob", "no_alcohol"
- good_for_groups: boolean
- signature_dishes: array of dish name strings
- michelin_stars: 0 to 3

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<FoodExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts history profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial history profile data, or null on failure.
 */
export async function extractHistoryProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<HistoryExtraction> | null> {
  const prompt = `Extract structured historical data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "castle", "monument", "memorial", "ruins", "palace", "city_gate", "fortress", "battlefield"
- year_built: integer (negative for BC)
- year_destroyed: integer or null
- historical_significance: 1-2 sentence summary
- key_figures: array of person names
- key_events: array of event descriptions
- original_purpose: string
- current_use: string
- heritage_level: one of "unesco", "national", "regional", "local"
- preservation_status: one of "intact", "restored", "partial_ruins", "ruins"
- construction_materials: array of material names

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<HistoryExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts architecture profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial architecture profile data, or null on failure.
 */
export async function extractArchitectureProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<ArchitectureExtraction> | null> {
  const prompt = `Extract structured architectural data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "church", "cathedral", "mosque", "tower", "bridge", "townhall", "synagogue", "temple"
- primary_style: e.g. "Late Gothic with Baroque interior"
- architect: architect name
- year_built: integer
- year_renovated: integer
- height_meters: number
- building_levels: integer
- construction_materials: array of material names
- interior_highlights: array of notable interior features
- denomination: one of "catholic", "protestant", "sunni", "shia", "jewish" or null
- is_active_worship: boolean
- tower_accessible: boolean
- notable_features: one descriptive sentence
- best_photo_angle: photography tip

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<ArchitectureExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts nature profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial nature profile data, or null on failure.
 */
export async function extractNatureProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<NatureExtraction> | null> {
  const prompt = `Extract structured nature/park data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "park", "garden", "nature_reserve", "zoo", "trail", "lake", "forest", "botanical_garden"
- area_hectares: number
- trail_length_km: number
- trail_difficulty: one of "easy", "moderate", "difficult"
- elevation_gain_m: integer
- flora_highlights: array of notable plant species or features
- wildlife_highlights: array of notable animal species
- facilities: array of available facilities (e.g. "Playground", "Beer garden", "Toilets", "Parking")
- picnic_allowed: boolean
- swimming_allowed: boolean
- cycling_allowed: boolean
- lit_at_night: boolean
- notable_features: one descriptive sentence
- entry_points: array of entry point descriptions

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<NatureExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts art/culture profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial art/culture profile data, or null on failure.
 */
export async function extractArtCultureProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<ArtCultureExtraction> | null> {
  const prompt = `Extract structured art/culture venue data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "museum", "gallery", "theatre", "cinema", "concert_hall", "opera_house", "cultural_center"
- collection_focus: what the collection centers on
- notable_works: array of famous works or pieces
- has_permanent_collection: boolean
- has_rotating_exhibitions: boolean
- guided_tours: boolean
- audio_guide: boolean
- photography_allowed: boolean
- avg_visit_minutes: integer
- genre_focus: e.g. "Contemporary Art", "Classical Music"
- capacity: integer seating/visitor capacity
- notable_performers: array of famous performers or artists associated
- founded_year: integer
- vibe: one descriptive sentence about the atmosphere

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<ArtCultureExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts nightlife profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial nightlife profile data, or null on failure.
 */
export async function extractNightlifeProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<NightlifeExtraction> | null> {
  const prompt = `Extract structured nightlife venue data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "bar", "pub", "nightclub", "cocktail_bar", "speakeasy", "lounge", "rooftop_bar"
- signature_drinks: array of drink names
- dress_code: e.g. "casual", "smart_casual", "club_wear"
- cover_charge: number in EUR
- happy_hour: description of happy hour times/deals
- peak_hours: e.g. "Fri-Sat after midnight"
- age_demographic: e.g. "20s-30s", "mixed"
- has_dancefloor: boolean
- has_live_music: boolean
- has_dj: boolean
- outdoor_area: boolean
- smoking_area: boolean
- capacity: integer
- food_served: boolean
- vibe: one descriptive sentence
- music_genres: array of genre names (e.g. "techno", "house", "jazz")

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<NightlifeExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts shopping profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial shopping profile data, or null on failure.
 */
export async function extractShoppingProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<ShoppingExtraction> | null> {
  const prompt = `Extract structured shopping venue data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "boutique", "mall", "market", "vintage", "bookstore", "department_store", "souvenir"
- product_highlights: array of notable products or product categories
- brands: array of brand names carried
- is_secondhand: boolean
- is_local_crafts: boolean
- is_luxury: boolean
- market_days: e.g. "Every Saturday 8am-2pm"
- cash_only: boolean
- vibe: one descriptive sentence

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<ShoppingExtraction>(prompt);
  return result ? stripNulls(result) : null;
}

/**
 * Extracts viewpoint profile data from scraped text using LLM.
 *
 * Args:
 *     scrapedText: Unstructured text from web scraping.
 *     poiName: Name of the POI for context.
 *
 * Returns:
 *     Partial viewpoint profile data, or null on failure.
 */
export async function extractViewpointProfile(
  scrapedText: string,
  poiName: string,
): Promise<Partial<ViewpointExtraction> | null> {
  const prompt = `Extract structured viewpoint/scenic spot data from the following text about "${poiName}".
Return ONLY a JSON object with these fields (omit any field you cannot determine):

- subtype: one of "rooftop", "tower", "hill", "observation_deck", "bridge", "terrace"
- elevation_m: number in meters
- view_direction: e.g. "360 degrees", "South toward Alps"
- visible_landmarks: array of landmark names visible from here
- best_time: e.g. "Sunset", "Clear winter mornings"
- weather_dependent: boolean
- indoor_viewing: boolean
- telescope_available: boolean
- requires_climb: boolean
- steps_count: integer
- photography_tips: one sentence tip
- crowd_level: one of "low", "moderate", "high", "very_high"

TEXT:
${scrapedText.slice(0, 4000)}

JSON:`;

  const result = await extractJson<ViewpointExtraction>(prompt);
  return result ? stripNulls(result) : null;
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
  const prompt = `Extract menu items from the following restaurant menu text for "${poiName}".
Return ONLY a JSON object with a "dishes" array. Each dish should have:

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
${scrapedText.slice(0, 6000)}

JSON:`;

  const result = await extractJson<MenuExtraction>(prompt);
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
 *
 * Returns:
 *     Extracted profile data as a partial record, or null if unsupported/failed.
 */
export async function extractProfileByCategory(
  categorySlug: string,
  scrapedText: string,
  poiName: string,
): Promise<Record<string, unknown> | null> {
  switch (categorySlug) {
    case "food":
      return (await extractFoodProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "history":
      return (await extractHistoryProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "architecture":
      return (await extractArchitectureProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "nature":
      return (await extractNatureProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "art":
    case "culture":
      return (await extractArtCultureProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "nightlife":
      return (await extractNightlifeProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "shopping":
      return (await extractShoppingProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    case "views":
      return (await extractViewpointProfile(scrapedText, poiName)) as Record<string, unknown> | null;
    default:
      log.warn(`No extractor for category: ${categorySlug}`);
      return null;
  }
}
