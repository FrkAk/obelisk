/**
 * Shared map constants for consistent defaults across the application.
 */

export const DEFAULT_MAP_CENTER = {
  longitude: 11.576,
  latitude: 48.137,
} as const;

export const DEFAULT_MAP_ZOOM = 15;

export const MUNICH_BOUNDS = {
  north: 48.2,
  south: 48.1,
  east: 11.65,
  west: 11.5,
} as const;

export const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
