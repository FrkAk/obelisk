import type { InferInsertModel } from "drizzle-orm";
import type {
  regions,
  categories,
  pois,
  contactInfo,
  accessibilityInfo,
  tags,
  poiTags,
  cuisines,
  poiCuisines,
  remarks,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Drizzle inferred types — Insert (server-only, used for DB writes)
// ---------------------------------------------------------------------------

export type NewRegion = InferInsertModel<typeof regions>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewPoi = InferInsertModel<typeof pois>;
export type NewContactInfo = InferInsertModel<typeof contactInfo>;
export type NewAccessibilityInfo = InferInsertModel<typeof accessibilityInfo>;
export type NewTag = InferInsertModel<typeof tags>;
export type NewPoiTag = InferInsertModel<typeof poiTags>;
export type NewCuisine = InferInsertModel<typeof cuisines>;
export type NewPoiCuisine = InferInsertModel<typeof poiCuisines>;
export type NewRemark = InferInsertModel<typeof remarks>;
