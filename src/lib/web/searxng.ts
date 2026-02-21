import { createLogger } from "@/lib/logger";

const log = createLogger("searxng");

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const MAX_RETRIES = parseInt(process.env.SEARXNG_MAX_RETRIES || "4", 10);
const BASE_DELAY_MS = parseInt(process.env.SEARXNG_BASE_DELAY_MS || "1500", 10);
const MAX_DELAY_MS = parseInt(process.env.SEARXNG_MAX_DELAY_MS || "12000", 10);
const SEARCH_TIMEOUT_MS = parseInt(
  process.env.SEARXNG_TIMEOUT_MS || "15000",
  10,
);

const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT_ENGINE_THRESHOLD = 4;

export interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
}

export interface SearXNGSearchMeta {
  resultCount: number;
  unresponsiveEngines: Array<[string, string]>;
  rateLimited: boolean;
}

export interface SearXNGSearchResponse {
  results: SearXNGResult[];
  meta: SearXNGSearchMeta;
}

interface SearXNGRawResponse {
  results: Array<SearXNGResult & Record<string, unknown>>;
  unresponsive_engines?: Array<[string, string]>;
}

export interface SearXNGSearchOptions {
  categories?: string;
  language?: string;
  engines?: string[];
  timeRange?: "day" | "week" | "month" | "year";
}

interface CacheEntry {
  response: SearXNGSearchResponse;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();

/**
 * Clears the in-memory SearXNG search cache.
 */
export function clearSearchCache(): void {
  searchCache.clear();
}

function getCacheKey(
  query: string,
  maxResults: number,
  options: SearXNGSearchOptions,
): string {
  return JSON.stringify({ query, maxResults, options });
}

function getCached(key: string): SearXNGSearchResponse | null {
  const entry = searchCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  return entry.response;
}

function setCache(key: string, response: SearXNGSearchResponse): void {
  searchCache.set(key, { response, timestamp: Date.now() });
}

function detectRateLimit(
  httpStatus: number | null,
  unresponsiveEngines: Array<[string, string]>,
  _resultCount: number,
): boolean {
  if (httpStatus === 429) return true;
  if (unresponsiveEngines.length >= RATE_LIMIT_ENGINE_THRESHOLD) return true;
  return false;
}

function computeBackoffDelay(attempt: number): number {
  const jitter = 0.5 + Math.random();
  const delay = BASE_DELAY_MS * Math.pow(2, attempt) * jitter;
  return Math.min(delay, MAX_DELAY_MS);
}

/**
 * Searches using SearXNG self-hosted meta search engine with rate limit
 * detection, exponential backoff, and in-memory caching.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *     options: Optional search parameters (categories, language, engines, timeRange).
 *
 * Returns:
 *     Search response with results array and metadata including rate limit status.
 */
export async function searxngSearch(
  query: string,
  maxResults: number = 5,
  options: SearXNGSearchOptions = {},
): Promise<SearXNGSearchResponse> {
  const cacheKey = getCacheKey(query, maxResults, options);
  const cached = getCached(cacheKey);
  if (cached) {
    log.info(`Cache hit for: ${query.slice(0, 60)}`);
    return cached;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = computeBackoffDelay(attempt - 1);
      log.warn(
        `Retry ${attempt}/${MAX_RETRIES} for: ${query.slice(0, 60)} (backoff ${Math.round(delay)}ms)`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const response = await executeSearch(query, maxResults, options);

      if (response.meta.rateLimited) {
        log.warn(
          `Rate limited on attempt ${attempt + 1}: ${response.meta.unresponsiveEngines.length} unresponsive engines`,
        );
        lastError = new Error("Rate limited by upstream engines");
        continue;
      }

      setCache(cacheKey, response);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      const isNetworkError =
        lastError.name === "AbortError" ||
        lastError.message.includes("fetch") ||
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("network");

      if (!isNetworkError && !lastError.message.includes("429")) {
        log.error(`Non-retryable error: ${lastError.message}`);
        break;
      }
    }
  }

  log.error(
    `Search failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
  return {
    results: [],
    meta: { resultCount: 0, unresponsiveEngines: [], rateLimited: true },
  };
}

async function executeSearch(
  query: string,
  maxResults: number,
  options: SearXNGSearchOptions,
): Promise<SearXNGSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    categories: options.categories ?? "general",
    language: options.language ?? "auto",
  });

  if (options.engines && options.engines.length > 0) {
    params.set("engines", options.engines.join(","));
  }

  if (options.timeRange) {
    params.set("time_range", options.timeRange);
  }

  const response = await fetch(`${SEARXNG_URL}/search?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (response.status === 429) {
    throw new Error("API error: 429 Too Many Requests");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: SearXNGRawResponse = await response.json();

  const unresponsiveEngines: Array<[string, string]> =
    Array.isArray(data.unresponsive_engines)
      ? data.unresponsive_engines
      : [];

  const results =
    data.results && Array.isArray(data.results)
      ? data.results
          .filter((r) => r.title && r.url)
          .slice(0, maxResults)
          .map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content || "",
            engine: r.engine as string | undefined,
          }))
      : [];

  const rateLimited = detectRateLimit(null, unresponsiveEngines, results.length);

  return {
    results,
    meta: {
      resultCount: results.length,
      unresponsiveEngines,
      rateLimited,
    },
  };
}
