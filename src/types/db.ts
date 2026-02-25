import type { InferInsertModel } from "drizzle-orm";
import type {
  regions,
  categories,
  pois,
  contactInfo,
  accessibilityInfo,
  photos,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
  dishes,
  poiDishes,
  poiTranslations,
  remarks,
  events,
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
export type NewAccessibilityInfo = InferInsertModel<typeof accessibilityInfo>;
export type NewPhoto = InferInsertModel<typeof photos>;
export type NewTag = InferInsertModel<typeof tags>;
export type NewPoiTag = InferInsertModel<typeof poiTags>;
export type NewCuisine = InferInsertModel<typeof cuisines>;
export type NewPoiCuisine = InferInsertModel<typeof poiCuisines>;
export type NewDish = InferInsertModel<typeof dishes>;
export type NewPoiDish = InferInsertModel<typeof poiDishes>;
export type NewPoiTranslation = InferInsertModel<typeof poiTranslations>;
export type NewRemark = InferInsertModel<typeof remarks>;
export type NewEvent = InferInsertModel<typeof events>;
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
