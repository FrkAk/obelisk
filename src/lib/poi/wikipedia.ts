import { createLogger } from "@/lib/logger";
import { POI_USER_AGENT } from "@/lib/poi/enrichment";

const log = createLogger("wikipedia");

const TIMEOUT_MS = 10_000;
const MAX_EXTRACT_LENGTH = 500;
const RATE_LIMIT_COOLDOWN_MS = 5_000;
const RATE_LIMIT_MAX_RETRIES = 3;
const REQUEST_DELAY_MS = 200;
export const THUMB_WIDTH = 800;

/**
 * Parses a Wikipedia URL into language code and article title.
 *
 * @param url - Wikipedia URL like "https://de.wikipedia.org/wiki/Englischer_Garten_(München)".
 * @returns Language and title, or null if URL doesn't match expected format.
 */
export function parseWikipediaUrl(
  url: string,
): { lang: string; title: string } | null {
  const match = url.match(/^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/(.+)$/);
  if (!match) return null;
  return { lang: match[1], title: match[2] };
}

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration to sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a URL with retry on 429 rate limits.
 *
 * @param url - URL to fetch.
 * @returns Response object or null on failure.
 */
export async function fetchWithRetry(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < RATE_LIMIT_MAX_RETRIES; attempt++) {
    try {
      await sleep(REQUEST_DELAY_MS);
      const res = await fetch(url, {
        headers: { "User-Agent": POI_USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? Math.max(parseInt(retryAfter, 10) * 1000, 2_000)
          : RATE_LIMIT_COOLDOWN_MS;

        log.warn(
          `Rate limited (429), waiting ${waitMs}ms ` +
            `(attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`,
        );

        if (attempt === RATE_LIMIT_MAX_RETRIES - 1) return null;
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) return null;
      return res;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Rewrites a Wikimedia thumbnail URL to a specific width.
 *
 * @param thumbUrl - Thumbnail URL from the summary API.
 * @param width - Desired width in pixels.
 * @returns Resized thumbnail URL.
 */
function resizeThumbUrl(thumbUrl: string, width: number): string {
  return thumbUrl.replace(/\/\d+px-/, `/${width}px-`);
}

interface WikiSummary {
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
}

/**
 * Fetches extract + thumbnail from Wikipedia's summary API in a single call.
 *
 * @param lang - Wikipedia language code (e.g. "de", "en").
 * @param title - URL-encoded article title.
 * @returns Extract and thumbnail URL, both optional.
 */
export async function fetchWikipediaSummary(
  lang: string,
  title: string,
): Promise<{ extract: string | null; imageUrl: string | null }> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const res = await fetchWithRetry(url);
  if (!res) return { extract: null, imageUrl: null };

  const data = (await res.json()) as WikiSummary;
  const extract = data.extract?.slice(0, MAX_EXTRACT_LENGTH) ?? null;
  const imageUrl = data.thumbnail?.source
    ? resizeThumbUrl(data.thumbnail.source, THUMB_WIDTH)
    : null;
  return { extract, imageUrl };
}
