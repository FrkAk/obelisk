import { pgTable, uuid, varchar, text, bigint, jsonb, timestamp, integer, doublePrecision, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
});

export const pois = pgTable("pois", {
  id: uuid("id").defaultRandom().primaryKey(),
  osmId: bigint("osm_id", { mode: "number" }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address"),
  wikipediaUrl: text("wikipedia_url"),
  imageUrl: text("image_url"),
  osmTags: jsonb("osm_tags").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_pois_category").on(table.categoryId),
  index("idx_pois_location").on(table.latitude, table.longitude),
]);

export const remarks = pgTable("remarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  poiId: uuid("poi_id").references(() => pois.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  teaser: varchar("teaser", { length: 100 }),
  content: text("content").notNull(),
  localTip: text("local_tip"),
  durationSeconds: integer("duration_seconds").default(45),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_remarks_poi").on(table.poiId),
]);

export const categoriesRelations = relations(categories, ({ many }) => ({
  pois: many(pois),
}));

export const poisRelations = relations(pois, ({ one, many }) => ({
  category: one(categories, {
    fields: [pois.categoryId],
    references: [categories.id],
  }),
  remarks: many(remarks),
}));

export const remarksRelations = relations(remarks, ({ one }) => ({
  poi: one(pois, {
    fields: [remarks.poiId],
    references: [pois.id],
  }),
}));
