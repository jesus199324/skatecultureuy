/**
 * Fuente de contenido de las páginas. Hoy responde con datos de demostración;
 * en la Fase 6 cada función pasa a llamar a la API con la misma forma de
 * respuesta, y las páginas no cambian.
 *
 * Los filtros usan valores en español y sin tildes para que las URLs se lean
 * bien y se puedan compartir: /news?tema=competencias, /spots?depto=rocha.
 */
import {
  DEPARTMENT_LABELS, DEPARTMENT_PARAM, FORMAT_PARAM, PAGE_SIZE, SPOT_TYPE_PARAM, TOPIC_PARAM, fromParam, parsePage, slugify,
  type ArticleSection, type EventWhen,
  type ArticleDetail, type ArticleFormat, type ArticleSummary, type Department, type EventDetail, type EventSummary,
  type HomePayload, type NewsTopic, type Paginated, type SkaterDetail, type SkaterSummary, type SpotDetail, type SpotSummary, type SpotType,
} from "../../../../packages/shared/src";
import { buildDemoDb, type DemoDb } from "../../../../packages/shared/src/demo/content";
import { buildDemoHome } from "../../../../packages/shared/src/demo/home";
import { eventState } from "./format";

export { DEPARTMENT_PARAM, FORMAT_PARAM, SPOT_TYPE_PARAM, TOPIC_PARAM, fromParam, parsePage, slugify };
export type { ArticleSection, EventWhen };

export function paginate<T>(all: T[], page: number, pageSize = PAGE_SIZE): Paginated<T> {
  const items = all.slice(0, page * pageSize);
  return { items, total: all.length, page, pageSize, hasMore: items.length < all.length };
}

/* ───────── Datos ───────── */

let cache: { day: number; db: DemoDb } | null = null;
/** La base demo se arma una vez por día (las fechas son relativas a "ahora"). */
function db(now: number): DemoDb {
  const day = Math.floor(now / 86_400_000);
  if (!cache || cache.day !== day) cache = { day, db: buildDemoDb(now) };
  return cache.db;
}

const toSummary = ({ body: _b, gallery: _g, video: _v, skaters: _s, spots: _p, related: _r, ...a }: ArticleDetail): ArticleSummary => a;
const byDateDesc = (a: ArticleSummary, b: ArticleSummary) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);


export interface ArticleQuery {
  section: ArticleSection;
  topic?: NewsTopic | null;
  format?: ArticleFormat | null;
  page?: number;
}

export async function getHome(now = Date.now()): Promise<HomePayload> {
  return buildDemoHome(now);
}

export async function listArticles(q: ArticleQuery, now = Date.now()): Promise<Paginated<ArticleSummary>> {
  let list = db(now).articles.map(toSummary);
  if (q.section === "stories") list = list.filter((a) => a.format !== "NEWS");
  else list = list.filter((a) => a.category.slug === q.section);
  if (q.topic) list = list.filter((a) => a.newsTopic === q.topic);
  if (q.format) list = list.filter((a) => a.format === q.format);
  return paginate(list.sort(byDateDesc), q.page ?? 1);
}

export async function getArticle(slug: string, now = Date.now()): Promise<ArticleDetail | null> {
  return db(now).articles.find((a) => a.slug === slug) ?? null;
}

export async function listSkaters(page = 1, now = Date.now()): Promise<Paginated<SkaterSummary>> {
  const list = db(now).skaters.map(({ bio: _b, stance: _s, instagram: _i, articles: _a, ...s }) => s);
  return paginate(list, page);
}

export async function getSkater(slug: string, now = Date.now()): Promise<SkaterDetail | null> {
  return db(now).skaters.find((s) => s.slug === slug) ?? null;
}

export interface SpotQuery {
  department?: Department | null;
  type?: SpotType | null;
  page?: number;
}

export async function listSpots(q: SpotQuery, now = Date.now()): Promise<Paginated<SpotSummary> & { departments: Department[] }> {
  const all = db(now).spots;
  let list = all;
  if (q.department) list = list.filter((s) => s.department === q.department);
  if (q.type) list = list.filter((s) => s.type === q.type);
  const summaries = list.map(({ description: _d, locality: _l, locationPrecision: _p, address: _a, coordinates: _c, gallery: _g, articles: _r, ...s }) => s);
  // Solo se ofrecen como filtro los departamentos que tienen spots.
  const departments = (Object.keys(DEPARTMENT_LABELS) as Department[]).filter((d) => all.some((s) => s.department === d));
  return { ...paginate(summaries, q.page ?? 1), departments };
}

export async function getSpot(slug: string, now = Date.now()): Promise<SpotDetail | null> {
  return db(now).spots.find((s) => s.slug === slug) ?? null;
}


export async function listEvents(when: EventWhen, now = Date.now()): Promise<EventSummary[]> {
  const nowDate = new Date(now);
  const list = db(now).events
    .map(({ description: _d, coverImage: _c, spot: _s, ...e }) => e)
    .filter((e) => (when === "proximos" ? eventState(e, nowDate) === "PROXIMO" : eventState(e, nowDate) !== "PROXIMO"));
  // Próximos: el más cercano primero. Pasados: el más reciente primero.
  return list.sort((a, b) => (when === "proximos" ? 1 : -1) * (Date.parse(a.eventDate) - Date.parse(b.eventDate)));
}

export async function getEvent(slug: string, now = Date.now()): Promise<EventDetail | null> {
  return db(now).events.find((e) => e.slug === slug) ?? null;
}
