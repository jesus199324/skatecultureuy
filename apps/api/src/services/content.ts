/**
 * Consultas públicas de la revista. Solo devuelven contenido publicado
 * (status PUBLISHED y, en las notas, con fecha de publicación ya cumplida:
 * una nota programada para mañana no aparece hasta mañana).
 */
import { and, asc, count, desc, eq, gte, inArray, lte, ne, sql, type SQL } from "drizzle-orm";
import {
  PAGE_SIZE,
  type ArticleFormat, type ArticleSection, type ArticleSummary, type Department, type EventWhen, type HomePayload,
  type NewsTopic, type Paginated, type SpotType,
} from "../../../../packages/shared/src";
import type { Db } from "../db/client";
import { articles, categories, events, pullQuotes, skaters, spots } from "../db/schema";
import {
  toArticleDetail, toArticleSummary, toEventDetail, toEventSummary, toMedia, toSkaterDetail, toSkaterSummary, toSpotDetail,
  toSpotSummary,
} from "../lib/serialize";

export class NotFoundError extends Error {
  status = 404;
}

const baseWith = { category: true, coverImage: true } as const;

/** Notas visibles al público en este momento. */
const visibleArticle = (now: Date) => and(eq(articles.status, "PUBLISHED"), lte(articles.publishedAt, now))!;
const newestFirst = [desc(articles.publishedAt), desc(articles.id)];

function page<T>(items: T[], total: number, pageNumber: number): Paginated<T> {
  return { items, total, page: pageNumber, pageSize: PAGE_SIZE, hasMore: items.length < total };
}

const categoryId = (db: Db, slug: string) => db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));

export interface ArticleQuery {
  section: ArticleSection;
  topic?: NewsTopic | null;
  format?: ArticleFormat | null;
  page?: number;
}

export async function listArticles(db: Db, q: ArticleQuery, now = new Date()): Promise<Paginated<ArticleSummary>> {
  const conds: SQL[] = [visibleArticle(now)];
  if (q.section === "stories") conds.push(ne(articles.format, "NEWS"));
  else conds.push(inArray(articles.categoryId, categoryId(db, q.section)));
  if (q.topic) conds.push(eq(articles.newsTopic, q.topic));
  if (q.format) conds.push(eq(articles.format, q.format));
  const where = and(...conds);
  const pageNumber = q.page ?? 1;
  const [rows, [{ total }]] = await Promise.all([
    db.query.articles.findMany({ where, with: baseWith, orderBy: newestFirst, limit: pageNumber * PAGE_SIZE }),
    db.select({ total: count() }).from(articles).where(where),
  ]);
  return page(rows.map(toArticleSummary), total, pageNumber);
}

export async function getArticle(db: Db, slug: string, now = new Date()) {
  const a = await db.query.articles.findFirst({
    where: and(eq(articles.slug, slug), visibleArticle(now)),
    with: {
      ...baseWith,
      gallery: { with: { media: true }, orderBy: (g, { asc }) => [asc(g.position)] },
      skaters: { with: { skater: { with: { profileImage: true } } } },
      spots: { with: { spot: { with: { coverImage: true } } } },
    },
  });
  if (!a) throw new NotFoundError("Nota no encontrada");
  const related = await db.query.articles.findMany({
    where: and(visibleArticle(now), eq(articles.categoryId, a.categoryId), ne(articles.id, a.id)),
    with: baseWith,
    orderBy: newestFirst,
    limit: 3,
  });
  return toArticleDetail(a, {
    gallery: a.gallery.map((g) => toMedia(g.media)!),
    skaters: a.skaters.map((x) => x.skater).filter((k) => k.status === "PUBLISHED").map(toSkaterSummary),
    spots: a.spots.map((x) => x.spot).filter((p) => p.status === "PUBLISHED").map(toSpotSummary),
    related: related.map(toArticleSummary),
  });
}

export async function listSkaters(db: Db, pageNumber = 1) {
  const where = eq(skaters.status, "PUBLISHED");
  const [rows, [{ total }]] = await Promise.all([
    db.query.skaters.findMany({ where, with: { profileImage: true }, orderBy: [asc(skaters.position), asc(skaters.name)], limit: pageNumber * PAGE_SIZE }),
    db.select({ total: count() }).from(skaters).where(where),
  ]);
  return page(rows.map(toSkaterSummary), total, pageNumber);
}

export async function getSkater(db: Db, slug: string, now = new Date()) {
  const k = await db.query.skaters.findFirst({
    where: and(eq(skaters.slug, slug), eq(skaters.status, "PUBLISHED")),
    with: { profileImage: true, articles: { with: { article: { with: baseWith } } } },
  });
  if (!k) throw new NotFoundError("Skater no encontrado");
  const list = k.articles
    .map((x) => x.article)
    .filter((a) => a.status === "PUBLISHED" && a.publishedAt && a.publishedAt <= now)
    .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())
    .map(toArticleSummary);
  return toSkaterDetail(k, list);
}

export interface SpotQuery {
  department?: Department | null;
  type?: SpotType | null;
  page?: number;
}

