import { scrapeWebsite, scrapeWithOptions, type WebsiteContent } from "./scraper";
import { searxngSearch, type SearXNGSearchOptions } from "./searxng";
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

export interface WebSearchContext {
  query: string;
  results: WebSearchResult[];
  scrapedContent?: ScrapedContent[];
}

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

// ---------------------------------------------------------------------------
// Enrichment-specific search queries
// ---------------------------------------------------------------------------

export type EnrichmentPass = "general" | "reviews" | "menu" | "awards" | "history" | "architecture" | "nature" | "art" | "nightlife" | "shopping" | "viewpoint";

/**
 * Builds enrichment-specific search queries for a POI by category and pass type.
 *
 * Args:
 *     poiName: Name of the POI.
 *     city: City name for location context.
 *     categorySlug: The POI's category slug.
 *     pass: The specific enrichment pass to build a query for.
 *
 * Returns:
 *     Search query string optimized for the enrichment pass.
 */
export function buildEnrichmentQuery(
  poiName: string,
  city: string,
  categorySlug: string,
  pass: EnrichmentPass,
): string {
  const base = `${poiName} ${city}`.trim();

  const passQueries: Record<string, Record<string, string>> = {
    food: {
      general: `"${base}" restaurant review`,
      reviews: `"${base}" erfahrungen bewertung OR review`,
      menu: `"${base}" speisekarte OR menu`,
      awards: `"${base}" michelin bib gourmand OR "best restaurants Munich"`,
    },
    history: {
      general: `"${base}" history wikipedia`,
      history: `"${base}" Geschichte historische Bedeutung OR "historical significance"`,
      architecture: `"${base}" heritage Denkmalschutz OR UNESCO preservation`,
    },
    architecture: {
      general: `"${base}" architecture architect style Architektur`,
      architecture: `"${base}" interior tour highlights Rundgang`,
      history: `"${base}" construction history Baugeschichte wikipedia`,
    },
    nature: {
      general: `"${base}" trails activities visitors Natur`,
      nature: `"${base}" facilities playground amenities Ausstattung`,
      reviews: `"${base}" visitor guide Tipps`,
    },
    art: {
      general: `"${base}" exhibitions collection Ausstellung museum`,
      art: `"${base}" notable works Kunstwerke highlights`,
      reviews: `"${base}" tickets tours visit guide Besuch`,
    },
    culture: {
      general: `"${base}" cultural events Veranstaltungen program`,
      reviews: `"${base}" tickets tours Erlebnis experience`,
      art: `"${base}" notable performers Kuenstler history`,
    },
    nightlife: {
      general: `"${base}" reviews nightlife bar club`,
      nightlife: `"${base}" events DJ lineup Programm music`,
      reviews: `"${base}" drinks atmosphere Stimmung`,
    },
    shopping: {
      general: `"${base}" products reviews shop store Angebot`,
      shopping: `"${base}" brands specialties Sortiment`,
      reviews: `"${base}" shopping experience visitor tips`,
    },
    views: {
      general: `"${base}" viewpoint panorama photos Aussicht`,
      viewpoint: `"${base}" panorama visible landmarks Aussichtspunkt`,
      reviews: `"${base}" visitor experience tips photography`,
    },
  };

  const categoryQueries = passQueries[categorySlug];
  if (categoryQueries && categoryQueries[pass]) {
    return categoryQueries[pass];
  }
  if (categoryQueries?.general) {
    return categoryQueries.general;
  }
  return `${base} interesting facts information`;
}

/**
 * Returns the ordered list of enrichment passes for a given category.
 *
 * Args:
 *     categorySlug: The POI's category slug.
 *
 * Returns:
 *     Array of enrichment pass names to execute in order.
 */
export function getEnrichmentPasses(categorySlug: string): EnrichmentPass[] {
  const passMap: Record<string, EnrichmentPass[]> = {
    food: ["general", "reviews", "awards"],
    history: ["general", "history"],
    architecture: ["general", "architecture"],
    nature: ["general", "nature"],
    art: ["general", "art", "reviews"],
    culture: ["general", "reviews"],
    nightlife: ["general", "nightlife"],
    shopping: ["general", "shopping"],
    views: ["general", "viewpoint"],
  };
  return passMap[categorySlug] || ["general"];
}

/**
 * Performs web search using self-hosted SearXNG instance.
 *
 * Args:
 *     query: Search query string.
 *     maxResults: Maximum number of results to return.
 *     options: Optional SearXNG search parameters (engines, language, etc).
 *
 * Returns:
 *     Array of search results with title, URL, and snippet.
 */
export async function webSearch(
  query: string,
  maxResults: number = 5,
  options: SearXNGSearchOptions = {},
): Promise<WebSearchResult[]> {
  try {
    const results = await searxngSearch(query, maxResults, options);

    return results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error(`Search failed: ${message}`);
    return [];
  }
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

  log.info(`Query: "${query}"`);

  const results = await webSearch(query);

  log.info(`Results: ${results.length}`);

  const context: WebSearchContext = {
    query,
    results,
  };

  if (scrapeResults && results.length > 0) {
    const scrapedContent = await scrapeTopResults(results);
    context.scrapedContent = scrapedContent;
    log.info(`Scraped: ${scrapedContent.length}`);
  }

  return context;
}
