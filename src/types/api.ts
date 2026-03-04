// ---------------------------------------------------------------------------
// Select types — plain interfaces, NO Drizzle imports.
// These are the API contract for any client (React, React Native, Flutter).
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface PoiProfile {
  subtype?: string;
  osmExtracted?: Record<string, string>;
  wikipediaSummary?: string;
  websiteText?: string;
  keywords: string[];
  products: string[];
  summary: string;
  enrichmentSource: string;
  enrichedAt?: string;
  dataTier?: "rich" | "moderate" | "thin";
  attributes: Record<string, unknown>;
}

export interface Poi {
  id: string;
  osmId: number | null;
  name: string;
  categoryId: string | null;
  regionId: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  locale: string;
  osmType: string | null;
  osmTags: Record<string, string> | null;
  profile: PoiProfile | null;
  wikipediaUrl: string | null;
  imageUrl: string | null;
  embedding: number[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ContactInfo {
  poiId: string;
  phone: string[] | null;
  email: string[] | null;
  website: string[] | null;
  bookingUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  openingHoursRaw: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  group: string;
  displayOrder: number | null;
}

export interface Cuisine {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  parentSlug: string | null;
  icon: string | null;
}

export interface Remark {
  id: string;
  poiId: string;
  locale: string | null;
  version: number;
  isCurrent: boolean | null;
  title: string;
  teaser: string | null;
  content: string;
  localTip: string | null;
  durationSeconds: number | null;
  modelId: string | null;
  confidence: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Composite types
// ---------------------------------------------------------------------------

export type PoiWithCategory = Poi & { category?: Category };

export interface SearchFilters {
  outdoor?: boolean;
  budget?: number;
  partySize?: number;
  openNow?: boolean;
  wifi?: boolean;
  quiet?: boolean;
  wheelchair?: boolean;
  dogFriendly?: boolean;
  freeEntry?: boolean;
  parking?: boolean;
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
}

export interface ParsedIntent {
  category?: CategorySlug;
  keywords: string[];
  cuisineTypes?: string[];
  filters: SearchFilters;
  isDiscovery?: boolean;
  source?: "fast-path" | "classifier" | "default";
}

export interface SearchResult {
  id: string;
  osmId?: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance?: number;
  score: number;
  address?: string;
  description?: string;
  cuisine?: string;
  amenityType?: string;
  hasRemark: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  placeType?: string;
  remark?: Remark & { poi: Poi & { category?: Category } };
  source: "typesense" | "semantic" | "geocoding";
}

export interface SearchResponse {
  results: SearchResult[];
  intent: ParsedIntent;
  timing: {
    parseMs: number;
    typesenseMs: number;
    semanticMs: number;
    geocodingMs: number;
    totalMs: number;
  };
}

export interface SearchRequest {
  query: string;
  location: SearchLocation;
  radius?: number;
  limit?: number;
}

export interface ViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ViewportContext {
  center: SearchLocation;
  bounds: ViewportBounds;
  zoom: number;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address?: {
    amenity?: string;
    road?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox: string[];
}

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface ExternalPOI {
  id: string;
  osmId: number;
  osmType: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance?: number;
  address?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  cuisine?: string;
  hasWifi?: boolean;
  hasOutdoorSeating?: boolean;
  imageUrl?: string;
  wikipediaUrl?: string;
  extraTags?: Record<string, string>;
  source: "nominatim" | "overpass";
}

export interface ExternalResult {
  type: "external";
  poi: ExternalPOI;
  nearbyRemark?: Remark & { poi: Poi & { category?: Category } };
  distance?: number;
  score: number;
}

export type SearchStage = "idle" | "parsing" | "searching";

// ---------------------------------------------------------------------------
// Category slug union
// ---------------------------------------------------------------------------

export type CategorySlug =
  | "history"
  | "food"
  | "art"
  | "nature"
  | "architecture"
  | "hidden"
  | "views"
  | "culture"
  | "shopping"
  | "nightlife"
  | "sports"
  | "health"
  | "transport"
  | "education"
  | "services";

// ---------------------------------------------------------------------------
// Geo types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CATEGORY_COLORS: Record<CategorySlug, string> = {
  history: "#8B8680",
  architecture: "#8B8680",
  culture: "#8B8680",
  education: "#8B8680",
  food: "#A89080",
  nightlife: "#A89080",
  shopping: "#A89080",
  nature: "#7A8B7A",
  views: "#7A8B7A",
  sports: "#7A8B7A",
  health: "#7A8B7A",
  art: "#C49A6C",
  hidden: "#C49A6C",
  transport: "#8890A0",
  services: "#8890A0",
};

export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  preloadRadius: 500,
  queueRadius: 100,
  triggerRadius: 50,
  cooldownMs: 2 * 60 * 1000,
  maxNotificationsPerSession: 5,
  sessionDurationMs: 30 * 60 * 1000,
};

// TODO: derive from seeded location for multi-city support
export const MUNICH_CENTER = {
  latitude: 48.137154,
  longitude: 11.576124,
};
