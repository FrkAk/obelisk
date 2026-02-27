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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_pois_category").on(table.categoryId),
    index("idx_pois_region").on(table.regionId),
    index("idx_pois_location").on(table.latitude, table.longitude),
    index("idx_pois_locale").on(table.locale),
    index("idx_pois_name_trgm").using("gin", sql`${table.name} gin_trgm_ops`),
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

// ===========================================================================
// 5. Content Tables
// ===========================================================================

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
    modelId: varchar("model_id", { length: 100 }),
    confidence: varchar("confidence", { length: 10 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_remarks_poi_locale_version").on(
      table.poiId,
      table.locale,
      table.version,
    ),
    index("idx_remarks_poi").on(table.poiId),
    index("idx_remarks_current").on(table.poiId, table.locale).where(sql`is_current = true`),
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
  poiTags: many(poiTags),
  poiCuisines: many(poiCuisines),
  remarks: many(remarks),
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

export const remarksRelations = relations(remarks, ({ one }) => ({
  poi: one(pois, {
    fields: [remarks.poiId],
    references: [pois.id],
  }),
}));

