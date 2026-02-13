import { createLogger } from "@/lib/logger";

const log = createLogger("searxng");

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const SEARCH_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 1;

export interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
}

interface SearXNGResponse {
  results: Array<SearXNGResult & Record<string, unknown>>;
}

export interface SearXNGSearchOptions {
  categories?: string;
  language?: string;
  engines?: string[];
  timeRange?: "day" | "week" | "month" | "year";
}

/**
 * Searches using SearXNG self-hosted meta search engine.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *     options: Optional search parameters (categories, language, engines, timeRange).
 *
 * Returns:
 *     Array of search results with title, URL, and content snippet.
 */
export async function searxngSearch(
  query: string,
  maxResults: number = 5,
  options: SearXNGSearchOptions = {},
): Promise<SearXNGResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        log.warn(`Retry ${attempt}/${MAX_RETRIES} for: ${query.slice(0, 60)}`);
      }

      return await executeSearch(query, maxResults, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
    }
  }

  log.error(`Search failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
  return [];
}

async function executeSearch(
  query: string,
  maxResults: number,
  options: SearXNGSearchOptions,
): Promise<SearXNGResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    categories: options.categories ?? "general",
    language: options.language ?? "en-DE",
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

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: SearXNGResponse = await response.json();

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results
    .filter((r) => r.title && r.url)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content || "",
      engine: r.engine as string | undefined,
    }));
}
