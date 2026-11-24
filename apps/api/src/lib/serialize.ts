/**
 * De filas de la base a las formas públicas de packages/shared (las mismas
 * que usan las páginas). Acá se aplican las reglas de publicación: por
 * ejemplo, un spot de calle o DIY nunca sale con dirección ni coordenadas.
 */
import {
  publicLocationPrecision,
  type ArticleDetail, type ArticleSummary, type Category, type EventDetail, type EventSummary, type MediaAsset,
  type SkaterDetail, type SkaterSummary, type SpotDetail, type SpotSummary,
} from "../../../../packages/shared/src";
import type * as s from "../db/schema";

type MediaRow = typeof s.mediaAssets.$inferSelect;
type CategoryRow = typeof s.categories.$inferSelect;
type ArticleRow = typeof s.articles.$inferSelect;
type SkaterRow = typeof s.skaters.$inferSelect;
type SpotRow = typeof s.spots.$inferSelect;
type EventRow = typeof s.events.$inferSelect;

const iso = (d: Date) => d.toISOString();

export function toMedia(m: MediaRow | null | undefined): MediaAsset | null {
  if (!m) return null;
  return {
    id: m.id,
    publicId: m.publicId,
    width: m.width,
    height: m.height,
    altText: m.altText,
    credit: m.credit,
    isDemo: m.isDemo,
    ...(m.placeholderTone ? { placeholderTone: m.placeholderTone } : {}),
  };
}

export const toCategory = (c: CategoryRow): Category => ({ id: c.id, name: c.name, slug: c.slug });

export type ArticleWithBase = ArticleRow & { category: CategoryRow; coverImage: MediaRow | null };

export function toArticleSummary(a: ArticleWithBase): ArticleSummary {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    format: a.format,
    category: toCategory(a.category),
    author: a.author,
    coverImage: toMedia(a.coverImage),
    featured: a.featured,
    // Las consultas públicas solo traen notas publicadas, que siempre tienen fecha.
    publishedAt: iso(a.publishedAt ?? a.createdAt),
    newsTopic: a.newsTopic,
    readMinutes: a.readMinutes,
    ...(a.videoDuration ? { videoDuration: a.videoDuration } : {}),
    isDemo: a.isDemo,
  };
}

export type SkaterWithBase = SkaterRow & { profileImage: MediaRow | null };

export function toSkaterSummary(k: SkaterWithBase): SkaterSummary {
  return {
    id: k.id,
    name: k.name,
    slug: k.slug,
    city: k.city,
    profileImage: toMedia(k.profileImage),
    highlights: k.highlights,
    isDemo: k.isDemo,
  };
}

export function toSkaterDetail(k: SkaterWithBase, articles: ArticleSummary[]): SkaterDetail {
  return { ...toSkaterSummary(k), bio: k.bio, stance: k.stance, instagram: k.instagram, articles };
}

export type SpotWithBase = SpotRow & { coverImage: MediaRow | null };

export function toSpotSummary(p: SpotWithBase): SpotSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    department: p.department,
    features: p.features,
    coverImage: toMedia(p.coverImage),
    isDemo: p.isDemo,
  };
}

/**
 * Regla de la Fase 3: dirección y coordenadas solo en skateparks.
 * En calle y DIY se descartan acá, aunque estén guardadas en la base.
 */
export function toSpotDetail(p: SpotWithBase, gallery: MediaAsset[], articles: ArticleSummary[]): SpotDetail {
  const precision = publicLocationPrecision(p.type);
  const exact = precision === "EXACT";
  return {
    ...toSpotSummary(p),
    description: p.description,
    locality: p.locality,
    locationPrecision: precision,
    address: exact ? p.address : null,
    coordinates: exact && p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null,
    gallery,
    articles,
  };
}

export function toEventSummary(e: EventRow): EventSummary {
  return {
    id: e.id,
    name: e.name,
    slug: e.slug,
    eventDate: iso(e.eventDate),
    endDate: e.endDate ? iso(e.endDate) : null,
    location: e.location,
    cancelled: e.cancelled,
    externalUrl: e.externalUrl,
    isDemo: e.isDemo,
  };
}

export function toEventDetail(e: EventRow & { coverImage: MediaRow | null; spot: SpotWithBase | null }): EventDetail {
  return {
    ...toEventSummary(e),
    description: e.description,
    coverImage: toMedia(e.coverImage),
    spot: e.spot && e.spot.status === "PUBLISHED" ? toSpotSummary(e.spot) : null,
  };
}

export function toArticleDetail(
  a: ArticleWithBase,
  extra: Pick<ArticleDetail, "gallery" | "skaters" | "spots" | "related">,
): ArticleDetail {
  return { ...toArticleSummary(a), body: a.body, video: a.video ?? null, ...extra };
}
