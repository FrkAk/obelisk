import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Builds tag_enrichment_map.json from OSM taginfo data and Google Product Taxonomy.
 *
 * Reads local data files (no network calls). Re-runnable.
 *
 * Outputs data/tag_enrichment_map.json with entries keyed by "key=value"
 * (e.g. "shop=clothes", "amenity=restaurant") containing keywords, products,
 * subtags, and matching Google taxonomy paths.
 */

const DATA_DIR = join(import.meta.dirname, "..", "data");
const TAGINFO_DIR = join(DATA_DIR, "taginfo");
const TAXONOMY_FILE = join(DATA_DIR, "google_product_taxonomy.txt");
const OUTPUT_FILE = join(DATA_DIR, "tag_enrichment_map.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TagInfoEntry {
  value: string;
  count: number;
  description?: string;
}

interface TagEnrichmentEntry {
  keywords: string[];
  products: string[];
  subtags: string[];
  googleTaxonomy: string[];
}

// ---------------------------------------------------------------------------
// Google Product Taxonomy loader
// ---------------------------------------------------------------------------

/**
 * Loads and parses the Google Product Taxonomy file into a list of category paths.
 *
 * Returns:
 *     Array of taxonomy path strings (e.g. "Apparel & Accessories > Clothing").
 */
function loadGoogleTaxonomy(): string[] {
  const raw = readFileSync(TAXONOMY_FILE, "utf-8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

// ---------------------------------------------------------------------------
// Taginfo loader
// ---------------------------------------------------------------------------

/**
 * Loads a taginfo JSON file and returns the data entries.
 *
 * Args:
 *     filename: Name of the JSON file in the taginfo directory.
 *
 * Returns:
 *     Array of tag info entries, or empty array if file not found.
 */
function loadTagInfo(filename: string): TagInfoEntry[] {
  const filepath = join(TAGINFO_DIR, filename);
  if (!existsSync(filepath)) return [];
  const raw = JSON.parse(readFileSync(filepath, "utf-8"));
  return raw.data ?? [];
}

// ---------------------------------------------------------------------------
// Google Taxonomy matching
// ---------------------------------------------------------------------------

/**
 * Finds Google taxonomy paths that match a set of search terms.
 *
 * Args:
 *     taxonomyLines: All taxonomy paths.
 *     searchTerms: Terms to match against (case-insensitive).
 *
 * Returns:
 *     Matching taxonomy path prefixes (up to 2 levels deep).
 */
function findTaxonomyMatches(taxonomyLines: string[], searchTerms: string[]): string[] {
  const matches = new Set<string>();
  const lowerTerms = searchTerms.map((t) => t.toLowerCase());

  for (const line of taxonomyLines) {
    const parts = line.split(" > ");
    const topTwo = parts.slice(0, Math.min(parts.length, 2)).join(" > ");
    const lowerTopTwo = topTwo.toLowerCase();

    for (const term of lowerTerms) {
      if (lowerTopTwo.includes(term)) {
        matches.add(topTwo);
        break;
      }
    }
  }

  return [...matches].slice(0, 5);
}

// ---------------------------------------------------------------------------
// Subtag extraction
// ---------------------------------------------------------------------------

/**
 * Extracts unique subtag values from a taginfo file.
 *
 * Args:
 *     filename: Taginfo JSON filename for the subtag key.
 *     minCount: Minimum global usage count to include.
 *
 * Returns:
 *     Sorted array of subtag value strings.
 */
function getSubtags(filename: string, minCount: number = 100): string[] {
  const entries = loadTagInfo(filename);
  return entries
    .filter((e) => e.count >= minCount && e.value !== "yes" && e.value !== "no" && !e.value.includes(";"))
    .map((e) => e.value)
    .sort();
}

// ---------------------------------------------------------------------------
// OSM tag -> enrichment mapping
// ---------------------------------------------------------------------------

/**
 * Mapping from OSM tag values to semantic keywords, products, and Google
 * taxonomy search terms. Organized by OSM key (shop, amenity, etc.).
 *
 * For product-oriented tags (shops), we map to Google taxonomy.
 * For service-oriented tags (restaurants, parks), we use domain keywords only.
 */

interface TagMapping {
  keywords: string[];
  products: string[];
  taxonomySearchTerms: string[];
  subtags?: string[];
}

const SHOP_MAPPINGS: Record<string, TagMapping> = {
  convenience: {
    keywords: ["convenience store", "grocery", "snacks", "everyday essentials", "corner shop"],
    products: ["snacks", "drinks", "bread", "milk", "toiletries", "household items", "cigarettes"],
    taxonomySearchTerms: ["food", "beverages", "tobacco"],
  },
  supermarket: {
    keywords: ["supermarket", "grocery", "food shopping", "produce", "fresh food"],
    products: ["groceries", "fresh produce", "meat", "dairy", "bakery items", "frozen food", "beverages"],
    taxonomySearchTerms: ["food", "beverages"],
  },
  clothes: {
    keywords: ["clothing", "fashion", "apparel", "garments", "wear"],
    products: ["jackets", "dresses", "shirts", "pants", "shoes", "coats", "outerwear", "skirts"],
    taxonomySearchTerms: ["clothing", "apparel"],
  },
  hairdresser: {
    keywords: ["hairdresser", "barber", "hair salon", "haircut", "styling"],
    products: ["haircut", "coloring", "styling", "blowout", "beard trim"],
    taxonomySearchTerms: ["hair care"],
  },
  car_repair: {
    keywords: ["car repair", "auto mechanic", "garage", "vehicle service"],
    products: ["oil change", "brake repair", "tire service", "engine diagnostics"],
    taxonomySearchTerms: ["vehicles", "parts"],
  },
  bakery: {
    keywords: ["bakery", "bread", "pastry", "baked goods", "cafe"],
    products: ["bread", "rolls", "croissants", "cakes", "pastries", "pretzels", "cookies"],
    taxonomySearchTerms: ["food", "bakery"],
  },
  car: {
    keywords: ["car dealership", "automobile", "vehicle sales"],
    products: ["new cars", "used cars", "car financing", "trade-in"],
    taxonomySearchTerms: ["vehicles"],
  },
  beauty: {
    keywords: ["beauty salon", "cosmetics", "skincare", "makeup"],
    products: ["facials", "makeup", "manicure", "pedicure", "waxing", "skincare treatments"],
    taxonomySearchTerms: ["health", "beauty"],
  },
  mobile_phone: {
    keywords: ["mobile phone", "cell phone", "smartphone", "telecom"],
    products: ["smartphones", "phone cases", "screen protectors", "chargers", "SIM cards"],
    taxonomySearchTerms: ["electronics", "phone"],
  },
  electronics: {
    keywords: ["electronics", "tech", "gadgets", "appliances"],
    products: ["computers", "TVs", "headphones", "cameras", "cables", "speakers"],
    taxonomySearchTerms: ["electronics"],
  },
  furniture: {
    keywords: ["furniture", "home furnishing", "interior", "decor"],
    products: ["sofas", "tables", "chairs", "beds", "shelves", "desks", "wardrobes"],
    taxonomySearchTerms: ["furniture"],
  },
  jewelry: {
    keywords: ["jewelry", "jewellery", "accessories", "luxury", "watches"],
    products: ["rings", "necklaces", "bracelets", "earrings", "watches", "gemstones"],
    taxonomySearchTerms: ["jewelry"],
  },
  optician: {
    keywords: ["optician", "eyewear", "glasses", "vision care"],
    products: ["eyeglasses", "sunglasses", "contact lenses", "lens cleaning"],
    taxonomySearchTerms: ["health", "vision care"],
  },
  shoes: {
    keywords: ["shoes", "footwear", "sneakers", "boots"],
    products: ["sneakers", "boots", "sandals", "heels", "flats", "running shoes", "loafers"],
    taxonomySearchTerms: ["shoes", "footwear"],
  },
  books: {
    keywords: ["bookstore", "books", "literature", "reading"],
    products: ["novels", "non-fiction", "children's books", "textbooks", "comics", "audiobooks"],
    taxonomySearchTerms: ["books", "media"],
  },
  alcohol: {
    keywords: ["liquor store", "wine shop", "spirits", "alcohol"],
    products: ["wine", "beer", "spirits", "whisky", "vodka", "liqueur"],
    taxonomySearchTerms: ["food", "beverages", "alcohol"],
  },
  florist: {
    keywords: ["florist", "flower shop", "bouquets", "plants"],
    products: ["bouquets", "roses", "potted plants", "dried flowers", "wreaths"],
    taxonomySearchTerms: ["home", "garden", "plants"],
  },
  hardware: {
    keywords: ["hardware store", "tools", "building supplies", "DIY"],
    products: ["tools", "screws", "paint", "lumber", "plumbing supplies", "electrical supplies"],
    taxonomySearchTerms: ["hardware", "tools"],
  },
  bicycle: {
    keywords: ["bicycle shop", "bike store", "cycling"],
    products: ["bicycles", "bike parts", "helmets", "locks", "tires", "lights"],
    taxonomySearchTerms: ["sporting goods", "cycling"],
  },
  pet: {
    keywords: ["pet shop", "pet supplies", "animals"],
    products: ["pet food", "toys", "leashes", "aquariums", "cages", "treats"],
    taxonomySearchTerms: ["animals", "pet supplies"],
  },
  doityourself: {
    keywords: ["DIY store", "home improvement", "building materials"],
    products: ["power tools", "paint", "tiles", "lumber", "plumbing", "garden supplies"],
    taxonomySearchTerms: ["hardware", "home", "garden"],
  },
  sports: {
    keywords: ["sports shop", "athletic gear", "sportswear", "fitness equipment"],
    products: ["sportswear", "running shoes", "yoga mats", "weights", "rackets", "balls"],
    taxonomySearchTerms: ["sporting goods"],
  },
  gift: {
    keywords: ["gift shop", "souvenirs", "presents"],
    products: ["greeting cards", "candles", "figurines", "novelty items", "keepsakes"],
    taxonomySearchTerms: [],
  },
  toys: {
    keywords: ["toy store", "games", "children's toys"],
    products: ["board games", "dolls", "LEGO", "puzzles", "action figures", "stuffed animals"],
    taxonomySearchTerms: ["toys", "games"],
  },
  department_store: {
    keywords: ["department store", "general merchandise", "shopping"],
    products: ["clothing", "home goods", "cosmetics", "accessories", "electronics"],
    taxonomySearchTerms: [],
  },
  mall: {
    keywords: ["shopping mall", "shopping center", "retail complex"],
    products: ["clothing", "food court", "entertainment", "accessories", "electronics"],
    taxonomySearchTerms: [],
  },
  kiosk: {
    keywords: ["kiosk", "newsstand", "tobacco shop", "snack stand"],
    products: ["newspapers", "magazines", "cigarettes", "snacks", "drinks", "lottery tickets"],
    taxonomySearchTerms: [],
  },
  chemist: {
    keywords: ["drugstore", "chemist", "health products", "personal care"],
    products: ["vitamins", "skincare", "shampoo", "toothpaste", "bandages", "supplements"],
    taxonomySearchTerms: ["health", "beauty"],
  },
  stationery: {
    keywords: ["stationery", "office supplies", "art supplies"],
    products: ["pens", "notebooks", "paper", "envelopes", "folders", "markers"],
    taxonomySearchTerms: ["office supplies"],
  },
  second_hand: {
    keywords: ["thrift store", "second hand", "vintage", "used goods"],
    products: ["used clothing", "furniture", "books", "electronics", "collectibles"],
    taxonomySearchTerms: [],
  },
  wine: {
    keywords: ["wine shop", "wine cellar", "vintner"],
    products: ["red wine", "white wine", "rosé", "sparkling wine", "champagne"],
    taxonomySearchTerms: ["food", "beverages"],
  },
  musical_instrument: {
    keywords: ["music store", "musical instruments", "music shop"],
    products: ["guitars", "pianos", "drums", "violins", "amplifiers", "sheet music"],
    taxonomySearchTerms: ["musical instruments"],
  },
  deli: {
    keywords: ["delicatessen", "gourmet food", "specialty food"],
    products: ["cheese", "charcuterie", "olives", "imported goods", "artisan bread"],
    taxonomySearchTerms: ["food"],
  },
  travel_agency: {
    keywords: ["travel agency", "holiday booking", "tours"],
    products: ["flights", "hotel booking", "package holidays", "cruise", "travel insurance"],
    taxonomySearchTerms: [],
  },
  confectionery: {
    keywords: ["confectionery", "candy shop", "sweets", "chocolate"],
    products: ["chocolates", "candies", "gummies", "pralines", "fudge", "lollipops"],
    taxonomySearchTerms: ["food"],
  },
  butcher: {
    keywords: ["butcher", "meat shop", "sausages"],
    products: ["beef", "pork", "chicken", "sausages", "cold cuts", "mince"],
    taxonomySearchTerms: ["food"],
  },
  outdoor: {
    keywords: ["outdoor store", "camping", "hiking gear", "adventure"],
    products: ["tents", "sleeping bags", "hiking boots", "backpacks", "rain gear", "fleece"],
    taxonomySearchTerms: ["sporting goods", "outdoor"],
  },
  cosmetics: {
    keywords: ["cosmetics store", "makeup", "beauty products"],
    products: ["foundation", "lipstick", "mascara", "perfume", "skincare", "nail polish"],
    taxonomySearchTerms: ["health", "beauty"],
  },
  greengrocer: {
    keywords: ["greengrocer", "fruit shop", "vegetable market", "produce"],
    products: ["fruits", "vegetables", "herbs", "salad", "potatoes", "berries"],
    taxonomySearchTerms: ["food"],
  },
  computer: {
    keywords: ["computer store", "IT shop", "tech"],
    products: ["laptops", "desktops", "keyboards", "mice", "monitors", "printers"],
    taxonomySearchTerms: ["electronics", "computers"],
  },
  dry_cleaning: {
    keywords: ["dry cleaning", "laundry service", "clothes cleaning"],
    products: ["dry cleaning", "ironing", "stain removal", "alterations"],
    taxonomySearchTerms: [],
  },
  tobacco: {
    keywords: ["tobacco shop", "cigar store", "smoking supplies"],
    products: ["cigarettes", "cigars", "pipe tobacco", "rolling papers", "lighters"],
    taxonomySearchTerms: ["tobacco"],
  },
  tyres: {
    keywords: ["tire shop", "tyre service", "wheel alignment"],
    products: ["tires", "rims", "wheel balancing", "tire repair"],
    taxonomySearchTerms: ["vehicles", "parts"],
  },
  interior_decoration: {
    keywords: ["interior decoration", "home decor", "furnishings"],
    products: ["curtains", "rugs", "cushions", "wall art", "vases", "candles"],
    taxonomySearchTerms: ["home", "decor"],
  },
  variety_store: {
    keywords: ["variety store", "discount store", "euro shop"],
    products: ["household items", "toys", "stationery", "cleaning supplies"],
    taxonomySearchTerms: [],
  },
  laundry: {
    keywords: ["laundromat", "self-service laundry", "washing"],
    products: ["washing", "drying", "detergent"],
    taxonomySearchTerms: [],
  },
  copyshop: {
    keywords: ["copy shop", "print shop", "printing service"],
    products: ["printing", "photocopying", "binding", "scanning", "business cards"],
    taxonomySearchTerms: [],
  },
  garden_centre: {
    keywords: ["garden center", "nursery", "plants", "gardening"],
    products: ["plants", "seeds", "soil", "pots", "garden tools", "fertilizer"],
    taxonomySearchTerms: ["home", "garden"],
  },
  massage: {
    keywords: ["massage parlor", "spa", "wellness", "relaxation"],
    products: ["massage", "aromatherapy", "hot stone", "thai massage", "reflexology"],
    taxonomySearchTerms: [],
  },
  seafood: {
    keywords: ["fish market", "seafood shop", "fishmonger"],
    products: ["fresh fish", "shrimp", "salmon", "tuna", "shellfish", "smoked fish"],
    taxonomySearchTerms: ["food"],
  },
  art: {
    keywords: ["art gallery", "art supplies", "art shop"],
    products: ["paintings", "prints", "canvases", "brushes", "paint sets", "sculptures"],
    taxonomySearchTerms: ["arts", "entertainment"],
  },
  photo: {
    keywords: ["photo shop", "camera store", "photography"],
    products: ["cameras", "lenses", "photo printing", "frames", "memory cards"],
    taxonomySearchTerms: ["cameras", "optics"],
  },
  lottery: {
    keywords: ["lottery", "betting shop", "gambling"],
    products: ["lottery tickets", "scratch cards", "sports betting"],
    taxonomySearchTerms: [],
  },
  charity: {
    keywords: ["charity shop", "thrift store", "donation shop"],
    products: ["used clothing", "used books", "household items", "vintage finds"],
    taxonomySearchTerms: [],
  },
  marketplace: {
    keywords: ["market", "farmers market", "flea market", "open-air market"],
    products: ["fresh produce", "handmade goods", "antiques", "street food", "crafts"],
    taxonomySearchTerms: [],
  },
  tattoo: {
    keywords: ["tattoo studio", "tattoo parlor", "body art"],
    products: ["tattoos", "piercings", "tattoo removal"],
    taxonomySearchTerms: [],
  },
  trade: {
    keywords: ["trade supply", "wholesale", "commercial supplies"],
    products: ["building materials", "commercial equipment", "industrial supplies"],
    taxonomySearchTerms: ["business", "industrial"],
  },
  pastry: {
    keywords: ["pastry shop", "patisserie", "cakes"],
    products: ["cakes", "tarts", "macarons", "eclairs", "pastries", "wedding cakes"],
    taxonomySearchTerms: ["food"],
  },
  herbalist: {
    keywords: ["herbalist", "herbal medicine", "natural remedies"],
    products: ["herbal teas", "tinctures", "essential oils", "supplements", "dried herbs"],
    taxonomySearchTerms: ["health"],
  },
  houseware: {
    keywords: ["houseware", "kitchen supplies", "home goods"],
    products: ["cookware", "kitchenware", "glassware", "utensils", "storage"],
    taxonomySearchTerms: ["home", "kitchen"],
  },
  bag: {
    keywords: ["bag store", "luggage shop", "handbags"],
    products: ["handbags", "backpacks", "suitcases", "wallets", "briefcases"],
    taxonomySearchTerms: ["luggage", "bags"],
  },
  craft: {
    keywords: ["craft store", "arts and crafts", "DIY crafts"],
    products: ["yarn", "fabric", "beads", "paints", "craft tools", "scrapbooking"],
    taxonomySearchTerms: ["arts", "crafts"],
  },
  coffee: {
    keywords: ["coffee shop", "coffee roaster", "coffee beans"],
    products: ["coffee beans", "ground coffee", "espresso", "coffee equipment"],
    taxonomySearchTerms: ["food", "beverages", "coffee"],
  },
  tea: {
    keywords: ["tea shop", "tea house", "loose leaf tea"],
    products: ["loose leaf tea", "green tea", "herbal tea", "matcha", "tea sets"],
    taxonomySearchTerms: ["food", "beverages", "tea"],
  },
  antiques: {
    keywords: ["antique shop", "antiques", "vintage collectibles"],
    products: ["antique furniture", "vintage decor", "collectibles", "old books", "porcelain"],
    taxonomySearchTerms: [],
  },
  ice_cream: {
    keywords: ["ice cream shop", "gelato", "frozen desserts"],
    products: ["ice cream", "gelato", "sorbet", "sundaes", "milkshakes"],
    taxonomySearchTerms: ["food"],
  },
  bed: {
    keywords: ["bed store", "mattress shop", "sleep shop"],
    products: ["mattresses", "bed frames", "pillows", "bedding", "duvets"],
    taxonomySearchTerms: ["furniture", "bedroom"],
  },
  perfumery: {
    keywords: ["perfumery", "fragrance shop", "perfume store"],
    products: ["perfume", "cologne", "body spray", "essential oils", "scented candles"],
    taxonomySearchTerms: ["health", "beauty"],
  },
  nutrition_supplements: {
    keywords: ["supplement store", "health food", "nutrition"],
    products: ["protein powder", "vitamins", "pre-workout", "amino acids", "creatine"],
    taxonomySearchTerms: ["health"],
  },
  wholesale: {
    keywords: ["wholesale", "bulk store", "cash and carry"],
    products: ["bulk food", "wholesale goods", "office supplies", "cleaning products"],
    taxonomySearchTerms: ["business", "industrial"],
  },
  "e-cigarette": {
    keywords: ["vape shop", "e-cigarette", "vaping"],
    products: ["e-cigarettes", "vape juice", "coils", "mods", "pods"],
    taxonomySearchTerms: [],
  },
  fabric: {
    keywords: ["fabric store", "textiles", "sewing supplies"],
    products: ["fabric", "thread", "patterns", "buttons", "zippers", "sewing machines"],
    taxonomySearchTerms: ["arts", "crafts"],
  },
  video_games: {
    keywords: ["video game store", "gaming", "game shop"],
    products: ["video games", "consoles", "controllers", "gaming accessories"],
    taxonomySearchTerms: ["electronics", "video games"],
  },
  ticket: {
    keywords: ["ticket office", "box office", "event tickets"],
    products: ["concert tickets", "theater tickets", "event passes"],
    taxonomySearchTerms: [],
  },
  newsagent: {
    keywords: ["newsagent", "newspaper shop", "press"],
    products: ["newspapers", "magazines", "greeting cards", "stationery"],
    taxonomySearchTerms: [],
  },
  hearing_aids: {
    keywords: ["hearing aids", "audiology", "hearing center"],
    products: ["hearing aids", "batteries", "ear molds", "hearing tests"],
    taxonomySearchTerms: ["health"],
  },
  medical_supply: {
    keywords: ["medical supply", "health equipment", "orthopedics"],
    products: ["wheelchairs", "crutches", "blood pressure monitors", "bandages"],
    taxonomySearchTerms: ["health"],
  },
  baby_goods: {
    keywords: ["baby store", "infant supplies", "nursery"],
    products: ["strollers", "car seats", "diapers", "baby clothes", "bottles", "cribs"],
    taxonomySearchTerms: ["baby", "toddler"],
  },
  dairy: {
    keywords: ["dairy shop", "cheese shop", "milk products"],
    products: ["cheese", "milk", "yogurt", "butter", "cream"],
    taxonomySearchTerms: ["food"],
  },
  organic: {
    keywords: ["organic shop", "health food store", "bio market"],
    products: ["organic produce", "natural foods", "whole grains", "supplements"],
    taxonomySearchTerms: ["food"],
  },
  pawnbroker: {
    keywords: ["pawn shop", "pawnbroker", "second hand valuables"],
    products: ["jewelry", "electronics", "watches", "musical instruments"],
    taxonomySearchTerms: [],
  },
  bathroom_furnishing: {
    keywords: ["bathroom store", "bathroom furnishing", "sanitary"],
    products: ["sinks", "bathtubs", "showers", "toilets", "tiles", "faucets"],
    taxonomySearchTerms: ["home", "bathroom"],
  },
  curtain: {
    keywords: ["curtain shop", "blinds", "window treatments"],
    products: ["curtains", "blinds", "drapes", "shutters", "roller blinds"],
    taxonomySearchTerms: ["home", "decor"],
  },
  carpet: {
    keywords: ["carpet store", "rugs", "floor coverings"],
    products: ["carpets", "rugs", "doormats", "runners", "floor tiles"],
    taxonomySearchTerms: ["home", "decor"],
  },
  kitchen: {
    keywords: ["kitchen store", "kitchen furnishing", "appliances"],
    products: ["kitchens", "cabinets", "countertops", "kitchen appliances", "sinks"],
    taxonomySearchTerms: ["home", "kitchen"],
  },
  chocolate: {
    keywords: ["chocolate shop", "chocolatier", "pralines"],
    products: ["chocolate bars", "pralines", "truffles", "hot chocolate", "gift boxes"],
    taxonomySearchTerms: ["food"],
  },
  watches: {
    keywords: ["watch store", "timepieces", "watch repair"],
    products: ["wristwatches", "pocket watches", "smartwatches", "watch straps"],
    taxonomySearchTerms: ["jewelry", "watches"],
  },
  rental: {
    keywords: ["rental shop", "equipment rental"],
    products: ["tool rental", "vehicle rental", "equipment hire"],
    taxonomySearchTerms: [],
  },
  cheese: {
    keywords: ["cheese shop", "fromagerie", "dairy"],
    products: ["artisan cheese", "aged cheese", "gouda", "brie", "cheddar"],
    taxonomySearchTerms: ["food"],
  },
  spices: {
    keywords: ["spice shop", "herbs and spices", "seasonings"],
    products: ["spices", "herbs", "pepper", "cinnamon", "curry powder", "saffron"],
    taxonomySearchTerms: ["food"],
  },
};

const AMENITY_MAPPINGS: Record<string, TagMapping> = {
  restaurant: {
    keywords: ["restaurant", "dining", "eat out", "meal", "lunch", "dinner"],
    products: ["lunch", "dinner", "breakfast", "beverages", "desserts"],
    taxonomySearchTerms: [],
  },
  cafe: {
    keywords: ["cafe", "coffee shop", "coffeehouse", "espresso", "brunch"],
    products: ["coffee", "tea", "pastries", "sandwiches", "cake"],
    taxonomySearchTerms: [],
  },
  fast_food: {
    keywords: ["fast food", "quick service", "takeaway", "drive-through"],
    products: ["burgers", "fries", "pizza", "chicken", "wraps", "kebab"],
    taxonomySearchTerms: [],
  },
  bar: {
    keywords: ["bar", "pub", "tavern", "drinks", "cocktails", "nightlife"],
    products: ["beer", "wine", "cocktails", "spirits", "snacks"],
    taxonomySearchTerms: [],
  },
  pub: {
    keywords: ["pub", "bar", "ale house", "beer garden", "drinks"],
    products: ["beer", "ale", "pub food", "spirits", "cider"],
    taxonomySearchTerms: [],
  },
  biergarten: {
    keywords: ["biergarten", "beer garden", "outdoor drinking", "bavarian"],
    products: ["beer", "bratwurst", "pretzels", "radler", "bavarian food"],
    taxonomySearchTerms: [],
  },
  nightclub: {
    keywords: ["nightclub", "club", "disco", "dancing", "nightlife", "DJ"],
    products: ["drinks", "dancing", "DJ sets", "VIP tables"],
    taxonomySearchTerms: [],
  },
  pharmacy: {
    keywords: ["pharmacy", "drugstore", "apotheke", "medication", "prescriptions"],
    products: ["medication", "prescriptions", "vitamins", "first aid", "skincare"],
    taxonomySearchTerms: [],
  },
  hospital: {
    keywords: ["hospital", "emergency room", "medical center", "clinic"],
    products: ["emergency care", "surgery", "outpatient care", "diagnostics"],
    taxonomySearchTerms: [],
  },
  clinic: {
    keywords: ["clinic", "medical practice", "doctor's office", "healthcare"],
    products: ["consultations", "checkups", "vaccinations", "lab tests"],
    taxonomySearchTerms: [],
  },
  doctors: {
    keywords: ["doctor", "physician", "general practitioner", "medical practice"],
    products: ["medical consultation", "checkup", "referral", "prescription"],
    taxonomySearchTerms: [],
  },
  dentist: {
    keywords: ["dentist", "dental care", "oral health", "tooth"],
    products: ["dental checkup", "cleaning", "filling", "root canal", "orthodontics"],
    taxonomySearchTerms: [],
  },
  bank: {
    keywords: ["bank", "financial services", "banking", "ATM"],
    products: ["savings account", "loans", "mortgage", "transfers", "ATM"],
    taxonomySearchTerms: [],
  },
  post_office: {
    keywords: ["post office", "mail", "postal service", "parcels", "stamps"],
    products: ["mail delivery", "parcels", "stamps", "money orders"],
    taxonomySearchTerms: [],
  },
  police: {
    keywords: ["police station", "law enforcement", "security"],
    products: ["crime reporting", "lost and found", "permits"],
    taxonomySearchTerms: [],
  },
  library: {
    keywords: ["library", "books", "reading room", "study", "lending"],
    products: ["book lending", "reading rooms", "internet access", "events"],
    taxonomySearchTerms: [],
  },
  place_of_worship: {
    keywords: ["church", "mosque", "synagogue", "temple", "worship", "prayer"],
    products: ["services", "mass", "prayer", "ceremonies"],
    taxonomySearchTerms: [],
  },
  theatre: {
    keywords: ["theater", "theatre", "performing arts", "stage", "drama"],
    products: ["plays", "musicals", "opera", "ballet", "comedy shows"],
    taxonomySearchTerms: [],
  },
  cinema: {
    keywords: ["cinema", "movie theater", "films", "screenings"],
    products: ["movies", "popcorn", "3D films", "premieres"],
    taxonomySearchTerms: [],
  },
  university: {
    keywords: ["university", "higher education", "campus", "academic"],
    products: ["degree programs", "lectures", "research", "campus tours"],
    taxonomySearchTerms: [],
  },
  school: {
    keywords: ["school", "education", "primary school", "secondary school"],
    products: ["classes", "education", "tutoring"],
    taxonomySearchTerms: [],
  },
  kindergarten: {
    keywords: ["kindergarten", "nursery", "preschool", "childcare", "daycare"],
    products: ["childcare", "early education", "play groups"],
    taxonomySearchTerms: [],
  },
  ice_cream: {
    keywords: ["ice cream parlor", "gelato", "frozen desserts", "sundae"],
    products: ["ice cream", "gelato", "sorbet", "milkshakes", "frozen yogurt"],
    taxonomySearchTerms: [],
  },
  food_court: {
    keywords: ["food court", "food hall", "multi-cuisine", "dining area"],
    products: ["fast food", "international cuisine", "snacks", "beverages"],
    taxonomySearchTerms: [],
  },
  community_centre: {
    keywords: ["community center", "cultural center", "civic center", "events"],
    products: ["events", "classes", "workshops", "meetings", "exhibitions"],
    taxonomySearchTerms: [],
  },
  fire_station: {
    keywords: ["fire station", "fire department", "emergency services"],
    products: ["fire rescue", "emergency response"],
    taxonomySearchTerms: [],
  },
  bus_station: {
    keywords: ["bus station", "bus terminal", "bus stop", "public transport"],
    products: ["bus routes", "tickets", "connections"],
    taxonomySearchTerms: [],
  },
  veterinary: {
    keywords: ["veterinary", "vet", "animal hospital", "pet clinic"],
    products: ["pet checkup", "vaccination", "surgery", "grooming"],
    taxonomySearchTerms: [],
  },
  taxi: {
    keywords: ["taxi stand", "cab rank", "taxi service"],
    products: ["taxi rides", "airport transfers"],
    taxonomySearchTerms: [],
  },
  fuel: {
    keywords: ["gas station", "petrol station", "fuel", "filling station"],
    products: ["gasoline", "diesel", "car wash", "convenience items"],
    taxonomySearchTerms: [],
  },
  toilets: {
    keywords: ["public toilet", "restroom", "WC", "lavatory"],
    products: ["restroom facilities"],
    taxonomySearchTerms: [],
  },
};

const LEISURE_MAPPINGS: Record<string, TagMapping> = {
  park: {
    keywords: ["park", "public garden", "green space", "recreation area"],
    products: ["walking paths", "benches", "playgrounds", "picnic areas"],
    taxonomySearchTerms: [],
  },
  garden: {
    keywords: ["garden", "botanical garden", "formal garden", "landscape"],
    products: ["plants", "fountains", "walking paths", "guided tours"],
    taxonomySearchTerms: [],
  },
  playground: {
    keywords: ["playground", "children's play area", "swing", "slide"],
    products: ["swings", "slides", "climbing frames", "sandboxes"],
    taxonomySearchTerms: [],
  },
  sports_centre: {
    keywords: ["sports center", "gym", "fitness center", "recreation"],
    products: ["fitness classes", "gym equipment", "personal training", "courts"],
    taxonomySearchTerms: [],
  },
  swimming_pool: {
    keywords: ["swimming pool", "aquatic center", "swim", "bathing"],
    products: ["swimming lanes", "water slides", "sauna", "children's pool"],
    taxonomySearchTerms: [],
  },
  fitness_centre: {
    keywords: ["fitness center", "gym", "workout", "exercise", "training"],
    products: ["weight training", "cardio machines", "group classes", "personal training"],
    taxonomySearchTerms: [],
  },
  pitch: {
    keywords: ["sports pitch", "playing field", "sports ground"],
    products: ["soccer", "baseball", "rugby", "cricket", "field hockey"],
    taxonomySearchTerms: [],
  },
  stadium: {
    keywords: ["stadium", "arena", "sports venue", "athletic ground"],
    products: ["live sports", "concerts", "events"],
    taxonomySearchTerms: [],
  },
  nature_reserve: {
    keywords: ["nature reserve", "wildlife sanctuary", "protected area", "conservation"],
    products: ["hiking trails", "bird watching", "nature walks", "wildlife viewing"],
    taxonomySearchTerms: [],
  },
  dog_park: {
    keywords: ["dog park", "pet exercise area", "off-leash area"],
    products: ["dog exercise", "socialization", "agility equipment"],
    taxonomySearchTerms: [],
  },
  golf_course: {
    keywords: ["golf course", "golf club", "driving range"],
    products: ["golf rounds", "driving range", "lessons", "club rental"],
    taxonomySearchTerms: [],
  },
  ice_rink: {
    keywords: ["ice rink", "ice skating", "skating rink"],
    products: ["ice skating", "skate rental", "hockey", "figure skating"],
    taxonomySearchTerms: [],
  },
  miniature_golf: {
    keywords: ["mini golf", "miniature golf", "putt putt"],
    products: ["mini golf rounds", "family fun"],
    taxonomySearchTerms: [],
  },
  sauna: {
    keywords: ["sauna", "steam room", "wellness", "spa"],
    products: ["sauna sessions", "steam bath", "cold plunge", "relaxation"],
    taxonomySearchTerms: [],
  },
  marina: {
    keywords: ["marina", "boat harbor", "yacht club", "sailing"],
    products: ["boat mooring", "fuel", "boat rental", "sailing lessons"],
    taxonomySearchTerms: [],
  },
};

const TOURISM_MAPPINGS: Record<string, TagMapping> = {
  museum: {
    keywords: ["museum", "exhibition", "gallery", "collection", "artifacts"],
    products: ["exhibitions", "guided tours", "audio guides", "gift shop"],
    taxonomySearchTerms: [],
  },
  gallery: {
    keywords: ["art gallery", "exhibition space", "contemporary art", "paintings"],
    products: ["art exhibitions", "paintings", "sculptures", "photography"],
    taxonomySearchTerms: [],
  },
  hotel: {
    keywords: ["hotel", "accommodation", "lodging", "stay"],
    products: ["rooms", "suites", "breakfast", "room service", "spa"],
    taxonomySearchTerms: [],
  },
  hostel: {
    keywords: ["hostel", "backpacker", "budget accommodation", "dormitory"],
    products: ["dorm beds", "private rooms", "kitchen access", "lockers"],
    taxonomySearchTerms: [],
  },
  guest_house: {
    keywords: ["guest house", "bed and breakfast", "pension", "B&B"],
    products: ["rooms", "breakfast", "hospitality"],
    taxonomySearchTerms: [],
  },
  viewpoint: {
    keywords: ["viewpoint", "scenic lookout", "panorama", "overlook"],
    products: ["panoramic views", "photography spots"],
    taxonomySearchTerms: [],
  },
  attraction: {
    keywords: ["tourist attraction", "landmark", "sightseeing", "point of interest"],
    products: ["tours", "tickets", "souvenirs", "photography"],
    taxonomySearchTerms: [],
  },
  artwork: {
    keywords: ["public art", "sculpture", "mural", "street art", "installation"],
    products: ["art viewing"],
    taxonomySearchTerms: [],
  },
  information: {
    keywords: ["tourist information", "visitor center", "info point"],
    products: ["maps", "brochures", "local tips", "tour booking"],
    taxonomySearchTerms: [],
  },
  camp_site: {
    keywords: ["campsite", "camping", "campground", "tent site"],
    products: ["tent pitches", "caravan spots", "showers", "fire pits"],
    taxonomySearchTerms: [],
  },
  theme_park: {
    keywords: ["theme park", "amusement park", "rides", "entertainment"],
    products: ["rides", "roller coasters", "shows", "food stands"],
    taxonomySearchTerms: [],
  },
  zoo: {
    keywords: ["zoo", "animal park", "wildlife park", "aquarium"],
    products: ["animal exhibits", "feeding shows", "educational tours"],
    taxonomySearchTerms: [],
  },
  picnic_site: {
    keywords: ["picnic site", "picnic area", "outdoor dining spot"],
    products: ["picnic tables", "grills", "shade"],
    taxonomySearchTerms: [],
  },
};

const HISTORIC_MAPPINGS: Record<string, TagMapping> = {
  memorial: {
    keywords: ["memorial", "remembrance", "monument", "tribute"],
    products: [],
    taxonomySearchTerms: [],
  },
  monument: {
    keywords: ["monument", "statue", "landmark", "heritage"],
    products: [],
    taxonomySearchTerms: [],
  },
  castle: {
    keywords: ["castle", "fortress", "citadel", "palace", "stronghold"],
    products: ["guided tours", "exhibitions", "events"],
    taxonomySearchTerms: [],
  },
  archaeological_site: {
    keywords: ["archaeological site", "excavation", "ancient ruins", "dig site"],
    products: ["guided tours", "exhibits"],
    taxonomySearchTerms: [],
  },
  ruins: {
    keywords: ["ruins", "ancient remains", "historical remnants"],
    products: [],
    taxonomySearchTerms: [],
  },
  wayside_cross: {
    keywords: ["wayside cross", "roadside cross", "crucifix", "religious marker"],
    products: [],
    taxonomySearchTerms: [],
  },
  city_gate: {
    keywords: ["city gate", "town gate", "medieval gate", "historic gateway"],
    products: [],
    taxonomySearchTerms: [],
  },
  building: {
    keywords: ["historic building", "heritage building", "landmark building"],
    products: ["tours", "exhibitions"],
    taxonomySearchTerms: [],
  },
  church: {
    keywords: ["historic church", "old church", "religious heritage"],
    products: ["tours", "organ concerts"],
    taxonomySearchTerms: [],
  },
  manor: {
    keywords: ["manor house", "country estate", "stately home"],
    products: ["guided tours", "gardens", "events"],
    taxonomySearchTerms: [],
  },
  tomb: {
    keywords: ["tomb", "mausoleum", "burial site", "crypt"],
    products: [],
    taxonomySearchTerms: [],
  },
  boundary_stone: {
    keywords: ["boundary stone", "border marker", "historical marker"],
    products: [],
    taxonomySearchTerms: [],
  },
  wayside_shrine: {
    keywords: ["wayside shrine", "roadside shrine", "devotional marker"],
    products: [],
    taxonomySearchTerms: [],
  },
  fort: {
    keywords: ["fort", "fortress", "military fortification", "bastion"],
    products: ["guided tours", "military exhibits"],
    taxonomySearchTerms: [],
  },
  tower: {
    keywords: ["historic tower", "watchtower", "bell tower", "observation tower"],
    products: ["viewing platform", "climb"],
    taxonomySearchTerms: [],
  },
  battlefield: {
    keywords: ["battlefield", "battle site", "military history"],
    products: ["guided tours", "memorial"],
    taxonomySearchTerms: [],
  },
  mine: {
    keywords: ["historic mine", "mining site", "underground tour"],
    products: ["underground tours", "mining exhibits"],
    taxonomySearchTerms: [],
  },
  pillory: {
    keywords: ["pillory", "stocks", "medieval punishment"],
    products: [],
    taxonomySearchTerms: [],
  },
  cannon: {
    keywords: ["historic cannon", "artillery", "military heritage"],
    products: [],
    taxonomySearchTerms: [],
  },
  locomotive: {
    keywords: ["historic locomotive", "steam train", "railway heritage"],
    products: ["rides", "exhibits"],
    taxonomySearchTerms: [],
  },
  aircraft: {
    keywords: ["historic aircraft", "aviation heritage", "plane exhibit"],
    products: ["viewing", "museum"],
    taxonomySearchTerms: [],
  },
  square: {
    keywords: ["historic square", "plaza", "town square", "piazza"],
    products: [],
    taxonomySearchTerms: [],
  },
  palace: {
    keywords: ["palace", "royal residence", "stately palace", "schloss"],
    products: ["guided tours", "gardens", "exhibitions", "events"],
    taxonomySearchTerms: [],
  },
};

// ---------------------------------------------------------------------------
// Main build logic
// ---------------------------------------------------------------------------

/**
 * Builds the tag enrichment map by combining OSM taginfo data,
 * manual mappings, and Google Product Taxonomy cross-references.
 */
function buildTagEnrichmentMap(): Record<string, TagEnrichmentEntry> {
  const taxonomy = loadGoogleTaxonomy();
  const result: Record<string, TagEnrichmentEntry> = {};

  function addEntries(
    osmKey: string,
    mappings: Record<string, TagMapping>,
    tagInfoFile: string,
    subtags?: Record<string, string>,
  ) {
    const tagInfoEntries = loadTagInfo(tagInfoFile);

    for (const [value, mapping] of Object.entries(mappings)) {
      const key = `${osmKey}=${value}`;
      const googleTax =
        mapping.taxonomySearchTerms.length > 0
          ? findTaxonomyMatches(taxonomy, mapping.taxonomySearchTerms)
          : [];

      const subtagValues: string[] = [];
      if (subtags && subtags[value]) {
        const subtagFile = subtags[value];
        subtagValues.push(...getSubtags(subtagFile));
      }

      result[key] = {
        keywords: mapping.keywords,
        products: mapping.products,
        subtags: subtagValues,
        googleTaxonomy: googleTax,
      };
    }

    for (const entry of tagInfoEntries) {
      const key = `${osmKey}=${entry.value}`;
      if (result[key]) continue;
      if (entry.count < 500) continue;
      if (entry.value === "yes" || entry.value === "no") continue;

      const displayName = entry.value.replace(/_/g, " ");
      result[key] = {
        keywords: [displayName],
        products: [],
        subtags: [],
        googleTaxonomy: [],
      };
    }
  }

  const shopSubtags: Record<string, string> = {
    clothes: "clothes.json",
    shoes: "shoes.json",
    beauty: "beauty.json",
    books: "books.json",
  };

  addEntries("shop", SHOP_MAPPINGS, "shop.json", shopSubtags);
  addEntries("amenity", AMENITY_MAPPINGS, "amenity.json");
  addEntries("leisure", LEISURE_MAPPINGS, "leisure.json");
  addEntries("tourism", TOURISM_MAPPINGS, "tourism.json");
  addEntries("historic", HISTORIC_MAPPINGS, "historic.json");

  return result;
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

console.log("Building tag enrichment map...");

const tagMap = buildTagEnrichmentMap();
const entryCount = Object.keys(tagMap).length;

writeFileSync(OUTPUT_FILE, JSON.stringify(tagMap, null, 2));
console.log(`Wrote ${entryCount} entries to ${OUTPUT_FILE}`);

const byKey: Record<string, number> = {};
for (const k of Object.keys(tagMap)) {
  const osmKey = k.split("=")[0];
  byKey[osmKey] = (byKey[osmKey] ?? 0) + 1;
}
for (const [k, v] of Object.entries(byKey)) {
  console.log(`  ${k}: ${v} entries`);
}
