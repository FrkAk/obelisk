import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  contactInfo,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { isWithinRadius } from "../src/lib/geo/distance";
import { extractCity } from "../src/lib/geo/address";
import {
  webSearch,
  buildConsolidatedQuery,
  scrapeTopResults,
  translateKeywords,
  FALLBACK_KEYWORDS,
  type WebSearchResponse,
} from "../src/lib/web/webSearch";
import { fetchWikipediaSummary } from "../src/lib/web/wikipedia";
import { scrapeForEnrichment } from "../src/lib/web/scraper";
import { extractProfileByCategory } from "../src/lib/enrichment/extractors";
import { translateText, TRANSLATE_MODEL, checkOllamaHealth } from "../src/lib/ai/ollama";
import { getLanguageName } from "../src/lib/ai/localization";
import { createLogger } from "../src/lib/logger";

const log = createLogger("enrich-pois");

const MUNICH_CENTER = { lat: 48.137154, lon: 11.576124 };
const ENRICH_RADIUS = parseInt(
  process.env.ENRICH_RADIUS || process.env.SEED_RADIUS || "5000",
  10,
);

const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "20", 10);
const INTER_BATCH_DELAY_MS = parseInt(
  process.env.ENRICH_INTER_BATCH_DELAY_MS || "8000",
  10,
);
const MAX_SCRAPE_PER_PASS = 2;

type EnrichStatus =
  | "success"
  | "success_fb"
  | "rate_limited"
  | "no_results"
  | "extract_empty"
  | "skipped";

type ProfileTable =
  | typeof foodProfiles
  | typeof historyProfiles
  | typeof architectureProfiles
  | typeof natureProfiles
  | typeof artCultureProfiles
  | typeof nightlifeProfiles
  | typeof shoppingProfiles
  | typeof viewpointProfiles;

interface EnrichmentSummary {
  total: number;
  web: number;
  fallback: number;
  wiki: number;
  rateLimited: number;
  noResults: number;
  extractEmpty: number;
  skipped: number;
  wikipediaHits: number;
}

/**
 * Adaptive throttle controller that adjusts delays based on rate limit signals.
 *
 * Increases delay exponentially on rate limit hits and gradually reduces it
 * on successful requests. Triggers a cooldown pause after consecutive rate
 * limit events.
 */
class ThrottleController {
  private baselineMs: number;
  private currentDelayMs: number;
  private maxDelayMs = 60000;
  private consecutiveRateLimits = 0;
  private cooldownThreshold = 3;
  private cooldownMs = 120000;

  constructor(baselineMs: number) {
    this.baselineMs = baselineMs;
    this.currentDelayMs = baselineMs;
  }

  /**
   * Reports a successful request, gradually reducing delay toward baseline.
   */
  reportSuccess(): void {
    this.consecutiveRateLimits = 0;
    this.currentDelayMs = Math.max(
      this.baselineMs,
      Math.floor(this.currentDelayMs * 0.75),
    );
  }

  /**
   * Reports a rate limit event, doubling the current delay (capped at 60s).
   */
  reportRateLimit(): void {
    this.consecutiveRateLimits++;
    this.currentDelayMs = Math.min(this.currentDelayMs * 2, this.maxDelayMs);
    log.warn(
      `Rate limit #${this.consecutiveRateLimits}, delay now ${this.currentDelayMs}ms`,
    );
  }

  /**
   * Checks whether a cooldown pause is needed after 3 consecutive rate limits.
   *
   * Returns:
   *     True if a 2-minute cooldown should be applied before continuing.
   */
  shouldCooldown(): boolean {
    return this.consecutiveRateLimits >= this.cooldownThreshold;
  }

  /**
   * Pauses execution for the cooldown period and resets the consecutive counter.
   */
  async applyCooldown(): Promise<void> {
    log.warn(
      `${this.consecutiveRateLimits} consecutive rate limits — cooling down for ${this.cooldownMs / 1000}s`,
    );
    await new Promise((r) => setTimeout(r, this.cooldownMs));
    this.consecutiveRateLimits = 0;
  }

  /**
   * Waits for the current adaptive delay between requests.
   */
  async wait(): Promise<void> {
    if (this.currentDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.currentDelayMs));
    }
  }
}

