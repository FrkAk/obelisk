import { NextRequest, NextResponse } from "next/server";
import { getNearbyPois } from "@/lib/db/queries/pois";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("pois");

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(1000),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parseResult = querySchema.safeParse({
      lat: searchParams.get("lat"),
      lon: searchParams.get("lon"),
      radius: searchParams.get("radius") ?? 1000,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { lat, lon, radius } = parseResult.data;

    const pois = await getNearbyPois(lat, lon, radius);

    return NextResponse.json({
      pois,
      total: pois.length,
    });
  } catch (error) {
    log.error("Error fetching POIs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
