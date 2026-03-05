import { createLogger } from "@/lib/logger";
import type { SearchResult } from "@/types/api";

const log = createLogger("geocoding");

interface MapboxFeature {
  id: string;
  type: string;
  properties: {
    name: string;
    full_address?: string;
    place_formatted?: string;
    feature_type: string;
    coordinates: { latitude: number; longitude: number };
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

interface MapboxResponse {
  features: MapboxFeature[];
}

/**
 * Geocodes a query using Mapbox Geocoding v6, returning matching locations
 * as SearchResults with source "geocoding".
 *
 * @param query - The address or place name to geocode.
 * @param userLat - User's latitude for proximity bias.
 * @param userLon - User's longitude for proximity bias.
 * @returns Array of geocoding SearchResults, or empty on failure.
 */
export async function geocodeQuery(
  query: string,
  userLat: number,
  userLon: number
): Promise<SearchResult[]> {
  const token = process.env.MAPBOX_SERVER_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    log.warn("Missing NEXT_PUBLIC_MAPBOX_TOKEN, skipping geocoding");
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    access_token: token,
    proximity: `${userLon},${userLat}`,
    limit: "3",
    language: "en",
  });

  const url = `https://api.mapbox.com/search/geocode/v6/forward?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      log.warn(`Mapbox geocoding failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as MapboxResponse;

    return data.features.map((feature) => ({
      id: `geo-${feature.id}`,
      name: feature.properties.name,
      category: "geocoding",
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      score: 1,
      address:
        feature.properties.full_address ??
        feature.properties.place_formatted ??
        undefined,
      placeType: feature.properties.feature_type,
      hasRemark: false,
      source: "geocoding" as const,
    }));
  } catch (error) {
    log.warn("Geocoding request failed:", error);
    return [];
  }
}
