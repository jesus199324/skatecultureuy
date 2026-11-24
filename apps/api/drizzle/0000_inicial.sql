CREATE TYPE "public"."article_format" AS ENUM('STORY', 'INTERVIEW', 'GALLERY', 'VIDEO', 'NEWS');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('ARTIGAS', 'CANELONES', 'CERRO_LARGO', 'COLONIA', 'DURAZNO', 'FLORES', 'FLORIDA', 'LAVALLEJA', 'MALDONADO', 'MONTEVIDEO', 'PAYSANDU', 'RIO_NEGRO', 'RIVERA', 'ROCHA', 'SALTO', 'SAN_JOSE', 'SORIANO', 'TACUAREMBO', 'TREINTA_Y_TRES');--> statement-breakpoint
CREATE TYPE "public"."news_topic" AS ENUM('ESCENA_LOCAL', 'COMPETENCIAS', 'INTERNACIONAL', 'INDUSTRIA');--> statement-breakpoint
CREATE TYPE "public"."placeholder_tone" AS ENUM('dark', 'mid', 'light');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."spot_feature" AS ENUM('BOWL', 'MINI_RAMP', 'PLAZA', 'RAILS', 'LEDGES', 'STAIRS', 'MANUAL_PAD', 'GAP', 'BANKS', 'LIGHTING', 'ROOFED');--> statement-breakpoint
CREATE TYPE "public"."spot_type" AS ENUM('SKATEPARK', 'STREET', 'DIY');--> statement-breakpoint
CREATE TYPE "public"."stance" AS ENUM('REGULAR', 'GOOFY');--> statement-breakpoint
CREATE TABLE "article_gallery" (
	"article_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "article_gallery_article_id_media_id_pk" PRIMARY KEY("article_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "article_skaters" (
	"article_id" uuid NOT NULL,
	"skater_id" uuid NOT NULL,
	CONSTRAINT "article_skaters_article_id_skater_id_pk" PRIMARY KEY("article_id","skater_id")
);
--> statement-breakpoint
CREATE TABLE "article_spots" (
	"article_id" uuid NOT NULL,
	"spot_id" uuid NOT NULL,
	CONSTRAINT "article_spots_article_id_spot_id_pk" PRIMARY KEY("article_id","spot_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"format" "article_format" NOT NULL,
	"category_id" uuid NOT NULL,
	"author" text NOT NULL,
	"cover_image_id" uuid,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"news_topic" "news_topic",
	"read_minutes" integer DEFAULT 3 NOT NULL,
	"video_duration" text,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video" jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"location" text NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"external_url" text,
	"description" text DEFAULT '' NOT NULL,
	"cover_image_id" uuid,
	"spot_id" uuid,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt_text" text NOT NULL,
	"credit" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"placeholder_tone" "placeholder_tone",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"attribution" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skaters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city" text NOT NULL,
	"profile_image_id" uuid,
	"highlights" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"stance" "stance",
	"instagram" text,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skaters_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "spot_gallery" (
	"spot_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "spot_gallery_spot_id_media_id_pk" PRIMARY KEY("spot_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "spot_type" NOT NULL,
	"department" "department" NOT NULL,
	"features" "spot_feature"[] DEFAULT '{}' NOT NULL,
	"cover_image_id" uuid,
	"description" text DEFAULT '' NOT NULL,
	"locality" text NOT NULL,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spots_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "article_gallery" ADD CONSTRAINT "article_gallery_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_gallery" ADD CONSTRAINT "article_gallery_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_skaters" ADD CONSTRAINT "article_skaters_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_skaters" ADD CONSTRAINT "article_skaters_skater_id_skaters_id_fk" FOREIGN KEY ("skater_id") REFERENCES "public"."skaters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_spots" ADD CONSTRAINT "article_spots_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_spots" ADD CONSTRAINT "article_spots_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_media_assets_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_cover_image_id_media_assets_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skaters" ADD CONSTRAINT "skaters_profile_image_id_media_assets_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_gallery" ADD CONSTRAINT "spot_gallery_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_gallery" ADD CONSTRAINT "spot_gallery_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_cover_image_id_media_assets_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_listing_idx" ON "articles" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("status","event_date");--> statement-breakpoint
CREATE INDEX "spots_filter_idx" ON "spots" USING btree ("status","department","type");