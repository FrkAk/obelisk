import { classifyQuery } from "./queryClassifier";
import { createLogger } from "@/lib/logger";
import type { ParsedIntent } from "@/types/api";

const log = createLogger("queryParser");

const DEFAULT_INTENT: ParsedIntent = {
  filters: {},
  keywords: [],
  source: "default",
};

const FAST_PATH: Record<string, ParsedIntent> = {
  pizza: { category: "food", keywords: ["pizza", "restaurant"], cuisineTypes: ["pizza"], filters: {} },
  burger: { category: "food", keywords: ["burger", "fast_food", "restaurant"], cuisineTypes: ["burger"], filters: {} },
  sushi: { category: "food", keywords: ["sushi", "restaurant"], cuisineTypes: ["sushi"], filters: {} },
  ramen: { category: "food", keywords: ["ramen", "restaurant"], cuisineTypes: ["ramen"], filters: {} },
  thai: { category: "food", keywords: ["thai", "restaurant"], cuisineTypes: ["thai"], filters: {} },
  indian: { category: "food", keywords: ["indian", "restaurant"], cuisineTypes: ["indian"], filters: {} },
  italian: { category: "food", keywords: ["italian", "restaurant"], cuisineTypes: ["italian"], filters: {} },
  mexican: { category: "food", keywords: ["mexican", "restaurant"], cuisineTypes: ["mexican"], filters: {} },
  chinese: { category: "food", keywords: ["chinese", "restaurant"], cuisineTypes: ["chinese"], filters: {} },
  vietnamese: { category: "food", keywords: ["vietnamese", "restaurant"], cuisineTypes: ["vietnamese"], filters: {} },
  greek: { category: "food", keywords: ["greek", "restaurant"], cuisineTypes: ["greek"], filters: {} },
  kebab: { category: "food", keywords: ["kebab", "fast_food", "restaurant"], cuisineTypes: ["kebab"], filters: {} },
  "döner": { category: "food", keywords: ["döner", "kebab", "fast_food"], cuisineTypes: ["kebab"], filters: {} },
  doner: { category: "food", keywords: ["döner", "kebab", "fast_food"], cuisineTypes: ["kebab"], filters: {} },
  currywurst: { category: "food", keywords: ["currywurst", "fast_food", "snack"], cuisineTypes: ["german"], filters: {} },
  simit: { category: "food", keywords: ["simit", "bakery", "cafe"], cuisineTypes: ["turkish"], filters: {} },
  breze: { category: "food", keywords: ["bakery", "breze"], cuisineTypes: ["german"], filters: {} },
  bretzel: { category: "food", keywords: ["bakery", "breze"], cuisineTypes: ["german"], filters: {} },
  pretzel: { category: "food", keywords: ["bakery", "breze"], cuisineTypes: ["german"], filters: {} },
  coffee: { category: "food", keywords: ["cafe", "coffee"], filters: {} },
  cafe: { category: "food", keywords: ["cafe", "coffee"], filters: {} },
  "café": { category: "food", keywords: ["cafe", "coffee"], filters: {} },
  kaffee: { category: "food", keywords: ["cafe", "coffee"], filters: {} },
  beer: { category: "food", keywords: ["beer", "biergarten", "bar"], filters: {} },
  bier: { category: "food", keywords: ["beer", "biergarten", "bar"], filters: {} },
  restaurant: { category: "food", keywords: ["restaurant"], filters: {} },
  bakery: { category: "food", keywords: ["bakery"], filters: {} },
  "bäckerei": { category: "food", keywords: ["bakery"], filters: {} },
  backerei: { category: "food", keywords: ["bakery"], filters: {} },
  metzgerei: { category: "food", keywords: ["butcher", "shop"], filters: {} },
  butcher: { category: "food", keywords: ["butcher", "shop"], filters: {} },
  breakfast: { category: "food", keywords: ["cafe", "breakfast", "restaurant"], filters: {} },
  "frühstück": { category: "food", keywords: ["cafe", "breakfast", "restaurant"], filters: {} },
  fruhstuck: { category: "food", keywords: ["cafe", "breakfast", "restaurant"], filters: {} },
  brunch: { category: "food", keywords: ["cafe", "brunch", "restaurant"], filters: {} },
  "ice cream": { category: "food", keywords: ["ice_cream"], filters: {} },
  eis: { category: "food", keywords: ["ice_cream"], filters: {} },
  gelato: { category: "food", keywords: ["ice_cream"], filters: {} },
  biergarten: { category: "food", keywords: ["biergarten"], filters: {} },
  "beer garden": { category: "food", keywords: ["biergarten"], filters: {} },
  steak: { category: "food", keywords: ["steak", "restaurant"], cuisineTypes: ["steak"], filters: {} },
  vegan: { category: "food", keywords: ["vegan", "restaurant"], cuisineTypes: ["vegan"], filters: {} },
  vegetarian: { category: "food", keywords: ["vegetarian", "restaurant"], cuisineTypes: ["vegetarian"], filters: {} },
  korean: { category: "food", keywords: ["korean", "restaurant"], cuisineTypes: ["korean"], filters: {} },
  japanese: { category: "food", keywords: ["japanese", "restaurant"], cuisineTypes: ["japanese"], filters: {} },
  lebanese: { category: "food", keywords: ["lebanese", "restaurant"], cuisineTypes: ["lebanese"], filters: {} },
  turkish: { category: "food", keywords: ["turkish", "restaurant"], cuisineTypes: ["turkish"], filters: {} },
  persian: { category: "food", keywords: ["persian", "restaurant"], cuisineTypes: ["persian"], filters: {} },
  afghan: { category: "food", keywords: ["afghan", "restaurant"], cuisineTypes: ["afghan"], filters: {} },
  tapas: { category: "food", keywords: ["tapas", "restaurant"], cuisineTypes: ["spanish"], filters: {} },
  spanish: { category: "food", keywords: ["spanish", "restaurant"], cuisineTypes: ["spanish"], filters: {} },
  french: { category: "food", keywords: ["french", "restaurant"], cuisineTypes: ["french"], filters: {} },
  falafel: { category: "food", keywords: ["falafel", "fast_food", "restaurant"], cuisineTypes: ["middle_eastern"], filters: {} },
  pho: { category: "food", keywords: ["pho", "restaurant"], cuisineTypes: ["vietnamese"], filters: {} },
  "dim sum": { category: "food", keywords: ["dim_sum", "restaurant"], cuisineTypes: ["chinese"], filters: {} },
  noodles: { category: "food", keywords: ["noodles", "restaurant"], filters: {} },
  waffles: { category: "food", keywords: ["waffles", "cafe", "bakery"], filters: {} },
  schnitzel: { category: "food", keywords: ["schnitzel", "restaurant"], cuisineTypes: ["german"], filters: {} },
  weisswurst: { category: "food", keywords: ["weisswurst", "restaurant"], cuisineTypes: ["german"], filters: {} },
  "weißwurst": { category: "food", keywords: ["weisswurst", "restaurant"], cuisineTypes: ["german"], filters: {} },
  bavarian: { category: "food", keywords: ["bavarian", "restaurant"], cuisineTypes: ["german"], filters: {} },

  bar: { category: "nightlife", keywords: ["bar", "pub"], filters: {} },
  pub: { category: "nightlife", keywords: ["pub", "bar"], filters: {} },
  club: { category: "nightlife", keywords: ["nightclub"], filters: {} },
  disco: { category: "nightlife", keywords: ["nightclub"], filters: {} },
  disko: { category: "nightlife", keywords: ["nightclub"], filters: {} },
  nightclub: { category: "nightlife", keywords: ["nightclub"], filters: {} },
  cocktail: { category: "nightlife", keywords: ["cocktail_bar", "bar"], filters: {} },
  "cocktail bar": { category: "nightlife", keywords: ["cocktail_bar", "bar"], filters: {} },
  shisha: { category: "nightlife", keywords: ["shisha_bar", "bar"], filters: {} },
  hookah: { category: "nightlife", keywords: ["shisha_bar", "bar"], filters: {} },
  karaoke: { category: "nightlife", keywords: ["karaoke", "bar"], filters: {} },
  kneipe: { category: "nightlife", keywords: ["bar", "pub"], filters: {} },
  "wine bar": { category: "nightlife", keywords: ["wine_bar", "bar"], filters: {} },
  lounge: { category: "nightlife", keywords: ["lounge", "bar"], filters: {} },

  museum: { category: "art", keywords: ["museum"], filters: {} },
  gallery: { category: "art", keywords: ["gallery"], filters: {} },
  galerie: { category: "art", keywords: ["gallery"], filters: {} },
  theater: { category: "culture", keywords: ["theatre"], filters: {} },
  theatre: { category: "culture", keywords: ["theatre"], filters: {} },
  cinema: { category: "culture", keywords: ["cinema"], filters: {} },
  kino: { category: "culture", keywords: ["cinema"], filters: {} },
  movie: { category: "culture", keywords: ["cinema"], filters: {} },
  library: { category: "education", keywords: ["library"], filters: {} },
  "bücherei": { category: "education", keywords: ["library"], filters: {} },
  bucherei: { category: "education", keywords: ["library"], filters: {} },
  bibliothek: { category: "education", keywords: ["library"], filters: {} },
  "opera": { category: "culture", keywords: ["opera", "theatre"], filters: {} },
  "concert": { category: "culture", keywords: ["concert_hall", "music_venue"], filters: {} },

  park: { category: "nature", keywords: ["park"], filters: {} },
  garden: { category: "nature", keywords: ["garden"], filters: {} },
  garten: { category: "nature", keywords: ["garden"], filters: {} },
  playground: { category: "nature", keywords: ["playground"], filters: {} },
  spielplatz: { category: "nature", keywords: ["playground"], filters: {} },
  zoo: { category: "nature", keywords: ["zoo"], filters: {} },
  lake: { category: "nature", keywords: ["lake", "water"], filters: {} },
  see: { category: "nature", keywords: ["lake", "water"], filters: {} },
  river: { category: "nature", keywords: ["river", "water"], filters: {} },
  forest: { category: "nature", keywords: ["forest", "wood"], filters: {} },
  wald: { category: "nature", keywords: ["forest", "wood"], filters: {} },

  gym: { category: "sports", keywords: ["fitness_centre", "gym"], filters: {} },
  fitness: { category: "sports", keywords: ["fitness_centre", "gym"], filters: {} },
  fitnessstudio: { category: "sports", keywords: ["fitness_centre", "gym"], filters: {} },
  swimming: { category: "sports", keywords: ["swimming_pool"], filters: {} },
  schwimmbad: { category: "sports", keywords: ["swimming_pool"], filters: {} },
  pool: { category: "sports", keywords: ["swimming_pool"], filters: {} },
  "swimming pool": { category: "sports", keywords: ["swimming_pool"], filters: {} },
  tennis: { category: "sports", keywords: ["tennis"], filters: {} },
  stadium: { category: "sports", keywords: ["stadium"], filters: {} },
  stadion: { category: "sports", keywords: ["stadium"], filters: {} },
  yoga: { category: "sports", keywords: ["yoga", "fitness_centre"], filters: {} },
  basketball: { category: "sports", keywords: ["basketball"], filters: {} },
  soccer: { category: "sports", keywords: ["soccer", "football"], filters: {} },
  football: { category: "sports", keywords: ["soccer", "football"], filters: {} },
  "fußball": { category: "sports", keywords: ["soccer", "football"], filters: {} },
  climbing: { category: "sports", keywords: ["climbing", "sports_centre"], filters: {} },
  klettern: { category: "sports", keywords: ["climbing", "sports_centre"], filters: {} },
  bouldering: { category: "sports", keywords: ["climbing", "bouldering"], filters: {} },
  sauna: { category: "sports", keywords: ["sauna", "spa"], filters: {} },
  spa: { category: "sports", keywords: ["spa", "sauna"], filters: {} },

  hospital: { category: "health", keywords: ["hospital"], filters: {} },
  krankenhaus: { category: "health", keywords: ["hospital"], filters: {} },
  pharmacy: { category: "health", keywords: ["pharmacy"], filters: {} },
  apotheke: { category: "health", keywords: ["pharmacy"], filters: {} },
  doctor: { category: "health", keywords: ["doctors"], filters: {} },
  arzt: { category: "health", keywords: ["doctors"], filters: {} },
  dentist: { category: "health", keywords: ["dentist"], filters: {} },
  zahnarzt: { category: "health", keywords: ["dentist"], filters: {} },

  bank: { category: "services", keywords: ["bank"], filters: {} },
  atm: { category: "services", keywords: ["atm"], filters: {} },
  geldautomat: { category: "services", keywords: ["atm"], filters: {} },
  "post office": { category: "services", keywords: ["post_office"], filters: {} },
  post: { category: "services", keywords: ["post_office"], filters: {} },
  postamt: { category: "services", keywords: ["post_office"], filters: {} },
  police: { category: "services", keywords: ["police"], filters: {} },
  polizei: { category: "services", keywords: ["police"], filters: {} },
  toilet: { category: "services", keywords: ["toilets"], filters: {} },
  wc: { category: "services", keywords: ["toilets"], filters: {} },
  restroom: { category: "services", keywords: ["toilets"], filters: {} },
  toilette: { category: "services", keywords: ["toilets"], filters: {} },
  rathaus: { category: "services", keywords: ["townhall"], filters: {} },
  "town hall": { category: "services", keywords: ["townhall"], filters: {} },
  "city hall": { category: "services", keywords: ["townhall"], filters: {} },
  laundry: { category: "services", keywords: ["laundry", "dry_cleaning"], filters: {} },
  "waschsalon": { category: "services", keywords: ["laundry"], filters: {} },

  supermarket: { category: "shopping", keywords: ["supermarket"], filters: {} },
  supermarkt: { category: "shopping", keywords: ["supermarket"], filters: {} },
  mall: { category: "shopping", keywords: ["mall"], filters: {} },
  einkaufszentrum: { category: "shopping", keywords: ["mall"], filters: {} },
  bookstore: { category: "shopping", keywords: ["books", "shop"], filters: {} },
  buchhandlung: { category: "shopping", keywords: ["books", "shop"], filters: {} },
  "flower shop": { category: "shopping", keywords: ["florist", "shop"], filters: {} },
  florist: { category: "shopping", keywords: ["florist", "shop"], filters: {} },

  metro: { category: "transport", keywords: ["subway"], filters: {} },
  "u-bahn": { category: "transport", keywords: ["subway"], filters: {} },
  ubahn: { category: "transport", keywords: ["subway"], filters: {} },
  subway: { category: "transport", keywords: ["subway"], filters: {} },
  train: { category: "transport", keywords: ["station"], filters: {} },
  "s-bahn": { category: "transport", keywords: ["station"], filters: {} },
  sbahn: { category: "transport", keywords: ["station"], filters: {} },
  bahnhof: { category: "transport", keywords: ["station"], filters: {} },
  tram: { category: "transport", keywords: ["tram_stop"], filters: {} },
  "straßenbahn": { category: "transport", keywords: ["tram_stop"], filters: {} },
  bus: { category: "transport", keywords: ["bus_station"], filters: {} },
  "bus stop": { category: "transport", keywords: ["bus_station"], filters: {} },
  parking: { category: "transport", keywords: ["parking"], filters: {} },
  parkplatz: { category: "transport", keywords: ["parking"], filters: {} },
  "gas station": { category: "transport", keywords: ["fuel"], filters: {} },
  tankstelle: { category: "transport", keywords: ["fuel"], filters: {} },
  taxi: { category: "transport", keywords: ["taxi"], filters: {} },
  "bike rental": { category: "transport", keywords: ["bicycle_rental"], filters: {} },
  "e-scooter": { category: "transport", keywords: ["scooter_rental"], filters: {} },

  university: { category: "education", keywords: ["university"], filters: {} },
  "universität": { category: "education", keywords: ["university"], filters: {} },
  universitat: { category: "education", keywords: ["university"], filters: {} },
  uni: { category: "education", keywords: ["university"], filters: {} },
  school: { category: "education", keywords: ["school"], filters: {} },
  schule: { category: "education", keywords: ["school"], filters: {} },
  kindergarten: { category: "education", keywords: ["kindergarten"], filters: {} },
  kita: { category: "education", keywords: ["kindergarten"], filters: {} },

  church: { category: "culture", keywords: ["church", "place_of_worship"], filters: {} },
  kirche: { category: "culture", keywords: ["church", "place_of_worship"], filters: {} },
  mosque: { category: "culture", keywords: ["mosque", "place_of_worship"], filters: {} },
  moschee: { category: "culture", keywords: ["mosque", "place_of_worship"], filters: {} },
  synagogue: { category: "culture", keywords: ["synagogue", "place_of_worship"], filters: {} },
  castle: { category: "architecture", keywords: ["castle"], filters: {} },
  schloss: { category: "architecture", keywords: ["castle"], filters: {} },
  palace: { category: "architecture", keywords: ["palace", "castle"], filters: {} },
  fountain: { category: "architecture", keywords: ["fountain"], filters: {} },
  brunnen: { category: "architecture", keywords: ["fountain"], filters: {} },
  monument: { category: "architecture", keywords: ["monument", "memorial"], filters: {} },
  denkmal: { category: "architecture", keywords: ["monument", "memorial"], filters: {} },
  statue: { category: "architecture", keywords: ["statue", "monument"], filters: {} },
  bridge: { category: "architecture", keywords: ["bridge"], filters: {} },
  "brücke": { category: "architecture", keywords: ["bridge"], filters: {} },
  brucke: { category: "architecture", keywords: ["bridge"], filters: {} },
  tower: { category: "architecture", keywords: ["tower"], filters: {} },
  turm: { category: "architecture", keywords: ["tower"], filters: {} },

  hotel: { category: "services", keywords: ["hotel"], filters: {} },
  hostel: { category: "services", keywords: ["hostel"], filters: {} },
  airbnb: { category: "services", keywords: ["guest_house"], filters: {} },
  "guest house": { category: "services", keywords: ["guest_house"], filters: {} },
  pension: { category: "services", keywords: ["guest_house"], filters: {} },

  clothes: { category: "shopping", keywords: ["clothes", "shop"], filters: {} },
  shoes: { category: "shopping", keywords: ["shoes", "shop"], filters: {} },
  hairdresser: { category: "services", keywords: ["hairdresser"], filters: {} },

  viewpoint: { category: "views", keywords: ["viewpoint"], filters: {} },
  aussichtspunkt: { category: "views", keywords: ["viewpoint"], filters: {} },
  rooftop: { category: "views", keywords: ["viewpoint", "rooftop"], filters: {} },
};

