import { scrapeWebsite, type WebsiteContent } from "./scraper";

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

export interface WebSearchContext {
  query: string;
  results: WebSearchResult[];
  scrapedContent?: ScrapedContent[];
}

interface OllamaSearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

const OLLAMA_SEARCH_URL = "https://ollama.com/api/web_search";
const SEARCH_TIMEOUT_MS = 10000;
const MAX_SCRAPE_RESULTS = 2;

/**
 * Extracts city name from an address string.
 *
 * Args:
 *     address: Full address string (e.g., "Neuhauser Str. 2, 80331 Munich, Germany").
 *
 * Returns:
 *     City name if found, empty string otherwise.
 */
function extractCity(address?: string | null): string {
  if (!address) return "";

  const parts = address.split(",").map((p) => p.trim());

  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2];
    const cityWithoutPostal = cityPart.replace(/^\d{4,5}\s*/, "");
    return cityWithoutPostal.trim();
  }

  return "";
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

  const patterns: Record<string, string> = {
    food: `${name} ${location} restaurant reviews menu`,
    history: `${name} ${location} history facts significance`,
    art: `${name} ${location} museum gallery art collection`,
    architecture: `${name} ${location} architecture building history design`,
    nature: `${name} ${location} park nature trails things to do`,
    culture: `${name} ${location} cultural events performances`,
    views: `${name} ${location} viewpoint scenic best time visit`,
    hidden: `${name} ${location} local secret hidden gem`,
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
 * Performs web search using Ollama Cloud API.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *
 * Returns:
 *     Array of search results with title, URL, and snippet.
 */
export async function webSearch(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  const apiKey = process.env.OLLAMA_API_KEY;

  if (!apiKey) {
    console.log("[webSearch] OLLAMA_API_KEY not configured, skipping web search");
    return [];
  }

  try {
    const response = await fetch(OLLAMA_SEARCH_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.log(`[webSearch] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: OllamaSearchResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.log("[webSearch] No results in response");
      return [];
    }

    return data.results
      .filter((r) => r.title && r.url)
      .map((r) => ({
        title: r.title || "",
        url: r.url || "",
        snippet: r.content || "",
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log(`[webSearch] Request failed: ${message}`);
    return [];
  }
}

/**
 * Scrapes content from top search result URLs for deeper context.
 *
 * Args:
 *     results: Search results to scrape.
 *     limit: Maximum number of URLs to scrape.
 *
 * Returns:
 *     Array of scraped content from each URL.
 */
export async function scrapeTopResults(
  results: WebSearchResult[],
  limit: number = MAX_SCRAPE_RESULTS
): Promise<ScrapedContent[]> {
  const urlsToScrape = results.slice(0, limit);
  const scrapedContent: ScrapedContent[] = [];

  for (const result of urlsToScrape) {
    try {
      const content: WebsiteContent = await scrapeWebsite(result.url);

      if (!content.error && content.mainContent) {
        scrapedContent.push({
          url: result.url,
          title: content.title,
          content: content.mainContent,
        });
      }
    } catch (error) {
      console.log(`[webSearch] Failed to scrape ${result.url}`);
    }
  }

  return scrapedContent;
}

/**
 * Enriches POI data with web search results and optional scraped content.
 *
 * Args:
 *     poi: Object containing name, category, and optional address.
 *     scrapeResults: Whether to also scrape top result URLs.
 *
 * Returns:
 *     Web search context including query, results, and optional scraped content.
 */
export async function enrichPOIWithWebSearch(
  poi: {
    name: string;
    category: string;
    address?: string | null;
  },
  scrapeResults: boolean = true
): Promise<WebSearchContext> {
  const query = buildSearchQuery(poi);

  console.log(`[webSearch] Query: "${query}"`);

  const results = await webSearch(query);

  console.log(`[webSearch] Results: ${results.length}`);

  const context: WebSearchContext = {
    query,
    results,
  };

  if (scrapeResults && results.length > 0) {
    const scrapedContent = await scrapeTopResults(results);
    context.scrapedContent = scrapedContent;
    console.log(`[webSearch] Scraped: ${scrapedContent.length}`);
  }

  return context;
}
