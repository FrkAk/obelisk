export interface WebsiteContent {
  title: string | null;
  description: string | null;
  mainContent: string | null;
  error?: string;
}

const FETCH_TIMEOUT_MS = 5000;
const MAX_CONTENT_LENGTH = 500;

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
        "User-Agent": "Mozilla/5.0 (compatible; ObeliskBot/1.0)",
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

function parseHtml(html: string): WebsiteContent {
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const mainContent = extractMainContent(html);

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

function extractMainContent(html: string): string | null {
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

  return text.length > MAX_CONTENT_LENGTH
    ? text.slice(0, MAX_CONTENT_LENGTH) + "..."
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
