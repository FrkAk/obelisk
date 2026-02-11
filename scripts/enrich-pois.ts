import { db } from "../src/lib/db/client";
import {
  pois,
  categories,
  contactInfo,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  enrichmentLog,
} from "../src/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  buildEnrichmentQuery,
  getEnrichmentPasses,
  webSearch,
  scrapeTopResults,
} from "../src/lib/web/webSearch";
import { scrapeForEnrichment } from "../src/lib/web/scraper";
import { extractProfileByCategory } from "../src/lib/enrichment/extractors";
import { createLogger } from "../src/lib/logger";

const log = createLogger("enrich-pois");

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;
const MAX_SCRAPE_PER_PASS = 2;

// ---------------------------------------------------------------------------
// Profile table mapping
// ---------------------------------------------------------------------------

type ProfileTable =
  | typeof foodProfiles
  | typeof historyProfiles
  | typeof architectureProfiles
  | typeof natureProfiles
  | typeof artCultureProfiles
  | typeof nightlifeProfiles
  | typeof shoppingProfiles
  | typeof viewpointProfiles;

function getProfileTable(categorySlug: string): ProfileTable | null {
  const map: Record<string, ProfileTable> = {
    food: foodProfiles,
    history: historyProfiles,
    architecture: architectureProfiles,
    nature: natureProfiles,
    art: artCultureProfiles,
    culture: artCultureProfiles,
    nightlife: nightlifeProfiles,
    shopping: shoppingProfiles,
    views: viewpointProfiles,
  };
  return map[categorySlug] ?? null;
}

