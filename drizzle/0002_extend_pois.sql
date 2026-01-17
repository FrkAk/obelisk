-- Add enriched fields to pois table for OSM data
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "opening_hours" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "wheelchair" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "cuisine" text[];
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "operator" text;
ALTER TABLE "pois" ADD COLUMN IF NOT EXISTS "osm_node_id" text;

-- Create unique index on osm_node_id for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "pois_osm_node_id_idx" ON "pois" ("osm_node_id") WHERE "osm_node_id" IS NOT NULL;
