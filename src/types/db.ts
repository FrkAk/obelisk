import type { InferInsertModel } from "drizzle-orm";
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
  transportProfiles,
  educationProfiles,
  healthProfiles,
  sportsProfiles,
  servicesProfiles,
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
// Drizzle inferred types — Insert (server-only, used for DB writes)
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
export type NewArchitectureProfile = InferInsertModel<
  typeof architectureProfiles
>;
export type NewNatureProfile = InferInsertModel<typeof natureProfiles>;
export type NewArtCultureProfile = InferInsertModel<typeof artCultureProfiles>;
export type NewNightlifeProfile = InferInsertModel<typeof nightlifeProfiles>;
export type NewShoppingProfile = InferInsertModel<typeof shoppingProfiles>;
export type NewViewpointProfile = InferInsertModel<typeof viewpointProfiles>;
export type NewTransportProfile = InferInsertModel<typeof transportProfiles>;
export type NewEducationProfile = InferInsertModel<typeof educationProfiles>;
export type NewHealthProfile = InferInsertModel<typeof healthProfiles>;
export type NewSportsProfile = InferInsertModel<typeof sportsProfiles>;
export type NewServicesProfile = InferInsertModel<typeof servicesProfiles>;
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
