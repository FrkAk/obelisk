import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  jsonb,
  timestamp,
  integer,
  doublePrecision,
  index,
  uniqueIndex,
  boolean,
  smallint,
  numeric,
  real,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Custom types
// ---------------------------------------------------------------------------

const vector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    const str = value as string;
    return str.replace(/[\[\]]/g, "").split(",").map(Number);
  },
});

const tsvector = customType<{ data: string; driverParam: string }>({
  dataType() {
    return "tsvector";
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: unknown): string {
    return value as string;
  },
});

// ===========================================================================
// 1. Core Tables
// ===========================================================================

export const regions = pgTable("regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  type: varchar("type", { length: 20 }).notNull(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: uuid("parent_id").references((): any => regions.id),
  locale: varchar("locale", { length: 10 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  timezone: varchar("timezone", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const pois = pgTable(
  "pois",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    osmId: bigint("osm_id", { mode: "number" }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    regionId: uuid("region_id").references(() => regions.id),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    address: text("address"),
    locale: varchar("locale", { length: 10 }).notNull().default("de-DE"),
    osmType: varchar("osm_type", { length: 10 }),
    osmTags: jsonb("osm_tags").$type<Record<string, string>>(),
    wikipediaUrl: text("wikipedia_url"),
    imageUrl: text("image_url"),
    profile: jsonb("profile").default({}).$type<import("@/types/api").PoiProfile>(),
    embedding: vector("embedding"),
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_pois_category").on(table.categoryId),
    index("idx_pois_region").on(table.regionId),
    index("idx_pois_location").on(table.latitude, table.longitude),
    index("idx_pois_locale").on(table.locale),
    index("idx_pois_name_trgm").using("gin", sql`${table.name} gin_trgm_ops`),
    index("idx_pois_search_vector").using("gin", table.searchVector),
  ],
);

// ===========================================================================
// 2. Shared POI Tables (1:1 with pois)
// ===========================================================================

export const contactInfo = pgTable("contact_info", {
  poiId: uuid("poi_id")
    .references(() => pois.id, { onDelete: "cascade" })
    .unique()
    .primaryKey(),
  phone: text("phone").array(),
  email: text("email").array(),
  website: text("website").array(),
  bookingUrl: text("booking_url"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  openingHoursRaw: text("opening_hours_raw"),
  openingHoursDisplay: text("opening_hours_display"),
});

export const accessibilityInfo = pgTable("accessibility_info", {
  poiId: uuid("poi_id")
    .references(() => pois.id, { onDelete: "cascade" })
    .unique()
    .primaryKey(),
  wheelchair: boolean("wheelchair"),
  elevator: boolean("elevator"),
  accessibleRestroom: boolean("accessible_restroom"),
  strollerFriendly: boolean("stroller_friendly"),
  dogFriendly: boolean("dog_friendly"),
  parkingAvailable: boolean("parking_available"),
  notes: text("notes"),
});

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    caption: varchar("caption", { length: 255 }),
    source: varchar("source", { length: 50 }),
    isPrimary: boolean("is_primary"),
    sortOrder: smallint("sort_order"),
  },
  (table) => [index("idx_photos_poi").on(table.poiId)],
);

// ===========================================================================
// 3. Tag System
// ===========================================================================

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  group: varchar("group", { length: 50 }).notNull(),
  displayOrder: smallint("display_order"),
});

export const poiTags = pgTable(
  "poi_tags",
  {
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.poiId, table.tagId] })],
);

// ===========================================================================
// 4. Food Domain Tables
// ===========================================================================

export const cuisines = pgTable("cuisines", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }),
  parentSlug: varchar("parent_slug", { length: 50 }).references(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (): any => cuisines.slug,
  ),
  icon: varchar("icon", { length: 10 }),
});

export const poiCuisines = pgTable(
  "poi_cuisines",
  {
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    cuisineId: uuid("cuisine_id")
      .references(() => cuisines.id, { onDelete: "cascade" })
      .notNull(),
    isPrimary: boolean("is_primary"),
  },
  (table) => [primaryKey({ columns: [table.poiId, table.cuisineId] })],
);

