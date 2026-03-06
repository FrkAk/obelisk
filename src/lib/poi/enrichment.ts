import { readFileSync } from "fs";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { generateText } from "@/lib/ai/ollama";
import { generateVisualDescription } from "@/lib/media/visual";
import { createLogger } from "@/lib/logger";
import type { PoiProfile } from "@/types/api";

const log = createLogger("enrichment");

export const POI_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Creates a default empty POI profile.
 *
 * @returns Empty PoiProfile with seed defaults.
 */
export function createEmptyProfile(): PoiProfile {
  return {
    keywords: [],
    products: [],
    summary: "",
    enrichmentSource: "seed",
    attributes: {},
  };
}

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";

export interface TagEntry {
  keywords: string[];
  products: string[];
  subtags: string[];
  googleTaxonomy: string[];
}

export interface BrandEntry {
  name: string;
  industry: string;
  products: string[];
  nsiPath: string;
  priceTier: string;
}

export type DataTier = "rich" | "moderate" | "thin";

export interface EnrichResult {
  status: "enriched" | "failed" | "skipped";
  poiId: string;
  profile?: PoiProfile;
}

export interface EnrichPoiRow {
  id: string;
  name: string;
  address: string | null;
  categoryId: string | null;
  osmTags: Record<string, string> | null;
  profile: PoiProfile | null;
}

const NUM_PREDICT: Record<DataTier, number> = {
  rich: 256,
  moderate: 128,
  thin: 64,
};

const TAG_KEY_PRIORITY = ["shop", "amenity", "tourism", "historic", "leisure", "natural"];

const SKIP_TAG_PREFIXES = [
  "addr:", "name:", "contact:", "payment:", "service:", "check_date",
  "brand:", "operator:", "ref:", "source", "note", "fixme",
  "wikimedia_commons", "mapillary", "image", "survey:", "lastcheck",
  "opening_hours:covid19", "access:covid19",
];

const SKIP_TAG_EXACT = new Set([
  "name", "wikidata", "wikipedia", "website", "phone", "fax", "email",
  "mobile", "url", "opening_hours", "wheelchair", "toilets:wheelchair",
  "level", "layer", "indoor", "building", "roof:shape", "roof:levels",
  "roof:colour", "building:colour", "building:levels", "building:material",
  "height", "male", "female", "board_type", "map_size", "map_type",
  "opening_hours:signed", "lit", "surface",
]);

const CATEGORY_GUIDANCE: Record<string, string> = {
  food: "A good summary for a food place includes: cuisine type, notable menu items or signature dishes, dining style (sit-down, biergarten, takeaway), dietary options — when this information is available.",
  nightlife: "A good summary for a nightlife venue includes: venue type (bar, club, biergarten), drinks or breweries served, atmosphere, music — when this information is available.",
  history: "A good summary for a historic place includes: when it was built or established, key events that happened here, people involved, why it still matters — when this information is available.",
  architecture: "A good summary for an architectural landmark includes: architect, style, year built, notable design features or materials — when this information is available.",
  art: "A good summary for an art space includes: type (gallery, museum, street art), collections or exhibitions, featured artists, medium — when this information is available.",
  culture: "A good summary for a cultural venue includes: what experiences it offers (theater, music, cinema), programming character, venue atmosphere — when this information is available.",
  nature: "A good summary for a natural place includes: type of feature, what you encounter there, seasonal character, notable flora or fauna — when this information is available.",
  shopping: "A good summary for a shop includes: what they sell, any specialties or unique offerings (secondhand, organic, local, handmade), notable brands carried — when this information is available.",
  health: "A good summary for a health provider includes: medical specialties, types of services, practitioner background — when this information is available.",
  sports: "A good summary for a sports venue includes: sports offered, facilities, club history or character — when this information is available.",
  education: "A good summary for an educational institution includes: type of institution, programs or age groups served, notable features or pedagogy — when this information is available.",
  views: "A good summary for a viewpoint includes: what you can see, best conditions, how to reach it — when this information is available.",
  hidden: "A good summary for a hidden gem includes: what makes it worth finding, what is unique about it — when this information is available.",
  transport: "A good summary for a transport hub includes: any architectural or historical significance, connections served — when this information is available.",
  services: "A good summary for a service provider includes: what services are offered, any notable history or specialization — when this information is available.",
};

/**
 * Determines the primary OSM tag key=value for enrichment lookup.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Primary tag string like "shop=clothes" or "amenity=restaurant", or null.
 */
