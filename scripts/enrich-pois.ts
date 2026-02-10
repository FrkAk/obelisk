import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { categories } from "../src/lib/db/schema";
import { eq, isNull, sql } from "drizzle-orm";
import { buildSearchQuery } from "../src/lib/web/webSearch";
import { searxngSearch } from "../src/lib/web/searxng";
import { scrapeWebsite } from "../src/lib/web/scraper";
import { generateText } from "../src/lib/ai/ollama";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const MAX_SCRAPE_URLS = 3;

interface EnrichmentData {
  description: string | null;
  reviewSummary: string | null;
  attributes: Record<string, unknown>;
  webContext: Record<string, unknown>;
}

/**
 * Builds a category-specific LLM prompt for POI enrichment.
 *
 * Args:
 *     poi: POI data with name, category info, and scraped web content.
 *     scrapedText: Combined text from scraped web pages.
 *
 * Returns:
 *     Formatted prompt string for the LLM.
 */
function buildEnrichmentPrompt(
  poi: { name: string; categorySlug: string; address: string | null; osmCuisine: string | null },
  scrapedText: string
): string {
  const categoryHints: Record<string, string> = {
    food: "Focus on cuisine type, price range, atmosphere, and what dishes they are known for.",
    history: "Focus on historical era, significance, key events, and architectural details.",
    art: "Focus on collections, notable works, exhibitions, and visiting tips.",
    architecture: "Focus on architectural style, era, architect, and design significance.",
    nature: "Focus on landscape, wildlife, trails, and best seasons to visit.",
    culture: "Focus on performances, events, cultural significance, and community role.",
    views: "Focus on what can be seen, best times, photography tips, and accessibility.",
    hidden: "Focus on why this place is special, local knowledge, and unique features.",
    nightlife: "Focus on music, atmosphere, drink specialties, and crowd type.",
    shopping: "Focus on product types, price range, uniqueness, and specialties.",
    sports: "Focus on facilities, events, teams, and public access.",
    health: "Focus on specialties, services offered, and reputation.",
    transport: "Focus on connections, frequency, and historical significance.",
    education: "Focus on programs, reputation, notable alumni, and campus features.",
    services: "Focus on services offered and accessibility.",
  };

  const hint = categoryHints[poi.categorySlug] || "Describe what makes this place interesting.";

  return `You are a knowledgeable local guide for Munich, Germany. Based on the following web research about "${poi.name}"${poi.address ? ` at ${poi.address}` : ""}${poi.osmCuisine ? ` (cuisine: ${poi.osmCuisine})` : ""}, provide a structured summary.

${hint}

WEB RESEARCH:
${scrapedText || "No web research available."}

Respond ONLY in this exact format (one item per line, no extra text):
DESCRIPTION: A 2-3 sentence description of this place highlighting what makes it noteworthy.
REVIEW_SUMMARY: What visitors typically say about this place in 1-2 sentences.
PRICE_RANGE: one of: budget, moderate, upscale, luxury, free, unknown
ATMOSPHERE: comma-separated adjectives (e.g., cozy, lively, romantic, family-friendly)
SPECIALTIES: What this place is known for in 1 sentence.`;
}

/**
 * Parses the labeled text response from the LLM into structured data.
 *
 * Args:
 *     response: Raw LLM response text in labeled format.
 *
 * Returns:
 *     Structured enrichment data with description, review summary, and attributes.
 */
function parseEnrichmentResponse(response: string): EnrichmentData {
  const lines = response.split("\n").filter((l) => l.trim());
  const parsed: Record<string, string> = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(": ");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toUpperCase();
    const value = line.slice(colonIdx + 2).trim();
    if (key && value) {
      parsed[key] = value;
    }
  }

  const attributes: Record<string, unknown> = {};
  if (parsed.PRICE_RANGE && parsed.PRICE_RANGE !== "unknown") {
    attributes.priceRange = parsed.PRICE_RANGE;
  }
  if (parsed.ATMOSPHERE) {
    attributes.atmosphere = parsed.ATMOSPHERE.split(",").map((a) => a.trim()).filter(Boolean);
  }
  if (parsed.SPECIALTIES) {
    attributes.specialties = parsed.SPECIALTIES;
  }

  return {
    description: parsed.DESCRIPTION || null,
    reviewSummary: parsed.REVIEW_SUMMARY || null,
    attributes: Object.keys(attributes).length > 0 ? attributes : {},
    webContext: {},
  };
}

/**
 * Enriches a single POI with web search results and LLM-generated summary.
 *
 * Args:
 *     poi: POI record from the database.
 *     categorySlug: The category slug for context-aware enrichment.
 */
async function enrichSinglePoi(
  poi: { id: string; name: string; address: string | null; osmCuisine: string | null },
  categorySlug: string
): Promise<void> {
  const searchQuery = buildSearchQuery({
    name: poi.name,
    category: categorySlug,
    address: poi.address,
  });

  const searchResults = await searxngSearch(searchQuery, 5);

  let scrapedText = "";
  const webSources: Array<{ url: string; title: string | null }> = [];

  const urlsToScrape = searchResults.slice(0, MAX_SCRAPE_URLS);
  for (const result of urlsToScrape) {
    try {
      const content = await scrapeWebsite(result.url);
      if (!content.error && content.mainContent) {
        scrapedText += `\n--- ${result.title} ---\n${content.mainContent}\n`;
        webSources.push({ url: result.url, title: content.title });
      }
    } catch {
      continue;
    }
  }

  if (!scrapedText && searchResults.length > 0) {
    scrapedText = searchResults.map((r) => `${r.title}: ${r.content}`).join("\n");
  }

  const prompt = buildEnrichmentPrompt(
    { name: poi.name, categorySlug, address: poi.address, osmCuisine: poi.osmCuisine },
    scrapedText
  );

  const llmResponse = await generateText(prompt, undefined, { temperature: 0.3, num_predict: 512 });
  const enrichment = parseEnrichmentResponse(llmResponse);

  await db
    .update(pois)
    .set({
      description: enrichment.description,
      reviewSummary: enrichment.reviewSummary,
      attributes: enrichment.attributes,
      webContext: { sources: webSources, searchQuery },
      enrichedAt: new Date(),
    })
    .where(eq(pois.id, poi.id));
}

async function main() {
  console.log("Enriching POIs with web data and LLM summaries...");
  console.log("");

  const unenrichedPois = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      osmCuisine: pois.osmCuisine,
      categoryId: pois.categoryId,
    })
    .from(pois)
    .where(isNull(pois.enrichedAt));

  console.log(`Found ${unenrichedPois.length} POIs to enrich`);

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.slug]));

  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < unenrichedPois.length; i += BATCH_SIZE) {
    const batch = unenrichedPois.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(unenrichedPois.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches}:`);

    for (const poi of batch) {
      const categorySlug = poi.categoryId ? (categoryMap.get(poi.categoryId) || "hidden") : "hidden";
      try {
        await enrichSinglePoi(
          { id: poi.id, name: poi.name, address: poi.address, osmCuisine: poi.osmCuisine },
          categorySlug
        );
        enriched++;
        console.log(`  [${enriched + failed}/${unenrichedPois.length}] ${poi.name}`);
      } catch (error) {
        failed++;
        const message = error instanceof Error ? error.message : "Unknown error";
        console.log(`  [${enriched + failed}/${unenrichedPois.length}] FAILED ${poi.name}: ${message}`);
      }
    }

    if (i + BATCH_SIZE < unenrichedPois.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log("");
  console.log(`Enrichment complete: ${enriched} succeeded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Enrichment failed:", error);
  process.exit(1);
});
