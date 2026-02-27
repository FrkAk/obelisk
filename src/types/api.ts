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
  keywords: string[];
  products: string[];
  summary: string;
  enrichmentSource: string;
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
  searchVector: string | null;
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
  openingHoursDisplay: string | null;
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

export interface Dish {
  id: string;
  slug: string;
  name: string;
  nameLocal: string | null;
  nameLocalLang: string | null;
  description: string | null;
  cuisineId: string | null;
  menuSection: string | null;
  isVegetarian: boolean | null;
  isVegan: boolean | null;
  isGlutenFree: boolean | null;
  containsNuts: boolean | null;
  containsDairy: boolean | null;
  containsPork: boolean | null;
  containsAlcohol: boolean | null;
  isHalal: boolean | null;
  isKosher: boolean | null;
  spicyLevel: number | null;
  imageUrl: string | null;
  createdAt: Date | null;
}

export interface PoiDish {
  id: string;
  poiId: string;
  dishId: string;
  localName: string | null;
  localDescription: string | null;
  price: string | null;
  currency: string | null;
  menuSection: string | null;
  isSignature: boolean | null;
  isPopular: boolean | null;
  isSeasonal: boolean | null;
  isAvailable: boolean | null;
  seasonNote: string | null;
  source: string;
  sourceUrl: string | null;
  confidence: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
  audioUrl: string | null;
  modelId: string | null;
  confidence: string | null;
  contextSources: Record<string, unknown> | null;
  searchVector: string | null;
  createdAt: Date | null;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean | null;
  displayName: string;
  avatarUrl: string | null;
  locale: string | null;
  timezone: string | null;
  role: string | null;
  lastActiveAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface UserPreference {
  userId: string;
  favoriteCategories: string[] | null;
  cuisinePreferences: string[] | null;
  priceRange: string | null;
  dietaryNeeds: string[] | null;
  explorationStyle: string | null;
  maxWalkDistance: number | null;
  notificationEnabled: boolean | null;
  storyLanguage: string | null;
  updatedAt: Date | null;
}

export interface UserSavedPoi {
  id: string;
  userId: string;
  poiId: string;
  note: string | null;
  createdAt: Date | null;
}

export interface UserVisit {
  id: string;
  userId: string;
  poiId: string;
  visitedAt: Date | null;
  durationSec: number | null;
  source: string | null;
}

export interface BusinessAccount {
  id: string;
  userId: string;
  businessName: string;
  poiId: string | null;
  contactEmail: string;
  contactPhone: string | null;
  billingAddress: string | null;
  taxId: string | null;
  status: string | null;
  verifiedAt: Date | null;
  createdAt: Date | null;
}

export interface AdCampaign {
  id: string;
  businessId: string;
  poiId: string;
  name: string;
  campaignType: string;
  status: string | null;
  pricingModel: string;
  bidAmount: number;
  dailyBudget: number | null;
  totalBudget: number;
  spentAmount: number | null;
  targetRadiusM: number | null;
  targetCategories: string[] | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date | null;
}

export interface UserEngagement {
  id: string;
  userId: string;
  poiId: string | null;
  remarkId: string | null;
  eventType: string;
  dwellTimeSec: number | null;
  scrollDepth: number | null;
  createdAt: Date | null;
}

export interface Recommendation {
  id: string;
  userId: string;
  poiId: string;
  score: number;
  reason: string | null;
  campaignId: string | null;
  expiresAt: Date;
  served: boolean | null;
  servedAt: Date | null;
  createdAt: Date | null;
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
  hasStory: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  remark?: Remark & { poi: Poi & { category?: Category } };
  source: "typesense" | "semantic";
}

export interface SearchResponse {
  results: SearchResult[];
  intent: ParsedIntent;
  timing: {
    parseMs: number;
    typesenseMs: number;
    semanticMs: number;
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
  history: "#FF6B4A",
  food: "#FF9F9F",
  art: "#BF5AF2",
  nature: "#34C759",
  architecture: "#5AC8FA",
  hidden: "#FFD60A",
  views: "#64D2FF",
  culture: "#5E5CE6",
  shopping: "#FF8A65",
  nightlife: "#CE93D8",
  sports: "#4CAF50",
  health: "#EF5350",
  transport: "#78909C",
  education: "#FFAB40",
  services: "#A1887F",
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
