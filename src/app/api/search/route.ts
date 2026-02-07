import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchRemarks, getRandomRemark } from "@/lib/db/queries/search";
import { parseQueryIntent } from "@/lib/search/queryParser";
import { searchNominatim } from "@/lib/search/nominatim";
import { enrichPOIs, searchByAmenityOverpass } from "@/lib/search/overpass";
import { generateText } from "@/lib/ai/ollama";
import { haversineDistance } from "@/lib/geo/distance";
import type {
  SearchResult,
  ObeliskResult,
  ExternalResult,
  ParsedIntent,
  ExternalPOI,
  ViewportBounds,
} from "@/lib/search/types";
import type { Remark, Poi, Category } from "@/types";

const requestSchema = z.object({
  query: z.string().min(1).max(500),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  viewport: z.object({
    center: z.object({ latitude: z.number(), longitude: z.number() }),
    bounds: z.object({ west: z.number(), south: z.number(), east: z.number(), north: z.number() }),
    zoom: z.number(),
  }).optional(),
  radius: z.number().min(100).max(5000).default(1000),
  limit: z.number().min(1).max(50).default(20),
});

type RemarkWithPoi = Remark & { poi: Poi & { category?: Category } };

/**
 * Derives search center and radius from viewport or falls back to GPS location.
 *
 * Args:
 *     location: GPS-based fallback location.
 *     viewport: Optional viewport context from the map.
 *     defaultRadius: Fallback radius in meters.
 *
 * Returns:
 *     Search center, effective radius, zoom level, and optional viewport bounds.
 */
function computeSearchLocation(
  location: { latitude: number; longitude: number },
  viewport?: { center: { latitude: number; longitude: number }; bounds: ViewportBounds; zoom: number },
  defaultRadius: number = 1000
): { center: { latitude: number; longitude: number }; radius: number; zoom: number; bounds?: ViewportBounds } {
  if (!viewport) {
    return { center: location, radius: defaultRadius, zoom: 14 };
  }

  const diagonal = haversineDistance(
    viewport.bounds.south, viewport.bounds.west,
    viewport.bounds.north, viewport.bounds.east
  );
  const radius = Math.min(diagonal / 2, 5000);

  return {
    center: viewport.center,
    radius,
    zoom: viewport.zoom,
    bounds: viewport.bounds,
  };
}

