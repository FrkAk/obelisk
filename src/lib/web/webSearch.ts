import { scrapeWebsite, scrapeWithOptions, type WebsiteContent } from "./scraper";
import {
  searxngSearch,
  type SearXNGSearchOptions,
  type SearXNGResult,
} from "./searxng";
import { ollamaWebSearch } from "./ollamaSearch";
import { extractCity } from "@/lib/geo/address";
import { translateText, TRANSLATE_MODEL } from "@/lib/ai/ollama";
import { createLogger } from "@/lib/logger";

const log = createLogger("webSearch");

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ScrapedContent {
  url: string;
  title: string | null;
  content: string | null;
}

export interface WebSearchMeta {
  source: "searxng" | "ollama" | "none";
  rateLimited: boolean;
  query: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  meta: WebSearchMeta;
}

export interface WebSearchContext {
  query: string;
  results: WebSearchResult[];
  scrapedContent?: ScrapedContent[];
  meta: WebSearchMeta;
}

const MAX_SCRAPE_RESULTS = 3;

export const FALLBACK_KEYWORDS: Record<string, string> = {
  food: "tradition cuisine local",
  history: "heritage significance events",
  architecture: "style architect construction",
  nature: "trails wildlife facilities",
  art: "exhibitions collection artists",
  culture: "events performances program",
  nightlife: "atmosphere music reviews",
  shopping: "products specialties brands",
  views: "panorama landmarks photography",
  hidden: "secret local unique",
  sports: "athletes history competitions",
  health: "wellness history community",
  transport: "history infrastructure significance",
  education: "academic history notable",
  services: "community history significance",
};

/**
 * Translates English keywords to a target language using translategemma.
 * Uses newline-separated format for clean 1:1 word translation.
 *
 * Args:
 *     keywords: English keywords (e.g., "tradition cuisine local").
 *     targetLangCode: Target language code (e.g., "de", "fr").
 *
 * Returns:
 *     Translated keywords as space-separated string, or original English keywords on failure.
 */
export async function translateKeywords(
  keywords: string,
  targetLangCode: string,
): Promise<string> {
  if (targetLangCode === "en") return keywords;

  try {
    const words = keywords.split(/\s+/).filter(Boolean);
    const input = words.join("\n");

    const result = await translateText(input, "English", targetLangCode, TRANSLATE_MODEL);

    const translated = result
      .split("\n")
      .map((line) => line.trim().split(/\s+/)[0]?.replace(/,/g, ""))
      .filter(Boolean);

    if (translated.length === 0) return keywords;

    return translated.join(" ");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.warn(`Keyword translation failed (en → ${targetLangCode}): ${msg}`);
    return keywords;
  }
}

/**
 * Builds a smart search query based on POI context and category.
 *
 * Args:
 *     poi: Object containing name, category, and optional address.
 *
 * Returns:
 *     Optimized search query string.
 */
export function buildSearchQuery(poi: {
  name: string;
  category: string;
  address?: string | null;
}): string {
  const { name, category, address } = poi;
  const city = extractCity(address);
  const location = city || "";

  const base = `${name} ${location}`.trim();
  const patterns: Record<string, string> = {
    food: `"${base}" restaurant review`,
    history: `"${base}" history facts significance`,
    art: `"${base}" museum gallery art collection`,
    architecture: `"${base}" architecture building history design`,
    nature: `"${base}" park nature trails things to do`,
    culture: `"${base}" cultural events performances`,
    views: `"${base}" viewpoint scenic best time visit`,
    hidden: `"${base}" local secret hidden gem`,
  };

  const normalized = category.toLowerCase();

  if (normalized.includes("food") || normalized.includes("cafe") || normalized.includes("restaurant") || normalized.includes("bar")) {
    return patterns.food.trim();
  }
  if (normalized.includes("history") || normalized.includes("historic")) {
    return patterns.history.trim();
  }
  if (normalized.includes("art") || normalized.includes("museum") || normalized.includes("gallery")) {
    return patterns.art.trim();
  }
  if (normalized.includes("nature") || normalized.includes("park") || normalized.includes("garden")) {
    return patterns.nature.trim();
  }
  if (normalized.includes("architecture") || normalized.includes("building")) {
    return patterns.architecture.trim();
  }
  if (normalized.includes("view") || normalized.includes("scenic")) {
    return patterns.views.trim();
  }
  if (normalized.includes("culture") || normalized.includes("theatre") || normalized.includes("theater")) {
    return patterns.culture.trim();
  }
  if (normalized.includes("hidden")) {
    return patterns.hidden.trim();
  }

  return `${name} ${location} interesting facts`.trim();
}

