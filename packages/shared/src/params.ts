/**
 * Valores de filtro en las URLs (front y API usan los mismos): en español,
 * sin tildes, para que se lean bien y se puedan compartir.
 * /news?tema=competencias · /spots?depto=rocha&tipo=calle · ?pagina=2
 */
import { DEPARTMENT_LABELS } from "./labels";
import type { ArticleFormat, Department, NewsTopic, SpotType } from "./types";

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
export function fromParam<K extends string>(map: Record<K, string>, value: string | null | undefined): K | null {
  if (!value) return null;
  return (Object.keys(map) as K[]).find((k) => map[k] === value) ?? null;
}

/** "Cargar más": la página 3 trae los primeros 27 items. Valores raros = página 1. */
export function parsePage(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : 1;
}

export type ArticleSection = "news" | "street" | "culture" | "stories";
export const ARTICLE_SECTIONS: ArticleSection[] = ["news", "street", "culture", "stories"];
export type EventWhen = "proximos" | "pasados";
