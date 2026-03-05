import { db } from "../src/lib/db/client";
import { pois, poiImages } from "../src/lib/db/schema";
import { eq, sql, or, isNotNull } from "drizzle-orm";
import { processWithConcurrency } from "./lib/concurrency";
import { createLogger, formatEta } from "../src/lib/logger";
import { resolveWikiImage } from "../src/lib/media/wikimedia";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("fetch-wikipedia");

const BATCH_SIZE = 100;
const CONCURRENCY = 10;
const TIMEOUT_MS = 10_000;
const MAX_EXTRACT_LENGTH = 500;
const FORCE = process.argv.includes("--force");
const RATE_LIMIT_COOLDOWN_MS = 5_000;
const RATE_LIMIT_MAX_RETRIES = 3;

const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Parses a Wikipedia URL into language code and article title.
 *
 * @param url - Wikipedia URL like "https://de.wikipedia.org/wiki/Englischer_Garten_(München)".
 * @returns Language and title, or null if URL doesn't match expected format.
 */
function parseWikipediaUrl(url: string): { lang: string; title: string } | null {
  const match = url.match(/^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/(.+)$/);
  if (!match) return null;
  return { lang: match[1], title: match[2] };
}

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - Duration to sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches the plain-text extract from Wikipedia's REST API.
 * Retries with backoff on HTTP 429 (rate limit) responses.
 *
 * @param lang - Wikipedia language code (e.g. "de", "en").
 * @param title - URL-encoded article title.
 * @returns Extract text truncated to MAX_EXTRACT_LENGTH, or null on failure.
 */
async function fetchExtract(lang: string, title: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`;

  for (let attempt = 0; attempt <= RATE_LIMIT_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RATE_LIMIT_COOLDOWN_MS;

        log.warn(
          `Rate limited by Wikipedia (429). ` +
            `Retry-After: ${retryAfter ?? "none"}, waiting ${waitMs}ms ` +
            `(attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`
        );

        if (attempt === RATE_LIMIT_MAX_RETRIES) return null;
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) return null;
      const data = (await res.json()) as { extract?: string };
      if (!data.extract) return null;
      return data.extract.slice(0, MAX_EXTRACT_LENGTH);
    } catch {
      return null;
    }
  }

  return null;
}

interface PoiRow {
  id: string;
  name: string;
  wikipediaUrl: string | null;
  osmTags: Record<string, string> | null;
  profile: PoiProfile | null;
}

/**
 * Fetches Wikipedia extracts and wiki images for POIs. Stores extracts in
 * profile.wikipediaSummary, images in poi_images + profile.wikiImageUrl.
 * Nulls embedding to trigger re-generation.
 */
async function main() {
  log.info(`Starting Wikipedia + wiki image fetch (force=${FORCE})...`);

  const allPois: PoiRow[] = await db
    .select({
      id: pois.id,
      name: pois.name,
      wikipediaUrl: pois.wikipediaUrl,
      osmTags: pois.osmTags,
      profile: pois.profile,
    })
    .from(pois)
    .where(
      or(
        isNotNull(pois.wikipediaUrl),
        sql`osm_tags->>'wikidata' IS NOT NULL`,
        sql`osm_tags->>'wikimedia_commons' IS NOT NULL`,
      ),
    );

  const toFetch = FORCE
    ? allPois
    : allPois.filter(
        (p) => !p.profile?.wikipediaSummary || !p.profile?.wikiImageUrl,
      );

  log.info(`Found ${allPois.length} POIs with wiki data, ${toFetch.length} need fetching`);

  if (FORCE) {
    const poiIds = toFetch.map((p) => p.id);
    if (poiIds.length > 0) {
      for (let i = 0; i < poiIds.length; i += 500) {
        const chunk = poiIds.slice(i, i + 500);
        await db
          .delete(poiImages)
          .where(
            sql`poi_id IN (${sql.join(chunk.map((id) => sql`${id}`), sql`, `)}) AND source IN ('commons', 'wikidata')`,
          );
      }
      log.info(`Cleared existing wiki images for ${poiIds.length} POIs`);
    }
  }

  let fetchedWiki = 0;
  let fetchedImage = 0;
  let failed = 0;
  let skipped = 0;
  const startMs = Date.now();

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);

    const results = await processWithConcurrency(batch, CONCURRENCY, async (poi) => {
      const profile: PoiProfile = poi.profile ?? {
        keywords: [],
        products: [],
        summary: "",
        enrichmentSource: "seed",
        attributes: {},
      };

      let wikiUpdated = false;
      let imageUpdated = false;

      if (poi.wikipediaUrl && (FORCE || !profile.wikipediaSummary)) {
        const parsed = parseWikipediaUrl(poi.wikipediaUrl);
        if (parsed) {
          const extract = await fetchExtract(parsed.lang, parsed.title);
          if (extract) {
            profile.wikipediaSummary = extract;
            wikiUpdated = true;
          }
        } else {
          log.warn(`${poi.name}: unparseable URL "${poi.wikipediaUrl}"`);
        }
      }

      const osmTags = poi.osmTags ?? {};
      if (FORCE || !profile.wikiImageUrl) {
        const image = await resolveWikiImage(osmTags);
        if (image) {
          profile.wikiImageUrl = image.url;
          imageUpdated = true;

          const existing = await db
            .select({ id: poiImages.id })
            .from(poiImages)
            .where(
              sql`poi_id = ${poi.id} AND source = ${image.source}`,
            )
            .limit(1);

          if (existing.length === 0) {
            await db.insert(poiImages).values({
              poiId: poi.id,
              url: image.url,
              source: image.source,
              sortOrder: 0,
            });
          }
        }
      }

      if (!wikiUpdated && !imageUpdated) {
        return { status: "skipped" as const, poiId: poi.id };
      }

      return {
        status: "fetched" as const,
        poiId: poi.id,
        profile,
        wikiUpdated,
        imageUpdated,
      };
    });

    const toUpdate = results.filter(
      (r) => r.status === "fetched" && r.profile != null,
    ) as Array<{
      status: "fetched";
      poiId: string;
      profile: PoiProfile;
      wikiUpdated: boolean;
      imageUpdated: boolean;
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
      if (r.status === "fetched") {
        if (r.wikiUpdated) fetchedWiki++;
        if (r.imageUpdated) fetchedImage++;
      } else if (r.status === "skipped") {
        skipped++;
      } else {
        failed++;
      }
    }

    const done = Math.min(i + BATCH_SIZE, toFetch.length);
    log.info(`${formatEta(startMs, done, toFetch.length)} — ${toUpdate.length} updated this batch`);
  }

  log.info("");
  log.info("--- Wikipedia + Image Fetch Summary ---");
  log.info(`Total: ${toFetch.length} | Wiki: ${fetchedWiki} | Images: ${fetchedImage} | Failed: ${failed} | Skipped: ${skipped}`);

  process.exit(0);
}

main().catch((error) => {
  log.error("Wikipedia fetch failed:", error);
  process.exit(1);
});
