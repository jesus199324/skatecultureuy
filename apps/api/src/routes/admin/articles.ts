/**
 * Notas en el panel: listado (todas, también borradores), detalle, crear,
 * editar y borrar.
 */
import { Router } from "express";
import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";
import { parseVideoUrl, readingMinutes, type ArticleBlock, type MediaAsset } from "../../../../../packages/shared/src";
import { HttpError } from "../../auth/middleware";
import type { Db } from "../../db/client";
import { articleGallery, articleSkaters, articleSpots, articles, categories, mediaAssets, skaters, spots } from "../../db/schema";
import { toMedia } from "../../lib/serialize";
import { parseBody, parseQuery, uuidParam } from "../../lib/validate";
import {
  ADMIN_PAGE_SIZE, adminListQuery, assertExist, crudSchemas, assertMediaExist, notFoundUnless, optionalText, paged, searchLike, slugSchema,
  statusSchema, uniqueSlug,
} from "./common";

const text = (max: number) => z.string().trim().min(1).max(max);

/** Bloques tal como los manda el panel (las fotos van por id). */
const blockInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: text(5000) }),
  z.object({ type: z.literal("heading"), text: text(200) }),
  z.object({ type: z.literal("quote"), text: text(600), attribution: optionalText(200) }),
  z.object({ type: z.literal("qa"), question: text(600), answer: text(5000) }),
  z.object({ type: z.literal("image"), imageId: z.string().uuid(), caption: optionalText(300) }),
]);

const fields = {
  title: z.string().trim().min(3).max(200),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(400),
  format: z.enum(["STORY", "INTERVIEW", "GALLERY", "VIDEO", "NEWS"]),
  /** Slug de la categoría: news, street, skaters, culture, revista. */
  category: slugSchema,
  author: z.string().trim().min(1).max(120),
  coverImageId: z.string().uuid().nullable(),
  featured: z.boolean(),
  status: statusSchema,
  /** Fecha de publicación. Si es futura, la nota queda programada. */
  publishedAt: z.coerce.date().nullable(),
  newsTopic: z.enum(["ESCENA_LOCAL", "COMPETENCIAS", "INTERNACIONAL", "INDUSTRIA"]).nullable(),
  videoUrl: z.string().trim().max(300).nullable(),
  videoDuration: z.string().regex(/^\d{1,2}:\d{2}$/, "formato m:ss").nullable(),
  body: z.array(blockInput).max(300),
  galleryIds: z.array(z.string().uuid()).max(80),
  skaterIds: z.array(z.string().uuid()).max(30),
  spotIds: z.array(z.string().uuid()).max(30),};

type ArticleInput = z.infer<z.ZodObject<typeof fields>>;

/** Reglas que dependen de varios campos juntos. */
function checkRules(a: Pick<ArticleInput, "format" | "newsTopic" | "videoUrl">, ctx: z.RefinementCtx) {
  if (a.format === "NEWS" && !a.newsTopic) ctx.addIssue({ code: "custom", path: ["newsTopic"], message: "una noticia necesita tema" });
  if (a.format !== "NEWS" && a.newsTopic) ctx.addIssue({ code: "custom", path: ["newsTopic"], message: "el tema es solo para noticias" });
  if (a.format === "VIDEO" && !a.videoUrl) ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "una nota de video necesita el link de YouTube o Vimeo" });
  if (a.videoUrl && !parseVideoUrl(a.videoUrl)) ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "no es un link de YouTube o Vimeo válido" });
}

const crud = crudSchemas(fields, { excerpt: "", coverImageId: null, featured: false, status: "DRAFT", publishedAt: null, newsTopic: null, videoUrl: null, videoDuration: null, body: [], galleryIds: [], skaterIds: [], spotIds: [] });
const createSchema = crud.create.superRefine(checkRules);
const updateSchema = crud.update;

const listQuery = adminListQuery.extend({ seccion: slugSchema.optional() });

