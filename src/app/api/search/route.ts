import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseQueryIntent } from "@/lib/search/queryParser";
import { searchPOIs } from "@/lib/search/typesense";
import { semanticSearch } from "@/lib/search/semantic";
import { geocodeQuery } from "@/lib/search/geocoding";
import { getRandomRemark } from "@/lib/db/queries/search";
import { rankResults } from "@/lib/search/ranking";
import { haversineDistance } from "@/lib/geo/distance";
import { createLogger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { SearchResult, SearchResponse } from "@/types/api";

const log = createLogger("search");

const requestSchema = z.object({
  query: z.string().min(2).max(500),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  radius: z.number().min(100).max(10000).default(5000),
  limit: z.number().min(1).max(50).default(20),
});

/**
 * Converts a Typesense hit into a unified SearchResult.
 *
 * Args:
 *     hit: A Typesense POI document with text score.
 *     userLat: User's latitude for distance calculation.
 *     userLon: User's longitude for distance calculation.
 *
 * Returns:
 *     A SearchResult with source "typesense".
 */
function typesenseHitToSearchResult(
  hit: Awaited<ReturnType<typeof searchPOIs>>[number],
  userLat: number,
  userLon: number
): SearchResult {
  return {
    id: hit.poiId,
    osmId: hit.osmId,
    name: hit.name,
    category: hit.category,
    latitude: hit.location[0],
    longitude: hit.location[1],
    distance: haversineDistance(
      userLat,
      userLon,
      hit.location[0],
      hit.location[1]
    ),
    score: hit.textScore,
    address: hit.address,
    description: hit.description,
    cuisine: hit.cuisines?.join(", "),
    amenityType: hit.amenityType,
    hasRemark: hit.hasRemark,
    hasOutdoorSeating: hit.hasOutdoorSeating,
    hasWifi: hit.hasWifi,
    source: "typesense",
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const startTime = Date.now();

  try {
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { query, location, radius, limit } = parseResult.data;

    const parseStart = Date.now();
    const intent = await parseQueryIntent(query);
    const parseMs = Date.now() - parseStart;

    if (intent.isDiscovery) {
      const randomRemark = await getRandomRemark(
        location.latitude,
        location.longitude,
        radius * 2,
        intent.category
      );

      if (randomRemark) {
        const result: SearchResult = {
          id: randomRemark.poi.id,
          osmId: randomRemark.poi.osmId ?? undefined,
          name: randomRemark.poi.name,
          category: randomRemark.poi.category?.slug ?? "hidden",
          latitude: randomRemark.poi.latitude,
          longitude: randomRemark.poi.longitude,
          distance: haversineDistance(
            location.latitude,
            location.longitude,
            randomRemark.poi.latitude,
            randomRemark.poi.longitude
          ),
          score: 100,
          address: randomRemark.poi.address ?? undefined,
          hasRemark: true,
          remark: randomRemark as SearchResult["remark"],
          source: "typesense",
        };

        const isProd = process.env.NODE_ENV === "production";
        const response: SearchResponse = {
          results: [result],
          ...(isProd ? {} : { intent }),
          ...(isProd
            ? {}
            : {
                timing: {
                  parseMs,
                  typesenseMs: 0,
                  semanticMs: 0,
                  geocodingMs: 0,
                  totalMs: Date.now() - startTime,
                },
              }),
        };

        return NextResponse.json(response);
      }
    }

    log.info(`Query: "${query}", category: ${intent.category}`);

    const radiusKm = radius / 1000;

    const typesenseFilters: Parameters<typeof searchPOIs>[3] = {};
    if (intent.category) typesenseFilters.category = intent.category;
    if (intent.filters.wifi) typesenseFilters.hasWifi = true;
    if (intent.filters.outdoor) typesenseFilters.hasOutdoorSeating = true;
    if (intent.cuisineTypes?.length) typesenseFilters.cuisines = intent.cuisineTypes;
    if (intent.filters.wheelchair) typesenseFilters.wheelchair = true;
    if (intent.filters.dogFriendly) typesenseFilters.dogFriendly = true;
    if (intent.filters.freeEntry) typesenseFilters.freeEntry = true;

    const typesenseQuery = intent.keywords.length > 0
      ? `${query} ${intent.keywords.join(" ")}`
      : query;

    const [typesenseSettled, semanticSettled, geocodingSettled] =
      await Promise.allSettled([
        (async () => {
          const tsStart = Date.now();
          const hits = await searchPOIs(
            typesenseQuery,
            location,
            radiusKm,
            typesenseFilters,
            limit
          );
          return {
            results: hits.map((h) =>
              typesenseHitToSearchResult(h, location.latitude, location.longitude)
            ),
            ms: Date.now() - tsStart,
          };
        })(),
        (async () => {
          const semStart = Date.now();
          const hits = await semanticSearch(
            query,
            location.latitude,
            location.longitude,
            radius,
            limit,
            intent.keywords
          );
          return { results: hits, ms: Date.now() - semStart };
        })(),
        (async () => {
          const geoStart = Date.now();
          const results = await geocodeQuery(query, location.latitude, location.longitude);
          return { results, ms: Date.now() - geoStart };
        })(),
      ]);

    let typesenseResults =
      typesenseSettled.status === "fulfilled"
        ? typesenseSettled.value.results
        : [];
    let typesenseMs =
      typesenseSettled.status === "fulfilled"
        ? typesenseSettled.value.ms
        : 0;

    const hasClassifierFilters = !!(typesenseFilters.category || typesenseFilters.cuisines?.length);
    const shouldRetry = intent.source !== "fast-path";
    if (typesenseResults.length === 0 && hasClassifierFilters && shouldRetry) {
      const removed = [
        typesenseFilters.category && `category="${typesenseFilters.category}"`,
        typesenseFilters.cuisines?.length && `cuisines=[${typesenseFilters.cuisines.join(", ")}]`,
      ].filter(Boolean).join(", ");
      log.info(`Retrying Typesense without classifier filters: ${removed}`);
      const retryFilters = { ...typesenseFilters };
      delete retryFilters.category;
      delete retryFilters.cuisines;
      const retryStart = Date.now();
      try {
        const retryHits = await searchPOIs(
          typesenseQuery,
          location,
          radiusKm,
          retryFilters,
          limit
        );
        typesenseResults = retryHits.map((h) =>
          typesenseHitToSearchResult(h, location.latitude, location.longitude)
        );
        typesenseMs += Date.now() - retryStart;
      } catch (error) {
        log.error("Typesense retry failed:", error);
      }
    }

    const semanticResults =
      semanticSettled.status === "fulfilled"
        ? semanticSettled.value.results
        : [];
    const semanticMs =
      semanticSettled.status === "fulfilled"
        ? semanticSettled.value.ms
        : 0;

    const geocodingResults =
      geocodingSettled.status === "fulfilled"
        ? geocodingSettled.value.results
        : [];
    const geocodingMs =
      geocodingSettled.status === "fulfilled"
        ? geocodingSettled.value.ms
        : 0;

    if (typesenseSettled.status === "rejected") {
      log.error("Typesense failed:", typesenseSettled.reason);
    } else {
      const top = typesenseResults[0];
      log.info(
        `Typesense: ${typesenseResults.length} hits in ${typesenseMs}ms${top ? ` — top: "${top.name}" (score: ${top.score})` : ""}`
      );
    }
    if (semanticSettled.status === "rejected") {
      log.error("Semantic failed:", semanticSettled.reason);
    } else {
      const top = semanticResults[0];
      log.info(
        `Semantic: ${semanticResults.length} hits in ${semanticMs}ms${top ? ` — top: "${top.name}" (sim: ${top.similarity.toFixed(3)})` : ""}`
      );
    }
    if (geocodingSettled.status === "rejected") {
      log.error("Geocoding failed:", geocodingSettled.reason);
    } else if (geocodingResults.length > 0) {
      log.info(`Geocoding: ${geocodingResults.length} hits in ${geocodingMs}ms`);
    }

    const typesenseWeight = intent.keywords.length > 0 ? 1.0 : 0.1;

    const ranked = rankResults({
      typesenseResults,
      semanticResults,
      userLocation: location,
      maxRadius: radius,
      typesenseWeight,
    });

    const dedupedGeo = geocodingResults.filter((geo) =>
      !ranked.some(
        (poi) =>
          haversineDistance(geo.latitude, geo.longitude, poi.latitude, poi.longitude) < 50
      )
    );

    const isPOIQuery = intent.source === "fast-path";
    const mergedResults = isPOIQuery
      ? [...ranked, ...dedupedGeo]
      : [...dedupedGeo, ...ranked];

    const finalResults = mergedResults.slice(0, limit);

    const totalMs = Date.now() - startTime;
    log.info(
      `Results: ${finalResults.length} (ts:${typesenseResults.length}, sem:${semanticResults.length})`
    );
    log.timing("total", totalMs);

    const topN = finalResults.slice(0, 5);
    for (let i = 0; i < topN.length; i++) {
      const r = topN[i];
      const dist = r.distance ? `${(r.distance / 1000).toFixed(1)}km` : "?";
      log.info(
        `  #${i + 1} "${r.name}" — score: ${r.score.toFixed(4)}, src: ${r.source}, dist: ${dist}${r.hasRemark ? " ★" : ""}`
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const response: SearchResponse = {
      results: finalResults,
      ...(isProduction ? {} : { intent }),
      ...(isProduction
        ? {}
        : {
            timing: {
              parseMs,
              typesenseMs,
              semanticMs,
              geocodingMs,
              totalMs,
            },
          }),
    };

    return NextResponse.json(response);
  } catch (error) {
    log.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
