import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { checkOllamaHealth } from "../src/lib/ai/ollama";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import {
  enrichPoi,
  loadTaxonomyMaps,
  loadCategoryMap,
  type TagEntry,
  type BrandEntry,
  type EnrichResult,
  type EnrichPoiRow,
} from "../src/lib/poi/enrichment";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("enrich-taxonomy");

const BATCH_SIZE = parseInt(process.env.ENRICH_BATCH_SIZE || "50", 10);
const CONCURRENCY = parseInt(process.env.ENRICH_CONCURRENCY || "4", 10);
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:9b";
const FORCE = process.argv.includes("--force");
const COORDINATOR_URL = process.env.ENRICH_COORDINATOR_URL || "";

/**
 * Writes enrichment results to the database.
 *
 * @param results - Array of enrichment results from a batch.
 * @returns Count of enriched, failed, and skipped.
 */
async function persistResults(results: EnrichResult[]): Promise<{ enriched: number; failed: number; skipped: number }> {
  const toUpdate = results.filter(
    (r): r is EnrichResult & { status: "enriched"; profile: PoiProfile } =>
      r.status === "enriched" && r.profile !== undefined,
  );

  if (toUpdate.length > 0) {
    await db.transaction(async (tx) => {
      for (const item of toUpdate) {
        await tx
          .update(pois)
          .set({
            profile: item.profile,
            embedding: null,
            updatedAt: sql`now()`,
          })
          .where(eq(pois.id, item.poiId));
      }
    });
  }

  let enriched = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of results) {
    if (r.status === "enriched") enriched++;
    else if (r.status === "failed") failed++;
    else skipped++;
  }
  return { enriched, failed, skipped };
}

/**
 * Fetches POI rows by their IDs from the database.
 *
 * @param ids - Array of POI IDs to fetch.
 * @returns Array of POI rows.
 */
async function fetchPoisByIds(ids: string[]): Promise<EnrichPoiRow[]> {
  if (ids.length === 0) return [];
  return db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .where(inArray(pois.id, ids));
}

/**
 * Runs enrichment in pull mode, fetching batches from the coordinator.
 *
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 */
async function runPullMode(
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
): Promise<void> {
  const { hostname } = await import("os");
  const host = hostname();
  const regRes = await fetch(`${COORDINATOR_URL}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: host }),
  });
  const { workerId } = await regRes.json() as { workerId: string; config: { model: string; batchSize: number } };
  log.info(`Registered with coordinator as worker ${workerId} (${host})`);

  let totalEnriched = 0;
  let totalFailed = 0;
  let stopping = false;
  let currentBatchId: string | null = null;
  const startMs = Date.now();

  /**
   * Sends a disconnect message to the coordinator so inflight batches get requeued immediately.
   */
  async function disconnect(): Promise<void> {
    try {
      await fetch(`${COORDINATOR_URL}/disconnect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId, batchId: currentBatchId }),
      });
      log.info("Disconnected from coordinator, inflight batch requeued");
    } catch {
      log.warn("Failed to notify coordinator of disconnect");
    }
  }

  const heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch(`${COORDINATOR_URL}/heartbeat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json() as { ok: boolean; shutdown?: boolean };
      if (data.shutdown) {
        log.info("Coordinator is shutting down, finishing current batch...");
        stopping = true;
      }
    } catch {
      log.warn("Heartbeat failed");
    }
  }, 30_000);

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, async () => {
      if (stopping) {
        log.info("Force exiting...");
        process.exit(1);
      }
      log.info(`Received ${sig}, finishing current batch then exiting...`);
      stopping = true;
    });
  }

  try {
    while (!stopping) {
      const batchRes = await fetch(`${COORDINATOR_URL}/batch?workerId=${workerId}`);
      const batch = await batchRes.json() as { batchId: string | null; poiIds: string[]; done: boolean };

      if (batch.done) {
        log.info("All work complete, exiting.");
        break;
      }

      if (!batch.batchId || batch.poiIds.length === 0) {
        log.info("No batches available, waiting 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      currentBatchId = batch.batchId;
      const poiRows = await fetchPoisByIds(batch.poiIds);
      const results = await processWithConcurrency<EnrichPoiRow, EnrichResult>(
        poiRows,
        CONCURRENCY,
        (poi) => enrichPoi(poi, tagMap, brandMap, categoryMap, { force: FORCE, model: OLLAMA_MODEL }),
      );

      const stats = await persistResults(results);
      totalEnriched += stats.enriched;
      totalFailed += stats.failed;

      await fetch(`${COORDINATOR_URL}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workerId,
          batchId: batch.batchId,
          results: results.map((r) => ({ poiId: r.poiId, status: r.status })),
        }),
      });
      currentBatchId = null;

      const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
      log.info(`Batch ${batch.batchId} done — ${stats.enriched} enriched, ${stats.failed} failed (total: ${totalEnriched} enriched, ${totalFailed} failed, ${elapsed}s elapsed)`);
    }
  } finally {
    clearInterval(heartbeatInterval);
    if (stopping && currentBatchId) {
      await disconnect();
    }
  }

  log.info("");
  log.info("--- Enrichment Summary (pull mode) ---");
  log.info(`Enriched: ${totalEnriched} | Failed: ${totalFailed}`);
  process.exit(totalFailed > totalEnriched ? 1 : 0);
}

