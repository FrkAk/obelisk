import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { pois, poiImages } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { findBestMapillaryImage } from "@/lib/media/mapillary";
import { resolveWikiImage } from "@/lib/media/wikimedia";
import { generateVisualDescriptionSafe } from "@/lib/media/visual";
import { createLogger } from "@/lib/logger";
import type { PoiProfile, PoiImage } from "@/types/api";

const log = createLogger("enrich-media");

const bodySchema = z.object({
  poiId: z.string().uuid(),
});

/**
 * On-demand media enrichment for a POI.
 * Fetches Mapillary street view and wiki images, saves to DB, returns results.
 *
 * @param request - POST with { poiId: uuid }.
 * @returns Media data (mapillary fields + images array).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = bodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { poiId } = parseResult.data;

    const poiRows = await db
      .select({
        id: pois.id,
        name: pois.name,
        latitude: pois.latitude,
        longitude: pois.longitude,
        osmTags: pois.osmTags,
        mapillaryId: pois.mapillaryId,
        mapillaryBearing: pois.mapillaryBearing,
        mapillaryIsPano: pois.mapillaryIsPano,
        profile: pois.profile,
      })
      .from(pois)
      .where(eq(pois.id, poiId))
      .limit(1);

    if (poiRows.length === 0) {
      return NextResponse.json({ error: "POI not found" }, { status: 404 });
    }

    const poi = poiRows[0];

    const existingImages = await db
      .select({ id: poiImages.id, url: poiImages.url, source: poiImages.source })
      .from(poiImages)
      .where(eq(poiImages.poiId, poiId));

    if (poi.mapillaryId && existingImages.length > 0) {
      log.info(`Returning cached media for POI ${poiId}`);
      return NextResponse.json({
        mapillaryId: poi.mapillaryId,
        mapillaryBearing: poi.mapillaryBearing,
        mapillaryIsPano: poi.mapillaryIsPano,
        images: existingImages,
      });
    }

    const needsMapillary = !poi.mapillaryId;
    const needsImages = existingImages.length === 0;
    const mapillaryToken = process.env.MAPILLARY_ACCESS_TOKEN;

    const [mapillaryResult, wikiResult] = await Promise.all([
      needsMapillary && mapillaryToken
        ? findBestMapillaryImage(poi.latitude, poi.longitude, mapillaryToken).catch((err) => {
            log.warn(`Mapillary fetch failed for ${poiId}:`, err);
            return null;
          })
        : Promise.resolve(null),
      needsImages && poi.osmTags
        ? resolveWikiImage(poi.osmTags).catch((err) => {
            log.warn(`Wiki image fetch failed for ${poiId}:`, err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    const profile: PoiProfile = (poi.profile as PoiProfile) ?? {
      keywords: [],
      products: [],
      summary: "",
      enrichmentSource: "on-demand",
      attributes: {},
    };

    let mapillaryId = poi.mapillaryId;
    let mapillaryBearing = poi.mapillaryBearing;
    let mapillaryIsPano = poi.mapillaryIsPano;

    if (mapillaryResult) {
      mapillaryId = mapillaryResult.mapillaryId;
      mapillaryBearing = mapillaryResult.bearing;
      mapillaryIsPano = mapillaryResult.isPano;
      profile.mapillaryThumbUrl = mapillaryResult.thumbUrl;

      await db
        .update(pois)
        .set({
          mapillaryId: mapillaryResult.mapillaryId,
          mapillaryBearing: mapillaryResult.bearing,
          mapillaryIsPano: mapillaryResult.isPano,
          profile: { ...profile },
          updatedAt: sql`now()`,
        })
        .where(eq(pois.id, poiId));

      log.info(`Saved Mapillary image ${mapillaryResult.mapillaryId} for POI ${poiId}`);
    }

    let images: PoiImage[] = existingImages;

    if (wikiResult) {
      const duplicate = await db
        .select({ id: poiImages.id })
        .from(poiImages)
        .where(sql`poi_id = ${poiId} AND source = ${wikiResult.source}`)
        .limit(1);

      if (duplicate.length === 0) {
        const inserted = await db
          .insert(poiImages)
          .values({
            poiId,
            url: wikiResult.url,
            source: wikiResult.source,
            sortOrder: 0,
          })
          .returning({ id: poiImages.id, url: poiImages.url, source: poiImages.source });

        images = [...existingImages, ...inserted];

        profile.wikiImageUrl = wikiResult.url;
        await db
          .update(pois)
          .set({
            profile: { ...profile },
            updatedAt: sql`now()`,
          })
          .where(eq(pois.id, poiId));

        log.info(`Saved wiki image (${wikiResult.source}) for POI ${poiId}`);
      }
    }

    if (!profile.visualDescription && (profile.mapillaryThumbUrl || profile.wikiImageUrl)) {
      const visualDesc = await generateVisualDescriptionSafe(
        poi.name,
        profile.mapillaryThumbUrl,
        profile.wikiImageUrl,
      );
      if (visualDesc) {
        profile.visualDescription = visualDesc.trim();
        await db
          .update(pois)
          .set({
            profile: { ...profile },
            updatedAt: sql`now()`,
          })
          .where(eq(pois.id, poiId));
        log.info(`Generated visual description for POI ${poiId}`);
      }
    }

    return NextResponse.json({
      mapillaryId,
      mapillaryBearing,
      mapillaryIsPano,
      images,
    });
  } catch (error) {
    log.error("Enrich media error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
