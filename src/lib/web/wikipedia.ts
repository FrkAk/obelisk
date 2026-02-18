import { createLogger } from "@/lib/logger";

const log = createLogger("wikipedia");

const TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 1;

const WIKIPEDIA_HOST_PATTERN = /^([a-z]{2,3})\.wikipedia\.org$/;

export interface WikipediaSummary {
  title: string;
  extract: string;
  description: string;
}

interface WikipediaApiResponse {
  title?: string;
  extract?: string;
  description?: string;
}

/**
 * Parses a Wikipedia URL into language code and article title.
 *
 * Args:
 *     url: Full Wikipedia URL (e.g. "https://en.wikipedia.org/wiki/Munich").
 *
 * Returns:
 *     Tuple of [language, title] or null if the URL is not a valid Wikipedia article URL.
 */
function parseWikipediaUrl(url: string): [string, string] | null {
  try {
    const parsed = new URL(url);
    const hostMatch = parsed.hostname.match(WIKIPEDIA_HOST_PATTERN);
    if (!hostMatch) return null;

    const lang = hostMatch[1];
    const pathPrefix = "/wiki/";

    if (!parsed.pathname.startsWith(pathPrefix)) return null;

    const rawTitle = parsed.pathname.slice(pathPrefix.length);
    if (!rawTitle) return null;

    const title = decodeURIComponent(rawTitle);
    return [lang, title];
  } catch {
    return null;
  }
}

/**
 * Fetches a summary for a Wikipedia article using the REST API.
 *
 * Args:
 *     url: Full Wikipedia URL (supports any language subdomain).
 *         Examples:
 *         - "https://en.wikipedia.org/wiki/Munich"
 *         - "https://de.wikipedia.org/wiki/M%C3%BCnchen"
 *
 * Returns:
 *     WikipediaSummary with title, extract, and description, or null on failure.
 */
export async function fetchWikipediaSummary(
  url: string,
): Promise<WikipediaSummary | null> {
  const parsed = parseWikipediaUrl(url);
  if (!parsed) {
    log.warn(`Invalid Wikipedia URL: ${url.slice(0, 100)}`);
    return null;
  }

  const [lang, title] = parsed;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        log.warn(`Retry ${attempt}/${MAX_RETRIES} for: ${title}`);
      }

      return await executeFetch(lang, title);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
    }
  }

  log.error(
    `Failed to fetch summary for "${title}" after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
  return null;
}

async function executeFetch(
  lang: string,
  title: string,
): Promise<WikipediaSummary> {
  const encodedTitle = encodeURIComponent(title);
  const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Obelisk/1.0 (contextual discovery platform)",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (response.status === 404) {
    log.warn(`Article not found: ${title} (${lang})`);
    throw new WikipediaNotFoundError(title);
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: WikipediaApiResponse = await response.json();

  const summary: WikipediaSummary = {
    title: data.title ?? title,
    extract: data.extract ?? "",
    description: data.description ?? "",
  };

  log.info(`Fetched summary for "${summary.title}" (${lang})`);
  return summary;
}

class WikipediaNotFoundError extends Error {
  constructor(title: string) {
    super(`Wikipedia article not found: ${title}`);
    this.name = "WikipediaNotFoundError";
  }
}
