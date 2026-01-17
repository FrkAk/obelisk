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
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number
): boolean {
  return haversineDistance(userLat, userLon, targetLat, targetLon) <= radiusMeters;
}

/**
 * Sorts POIs by distance from a given location.
 *
 * Args:
 *     userLat: User's latitude.
 *     userLon: User's longitude.
 *     pois: Array of POIs with latitude and longitude.
 *
 * Returns:
 *     POIs sorted by distance from closest to farthest.
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLon: number,
  pois: T[]
): (T & { distance: number })[] {
  return pois
    .map((poi) => ({
      ...poi,
      distance: haversineDistance(userLat, userLon, poi.latitude, poi.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
}
