import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://obelisk:obelisk_dev@localhost:5432/obelisk",
  },
  tablesFilter: ["categories", "pois", "remarks"],
});
