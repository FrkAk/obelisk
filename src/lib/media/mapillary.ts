const DEFAULT_BBOX_OFFSET = 0.0005;

interface MapillaryImage {
  id: string;
  computed_geometry: { coordinates: [number, number] };
  compass_angle: number;
  is_pano: boolean;
  captured_at: number;
  thumb_1024_url: string;
}

export interface MapillaryResult {
  mapillaryId: string;
  bearing: number;
  isPano: boolean;
  thumbUrl: string;
}

/**
 * Normalizes an angle to the range [-180, 180].
 *
 * @param angle - Angle in degrees.
 * @returns Normalized angle in [-180, 180].
 */
export function normalizeAngle(angle: number): number {
  let n = angle % 360;
  if (n > 180) n -= 360;
  if (n < -180) n += 360;
  return n;
}

/**
 * Computes the bearing from an image location to a POI using atan2.
 *
 * @param imgLon - Image longitude.
 * @param imgLat - Image latitude.
 * @param poiLon - POI longitude.
 * @param poiLat - POI latitude.
 * @returns Bearing in degrees [0, 360).
 */
export function computeBearing(
  imgLon: number,
  imgLat: number,
  poiLon: number,
  poiLat: number,
): number {
  const dLon = ((poiLon - imgLon) * Math.PI) / 180;
  const lat1 = (imgLat * Math.PI) / 180;
  const lat2 = (poiLat * Math.PI) / 180;
  const x = Math.sin(dLon) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Scores a Mapillary image based on how well it faces the POI.
 * Higher is better: angle alignment (0-1) + panorama bonus (0.3).
 *
 * @param image - Mapillary image data.
 * @param poiLon - POI longitude.
 * @param poiLat - POI latitude.
 * @returns Score between 0 and 1.3.
 */
export function scoreImage(
  image: MapillaryImage,
  poiLon: number,
  poiLat: number,
): number {
  const [imgLon, imgLat] = image.computed_geometry.coordinates;
  const bearing = computeBearing(imgLon, imgLat, poiLon, poiLat);
  const angleDelta = Math.abs(normalizeAngle(bearing - image.compass_angle));
  const angleScore = 1 - angleDelta / 180;
  const panoBonus = image.is_pano ? 0.3 : 0;
  return angleScore + panoBonus;
}

/**
 * Queries the Mapillary API for the best street-level image near a location.
 *
 * @param latitude - POI latitude.
 * @param longitude - POI longitude.
 * @param token - Mapillary access token.
 * @param bboxOffset - Half-size of the bounding box in degrees.
 * @returns Best image result, or null if none found.
 */
export async function findBestMapillaryImage(
  latitude: number,
  longitude: number,
  token: string,
  bboxOffset: number = DEFAULT_BBOX_OFFSET,
): Promise<MapillaryResult | null> {
  const bbox = [
    longitude - bboxOffset,
    latitude - bboxOffset,
    longitude + bboxOffset,
    latitude + bboxOffset,
  ].join(",");

  const url =
    `https://graph.mapillary.com/images?access_token=${token}` +
    `&fields=id,computed_geometry,compass_angle,is_pano,captured_at,thumb_1024_url` +
    `&bbox=${bbox}&limit=20`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { data: MapillaryImage[] };
  if (!data.data || data.data.length === 0) return null;

  let bestImage = data.data[0];
  let bestScore = scoreImage(bestImage, longitude, latitude);

  for (let j = 1; j < data.data.length; j++) {
    const score = scoreImage(data.data[j], longitude, latitude);
    if (score > bestScore) {
      bestScore = score;
      bestImage = data.data[j];
    }
  }

  const [imgLon, imgLat] = bestImage.computed_geometry.coordinates;
  const bearing = computeBearing(imgLon, imgLat, longitude, latitude);

  return {
    mapillaryId: bestImage.id,
    bearing,
    isPano: bestImage.is_pano,
    thumbUrl: bestImage.thumb_1024_url,
  };
}