export const dishes = pgTable("dishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  nameLocal: varchar("name_local", { length: 200 }),
  nameLocalLang: varchar("name_local_lang", { length: 5 }),
  description: text("description"),
  cuisineId: uuid("cuisine_id").references(() => cuisines.id),
  menuSection: varchar("menu_section", { length: 30 }),
  isVegetarian: boolean("is_vegetarian"),
  isVegan: boolean("is_vegan"),
  isGlutenFree: boolean("is_gluten_free"),
  containsNuts: boolean("contains_nuts"),
  containsDairy: boolean("contains_dairy"),
  containsPork: boolean("contains_pork"),
  containsAlcohol: boolean("contains_alcohol"),
  isHalal: boolean("is_halal"),
  isKosher: boolean("is_kosher"),
  spicyLevel: smallint("spicy_level"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const poiDishes = pgTable(
  "poi_dishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    dishId: uuid("dish_id")
      .references(() => dishes.id, { onDelete: "cascade" })
      .notNull(),
    localName: varchar("local_name", { length: 200 }),
    localDescription: text("local_description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    menuSection: varchar("menu_section", { length: 30 }),
    isSignature: boolean("is_signature"),
    isPopular: boolean("is_popular"),
    isSeasonal: boolean("is_seasonal"),
    isAvailable: boolean("is_available").default(true),
    seasonNote: varchar("season_note", { length: 100 }),
    source: varchar("source", { length: 20 }).notNull(),
    sourceUrl: text("source_url"),
    confidence: smallint("confidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_poi_dishes_unique").on(table.poiId, table.dishId),
    index("idx_poi_dishes_poi").on(table.poiId),
  ],
);

// ===========================================================================
// 5. Content Tables
// ===========================================================================

export const poiTranslations = pgTable(
  "poi_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    locale: varchar("locale", { length: 10 }).notNull(),
    name: varchar("name", { length: 255 }),
    description: text("description"),
    reviewSummary: text("review_summary"),
    searchVector: tsvector("search_vector"),
    source: varchar("source", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_poi_translations_unique").on(table.poiId, table.locale),
    index("idx_poi_translations_search_vector").using(
      "gin",
      table.searchVector,
    ),
  ],
);

export const remarks = pgTable(
  "remarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    locale: varchar("locale", { length: 10 }),
    version: integer("version").notNull().default(1),
    isCurrent: boolean("is_current").default(true),
    title: varchar("title", { length: 100 }).notNull(),
    teaser: varchar("teaser", { length: 100 }),
    content: text("content").notNull(),
    localTip: text("local_tip"),
    durationSeconds: integer("duration_seconds").default(45),
    audioUrl: text("audio_url"),
    modelId: varchar("model_id", { length: 100 }),
    confidence: varchar("confidence", { length: 10 }),
    contextSources: jsonb("context_sources").$type<Record<string, unknown>>(),
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_remarks_poi_locale_version").on(
      table.poiId,
      table.locale,
      table.version,
    ),
    index("idx_remarks_poi").on(table.poiId),
    index("idx_remarks_search_vector").using("gin", table.searchVector),
    index("idx_remarks_current").on(table.poiId, table.locale).where(sql`is_current = true`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    eventType: varchar("event_type", { length: 50 }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    recurring: varchar("recurring", { length: 100 }),
    ticketPrice: numeric("ticket_price", { precision: 8, scale: 2 }),
    isFree: boolean("is_free"),
    source: varchar("source", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_events_poi").on(table.poiId)],
);

// ===========================================================================
// 6. User Tables
// ===========================================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  locale: varchar("locale", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 50 }),
  role: varchar("role", { length: 20 }).default("user"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const authProviders = pgTable(
  "auth_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: varchar("provider", { length: 20 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_auth_providers_unique").on(
      table.provider,
      table.providerId,
    ),
  ],
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .primaryKey(),
  favoriteCategories: uuid("favorite_categories").array(),
  cuisinePreferences: varchar("cuisine_preferences", { length: 50 }).array(),
  priceRange: varchar("price_range", { length: 10 }),
  dietaryNeeds: varchar("dietary_needs", { length: 50 }).array(),
  explorationStyle: varchar("exploration_style", { length: 20 }),
  maxWalkDistance: integer("max_walk_distance"),
  notificationEnabled: boolean("notification_enabled").default(true),
  storyLanguage: varchar("story_language", { length: 10 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userSavedPois = pgTable(
  "user_saved_pois",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_user_saved_pois_unique").on(table.userId, table.poiId),
  ],
);

export const userVisits = pgTable(
  "user_visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow(),
    durationSec: integer("duration_sec"),
    source: varchar("source", { length: 20 }),
  },
  (table) => [
    index("idx_user_visits_user_date").on(table.userId, table.visitedAt),
  ],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
    deviceType: varchar("device_type", { length: 20 }),
    appVersion: varchar("app_version", { length: 20 }),
    startLatitude: doublePrecision("start_latitude"),
    startLongitude: doublePrecision("start_longitude"),
    endLatitude: doublePrecision("end_latitude"),
    endLongitude: doublePrecision("end_longitude"),
  },
  (table) => [index("idx_user_sessions_user").on(table.userId)],
);

// ===========================================================================
// 8. Monetization Tables
// ===========================================================================

export const businessAccounts = pgTable("business_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  poiId: uuid("poi_id").references(() => pois.id),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 30 }),
  billingAddress: text("billing_address"),
  taxId: varchar("tax_id", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businessAccounts.id, { onDelete: "cascade" })
      .notNull(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    campaignType: varchar("campaign_type", { length: 30 }).notNull(),
    status: varchar("status", { length: 20 }).default("draft"),
    pricingModel: varchar("pricing_model", { length: 10 }).notNull(),
    bidAmount: integer("bid_amount").notNull(),
    dailyBudget: integer("daily_budget"),
    totalBudget: integer("total_budget").notNull(),
    spentAmount: integer("spent_amount").default(0),
    targetRadiusM: integer("target_radius_m"),
    targetCategories: uuid("target_categories").array(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_ad_campaigns_business").on(table.businessId)],
);

export const adImpressions = pgTable(
  "ad_impressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .references(() => adCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 20 }).notNull(),
    placement: varchar("placement", { length: 30 }).notNull(),
    costCents: integer("cost_cents").default(0),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_ad_impressions_campaign").on(table.campaignId),
    index("idx_ad_impressions_user").on(table.userId),
  ],
);

export const userEngagement = pgTable(
  "user_engagement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    poiId: uuid("poi_id").references(() => pois.id, { onDelete: "set null" }),
    remarkId: uuid("remark_id").references(() => remarks.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 20 }).notNull(),
    dwellTimeSec: integer("dwell_time_sec"),
    scrollDepth: real("scroll_depth"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_user_engagement_user").on(table.userId)],
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    poiId: uuid("poi_id")
      .references(() => pois.id, { onDelete: "cascade" })
      .notNull(),
    score: real("score").notNull(),
    reason: varchar("reason", { length: 50 }),
    campaignId: uuid("campaign_id").references(() => adCampaigns.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    served: boolean("served").default(false),
    servedAt: timestamp("served_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_recommendations_unique").on(table.userId, table.poiId),
    index("idx_recommendations_user").on(table.userId),
  ],
);

// ===========================================================================
// Relations
// ===========================================================================

export const regionsRelations = relations(regions, ({ one, many }) => ({
  parent: one(regions, {
    fields: [regions.parentId],
    references: [regions.id],
    relationName: "regionParent",
  }),
  children: many(regions, { relationName: "regionParent" }),
  pois: many(pois),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  pois: many(pois),
}));

export const poisRelations = relations(pois, ({ one, many }) => ({
  category: one(categories, {
    fields: [pois.categoryId],
    references: [categories.id],
  }),
  region: one(regions, {
    fields: [pois.regionId],
    references: [regions.id],
  }),
  contactInfo: one(contactInfo, {
    fields: [pois.id],
    references: [contactInfo.poiId],
  }),
  accessibilityInfo: one(accessibilityInfo, {
    fields: [pois.id],
    references: [accessibilityInfo.poiId],
  }),
  photos: many(photos),
  poiTags: many(poiTags),
  poiCuisines: many(poiCuisines),
  poiDishes: many(poiDishes),
  translations: many(poiTranslations),
  remarks: many(remarks),
  events: many(events),
  userSavedPois: many(userSavedPois),
  userVisits: many(userVisits),
  businessAccounts: many(businessAccounts),
  adCampaigns: many(adCampaigns),
  userEngagement: many(userEngagement),
  recommendations: many(recommendations),
}));

export const contactInfoRelations = relations(contactInfo, ({ one }) => ({
  poi: one(pois, {
    fields: [contactInfo.poiId],
    references: [pois.id],
  }),
}));

export const accessibilityInfoRelations = relations(
  accessibilityInfo,
  ({ one }) => ({
    poi: one(pois, {
      fields: [accessibilityInfo.poiId],
      references: [pois.id],
    }),
  }),
);

export const photosRelations = relations(photos, ({ one }) => ({
  poi: one(pois, {
    fields: [photos.poiId],
    references: [pois.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  poiTags: many(poiTags),
}));

export const poiTagsRelations = relations(poiTags, ({ one }) => ({
  poi: one(pois, {
    fields: [poiTags.poiId],
    references: [pois.id],
  }),
  tag: one(tags, {
    fields: [poiTags.tagId],
    references: [tags.id],
  }),
}));

export const cuisinesRelations = relations(cuisines, ({ one, many }) => ({
  parent: one(cuisines, {
    fields: [cuisines.parentSlug],
    references: [cuisines.slug],
    relationName: "cuisineParent",
  }),
  children: many(cuisines, { relationName: "cuisineParent" }),
  poiCuisines: many(poiCuisines),
  dishes: many(dishes),
}));

export const poiCuisinesRelations = relations(poiCuisines, ({ one }) => ({
  poi: one(pois, {
    fields: [poiCuisines.poiId],
    references: [pois.id],
  }),
  cuisine: one(cuisines, {
    fields: [poiCuisines.cuisineId],
    references: [cuisines.id],
  }),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  cuisine: one(cuisines, {
    fields: [dishes.cuisineId],
    references: [cuisines.id],
  }),
  poiDishes: many(poiDishes),
}));

export const poiDishesRelations = relations(poiDishes, ({ one }) => ({
  poi: one(pois, {
    fields: [poiDishes.poiId],
    references: [pois.id],
  }),
  dish: one(dishes, {
    fields: [poiDishes.dishId],
    references: [dishes.id],
  }),
}));

export const poiTranslationsRelations = relations(
  poiTranslations,
  ({ one }) => ({
    poi: one(pois, {
      fields: [poiTranslations.poiId],
      references: [pois.id],
    }),
  }),
);

export const remarksRelations = relations(remarks, ({ one, many }) => ({
  poi: one(pois, {
    fields: [remarks.poiId],
    references: [pois.id],
  }),
  userEngagement: many(userEngagement),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  poi: one(pois, {
    fields: [events.poiId],
    references: [pois.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  authProviders: many(authProviders),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  savedPois: many(userSavedPois),
  visits: many(userVisits),
  sessions: many(userSessions),
  businessAccounts: many(businessAccounts),
  engagement: many(userEngagement),
  recommendations: many(recommendations),
  adImpressions: many(adImpressions),
}));

export const authProvidersRelations = relations(authProviders, ({ one }) => ({
  user: one(users, {
    fields: [authProviders.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  }),
);

export const userSavedPoisRelations = relations(userSavedPois, ({ one }) => ({
  user: one(users, {
    fields: [userSavedPois.userId],
    references: [users.id],
  }),
  poi: one(pois, {
    fields: [userSavedPois.poiId],
    references: [pois.id],
  }),
}));

export const userVisitsRelations = relations(userVisits, ({ one }) => ({
  user: one(users, {
    fields: [userVisits.userId],
    references: [users.id],
  }),
  poi: one(pois, {
    fields: [userVisits.poiId],
    references: [pois.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const businessAccountsRelations = relations(
  businessAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [businessAccounts.userId],
      references: [users.id],
    }),
    poi: one(pois, {
      fields: [businessAccounts.poiId],
      references: [pois.id],
    }),
    campaigns: many(adCampaigns),
  }),
);

export const adCampaignsRelations = relations(
  adCampaigns,
  ({ one, many }) => ({
    business: one(businessAccounts, {
      fields: [adCampaigns.businessId],
      references: [businessAccounts.id],
    }),
    poi: one(pois, {
      fields: [adCampaigns.poiId],
      references: [pois.id],
    }),
    impressions: many(adImpressions),
    recommendations: many(recommendations),
  }),
);

export const adImpressionsRelations = relations(adImpressions, ({ one }) => ({
  campaign: one(adCampaigns, {
    fields: [adImpressions.campaignId],
    references: [adCampaigns.id],
  }),
  user: one(users, {
    fields: [adImpressions.userId],
    references: [users.id],
  }),
}));

export const userEngagementRelations = relations(
  userEngagement,
  ({ one }) => ({
    user: one(users, {
      fields: [userEngagement.userId],
      references: [users.id],
    }),
    poi: one(pois, {
      fields: [userEngagement.poiId],
      references: [pois.id],
    }),
    remark: one(remarks, {
      fields: [userEngagement.remarkId],
      references: [remarks.id],
    }),
  }),
);

export const recommendationsRelations = relations(
  recommendations,
  ({ one }) => ({
    user: one(users, {
      fields: [recommendations.userId],
      references: [users.id],
    }),
    poi: one(pois, {
      fields: [recommendations.poiId],
      references: [pois.id],
    }),
    campaign: one(adCampaigns, {
      fields: [recommendations.campaignId],
      references: [adCampaigns.id],
    }),
  }),
);
