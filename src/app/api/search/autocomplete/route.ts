import { NextRequest, NextResponse } from "next/server";
import { searchAutocomplete } from "@/lib/search/typesense";
import { createLogger } from "@/lib/logger";

const log = createLogger("autocomplete");

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
  const q = request.nextUrl.searchParams.get("q");
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "0");
  const lon = parseFloat(request.nextUrl.searchParams.get("lon") || "0");

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const location = lat && lon ? { latitude: lat, longitude: lon } : undefined;
    const suggestions = await searchAutocomplete(q, location);
    return NextResponse.json({ suggestions });
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
