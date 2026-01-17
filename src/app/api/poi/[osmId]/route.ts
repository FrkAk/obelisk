import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPOIDetails } from "@/lib/search/overpass";

const paramsSchema = z.object({
  osmId: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  type: z.enum(["node", "way", "relation"]).default("node"),
});

/**
 * Fetches detailed information about an external POI from OpenStreetMap.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osmId: string }> }
) {
  try {
    const resolvedParams = await params;
    const paramsResult = paramsSchema.safeParse({ osmId: resolvedParams.osmId });

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: "Invalid OSM ID", details: paramsResult.error.flatten() },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const queryResult = querySchema.safeParse({
      type: searchParams.get("type") ?? "node",
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { osmId } = paramsResult.data;
    const { type } = queryResult.data;

    const details = await fetchPOIDetails(osmId, type);

    if (!details) {
      return NextResponse.json(
        { error: "POI not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      osmId,
      osmType: type,
      ...details,
    });
  } catch (error) {
    console.error("Error fetching POI details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