export async function listSpots(db: Db, q: SpotQuery) {
  const conds: SQL[] = [eq(spots.status, "PUBLISHED")];
  if (q.department) conds.push(eq(spots.department, q.department));
  if (q.type) conds.push(eq(spots.type, q.type));
  const where = and(...conds);
  const pageNumber = q.page ?? 1;
  const [rows, [{ total }], depts] = await Promise.all([
    db.query.spots.findMany({ where, with: { coverImage: true }, orderBy: [asc(spots.position), asc(spots.name)], limit: pageNumber * PAGE_SIZE }),
    db.select({ total: count() }).from(spots).where(where),
    // Para el filtro: solo departamentos que tienen spots publicados.
    db.selectDistinct({ d: spots.department }).from(spots).where(eq(spots.status, "PUBLISHED")).orderBy(asc(spots.department)),
  ]);
  return { ...page(rows.map(toSpotSummary), total, pageNumber), departments: depts.map((r) => r.d) };
}

export async function getSpot(db: Db, slug: string, now = new Date()) {
  const p = await db.query.spots.findFirst({
    where: and(eq(spots.slug, slug), eq(spots.status, "PUBLISHED")),
    with: {
      coverImage: true,
      gallery: { with: { media: true }, orderBy: (g, { asc }) => [asc(g.position)] },
      articles: { with: { article: { with: baseWith } } },
    },
  });
  if (!p) throw new NotFoundError("Spot no encontrado");
  const list = p.articles
    .map((x) => x.article)
    .filter((a) => a.status === "PUBLISHED" && a.publishedAt && a.publishedAt <= now)
    .map(toArticleSummary);
  return toSpotDetail(p, p.gallery.map((g) => toMedia(g.media)!), list);
}

/** Un evento es "próximo" si no se canceló y no terminó (misma regla que eventState del front). */
const eventEnd = sql`coalesce(${events.endDate}, ${events.eventDate})`;

export async function listEvents(db: Db, when: EventWhen, now = new Date()) {
  const upcoming = and(eq(events.cancelled, false), gte(eventEnd, now));
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.status, "PUBLISHED"), when === "proximos" ? upcoming : sql`not (${upcoming})`))
    .orderBy(when === "proximos" ? asc(events.eventDate) : desc(events.eventDate));
  return rows.map(toEventSummary);
}

export async function getEvent(db: Db, slug: string) {
  const e = await db.query.events.findFirst({
    where: and(eq(events.slug, slug), eq(events.status, "PUBLISHED")),
    with: { coverImage: true, spot: { with: { coverImage: true } } },
  });
  if (!e) throw new NotFoundError("Evento no encontrado");
  return toEventDetail(e);
}

/** Portada: arma GET /api/home con la misma forma que la portada demo. */
export async function getHome(db: Db, now = new Date()): Promise<HomePayload> {
  const visible = visibleArticle(now);
  const latestOf = (where: SQL | undefined, limit: number) =>
    db.query.articles.findMany({ where: and(visible, where), with: baseWith, orderBy: newestFirst, limit });

  const hero =
    (await db.query.articles.findFirst({ where: and(visible, eq(articles.featured, true), ne(articles.format, "NEWS")), with: baseWith, orderBy: newestFirst })) ??
    (await db.query.articles.findFirst({ where: and(visible, ne(articles.format, "NEWS")), with: baseWith, orderBy: newestFirst }));
  if (!hero) throw new NotFoundError("La revista todavía no tiene notas publicadas");

  const [news, latest, street, culture, homeSkaters, quote, homeSpots, homeEvents] = await Promise.all([
    latestOf(eq(articles.format, "NEWS"), 6),
    latestOf(and(ne(articles.format, "NEWS"), ne(articles.id, hero.id)), 7),
    latestOf(and(inArray(articles.categoryId, categoryId(db, "street")), ne(articles.id, hero.id)), 4),
    latestOf(inArray(articles.categoryId, categoryId(db, "culture")), 4),
    db.query.skaters.findMany({ where: and(eq(skaters.status, "PUBLISHED"), eq(skaters.featured, true)), with: { profileImage: true }, orderBy: [asc(skaters.position)], limit: 2 }),
    db.query.pullQuotes.findFirst({ where: eq(pullQuotes.active, true), orderBy: [desc(pullQuotes.createdAt)] }),
    db.query.spots.findMany({ where: and(eq(spots.status, "PUBLISHED"), eq(spots.featured, true)), with: { coverImage: true }, orderBy: [asc(spots.position)], limit: 3 }),
    listEvents(db, "proximos", now),
  ]);

  return {
    hero: toArticleSummary(hero),
    news: news.map(toArticleSummary),
    latest: latest.map(toArticleSummary),
    street: street.map(toArticleSummary),
    skaters: homeSkaters.map(toSkaterSummary),
    quote: quote ? { text: quote.text, attribution: quote.attribution, isDemo: quote.isDemo } : { text: "", attribution: "", isDemo: false },
    spots: homeSpots.map(toSpotSummary),
    culture: culture.map(toArticleSummary),
    events: homeEvents.slice(0, 4),
  };
}

