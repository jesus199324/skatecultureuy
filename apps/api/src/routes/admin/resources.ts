/**
 * Panel: skaters, spots, eventos, fotos, citas de portada y categorías.
 * Cada recurso tiene listado, detalle, crear, editar y borrar.
 */
import { Router } from "express";
import { and, asc, count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { publicLocationPrecision, type MediaAsset } from "../../../../../packages/shared/src";
import { HttpError } from "../../auth/middleware";
import type { Db } from "../../db/client";
import { articleGallery, articles, categories, events, mediaAssets, pullQuotes, skaters, spotGallery, spots } from "../../db/schema";
import { toMedia } from "../../lib/serialize";
import { parseBody, parseQuery, uuidParam } from "../../lib/validate";
import {
  ADMIN_PAGE_SIZE, adminListQuery, assertExist, crudSchemas, assertMediaExist, notFoundUnless, optionalText, paged, searchLike, slugSchema,
  statusSchema, uniqueSlug,
} from "./common";

const id = (req: { params: unknown }) => parseQuery(uuidParam, req.params).id;
const listOf = <T>(rows: T[], total: number, page: number) => paged(rows, total, page);

/* ───────── Skaters ───────── */

const skaterFields = {
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  city: z.string().trim().min(2).max(120),
  profileImageId: z.string().uuid().nullable(),
  highlights: z.string().trim().max(200),
  bio: z.string().trim().max(5000),
  stance: z.enum(["REGULAR", "GOOFY"]).nullable(),
  /** Usuario de Instagram sin @. */
  instagram: z.string().trim().transform((v) => v.replace(/^@/, "")).pipe(z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "usuario de Instagram inválido")).nullable(),
  featured: z.boolean(),
  position: z.number().int().min(0).max(10_000),
  status: statusSchema,};

export function adminSkatersRouter(db: Db) {
  const r = Router();
  const { create, update } = crudSchemas(skaterFields, { profileImageId: null, highlights: "", bio: "", stance: null, instagram: null, featured: false, position: 0, status: "DRAFT" });
  const load = async (skaterId: string) => {
    const k = notFoundUnless(await db.query.skaters.findFirst({ where: eq(skaters.id, skaterId), with: { profileImage: true } }), "Skater");
    return { ...k, profileImage: toMedia(k.profileImage) };
  };

  r.get("/", async (req, res) => {
    const q = parseQuery(adminListQuery, req.query);
    const conds: SQL[] = [];
    if (q.q) conds.push(or(searchLike(skaters.name, q.q), searchLike(skaters.city, q.q))!);
    if (q.estado) conds.push(eq(skaters.status, q.estado));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.query.skaters.findMany({ where, with: { profileImage: true }, orderBy: [asc(skaters.position), asc(skaters.name)], limit: ADMIN_PAGE_SIZE, offset: (q.pagina - 1) * ADMIN_PAGE_SIZE }),
      db.select({ total: count() }).from(skaters).where(where),
    ]);
    res.json(listOf(rows.map((k) => ({ ...k, profileImage: toMedia(k.profileImage) })), total, q.pagina));
  });
  r.get("/:id", async (req, res) => res.json(await load(id(req))));
  r.post("/", async (req, res) => {
    const input = parseBody(create, req.body);
    await assertMediaExist(db, [input.profileImageId]);
    const slug = await uniqueSlug(db, skaters, input.slug, input.name);
    const [row] = await db.insert(skaters).values({ ...input, slug }).returning({ id: skaters.id });
    res.status(201).json(await load(row.id));
  });
  r.patch("/:id", async (req, res) => {
    const skaterId = id(req);
    const input = parseBody(update, req.body);
    const current = await load(skaterId);
    await assertMediaExist(db, [input.profileImageId]);
    const values = { ...input, ...(input.slug !== undefined ? { slug: await uniqueSlug(db, skaters, input.slug, current.name, skaterId) } : {}) };
    if (Object.keys(values).length) await db.update(skaters).set(values).where(eq(skaters.id, skaterId));
    res.json(await load(skaterId));
  });
  r.delete("/:id", async (req, res) => {
    const [row] = await db.delete(skaters).where(eq(skaters.id, id(req))).returning({ id: skaters.id });
    notFoundUnless(row, "Skater");
    res.status(204).end();
  });
  return r;
}

/* ───────── Spots ───────── */

const FEATURES = ["BOWL", "MINI_RAMP", "PLAZA", "RAILS", "LEDGES", "STAIRS", "MANUAL_PAD", "GAP", "BANKS", "LIGHTING", "ROOFED"] as const;
const DEPARTMENTS = [
  "ARTIGAS", "CANELONES", "CERRO_LARGO", "COLONIA", "DURAZNO", "FLORES", "FLORIDA", "LAVALLEJA", "MALDONADO", "MONTEVIDEO",
  "PAYSANDU", "RIO_NEGRO", "RIVERA", "ROCHA", "SALTO", "SAN_JOSE", "SORIANO", "TACUAREMBO", "TREINTA_Y_TRES",
] as const;

