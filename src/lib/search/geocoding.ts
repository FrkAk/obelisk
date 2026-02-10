const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Obelisk/1.0 (https://obelisk.app)";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Forward geocodes an address string to coordinates using Nominatim.
 *
 * Args:
 *     address: The address or place name to geocode.
 *
 * Returns:
 *     Geocoding result with coordinates, or null if not found.
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    countrycodes: "de",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding error: ${response.statusText}`);
  }

  const results = await response.json();

  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0];
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    displayName: result.display_name,
  };
}

/**
 * Reverse geocodes coordinates to a human-readable address using Nominatim.
 *
 * Args:
 *     lat: Latitude of the point.
 *     lon: Longitude of the point.
 *
 * Returns:
 *     Display name string, or null if reverse geocoding fails.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocoding error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.display_name ?? null;
}

export type { GeocodingResult };