export function determinePrimaryTag(osmTags: Record<string, string>): string | null {
  for (const key of TAG_KEY_PRIORITY) {
    if (osmTags[key]) {
      const value = osmTags[key].split(";")[0].trim();
      return `${key}=${value}`;
    }
  }
  if (osmTags.railway) return `railway=${osmTags.railway}`;
  if (osmTags.healthcare) return `healthcare=${osmTags.healthcare}`;
  return null;
}

/**
 * Extracts all useful OSM tags as human-readable facts for the LLM prompt.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Array of "key: value" fact strings.
 */
export function extractOsmFacts(osmTags: Record<string, string>): string[] {
  const facts: string[] = [];

  for (const [key, value] of Object.entries(osmTags)) {
    if (SKIP_TAG_EXACT.has(key)) continue;
    if (SKIP_TAG_PREFIXES.some((p) => key.startsWith(p))) continue;
    if (value === "yes" || value === "no") {
      facts.push(`${formatTagKey(key)}: ${value}`);
    } else {
      facts.push(`${formatTagKey(key)}: ${value.replace(/;/g, ", ")}`);
    }
  }

  return facts;
}

/**
 * Converts an OSM tag key to a human-readable label.
 *
 * @param key - OSM tag key like "outdoor_seating" or "diet:vegetarian".
 * @returns Human-readable label like "Outdoor seating" or "Diet vegetarian".
 */
function formatTagKey(key: string): string {
  return key
    .replace(/[:_]/g, " ")
    .replace(/\b\w/, (c) => c.toUpperCase());
}

/**
 * Assesses how much data is available to control output length.
 *
 * @param factsCount - Number of extracted OSM facts.
 * @param hasKeywords - Whether taxonomy keywords exist.
 * @param hasWikipedia - Whether a Wikipedia summary is available.
 * @param hasWebsite - Whether website text has been crawled.
 * @param hasVisualDescription - Whether a visual description exists.
 * @returns Data tier controlling prompt length instruction.
 */
export function assessDataTier(
  factsCount: number,
  hasKeywords: boolean,
  hasWikipedia: boolean,
  hasWebsite: boolean,
  hasVisualDescription: boolean = false,
): DataTier {
  if (hasWikipedia || hasWebsite || hasVisualDescription || factsCount >= 5) return "rich";
  if (factsCount >= 2 || hasKeywords) return "moderate";
  return "thin";
}

/**
 * Builds the LLM prompt for generating a factual place description.
 *
 * @param name - POI name.
 * @param categorySlug - Category slug.
 * @param profile - Current profile data (with merged keywords/products).
 * @param address - POI address or null.
 * @param brandInfo - Brand name and price tier if available.
 * @param osmFacts - Human-readable OSM facts extracted from tags.
 * @param dataTier - Data confidence tier controlling grounding strictness.
 * @returns Prompt string for the LLM.
 */
export function buildSummaryPrompt(
  name: string,
  categorySlug: string,
  profile: PoiProfile,
  address: string | null,
  brandInfo: { name: string; priceTier: string } | null,
  osmFacts: string[],
  dataTier: DataTier,
): string {
  const lines: string[] = [
    `Write a factual description of "${name}" for a city discovery app.`,
    "",
  ];

  if (profile.wikipediaSummary) {
    lines.push(`REFERENCE: ${profile.wikipediaSummary}`);
    lines.push("");
  }

  if (profile.websiteText) {
    lines.push("WEBSITE CONTENT:");
    lines.push(profile.websiteText);
    lines.push("");
  }

  if (profile.visualDescription) {
    lines.push("VISUAL DESCRIPTION (from street-level photos):");
    lines.push(profile.visualDescription);
    lines.push("");
  }

  if (osmFacts.length > 0) {
    lines.push("VERIFIED FACTS:");
    for (const fact of osmFacts) {
      lines.push(`- ${fact}`);
    }
    lines.push("");
  }

  lines.push(`Category: ${categorySlug}`);
  if (profile.subtype) lines.push(`Type: ${profile.subtype}`);
  if (profile.keywords.length > 0) lines.push(`Keywords: ${profile.keywords.join(", ")}`);
  if (profile.products.length > 0) lines.push(`Products/Services: ${profile.products.join(", ")}`);
  if (address) lines.push(`Address: ${address}`);
  if (brandInfo) lines.push(`Brand: ${brandInfo.name} (${brandInfo.priceTier})`);

  const attrs = profile.attributes;
  if (Object.keys(attrs).length > 0) {
    const attrStr = Object.entries(attrs)
      .filter(([k]) => k !== "brand" && k !== "priceTier")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (attrStr) lines.push(`Attributes: ${attrStr}`);
  }

  const guidance = CATEGORY_GUIDANCE[categorySlug];
  if (guidance) {
    lines.push("");
    lines.push(guidance);
  }

  lines.push("");
  if (dataTier === "rich") {
    lines.push("You have detailed data. Be concise and specific — include concrete details like names, dates, dishes, styles, materials from the sources above. Stop when you run out of facts.");
  } else if (dataTier === "moderate") {
    lines.push("You have some data. Be concise and specific — describe what the data supports. Skip topics the data doesn't cover — do not fill gaps.");
  } else {
    lines.push("You have minimal data. Be concise and specific — state only what is directly supported. If the data doesn't cover something, omit it entirely if you cannot summarize the data as it is.");
  }
  lines.push("No questions, no marketing language, no superlatives.");

  return lines.join("\n");
}