const spotFields = {
  name: z.string().trim().min(2).max(120),
  slug: slugSchema.optional(),
  type: z.enum(["SKATEPARK", "STREET", "DIY"]),
  department: z.enum(DEPARTMENTS),
  features: z.array(z.enum(FEATURES)).max(FEATURES.length),
  coverImageId: z.string().uuid().nullable(),
  description: z.string().trim().max(3000),
  locality: z.string().trim().min(2).max(120),
  address: optionalText(200),
  // Uruguay está más o menos entre −30 y −35 de latitud y −53 y −58,5 de longitud.
  lat: z.number().min(-35.2).max(-30).nullable(),
  lng: z.number().min(-58.6).max(-53).nullable(),
  galleryIds: z.array(z.string().uuid()).max(40),
  featured: z.boolean(),
  position: z.number().int().min(0).max(10_000),
  status: statusSchema,};

export function adminSpotsRouter(db: Db) {
  const r = Router();
  const latLng = (v: { lat?: number | null; lng?: number | null }, ctx: z.RefinementCtx) => {
    if ((v.lat == null) !== (v.lng == null)) ctx.addIssue({ code: "custom", path: ["lat"], message: "latitud y longitud van juntas" });
  };
  const crud = crudSchemas(spotFields, { features: [], coverImageId: null, description: "", address: null, lat: null, lng: null, galleryIds: [], featured: false, position: 0, status: "DRAFT" });
  const create = crud.create.superRefine(latLng);
  const update = crud.update.superRefine(latLng);

  const load = async (spotId: string) => {
    const p = notFoundUnless(
      await db.query.spots.findFirst({ where: eq(spots.id, spotId), with: { coverImage: true, gallery: { with: { media: true }, orderBy: (g, { asc }) => [asc(g.position)] } } }),
      "Spot",
    );
    const precision = publicLocationPrecision(p.type);
    const { gallery, coverImage, ...rest } = p;
    return {
      ...rest,
      coverImage: toMedia(coverImage),
      gallery: gallery.map((g) => toMedia(g.media) as MediaAsset),
      /** Cómo se publica la ubicación (regla de la revista). */
      publicLocation: precision,
      ...(precision === "AREA" && (p.address || p.lat != null)
        ? { locationNote: "Spot de calle o DIY: la dirección y las coordenadas quedan guardadas pero no se publican." }
        : {}),
    };
  };

  const saveGallery = async (spotId: string, galleryIds?: string[]) => {
    if (!galleryIds) return;
    await db.transaction(async (tx) => {
      await tx.delete(spotGallery).where(eq(spotGallery.spotId, spotId));
      if (galleryIds.length) await tx.insert(spotGallery).values([...new Set(galleryIds)].map((mediaId, position) => ({ spotId, mediaId, position })));
    });
  };

  r.get("/", async (req, res) => {
    const q = parseQuery(adminListQuery, req.query);
    const conds: SQL[] = [];
    if (q.q) conds.push(or(searchLike(spots.name, q.q), searchLike(spots.locality, q.q))!);
    if (q.estado) conds.push(eq(spots.status, q.estado));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.query.spots.findMany({ where, with: { coverImage: true }, orderBy: [asc(spots.position), asc(spots.name)], limit: ADMIN_PAGE_SIZE, offset: (q.pagina - 1) * ADMIN_PAGE_SIZE }),
      db.select({ total: count() }).from(spots).where(where),
    ]);
    res.json(listOf(rows.map((p) => ({ ...p, coverImage: toMedia(p.coverImage), publicLocation: publicLocationPrecision(p.type) })), total, q.pagina));
  });
  r.get("/:id", async (req, res) => res.json(await load(id(req))));
  r.post("/", async (req, res) => {
    const { galleryIds, ...input } = parseBody(create, req.body);
    await assertMediaExist(db, [input.coverImageId, ...galleryIds]);
    const slug = await uniqueSlug(db, spots, input.slug, input.name);
    const [row] = await db.insert(spots).values({ ...input, slug }).returning({ id: spots.id });
    await saveGallery(row.id, galleryIds);
    res.status(201).json(await load(row.id));
  });
  r.patch("/:id", async (req, res) => {
    const spotId = id(req);
    const { galleryIds, ...input } = parseBody(update, req.body);
    const current = await load(spotId);
    if ((input.lat !== undefined) !== (input.lng !== undefined)) throw new HttpError(400, "Datos inválidos", [{ campo: "lat", error: "latitud y longitud van juntas" }]);
    await assertMediaExist(db, [input.coverImageId, ...(galleryIds ?? [])]);
    const values = { ...input, ...(input.slug !== undefined ? { slug: await uniqueSlug(db, spots, input.slug, current.name, spotId) } : {}) };
    if (Object.keys(values).length) await db.update(spots).set(values).where(eq(spots.id, spotId));
    await saveGallery(spotId, galleryIds);
    res.json(await load(spotId));
  });
  r.delete("/:id", async (req, res) => {
    const [row] = await db.delete(spots).where(eq(spots.id, id(req))).returning({ id: spots.id });
    notFoundUnless(row, "Spot");
    res.status(204).end();
  });
  return r;
}

