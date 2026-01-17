export type CategorySlug =
  | "history"
  | "food"
  | "art"
  | "nature"
  | "architecture"
  | "hidden"
  | "views"
  | "culture";

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  icon: string;
  color: string;
}

export interface Poi {
  id: string;
  osmId: number | null;
  name: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  address: string | null;
  wikipediaUrl: string | null;
  imageUrl: string | null;
  osmTags: Record<string, string> | null;
  createdAt: Date;
  category?: Category;
}

export interface Remark {
  id: string;
  poiId: string;
  title: string;
  teaser: string | null;
  content: string;
  localTip: string | null;
  durationSeconds: number;
  audioUrl: string | null;
  createdAt: Date;
  poi?: Poi;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeofenceConfig {
  preloadRadius: number;
  queueRadius: number;
  triggerRadius: number;
  cooldownMs: number;
  maxNotificationsPerSession: number;
  sessionDurationMs: number;
}

export const CATEGORY_COLORS: Record<CategorySlug, string> = {
  history: "#FF6B4A",
  food: "#FF9F9F",
  art: "#BF5AF2",
  nature: "#34C759",
  architecture: "#5AC8FA",
  hidden: "#FFD60A",
  views: "#64D2FF",
  culture: "#5E5CE6",
};

export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  preloadRadius: 500,
  queueRadius: 100,
  triggerRadius: 50,
  cooldownMs: 2 * 60 * 1000,
  maxNotificationsPerSession: 5,
  sessionDurationMs: 30 * 60 * 1000,
};

export const MUNICH_CENTER = {
  latitude: 48.137154,
  longitude: 11.576124,
};