/**
 * Builds a consolidated search query from POI name, city, and keywords.
 *
 * Args:
 *     poiName: Name of the POI.
 *     city: City name for location context.
 *     keywords: Space-separated search keywords (LLM-generated or fallback).
 *
 * Returns:
 *     Consolidated search query string.
 */
export function buildConsolidatedQuery(
  poiName: string,
  city: string,
  keywords: string,
): string {
  return `"${poiName} ${city}" ${keywords}`;
}

function toWebSearchResults(results: SearXNGResult[]): WebSearchResult[] {
  return results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

/**
 * Searches the web with SearXNG as primary and Ollama cloud as fallback.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *     options: Optional SearXNG search parameters.
 *
 * Returns:
 *     Web search response with results and metadata about the source used.
 */
export async function webSearch(
  query: string,
  maxResults: number = 5,
  options: SearXNGSearchOptions = {},
): Promise<WebSearchResponse> {
  try {
    const searxngResponse = await searxngSearch(query, maxResults, options);

    if (!searxngResponse.meta.rateLimited && searxngResponse.results.length > 0) {
      return {
        results: toWebSearchResults(searxngResponse.results),
        meta: { source: "searxng", rateLimited: false, query },
      };
    }

    if (searxngResponse.meta.rateLimited) {
      log.warn(`SearXNG rate limited, falling back to Ollama for: ${query.slice(0, 60)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(`SearXNG failed, falling back to Ollama: ${message}`);
  }

  try {
    const ollamaResults = await ollamaWebSearch(query, maxResults);

    if (ollamaResults.length > 0) {
      return {
        results: toWebSearchResults(ollamaResults),
        meta: { source: "ollama", rateLimited: true, query },
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(`Ollama search also failed: ${message}`);
  }

  return {
    results: [],
    meta: { source: "none", rateLimited: true, query },
  };
}

/**
 * Scrapes content from top search result URLs for deeper context.
 *
 * Args:
 *     results: Search results to scrape.
 *     limit: Maximum number of URLs to scrape.
 *     maxContentLength: Optional content length limit override.
 *
 * Returns:
 *     Array of scraped content from each URL.
 */
export async function scrapeTopResults(
  results: WebSearchResult[],
  limit: number = MAX_SCRAPE_RESULTS,
  maxContentLength?: number,
): Promise<ScrapedContent[]> {
  const urlsToScrape = results.slice(0, limit);
  const settled = await Promise.allSettled(
    urlsToScrape.map(async (result) => {
      const content: WebsiteContent = maxContentLength
        ? await scrapeWithOptions(result.url, { maxContentLength })
        : await scrapeWebsite(result.url);
      if (!content.error && content.mainContent) {
        return { url: result.url, title: content.title, content: content.mainContent } as ScrapedContent;
      }
      return null;
    }),
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<ScrapedContent | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((r): r is ScrapedContent => r !== null);
}

/**
 * Enriches POI data with web search results and optional scraped content.
 *
 * Args:
 *     poi: Object containing name, category, and optional address.
 *     scrapeResults: Whether to also scrape top result URLs.
 *     options: Optional language and pre-generated keywords for native-language search.
 *
 * Returns:
 *     Web search context including query, results, metadata, and optional scraped content.
 */
export async function enrichPOIWithWebSearch(
  poi: {
    name: string;
    category: string;
    address?: string | null;
  },
  scrapeResults: boolean = true,
  options?: { language?: string; keywords?: string },
): Promise<WebSearchContext> {
  const query = options?.keywords
    ? buildConsolidatedQuery(poi.name, extractCity(poi.address, "Munich"), options.keywords)
    : buildSearchQuery(poi);

  log.info(`Query: "${query}"`);

  const searchOptions: SearXNGSearchOptions = {};
  if (options?.language) {
    searchOptions.language = options.language;
  }

  const response = await webSearch(query, 5, searchOptions);

  log.info(`Results: ${response.results.length} (source: ${response.meta.source})`);

  const context: WebSearchContext = {
    query,
    results: response.results,
    meta: response.meta,
  };

  if (scrapeResults && response.results.length > 0) {
    const scrapedContent = await scrapeTopResults(response.results);
    context.scrapedContent = scrapedContent;
    log.info(`Scraped: ${scrapedContent.length}`);
  }

  return context;
}
