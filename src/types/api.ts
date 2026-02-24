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

export interface PriceInfo {
  poiId: string;
  priceLevel: number | null;
  freeEntry: boolean | null;
  admissionAdult: string | null;
  admissionChild: string | null;
  admissionStudent: string | null;
  currency: string | null;
  notes: string | null;
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

export interface FoodProfile {
  poiId: string;
  establishmentType: string | null;
  dineIn: boolean | null;
  takeaway: boolean | null;
  delivery: boolean | null;
  driveThrough: boolean | null;
  catering: boolean | null;
  servesBreakfast: boolean | null;
  servesBrunch: boolean | null;
  servesLunch: boolean | null;
  servesDinner: boolean | null;
  servesLateNight: boolean | null;
  dietVegetarian: string | null;
  dietVegan: string | null;
  dietHalal: string | null;
  dietKosher: string | null;
  dietGlutenFree: string | null;
  dietLactoseFree: string | null;
  dietPescetarian: string | null;
  alcoholPolicy: string | null;
  servesBeer: boolean | null;
  servesWine: boolean | null;
  servesCocktails: boolean | null;
  priceLevel: number | null;
  priceRangeLow: string | null;
  priceRangeHigh: string | null;
  priceCurrency: string | null;
  ambiance: string | null;
  noiseLevel: string | null;
  dressCode: string | null;
  vibe: string | null;
  capacityIndoor: number | null;
  capacityOutdoor: number | null;
  hasOutdoorSeating: boolean | null;
  hasBarSeating: boolean | null;
  hasCommunalTables: boolean | null;
  hasPrivateDining: boolean | null;
  reservationPolicy: string | null;
  reservationUrl: string | null;
  timeLimitMinutes: number | null;
  michelinStars: number | null;
  michelinBib: boolean | null;
  kidFriendly: boolean | null;
  hasHighchair: boolean | null;
  hasKidsMenu: boolean | null;
  hasChangingTable: boolean | null;
  hasWifi: boolean | null;
  hasAirConditioning: boolean | null;
  hasLiveMusic: boolean | null;
  hasParking: boolean | null;
  smokingPolicy: string | null;
  paymentMethods: Record<string, boolean> | null;
  cashOnly: boolean | null;
  tippingPolicy: string | null;
  autoGratuity: boolean | null;
  autoGratuityPct: number | null;
  warnings: string[] | null;
  goodForGroups: boolean | null;
  maxPartySize: number | null;
  kitchenHours: string | null;
  confidenceScore: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface HistoryProfile {
  poiId: string;
  subtype: string | null;
  yearBuilt: number | null;
  yearDestroyed: number | null;
  historicalSignificance: string | null;
  keyFigures: string[] | null;
  keyEvents: string[] | null;
  originalPurpose: string | null;
  currentUse: string | null;
  heritageLevel: string | null;
  inscription: string | null;
  constructionMaterials: string[] | null;
  preservationStatus: string | null;
  confidenceScore: number | null;
}

export interface ArchitectureProfile {
  poiId: string;
  subtype: string | null;
  primaryStyle: string | null;
  architect: string | null;
  yearBuilt: number | null;
  yearRenovated: number | null;
  heightMeters: string | null;
  buildingLevels: number | null;
  constructionMaterials: string[] | null;
  interiorHighlights: string[] | null;
  denomination: string | null;
  isActiveWorship: boolean | null;
  towerAccessible: boolean | null;
  notableFeatures: string | null;
  bestPhotoAngle: string | null;
  confidenceScore: number | null;
}

export interface NatureProfile {
  poiId: string;
  subtype: string | null;
  areaHectares: string | null;
  trailLengthKm: string | null;
  trailDifficulty: string | null;
  elevationGainM: number | null;
  floraHighlights: string[] | null;
  wildlifeHighlights: string[] | null;
  facilities: string[] | null;
  picnicAllowed: boolean | null;
  swimmingAllowed: boolean | null;
  cyclingAllowed: boolean | null;
  litAtNight: boolean | null;
  notableFeatures: string | null;
  entryPoints: string[] | null;
  confidenceScore: number | null;
}

export interface ArtCultureProfile {
  poiId: string;
  subtype: string | null;
  collectionFocus: string | null;
  notableWorks: string[] | null;
  hasPermanentCollection: boolean | null;
  hasRotatingExhibitions: boolean | null;
  guidedTours: boolean | null;
  audioGuide: boolean | null;
  photographyAllowed: boolean | null;
  avgVisitMinutes: number | null;
  genreFocus: string | null;
  capacity: number | null;
  notablePerformers: string[] | null;
  foundedYear: number | null;
  vibe: string | null;
  confidenceScore: number | null;
}

export interface NightlifeProfile {
  poiId: string;
  subtype: string | null;
  signatureDrinks: string[] | null;
  dressCode: string | null;
  coverCharge: string | null;
  coverCurrency: string | null;
  happyHour: string | null;
  peakHours: string | null;
  ageDemographic: string | null;
  hasDancefloor: boolean | null;
  hasLiveMusic: boolean | null;
  hasDj: boolean | null;
  outdoorArea: boolean | null;
  smokingArea: boolean | null;
  capacity: number | null;
  foodServed: boolean | null;
  vibe: string | null;
  confidenceScore: number | null;
}

export interface ShoppingProfile {
  poiId: string;
  subtype: string | null;
  productHighlights: string[] | null;
  brands: string[] | null;
  isSecondhand: boolean | null;
  isLocalCrafts: boolean | null;
  isLuxury: boolean | null;
  marketDays: string | null;
  cashOnly: boolean | null;
  vibe: string | null;
  confidenceScore: number | null;
}

export interface ViewpointProfile {
  poiId: string;
  subtype: string | null;
  elevationM: string | null;
  viewDirection: string | null;
  visibleLandmarks: string[] | null;
  bestTime: string | null;
  weatherDependent: boolean | null;
  indoorViewing: boolean | null;
  telescopeAvailable: boolean | null;
  requiresClimb: boolean | null;
  stepsCount: number | null;
  photographyTips: string | null;
  crowdLevel: string | null;
  confidenceScore: number | null;
}

export interface TransportProfile {
  poiId: string;
  subtype: string | null;
  lines: string[] | null;
  operator: string | null;
  yearOpened: number | null;
  dailyRidership: number | null;
  isInterchange: boolean | null;
  hasElevator: boolean | null;
  hasBikeParking: boolean | null;
  notableFeatures: string | null;
  nearbyConnections: string[] | null;
  confidenceScore: number | null;
}

export interface EducationProfile {
  poiId: string;
  subtype: string | null;
  foundedYear: number | null;
  specialization: string | null;
  notableAlumni: string[] | null;
  studentCount: number | null;
  isPublic: boolean | null;
  hasPublicAccess: boolean | null;
  hasLibrary: boolean | null;
  architecturalNote: string | null;
  notableFeatures: string | null;
  confidenceScore: number | null;
}

export interface HealthProfile {
  poiId: string;
  subtype: string | null;
  specialization: string | null;
  foundedYear: number | null;
  isEmergency: boolean | null;
  acceptsInsurance: boolean | null;
  hasAppointmentBooking: boolean | null;
  spokenLanguages: string[] | null;
  facilities: string[] | null;
  notableFeatures: string | null;
  vibe: string | null;
  confidenceScore: number | null;
}

export interface SportsProfile {
  poiId: string;
  subtype: string | null;
  sports: string[] | null;
  homeTeam: string | null;
  capacity: number | null;
  yearBuilt: number | null;
  isPublicAccess: boolean | null;
  hasEquipmentRental: boolean | null;
  hasCoaching: boolean | null;
  notableEvents: string[] | null;
  notableFeatures: string | null;
  vibe: string | null;
  confidenceScore: number | null;
}

export interface ServicesProfile {
  poiId: string;
  subtype: string | null;
  serviceType: string | null;
  operator: string | null;
  foundedYear: number | null;
  hasOnlineBooking: boolean | null;
  spokenLanguages: string[] | null;
  waitTimeNote: string | null;
  historicalNote: string | null;
  notableFeatures: string | null;
  confidenceScore: number | null;
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

export type PoiWithProfile = Poi & {
  category: Category;
  contactInfo: ContactInfo | null;
  priceInfo: PriceInfo | null;
  accessibilityInfo: AccessibilityInfo | null;
  foodProfile: FoodProfile | null;
  historyProfile: HistoryProfile | null;
  architectureProfile: ArchitectureProfile | null;
  natureProfile: NatureProfile | null;
  artCultureProfile: ArtCultureProfile | null;
  nightlifeProfile: NightlifeProfile | null;
  shoppingProfile: ShoppingProfile | null;
  viewpointProfile: ViewpointProfile | null;
  transportProfile: TransportProfile | null;
  educationProfile: EducationProfile | null;
  healthProfile: HealthProfile | null;
  sportsProfile: SportsProfile | null;
  servicesProfile: ServicesProfile | null;
};

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

export const dietaryTristateSchema = z
  .enum(["yes", "no", "only"])
  .nullable()
  .optional();

export const priceRangeSchema = z
  .enum(["$", "$$", "$$$", "$$$$"])
  .nullable()
  .optional();

export const explorationStyleSchema = z
  .enum(["adventurous", "comfort", "balanced"])
  .nullable()
  .optional();

export const foodProfileInputSchema = z.object({
  establishmentType: z.string().max(30).nullable().optional(),
  dineIn: z.boolean().nullable().optional(),
  takeaway: z.boolean().nullable().optional(),
  delivery: z.boolean().nullable().optional(),
  driveThrough: z.boolean().nullable().optional(),
  catering: z.boolean().nullable().optional(),
  servesBreakfast: z.boolean().nullable().optional(),
  servesBrunch: z.boolean().nullable().optional(),
  servesLunch: z.boolean().nullable().optional(),
  servesDinner: z.boolean().nullable().optional(),
  servesLateNight: z.boolean().nullable().optional(),
  dietVegetarian: dietaryTristateSchema,
  dietVegan: dietaryTristateSchema,
  dietHalal: dietaryTristateSchema,
  dietKosher: dietaryTristateSchema,
  dietGlutenFree: dietaryTristateSchema,
  dietLactoseFree: dietaryTristateSchema,
  dietPescetarian: dietaryTristateSchema,
  alcoholPolicy: z.string().max(20).nullable().optional(),
  servesBeer: z.boolean().nullable().optional(),
  servesWine: z.boolean().nullable().optional(),
  servesCocktails: z.boolean().nullable().optional(),
  priceLevel: z.number().int().min(1).max(4).nullable().optional(),
  priceRangeLow: z.string().nullable().optional(),
  priceRangeHigh: z.string().nullable().optional(),
  priceCurrency: z.string().max(3).nullable().optional(),
  ambiance: z.string().max(20).nullable().optional(),
  noiseLevel: z.string().max(10).nullable().optional(),
  dressCode: z.string().max(20).nullable().optional(),
  vibe: z.string().nullable().optional(),
  capacityIndoor: z.number().int().nullable().optional(),
  capacityOutdoor: z.number().int().nullable().optional(),
  hasOutdoorSeating: z.boolean().nullable().optional(),
  hasBarSeating: z.boolean().nullable().optional(),
  hasCommunalTables: z.boolean().nullable().optional(),
  hasPrivateDining: z.boolean().nullable().optional(),
  reservationPolicy: z.string().max(20).nullable().optional(),
  reservationUrl: z.string().url().nullable().optional(),
  timeLimitMinutes: z.number().int().nullable().optional(),
  michelinStars: z.number().int().min(0).max(3).nullable().optional(),
  michelinBib: z.boolean().nullable().optional(),
  kidFriendly: z.boolean().nullable().optional(),
  hasHighchair: z.boolean().nullable().optional(),
  hasKidsMenu: z.boolean().nullable().optional(),
  hasChangingTable: z.boolean().nullable().optional(),
  hasWifi: z.boolean().nullable().optional(),
  hasAirConditioning: z.boolean().nullable().optional(),
  hasLiveMusic: z.boolean().nullable().optional(),
  hasParking: z.boolean().nullable().optional(),
  smokingPolicy: z.string().max(15).nullable().optional(),
  paymentMethods: z.record(z.string(), z.boolean()).nullable().optional(),
  cashOnly: z.boolean().nullable().optional(),
  tippingPolicy: z.string().max(20).nullable().optional(),
  autoGratuity: z.boolean().nullable().optional(),
  autoGratuityPct: z.number().int().nullable().optional(),
  warnings: z.array(z.string()).nullable().optional(),
  goodForGroups: z.boolean().nullable().optional(),
  maxPartySize: z.number().int().nullable().optional(),
  kitchenHours: z.string().nullable().optional(),
  confidenceScore: z.number().int().min(0).max(100).nullable().optional(),
});

export type FoodProfileInput = z.infer<typeof foodProfileInputSchema>;

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
