import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories, poiImages } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { geoBounds } from "@/lib/geo/distance";
import { getCategorySlug, OSM_CATEGORY_MAP } from "@/lib/geo/categories";
import { z } from "zod";
import type { ExternalPOI } from "@/types/api";
import {
  type RemarkWithPoi,
  remarkPoiSelect,
  mapRowToRemarkWithPoi,
} from "@/lib/db/queries/remarks";
import { createLogger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const log = createLogger("poi-lookup");

const bodySchema = z.object({
  name: z.string().min(1).max(500),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().optional(),
});


/**
 * Looks up a specific POI by coordinates and name.
 * First checks if we have it in the database, then falls back to Nominatim.
 *
 * Args:
 *     name: POI name.
 *     latitude: POI latitude.
 *     longitude: POI longitude.
 *     category: Optional category hint.
 *
 * Returns:
 *     POI data with optional existing remark.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parseResult = bodySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, latitude, longitude, category } = parseResult.data;

    log.info(`Looking up: "${name}" at (${latitude}, ${longitude})`);

    const dbResult = await findInDatabase(name, latitude, longitude);
    if (dbResult) {
      log.info(`Found in database: "${dbResult.poi.name}" with remark: ${dbResult.remark ? "yes" : "no"}`);
      return NextResponse.json({
        poi: dbResult.poi,
        remark: dbResult.remark,
        source: "database",
      });
    }

    const nominatimResult = await lookupFromNominatim(name, latitude, longitude, category);
    if (nominatimResult) {
      log.info(`Found via Nominatim: "${nominatimResult.name}" (osmId: ${nominatimResult.osmId})`);
      return NextResponse.json({
        poi: nominatimResult,
        remark: null,
        source: "nominatim",
      });
    }

    log.info(`Creating synthetic POI for: "${name}"`);
    const syntheticPoi = createSyntheticPoi(name, latitude, longitude, category);
    return NextResponse.json({
      poi: syntheticPoi,
      remark: null,
      source: "synthetic",
    });
  } catch (error) {
    log.error("Error looking up POI:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Searches for a POI in the database by name within a 50m bounding box.
 *
 * @param name - POI name to search for.
 * @param latitude - Center latitude.
 * @param longitude - Center longitude.
 * @returns Matching POI with optional remark, or null if not found.
 */
async function findInDatabase(
  name: string,
  latitude: number,
  longitude: number
): Promise<{ poi: ExternalPOI; remark: RemarkWithPoi | null } | null> {
  const { minLat, maxLat, minLon, maxLon } = geoBounds(latitude, longitude, 50);

  const nearbyPois = await db
    .select({
      id: pois.id,
      osmId: pois.osmId,
      name: pois.name,
      categoryId: pois.categoryId,
      latitude: pois.latitude,
      longitude: pois.longitude,
      address: pois.address,
      wikipediaUrl: pois.wikipediaUrl,
      mapillaryId: pois.mapillaryId,
      mapillaryBearing: pois.mapillaryBearing,
      mapillaryIsPano: pois.mapillaryIsPano,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        gte(pois.latitude, minLat),
        lte(pois.latitude, maxLat),
        gte(pois.longitude, minLon),
        lte(pois.longitude, maxLon)
      )
    );

  const normalizedSearchName = name.toLowerCase().trim();
  const matchingPoi = nearbyPois.find((poi) => {
    const poiName = poi.name.toLowerCase().trim();
    return (
      poiName === normalizedSearchName ||
      poiName.includes(normalizedSearchName) ||
      normalizedSearchName.includes(poiName)
    );
  });

  if (!matchingPoi) return null;

  const imageRows = await db
    .select({ id: poiImages.id, url: poiImages.url, source: poiImages.source })
    .from(poiImages)
    .where(eq(poiImages.poiId, matchingPoi.id));

  const remarkResult = await db
    .select(remarkPoiSelect())
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(eq(remarks.poiId, matchingPoi.id), eq(remarks.isCurrent, true)))
    .limit(1);

  const remark: RemarkWithPoi | null =
    remarkResult.length > 0 ? mapRowToRemarkWithPoi(remarkResult[0]) : null;

  const externalPoi: ExternalPOI = {
    id: `db-${matchingPoi.id}`,
    osmId: matchingPoi.osmId ?? 0,
    osmType: "node",
    name: matchingPoi.name,
    category: matchingPoi.categorySlug || "hidden",
    latitude: matchingPoi.latitude,
    longitude: matchingPoi.longitude,
    address: matchingPoi.address ?? undefined,
    website: matchingPoi.osmTags?.website,
    phone: matchingPoi.osmTags?.phone,
    openingHours: matchingPoi.osmTags?.opening_hours,
    images: imageRows.length > 0 ? imageRows : undefined,
    mapillaryId: matchingPoi.mapillaryId ?? undefined,
    mapillaryBearing: matchingPoi.mapillaryBearing ?? undefined,
    mapillaryIsPano: matchingPoi.mapillaryIsPano ?? undefined,
    source: "nominatim",
  };

  return { poi: externalPoi, remark };
}

