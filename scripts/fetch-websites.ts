import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import { crawlWebsite, normalizeUrl } from "../src/lib/poi/website";
import { createEmptyProfile } from "../src/lib/poi/enrichment";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("fetch-websites");

const BATCH_SIZE = 300;
const CONCURRENCY = 50;
const BATCH_COOLDOWN_MS = 2_000;
const FORCE = process.argv.includes("--force");

interface PoiRow {
  id: string;
  name: string;
  websiteUrl: string;
  profile: PoiProfile | null;
}

/**
 * Crawls POI websites and stores extracted text in profile.websiteText.
 * Nulls embedding to trigger re-generation.
 */
async function main() {
  log.info(`Starting website fetch (force=${FORCE})...`);

  const allPois: PoiRow[] = (
    await db
      .select({
        id: pois.id,
        name: pois.name,
        osmTags: pois.osmTags,
        profile: pois.profile,
      })
      .from(pois)
      .where(
        sql`osm_tags->>'website' IS NOT NULL
         OR osm_tags->>'contact:website' IS NOT NULL
         OR osm_tags->>'url' IS NOT NULL`,
      )
  ).map((row) => {
    const tags = row.osmTags as Record<string, string> | null;
    const websiteUrl = tags?.website ?? tags?.["contact:website"] ?? tags?.url ?? "";
    return {
      id: row.id,
      name: row.name,
      websiteUrl,
      profile: row.profile as PoiProfile | null,
    };
  });

  const toFetch = FORCE
    ? allPois
    : allPois.filter((p) => !p.profile?.websiteText);

  log.info(`Found ${allPois.length} POIs with website URLs, ${toFetch.length} need fetching`);

  let fetched = 0;
  let failed = 0;
  const startMs = Date.now();

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);

    const results = await processWithConcurrency(batch, CONCURRENCY, async (poi) => {
      const url = normalizeUrl(poi.websiteUrl);
      const text = await crawlWebsite(url);

      if (!text) {
        return { status: "failed" as const, poiId: poi.id };
      }

      const profile: PoiProfile = poi.profile ?? createEmptyProfile();

      return {
        status: "fetched" as const,
        poiId: poi.id,
        profile: { ...profile, websiteText: text },
      };
    });

    const toUpdate = results.filter((r) => r.status === "fetched" && r.profile != null) as Array<{
      status: "fetched";
      poiId: string;
      profile: PoiProfile;
    }>;

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

    for (const r of results) {
      if (r.status === "fetched") fetched++;
      else failed++;
    }

    const done = Math.min(i + BATCH_SIZE, toFetch.length);
    const batchFailed = batch.length - toUpdate.length;
    log.info(`${formatEta(startMs, done, toFetch.length)} — ${toUpdate.length} fetched, ${batchFailed} failed`);

    if (done < toFetch.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_COOLDOWN_MS));
    }
  }

  log.info("");
  log.info("--- Website Fetch Summary ---");
  log.info(`Total: ${toFetch.length} | Fetched: ${fetched} | Failed: ${failed}`);

  process.exit(0);
}

main().catch((error) => {
  log.error("Website fetch failed:", error);
  process.exit(1);
});
