import { readFileSync } from "fs";
import { db } from "../src/lib/db/client";
import { pois, categories } from "../src/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { generateText, checkOllamaHealth } from "../src/lib/ai/ollama";
import { generateVisualDescription } from "../src/lib/media/visual";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("enrich-taxonomy");

const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "50", 10);
const CONCURRENCY = parseInt(process.env.ENRICH_CONCURRENCY || "4", 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";
const FORCE = process.argv.includes("--force");
const COORDINATOR_URL = process.env.ENRICH_COORDINATOR_URL || "";

const NUM_PREDICT: Record<DataTier, number> = {
  rich: 256,
  moderate: 128,
  thin: 64,
};

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

/**
 * Loads and parses a JSON file from the data directory.
 *
 * @param path - Relative path to the JSON file.
 * @returns Parsed JSON object.
 */
function loadJson<T>(path: string): T {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as T;
}

const TAG_KEY_PRIORITY = ["shop", "amenity", "tourism", "historic", "leisure", "natural"];

/**
 * Determines the primary OSM tag key=value for enrichment lookup.
 * Mirrors the logic in determineCategorySlug from seed-pois.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Primary tag string like "shop=clothes" or "amenity=restaurant", or null.
 */
function determinePrimaryTag(osmTags: Record<string, string>): string | null {
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

/** OSM tag keys to skip — metadata, addresses, redundant, or already captured elsewhere. */
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

/**
 * Extracts all useful OSM tags as human-readable facts for the LLM prompt.
 * Dumps everything non-noise so the model has maximum context.
 *
 * @param osmTags - Raw OSM tags from the POI.
 * @returns Array of "key: value" fact strings.
 */
function extractOsmFacts(osmTags: Record<string, string>): string[] {
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

type DataTier = "rich" | "moderate" | "thin";

/**
 * Assesses how much data is available to control output length.
 *
 * @param factsCount - Number of extracted OSM facts.
 * @param hasKeywords - Whether taxonomy keywords exist.
 * @param hasWikipedia - Whether a Wikipedia summary is available.
 * @param hasWebsite - Whether website text has been crawled.
 * @returns Data tier controlling prompt length instruction.
 */
function assessDataTier(factsCount: number, hasKeywords: boolean, hasWikipedia: boolean, hasWebsite: boolean, hasVisualDescription: boolean = false): DataTier {
  if (hasWikipedia || hasWebsite || hasVisualDescription || factsCount >= 5) return "rich";
  if (factsCount >= 2 || hasKeywords) return "moderate";
  return "thin";
}

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
function buildSummaryPrompt(
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


interface EnrichResult {
  status: "enriched" | "failed" | "skipped";
  poiId: string;
  profile?: PoiProfile;
}

interface PoiRow {
  id: string;
  name: string;
  address: string | null;
  categoryId: string | null;
  osmTags: Record<string, string> | null;
  profile: PoiProfile | null;
}

/**
 * Enriches a single POI: merges taxonomy data, generates visual description and LLM summary.
 *
 * @param poi - POI row from the database.
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 * @returns Enrichment result with status and updated profile.
 */
async function enrichPoi(
  poi: PoiRow,
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
): Promise<EnrichResult> {
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

  if (FORCE || !updatedProfile.visualDescription) {
    const visualDesc = await generateVisualDescription(poi.name, updatedProfile.mapillaryThumbUrl, updatedProfile.wikiImageUrl, OLLAMA_MODEL);
    if (visualDesc) {
      updatedProfile.visualDescription = visualDesc.trim();
    }
  }

  try {
    const prompt = buildSummaryPrompt(poi.name, categorySlug, updatedProfile, poi.address, brandInfo, osmFacts, dataTier);
    const summary = await generateText(prompt, OLLAMA_MODEL, {
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

/**
 * Writes enrichment results to the database.
 *
 * @param results - Array of enrichment results from a batch.
 * @returns Count of enriched, failed, and skipped.
 */
async function persistResults(results: EnrichResult[]): Promise<{ enriched: number; failed: number; skipped: number }> {
  const toUpdate = results.filter(
    (r): r is EnrichResult & { status: "enriched"; profile: PoiProfile } =>
      r.status === "enriched" && r.profile !== undefined,
  );

  if (toUpdate.length > 0) {
    await db.transaction(async (tx) => {
      for (const item of toUpdate) {
        await tx
          .update(pois)
          .set({
            profile: item.profile,
            embedding: null,
            updatedAt: sql`now()`,
          })
          .where(eq(pois.id, item.poiId));
      }
    });
  }

  let enriched = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of results) {
    if (r.status === "enriched") enriched++;
    else if (r.status === "failed") failed++;
    else skipped++;
  }
  return { enriched, failed, skipped };
}

/**
 * Fetches POI rows by their IDs from the database.
 *
 * @param ids - Array of POI IDs to fetch.
 * @returns Array of POI rows.
 */
async function fetchPoisByIds(ids: string[]): Promise<PoiRow[]> {
  if (ids.length === 0) return [];
  return db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .where(inArray(pois.id, ids));
}

/**
 * Runs enrichment in pull mode, fetching batches from the coordinator.
 *
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 */
async function runPullMode(
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
): Promise<void> {
  const hostname = require("os").hostname() as string;
  const regRes = await fetch(`${COORDINATOR_URL}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: hostname }),
  });
  const { workerId } = await regRes.json() as { workerId: string; config: { model: string; batchSize: number } };
  log.info(`Registered with coordinator as worker ${workerId} (${hostname})`);

  let totalEnriched = 0;
  let totalFailed = 0;
  let stopping = false;
  let currentBatchId: string | null = null;
  const startMs = Date.now();

  /**
   * Sends a disconnect message to the coordinator so inflight batches get requeued immediately.
   */
  async function disconnect(): Promise<void> {
    try {
      await fetch(`${COORDINATOR_URL}/disconnect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId, batchId: currentBatchId }),
      });
      log.info("Disconnected from coordinator, inflight batch requeued");
    } catch {
      log.warn("Failed to notify coordinator of disconnect");
    }
  }

  const heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch(`${COORDINATOR_URL}/heartbeat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json() as { ok: boolean; shutdown?: boolean };
      if (data.shutdown) {
        log.info("Coordinator is shutting down, finishing current batch...");
        stopping = true;
      }
    } catch {
      log.warn("Heartbeat failed");
    }
  }, 30_000);

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, async () => {
      if (stopping) {
        log.info("Force exiting...");
        process.exit(1);
      }
      log.info(`Received ${sig}, finishing current batch then exiting...`);
      stopping = true;
    });
  }

  try {
    while (!stopping) {
      const batchRes = await fetch(`${COORDINATOR_URL}/batch?workerId=${workerId}`);
      const batch = await batchRes.json() as { batchId: string | null; poiIds: string[]; done: boolean };

      if (batch.done) {
        log.info("All work complete, exiting.");
        break;
      }

      if (!batch.batchId || batch.poiIds.length === 0) {
        log.info("No batches available, waiting 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      currentBatchId = batch.batchId;
      const poiRows = await fetchPoisByIds(batch.poiIds);
      const results = await processWithConcurrency<PoiRow, EnrichResult>(
        poiRows,
        CONCURRENCY,
        (poi) => enrichPoi(poi, tagMap, brandMap, categoryMap),
      );

      const stats = await persistResults(results);
      totalEnriched += stats.enriched;
      totalFailed += stats.failed;

      await fetch(`${COORDINATOR_URL}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workerId,
          batchId: batch.batchId,
          results: results.map((r) => ({ poiId: r.poiId, status: r.status })),
        }),
      });
      currentBatchId = null;

      const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
      log.info(`Batch ${batch.batchId} done — ${stats.enriched} enriched, ${stats.failed} failed (total: ${totalEnriched} enriched, ${totalFailed} failed, ${elapsed}s elapsed)`);
    }
  } finally {
    clearInterval(heartbeatInterval);
    if (stopping && currentBatchId) {
      await disconnect();
    }
  }

  log.info("");
  log.info("--- Enrichment Summary (pull mode) ---");
  log.info(`Enriched: ${totalEnriched} | Failed: ${totalFailed}`);
  process.exit(totalFailed > totalEnriched ? 1 : 0);
}

