/**
 * Calculates the distance between two points using the Haversine formula.
 *
 * Args:
 *     lat1: Latitude of first point in degrees.
 *     lon1: Longitude of first point in degrees.
 *     lat2: Latitude of second point in degrees.
 *     lon2: Longitude of second point in degrees.
 *
 * Returns:
 *     Distance in meters between the two points.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Calculates a rectangular bounding box around a center point.
 *
 * Args:
 *     latitude: Center latitude in degrees.
 *     longitude: Center longitude in degrees.
 *     radiusMeters: Radius in meters from the center point.
 *
 * Returns:
 *     Bounding box with minLat, maxLat, minLon, maxLon.
 */
export function geoBounds(
  latitude: number,
  longitude: number,
  radiusMeters: number
): GeoBounds {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos(toRadians(latitude)));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
}

/**
 * Checks if a point is within a certain radius of another point.
 *
 * Args:
 *     userLat: User's latitude.
 *     userLon: User's longitude.
 *     targetLat: Target point's latitude.
 *     targetLon: Target point's longitude.
 *     radiusMeters: Radius in meters.
 *
 * Returns:
 *     True if the point is within the radius.
 */
/**
 * Formats a distance in meters to a human-readable string.
 *
 * @param meters - Distance in meters.
 * @returns Formatted distance string (e.g. "240m" or "1.2km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  return haversineDistance(userLat, userLon, targetLat, targetLon) <= radiusMeters;
}

