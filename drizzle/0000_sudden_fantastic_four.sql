CREATE TABLE "capsule_recipients" (
	"capsule_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"opened" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "capsules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"longitude" text NOT NULL,
	"latitude" text NOT NULL,
	"unlock_radius_meters" integer DEFAULT 50 NOT NULL,
	"title" text NOT NULL,
	"content_encrypted" text,
	"unlock_type" text NOT NULL,
	"unlock_date" timestamp with time zone,
	"status" text DEFAULT 'sealed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"poi_id" uuid NOT NULL,
	"interaction_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_saves" (
	"user_id" uuid NOT NULL,
	"poi_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poi_id" uuid NOT NULL,
	"story_type" text DEFAULT 'discovery' NOT NULL,
	"title" text NOT NULL,
	"teaser" text NOT NULL,
	"content" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pois" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"name" text NOT NULL,
	"longitude" text NOT NULL,
	"latitude" text NOT NULL,
	"categories" text[],
	"tags" jsonb DEFAULT '{}'::jsonb,
	"wikipedia_url" text,
	"description_raw" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remark_ratings" (
	"user_id" uuid NOT NULL,
	"remark_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remark_saves" (
	"user_id" uuid NOT NULL,
	"remark_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remark_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remark_id" uuid NOT NULL,
	"sequence_number" integer NOT NULL,
	"longitude" text NOT NULL,
	"latitude" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"audio_url" text,
	"images" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"center_longitude" text,
	"center_latitude" text,
	"categories" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "remarks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"password_hash" text NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "capsule_recipients" ADD CONSTRAINT "capsule_recipients_capsule_id_capsules_id_fk" FOREIGN KEY ("capsule_id") REFERENCES "public"."capsules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capsule_recipients" ADD CONSTRAINT "capsule_recipients_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capsules" ADD CONSTRAINT "capsules_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_interactions" ADD CONSTRAINT "poi_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_interactions" ADD CONSTRAINT "poi_interactions_poi_id_pois_id_fk" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_saves" ADD CONSTRAINT "poi_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_saves" ADD CONSTRAINT "poi_saves_poi_id_pois_id_fk" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poi_stories" ADD CONSTRAINT "poi_stories_poi_id_pois_id_fk" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remark_ratings" ADD CONSTRAINT "remark_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remark_ratings" ADD CONSTRAINT "remark_ratings_remark_id_remarks_id_fk" FOREIGN KEY ("remark_id") REFERENCES "public"."remarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remark_saves" ADD CONSTRAINT "remark_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remark_saves" ADD CONSTRAINT "remark_saves_remark_id_remarks_id_fk" FOREIGN KEY ("remark_id") REFERENCES "public"."remarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remark_stops" ADD CONSTRAINT "remark_stops_remark_id_remarks_id_fk" FOREIGN KEY ("remark_id") REFERENCES "public"."remarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remarks" ADD CONSTRAINT "remarks_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "capsule_recipients_capsule_id_idx" ON "capsule_recipients" USING btree ("capsule_id");--> statement-breakpoint
CREATE INDEX "capsule_recipients_recipient_id_idx" ON "capsule_recipients" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "capsules_creator_id_idx" ON "capsules" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "poi_interactions_user_id_idx" ON "poi_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "poi_interactions_poi_id_idx" ON "poi_interactions" USING btree ("poi_id");--> statement-breakpoint
CREATE INDEX "poi_interactions_type_idx" ON "poi_interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "poi_saves_user_id_idx" ON "poi_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "poi_saves_poi_id_idx" ON "poi_saves" USING btree ("poi_id");--> statement-breakpoint
CREATE INDEX "poi_stories_poi_id_idx" ON "poi_stories" USING btree ("poi_id");--> statement-breakpoint
CREATE INDEX "poi_stories_story_type_idx" ON "poi_stories" USING btree ("story_type");--> statement-breakpoint
CREATE INDEX "pois_external_id_idx" ON "pois" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "pois_source_idx" ON "pois" USING btree ("source");--> statement-breakpoint
CREATE INDEX "remark_ratings_user_id_idx" ON "remark_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "remark_ratings_remark_id_idx" ON "remark_ratings" USING btree ("remark_id");--> statement-breakpoint
CREATE INDEX "remark_saves_user_id_idx" ON "remark_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "remark_saves_remark_id_idx" ON "remark_saves" USING btree ("remark_id");--> statement-breakpoint
CREATE INDEX "remark_stops_remark_id_idx" ON "remark_stops" USING btree ("remark_id");--> statement-breakpoint
CREATE INDEX "remarks_author_id_idx" ON "remarks" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "remarks_slug_idx" ON "remarks" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");