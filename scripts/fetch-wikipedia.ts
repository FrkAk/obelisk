import { db } from "../src/lib/db/client";
import { pois, poiImages } from "../src/lib/db/schema";
import { eq, sql, or, isNotNull } from "drizzle-orm";
import { createLogger, formatEta } from "../src/lib/logger";
import { commonsCategoryToThumb } from "../src/lib/media/wikimedia";
import { parseWikipediaUrl, fetchWikipediaSummary, fetchWithRetry, THUMB_WIDTH } from "../src/lib/poi/wikipedia";
import { createEmptyProfile } from "../src/lib/poi/enrichment";
import type { PoiProfile } from "../src/types/api";

const log = createLogger("fetch-wikipedia");

const BATCH_SIZE = 50;
const FORCE = process.argv.includes("--force");

/**
 * Batch-fetches P18 image filenames from Wikidata for up to 50 entity IDs.
 * Uses a single API call instead of one per entity.
 *
 * @param ids - Wikidata entity IDs (e.g. ["Q270746", "Q12345"]).
 * @returns Map from entity ID to Commons filename.
 */
async function batchWikidataP18(
  ids: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (ids.length === 0) return result;

  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities` +
    `&ids=${ids.join("|")}&props=claims&format=json`;

  const res = await fetchWithRetry(url);
  if (!res) return result;

  const data = (await res.json()) as {
    entities: Record<
      string,
      {
        claims: Record<
          string,
          Array<{ mainsnak: { datavalue?: { value?: string } } }>
        >;
      }
    >;
  };

  for (const [id, entity] of Object.entries(data.entities)) {
    const filename = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (filename) result.set(id, filename);
  }

  return result;
}

/**
 * Batch-resolves Commons filenames to thumbnail URLs via a single API call.
 * Replaces individual commonsFileToThumb calls.
 *
 * @param filenames - Array of Commons filenames (without "File:" prefix).
 * @returns Map from filename to thumbnail URL.
 */
async function batchCommonsThumb(
  filenames: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (filenames.length === 0) return result;

  const titles = filenames
    .map((f) => `File:${decodeURIComponent(f.replace(/ /g, "_"))}`)
    .join("|");

  const url =
    `https://commons.wikimedia.org/w/api.php?action=query` +
    `&titles=${encodeURIComponent(titles)}` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${THUMB_WIDTH}&format=json`;

  const res = await fetchWithRetry(url);
  if (!res) return result;

  const data = (await res.json()) as {
    query: {
      pages: Record<
        string,
        { title?: string; imageinfo?: Array<{ thumburl?: string }> }
      >;
    };
  };

  for (const page of Object.values(data.query.pages)) {
    const thumbUrl = page.imageinfo?.[0]?.thumburl;
    if (page.title && thumbUrl) {
      const filename = page.title.replace(/^File:/, "");
      result.set(filename, thumbUrl);
    }
  }

  return result;
}

interface PoiRow {
  id: string;
  name: string;
  wikipediaUrl: string | null;
  osmTags: Record<string, string> | null;
  profile: PoiProfile | null;
}

/**
 * Persists profile + image updates in a single transaction.
 *
 * @param updates - Array of POI updates to persist.
 */
async function persistUpdates(
  updates: Array<{
    poiId: string;
    profile: PoiProfile;
    imageUrl: string | null;
    imageSource: string;
  }>,
): Promise<void> {
  if (updates.length === 0) return;

  await db.transaction(async (tx) => {
    for (const item of updates) {
      await tx
        .update(pois)
        .set({
          profile: item.profile,
          embedding: null,
          updatedAt: sql`now()`,
        })
        .where(eq(pois.id, item.poiId));

      if (item.imageUrl) {
        const existing = await tx
          .select({ id: poiImages.id })
          .from(poiImages)
          .where(
            sql`poi_id = ${item.poiId} AND source = ${item.imageSource}`,
          )
          .limit(1);

        if (existing.length === 0) {
          await tx.insert(poiImages).values({
            poiId: item.poiId,
            url: item.imageUrl,
            source: item.imageSource,
            sortOrder: 0,
          });
        }
      }
    }
  });
}

/**
 * Fetches Wikipedia extracts and wiki images for POIs using optimized batching.
 *
 * Phase 1: POIs with Wikipedia URL — single /page/summary call returns extract + image.
 * Phase 2: Remaining POIs — batch Wikidata/Commons API calls (50 IDs per request).
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

  log.info(
    `Found ${allPois.length} POIs with wiki data, ${toFetch.length} need fetching`,
  );

  if (toFetch.length === 0) {
    log.info("Nothing to fetch");
    process.exit(0);
  }

  if (FORCE) {
    const poiIds = toFetch.map((p) => p.id);
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

  let fetchedWiki = 0;
  let fetchedImage = 0;
  let skipped = 0;
  const startMs = Date.now();

  const withWikiUrl = toFetch.filter((p) => p.wikipediaUrl);
  const withoutWikiUrl = toFetch.filter((p) => !p.wikipediaUrl);

  // -- Phase 1: POIs with Wikipedia URLs (1 call each = extract + image) --
  log.info(
    `Phase 1: ${withWikiUrl.length} POIs with Wikipedia URLs (1 call each)`,
  );

  for (let i = 0; i < withWikiUrl.length; i += BATCH_SIZE) {
    const batch = withWikiUrl.slice(i, i + BATCH_SIZE);
    const updates: Array<{
      poiId: string;
      profile: PoiProfile;
      imageUrl: string | null;
      imageSource: string;
    }> = [];

    for (const poi of batch) {
      const profile: PoiProfile = poi.profile ?? createEmptyProfile();

      const parsed = parseWikipediaUrl(poi.wikipediaUrl!);
      if (!parsed) {
        log.warn(`${poi.name}: unparseable URL "${poi.wikipediaUrl}"`);
        skipped++;
        continue;
      }

      const { extract, imageUrl } = await fetchWikipediaSummary(
        parsed.lang,
        parsed.title,
      );

      let updated = false;

      if (extract && (FORCE || !profile.wikipediaSummary)) {
        profile.wikipediaSummary = extract;
        updated = true;
        fetchedWiki++;
      }

      if (imageUrl && (FORCE || !profile.wikiImageUrl)) {
        profile.wikiImageUrl = imageUrl;
        updated = true;
        fetchedImage++;
      }

      if (updated) {
        updates.push({
          poiId: poi.id,
          profile,
          imageUrl,
          imageSource: "commons",
        });
      } else {
        skipped++;
      }
    }

    await persistUpdates(updates);

    const done = Math.min(i + BATCH_SIZE, withWikiUrl.length);
    log.info(
      `Phase 1: ${formatEta(startMs, done, toFetch.length)} — ${updates.length} updated`,
    );
  }

  // -- Phase 2: POIs without Wikipedia URL (batch wikidata + commons) --
  if (withoutWikiUrl.length > 0) {
    log.info(
      `Phase 2: ${withoutWikiUrl.length} POIs with wikidata/commons only (batched)`,
    );
  }

  for (let i = 0; i < withoutWikiUrl.length; i += BATCH_SIZE) {
    const batch = withoutWikiUrl.slice(i, i + BATCH_SIZE);

    const wikidataEntries: Array<{ poi: PoiRow; wikidataId: string }> = [];
    const directFileEntries: Array<{ poi: PoiRow; filename: string }> = [];
    const categoryEntries: Array<{ poi: PoiRow; category: string }> = [];

    for (const poi of batch) {
      if (!FORCE && poi.profile?.wikiImageUrl) {
        skipped++;
        continue;
      }
      const osmTags = poi.osmTags ?? {};
      const commonsTag = osmTags["wikimedia_commons"];
      if (commonsTag) {
        if (commonsTag.startsWith("Category:")) {
          categoryEntries.push({
            poi,
            category: commonsTag.replace(/^Category:/, ""),
          });
        } else {
          directFileEntries.push({
            poi,
            filename: commonsTag.replace(/^File:/, ""),
          });
        }
      } else if (osmTags["wikidata"]) {
        wikidataEntries.push({ poi, wikidataId: osmTags["wikidata"] });
      } else {
        skipped++;
      }
    }

    // Batch wikidata → P18 filenames
    const wikidataP18 = await batchWikidataP18(
      wikidataEntries.map((w) => w.wikidataId),
    );

    // Collect all filenames for batch thumb resolution
    const allFilenames: string[] = [
      ...directFileEntries.map((e) => e.filename),
    ];
    for (const { wikidataId } of wikidataEntries) {
      const filename = wikidataP18.get(wikidataId);
      if (filename) allFilenames.push(filename);
    }

    // Batch resolve filenames → thumb URLs (1 API call)
    const thumbs = await batchCommonsThumb(allFilenames);

    // Categories need individual calls (can't batch category member listing)
    const categoryThumbs = new Map<string, string>();
    for (const { category } of categoryEntries) {
      const thumb = await commonsCategoryToThumb(category);
      if (thumb) categoryThumbs.set(category, thumb);
    }

    // Collect updates
    const updates: Array<{
      poiId: string;
      profile: PoiProfile;
      imageUrl: string | null;
      imageSource: string;
    }> = [];

    for (const { poi, wikidataId } of wikidataEntries) {
      const filename = wikidataP18.get(wikidataId);
      const thumbUrl = filename ? thumbs.get(filename) : undefined;
      if (!thumbUrl) {
        skipped++;
        continue;
      }
      const profile: PoiProfile = poi.profile ?? createEmptyProfile();
      profile.wikiImageUrl = thumbUrl;
      updates.push({
        poiId: poi.id,
        profile,
        imageUrl: thumbUrl,
        imageSource: "wikidata",
      });
      fetchedImage++;
    }

    for (const { poi, filename } of directFileEntries) {
      const thumbUrl = thumbs.get(filename);
      if (!thumbUrl) {
        skipped++;
        continue;
      }
      const profile: PoiProfile = poi.profile ?? createEmptyProfile();
      profile.wikiImageUrl = thumbUrl;
      updates.push({
        poiId: poi.id,
        profile,
        imageUrl: thumbUrl,
        imageSource: "commons",
      });
      fetchedImage++;
    }

    for (const { poi, category } of categoryEntries) {
      const thumbUrl = categoryThumbs.get(category);
      if (!thumbUrl) {
        skipped++;
        continue;
      }
      const profile: PoiProfile = poi.profile ?? createEmptyProfile();
      profile.wikiImageUrl = thumbUrl;
      updates.push({
        poiId: poi.id,
        profile,
        imageUrl: thumbUrl,
        imageSource: "commons",
      });
      fetchedImage++;
    }

    await persistUpdates(updates);

    const done =
      withWikiUrl.length +
      Math.min(i + BATCH_SIZE, withoutWikiUrl.length);
    log.info(
      `Phase 2: ${formatEta(startMs, done, toFetch.length)} — ${updates.length} updated`,
    );
  }

  log.info("");
  log.info("--- Wikipedia + Image Fetch Summary ---");
  log.info(
    `Total: ${toFetch.length} | Wiki: ${fetchedWiki} | Images: ${fetchedImage} | Skipped: ${skipped}`,
  );

  process.exit(0);
}

main().catch((error) => {
  log.error("Wikipedia fetch failed:", error);
  process.exit(1);
});
