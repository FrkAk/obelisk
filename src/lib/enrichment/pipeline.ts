import { db } from "@/lib/db/client";
import {
  pois,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  enrichmentLog,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { extractCity } from "@/lib/geo/address";
import {
  webSearch,
  buildConsolidatedQuery,
  scrapeTopResults,
  translateKeywords,
  FALLBACK_KEYWORDS,
  type WebSearchResponse,
} from "@/lib/web/webSearch";
import { fetchWikipediaSummary } from "@/lib/web/wikipedia";
import { scrapeForEnrichment } from "@/lib/web/scraper";
import { extractProfileByCategory } from "@/lib/enrichment/extractors";
import { translateText } from "@/lib/ai/ollama";
import { getLanguageName } from "@/lib/ai/localization";
import { createLogger } from "@/lib/logger";

const log = createLogger("enrichment-pipeline");

const MAX_SCRAPE_PER_PASS = 2;

export type EnrichStatus =
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

export interface EnrichInput {
  id: string;
  name: string;
  address: string | null;
  categorySlug: string;
  websiteUrl: string | null;
  wikipediaUrl: string | null;
  locale: string;
}

export interface EnrichResult {
  fieldsUpdated: string[];
  status: EnrichStatus;
  confidenceScore: number | null;
  searchSource: "searxng" | "ollama" | "none";
  hasWikipedia: boolean;
}

export interface GatheredData {
  allScrapedText: string;
  sources: Array<{ url: string; title: string | null; type: string }>;
  hasWikipedia: boolean;
  searchSource: "searxng" | "ollama" | "none";
  query: string;
  translated: boolean;
  translatedKeywords: string;
  searchResponse: WebSearchResponse;
}

export interface ThrottleCallbacks {
  onSuccess?: () => void;
  onRateLimit?: () => void;
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

/**
 * Checks whether a POI was recently enriched within the given time window.
 *
 * Args:
 *     poiId: The POI UUID.
 *     source: The enrichment source string (e.g., "enrich").
 *     hoursAgo: Number of hours to look back.
 *
 * Returns:
 *     True if the POI has a recent enrichment log entry.
 */
export async function hasRecentEnrichment(
  poiId: string,
  source: string,
  hoursAgo: number = 720,
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

/**
 * Phase 1: Gathers all enrichment data for a POI using HTTP + translategemma.
 * No gemma3 calls — keeps translategemma loaded throughout the batch.
 *
 * Args:
 *     input: POI data needed for enrichment.
 *     callbacks: Optional throttle callbacks for batch orchestration.
 *
 * Returns:
 *     Gathered data including scraped text, sources, and search metadata.
 */
export async function gatherEnrichmentData(
  input: EnrichInput,
  callbacks?: ThrottleCallbacks,
): Promise<GatheredData> {
  const { name, address, categorySlug, websiteUrl, wikipediaUrl } = input;
  const poiLang = input.locale.split("-")[0];
  log.info(`Gathering data for "${name}" (lang: ${poiLang})`);
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

  if (websiteUrl) {
    try {
      const content = await scrapeForEnrichment(websiteUrl);
      if (!content.error && content.mainContent) {
        allScrapedText += `\n--- ${name} Official Website ---\n${content.mainContent}\n`;
        sources.push({ url: websiteUrl, title: content.title, type: "website" });
      }
    } catch {
      log.warn(`Failed to scrape website for ${name}`);
    }
  }

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

    callbacks?.onSuccess?.();
  } else if (searchResponse.meta.rateLimited) {
    callbacks?.onRateLimit?.();
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
 *     input: POI data needed for enrichment.
 *     gathered: Pre-gathered data from phase 1.
 *
 * Returns:
 *     Enrichment result with status, fields updated, and metadata.
 */
export async function extractAndSaveProfile(
  input: EnrichInput,
  gathered: GatheredData,
): Promise<EnrichResult> {
  const { id, name, categorySlug } = input;
  const profileTable = getProfileTable(categorySlug);
  const poiLang = input.locale.split("-")[0];

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
    log.info(`Saved ${categorySlug} profile for "${name}" (${fieldsUpdated.length} fields)`);
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
 * High-level enrichment for a single POI. Skips if recently enriched (30d).
 * Runs both phases sequentially. Catches errors internally, never throws.
 *
 * Args:
 *     input: POI data needed for enrichment.
 *
 * Returns:
 *     Enrichment result, or null if skipped or failed.
 */
export async function enrichPoi(input: EnrichInput): Promise<EnrichResult | null> {
  try {
    if (await hasRecentEnrichment(input.id, "enrich")) {
      log.info(`Skipped "${input.name}" (enriched within 30d)`);
      return null;
    }

    log.info(`Enriching "${input.name}"...`);
    const gathered = await gatherEnrichmentData(input);
    const result = await extractAndSaveProfile(input, gathered);
    log.info(
      `Enriched "${input.name}" (+${result.fieldsUpdated.length} fields, source: ${result.searchSource})`,
    );
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(`Enrichment failed for ${input.name}: ${message}`);
    return null;
  }
}