/**
 * Enriches a POI using only taxonomy and brand maps. No LLM, no network.
 *
 * @param poi - POI row from the database.
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @returns Merged profile with taxonomy data, or null if no primary tag found.
 */
export function enrichPoiTaxonomyOnly(
  poi: EnrichPoiRow,
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
): PoiProfile {
  const osmTags = poi.osmTags ?? {};
  const existingProfile: PoiProfile = poi.profile ?? createEmptyProfile();

  const primaryTag = determinePrimaryTag(osmTags);

  const mergedKeywords = [...existingProfile.keywords];
  const mergedProducts = [...existingProfile.products];
  let enrichmentSource = existingProfile.enrichmentSource || "seed";

  if (primaryTag && tagMap[primaryTag]) {
    const tagEntry = tagMap[primaryTag];
    for (const kw of tagEntry.keywords) {
      if (!mergedKeywords.includes(kw)) mergedKeywords.push(kw);
    }
    for (const prod of tagEntry.products) {
      if (!mergedProducts.includes(prod)) mergedProducts.push(prod);
    }
    enrichmentSource = "taxonomy";
  }

  let brandInfo: { name: string; priceTier: string } | null = null;
  const brandWikidata = osmTags["brand:wikidata"] ?? existingProfile.osmExtracted?.brandwikidata;
  if (brandWikidata && brandMap[brandWikidata]) {
    const brandEntry = brandMap[brandWikidata];
    brandInfo = { name: brandEntry.name, priceTier: brandEntry.priceTier };
    for (const prod of brandEntry.products) {
      if (!mergedProducts.includes(prod)) mergedProducts.push(prod);
    }
    enrichmentSource = "taxonomy+brand";
  }

  const osmFacts = extractOsmFacts(osmTags);
  const dataTier = assessDataTier(osmFacts.length, mergedKeywords.length > 0, false, false, false);

  return {
    ...existingProfile,
    keywords: mergedKeywords,
    products: mergedProducts,
    enrichmentSource,
    dataTier,
    attributes: {
      ...existingProfile.attributes,
      ...(brandInfo ? { brand: brandInfo.name, priceTier: brandInfo.priceTier } : {}),
    },
  };
}

let cachedTagMap: Record<string, TagEntry> | null = null;
let cachedBrandMap: Record<string, BrandEntry> | null = null;

/**
 * Loads tag and brand taxonomy maps from JSON files with process-level caching.
 *
 * @returns Tag and brand enrichment maps.
 */
export function loadTaxonomyMaps(): {
  tagMap: Record<string, TagEntry>;
  brandMap: Record<string, BrandEntry>;
} {
  if (cachedTagMap && cachedBrandMap) {
    return { tagMap: cachedTagMap, brandMap: cachedBrandMap };
  }

  const tagRaw = readFileSync(`${process.cwd()}/data/tag_enrichment_map.json`, "utf-8");
  const brandRaw = readFileSync(`${process.cwd()}/data/brand_enrichment_map.json`, "utf-8");

  cachedTagMap = JSON.parse(tagRaw) as Record<string, TagEntry>;
  cachedBrandMap = JSON.parse(brandRaw) as Record<string, BrandEntry>;

  return { tagMap: cachedTagMap!, brandMap: cachedBrandMap! };
}

