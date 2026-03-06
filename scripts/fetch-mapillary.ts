import { db } from "../src/lib/db/client";
import { pois } from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import { findBestMapillaryImage } from "../src/lib/media/mapillary";
import type { MapillaryResult } from "../src/lib/media/mapillary";
import { createEmptyProfile } from "../src/lib/poi/enrichment";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("fetch-mapillary");

const BATCH_SIZE = 50;
const CONCURRENCY = 5;
const FORCE = process.argv.includes("--force");
const RATE_LIMIT_COOLDOWN_MS = 1_000;

const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;

interface PoiRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  mapillaryId: string | null;
  profile: PoiProfile | null;
}

type FetchResult =
  | {
      status: "fetched";
      poiId: string;
      mapillaryId: string;
      bearing: number;
      isPano: boolean;
      thumbUrl: string;
    }
  | { status: "no_image"; poiId: string }
  | { status: "skipped"; poiId: string }
  | { status: "failed"; poiId: string };

/**
 * Queries the Mapillary API for images near a POI and selects the best one.
 *
 * @param poi - POI row with coordinates.
 * @returns Fetch result with best image data, or no_image/failed status.
 */
async function fetchMapillaryImage(poi: PoiRow): Promise<FetchResult> {
  if (!FORCE && poi.mapillaryId) {
    return { status: "skipped", poiId: poi.id };
  }

  try {
    const result: MapillaryResult | null = await findBestMapillaryImage(
      poi.latitude,
      poi.longitude,
      MAPILLARY_TOKEN!,
    );

    if (!result) {
      return { status: "no_image", poiId: poi.id };
    }

    return {
      status: "fetched",
      poiId: poi.id,
      mapillaryId: result.mapillaryId,
      bearing: result.bearing,
      isPano: result.isPano,
      thumbUrl: result.thumbUrl,
    };
  } catch {
    return { status: "failed", poiId: poi.id };
  }
}

/**
 * Fetches Mapillary street-level images for all POIs. Stores the best
 * image metadata in pois columns and thumbnail URL in profile.mapillaryThumbUrl.
 */
async function main() {
  if (!MAPILLARY_TOKEN) {
    log.error("MAPILLARY_ACCESS_TOKEN not set");
    process.exit(1);
  }

  log.info(`Starting Mapillary fetch (force=${FORCE})...`);

  const condition = FORCE
    ? sql`1=1`
    : sql`mapillary_id IS NULL`;

  const allPois: PoiRow[] = await db
    .select({
      id: pois.id,
      name: pois.name,
      latitude: pois.latitude,
      longitude: pois.longitude,
      mapillaryId: pois.mapillaryId,
      profile: pois.profile,
    })
    .from(pois)
    .where(condition);

  log.info(`Found ${allPois.length} POIs to process`);

  let fetched = 0;
  let noImage = 0;
  let skippedCount = 0;
  let failed = 0;
  const startMs = Date.now();

  for (let i = 0; i < allPois.length; i += BATCH_SIZE) {
    const batch = allPois.slice(i, i + BATCH_SIZE);

    const results = await processWithConcurrency<PoiRow, FetchResult>(
      batch,
      CONCURRENCY,
      fetchMapillaryImage,
    );

    const toUpdate = results.filter(
      (r): r is Extract<FetchResult, { status: "fetched" }> =>
        r.status === "fetched",
    );

    if (toUpdate.length > 0) {
      await db.transaction(async (tx) => {
        for (const item of toUpdate) {
          const poi = allPois.find((p) => p.id === item.poiId);
          const profile: PoiProfile = poi?.profile ?? createEmptyProfile();

          await tx
            .update(pois)
            .set({
              mapillaryId: item.mapillaryId,
              mapillaryBearing: item.bearing,
              mapillaryIsPano: item.isPano,
              profile: { ...profile, mapillaryThumbUrl: item.thumbUrl },
              updatedAt: sql`now()`,
            })
            .where(eq(pois.id, item.poiId));
        }
      });
    }

    for (const r of results) {
      if (r.status === "fetched") fetched++;
      else if (r.status === "no_image") noImage++;
      else if (r.status === "skipped") skippedCount++;
      else failed++;
    }

    const done = Math.min(i + BATCH_SIZE, allPois.length);
    log.info(
      `${formatEta(startMs, done, allPois.length)} — ${toUpdate.length} fetched this batch`,
    );

    if (i + BATCH_SIZE < allPois.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_COOLDOWN_MS));
    }
  }

  log.info("");
  log.info("--- Mapillary Fetch Summary ---");
  log.info(
    `Total: ${allPois.length} | Fetched: ${fetched} | No image: ${noImage} | Skipped: ${skippedCount} | Failed: ${failed}`,
  );

  process.exit(0);
}

main().catch((error) => {
  log.error("Mapillary fetch failed:", error);
  process.exit(1);
});