/**
 * Runs the taxonomy enrichment pipeline in standalone mode: loads taxonomy maps,
 * iterates through unenriched POIs, merges keywords/products, generates LLM
 * summaries, and updates the database.
 *
 * @param tagMap - Tag enrichment map.
 * @param brandMap - Brand enrichment map.
 * @param categoryMap - Category ID to slug mapping.
 */
async function runStandaloneMode(
  tagMap: Record<string, TagEntry>,
  brandMap: Record<string, BrandEntry>,
  categoryMap: Map<string, string>,
): Promise<void> {
  const allPois: EnrichPoiRow[] = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .orderBy(pois.name);

  const toEnrich = FORCE
    ? allPois
    : allPois.filter((p: EnrichPoiRow) => !p.profile?.summary);

  log.info(`Found ${allPois.length} total POIs, ${toEnrich.length} need enrichment`);

  let enriched = 0;
  let skipped = 0;
  let failed = 0;
  const startMs = Date.now();

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);

    const results = await processWithConcurrency<EnrichPoiRow, EnrichResult>(
      batch,
      CONCURRENCY,
      (poi) => enrichPoi(poi, tagMap, brandMap, categoryMap),
    );

    const stats = await persistResults(results);
    enriched += stats.enriched;
    failed += stats.failed;
    skipped += stats.skipped;

    const done = Math.min(i + BATCH_SIZE, toEnrich.length);
    log.info(`${formatEta(startMs, done, toEnrich.length)} — ${stats.enriched} enriched, ${stats.failed} failed`);
  }

  log.info("");
  log.info("--- Enrichment Summary ---");
  log.info(`Total: ${toEnrich.length} | Enriched: ${enriched} | Failed: ${failed} | Skipped: ${skipped}`);

  process.exit(failed > toEnrich.length / 2 ? 1 : 0);
}

/**
 * Entry point: checks Ollama health, loads taxonomy data, and dispatches
 * to pull mode (coordinator) or standalone mode.
 */
async function main() {
  log.info("Starting taxonomy enrichment pipeline...");
  log.info(`Config: concurrency=${CONCURRENCY}, model=${OLLAMA_MODEL}, force=${FORCE}, mode=${COORDINATOR_URL ? "pull" : "standalone"}`);

  const ok = await checkOllamaHealth(OLLAMA_MODEL);
  if (!ok) {
    log.error(`Model ${OLLAMA_MODEL} not loaded. Run: ollama pull ${OLLAMA_MODEL}`);
    process.exit(1);
  }

  log.info("Loading taxonomy data...");
  const { tagMap, brandMap } = loadTaxonomyMaps();
  log.info(`Loaded ${Object.keys(tagMap).length} tag entries, ${Object.keys(brandMap).length} brand entries`);

  const categoryMap = await loadCategoryMap();

  if (COORDINATOR_URL) {
    await runPullMode(tagMap, brandMap, categoryMap);
  } else {
    await runStandaloneMode(tagMap, brandMap, categoryMap);
  }
}

main().catch((error) => {
  log.error("Taxonomy enrichment failed:", error);
  process.exit(1);
});
