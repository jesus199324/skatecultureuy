/**
 * Endpoints públicos de solo lectura. Usan los mismos parámetros que las URLs
 * de la revista (?tema=, ?formato=, ?depto=, ?tipo=, ?cuando=, ?pagina=).
 * Un valor de filtro inválido responde 400 con el detalle.
 */
import { Router, type Request } from "express";
import { z } from "zod";
import {
  ARTICLE_SECTIONS, DEPARTMENT_PARAM, FORMAT_PARAM, SPOT_TYPE_PARAM, TOPIC_PARAM, fromParam,
  type ArticleFormat, type Department, type NewsTopic, type SpotType,
} from "../../../../packages/shared/src";
import type { Db } from "../db/client";
import * as content from "../services/content";

// Mensajes de validación en español.
z.config(z.locales.es());

const values = (m: Record<string, string>) => Object.values(m) as [string, ...string[]];
const pageSchema = z.coerce.number().int().min(1).max(100).default(1);
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug inválido").max(160);

const articleQuery = z.object({
  seccion: z.enum(ARTICLE_SECTIONS),
  tema: z.enum(values(TOPIC_PARAM)).optional(),
  formato: z.enum(values(FORMAT_PARAM)).optional(),
  pagina: pageSchema,
}).strict();
const spotQuery = z.object({
  depto: z.enum(values(DEPARTMENT_PARAM)).optional(),
  tipo: z.enum(values(SPOT_TYPE_PARAM)).optional(),
  pagina: pageSchema,
}).strict();
const eventQuery = z.object({ cuando: z.enum(["proximos", "pasados"]).default("proximos") }).strict();
const skaterQuery = z.object({ pagina: pageSchema }).strict();

export class BadRequestError extends Error {
  status = 400;
  constructor(message: string, public details?: unknown) {
    super(message);
  }
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw new BadRequestError("Parámetros inválidos", r.error.issues.map((i) => ({ campo: i.path.join("."), error: i.message })));
  }
  return r.data;
}

const slug = (req: Request) => parse(z.object({ slug: slugSchema }), req.params).slug;

export function publicRouter(db: Db) {
  const r = Router();

  r.get("/home", async (_req, res) => {
    res.json(await content.getHome(db));
  });

  r.get("/articles", async (req, res) => {
    const q = parse(articleQuery, req.query);
    res.json(
      await content.listArticles(db, {
        section: q.seccion,
        topic: fromParam<NewsTopic>(TOPIC_PARAM, q.tema),
        format: fromParam<Exclude<ArticleFormat, "NEWS">>(FORMAT_PARAM, q.formato),
        page: q.pagina,
      }),
    );
  });
  r.get("/articles/:slug", async (req, res) => {
    res.json(await content.getArticle(db, slug(req)));
  });

  r.get("/skaters", async (req, res) => {
    res.json(await content.listSkaters(db, parse(skaterQuery, req.query).pagina));
  });
  r.get("/skaters/:slug", async (req, res) => {
    res.json(await content.getSkater(db, slug(req)));
  });

  r.get("/spots", async (req, res) => {
    const q = parse(spotQuery, req.query);
    res.json(
      await content.listSpots(db, {
        department: fromParam<Department>(DEPARTMENT_PARAM, q.depto),
        type: fromParam<SpotType>(SPOT_TYPE_PARAM, q.tipo),
        page: q.pagina,
      }),
    );
  });
  r.get("/spots/:slug", async (req, res) => {
    res.json(await content.getSpot(db, slug(req)));
  });

  r.get("/events", async (req, res) => {
    res.json(await content.listEvents(db, parse(eventQuery, req.query).cuando));
  });
  r.get("/events/:slug", async (req, res) => {
    res.json(await content.getEvent(db, slug(req)));
  });

  return r;
}