const DISCOVERY_QUERIES = new Set([
  "surprise me", "discover", "explore", "random", "anything",
  "show me something", "what's around", "nearby", "interesting",
]);

/**
 * Parses a search query into structured intent using fast-path lookup
 * or embedding-based classification fallback.
 *
 * Args:
 *     query: The user's search query string.
 *
 * Returns:
 *     Structured intent with category, keywords, cuisine types, and filters.
 */
export async function parseQueryIntent(query: string): Promise<ParsedIntent> {
  if (!query.trim()) {
    return DEFAULT_INTENT;
  }

  const normalized = query.trim().toLowerCase();

  if (isDiscoveryQuery(normalized)) {
    return { isDiscovery: true, keywords: [], filters: {} };
  }

  const fastResult = lookupFastPath(normalized);
  if (fastResult) {
    log.info(`Fast-path: "${query}"`);
    return { ...fastResult, source: "fast-path" };
  }

  if (normalized.length < 3) {
    return DEFAULT_INTENT;
  }

  try {
    const classification = await classifyQuery(query);
    log.info(`Classifier: "${query}"`);
    return {
      keywords: [],
      ...classification,
      source: "classifier",
    };
  } catch (error) {
    log.warn(`Classifier failed for: "${query}"`, error);
    return DEFAULT_INTENT;
  }
}

/**
 * Checks if the query is a discovery/random exploration request.
 *
 * Args:
 *     normalized: Lowercase trimmed query string.
 *
 * Returns:
 *     True if the query matches a discovery pattern.
 */
function isDiscoveryQuery(normalized: string): boolean {
  return DISCOVERY_QUERIES.has(normalized);
}

/**
 * Looks up the normalized query in the fast-path map, trying exact match first
 * then multi-word prefix matching.
 *
 * Args:
 *     normalized: Lowercase trimmed query string.
 *
 * Returns:
 *     Matched ParsedIntent or undefined if no match found.
 */
function lookupFastPath(normalized: string): ParsedIntent | undefined {
  const exact = FAST_PATH[normalized];
  if (exact) {
    return exact;
  }

  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    for (let len = words.length; len >= 1; len--) {
      const prefix = words.slice(0, len).join(" ");
      const match = FAST_PATH[prefix];
      if (match) {
        return match;
      }
    }
  }

  return undefined;
}
