import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash").notNull(),
    preferences: jsonb("preferences").$type<UserPreferences>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_username_idx").on(table.username),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const remarks = pgTable(
  "remarks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    centerLongitude: text("center_longitude"),
    centerLatitude: text("center_latitude"),
    categories: text("categories").array(),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("remarks_author_id_idx").on(table.authorId),
    uniqueIndex("remarks_slug_idx").on(table.slug),
  ]
);

export const remarkStops = pgTable(
  "remark_stops",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    remarkId: uuid("remark_id")
      .notNull()
      .references(() => remarks.id, { onDelete: "cascade" }),
    sequenceNumber: integer("sequence_number").notNull(),
    longitude: text("longitude").notNull(),
    latitude: text("latitude").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    audioUrl: text("audio_url"),
    images: text("images").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("remark_stops_remark_id_idx").on(table.remarkId)]
);

export const capsules = pgTable(
  "capsules",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    longitude: text("longitude").notNull(),
    latitude: text("latitude").notNull(),
    unlockRadiusMeters: integer("unlock_radius_meters").notNull().default(50),
    title: text("title").notNull(),
    contentEncrypted: text("content_encrypted"),
    unlockType: text("unlock_type").notNull(),
    unlockDate: timestamp("unlock_date", { withTimezone: true }),
    status: text("status").notNull().default("sealed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("capsules_creator_id_idx").on(table.creatorId)]
);

export const capsuleRecipients = pgTable(
  "capsule_recipients",
  {
    capsuleId: uuid("capsule_id")
      .notNull()
      .references(() => capsules.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opened: boolean("opened").notNull().default(false),
    openedAt: timestamp("opened_at", { withTimezone: true }),
  },
  (table) => [
    index("capsule_recipients_capsule_id_idx").on(table.capsuleId),
    index("capsule_recipients_recipient_id_idx").on(table.recipientId),
  ]
);

export const remarkSaves = pgTable(
  "remark_saves",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    remarkId: uuid("remark_id")
      .notNull()
      .references(() => remarks.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("remark_saves_user_id_idx").on(table.userId),
    index("remark_saves_remark_id_idx").on(table.remarkId),
  ]
);

export const remarkRatings = pgTable(
  "remark_ratings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    remarkId: uuid("remark_id")
      .notNull()
      .references(() => remarks.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("remark_ratings_user_id_idx").on(table.userId),
    index("remark_ratings_remark_id_idx").on(table.remarkId),
  ]
);

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  mapStyle?: string;
  accessibilityMode?: "default" | "mobility" | "vision" | "hearing";
  audioAutoplay?: boolean;
  notifications?: boolean;
}

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Remark = typeof remarks.$inferSelect;
export type NewRemark = typeof remarks.$inferInsert;
export type RemarkStop = typeof remarkStops.$inferSelect;
export type NewRemarkStop = typeof remarkStops.$inferInsert;
export type Capsule = typeof capsules.$inferSelect;
export type NewCapsule = typeof capsules.$inferInsert;

export const pois = pgTable(
  "pois",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    externalId: text("external_id"),
    source: text("source").notNull().default("manual"),
    name: text("name").notNull(),
    longitude: text("longitude").notNull(),
    latitude: text("latitude").notNull(),
    categories: text("categories").array(),
    tags: jsonb("tags").$type<Record<string, string>>().default({}),
    wikipediaUrl: text("wikipedia_url"),
    descriptionRaw: text("description_raw"),
    address: text("address"),
    phone: text("phone"),
    website: text("website"),
    openingHours: text("opening_hours"),
    wheelchair: text("wheelchair"),
    cuisine: text("cuisine").array(),
    operator: text("operator"),
    osmNodeId: text("osm_node_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pois_external_id_idx").on(table.externalId),
    index("pois_source_idx").on(table.source),
    uniqueIndex("pois_osm_node_id_idx").on(table.osmNodeId),
  ]
);

export const poiStories = pgTable(
  "poi_stories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    poiId: uuid("poi_id")
      .notNull()
      .references(() => pois.id, { onDelete: "cascade" }),
    storyType: text("story_type").notNull().default("discovery"),
    title: text("title").notNull(),
    teaser: text("teaser").notNull(),
    content: text("content").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("poi_stories_poi_id_idx").on(table.poiId),
    index("poi_stories_story_type_idx").on(table.storyType),
  ]
);

export const poiInteractions = pgTable(
  "poi_interactions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    poiId: uuid("poi_id")
      .notNull()
      .references(() => pois.id, { onDelete: "cascade" }),
    interactionType: text("interaction_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("poi_interactions_user_id_idx").on(table.userId),
    index("poi_interactions_poi_id_idx").on(table.poiId),
    index("poi_interactions_type_idx").on(table.interactionType),
  ]
);

export const poiSaves = pgTable(
  "poi_saves",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    poiId: uuid("poi_id")
      .notNull()
      .references(() => pois.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("poi_saves_user_id_idx").on(table.userId),
    index("poi_saves_poi_id_idx").on(table.poiId),
  ]
);

export type Poi = typeof pois.$inferSelect;
export type NewPoi = typeof pois.$inferInsert;
export type PoiStory = typeof poiStories.$inferSelect;
export type NewPoiStory = typeof poiStories.$inferInsert;
export type PoiInteraction = typeof poiInteractions.$inferSelect;
export type NewPoiInteraction = typeof poiInteractions.$inferInsert;
