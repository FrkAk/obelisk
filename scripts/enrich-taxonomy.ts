import { readFileSync } from "fs";
import { db } from "../src/lib/db/client";
import { pois, categories } from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateText, checkOllamaHealth } from "../src/lib/ai/ollama";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger } from "../src/lib/logger";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("enrich-taxonomy");

const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "50", 10);
const CONCURRENCY = parseInt(process.env.ENRICH_CONCURRENCY || "3", 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b-it-qat";

// ---------------------------------------------------------------------------
// Taxonomy data types
// ---------------------------------------------------------------------------

interface TagEntry {
  keywords: string[];
  products: string[];
  subtags: string[];
  googleTaxonomy: string[];
}

interface BrandEntry {
  name: string;
  industry: string;
  products: string[];
  nsiPath: string;
  priceTier: string;
}

// ---------------------------------------------------------------------------
// Load taxonomy JSON files
// ---------------------------------------------------------------------------

/**
 * Loads and parses a JSON file from the data directory.
 *
 * Args:
 *     path: Relative path to the JSON file.
 *
 * Returns:
 *     Parsed JSON object.
 */
function loadJson<T>(path: string): T {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// Primary OSM tag determination
// ---------------------------------------------------------------------------

const TAG_KEY_PRIORITY = ["shop", "amenity", "tourism", "historic", "leisure", "natural", "building"];

/**
 * Determines the primary OSM tag key=value for enrichment lookup.
 * Mirrors the logic in determineCategorySlug from seed-pois.ts.
 *
 * Args:
 *     osmTags: Raw OSM tags from the POI.
 *
 * Returns:
 *     Primary tag string like "shop=clothes" or "amenity=restaurant", or null.
 */
function determinePrimaryTag(osmTags: Record<string, string>): string | null {
  for (const key of TAG_KEY_PRIORITY) {
    if (osmTags[key]) {
      return `${key}=${osmTags[key]}`;
    }
  }
  if (osmTags.railway) return `railway=${osmTags.railway}`;
  if (osmTags.healthcare) return `healthcare=${osmTags.healthcare}`;
  return null;
}

// ---------------------------------------------------------------------------
// LLM summary generation
// ---------------------------------------------------------------------------

/**
 * Builds the LLM prompt for generating a place description.
 *
 * Args:
 *     name: POI name.
 *     categorySlug: Category slug.
 *     profile: Current profile data (with merged keywords/products).
 *     address: POI address or null.
 *     brandInfo: Brand name and price tier if available.
 *
 * Returns:
 *     Prompt string for the LLM.
 */
function buildSummaryPrompt(
  name: string,
  categorySlug: string,
  profile: PoiProfile,
  address: string | null,
  brandInfo: { name: string; priceTier: string } | null,
): string {
  const lines = [
    "You are writing a brief description for a place listing on a city discovery app.",
    "",
    `Place: ${name}`,
    `Category: ${categorySlug}`,
  ];

  if (profile.subtype) lines.push(`Type: ${profile.subtype}`);
  if (profile.keywords.length > 0) lines.push(`Keywords: ${profile.keywords.join(", ")}`);
  if (profile.products.length > 0) lines.push(`Products/Services: ${profile.products.join(", ")}`);
  if (address) lines.push(`Address: ${address}`);
  if (brandInfo) lines.push(`Brand: ${brandInfo.name} (price tier: ${brandInfo.priceTier})`);

  const osmExtracted = profile.osmExtracted;
  if (osmExtracted) {
    const attrParts: string[] = [];
    if (osmExtracted.description) attrParts.push(`Description: ${osmExtracted.description}`);
    if (osmExtracted.cuisine) attrParts.push(`Cuisine: ${osmExtracted.cuisine}`);
    if (osmExtracted.clothes) attrParts.push(`Clothing type: ${osmExtracted.clothes}`);
    if (attrParts.length > 0) lines.push(attrParts.join(". "));
  }

  const attrs = profile.attributes;
  if (Object.keys(attrs).length > 0) {
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    lines.push(`Attributes: ${attrStr}`);
  }

  lines.push("");
  lines.push("Write a 2-3 sentence description of this place. Be specific about what it offers.");
  lines.push("Only state facts that can be inferred from the data above. Do not hallucinate.");
  lines.push("Keep it conversational and useful for someone exploring the city.");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main enrichment logic
// ---------------------------------------------------------------------------

async function main() {
  log.info("Starting taxonomy enrichment pipeline...");
  log.info(`Config: batchSize=${BATCH_SIZE}, concurrency=${CONCURRENCY}, model=${OLLAMA_MODEL}`);

  const ok = await checkOllamaHealth(OLLAMA_MODEL);
  if (!ok) {
    log.error(`Model ${OLLAMA_MODEL} not loaded. Run: ollama pull ${OLLAMA_MODEL}`);
    process.exit(1);
  }

  log.info("Loading taxonomy data...");
  const tagMap = loadJson<Record<string, TagEntry>>("data/tag_enrichment_map.json");
  const brandMap = loadJson<Record<string, BrandEntry>>("data/brand_enrichment_map.json");
  log.info(`Loaded ${Object.keys(tagMap).length} tag entries, ${Object.keys(brandMap).length} brand entries`);

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c: { id: string; slug: string }) => [c.id, c.slug] as const));

  interface PoiRow {
    id: string;
    name: string;
    address: string | null;
    categoryId: string | null;
    osmTags: Record<string, string> | null;
    profile: PoiProfile | null;
  }

  const allPois: PoiRow[] = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .orderBy(pois.name);

  const toEnrich = allPois.filter((p: PoiRow) => !p.profile?.summary);

  log.info(`Found ${allPois.length} total POIs, ${toEnrich.length} need enrichment`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEnrich.length / BATCH_SIZE);

    log.info(`Batch ${batchNum}/${totalBatches} (${batch.length} POIs)`);

    const results = await processWithConcurrency(batch, CONCURRENCY, async (poi: PoiRow) => {
      const osmTags = poi.osmTags ?? {};
      const existingProfile: PoiProfile = poi.profile ?? {
        keywords: [],
        products: [],
        summary: "",
        enrichmentSource: "seed",
        attributes: {},
      };

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

      const updatedProfile: PoiProfile = {
        ...existingProfile,
        keywords: mergedKeywords,
        products: mergedProducts,
        enrichmentSource,
        attributes: {
          ...existingProfile.attributes,
          ...(brandInfo ? { brand: brandInfo.name, priceTier: brandInfo.priceTier } : {}),
        },
      };

      try {
        const prompt = buildSummaryPrompt(poi.name, categorySlug, updatedProfile, poi.address, brandInfo);
        const summary = await generateText(prompt, OLLAMA_MODEL, {
          temperature: 0.5,
          num_predict: 256,
        });

        updatedProfile.summary = summary.trim();
        updatedProfile.enrichmentSource = enrichmentSource === "seed" ? "taxonomy+llm" : `${enrichmentSource}+llm`;

        await db
          .update(pois)
          .set({
            profile: updatedProfile,
            embedding: null,
            updatedAt: sql`now()`,
          })
          .where(eq(pois.id, poi.id));

        return "enriched" as const;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        log.error(`${poi.name}: LLM failed — primaryTag=${primaryTag}, keywords=${mergedKeywords.length}, products=${mergedProducts.length} — ${msg}`);
        return "failed" as const;
      }
    });

    for (const r of results) {
      if (r === "enriched") enriched++;
      else if (r === "failed") failed++;
      else skipped++;
    }

    log.info(`  Batch done: ${results.filter((r) => r === "enriched").length} enriched, ${results.filter((r) => r === "failed").length} failed`);
  }

  log.info("");
  log.info("--- Enrichment Summary ---");
  log.info(`Total: ${toEnrich.length} | Enriched: ${enriched} | Failed: ${failed} | Skipped: ${skipped}`);

  process.exit(failed > toEnrich.length / 2 ? 1 : 0);
}

main().catch((error) => {
  log.error("Taxonomy enrichment failed:", error);
  process.exit(1);
});
