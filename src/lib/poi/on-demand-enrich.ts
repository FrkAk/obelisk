import { db } from "@/lib/db/client";
import { pois } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createLogger } from "@/lib/logger";
import { parseWikipediaUrl, fetchWikipediaSummary } from "@/lib/poi/wikipedia";
import { crawlWebsite, normalizeUrl } from "@/lib/poi/website";
import { createEmptyProfile, enrichPoi, loadTaxonomyMaps, loadCategoryMap } from "@/lib/poi/enrichment";
import { findBestMapillaryImage } from "@/lib/media/mapillary";
import { buildTypesenseDocument } from "@/lib/search/profileSummary";
import { upsertDocuments } from "@/lib/search/typesense";
import { buildEmbeddingText } from "@/lib/ai/embeddingBuilder";
import { embedTexts } from "@/lib/ai/embeddings";
import { loadTags } from "@/lib/db/queries/pois";
import type { PoiProfile, Poi } from "@/types/api";

const log = createLogger("on-demand-enrich");

const MAPILLARY_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;

/**
 * Enriches a POI on-demand when a user clicks it. Runs the full pipeline:
 * Wikipedia fetch, website crawl, Mapillary image, taxonomy merge, LLM summary.
 * Fire-and-forget updates Typesense and embeddings after enrichment.
 *
 * @param poiId - Database ID of the POI to enrich.
 * @returns Enriched profile, or null if enrichment failed.
 */
export async function enrichPoiOnDemand(poiId: string): Promise<PoiProfile | null> {
  const rows = await db
    .select({
      id: pois.id,
      name: pois.name,
      address: pois.address,
      categoryId: pois.categoryId,
      regionId: pois.regionId,
      osmTags: pois.osmTags,
      profile: pois.profile,
      wikipediaUrl: pois.wikipediaUrl,
      latitude: pois.latitude,
      longitude: pois.longitude,
      osmId: pois.osmId,
      locale: pois.locale,
      mapillaryId: pois.mapillaryId,
      mapillaryBearing: pois.mapillaryBearing,
      mapillaryIsPano: pois.mapillaryIsPano,
    })
    .from(pois)
    .where(eq(pois.id, poiId))
    .limit(1);

  if (rows.length === 0) return null;

  const poi = rows[0];
  const profile: PoiProfile = (poi.profile as PoiProfile | null) ?? createEmptyProfile();

  if (profile.enrichedAt) return profile;

  log.info(`Starting enrichment for "${poi.name}" (id: ${poi.id})`);
  const osmTags = (poi.osmTags as Record<string, string>) ?? {};

  let profileChanged = false;

  if (poi.wikipediaUrl && !profile.wikipediaSummary) {
    const parsed = parseWikipediaUrl(poi.wikipediaUrl);
    if (parsed) {
      const { extract, imageUrl } = await fetchWikipediaSummary(parsed.lang, parsed.title);
      if (extract) {
        profile.wikipediaSummary = extract;
        profileChanged = true;
        log.info(`Wikipedia: fetched extract (${extract.length} chars)${imageUrl ? " + image" : ""}`);
      }
      if (imageUrl && !profile.wikiImageUrl) {
        profile.wikiImageUrl = imageUrl;
        profileChanged = true;
      }
    } else {
      log.info(`Wikipedia: skipped (unparseable URL)`);
    }
  } else {
    log.info(`Wikipedia: skipped (${poi.wikipediaUrl ? "already has summary" : "no URL"})`);
  }

  const websiteUrl = osmTags.website ?? osmTags["contact:website"] ?? osmTags.url;
  if (websiteUrl && !profile.websiteText) {
    const text = await crawlWebsite(normalizeUrl(websiteUrl));
    if (text) {
      profile.websiteText = text;
      profileChanged = true;
      log.info(`Website: crawled ${normalizeUrl(websiteUrl)} (${text.length} chars)`);
    } else {
      log.info(`Website: failed to crawl ${normalizeUrl(websiteUrl)}`);
    }
  } else {
    log.info(`Website: skipped (${websiteUrl ? "already has text" : "no URL"})`);
  }

  if (!profile.mapillaryThumbUrl && MAPILLARY_TOKEN) {
    try {
      const result = await findBestMapillaryImage(poi.latitude, poi.longitude, MAPILLARY_TOKEN);
      if (result) {
        profile.mapillaryThumbUrl = result.thumbUrl;
        profileChanged = true;

        await db
          .update(pois)
          .set({
            mapillaryId: result.mapillaryId,
            mapillaryBearing: result.bearing,
            mapillaryIsPano: result.isPano,
          })
          .where(eq(pois.id, poiId));

        log.info(`Mapillary: found image (id: ${result.mapillaryId}, pano: ${result.isPano})`);
      } else {
        log.info(`Mapillary: no image found nearby`);
      }
    } catch (err) {
      log.warn(`Mapillary: fetch failed — ${err instanceof Error ? err.message : err}`);
    }
  } else {
    log.info(`Mapillary: skipped (${profile.mapillaryThumbUrl ? "already has image" : "no token configured"})`);
  }

  if (profileChanged) {
    await db
      .update(pois)
      .set({ profile, embedding: null, updatedAt: sql`now()` })
      .where(eq(pois.id, poiId));
  }

  const { tagMap, brandMap } = loadTaxonomyMaps();
  const categoryMap = await loadCategoryMap();

  const result = await enrichPoi(
    {
      id: poi.id,
      name: poi.name,
      address: poi.address,
      categoryId: poi.categoryId,
      osmTags: poi.osmTags as Record<string, string> | null,
      profile,
    },
    tagMap,
    brandMap,
    categoryMap,
  );

  if (result.status !== "enriched" || !result.profile) {
    log.warn(`Enrichment failed for "${poi.name}": ${result.status}`);
    return null;
  }

  const enrichedProfile = result.profile;

  await db
    .update(pois)
    .set({ profile: enrichedProfile, embedding: null, updatedAt: sql`now()` })
    .where(eq(pois.id, poiId));

  log.info(`Enrichment complete — source: ${enrichedProfile.enrichmentSource}, tier: ${enrichedProfile.dataTier}`);

  const categorySlug = poi.categoryId ? (categoryMap.get(poi.categoryId) ?? "hidden") : "hidden";
  fireAndForgetSync(poi, enrichedProfile, categorySlug).catch((err) => {
    log.warn(`Background sync failed for "${poi.name}": ${err instanceof Error ? err.message : err}`);
  });

  return enrichedProfile;
}

