/**
 * Esquema de PostgreSQL (Drizzle ORM). Las migraciones SQL se generan desde
 * este archivo con `npm run db:generate` y quedan en apps/api/drizzle/.
 *
 * Convenciones:
 * - Todo contenido tiene `status` (DRAFT/PUBLISHED): la API pública solo
 *   devuelve lo publicado.
 * - `is_demo` marca el contenido ficticio, para mostrarlo con la etiqueta DEMO
 *   y poder borrarlo antes de lanzar.
 * - Las fechas se guardan en UTC (timestamptz).
 */
import { relations } from "drizzle-orm";
import {
  boolean, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import type { ArticleBlock, VideoEmbed } from "../../../../packages/shared/src";

export const publishStatus = pgEnum("publish_status", ["DRAFT", "PUBLISHED"]);
export const articleFormat = pgEnum("article_format", ["STORY", "INTERVIEW", "GALLERY", "VIDEO", "NEWS"]);
export const newsTopic = pgEnum("news_topic", ["ESCENA_LOCAL", "COMPETENCIAS", "INTERNACIONAL", "INDUSTRIA"]);
export const spotType = pgEnum("spot_type", ["SKATEPARK", "STREET", "DIY"]);
export const spotFeature = pgEnum("spot_feature", [
  "BOWL", "MINI_RAMP", "PLAZA", "RAILS", "LEDGES", "STAIRS", "MANUAL_PAD", "GAP", "BANKS", "LIGHTING", "ROOFED",
]);
export const department = pgEnum("department", [
  "ARTIGAS", "CANELONES", "CERRO_LARGO", "COLONIA", "DURAZNO", "FLORES", "FLORIDA", "LAVALLEJA", "MALDONADO", "MONTEVIDEO",
  "PAYSANDU", "RIO_NEGRO", "RIVERA", "ROCHA", "SALTO", "SAN_JOSE", "SORIANO", "TACUAREMBO", "TREINTA_Y_TRES",
]);
export const stance = pgEnum("stance", ["REGULAR", "GOOFY"]);
export const placeholderTone = pgEnum("placeholder_tone", ["dark", "mid", "light"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

/** Biblioteca de fotos. public_id = recurso de Cloudinary (null en las fotos demo). */
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  altText: text("alt_text").notNull(),
  credit: text("credit"),
  isDemo: boolean("is_demo").notNull().default(false),
  placeholderTone: placeholderTone("placeholder_tone"),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    format: articleFormat("format").notNull(),
    categoryId: uuid("category_id").notNull().references(() => categories.id),
    author: text("author").notNull(),
    coverImageId: uuid("cover_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    featured: boolean("featured").notNull().default(false),
    status: publishStatus("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    newsTopic: newsTopic("news_topic"),
    readMinutes: integer("read_minutes").notNull().default(3),
    videoDuration: text("video_duration"),
    /** Cuerpo de la nota en bloques (párrafo, subtítulo, cita, pregunta, foto). */
    body: jsonb("body").$type<ArticleBlock[]>().notNull().default([]),
    video: jsonb("video").$type<VideoEmbed | null>(),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("articles_slug_idx").on(t.slug),
    index("articles_listing_idx").on(t.status, t.publishedAt),
    index("articles_category_idx").on(t.categoryId),
  ],
);

export const articleGallery = pgTable(
  "article_gallery",
  {
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.mediaId] })],
);

export const skaters = pgTable("skaters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city").notNull(),
  profileImageId: uuid("profile_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  highlights: text("highlights").notNull().default(""),
  bio: text("bio").notNull().default(""),
  stance: stance("stance"),
  instagram: text("instagram"),
  /** Aparece en la portada. */
  featured: boolean("featured").notNull().default(false),
  /** Orden en el listado (menor = primero). */
  position: integer("position").notNull().default(0),
  status: publishStatus("status").notNull().default("DRAFT"),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

/**
 * Spots. La dirección y las coordenadas se pueden guardar siempre, pero la
 * API solo las publica en los skateparks (regla publicLocationPrecision).
 */
export const spots = pgTable(
  "spots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    type: spotType("type").notNull(),
    department: department("department").notNull(),
    features: spotFeature("features").array().notNull().default([]),
    coverImageId: uuid("cover_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    description: text("description").notNull().default(""),
    /** Barrio o localidad. */
    locality: text("locality").notNull(),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    featured: boolean("featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    status: publishStatus("status").notNull().default("DRAFT"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("spots_filter_idx").on(t.status, t.department, t.type)],
);

export const spotGallery = pgTable(
  "spot_gallery",
  {
    spotId: uuid("spot_id").notNull().references(() => spots.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.spotId, t.mediaId] })],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    location: text("location").notNull(),
    cancelled: boolean("cancelled").notNull().default(false),
    externalUrl: text("external_url"),
    description: text("description").notNull().default(""),
    coverImageId: uuid("cover_image_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    spotId: uuid("spot_id").references(() => spots.id, { onDelete: "set null" }),
    status: publishStatus("status").notNull().default("DRAFT"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("events_date_idx").on(t.status, t.eventDate)],
);

/** Skaters y spots que aparecen en una nota. */
export const articleSkaters = pgTable(
  "article_skaters",
  {
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    skaterId: uuid("skater_id").notNull().references(() => skaters.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.skaterId] })],
);

