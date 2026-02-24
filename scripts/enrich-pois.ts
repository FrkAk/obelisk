import { db } from "../src/lib/db/client";
import { pois, categories, contactInfo } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { isWithinRadius } from "../src/lib/geo/distance";
import { TRANSLATE_MODEL, checkOllamaHealth } from "../src/lib/ai/ollama";
import {
  gatherEnrichmentData,
  extractAndSaveProfile,
  hasRecentEnrichment,
  type EnrichInput,
  type GatheredData,
} from "../src/lib/enrichment/pipeline";
import { createLogger } from "../src/lib/logger";

const log = createLogger("enrich-pois");

const MUNICH_CENTER = { lat: 48.137154, lon: 11.576124 };
const ENRICH_RADIUS = parseInt(
  process.env.ENRICH_RADIUS || process.env.SEED_RADIUS || "5000",
  10,
);

const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "20", 10);
const INTER_BATCH_DELAY_MS = parseInt(
  process.env.ENRICH_INTER_BATCH_DELAY_MS || "8000",
  10,
);

interface EnrichmentSummary {
  total: number;
  web: number;
  fallback: number;
  wiki: number;
  rateLimited: number;
  noResults: number;
  extractEmpty: number;
  skipped: number;
  wikipediaHits: number;
}

/**
 * Adaptive throttle controller that adjusts delays based on rate limit signals.
 *
 * Increases delay exponentially on rate limit hits and gradually reduces it
 * on successful requests. Triggers a cooldown pause after consecutive rate
 * limit events.
 */
class ThrottleController {
  private baselineMs: number;
  private currentDelayMs: number;
  private maxDelayMs = 60000;
  private consecutiveRateLimits = 0;
  private cooldownThreshold = 3;
  private cooldownMs = 120000;

  constructor(baselineMs: number) {
    this.baselineMs = baselineMs;
    this.currentDelayMs = baselineMs;
  }

  /**
   * Reports a successful request, gradually reducing delay toward baseline.
   */
  reportSuccess(): void {
    this.consecutiveRateLimits = 0;
    this.currentDelayMs = Math.max(
      this.baselineMs,
      Math.floor(this.currentDelayMs * 0.75),
    );
  }

  /**
   * Reports a rate limit event, doubling the current delay (capped at 60s).
   */
  reportRateLimit(): void {
    this.consecutiveRateLimits++;
    this.currentDelayMs = Math.min(this.currentDelayMs * 2, this.maxDelayMs);
    log.warn(
      `Rate limit #${this.consecutiveRateLimits}, delay now ${this.currentDelayMs}ms`,
    );
  }

  /**
   * Checks whether a cooldown pause is needed after 3 consecutive rate limits.
   *
   * Returns:
   *     True if a 2-minute cooldown should be applied before continuing.
   */
  shouldCooldown(): boolean {
    return this.consecutiveRateLimits >= this.cooldownThreshold;
  }

  /**
   * Pauses execution for the cooldown period and resets the consecutive counter.
   */
  async applyCooldown(): Promise<void> {
    log.warn(
      `${this.consecutiveRateLimits} consecutive rate limits — cooling down for ${this.cooldownMs / 1000}s`,
    );
    await new Promise((r) => setTimeout(r, this.cooldownMs));
    this.consecutiveRateLimits = 0;
  }

  /**
   * Waits for the current adaptive delay between requests.
   */
  async wait(): Promise<void> {
    if (this.currentDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.currentDelayMs));
    }
  }
}

/**
 * Prints the end-of-run enrichment summary.
 *
 * Args:
 *     summary: Aggregated enrichment counts.
 */
function printSummary(summary: EnrichmentSummary): void {
  const enriched = summary.web + summary.fallback + summary.wiki;
  log.info("");
  log.info("--- Enrichment Summary ---");
  log.info(
    `Total: ${summary.total} | Enriched: ${enriched} (web: ${summary.web}, fallback: ${summary.fallback}, wiki-only: ${summary.wiki}) | Rate limited: ${summary.rateLimited} | No results: ${summary.noResults} | Empty: ${summary.extractEmpty} | Skipped: ${summary.skipped}`,
  );
  log.info(`Wikipedia hits: ${summary.wikipediaHits}/${summary.total}`);
}

