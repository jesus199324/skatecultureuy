/** Piezas comunes de la API de administración. */
import { and, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { slugify } from "../../../../../packages/shared/src";
import { HttpError } from "../../auth/middleware";
import type { Db } from "../../db/client";
import { mediaAssets } from "../../db/schema";

export const ADMIN_PAGE_SIZE = 20;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "solo minúsculas, números y guiones (ej: mi-nota-nueva)")
  .max(160);

export const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** Listados del panel: ?pagina=, ?q= (busca por texto), ?estado=DRAFT|PUBLISHED. */
export const adminListQuery = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000).default(1),
    q: z.string().trim().max(100).optional(),
    estado: statusSchema.optional(),
  })
  .strict();

export function paged<T>(items: T[], total: number, page: number) {
  return { items, total, page, pageSize: ADMIN_PAGE_SIZE, hasMore: page * ADMIN_PAGE_SIZE < total };
}

/** Busca sin importar mayúsculas ni tildes. */
export const searchLike = (col: PgColumn, q: string): SQL =>
  sql`unaccent_simple(${col}) ilike unaccent_simple(${"%" + q.replace(/[%_\\]/g, (c) => "\\" + c) + "%"})`;

/** Slug del pedido o, si no vino, a partir del título. Verifica que no esté usado. */
export async function uniqueSlug(
  db: Db,
  table: PgTable & { slug: PgColumn; id: PgColumn },
  wanted: string | undefined,
  from: string,
  exceptId?: string,
): Promise<string> {
  const slug = wanted || slugify(from).slice(0, 160);
  if (!slug) throw new HttpError(400, "No se pudo armar el slug: escribilo a mano", [{ campo: "slug", error: "vacío" }]);
  const where = exceptId ? and(eq(table.slug, slug), ne(table.id, exceptId)) : eq(table.slug, slug);
  const [taken] = await db.select({ id: table.id }).from(table).where(where).limit(1);
  if (taken) throw new HttpError(409, `Ya existe otro con el slug "${slug}". Elegí uno distinto.`, [{ campo: "slug", error: "ya existe" }]);
  return slug;
}

/** Verifica que las fotos existan antes de usarlas (respuesta 400 clara en vez de un error de la base). */
export async function assertMediaExist(db: Db, ids: (string | null | undefined)[]) {
  const wanted = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (wanted.length === 0) return;
  const found = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(inArray(mediaAssets.id, wanted));
  const missing = wanted.filter((id) => !found.some((f) => f.id === id));
  if (missing.length) throw new HttpError(400, "Hay fotos que no existen", missing.map((id) => ({ campo: "foto", error: `no existe ${id}` })));
}

/** Verifica que existan las filas referenciadas (skaters, spots...). */
export async function assertExist(db: Db, table: PgTable & { id: PgColumn }, ids: string[], label: string) {
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return;
  const found = await db.select({ id: table.id }).from(table).where(inArray(table.id, wanted));
  const missing = wanted.filter((id) => !found.some((f) => f.id === id));
  if (missing.length) throw new HttpError(400, `Hay ${label} que no existen`, missing.map((id) => ({ campo: label, error: `no existe ${id}` })));
}

/** Busca por id o responde 404. */
export function notFoundUnless<T>(row: T | undefined, what: string): T {
  if (!row) throw new HttpError(404, `${what} no encontrado`);
  return row;
}

/**
 * Esquemas de crear y editar a partir de los mismos campos.
 * - Crear: los campos con valor por defecto son opcionales y se completan.
 * - Editar: todo es opcional y lo que no viene NO se toca (sin valores por defecto).
 */
export function crudSchemas<S extends z.ZodRawShape>(shape: S, defaults: Partial<{ [K in keyof S]: z.infer<S[K]> }>) {
  type Out = z.infer<z.ZodObject<S>>;
  const optional = Object.fromEntries(Object.keys(defaults).map((k) => [k, true])) as { [K in keyof S]?: true };
  const create = z
    .object(shape)
    .partial(optional as never)
    .strict()
    .transform((v) => ({ ...defaults, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) }) as Out);
  const update = z.object(shape).partial().strict();
  return { create, update };
}