/**
 * Loads the category ID to slug mapping from the database.
 *
 * @returns Map from category ID to category slug.
 */
export async function loadCategoryMap(): Promise<Map<string, string>> {
  const allCategories = await db.select().from(categories);
  return new Map(allCategories.map((c: { id: string; slug: string }) => [c.id, c.slug] as const));
}

/**
 * Enriches a single POI: merges taxonomy data, generates visual description and LLM summary.
 *
 * @param poi - POI row from the database.
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 * @param options - Optional overrides for force mode and model.
 * @returns Enrichment result with status and updated profile.
 */
export async function enrichPoi(
  poi: EnrichPoiRow,
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
  options?: { force?: boolean; model?: string },
): Promise<EnrichResult> {
  const force = options?.force ?? false;
  const model = options?.model ?? OLLAMA_MODEL;
  const osmTags = poi.osmTags ?? {};
  const existingProfile: PoiProfile = poi.profile ?? createEmptyProfile();

  const categorySlug = poi.categoryId ? (categoryMap.get(poi.categoryId) ?? "hidden") : "hidden";
  const primaryTag = determinePrimaryTag(osmTags);

  const mergedKeywords = [...existingProfile.keywords];
  const mergedProducts = [...existingProfile.products];
  let enrichmentSource = existingProfile.enrichmentSource || "seed";

  if (!primaryTag) {
    log.warn(`${poi.name}: No primary tag determined from OSM tags: ${JSON.stringify(osmTags)}`);
  } else if (!tagMap[primaryTag]) {
    log.warn(`${poi.name}: No taxonomy match for tag "${primaryTag}"`);
  }

  if (primaryTag && tagMap[primaryTag]) {
    const tagEntry = tagMap[primaryTag];
    for (const kw of tagEntry.keywords) {
      if (!mergedKeywords.includes(kw)) mergedKeywords.push(kw);
    }
    for (const prod of tagEntry.products) {
      if (!mergedProducts.includes(prod)) mergedProducts.push(prod);
    }
    enrichmentSource = "taxonomy";
  }

  let brandInfo: { name: string; priceTier: string } | null = null;
  const brandWikidata = osmTags["brand:wikidata"] ?? existingProfile.osmExtracted?.brandwikidata;
  if (brandWikidata && brandMap[brandWikidata]) {
    const brandEntry = brandMap[brandWikidata];
    brandInfo = { name: brandEntry.name, priceTier: brandEntry.priceTier };
    for (const prod of brandEntry.products) {
      if (!mergedProducts.includes(prod)) mergedProducts.push(prod);
    }
    enrichmentSource = "taxonomy+brand";
  }

  const osmFacts = extractOsmFacts(osmTags);
  const dataTier = assessDataTier(osmFacts.length, mergedKeywords.length > 0, !!existingProfile.wikipediaSummary, !!existingProfile.websiteText, !!existingProfile.visualDescription);

  const updatedProfile: PoiProfile = {
    ...existingProfile,
    keywords: mergedKeywords,
    products: mergedProducts,
    enrichmentSource,
    dataTier,
    attributes: {
      ...existingProfile.attributes,
      ...(brandInfo ? { brand: brandInfo.name, priceTier: brandInfo.priceTier } : {}),
    },
  };

  if (force || !updatedProfile.visualDescription) {
    const visualDesc = await generateVisualDescription(poi.name, updatedProfile.mapillaryThumbUrl, updatedProfile.wikiImageUrl, model);
    if (visualDesc) {
      updatedProfile.visualDescription = visualDesc.trim();
    }
  }

  try {
    const prompt = buildSummaryPrompt(poi.name, categorySlug, updatedProfile, poi.address, brandInfo, osmFacts, dataTier);
    const summary = await generateText(prompt, model, {
      temperature: 0.3,
      num_predict: NUM_PREDICT[dataTier],
    });

    updatedProfile.summary = summary.trim();
    updatedProfile.enrichmentSource = enrichmentSource === "seed" ? "taxonomy+llm" : `${enrichmentSource}+llm`;
    updatedProfile.enrichedAt = new Date().toISOString();

    return { status: "enriched", poiId: poi.id, profile: updatedProfile };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error(`${poi.name}: LLM failed — primaryTag=${primaryTag}, keywords=${mergedKeywords.length}, products=${mergedProducts.length} — ${msg}`);
    return { status: "failed", poiId: poi.id };
  }
}