export const articleSpots = pgTable(
  "article_spots",
  {
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    spotId: uuid("spot_id").notNull().references(() => spots.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.spotId] })],
);

/** Cita destacada de la portada (se muestra la activa más reciente). */
export const pullQuotes = pgTable("pull_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  attribution: text("attribution").notNull(),
  active: boolean("active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

/* ───────── Relaciones (para las consultas con `with`) ───────── */

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, { fields: [articles.categoryId], references: [categories.id] }),
  coverImage: one(mediaAssets, { fields: [articles.coverImageId], references: [mediaAssets.id] }),
  gallery: many(articleGallery),
  skaters: many(articleSkaters),
  spots: many(articleSpots),
}));
export const articleGalleryRelations = relations(articleGallery, ({ one }) => ({
  article: one(articles, { fields: [articleGallery.articleId], references: [articles.id] }),
  media: one(mediaAssets, { fields: [articleGallery.mediaId], references: [mediaAssets.id] }),
}));
export const skatersRelations = relations(skaters, ({ one, many }) => ({
  profileImage: one(mediaAssets, { fields: [skaters.profileImageId], references: [mediaAssets.id] }),
  articles: many(articleSkaters),
}));
export const spotsRelations = relations(spots, ({ one, many }) => ({
  coverImage: one(mediaAssets, { fields: [spots.coverImageId], references: [mediaAssets.id] }),
  gallery: many(spotGallery),
  articles: many(articleSpots),
}));
export const spotGalleryRelations = relations(spotGallery, ({ one }) => ({
  spot: one(spots, { fields: [spotGallery.spotId], references: [spots.id] }),
  media: one(mediaAssets, { fields: [spotGallery.mediaId], references: [mediaAssets.id] }),
}));
export const eventsRelations = relations(events, ({ one }) => ({
  coverImage: one(mediaAssets, { fields: [events.coverImageId], references: [mediaAssets.id] }),
  spot: one(spots, { fields: [events.spotId], references: [spots.id] }),
}));
export const articleSkatersRelations = relations(articleSkaters, ({ one }) => ({
  article: one(articles, { fields: [articleSkaters.articleId], references: [articles.id] }),
  skater: one(skaters, { fields: [articleSkaters.skaterId], references: [skaters.id] }),
}));
export const articleSpotsRelations = relations(articleSpots, ({ one }) => ({
  article: one(articles, { fields: [articleSpots.articleId], references: [articles.id] }),
  spot: one(spots, { fields: [articleSpots.spotId], references: [spots.id] }),
}));

/* ───────── Panel: cuentas del staff y sesiones ───────── */

export const staffRole = pgEnum("staff_role", ["ADMIN", "EDITOR"]);

/** Cuentas del staff. No hay registro público: se crean con `npm run staff:create` o desde el panel (solo ADMIN). */
export const staffUsers = pgTable(
  "staff_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Siempre en minúsculas. */
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Hash Argon2id. Nunca sale por la API. */
    passwordHash: text("password_hash").notNull(),
    role: staffRole("role").notNull().default("EDITOR"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("staff_users_email_idx").on(t.email)],
);

/**
 * Sesiones abiertas. La cookie lleva un token al azar; en la base se guarda
 * solo su hash SHA-256 (si alguien lee la base, no puede usar las sesiones).
 */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => staffUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(staffUsers, { fields: [sessions.userId], references: [staffUsers.id] }),
}));
