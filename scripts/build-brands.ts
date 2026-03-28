/**
 * Builds brand_enrichment_map.json from NSI and Wikidata SPARQL data.
 *
 * Reads local data files (no network calls). Re-runnable.
 *
 * Outputs data/brand_enrichment_map.json keyed by Wikidata QID with brand name,
 * industry, products, NSI path, and estimated price tier.
 *
 * @module build-brands
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createLogger } from "../src/lib/logger";

const log = createLogger("build-brands");

const DATA_DIR = join(import.meta.dirname, "..", "data");
const NSI_FILE = join(DATA_DIR, "nsi", "nsi.json");
const WIKIDATA_FILE = join(DATA_DIR, "wikidata_brands.json");
const OUTPUT_FILE = join(DATA_DIR, "brand_enrichment_map.json");

interface NsiItem {
  displayName: string;
  id: string;
  locationSet?: { include?: string[] };
  tags?: Record<string, string>;
}

interface NsiCategory {
  properties: { path: string };
  items: NsiItem[];
}

interface WikidataBinding {
  item: { value: string };
  itemLabel: { value: string };
  industryLabel?: { value: string };
  productLabel?: { value: string };
}

interface BrandEntry {
  name: string;
  industry: string;
  products: string[];
  nsiPath: string;
  priceTier: string;
}

/**
 * Loads NSI data and builds a map from Wikidata QID to brand info.
 *
 * @returns Map of QID to brand info (name, nsiPath, tags).
 */
function loadNsi(): Map<string, { name: string; nsiPath: string; tags: Record<string, string> }> {
  const raw = JSON.parse(readFileSync(NSI_FILE, "utf-8"));
  const nsi: Record<string, NsiCategory> = raw.nsi ?? {};
  const result = new Map<string, { name: string; nsiPath: string; tags: Record<string, string> }>();

  for (const [path, category] of Object.entries(nsi)) {
    if (!path.startsWith("brands/")) continue;

    for (const item of category.items) {
      const wikidata = item.tags?.["brand:wikidata"];
      if (!wikidata) continue;

      const qid = wikidata;
      if (result.has(qid)) continue;

      result.set(qid, {
        name: item.displayName,
        nsiPath: path,
        tags: item.tags ?? {},
      });
    }
  }

  return result;
}

/**
 * Loads Wikidata SPARQL results and groups products/industries by QID.
 *
 * @returns Map of QID to brand data (name, industries, products).
 */
function loadWikidata(): Map<string, { name: string; industries: Set<string>; products: Set<string> }> {
  const raw = JSON.parse(readFileSync(WIKIDATA_FILE, "utf-8"));
  const bindings: WikidataBinding[] = raw.results?.bindings ?? [];
  const result = new Map<string, { name: string; industries: Set<string>; products: Set<string> }>();

  for (const b of bindings) {
    const uri = b.item.value;
    const qid = uri.split("/").pop() ?? "";
    if (!qid.startsWith("Q")) continue;

    let entry = result.get(qid);
    if (!entry) {
      entry = { name: b.itemLabel.value, industries: new Set(), products: new Set() };
      result.set(qid, entry);
    }

    if (b.industryLabel?.value) {
      entry.industries.add(b.industryLabel.value);
    }
    if (b.productLabel?.value) {
      entry.products.add(b.productLabel.value);
    }
  }

  return result;
}

const LUXURY_BRANDS = new Set([
  "Gucci", "Louis Vuitton", "Prada", "Hermès", "Chanel", "Burberry", "Dior",
  "Versace", "Armani", "Balenciaga", "Cartier", "Rolex", "Omega", "Tiffany & Co.",
  "Bulgari", "Montblanc", "Fendi", "Givenchy", "Saint Laurent", "Valentino",
  "Bottega Veneta", "Moncler", "Breitling", "Tag Heuer", "IWC",
]);

