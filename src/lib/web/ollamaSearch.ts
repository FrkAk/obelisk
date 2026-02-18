import { createLogger } from "@/lib/logger";
import type { SearXNGResult } from "@/lib/web/searxng";

const log = createLogger("ollama-search");

const OLLAMA_SEARCH_URL = "https://ollama.com/api/web_search";
const OLLAMA_FETCH_URL = "https://ollama.com/api/web_fetch";
const SEARCH_TIMEOUT_MS = 15000;
const FETCH_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 1;
const MAX_RESULTS_CAP = 10;

interface OllamaSearchResponse {
  results: Array<{ title: string; url: string; content: string }>;
}

interface OllamaFetchResponse {
  content: string;
}

/**
 * Builds authorization headers for the Ollama cloud API.
 *
 * Returns:
 *     Headers object with Bearer token and content type.
 *
 * Raises:
 *     Error: When OLLAMA_API_KEY environment variable is not set.
 */
function buildHeaders(): Record<string, string> {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    throw new Error("OLLAMA_API_KEY environment variable is not set");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Searches the web using the Ollama cloud search API.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return (capped at 10).
 *
 * Returns:
 *     Array of search results matching the SearXNGResult shape for interop.
 */
export async function ollamaWebSearch(
  query: string,
  maxResults: number = 5,
): Promise<SearXNGResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        log.warn(`Retry ${attempt}/${MAX_RETRIES} for: ${query.slice(0, 60)}`);
      }

      return await executeSearch(query, maxResults);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
    }
  }

  log.error(
    `Search failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
  return [];
}

async function executeSearch(
  query: string,
  maxResults: number,
): Promise<SearXNGResult[]> {
  const cappedResults = Math.min(maxResults, MAX_RESULTS_CAP);

  const response = await fetch(OLLAMA_SEARCH_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ query, max_results: cappedResults }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: OllamaSearchResponse = await response.json();

  if (!data.results || !Array.isArray(data.results)) {
    return [];
  }

  return data.results
    .filter((r) => r.title && r.url)
    .slice(0, cappedResults)
    .map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content || "",
      engine: "ollama" as const,
    }));
}

/**
 * Fetches and extracts content from a URL using the Ollama cloud fetch API.
 *
 * Args:
 *     url: The URL to fetch content from.
 *
 * Returns:
 *     Extracted text content as a string, or null on failure.
 */
export async function ollamaWebFetch(url: string): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        log.warn(
          `Fetch retry ${attempt}/${MAX_RETRIES} for: ${url.slice(0, 80)}`,
        );
      }

      return await executeFetch(url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
    }
  }

  log.error(
    `Fetch failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
  return null;
}

async function executeFetch(url: string): Promise<string> {
  const response = await fetch(OLLAMA_FETCH_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: OllamaFetchResponse = await response.json();

  if (!data.content) {
    throw new Error("Empty content in response");
  }

  return data.content;
}