async function main() {
  log.info("Starting POI enrichment pipeline...");

  const throttle = new ThrottleController(INTER_BATCH_DELAY_MS);

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c.slug]));

  const allPois = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      website: contactInfo.website,
      wikipediaUrl: pois.wikipediaUrl,
      locale: pois.locale,
      osmTags: pois.osmTags,
    })
    .from(pois)
    .leftJoin(contactInfo, eq(pois.id, contactInfo.poiId))
    .orderBy(pois.name);

  const poisToEnrich = allPois.filter((p) =>
    isWithinRadius(
      MUNICH_CENTER.lat,
      MUNICH_CENTER.lon,
      p.latitude,
      p.longitude,
      ENRICH_RADIUS,
    ),
  );

  log.info(
    `Found ${allPois.length} total POIs, ${poisToEnrich.length} within enrich radius (${ENRICH_RADIUS}m)`,
  );
  log.info(
    `Config: batchSize=${BATCH_SIZE}, interBatchDelay=${INTER_BATCH_DELAY_MS}ms (2-phase: translategemma then gemma3)`,
  );

  const hasNonEnglish = poisToEnrich.some((p) => !p.locale.startsWith("en"));
  if (hasNonEnglish) {
    const ok = await checkOllamaHealth(TRANSLATE_MODEL);
    if (!ok) {
      log.error(`Model ${TRANSLATE_MODEL} not loaded. Run: ollama pull ${TRANSLATE_MODEL}`);
      process.exit(1);
    }
    log.info(`Translation model ${TRANSLATE_MODEL} available`);
  }

  const summary: EnrichmentSummary = {
    total: poisToEnrich.length,
    web: 0,
    fallback: 0,
    wiki: 0,
    rateLimited: 0,
    noResults: 0,
    extractEmpty: 0,
    skipped: 0,
    wikipediaHits: 0,
  };

  let processed = 0;

  for (let i = 0; i < poisToEnrich.length; i += BATCH_SIZE) {
    const batch = poisToEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(poisToEnrich.length / BATCH_SIZE);

    if (throttle.shouldCooldown()) {
      await throttle.applyCooldown();
    }

    log.info(
      `Batch ${batchNum}/${totalBatches} (${batch.length} POIs)`,
    );

    log.info(`  Phase 1: Gathering data (translategemma)`);

    interface GatheredItem {
      input: EnrichInput;
      data: GatheredData;
    }

    const gatheredBatch: GatheredItem[] = [];
    const skippedInBatch: string[] = [];

    for (const poi of batch) {
      const categorySlug = poi.categoryId
        ? (categoryMap.get(poi.categoryId) ?? "hidden")
        : "hidden";

      if (await hasRecentEnrichment(poi.id, "enrich")) {
        skippedInBatch.push(poi.name);
        processed++;
        summary.skipped++;
        continue;
      }

      const enrichInput: EnrichInput = {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        categorySlug,
        websiteUrl: poi.website?.[0] ?? null,
        wikipediaUrl: poi.wikipediaUrl,
        locale: poi.locale,
        osmTags: poi.osmTags,
      };

      try {
        const data = await gatherEnrichmentData(enrichInput, {
          onSuccess: () => throttle.reportSuccess(),
          onRateLimit: () => throttle.reportRateLimit(),
        });
        gatheredBatch.push({ input: enrichInput, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        log.error(`${poi.name}: gather failed — ${message}`);
        processed++;
        summary.noResults++;
      }
    }

    if (skippedInBatch.length > 0) {
      log.info(`  Skipped ${skippedInBatch.length} recently enriched`);
    }

    if (gatheredBatch.length > 0) {
      log.info(`  Phase 2: Extracting ${gatheredBatch.length} profiles (gemma3)`);

      for (const { input, data } of gatheredBatch) {
        processed++;

        try {
          const result = await extractAndSaveProfile(input, data);

          if (result.hasWikipedia) summary.wikipediaHits++;

          switch (result.status) {
            case "success":
              summary.web++;
              log.success(
                `[${processed}/${poisToEnrich.length}] ${input.name} (+${result.fieldsUpdated.length} fields${result.confidenceScore !== null ? `, confidence: ${result.confidenceScore}%` : ""})`,
              );
              break;
            case "success_fb":
              summary.fallback++;
              log.success(
                `[${processed}/${poisToEnrich.length}] ${input.name} (+${result.fieldsUpdated.length} fields, fallback${result.confidenceScore !== null ? `, confidence: ${result.confidenceScore}%` : ""})`,
              );
              break;
            case "rate_limited":
              summary.rateLimited++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${input.name}: rate limited`,
              );
              break;
            case "no_results":
              summary.noResults++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${input.name}: no results`,
              );
              break;
            case "extract_empty":
              summary.extractEmpty++;
              log.warn(
                `[${processed}/${poisToEnrich.length}] ${input.name}: extraction empty`,
              );
              break;
            case "skipped":
              summary.skipped++;
              break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          log.error(`[${processed}/${poisToEnrich.length}] ${input.name}: extract failed — ${message}`);
          summary.noResults++;
        }
      }
    }

    if (i + BATCH_SIZE < poisToEnrich.length) {
      await throttle.wait();
    }
  }

  printSummary(summary);

  const failCount = summary.rateLimited + summary.noResults + summary.extractEmpty;
  process.exit(failCount > poisToEnrich.length / 2 ? 1 : 0);
}

main().catch((error) => {
  log.error("Enrichment pipeline failed:", error);
  process.exit(1);
});