const PREMIUM_BRANDS = new Set([
  "Jack Wolfskin", "The North Face", "Patagonia", "Arc'teryx", "Columbia",
  "Hugo Boss", "Tommy Hilfiger", "Ralph Lauren", "Calvin Klein", "Lacoste",
  "Nike", "Adidas", "New Balance", "Levi's", "Apple", "Samsung", "Sony",
  "Bose", "Bang & Olufsen", "Dyson", "Nespresso", "Zwilling",
  "Swarovski", "Pandora", "Michael Kors", "Coach",
]);

const BUDGET_BRANDS = new Set([
  "Primark", "Kik", "Action", "Tedi", "Woolworth", "Dollar Tree",
  "Walmart", "Aldi", "Lidl", "Netto", "Penny", "Poundland",
  "Five Below", "Miniso", "Daiso", "Fix Price",
]);

const DISCOUNT_KEYWORDS = ["discount", "budget", "dollar", "cent", "cheap", "thrift"];
const LUXURY_PATHS = ["brands/shop/jewelry", "brands/shop/watches", "brands/shop/perfumery"];

/**
 * Estimates a price tier for a brand based on name, path, and industry.
 *
 * @param name - Brand display name.
 * @param nsiPath - NSI category path.
 * @param industry - Industry label from Wikidata.
 * @returns Price tier string: "$", "$$", "$$$", or "$$$$".
 */
function estimatePriceTier(name: string, nsiPath: string, industry: string): string {
  if (LUXURY_BRANDS.has(name)) return "$$$$";
  if (PREMIUM_BRANDS.has(name)) return "$$$";
  if (BUDGET_BRANDS.has(name)) return "$";

  if (LUXURY_PATHS.some((p) => nsiPath.startsWith(p))) return "$$$";

  const lowerIndustry = industry.toLowerCase();
  if (lowerIndustry.includes("luxury") || lowerIndustry.includes("haute couture")) return "$$$$";
  if (DISCOUNT_KEYWORDS.some((kw) => lowerIndustry.includes(kw) || name.toLowerCase().includes(kw))) return "$";

  return "$$";
}

const PATH_PRODUCTS: Record<string, string[]> = {
  "brands/shop/clothes": ["clothing", "apparel"],
  "brands/shop/shoes": ["shoes", "footwear"],
  "brands/shop/supermarket": ["groceries", "food"],
  "brands/shop/convenience": ["snacks", "drinks", "everyday items"],
  "brands/shop/electronics": ["electronics", "gadgets"],
  "brands/shop/mobile_phone": ["smartphones", "phone accessories"],
  "brands/shop/sports": ["sportswear", "athletic gear"],
  "brands/shop/beauty": ["cosmetics", "beauty products"],
  "brands/shop/cosmetics": ["cosmetics", "makeup", "skincare"],
  "brands/shop/optician": ["eyeglasses", "contact lenses"],
  "brands/shop/jewelry": ["jewelry", "watches"],
  "brands/shop/furniture": ["furniture", "home decor"],
  "brands/shop/hardware": ["tools", "hardware", "building supplies"],
  "brands/shop/doityourself": ["tools", "DIY supplies", "building materials"],
  "brands/shop/books": ["books", "stationery"],
  "brands/shop/pet": ["pet food", "pet supplies"],
  "brands/shop/bicycle": ["bicycles", "cycling gear"],
  "brands/shop/car": ["automobiles", "car parts"],
  "brands/shop/car_repair": ["auto repair", "car parts"],
  "brands/shop/outdoor": ["outdoor gear", "camping equipment"],
  "brands/shop/toys": ["toys", "games"],
  "brands/shop/bakery": ["bread", "pastries"],
  "brands/shop/confectionery": ["chocolates", "sweets"],
  "brands/shop/alcohol": ["wine", "beer", "spirits"],
  "brands/shop/coffee": ["coffee", "coffee equipment"],
  "brands/shop/tea": ["tea", "tea accessories"],
  "brands/shop/department_store": ["general merchandise"],
  "brands/shop/variety_store": ["household items", "small goods"],
  "brands/shop/chemist": ["health products", "personal care"],
  "brands/shop/bag": ["bags", "luggage"],
  "brands/shop/perfumery": ["perfume", "fragrance"],
  "brands/shop/watches": ["watches", "timepieces"],
  "brands/shop/tyres": ["tires", "wheels"],
  "brands/shop/baby_goods": ["baby products", "infant supplies"],
  "brands/shop/stationery": ["stationery", "office supplies"],
  "brands/amenity/restaurant": ["dining", "meals"],
  "brands/amenity/cafe": ["coffee", "pastries", "light meals"],
  "brands/amenity/fast_food": ["fast food", "takeaway"],
  "brands/amenity/bar": ["drinks", "cocktails"],
  "brands/amenity/pub": ["beer", "pub food"],
  "brands/amenity/pharmacy": ["medication", "health products"],
  "brands/amenity/bank": ["banking", "financial services"],
  "brands/amenity/fuel": ["gasoline", "diesel"],
  "brands/tourism/hotel": ["accommodation", "rooms"],
  "brands/amenity/ice_cream": ["ice cream", "frozen desserts"],
};

