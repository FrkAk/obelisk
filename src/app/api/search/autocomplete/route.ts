import { NextRequest, NextResponse } from "next/server";
import { searchAutocomplete } from "@/lib/search/typesense";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("autocomplete");

const querySchema = z.object({
  q: z.string().min(2),
  lat: z.coerce.number().min(-90).max(90).default(0),
  lon: z.coerce.number().min(-180).max(180).default(0),
});

/**
 * Handles autocomplete requests for the search bar.
 *
 * Args:
 *     request: The incoming GET request with q, lat, lon query parameters.
 *
 * Returns:
 *     JSON response with an array of autocomplete suggestions.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const parseResult = querySchema.safeParse({
    q: searchParams.get("q"),
    lat: searchParams.get("lat") ?? 0,
    lon: searchParams.get("lon") ?? 0,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { q, lat, lon } = parseResult.data;

  try {
    const location = lat && lon ? { latitude: lat, longitude: lon } : undefined;
    const suggestions = await searchAutocomplete(q, location);
    return NextResponse.json({ suggestions });
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