/**
 * Non-blocking background sync: upserts to Typesense and generates embedding.
 *
 * @param poi - POI row data with all fields needed for sync.
 * @param profile - Enriched profile.
 * @param categorySlug - Category slug for the POI.
 */
async function fireAndForgetSync(
  poi: {
    id: string;
    name: string;
    osmId: number | null;
    latitude: number;
    longitude: number;
    address: string | null;
    osmTags: Record<string, string> | null;
    categoryId: string | null;
    regionId: string | null;
    locale: string;
    wikipediaUrl: string | null;
    mapillaryId: string | null;
    mapillaryBearing: number | null;
    mapillaryIsPano: boolean | null;
  },
  profile: PoiProfile,
  categorySlug: string,
): Promise<void> {
  const tags = await loadTags(poi.id);
  const tagNames = tags.map((t) => t.name);

  const doc = buildTypesenseDocument({
    id: poi.id,
    osmId: poi.osmId,
    name: poi.name,
    latitude: poi.latitude,
    longitude: poi.longitude,
    address: poi.address,
    osmTags: poi.osmTags,
    categorySlug,
    profile,
    tags: tagNames,
    hasRemark: false,
    cuisines: [],
    wheelchair: null,
    dogFriendly: null,
    elevator: null,
    parkingAvailable: null,
    freeEntry: null,
    openingHours: null,
  });

  await upsertDocuments([doc]);

  const poiData: Poi = {
    id: poi.id,
    osmId: poi.osmId,
    name: poi.name,
    categoryId: poi.categoryId,
    regionId: poi.regionId,
    latitude: poi.latitude,
    longitude: poi.longitude,
    address: poi.address,
    locale: poi.locale,
    osmType: null,
    osmTags: poi.osmTags,
    profile,
    wikipediaUrl: poi.wikipediaUrl,
    mapillaryId: poi.mapillaryId,
    mapillaryBearing: poi.mapillaryBearing,
    mapillaryIsPano: poi.mapillaryIsPano,
    createdAt: new Date(),
    updatedAt: null,
  };

  const embeddingText = buildEmbeddingText(poiData, profile, tags);
  const [embedding] = await embedTexts([embeddingText]);

  await db
    .update(pois)
    .set({ embedding })
    .where(eq(pois.id, poi.id));

  log.info(`Background sync complete: Typesense upserted, embedding generated`);
}
