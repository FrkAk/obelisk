"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pois, categories } from "@/lib/db/schema";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import type { CategorySlug } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("discover");

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(500).max(5000).default(2000),
});

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

/**
 * Fetches POIs from Overpass API around a location with retry logic.
 *
 * Args:
 *     lat: Center latitude.
 *     lon: Center longitude.
 *     radius: Radius in meters.
 *
 * Returns:
 *     Array of POI elements from Overpass.
 */
async function fetchPoisFromOverpass(
  lat: number,
  lon: number,
  radius: number
): Promise<OverpassElement[]> {
  const overpassQuery = `
    [out:json][timeout:30];
    (
      node["historic"]["name"](around:${radius},${lat},${lon});
      node["tourism"="museum"]["name"](around:${radius},${lat},${lon});
      node["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lon});
      node["amenity"="biergarten"]["name"](around:${radius},${lat},${lon});
      node["amenity"="theatre"]["name"](around:${radius},${lat},${lon});
      node["tourism"="viewpoint"]["name"](around:${radius},${lat},${lon});
      node["tourism"="attraction"]["name"](around:${radius},${lat},${lon});
      node["leisure"="park"]["name"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  for (let attempt = 0; attempt < OVERPASS_SERVERS.length; attempt++) {
    const server = OVERPASS_SERVERS[attempt];
    try {
      log.info(`Trying Overpass server ${attempt + 1}/${OVERPASS_SERVERS.length}: ${server}`);

      const response = await fetch(server, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        log.warn(`Server ${server} returned ${response.status}: ${response.statusText}`);
        continue;
      }

      const data: OverpassResponse = await response.json();
      log.success(`Found ${data.elements.length} elements from ${server}`);
      return data.elements;
    } catch (error) {
      log.warn(`Server ${server} failed:`, error instanceof Error ? error.message : error);
      if (attempt === OVERPASS_SERVERS.length - 1) {
        throw new Error("All Overpass servers failed. Please try again later.");
      }
    }
  }

  return [];
}

/**
 * Determines the category slug based on OSM tags.
 *
 * Args:
 *     tags: OSM tags from Overpass.
 *
 * Returns:
 *     The appropriate category slug.
 */
function determineCategorySlug(tags: Record<string, string>): CategorySlug {
  if (tags.historic) return "history";
  if (tags.tourism === "museum") return "art";
  if (tags.tourism === "viewpoint") return "views";
  if (tags.amenity === "biergarten" || tags.amenity === "restaurant") return "food";
  if (tags.leisure === "park" || tags.natural) return "nature";
  if (tags.amenity === "theatre") return "culture";
  if (tags.architect || tags.building === "church") return "architecture";
  return "hidden";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = querySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { lat, lon, radius } = parseResult.data;

    const elements = await fetchPoisFromOverpass(lat, lon, radius);

    if (elements.length === 0) {
      return NextResponse.json({
        discovered: 0,
        existing: 0,
        total: 0,
        pois: [],
      });
    }

    const osmIds = elements
      .map((el) => el.id)
      .filter((id): id is number => id !== undefined);

    const existingPois = await db
      .select({ osmId: pois.osmId })
      .from(pois)
      .where(inArray(pois.osmId, osmIds));

    const existingOsmIds = new Set(existingPois.map((p) => p.osmId));

    const allCategories = await db.select().from(categories);
    const categoryMap = new Map<CategorySlug, string>();
    for (const cat of allCategories) {
      categoryMap.set(cat.slug as CategorySlug, cat.id);
    }

    const newPoiData = elements
      .filter((el) => el.tags?.name && !existingOsmIds.has(el.id))
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;

        if (!elLat || !elLon) return null;

        const tags = el.tags || {};
        const categorySlug = determineCategorySlug(tags);
        const categoryId = categoryMap.get(categorySlug);

        return {
          osmId: el.id,
          name: tags.name!,
          categoryId: categoryId ?? null,
          latitude: elLat,
          longitude: elLon,
          address: tags["addr:street"]
            ? `${tags["addr:street"]} ${tags["addr:housenumber"] ?? ""}`
            : null,
          wikipediaUrl: tags.wikipedia
            ? `https://en.wikipedia.org/wiki/${tags.wikipedia.split(":")[1]}`
            : null,
          imageUrl: tags.image ?? null,
          osmTags: tags,
        };
      })
      .filter((poi): poi is NonNullable<typeof poi> => poi !== null);

    let insertedCount = 0;

    if (newPoiData.length > 0) {
      const result = await db
        .insert(pois)
        .values(newPoiData)
        .onConflictDoNothing()
        .returning({ id: pois.id });
      insertedCount = result.length;
    }

    return NextResponse.json({
      discovered: insertedCount,
      existing: existingOsmIds.size,
      total: insertedCount + existingOsmIds.size,
    });
  } catch (error) {
    log.error("Error discovering POIs:", error);
    return NextResponse.json(
      { error: "Failed to discover POIs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
