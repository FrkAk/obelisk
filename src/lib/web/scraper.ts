export interface WebsiteContent {
  title: string | null;
  description: string | null;
  mainContent: string | null;
  error?: string;
}

export interface ScrapeOptions {
  maxContentLength?: number;
  timeoutMs?: number;
}

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 5000;
const MAX_CONTENT_LENGTH = 500;
const MENU_CONTENT_LENGTH = 8000;

/**
 * Scrapes basic content from a website URL.
 *
 * Args:
 *     url: The URL to scrape.
 *
 * Returns:
 *     Extracted content including title, description, and main text.
 */
export async function scrapeWebsite(url: string): Promise<WebsiteContent> {
  try {
    const normalizedUrl = normalizeUrl(url);

    const response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return {
        title: null,
        description: null,
        mainContent: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    return parseHtml(html);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      title: null,
      description: null,
      mainContent: null,
      error: errorMessage,
    };
  }
}

function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

function parseHtml(html: string, maxLen?: number): WebsiteContent {
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const mainContent = extractMainContent(html, maxLen);

  return {
    title,
    description,
    mainContent,
  };
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? cleanText(match[1]) : null;
}

function extractMetaDescription(html: string): string | null {
  const match = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );
  if (match) return cleanText(match[1]);

  const matchAlt = html.match(
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i
  );
  if (matchAlt) return cleanText(matchAlt[1]);

  const ogMatch = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );
  return ogMatch ? cleanText(ogMatch[1]) : null;
}

function extractMainContent(html: string, maxLen: number = MAX_CONTENT_LENGTH): string | null {
  let content = html;
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  content = content.replace(/<!--[\s\S]*?-->/g, "");

  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const targetContent = mainMatch?.[1] || articleMatch?.[1] || bodyMatch?.[1] || content;

  const text = targetContent
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length < 20) return null;

  return text.length > maxLen
    ? text.slice(0, maxLen) + "..."
    : text;
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scrapes a website with configurable content length limit.
 * Use for menu pages or other content-heavy pages that need more text.
 *
 * Args:
 *     url: The URL to scrape.
 *     options: Scrape options with maxContentLength and timeoutMs.
 *
 * Returns:
 *     Extracted content including title, description, and main text.
 */
export async function scrapeWithOptions(
  url: string,
  options: ScrapeOptions = {},
): Promise<WebsiteContent> {
  const maxLen = options.maxContentLength ?? MAX_CONTENT_LENGTH;
  const timeout = options.timeoutMs ?? FETCH_TIMEOUT_MS;

  try {
    const normalizedUrl = normalizeUrl(url);
    const response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(timeout),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return {
        title: null,
        description: null,
        mainContent: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    return parseHtml(html, maxLen);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      title: null,
      description: null,
      mainContent: null,
      error: errorMessage,
    };
  }
}

/**
 * Scrapes a menu page with extended content length.
 *
 * Args:
 *     url: The menu page URL to scrape.
 *
 * Returns:
 *     Extracted content with up to 8000 characters of main text.
 */
export async function scrapeMenuPage(url: string): Promise<WebsiteContent> {
  return scrapeWithOptions(url, {
    maxContentLength: MENU_CONTENT_LENGTH,
    timeoutMs: 8000,
  });
}

/**
 * Scrapes a page with extended content length for enrichment purposes.
 *
 * Args:
 *     url: The URL to scrape.
 *
 * Returns:
 *     Extracted content with up to 4000 characters of main text.
 */
export async function scrapeForEnrichment(url: string): Promise<WebsiteContent> {
  return scrapeWithOptions(url, {
    maxContentLength: 4000,
    timeoutMs: 8000,
  });
}
