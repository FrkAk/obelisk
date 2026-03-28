import { NextRequest, NextResponse } from "next/server";
import { getNearbyPois } from "@/lib/db/queries/pois";
import { getRemarksByPoiIds } from "@/lib/db/queries/remarks";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("remarks");

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(1000),
  locale: z.enum(["en", "tr", "en-DE", "de-DE", "tr-TR"]).optional(),
});

/**
 * Returns nearby remarks for the given lat/lon/radius.
 *
 * @param request - Incoming request with lat, lon, radius, and optional locale query params.
 * @returns JSON response with remarks array and total count.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parseResult = querySchema.safeParse({
      lat: searchParams.get("lat"),
      lon: searchParams.get("lon"),
      radius: searchParams.get("radius") ?? 1000,
      locale: searchParams.get("locale") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { lat, lon, radius, locale } = parseResult.data;

    const nearbyPois = await getNearbyPois(lat, lon, radius);
    const poiIds = nearbyPois.map((poi) => poi.id);
    const remarksData = await getRemarksByPoiIds(poiIds, locale);

    return NextResponse.json({
      remarks: remarksData,
      total: remarksData.length,
    });
  } catch (error) {
    log.error("Error fetching remarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