/**
 * Infers product terms from the NSI path.
 *
 * @param nsiPath - The NSI category path (e.g. "brands/shop/clothes").
 * @returns Array of inferred product strings.
 */
function inferProducts(nsiPath: string): string[] {
  return PATH_PRODUCTS[nsiPath] ?? [];
}

/**
 * Builds the brand enrichment map by merging NSI and Wikidata data.
 */
function buildBrandMap(): Record<string, BrandEntry> {
  const nsiMap = loadNsi();
  const wikidataMap = loadWikidata();
  const result: Record<string, BrandEntry> = {};

  for (const [qid, nsiData] of nsiMap) {
    const wikidataEntry = wikidataMap.get(qid);

    const products = new Set<string>();

    if (wikidataEntry) {
      for (const p of wikidataEntry.products) products.add(p);
    }

    for (const p of inferProducts(nsiData.nsiPath)) {
      products.add(p);
    }

    const industry = wikidataEntry
      ? [...wikidataEntry.industries].join(", ")
      : nsiPathToIndustry(nsiData.nsiPath);

    result[qid] = {
      name: nsiData.name,
      industry,
      products: [...products],
      nsiPath: nsiData.nsiPath,
      priceTier: estimatePriceTier(nsiData.name, nsiData.nsiPath, industry),
    };
  }

  for (const [qid, wdEntry] of wikidataMap) {
    if (result[qid]) continue;

    const industry = [...wdEntry.industries].join(", ");

    result[qid] = {
      name: wdEntry.name,
      industry,
      products: [...wdEntry.products],
      nsiPath: "",
      priceTier: estimatePriceTier(wdEntry.name, "", industry),
    };
  }

  return result;
}

/**
 * Converts an NSI path to a human-readable industry string.
 *
 * @param nsiPath - NSI category path (e.g. "brands/shop/clothes").
 * @returns Industry description string.
 */
function nsiPathToIndustry(nsiPath: string): string {
  const parts = nsiPath.split("/");
  const category = parts[1] ?? "";
  const subcategory = parts[2] ?? "";

  const displaySub = subcategory.replace(/_/g, " ");

  switch (category) {
    case "shop":
      return `${displaySub} retail`;
    case "amenity":
      return displaySub;
    case "tourism":
      return `${displaySub} tourism`;
    default:
      return displaySub;
  }
}

log.info("Building brand enrichment map...");

const brandMap = buildBrandMap();
const entryCount = Object.keys(brandMap).length;

writeFileSync(OUTPUT_FILE, JSON.stringify(brandMap, null, 2));
log.success(`Wrote ${entryCount} entries to ${OUTPUT_FILE}`);

const withProducts = Object.values(brandMap).filter((b) => b.products.length > 0).length;
const withIndustry = Object.values(brandMap).filter((b) => b.industry.length > 0).length;
const withNsi = Object.values(brandMap).filter((b) => b.nsiPath.length > 0).length;

log.info(`With products: ${withProducts}`);
log.info(`With industry: ${withIndustry}`);
log.info(`From NSI: ${withNsi}`);
log.info(`From Wikidata only: ${entryCount - withNsi}`);
