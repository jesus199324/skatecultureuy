/**
 * Fuente de contenido de las páginas. Hoy responde con datos de demostración;
 * en la Fase 6 cada función pasa a llamar a la API con la misma forma de
 * respuesta, y las páginas no cambian.
 *
 * Los filtros usan valores en español y sin tildes para que las URLs se lean
 * bien y se puedan compartir: /news?tema=competencias, /spots?depto=rocha.
 */
import {
  DEPARTMENT_LABELS, PAGE_SIZE,
  type ArticleDetail, type ArticleFormat, type ArticleSummary, type Department, type EventDetail, type EventSummary,
  type HomePayload, type NewsTopic, type Paginated, type SkaterDetail, type SkaterSummary, type SpotDetail, type SpotSummary, type SpotType,
} from "../../../../packages/shared/src";
import { buildDemoDb, type DemoDb } from "./demo-content";
import { buildDemoHome } from "./demo-data";
import { eventState } from "./format";

/* ───────── Valores de filtro en la URL ───────── */

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const TOPIC_PARAM: Record<NewsTopic, string> = {
  ESCENA_LOCAL: "escena-local", COMPETENCIAS: "competencias", INTERNACIONAL: "internacional", INDUSTRIA: "industria",
};
export const FORMAT_PARAM: Record<Exclude<ArticleFormat, "NEWS">, string> = {
  STORY: "historias", INTERVIEW: "entrevistas", GALLERY: "galerias", VIDEO: "videos",
};
export const SPOT_TYPE_PARAM: Record<SpotType, string> = { SKATEPARK: "skatepark", STREET: "calle", DIY: "diy" };
export const DEPARTMENT_PARAM = Object.fromEntries(
  (Object.keys(DEPARTMENT_LABELS) as Department[]).map((d) => [d, slugify(DEPARTMENT_LABELS[d])]),
) as Record<Department, string>;

/** Busca la clave cuyo valor de URL coincide; si no hay o no es válido, null (= "todos"). */
export function fromParam<K extends string>(map: Record<K, string>, value: string | null): K | null {
  if (!value) return null;
  return (Object.keys(map) as K[]).find((k) => map[k] === value) ?? null;
}

/** "Cargar más": la página 3 trae los primeros 27 items. Valores raros = página 1. */
export function parsePage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : 1;
}

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

export type ArticleSection = "news" | "street" | "culture" | "stories";

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

export type EventWhen = "proximos" | "pasados";

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
