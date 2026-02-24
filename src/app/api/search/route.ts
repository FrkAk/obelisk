import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseQueryIntent } from "@/lib/search/queryParser";
import { searchPOIs } from "@/lib/search/typesense";
import { semanticSearch } from "@/lib/search/semantic";
import { searchRemarksByText, getRandomRemark } from "@/lib/db/queries/search";
import type { RemarkWithPoi } from "@/lib/db/queries/search";
import { rankResults } from "@/lib/search/ranking";
import { haversineDistance } from "@/lib/geo/distance";
import { createLogger } from "@/lib/logger";
import type { SearchResult, SearchResponse } from "@/lib/search/types";

const log = createLogger("search");

const requestSchema = z.object({
  query: z.string().min(1).max(500),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  radius: z.number().min(100).max(50000).default(5000),
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
    hasStory: hit.hasStory,
    hasOutdoorSeating: hit.hasOutdoorSeating,
    hasWifi: hit.hasWifi,
    source: "typesense",
  };
}

/**
 * Converts a remark-with-POI into a unified SearchResult.
 *
 * Args:
 *     remark: A remark joined with its POI data.
 *     userLat: User's latitude for distance calculation.
 *     userLon: User's longitude for distance calculation.
 *
 * Returns:
 *     A SearchResult with source "obelisk-db".
 */
function remarkToSearchResult(
  remark: RemarkWithPoi,
  userLat: number,
  userLon: number
): SearchResult {
  return {
    id: remark.poi.id,
    osmId: remark.poi.osmId ?? undefined,
    name: remark.poi.name,
    category: remark.poi.category?.slug ?? "hidden",
    latitude: remark.poi.latitude,
    longitude: remark.poi.longitude,
    distance: haversineDistance(
      userLat,
      userLon,
      remark.poi.latitude,
      remark.poi.longitude
    ),
    score: 0,
    address: remark.poi.address ?? undefined,
    hasStory: true,
    remark: remark as SearchResult["remark"],
    source: "obelisk-db",
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
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
        const result = remarkToSearchResult(
          randomRemark,
          location.latitude,
          location.longitude
        );
        result.score = 100;

        const response: SearchResponse = {
          results: [result],
          intent,
          timing: {
            parseMs,
            typesenseMs: 0,
            semanticMs: 0,
            obeliskMs: Date.now() - parseStart - parseMs,
            totalMs: Date.now() - startTime,
          },
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

    const hasFacets = !!(intent.category || intent.cuisineTypes?.length);
    const hasKeywords = intent.keywords.length > 0;
    const typesenseQuery = hasFacets && !hasKeywords ? "*" : query;

    const [typesenseSettled, semanticSettled, obeliskSettled] =
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
            limit
          );
          return { results: hits, ms: Date.now() - semStart };
        })(),
        (async () => {
          const obStart = Date.now();
          const hits = await searchRemarksByText(
            query,
            location.latitude,
            location.longitude,
            radius,
            limit
          );
          return {
            results: hits.map((r) =>
              remarkToSearchResult(r, location.latitude, location.longitude)
            ),
            ms: Date.now() - obStart,
          };
        })(),
      ]);

    const typesenseResults =
      typesenseSettled.status === "fulfilled"
        ? typesenseSettled.value.results
        : [];
    const typesenseMs =
      typesenseSettled.status === "fulfilled"
        ? typesenseSettled.value.ms
        : 0;

    const semanticResults =
      semanticSettled.status === "fulfilled"
        ? semanticSettled.value.results
        : [];
    const semanticMs =
      semanticSettled.status === "fulfilled"
        ? semanticSettled.value.ms
        : 0;

    const obeliskResults =
      obeliskSettled.status === "fulfilled"
        ? obeliskSettled.value.results
        : [];
    const obeliskMs =
      obeliskSettled.status === "fulfilled"
        ? obeliskSettled.value.ms
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
    if (obeliskSettled.status === "rejected") {
      log.error("Obelisk DB failed:", obeliskSettled.reason);
    } else {
      const top = obeliskResults[0];
      log.info(
        `Obelisk DB: ${obeliskResults.length} hits in ${obeliskMs}ms${top ? ` — top: "${top.name}"` : ""}`
      );
    }

    const ranked = rankResults({
      typesenseResults,
      semanticResults,
      obeliskResults,
      userLocation: location,
      maxRadius: radius,
    });

    const finalResults = ranked.slice(0, limit);

    const totalMs = Date.now() - startTime;
    log.info(
      `Results: ${finalResults.length} (ts:${typesenseResults.length}, sem:${semanticResults.length}, ob:${obeliskResults.length})`
    );
    log.timing("total", totalMs);

    const topN = finalResults.slice(0, 5);
    for (let i = 0; i < topN.length; i++) {
      const r = topN[i];
      const dist = r.distance ? `${(r.distance / 1000).toFixed(1)}km` : "?";
      log.info(
        `  #${i + 1} "${r.name}" — score: ${r.score.toFixed(4)}, src: ${r.source}, dist: ${dist}${r.hasStory ? " ★" : ""}`
      );
    }

    const response: SearchResponse = {
      results: finalResults,
      intent,
      timing: {
        parseMs,
        typesenseMs,
        semanticMs,
        obeliskMs,
        totalMs,
      },
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
