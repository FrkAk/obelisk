-- Migration: Initial Schema
-- Created: Phase 1 Foundation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "username" text NOT NULL UNIQUE,
  "display_name" text,
  "avatar_url" text,
  "password_hash" text NOT NULL,
  "preferences" jsonb DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");

-- Sessions table (for Lucia Auth)
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");

-- Remarks (Tours)
CREATE TABLE IF NOT EXISTS "remarks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "cover_image_url" text,
  "center_longitude" text,
  "center_latitude" text,
  "categories" text[],
  "status" text NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "remarks_author_id_idx" ON "remarks" ("author_id");
CREATE UNIQUE INDEX IF NOT EXISTS "remarks_slug_idx" ON "remarks" ("slug");

-- Remark Stops
CREATE TABLE IF NOT EXISTS "remark_stops" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "remark_id" uuid NOT NULL REFERENCES "remarks"("id") ON DELETE CASCADE,
  "sequence_number" integer NOT NULL,
  "longitude" text NOT NULL,
  "latitude" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "audio_url" text,
  "images" text[],
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "remark_stops_remark_id_idx" ON "remark_stops" ("remark_id");

-- Capsules
CREATE TABLE IF NOT EXISTS "capsules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "creator_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "longitude" text NOT NULL,
  "latitude" text NOT NULL,
  "unlock_radius_meters" integer NOT NULL DEFAULT 50,
  "title" text NOT NULL,
  "content_encrypted" text,
  "unlock_type" text NOT NULL,
  "unlock_date" timestamptz,
  "status" text NOT NULL DEFAULT 'sealed',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "capsules_creator_id_idx" ON "capsules" ("creator_id");

-- Capsule Recipients
CREATE TABLE IF NOT EXISTS "capsule_recipients" (
  "capsule_id" uuid NOT NULL REFERENCES "capsules"("id") ON DELETE CASCADE,
  "recipient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "opened" boolean NOT NULL DEFAULT false,
  "opened_at" timestamptz,
  PRIMARY KEY ("capsule_id", "recipient_id")
);

CREATE INDEX IF NOT EXISTS "capsule_recipients_capsule_id_idx" ON "capsule_recipients" ("capsule_id");
CREATE INDEX IF NOT EXISTS "capsule_recipients_recipient_id_idx" ON "capsule_recipients" ("recipient_id");

-- Remark Saves (Bookmarks)
CREATE TABLE IF NOT EXISTS "remark_saves" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "remark_id" uuid NOT NULL REFERENCES "remarks"("id") ON DELETE CASCADE,
  "saved_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "remark_id")
);

CREATE INDEX IF NOT EXISTS "remark_saves_user_id_idx" ON "remark_saves" ("user_id");
CREATE INDEX IF NOT EXISTS "remark_saves_remark_id_idx" ON "remark_saves" ("remark_id");

-- Remark Ratings
CREATE TABLE IF NOT EXISTS "remark_ratings" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "remark_id" uuid NOT NULL REFERENCES "remarks"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "remark_id")
);

CREATE INDEX IF NOT EXISTS "remark_ratings_user_id_idx" ON "remark_ratings" ("user_id");
CREATE INDEX IF NOT EXISTS "remark_ratings_remark_id_idx" ON "remark_ratings" ("remark_id");