/* ───────── Eventos ───────── */

const eventFields = {
  name: z.string().trim().min(3).max(160),
  slug: slugSchema.optional(),
  eventDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  location: z.string().trim().min(2).max(200),
  cancelled: z.boolean(),
  externalUrl: z.string().trim().url().refine((u) => u.startsWith("https://"), "tiene que empezar con https://").nullable(),
  description: z.string().trim().max(5000),
  coverImageId: z.string().uuid().nullable(),
  spotId: z.string().uuid().nullable(),
  status: statusSchema,};

export function adminEventsRouter(db: Db) {
  const r = Router();
  const dates = (v: { eventDate?: Date; endDate?: Date | null }, ctx: z.RefinementCtx) => {
    if (v.eventDate && v.endDate && v.endDate < v.eventDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "termina antes de empezar" });
  };
  const crud = crudSchemas(eventFields, { endDate: null, cancelled: false, externalUrl: null, description: "", coverImageId: null, spotId: null, status: "DRAFT" });
  const create = crud.create.superRefine(dates);
  const update = crud.update.superRefine(dates);
  const load = async (eventId: string) => {
    const e = notFoundUnless(await db.query.events.findFirst({ where: eq(events.id, eventId), with: { coverImage: true } }), "Evento");
    return { ...e, coverImage: toMedia(e.coverImage) };
  };
  const checkRefs = async (v: { coverImageId?: string | null; spotId?: string | null }) => {
    await assertMediaExist(db, [v.coverImageId]);
    if (v.spotId) await assertExist(db, spots, [v.spotId], "spots");
  };

  r.get("/", async (req, res) => {
    const q = parseQuery(adminListQuery, req.query);
    const conds: SQL[] = [];
    if (q.q) conds.push(or(searchLike(events.name, q.q), searchLike(events.location, q.q))!);
    if (q.estado) conds.push(eq(events.status, q.estado));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.query.events.findMany({ where, with: { coverImage: true }, orderBy: [desc(events.eventDate)], limit: ADMIN_PAGE_SIZE, offset: (q.pagina - 1) * ADMIN_PAGE_SIZE }),
      db.select({ total: count() }).from(events).where(where),
    ]);
    res.json(listOf(rows.map((e) => ({ ...e, coverImage: toMedia(e.coverImage) })), total, q.pagina));
  });
  r.get("/:id", async (req, res) => res.json(await load(id(req))));
  r.post("/", async (req, res) => {
    const input = parseBody(create, req.body);
    await checkRefs(input);
    const slug = await uniqueSlug(db, events, input.slug, input.name);
    const [row] = await db.insert(events).values({ ...input, slug }).returning({ id: events.id });
    res.status(201).json(await load(row.id));
  });
  r.patch("/:id", async (req, res) => {
    const eventId = id(req);
    const input = parseBody(update, req.body);
    const current = await load(eventId);
    const end = input.endDate !== undefined ? input.endDate : current.endDate;
    if (end && end < (input.eventDate ?? current.eventDate)) throw new HttpError(400, "Datos inválidos", [{ campo: "endDate", error: "termina antes de empezar" }]);
    await checkRefs(input);
    const values = { ...input, ...(input.slug !== undefined ? { slug: await uniqueSlug(db, events, input.slug, current.name, eventId) } : {}) };
    if (Object.keys(values).length) await db.update(events).set(values).where(eq(events.id, eventId));
    res.json(await load(eventId));
  });
  r.delete("/:id", async (req, res) => {
    const [row] = await db.delete(events).where(eq(events.id, id(req))).returning({ id: events.id });
    notFoundUnless(row, "Evento");
    res.status(204).end();
  });
  return r;
}

/* ───────── Fotos (metadatos; la subida a Cloudinary llega en la parte 5b) ───────── */

const mediaFields = {
  /** Recurso de Cloudinary, p. ej. "scuy/notas/abc123". */
  publicId: z.string().trim().regex(/^[A-Za-z0-9_\-/.]{1,200}$/, "public_id inválido"),
  width: z.number().int().min(1).max(20_000),
  height: z.number().int().min(1).max(20_000),
  /** Qué se ve en la foto, para quien no puede verla. Obligatorio. */
  altText: z.string().trim().min(3).max(300),
  /** Quién sacó la foto. Obligatorio: cada foto lleva crédito. */
  credit: z.string().trim().min(2).max(120),};

