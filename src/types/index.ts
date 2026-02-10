import { z } from "zod";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  regions,
  categories,
  pois,
  contactInfo,
  priceInfo,
  accessibilityInfo,
  photos,
  tags,
  poiTags,
  foodProfiles,
  historyProfiles,
  architectureProfiles,
  natureProfiles,
  artCultureProfiles,
  nightlifeProfiles,
  shoppingProfiles,
  viewpointProfiles,
  cuisines,
  poiCuisines,
  dishes,
  poiDishes,
  poiTranslations,
  remarks,
  events,
  enrichmentLog,
  users,
  authProviders,
  userPreferences,
  userSavedPois,
  userVisits,
  userSessions,
  businessAccounts,
  adCampaigns,
  adImpressions,
  userEngagement,
  recommendations,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Drizzle inferred types — Select
// ---------------------------------------------------------------------------

export type Region = InferSelectModel<typeof regions>;
export type Category = InferSelectModel<typeof categories>;
export type Poi = InferSelectModel<typeof pois>;
export type ContactInfo = InferSelectModel<typeof contactInfo>;
export type PriceInfo = InferSelectModel<typeof priceInfo>;
export type AccessibilityInfo = InferSelectModel<typeof accessibilityInfo>;
export type Photo = InferSelectModel<typeof photos>;
export type Tag = InferSelectModel<typeof tags>;
export type PoiTag = InferSelectModel<typeof poiTags>;
export type FoodProfile = InferSelectModel<typeof foodProfiles>;
export type HistoryProfile = InferSelectModel<typeof historyProfiles>;
export type ArchitectureProfile = InferSelectModel<typeof architectureProfiles>;
export type NatureProfile = InferSelectModel<typeof natureProfiles>;
export type ArtCultureProfile = InferSelectModel<typeof artCultureProfiles>;
export type NightlifeProfile = InferSelectModel<typeof nightlifeProfiles>;
export type ShoppingProfile = InferSelectModel<typeof shoppingProfiles>;
export type ViewpointProfile = InferSelectModel<typeof viewpointProfiles>;
export type Cuisine = InferSelectModel<typeof cuisines>;
export type PoiCuisine = InferSelectModel<typeof poiCuisines>;
export type Dish = InferSelectModel<typeof dishes>;
export type PoiDish = InferSelectModel<typeof poiDishes>;
export type PoiTranslation = InferSelectModel<typeof poiTranslations>;
export type Remark = InferSelectModel<typeof remarks>;
export type Event = InferSelectModel<typeof events>;
export type EnrichmentLogEntry = InferSelectModel<typeof enrichmentLog>;
export type User = InferSelectModel<typeof users>;
export type AuthProvider = InferSelectModel<typeof authProviders>;
export type UserPreference = InferSelectModel<typeof userPreferences>;
export type UserSavedPoi = InferSelectModel<typeof userSavedPois>;
export type UserVisit = InferSelectModel<typeof userVisits>;
export type UserSession = InferSelectModel<typeof userSessions>;
export type BusinessAccount = InferSelectModel<typeof businessAccounts>;
export type AdCampaign = InferSelectModel<typeof adCampaigns>;
export type AdImpression = InferSelectModel<typeof adImpressions>;
export type UserEngagement = InferSelectModel<typeof userEngagement>;
export type Recommendation = InferSelectModel<typeof recommendations>;

// ---------------------------------------------------------------------------
// Drizzle inferred types — Insert
// ---------------------------------------------------------------------------

export type NewRegion = InferInsertModel<typeof regions>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewPoi = InferInsertModel<typeof pois>;
export type NewContactInfo = InferInsertModel<typeof contactInfo>;
export type NewPriceInfo = InferInsertModel<typeof priceInfo>;
export type NewAccessibilityInfo = InferInsertModel<typeof accessibilityInfo>;
export type NewPhoto = InferInsertModel<typeof photos>;
export type NewTag = InferInsertModel<typeof tags>;
export type NewPoiTag = InferInsertModel<typeof poiTags>;
export type NewFoodProfile = InferInsertModel<typeof foodProfiles>;
export type NewHistoryProfile = InferInsertModel<typeof historyProfiles>;
export type NewArchitectureProfile = InferInsertModel<typeof architectureProfiles>;
export type NewNatureProfile = InferInsertModel<typeof natureProfiles>;
export type NewArtCultureProfile = InferInsertModel<typeof artCultureProfiles>;
export type NewNightlifeProfile = InferInsertModel<typeof nightlifeProfiles>;
export type NewShoppingProfile = InferInsertModel<typeof shoppingProfiles>;
export type NewViewpointProfile = InferInsertModel<typeof viewpointProfiles>;
export type NewCuisine = InferInsertModel<typeof cuisines>;
export type NewPoiCuisine = InferInsertModel<typeof poiCuisines>;
export type NewDish = InferInsertModel<typeof dishes>;
export type NewPoiDish = InferInsertModel<typeof poiDishes>;
export type NewPoiTranslation = InferInsertModel<typeof poiTranslations>;
export type NewRemark = InferInsertModel<typeof remarks>;
export type NewEvent = InferInsertModel<typeof events>;
export type NewEnrichmentLogEntry = InferInsertModel<typeof enrichmentLog>;
export type NewUser = InferInsertModel<typeof users>;
export type NewAuthProvider = InferInsertModel<typeof authProviders>;
export type NewUserPreference = InferInsertModel<typeof userPreferences>;
export type NewUserSavedPoi = InferInsertModel<typeof userSavedPois>;
export type NewUserVisit = InferInsertModel<typeof userVisits>;
export type NewUserSession = InferInsertModel<typeof userSessions>;
export type NewBusinessAccount = InferInsertModel<typeof businessAccounts>;
export type NewAdCampaign = InferInsertModel<typeof adCampaigns>;
export type NewAdImpression = InferInsertModel<typeof adImpressions>;
export type NewUserEngagement = InferInsertModel<typeof userEngagement>;
export type NewRecommendation = InferInsertModel<typeof recommendations>;

// ---------------------------------------------------------------------------
// Composite types (POI with related data)
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
// Geo types (unchanged)
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