// ---------------------------------------------------------------------------
// Snake_case to camelCase mapping for profile fields
// ---------------------------------------------------------------------------

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function mapExtractedToProfileFields(
  extracted: Record<string, unknown>,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extracted)) {
    mapped[snakeToCamel(key)] = value;
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Enrichment log helpers
// ---------------------------------------------------------------------------

async function hasRecentEnrichment(
  poiId: string,
  source: string,
  hoursAgo: number = 24,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const rows = await db
    .select({ id: enrichmentLog.id })
    .from(enrichmentLog)
    .where(
      and(
        eq(enrichmentLog.poiId, poiId),
        eq(enrichmentLog.source, source),
        sql`${enrichmentLog.createdAt} > ${cutoff.toISOString()}`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function logEnrichment(
  poiId: string,
  source: string,
  status: string,
  fieldsUpdated: string[],
  metadata: Record<string, unknown>,
): Promise<void> {
  await db.insert(enrichmentLog).values({
    poiId,
    source,
    status,
    fieldsUpdated,
    metadata,
  });
}

// ---------------------------------------------------------------------------
// Extract city from address
// ---------------------------------------------------------------------------

function extractCity(address?: string | null): string {
  if (!address) return "Munich";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2];
    return cityPart.replace(/^\d{4,5}\s*/, "").trim() || "Munich";
  }
  return "Munich";
}

// ---------------------------------------------------------------------------
// Build update set that only fills NULL columns
// ---------------------------------------------------------------------------

async function buildNullOnlyUpdate(
  profileTable: ProfileTable,
  poiId: string,
  extracted: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existingRows = await db
    .select()
    .from(profileTable)
    .where(eq(profileTable.poiId, poiId))
    .limit(1);

  if (existingRows.length === 0) {
    return extracted;
  }

  const existing = existingRows[0] as Record<string, unknown>;
  const update: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(extracted)) {
    if (key === "poiId") continue;
    if (existing[key] === null || existing[key] === undefined) {
      update[key] = value;
    }
  }

  return update;
}

// ---------------------------------------------------------------------------
// Main enrichment for a single POI
// ---------------------------------------------------------------------------

async function enrichSinglePoi(
  poi: {
    id: string;
    name: string;
    address: string | null;
    categorySlug: string;
    website: string[] | null;
  },
): Promise<{ fieldsUpdated: string[]; status: string }> {
  const { id, name, address, categorySlug, website } = poi;
  const city = extractCity(address);
  const profileTable = getProfileTable(categorySlug);

  if (!profileTable) {
    return { fieldsUpdated: [], status: "skipped" };
  }

  let allScrapedText = "";
  const sources: Array<{ url: string; title: string | null; pass: string }> = [];
  const primaryWebsite = website?.[0] ?? null;

  if (primaryWebsite && !(await hasRecentEnrichment(id, "web_scrape"))) {
    try {
      const content = await scrapeForEnrichment(primaryWebsite);
      if (!content.error && content.mainContent) {
        allScrapedText += `\n--- ${name} Official Website ---\n${content.mainContent}\n`;
        sources.push({ url: primaryWebsite, title: content.title, pass: "website" });
      }
    } catch {
      log.warn(`Failed to scrape website for ${name}`);
    }
  }

  const passes = getEnrichmentPasses(categorySlug);

  for (const pass of passes) {
    if (await hasRecentEnrichment(id, `web_search_${pass}`)) {
      continue;
    }

    const query = buildEnrichmentQuery(name, city, categorySlug, pass);
    const results = await webSearch(query, 3);

    if (results.length > 0) {
      const scraped = await scrapeTopResults(results, MAX_SCRAPE_PER_PASS);
      for (const s of scraped) {
        if (s.content) {
          allScrapedText += `\n--- ${s.title || s.url} ---\n${s.content}\n`;
          sources.push({ url: s.url, title: s.title, pass });
        }
      }
    }

    if (results.length > 0 && allScrapedText.length === 0) {
      allScrapedText += results
        .map((r) => `${r.title}: ${r.snippet}`)
        .join("\n");
    }
  }

  if (!allScrapedText.trim()) {
    await logEnrichment(id, "web_search", "failed", [], {
      reason: "no_content_scraped",
      passes,
    });
    return { fieldsUpdated: [], status: "failed" };
  }

  const extracted = await extractProfileByCategory(
    categorySlug,
    allScrapedText,
    name,
  );

  if (!extracted || Object.keys(extracted).length === 0) {
    await logEnrichment(id, "llm_enrich", "failed", [], {
      reason: "extraction_empty",
      textLength: allScrapedText.length,
    });
    return { fieldsUpdated: [], status: "failed" };
  }

  const camelCased = mapExtractedToProfileFields(extracted);

  const signatureDishes =
    "signatureDishes" in camelCased
      ? (camelCased.signatureDishes as string[])
      : undefined;
  const musicGenres =
    "musicGenres" in camelCased
      ? (camelCased.musicGenres as string[])
      : undefined;
  delete camelCased.signatureDishes;
  delete camelCased.musicGenres;

  const updateSet = await buildNullOnlyUpdate(profileTable, id, camelCased);

  const fieldsUpdated: string[] = Object.keys(updateSet);

  if (fieldsUpdated.length > 0) {
    const existingRows = await db
      .select()
      .from(profileTable)
      .where(eq(profileTable.poiId, id))
      .limit(1);

    if (existingRows.length === 0) {
      await db.insert(profileTable).values({
        poiId: id,
        ...updateSet,
      } as typeof profileTable.$inferInsert);
    } else {
      await db
        .update(profileTable)
        .set(updateSet as Partial<typeof profileTable.$inferInsert>)
        .where(eq(profileTable.poiId, id));
    }
  }

  const allFieldsUpdated = [
    ...fieldsUpdated.map((f) => `${categorySlug}_profiles.${f}`),
  ];

  if (signatureDishes && signatureDishes.length > 0) {
    allFieldsUpdated.push("signature_dishes_noted");
  }
  if (musicGenres && musicGenres.length > 0) {
    allFieldsUpdated.push("music_genres_noted");
  }

  await logEnrichment(id, "llm_enrich", "success", allFieldsUpdated, {
    sources: sources.map((s) => ({ url: s.url, pass: s.pass })),
    extractedFields: Object.keys(extracted),
  });

  return { fieldsUpdated: allFieldsUpdated, status: "success" };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log.info("Starting POI enrichment pipeline...");

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.slug]));

  const poisToEnrich = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      website: contactInfo.website,
    })
    .from(pois)
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .orderBy(pois.name);

  log.info(`Found ${poisToEnrich.length} POIs to process`);

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < poisToEnrich.length; i += BATCH_SIZE) {
    const batch = poisToEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(poisToEnrich.length / BATCH_SIZE);

    log.info(`Batch ${batchNum}/${totalBatches}`);

    for (const poi of batch) {
      const categorySlug = poi.categoryId
        ? (categoryMap.get(poi.categoryId) ?? "hidden")
        : "hidden";

      if (await hasRecentEnrichment(poi.id, "llm_enrich")) {
        skipped++;
        continue;
      }

      try {
        const result = await enrichSinglePoi({
          id: poi.id,
          name: poi.name,
          address: poi.address,
          categorySlug,
          website: poi.website,
        });

        if (result.status === "success") {
          enriched++;
          log.success(
            `[${enriched + failed + skipped}/${poisToEnrich.length}] ${poi.name} (+${result.fieldsUpdated.length} fields)`,
          );
        } else if (result.status === "skipped") {
          skipped++;
        } else {
          failed++;
          log.warn(
            `[${enriched + failed + skipped}/${poisToEnrich.length}] ${poi.name}: no data extracted`,
          );
        }
      } catch (error) {
        failed++;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        log.error(
          `[${enriched + failed + skipped}/${poisToEnrich.length}] ${poi.name}: ${message}`,
        );
      }
    }

    if (i + BATCH_SIZE < poisToEnrich.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  log.info("");
  log.info(
    `Enrichment complete: ${enriched} enriched, ${failed} failed, ${skipped} skipped`,
  );
  process.exit(failed > poisToEnrich.length / 2 ? 1 : 0);
}

main().catch((error) => {
  log.error("Enrichment pipeline failed:", error);
  process.exit(1);
});