function scoreObeliskResult(
  remark: RemarkWithPoi,
  intent: ParsedIntent,
  distance: number,
  zoom: number
): number {
  let score = 70;

  const zoomFactor = Math.max(1, zoom - 10) / 8;
  const distancePenalty = Math.min(distance / 100, 20) * zoomFactor;
  score -= distancePenalty;

  if (intent.category && remark.poi.category?.slug === intent.category) {
    score += 25;
  }

  if (intent.keywords.length > 0) {
    const searchableText = [
      remark.title,
      remark.teaser,
      remark.content,
      remark.poi.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchingKeywords = intent.keywords.filter((kw) =>
      searchableText.includes(kw.toLowerCase())
    );
    score += matchingKeywords.length * 10;
  }

  score += 10;

  return Math.min(100, Math.max(0, score));
}

function scoreExternalResult(
  poi: ExternalPOI,
  intent: ParsedIntent,
  distance: number,
  zoom: number
): number {
  let score = 60;

  const zoomFactor = Math.max(1, zoom - 10) / 8;
  const distancePenalty = Math.min(distance / 100, 20) * zoomFactor;
  score -= distancePenalty;

  if (intent.category && poi.category === intent.category) {
    score += 20;
  }

  if (intent.filters.wifi && poi.hasWifi) {
    score += 15;
  }
  if (intent.filters.outdoor && poi.hasOutdoorSeating) {
    score += 15;
  }
  if (poi.openingHours) {
    score += 5;
  }
  if (poi.website) {
    score += 3;
  }
  if (poi.phone) {
    score += 2;
  }

  return Math.min(100, Math.max(0, score));
}

function findNearbyRemark(
  poi: ExternalPOI,
  remarks: RemarkWithPoi[]
): RemarkWithPoi | undefined {
  const maxDistance = 100;

  return remarks.find((remark) => {
    const distance = haversineDistance(
      poi.latitude,
      poi.longitude,
      remark.poi.latitude,
      remark.poi.longitude
    );
    return distance <= maxDistance;
  });
}

async function generateConversationalResponse(
  results: SearchResult[],
  query: string,
  _intent: ParsedIntent
): Promise<string> {
  if (results.length === 0) {
    return "I couldn't find anything matching your search in this area. Try expanding your search radius or using different keywords.";
  }

  const obeliskResults = results.filter(
    (r): r is ObeliskResult => r.type === "remark"
  );
  const externalResults = results.filter(
    (r): r is ExternalResult => r.type === "external"
  );

  const prompt = `Generate a brief, friendly response (2-3 sentences max) for a location search app.

User searched: "${query}"
Found: ${obeliskResults.length} stories and ${externalResults.length} places

${obeliskResults.length > 0 ? `Top story: "${obeliskResults[0].remark.title}" about ${obeliskResults[0].remark.poi.name}` : ""}
${externalResults.length > 0 ? `Top place: ${externalResults[0].poi.name} (${externalResults[0].poi.category})` : ""}

Respond conversationally. If there are Obelisk stories, mention them as highlights. Be concise.`;

  try {
    const response = await generateText(prompt, undefined, {
      temperature: 0.7,
      num_predict: 100,
    });
    return response.trim();
  } catch {
    if (obeliskResults.length > 0) {
      return `I found ${obeliskResults.length} stories nearby, including "${obeliskResults[0].remark.title}". ${externalResults.length > 0 ? `Plus ${externalResults.length} other places worth checking out.` : ""}`;
    }
    return `I found ${externalResults.length} places matching your search nearby.`;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let parseTime = 0;
  let obeliskTime = 0;
  let externalTime = 0;

  try {
    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { query, location, viewport, radius, limit } = parseResult.data;

    const searchCtx = computeSearchLocation(location, viewport, radius);

    const parseStart = Date.now();
    const intent = await parseQueryIntent(query);
    parseTime = Date.now() - parseStart;

    if (intent.type === "discovery") {
      const randomRemark = await getRandomRemark(
        searchCtx.center.latitude,
        searchCtx.center.longitude,
        searchCtx.radius * 2,
        intent.category
      );

      if (randomRemark) {
        const distance = haversineDistance(
          searchCtx.center.latitude,
          searchCtx.center.longitude,
          randomRemark.poi.latitude,
          randomRemark.poi.longitude
        );

        const result: ObeliskResult = {
          type: "remark",
          remark: randomRemark as RemarkWithPoi,
          distance,
          score: 100,
        };

        return NextResponse.json({
          results: [result],
          conversationalResponse: `Here's a surprise for you: "${randomRemark.title}" - a ${randomRemark.poi.category?.name || "hidden"} story about ${randomRemark.poi.name}!`,
          intent,
          timing: {
            parseMs: parseTime,
            obeliskMs: Date.now() - parseStart - parseTime,
            externalMs: 0,
            totalMs: Date.now() - startTime,
          },
        });
      }
    }

    const obeliskStart = Date.now();
    const remarksRaw = await searchRemarks({
      latitude: searchCtx.center.latitude,
      longitude: searchCtx.center.longitude,
      radiusMeters: searchCtx.radius,
      category: intent.category,
      keywords: intent.keywords,
      limit,
    });
    obeliskTime = Date.now() - obeliskStart;

    const remarks = remarksRaw as RemarkWithPoi[];

    const externalStart = Date.now();
    let externalPois: ExternalPOI[] = [];

    try {
      if (intent.filters.wifi || intent.filters.outdoor) {
        const amenityTypes =
          intent.category === "food"
            ? ["cafe", "restaurant"]
            : ["cafe", "restaurant", "bar"];
        externalPois = await searchByAmenityOverpass(amenityTypes, searchCtx.center, searchCtx.radius);
      } else {
        externalPois = await searchNominatim(intent, searchCtx.center, searchCtx.radius, limit, searchCtx.bounds);
      }

      if (externalPois.length > 0 && externalPois.length <= 10) {
        externalPois = await enrichPOIs(externalPois);
      }
    } catch (error) {
      console.error("External search error:", error);
    }
    externalTime = Date.now() - externalStart;

    const obeliskResults: ObeliskResult[] = remarks.map((remark) => {
      const distance = haversineDistance(
        searchCtx.center.latitude,
        searchCtx.center.longitude,
        remark.poi.latitude,
        remark.poi.longitude
      );
      return {
        type: "remark" as const,
        remark,
        distance,
        score: scoreObeliskResult(remark, intent, distance, searchCtx.zoom),
      };
    });

    const externalResults: ExternalResult[] = externalPois.map((poi) => {
      const distance = poi.distance ?? haversineDistance(
        searchCtx.center.latitude,
        searchCtx.center.longitude,
        poi.latitude,
        poi.longitude
      );
      return {
        type: "external" as const,
        poi,
        nearbyRemark: findNearbyRemark(poi, remarks),
        distance,
        score: scoreExternalResult(poi, intent, distance, searchCtx.zoom),
      };
    });

    const allResults: SearchResult[] = [...obeliskResults, ...externalResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const conversationalResponse = await generateConversationalResponse(
      allResults,
      query,
      intent
    );

    return NextResponse.json({
      results: allResults,
      conversationalResponse,
      intent,
      timing: {
        parseMs: parseTime,
        obeliskMs: obeliskTime,
        externalMs: externalTime,
        totalMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