/**
 * Runs the taxonomy enrichment pipeline in standalone mode: loads taxonomy maps,
 * iterates through unenriched POIs, merges keywords/products, generates LLM
 * summaries, and updates the database.
 *
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 */
async function runStandaloneMode(
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
): Promise<void> {
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

  const toEnrich = FORCE
    ? allPois
    : allPois.filter((p: PoiRow) => !p.profile?.summary);

  log.info(`Found ${allPois.length} total POIs, ${toEnrich.length} need enrichment`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  const startMs = Date.now();

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);

    const results = await processWithConcurrency<PoiRow, EnrichResult>(
      batch,
      CONCURRENCY,
      (poi) => enrichPoi(poi, tagMap, brandMap, categoryMap),
    );

    const stats = await persistResults(results);
    enriched += stats.enriched;
    failed += stats.failed;
    skipped += stats.skipped;

    const done = Math.min(i + BATCH_SIZE, toEnrich.length);
    log.info(`${formatEta(startMs, done, toEnrich.length)} — ${stats.enriched} enriched, ${stats.failed} failed`);
  }

  log.info("");
  log.info("--- Enrichment Summary ---");
  log.info(`Total: ${toEnrich.length} | Enriched: ${enriched} | Failed: ${failed} | Skipped: ${skipped}`);

  process.exit(failed > toEnrich.length / 2 ? 1 : 0);
}

/**
 * Entry point: checks Ollama health, loads taxonomy data, and dispatches
 * to pull mode (coordinator) or standalone mode.
 */
async function main() {
  log.info("Starting taxonomy enrichment pipeline...");
  log.info(`Config: batchSize=${BATCH_SIZE}, concurrency=${CONCURRENCY}, model=${OLLAMA_MODEL}, force=${FORCE}, coordinator=${COORDINATOR_URL || "none"}`);

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

  if (COORDINATOR_URL) {
    await runPullMode(tagMap, brandMap, categoryMap);
  } else {
    await runStandaloneMode(tagMap, brandMap, categoryMap);
  }
}

main().catch((error) => {
  log.error("Taxonomy enrichment failed:", error);
  process.exit(1);
});
