import { createLogger } from "@/lib/logger";

const log = createLogger("searxng");

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";
const SEARCH_TIMEOUT_MS = 10000;

export interface SearXNGResult {
  title: string;
  url: string;
  content: string;
}

interface SearXNGResponse {
  results: SearXNGResult[];
}

/**
 * Searches using SearXNG self-hosted meta search engine.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *
 * Returns:
 *     Array of search results with title, URL, and content snippet.
 */
export async function searxngSearch(query: string, maxResults: number = 5): Promise<SearXNGResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      categories: "general",
    });

    const response = await fetch(`${SEARXNG_URL}/search?${params.toString()}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      log.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: SearXNGResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      log.info("No results in response");
      return [];
    }

    return data.results
      .filter((r) => r.title && r.url)
      .slice(0, maxResults)
      .map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content || "",
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(`Search failed: ${message}`);
    return [];
  }
}