/** De bloques del panel (foto por id) a bloques guardados (foto completa, para leer rápido). */
async function resolveBlocks(db: Db, blocks: z.infer<typeof blockInput>[]): Promise<ArticleBlock[]> {
  const ids = blocks.flatMap((b) => (b.type === "image" ? [b.imageId] : []));
  await assertMediaExist(db, ids);
  const rows = ids.length ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids)) : [];
  const byId = new Map(rows.map((r) => [r.id, toMedia(r)!]));
  return blocks.map((b): ArticleBlock => {
    switch (b.type) {
      case "image":
        return { type: "image", image: byId.get(b.imageId)!, caption: b.caption ?? null };
      case "quote":
        return { type: "quote", text: b.text, attribution: b.attribution ?? null };
      default:
        return b;
    }
  });
}

/** De bloques guardados a bloques del panel. */
const toBlockInput = (b: ArticleBlock) => (b.type === "image" ? { type: "image" as const, imageId: b.image.id, caption: b.caption, image: b.image } : b);

async function categoryIdOf(db: Db, slug: string) {
  const [c] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (!c) throw new HttpError(400, "Datos inválidos", [{ campo: "category", error: `no existe la sección "${slug}"` }]);
  return c.id;
}

async function loadAdminArticle(db: Db, id: string) {
  const a = notFoundUnless(
    await db.query.articles.findFirst({
      where: eq(articles.id, id),
      with: {
        category: true,
        coverImage: true,
        gallery: { with: { media: true }, orderBy: (g, { asc }) => [asc(g.position)] },
        skaters: { columns: { skaterId: true } },
        spots: { columns: { spotId: true } },
      },
    }),
    "Nota",
  );
  const { category, coverImage, gallery, skaters: ks, spots: ps, video, body, ...rest } = a;
  return {
    ...rest,
    category: category.slug,
    coverImage: toMedia(coverImage),
    body: body.map(toBlockInput),
    videoUrl: video?.videoId ? (video.provider === "YOUTUBE" ? `https://www.youtube.com/watch?v=${video.videoId}` : `https://vimeo.com/${video.videoId}`) : null,
    gallery: gallery.map((g) => toMedia(g.media) as MediaAsset),
    skaterIds: ks.map((k) => k.skaterId),
    spotIds: ps.map((p) => p.spotId),
    /** Cómo la ve el público ahora: borrador, programada o publicada. */
    visibility: rest.status === "DRAFT" ? "DRAFT" : rest.publishedAt && rest.publishedAt > new Date() ? "SCHEDULED" : "PUBLISHED",
  };
}