export function adminMediaRouter(db: Db) {
  const r = Router();
  const create = z.object(mediaFields).strict();
  const update = z.object({ altText: mediaFields.altText, credit: mediaFields.credit }).partial().strict();

  r.get("/", async (req, res) => {
    const q = parseQuery(adminListQuery.omit({ estado: true }), req.query);
    const where = q.q ? or(searchLike(mediaAssets.altText, q.q), searchLike(mediaAssets.credit, q.q)) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(mediaAssets).where(where).orderBy(desc(mediaAssets.createdAt)).limit(ADMIN_PAGE_SIZE).offset((q.pagina - 1) * ADMIN_PAGE_SIZE),
      db.select({ total: count() }).from(mediaAssets).where(where),
    ]);
    res.json(listOf(rows.map((m) => toMedia(m)!), total, q.pagina));
  });
  r.post("/", async (req, res) => {
    const [row] = await db.insert(mediaAssets).values(parseBody(create, req.body)).returning();
    res.status(201).json(toMedia(row));
  });
  r.patch("/:id", async (req, res) => {
    const mediaId = id(req);
    const input = parseBody(update, req.body);
    const [row] = await db.update(mediaAssets).set(input).where(eq(mediaAssets.id, mediaId)).returning();
    notFoundUnless(row, "Foto");
    // Las fotos dentro del cuerpo de las notas guardan una copia: se actualiza el texto alternativo y el crédito.
    await db.execute(sql`
      update articles set body = (
        select jsonb_agg(case when b->>'type' = 'image' and b->'image'->>'id' = ${mediaId}
          then jsonb_set(jsonb_set(b, '{image,altText}', to_jsonb(${row.altText}::text)), '{image,credit}', to_jsonb(${row.credit}::text))
          else b end)
        from jsonb_array_elements(body) b)
      where body @> ${JSON.stringify([{ image: { id: mediaId } }])}::jsonb`);
    res.json(toMedia(row));
  });
  r.delete("/:id", async (req, res) => {
    const mediaId = id(req);
    // No se borra una foto que está en uso (evita notas con agujeros).
    const used = await db.execute<{ n: number }>(sql`
      select (select count(*) from ${articles} where ${articles.coverImageId} = ${mediaId} or ${articles.body} @> ${JSON.stringify([{ image: { id: mediaId } }])}::jsonb)
           + (select count(*) from ${articleGallery} where ${articleGallery.mediaId} = ${mediaId})
           + (select count(*) from ${spotGallery} where ${spotGallery.mediaId} = ${mediaId})
           + (select count(*) from ${skaters} where ${skaters.profileImageId} = ${mediaId})
           + (select count(*) from ${spots} where ${spots.coverImageId} = ${mediaId})
           + (select count(*) from ${events} where ${events.coverImageId} = ${mediaId}) as n`);
    if (Number(used.rows[0]?.n) > 0) throw new HttpError(409, "La foto se está usando. Sacala de las notas, skaters, spots o eventos antes de borrarla.");
    const [row] = await db.delete(mediaAssets).where(eq(mediaAssets.id, mediaId)).returning({ id: mediaAssets.id });
    notFoundUnless(row, "Foto");
    res.status(204).end();
  });
  return r;
}

/* ───────── Citas de la portada ───────── */

export function adminQuotesRouter(db: Db) {
  const r = Router();
  const { create, update } = crudSchemas(
    { text: z.string().trim().min(3).max(300), attribution: z.string().trim().min(2).max(120), active: z.boolean() },
    { active: true },
  );
  r.get("/", async (_req, res) => res.json(await db.select().from(pullQuotes).orderBy(desc(pullQuotes.createdAt))));
  r.post("/", async (req, res) => {
    const [row] = await db.insert(pullQuotes).values(parseBody(create, req.body)).returning();
    res.status(201).json(row);
  });
  r.patch("/:id", async (req, res) => {
    const [row] = await db.update(pullQuotes).set(parseBody(update, req.body)).where(eq(pullQuotes.id, id(req))).returning();
    res.json(notFoundUnless(row, "Cita"));
  });
  r.delete("/:id", async (req, res) => {
    const [row] = await db.delete(pullQuotes).where(eq(pullQuotes.id, id(req))).returning({ id: pullQuotes.id });
    notFoundUnless(row, "Cita");
    res.status(204).end();
  });
  return r;
}

export function adminCategoriesRouter(db: Db) {
  const r = Router();
  r.get("/", async (_req, res) => res.json(await db.select().from(categories).orderBy(asc(categories.name))));
  return r;
}