function getProfileTable(categorySlug: string): ProfileTable | null {
  const map: Record<string, ProfileTable> = {
    food: foodProfiles,
    history: historyProfiles,
    architecture: architectureProfiles,
    nature: natureProfiles,
    art: artCultureProfiles,
    culture: artCultureProfiles,
    nightlife: nightlifeProfiles,
    shopping: shoppingProfiles,
    views: viewpointProfiles,
  };
  return map[categorySlug] ?? null;
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function mapExtractedToProfileFields(
  extracted: Record<string, unknown>,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extracted)) {
    mapped[snakeToCamel(key)] = value;
  }
  return mapped;
}

async function hasRecentEnrichment(
  poiId: string,
  source: string,
  hoursAgo: number = 24,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const rows = await db
    .select({ id: enrichmentLog.id })
    .from(enrichmentLog)
    .where(
      and(
        eq(enrichmentLog.poiId, poiId),
        eq(enrichmentLog.source, source),
        sql`${enrichmentLog.createdAt} > ${cutoff.toISOString()}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function logEnrichment(
  poiId: string,
  source: string,
  status: string,
  fieldsUpdated: string[],
  metadata: Record<string, unknown>,
): Promise<void> {
  await db.insert(enrichmentLog).values({
    poiId,
    source,
    status,
    fieldsUpdated,
    metadata,
  });
}

async function buildNullOnlyUpdate(
  profileTable: ProfileTable,
  poiId: string,
  extracted: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existingRows = await db
    .select()
    .from(profileTable)
    .where(eq(profileTable.poiId, poiId))
    .limit(1);

  if (existingRows.length === 0) {
    return extracted;
  }

  const existing = existingRows[0] as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(extracted)) {
    if (key === "poiId") continue;
    if (existing[key] === null || existing[key] === undefined) {
      update[key] = value;
    }
  }

  return update;
}

interface PoiInput {
  id: string;
  name: string;
  address: string | null;
  categorySlug: string;
  website: string[] | null;
  wikipediaUrl: string | null;
  locale: string;
  osmTags: Record<string, string> | null;
}

interface EnrichResult {
  fieldsUpdated: string[];
  status: EnrichStatus;
  confidenceScore: number | null;
  searchSource: "searxng" | "ollama" | "none";
  hasWikipedia: boolean;
}

interface GatheredData {
  allScrapedText: string;
  sources: Array<{ url: string; title: string | null; type: string }>;
  hasWikipedia: boolean;
  searchSource: "searxng" | "ollama" | "none";
  query: string;
  translated: boolean;
  translatedKeywords: string;
  searchResponse: WebSearchResponse;
}

/**
 * Phase 1: Gathers all enrichment data for a POI using HTTP + translategemma.
 * No gemma3 calls — keeps translategemma loaded throughout the batch.
 *
 * Args:
 *     poi: POI data needed for enrichment.
 *     throttle: Shared throttle controller for adaptive delays.
 *
 * Returns:
 *     Gathered data including scraped text, sources, and search metadata.
 */
async function gatherEnrichmentData(
  poi: PoiInput,
  throttle: ThrottleController,
): Promise<GatheredData> {
  const { name, address, categorySlug, website, wikipediaUrl } = poi;
  const city = extractCity(address, "Munich");

  let allScrapedText = "";
  const sources: Array<{ url: string; title: string | null; type: string }> = [];
  let hasWikipedia = false;
  let searchSource: "searxng" | "ollama" | "none" = "none";

  if (wikipediaUrl) {
    try {
      const summary = await fetchWikipediaSummary(wikipediaUrl);
      if (summary && summary.extract) {
        allScrapedText += `\n--- ${name} Wikipedia ---\n${summary.extract}\n`;
        sources.push({ url: wikipediaUrl, title: summary.title, type: "wikipedia" });
        hasWikipedia = true;
      }
    } catch {
      log.warn(`Wikipedia fetch failed for ${name}`);
    }
  }

  const primaryWebsite = website?.[0] ?? null;
  if (primaryWebsite) {
    try {
      const content = await scrapeForEnrichment(primaryWebsite);
      if (!content.error && content.mainContent) {
        allScrapedText += `\n--- ${name} Official Website ---\n${content.mainContent}\n`;
        sources.push({ url: primaryWebsite, title: content.title, type: "website" });
      }
    } catch {
      log.warn(`Failed to scrape website for ${name}`);
    }
  }

  const poiLang = poi.locale.split("-")[0];

  const englishKeywords = FALLBACK_KEYWORDS[categorySlug] ?? "interesting facts information";
  const queryKeywords = poiLang !== "en"
    ? await translateKeywords(englishKeywords, poiLang)
    : englishKeywords;
  const query = buildConsolidatedQuery(name, city, queryKeywords);
  const searchResponse = await webSearch(query, 5, { language: poiLang });
  searchSource = searchResponse.meta.source;

  if (searchResponse.results.length > 0) {
    const scraped = await scrapeTopResults(
      searchResponse.results,
      MAX_SCRAPE_PER_PASS,
      4000,
    );
    for (const s of scraped) {
      if (s.content) {
        allScrapedText += `\n--- ${s.title || s.url} ---\n${s.content}\n`;
        sources.push({ url: s.url, title: s.title, type: "search" });
      }
    }

    if (scraped.length === 0) {
      const snippetText = searchResponse.results
        .map((r) => `${r.title}: ${r.snippet}`)
        .join("\n");
      allScrapedText += snippetText;
    }

    throttle.reportSuccess();
  } else if (searchResponse.meta.rateLimited) {
    throttle.reportRateLimit();
  }

  let translated = false;
  if (poiLang !== "en" && allScrapedText.trim()) {
    const original = allScrapedText;
    allScrapedText = await translateText(allScrapedText, getLanguageName(poiLang));
    translated = allScrapedText !== original;
  }

  return {
    allScrapedText,
    sources,
    hasWikipedia,
    searchSource,
    query,
    translated,
    translatedKeywords: queryKeywords,
    searchResponse,
  };
}

/**
 * Phase 2: Extracts profile using gemma3 and saves to DB.
 * No translategemma calls — keeps gemma3 loaded throughout the batch.
 *
 * Args:
 *     poi: POI data needed for enrichment.
 *     gathered: Pre-gathered data from phase 1.
 *
 * Returns:
 *     Enrichment result with status, fields updated, and metadata.
 */
async function extractAndSaveProfile(
  poi: PoiInput,
  gathered: GatheredData,
): Promise<EnrichResult> {
  const { id, name, categorySlug } = poi;
  const profileTable = getProfileTable(categorySlug);
  const poiLang = poi.locale.split("-")[0];

  const enrichMetadata: Record<string, unknown> = {
    query: gathered.query,
    searchSource: gathered.searchSource,
    searchLanguage: poiLang,
    translated: gathered.translated,
    translatedKeywords: gathered.translatedKeywords,
    hasWikipedia: gathered.hasWikipedia,
    sources: gathered.sources.map((s) => ({ url: s.url, type: s.type })),
  };

  if (!profileTable) {
    return {
      fieldsUpdated: [],
      status: "skipped",
      confidenceScore: null,
      searchSource: gathered.searchSource,
      hasWikipedia: gathered.hasWikipedia,
    };
  }

  if (!gathered.allScrapedText.trim()) {
    const status: EnrichStatus = gathered.searchResponse.meta.rateLimited
      ? "rate_limited"
      : "no_results";
    await logEnrichment(id, "enrich", status, [], enrichMetadata);
    return {
      fieldsUpdated: [],
      status,
      confidenceScore: null,
      searchSource: gathered.searchSource,
      hasWikipedia: gathered.hasWikipedia,
    };
  }

  const extracted = await extractProfileByCategory(
    categorySlug,
    gathered.allScrapedText,
    name,
    gathered.allScrapedText.length,
  );

  if (!extracted || Object.keys(extracted).length === 0) {
    await logEnrichment(id, "enrich", "extract_empty", [], {
      ...enrichMetadata,
      textLength: gathered.allScrapedText.length,
    });
    return {
      fieldsUpdated: [],
      status: "extract_empty",
      confidenceScore: null,
      searchSource: gathered.searchSource,
      hasWikipedia: gathered.hasWikipedia,
    };
  }

  const camelCased = mapExtractedToProfileFields(extracted);
  const confidenceScore =
    typeof camelCased.confidenceScore === "number"
      ? (camelCased.confidenceScore as number)
      : null;

  const signatureDishes =
    "signatureDishes" in camelCased
      ? (camelCased.signatureDishes as string[])
      : undefined;
  const musicGenres =
    "musicGenres" in camelCased
      ? (camelCased.musicGenres as string[])
      : undefined;
  delete camelCased.signatureDishes;
  delete camelCased.musicGenres;

  const updateSet = await buildNullOnlyUpdate(profileTable, id, camelCased);
  const fieldsUpdated: string[] = Object.keys(updateSet);

  if (fieldsUpdated.length > 0) {
    const existingRows = await db
      .select()
      .from(profileTable)
      .where(eq(profileTable.poiId, id))
      .limit(1);

    if (existingRows.length === 0) {
      await db.insert(profileTable).values({
        poiId: id,
        ...updateSet,
      } as typeof profileTable.$inferInsert);
    } else {
      await db
        .update(profileTable)
        .set(updateSet as Partial<typeof profileTable.$inferInsert>)
        .where(eq(profileTable.poiId, id));
    }
  }

  await db
    .update(pois)
    .set({ embedding: sql`NULL` })
    .where(eq(pois.id, id));

  const allFieldsUpdated = [
    ...fieldsUpdated.map((f) => `${categorySlug}_profiles.${f}`),
  ];

  if (signatureDishes && signatureDishes.length > 0) {
    allFieldsUpdated.push("signature_dishes_noted");
  }
  if (musicGenres && musicGenres.length > 0) {
    allFieldsUpdated.push("music_genres_noted");
  }

  const status: EnrichStatus =
    gathered.searchSource === "ollama" ? "success_fb" : "success";

  await logEnrichment(id, "enrich", status, allFieldsUpdated, {
    ...enrichMetadata,
    extractedFields: Object.keys(extracted),
    confidenceScore,
  });

  return {
    fieldsUpdated: allFieldsUpdated,
    status,
    confidenceScore,
    searchSource: gathered.searchSource,
    hasWikipedia: gathered.hasWikipedia,
  };
}

/**
 * Prints the end-of-run enrichment summary.
 *
 * Args:
 *     summary: Aggregated enrichment counts.
 */
function printSummary(summary: EnrichmentSummary): void {
  const enriched = summary.web + summary.fallback + summary.wiki;
  log.info("");
  log.info("--- Enrichment Summary ---");
  log.info(
    `Total: ${summary.total} | Enriched: ${enriched} (web: ${summary.web}, fallback: ${summary.fallback}, wiki-only: ${summary.wiki}) | Rate limited: ${summary.rateLimited} | No results: ${summary.noResults} | Empty: ${summary.extractEmpty} | Skipped: ${summary.skipped}`,
  );
  log.info(`Wikipedia hits: ${summary.wikipediaHits}/${summary.total}`);
}

async function main() {
  log.info("Starting POI enrichment pipeline...");

  const throttle = new ThrottleController(INTER_BATCH_DELAY_MS);

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.slug]));

  const allPois = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      website: contactInfo.website,
      wikipediaUrl: pois.wikipediaUrl,
      locale: pois.locale,
      osmTags: pois.osmTags,
    })
    .from(pois)
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .orderBy(pois.name);

  const poisToEnrich = allPois.filter((p) =>
    isWithinRadius(
      MUNICH_CENTER.lat,
      MUNICH_CENTER.lon,
      p.latitude,
      p.longitude,
      ENRICH_RADIUS,
    ),
  );

  log.info(
    `Found ${allPois.length} total POIs, ${poisToEnrich.length} within enrich radius (${ENRICH_RADIUS}m)`,
  );
  log.info(
    `Config: batchSize=${BATCH_SIZE}, interBatchDelay=${INTER_BATCH_DELAY_MS}ms (2-phase: translategemma then gemma3)`,
  );

  const hasNonEnglish = poisToEnrich.some((p) => !p.locale.startsWith("en"));
  if (hasNonEnglish) {
    const ok = await checkOllamaHealth(TRANSLATE_MODEL);
    if (!ok) {
      log.error(`Model ${TRANSLATE_MODEL} not loaded. Run: ollama pull ${TRANSLATE_MODEL}`);
      process.exit(1);
    }
    log.info(`Translation model ${TRANSLATE_MODEL} available`);
  }

  const summary: EnrichmentSummary = {
    total: poisToEnrich.length,
    web: 0,
    fallback: 0,
    wiki: 0,
    rateLimited: 0,
    noResults: 0,
    extractEmpty: 0,
    skipped: 0,
    wikipediaHits: 0,
  };

  let processed = 0;

  for (let i = 0; i < poisToEnrich.length; i += BATCH_SIZE) {
    const batch = poisToEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(poisToEnrich.length / BATCH_SIZE);

    if (throttle.shouldCooldown()) {
      await throttle.applyCooldown();
    }

    log.info(
      `Batch ${batchNum}/${totalBatches} (${batch.length} POIs)`,
    );

    // Phase 1: Gather data — HTTP + translategemma (1 model load for entire batch)
    log.info(`  Phase 1: Gathering data (translategemma)`);

    interface GatheredItem {
      poi: PoiInput;
      data: GatheredData;
    }

    const gatheredBatch: GatheredItem[] = [];
    const skippedInBatch: string[] = [];

    for (const poi of batch) {
      const categorySlug = poi.categoryId
        ? (categoryMap.get(poi.categoryId) ?? "hidden")
        : "hidden";

      if (await hasRecentEnrichment(poi.id, "enrich")) {
        skippedInBatch.push(poi.name);
        processed++;
        summary.skipped++;
        continue;
      }

      const poiInput: PoiInput = {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        categorySlug,
        website: poi.website,
        wikipediaUrl: poi.wikipediaUrl,
        locale: poi.locale,
        osmTags: poi.osmTags,
      };

      try {
        const data = await gatherEnrichmentData(poiInput, throttle);
        gatheredBatch.push({ poi: poiInput, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        log.error(`${poi.name}: gather failed — ${message}`);
        processed++;
        summary.noResults++;
      }
    }

    if (skippedInBatch.length > 0) {
      log.info(`  Skipped ${skippedInBatch.length} recently enriched`);
    }

    // Phase 2: Extract profiles — gemma3 (1 model load for entire batch)
    if (gatheredBatch.length > 0) {
      log.info(`  Phase 2: Extracting ${gatheredBatch.length} profiles (gemma3)`);

      for (const { poi, data } of gatheredBatch) {
        processed++;

        try {
          const result = await extractAndSaveProfile(poi, data);

          if (result.hasWikipedia) summary.wikipediaHits++;

          switch (result.status) {
            case "success":
              summary.web++;
              log.success(
                `[${processed}/${poisToEnrich.length}] ${poi.name} (+${result.fieldsUpdated.length} fields${result.confidenceScore !== null ? `, confidence: ${result.confidenceScore}%` : ""})`,
              );
              break;
            case "success_fb":
              summary.fallback++;
              log.success(
                `[${processed}/${poisToEnrich.length}] ${poi.name} (+${result.fieldsUpdated.length} fields, fallback${result.confidenceScore !== null ? `, confidence: ${result.confidenceScore}%` : ""})`,
              );
              break;
            case "rate_limited":
              summary.rateLimited++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${poi.name}: rate limited`,
              );
              break;
            case "no_results":
              summary.noResults++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${poi.name}: no results`,
              );
              break;
            case "extract_empty":
              summary.extractEmpty++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${poi.name}: extraction empty`,
              );
              break;
            case "skipped":
              summary.skipped++;
              break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          log.error(`[${processed}/${poisToEnrich.length}] ${poi.name}: extract failed — ${message}`);
          summary.noResults++;
        }
      }
    }

    if (i + BATCH_SIZE < poisToEnrich.length) {
      await throttle.wait();
    }
  }

  printSummary(summary);

  const failCount = summary.rateLimited + summary.noResults + summary.extractEmpty;
  process.exit(failCount > poisToEnrich.length / 2 ? 1 : 0);
}

main().catch((error) => {
  log.error("Enrichment pipeline failed:", error);
  process.exit(1);
});
