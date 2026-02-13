"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, remarks, categories } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { ExternalPOI } from "@/lib/search/types";
import type { CategorySlug } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("poi-lookup");
import type { RemarkWithPoi } from "@/lib/db/queries/search";

const bodySchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().optional(),
});

const OSM_CATEGORY_MAPPING: Record<string, string> = {
  restaurant: "food",
  cafe: "food",
  fast_food: "food",
  biergarten: "food",
  food_court: "food",
  ice_cream: "food",
  bakery: "food",
  deli: "food",
  confectionery: "food",
  food_and_drink: "food",
  food_and_drink_stores: "food",

  bar: "nightlife",
  pub: "nightlife",
  nightclub: "nightlife",

  museum: "art",
  gallery: "art",

  theatre: "culture",
  cinema: "culture",
  arts_centre: "culture",
  community_centre: "culture",
  arts_and_entertainment: "culture",

  university: "education",
  school: "education",
  college: "education",
  library: "education",
  education: "education",
  kindergarten: "education",

  hospital: "health",
  clinic: "health",
  pharmacy: "health",
  doctors: "health",
  dentist: "health",
  veterinary: "health",

  police: "services",
  fire_station: "services",
  bank: "services",
  post_office: "services",
  atm: "services",
  bureau_de_change: "services",
  commercial_services: "services",

  shop: "shopping",
  clothes: "shopping",
  supermarket: "shopping",
  mall: "shopping",
  department_store: "shopping",
  marketplace: "shopping",

  stadium: "sports",
  sports_centre: "sports",
  swimming_pool: "sports",
  fitness_centre: "sports",
  pitch: "sports",

  bus_station: "transport",
  station: "transport",
  parking: "transport",
  fuel: "transport",
  car_rental: "transport",
  taxi: "transport",
  motorist: "transport",

  park: "nature",
  garden: "nature",
  nature_reserve: "nature",
  zoo: "nature",
  aquarium: "nature",
  botanical_garden: "nature",
  playground: "nature",
  dog_park: "nature",
  park_like: "nature",

  church: "architecture",
  cathedral: "architecture",
  chapel: "architecture",
  mosque: "architecture",
  synagogue: "architecture",
  temple: "architecture",
  shrine: "architecture",
  place_of_worship: "architecture",
  monastery: "architecture",
  tower: "architecture",
  townhall: "architecture",
  courthouse: "architecture",
  religion: "architecture",
  "religious-christian": "architecture",
  "religious-muslim": "architecture",
  "religious-jewish": "architecture",
  "religious-buddhist": "architecture",
  "religious-shinto": "architecture",

  castle: "history",
  monument: "history",
  memorial: "history",
  archaeological_site: "history",
  ruins: "history",
  battlefield: "history",
  city_gate: "history",
  wayside_shrine: "history",
  wayside_cross: "history",
  historic: "history",

  viewpoint: "views",

  attraction: "hidden",
  hotel: "hidden",
  hostel: "hidden",
  fountain: "hidden",
  lodging: "hidden",
  general: "hidden",
  visitor_amenities: "hidden",
  industrial: "hidden",
};

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
  try {
    const body = await request.json();
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
      { error: "Failed to lookup POI", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function findInDatabase(
  name: string,
  latitude: number,
  longitude: number
): Promise<{ poi: ExternalPOI; remark: RemarkWithPoi | null } | null> {
  const latDelta = 50 / 111320;
  const lonDelta = 50 / (111320 * Math.cos(latitude * (Math.PI / 180)));

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
      imageUrl: pois.imageUrl,
      osmTags: pois.osmTags,
      createdAt: pois.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(pois)
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(
      and(
        gte(pois.latitude, latitude - latDelta),
        lte(pois.latitude, latitude + latDelta),
        gte(pois.longitude, longitude - lonDelta),
        lte(pois.longitude, longitude + lonDelta)
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

  const remarkResult = await db
    .select({
      remarkId: remarks.id,
      remarkPoiId: remarks.poiId,
      remarkTitle: remarks.title,
      remarkTeaser: remarks.teaser,
      remarkContent: remarks.content,
      remarkLocalTip: remarks.localTip,
      remarkDurationSeconds: remarks.durationSeconds,
      remarkAudioUrl: remarks.audioUrl,
      remarkCreatedAt: remarks.createdAt,
      poiId: pois.id,
      poiOsmId: pois.osmId,
      poiName: pois.name,
      poiCategoryId: pois.categoryId,
      poiLatitude: pois.latitude,
      poiLongitude: pois.longitude,
      poiAddress: pois.address,
      poiWikipediaUrl: pois.wikipediaUrl,
      poiImageUrl: pois.imageUrl,
      poiOsmTags: pois.osmTags,
      poiCreatedAt: pois.createdAt,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(remarks)
    .innerJoin(pois, eq(remarks.poiId, pois.id))
    .leftJoin(categories, eq(pois.categoryId, categories.id))
    .where(and(eq(remarks.poiId, matchingPoi.id), eq(remarks.isCurrent, true)))
    .limit(1);

  let remark: RemarkWithPoi | null = null;
  if (remarkResult.length > 0) {
    const row = remarkResult[0];
    remark = {
      id: row.remarkId,
      poiId: row.remarkPoiId!,
      title: row.remarkTitle,
      teaser: row.remarkTeaser,
      content: row.remarkContent,
      localTip: row.remarkLocalTip,
      durationSeconds: row.remarkDurationSeconds ?? 45,
      audioUrl: row.remarkAudioUrl,
      createdAt: row.remarkCreatedAt ?? new Date(),
      poi: {
        id: row.poiId,
        osmId: row.poiOsmId,
        name: row.poiName,
        categoryId: row.poiCategoryId!,
        latitude: row.poiLatitude,
        longitude: row.poiLongitude,
        address: row.poiAddress,
        wikipediaUrl: row.poiWikipediaUrl,
        imageUrl: row.poiImageUrl,
        osmTags: row.poiOsmTags,
        createdAt: row.poiCreatedAt ?? new Date(),
        category: row.categoryId
          ? {
              id: row.categoryId,
              name: row.categoryName!,
              slug: row.categorySlug! as CategorySlug,
              icon: row.categoryIcon!,
              color: row.categoryColor!,
            }
          : undefined,
      },
    };
  }

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
    imageUrl: matchingPoi.imageUrl ?? undefined,
    source: "nominatim",
  };

  return { poi: externalPoi, remark };
}

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

    if (!response.ok) return null;

    const results = await response.json();
    if (!results || results.length === 0) return null;

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
  if (hint && OSM_CATEGORY_MAPPING[hint]) {
    return OSM_CATEGORY_MAPPING[hint];
  }

  if (OSM_CATEGORY_MAPPING[type]) {
    return OSM_CATEGORY_MAPPING[type];
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

function createSyntheticPoi(
  name: string,
  latitude: number,
  longitude: number,
  category?: string
): ExternalPOI {
  const syntheticId = Math.floor(Math.random() * 1000000000);
  return {
    id: `synthetic-${syntheticId}`,
    osmId: syntheticId,
    osmType: "node",
    name,
    category: category ? (OSM_CATEGORY_MAPPING[category] || "hidden") : "hidden",
    latitude,
    longitude,
    source: "nominatim",
  };
}
