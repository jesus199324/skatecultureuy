/**
 * Aplicación Express. Se arma con una conexión a la base ya creada, así los
 * tests usan la misma app contra la base de prueba.
 */
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { sql } from "drizzle-orm";
import { corsOrigins, type Config } from "./config";
import type { Db } from "./db/client";
import { publicRouter } from "./routes/public";

export function createApp(db: Db, config: Pick<Config, "CORS_ORIGIN" | "RATE_LIMIT_PER_MINUTE" | "NODE_ENV">) {
  const app = express();
  app.disable("x-powered-by");
  // Detrás del proxy del hosting, para que el límite por IP use la IP real.
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins(config), methods: ["GET"], maxAge: 86_400 }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: config.RATE_LIMIT_PER_MINUTE,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Demasiados pedidos. Probá de nuevo en un minuto." },
    }),
  );

  // Las respuestas públicas se pueden cachear un minuto (CDN y navegador).
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    next();
  });

  app.get("/api/health", async (_req, res) => {
    await db.execute(sql`select 1`);
    res.set("Cache-Control", "no-store").json({ ok: true });
  });

  app.use("/api", publicRouter(db));

  app.use((_req, res) => {
    res.status(404).json({ error: "No encontrado" });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) console.error(err);
    res.set("Cache-Control", "no-store").status(status).json(
      status === 500
        ? { error: "Error interno" }
        : { error: err.message, ...(err.details ? { detalles: err.details } : {}) },
    );
  };
  app.use(onError);

  return app;
}
