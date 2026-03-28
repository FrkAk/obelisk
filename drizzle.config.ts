import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (() => {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is required. Copy .env.example to .env and configure it.");
      }
      return process.env.DATABASE_URL;
    })(),
  },
  tablesFilter: [
    "regions",
    "categories",
    "pois",
    "contact_info",
    "accessibility_info",
    "photos",
    "tags",
    "poi_tags",
    "cuisines",
    "poi_cuisines",
    "dishes",
    "poi_dishes",
    "poi_translations",
    "remarks",
    "events",
    "users",
    "auth_providers",
    "user_preferences",
    "user_saved_pois",
    "user_visits",
    "user_sessions",
    "business_accounts",
    "ad_campaigns",
    "ad_impressions",
    "user_engagement",
    "recommendations",
  ],
});