async function save(db: Db, input: Partial<ArticleInput>, existing?: { id: string; title: string; status: string; publishedAt: Date | null; format: string; newsTopic: string | null; videoUrl: string | null }) {
  // Reglas entre campos también al editar (con los valores que quedan).
  const merged = { format: input.format ?? existing?.format, newsTopic: input.newsTopic !== undefined ? input.newsTopic : existing?.newsTopic, videoUrl: input.videoUrl !== undefined ? input.videoUrl : existing?.videoUrl };
  const check = z.object({}).passthrough().superRefine((_v, ctx) => checkRules(merged as never, ctx)).safeParse({});
  if (!check.success) throw new HttpError(400, "Datos inválidos", check.error.issues.map((i) => ({ campo: i.path.join("."), error: i.message })));

  await assertMediaExist(db, [input.coverImageId, ...(input.galleryIds ?? [])]);
  if (input.skaterIds) await assertExist(db, skaters, input.skaterIds, "skaters");
  if (input.spotIds) await assertExist(db, spots, input.spotIds, "spots");

  const values: Partial<typeof articles.$inferInsert> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.slug !== undefined || !existing) values.slug = await uniqueSlug(db, articles, input.slug, input.title ?? existing!.title, existing?.id);
  if (input.excerpt !== undefined) values.excerpt = input.excerpt;
  if (input.format !== undefined) values.format = input.format;
  if (input.category !== undefined) values.categoryId = await categoryIdOf(db, input.category);
  if (input.author !== undefined) values.author = input.author;
  if (input.coverImageId !== undefined) values.coverImageId = input.coverImageId;
  if (input.featured !== undefined) values.featured = input.featured;
  if (input.status !== undefined) values.status = input.status;
  if (input.publishedAt !== undefined) values.publishedAt = input.publishedAt;
  if (input.newsTopic !== undefined) values.newsTopic = input.newsTopic;
  if (input.videoDuration !== undefined) values.videoDuration = input.videoDuration;
  if (input.videoUrl !== undefined) {
    const v = input.videoUrl ? parseVideoUrl(input.videoUrl) : null;
    values.video = v ? { ...v, title: input.title ?? existing?.title ?? "" } : null;
  }
  if (input.body !== undefined) {
    values.body = await resolveBlocks(db, input.body);
    values.readMinutes = readingMinutes(values.body.flatMap((b) => (b.type === "paragraph" || b.type === "heading" || b.type === "quote" ? [b.text] : b.type === "qa" ? [b.question, b.answer] : [])));
  }
  // Al publicar sin fecha, se publica ahora.
  const status = values.status ?? existing?.status;
  const publishedAt = values.publishedAt !== undefined ? values.publishedAt : existing?.publishedAt;
  if (status === "PUBLISHED" && !publishedAt) values.publishedAt = new Date();

  return db.transaction(async (tx) => {
    let id = existing?.id;
    if (id) {
      if (Object.keys(values).length) await tx.update(articles).set(values).where(eq(articles.id, id));
    } else {
      const [row] = await tx.insert(articles).values(values as typeof articles.$inferInsert).returning({ id: articles.id });
      id = row.id;
    }
    if (input.galleryIds) {
      await tx.delete(articleGallery).where(eq(articleGallery.articleId, id));
      if (input.galleryIds.length) await tx.insert(articleGallery).values([...new Set(input.galleryIds)].map((mediaId, position) => ({ articleId: id!, mediaId, position })));
    }
    if (input.skaterIds) {
      await tx.delete(articleSkaters).where(eq(articleSkaters.articleId, id));
      if (input.skaterIds.length) await tx.insert(articleSkaters).values([...new Set(input.skaterIds)].map((skaterId) => ({ articleId: id!, skaterId })));
    }
    if (input.spotIds) {
      await tx.delete(articleSpots).where(eq(articleSpots.articleId, id));
      if (input.spotIds.length) await tx.insert(articleSpots).values([...new Set(input.spotIds)].map((spotId) => ({ articleId: id!, spotId })));
    }
    return id;
  });
}

export function adminArticlesRouter(db: Db) {
  const r = Router();

  r.get("/", async (req, res) => {
    const q = parseQuery(listQuery, req.query);
    const conds: SQL[] = [];
    if (q.q) conds.push(searchLike(articles.title, q.q));
    if (q.estado) conds.push(eq(articles.status, q.estado));
    if (q.seccion) conds.push(eq(articles.categoryId, await categoryIdOf(db, q.seccion)));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.query.articles.findMany({
        where,
        columns: { body: false },
        with: { category: true, coverImage: true },
        orderBy: [desc(articles.updatedAt)],
        limit: ADMIN_PAGE_SIZE,
        offset: (q.pagina - 1) * ADMIN_PAGE_SIZE,
      }),
      db.select({ total: count() }).from(articles).where(where),
    ]);
    const now = new Date();
    res.json(paged(
      rows.map(({ category, coverImage, video: _v, ...a }) => ({
        ...a,
        category: category.slug,
        coverImage: toMedia(coverImage),
        visibility: a.status === "DRAFT" ? "DRAFT" : a.publishedAt && a.publishedAt > now ? "SCHEDULED" : "PUBLISHED",
      })),
      total,
      q.pagina,
    ));
  });

  r.get("/:id", async (req, res) => {
    res.json(await loadAdminArticle(db, parseQuery(uuidParam, req.params).id));
  });

  r.post("/", async (req, res) => {
    const input = parseBody(createSchema, req.body);
    const id = await save(db, input);
    res.status(201).json(await loadAdminArticle(db, id));
  });

  r.patch("/:id", async (req, res) => {
    const { id } = parseQuery(uuidParam, req.params);
    const input = parseBody(updateSchema, req.body);
    const current = await loadAdminArticle(db, id);
    await save(db, input, { ...current, videoUrl: current.videoUrl });
    res.json(await loadAdminArticle(db, id));
  });

  r.delete("/:id", async (req, res) => {
    const { id } = parseQuery(uuidParam, req.params);
    const [row] = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id });
    notFoundUnless(row, "Nota");
    res.status(204).end();
  });

  return r;
}