/**
 * Looks up a POI via the Nominatim geocoding service.
 *
 * @param name - POI name to search for.
 * @param latitude - Center latitude for bounded search.
 * @param longitude - Center longitude for bounded search.
 * @param categoryHint - Optional category hint from the client.
 * @returns ExternalPOI from Nominatim, or null on failure.
 */
async function lookupFromNominatim(
  name: string,
  latitude: number,
  longitude: number,
  categoryHint?: string
): Promise<ExternalPOI | null> {
  try {
    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("q", name);
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("limit", "5");
    searchUrl.searchParams.set("addressdetails", "1");
    searchUrl.searchParams.set("extratags", "1");
    searchUrl.searchParams.set(
      "viewbox",
      `${longitude - 0.01},${latitude + 0.01},${longitude + 0.01},${latitude - 0.01}`
    );
    searchUrl.searchParams.set("bounded", "1");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "Obelisk/1.0 (https://github.com/obelisk)",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      log.warn(`Nominatim returned ${response.status} for "${name}"`);
      return null;
    }

    const results = await response.json();
    if (!results || results.length === 0) {
      log.warn(`Nominatim returned no results for "${name}" near (${latitude}, ${longitude})`);
      return null;
    }

    const best = results[0];
    const extraTags = best.extratags || {};

    log.info(`Nominatim extraTags for "${name}":`, JSON.stringify(extraTags));

    const category = mapOsmTypeToCategory(best.type, best.class, categoryHint, extraTags);

    return {
      id: `nominatim-${best.place_id}`,
      osmId: best.osm_id,
      osmType: best.osm_type,
      name: best.name || name,
      category,
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      address: best.display_name?.split(",").slice(0, 3).join(", "),
      website: extraTags.website || extraTags["contact:website"] || extraTags.url,
      phone: extraTags.phone || extraTags["contact:phone"] || extraTags["contact:mobile"],
      openingHours: extraTags.opening_hours,
      cuisine: extraTags.cuisine,
      hasOutdoorSeating: extraTags.outdoor_seating === "yes",
      wikipediaUrl: extraTags.wikipedia
        ? buildWikipediaUrl(extraTags.wikipedia)
        : undefined,
      extraTags,
      source: "nominatim",
    };
  } catch (error) {
    log.error("Nominatim lookup failed:", error);
    return null;
  }
}

/**
 * Classifies a POI using a 4-layer priority system.
 *
 * Args:
 *     type: Nominatim OSM type (e.g., "place_of_worship", "restaurant").
 *     osmClass: Nominatim OSM class (e.g., "amenity", "tourism").
 *     hint: Optional Mapbox class or maki value from frontend click.
 *     extraTags: Optional Nominatim extratags for refinement.
 *
 * Returns:
 *     A valid category slug string.
 */
function mapOsmTypeToCategory(
  type: string,
  osmClass: string,
  hint?: string,
  extraTags?: Record<string, string>
): string {
  if (hint && OSM_CATEGORY_MAP[hint]) {
    return OSM_CATEGORY_MAP[hint];
  }

  if (OSM_CATEGORY_MAP[type]) {
    return OSM_CATEGORY_MAP[type];
  }

  if (extraTags) {
    const building = extraTags.building;
    if (building === "church" || building === "cathedral" || building === "mosque" ||
        building === "synagogue" || building === "temple" || building === "chapel") {
      return "architecture";
    }
    if (extraTags.religion) return "architecture";
    if (extraTags.cuisine) return "food";
  }

  if (osmClass === "historic") return "history";
  if (osmClass === "leisure") return "nature";
  if (osmClass === "tourism") return "hidden";
  if (osmClass === "amenity") return "hidden";
  if (osmClass === "shop") return "shopping";

  return "hidden";
}

/**
 * Builds a full Wikipedia URL from an OSM wikipedia tag value.
 *
 * Args:
 *     osmTag: OSM wikipedia tag (format: "lang:Title", e.g. "de:Maximilianeum").
 *
 * Returns:
 *     Full Wikipedia URL with correct language subdomain, or undefined if the tag is malformed.
 */
function buildWikipediaUrl(osmTag: string): string | undefined {
  const match = osmTag.match(/^([a-z]{2,3}):(.+)$/);
  if (!match) return undefined;
  const [, lang, title] = match;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

/**
 * Creates a synthetic POI when no database or Nominatim match is found.
 *
 * @param name - POI name.
 * @param latitude - POI latitude.
 * @param longitude - POI longitude.
 * @param category - Optional category hint.
 * @returns Synthetic ExternalPOI with a generated UUID.
 */
function createSyntheticPoi(
  name: string,
  latitude: number,
  longitude: number,
  category?: string
): ExternalPOI {
  const syntheticId = crypto.randomUUID();
  return {
    id: `synthetic-${syntheticId}`,
    osmId: 0,
    osmType: "node",
    name,
    category: category ? getCategorySlug(category) : "hidden",
    latitude,
    longitude,
    source: "synthetic",
  };
}
