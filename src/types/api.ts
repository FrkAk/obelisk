import { z } from "zod";

// ---------------------------------------------------------------------------
// Select types — plain interfaces, NO Drizzle imports.
// These are the API contract for any client (React, React Native, Flutter).
// ---------------------------------------------------------------------------

export interface Region {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  parentId: string | null;
  locale: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
  createdAt: Date | null;
}

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

export interface AccessibilityInfo {
  poiId: string;
  wheelchair: boolean | null;
  elevator: boolean | null;
  accessibleRestroom: boolean | null;
  strollerFriendly: boolean | null;
  dogFriendly: boolean | null;
  parkingAvailable: boolean | null;
  notes: string | null;
}

export interface Photo {
  id: string;
  poiId: string;
  url: string;
  caption: string | null;
  source: string | null;
  isPrimary: boolean | null;
  sortOrder: number | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  group: string;
  displayOrder: number | null;
}

export interface PoiTag {
  poiId: string;
  tagId: string;
}

export interface Cuisine {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  parentSlug: string | null;
  icon: string | null;
}

export interface PoiCuisine {
  poiId: string;
  cuisineId: string;
  isPrimary: boolean | null;
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

export interface PoiTranslation {
  id: string;
  poiId: string;
  locale: string;
  name: string | null;
  description: string | null;
  reviewSummary: string | null;
  searchVector: string | null;
  source: string | null;
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

export interface Event {
  id: string;
  poiId: string;
  title: string;
  description: string | null;
  eventType: string | null;
  startDate: string | null;
  endDate: string | null;
  recurring: string | null;
  ticketPrice: string | null;
  isFree: boolean | null;
  source: string | null;
  createdAt: Date | null;
}

export interface EnrichmentLogEntry {
  id: string;
  poiId: string;
  source: string;
  status: string;
  fieldsUpdated: string[] | null;
  metadata: Record<string, unknown> | null;
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

export interface AuthProvider {
  id: string;
  userId: string;
  provider: string;
  providerId: string;
  passwordHash: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  createdAt: Date | null;
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

export interface UserSession {
  id: string;
  userId: string;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSec: number | null;
  deviceType: string | null;
  appVersion: string | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
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

export interface AdImpression {
  id: string;
  campaignId: string;
  userId: string | null;
  eventType: string;
  placement: string;
  costCents: number | null;
  latitude: number | null;
  longitude: number | null;
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

export type PoiWithCategory = Poi & { category: Category };

export type RemarkWithPoi = Remark & { poi: Poi & { category?: Category } };

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
// Zod schemas
// ---------------------------------------------------------------------------

export const priceRangeSchema = z
  .enum(["$", "$$", "$$$", "$$$$"])
  .nullable()
  .optional();

export const explorationStyleSchema = z
  .enum(["adventurous", "comfort", "balanced"])
  .nullable()
  .optional();

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
