/**
 * Aplicación Express. Se arma con una conexión a la base ya creada, así los
 * tests usan la misma app contra la base de prueba.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { sql } from "drizzle-orm";
import { corsOrigins, type Config } from "./config";
import type { Db } from "./db/client";
import { CSRF_HEADER } from "./auth/middleware";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { publicRouter } from "./routes/public";

export type AppConfig = Pick<Config, "CORS_ORIGIN" | "RATE_LIMIT_PER_MINUTE" | "NODE_ENV" | "SESSION_DAYS" | "LOGIN_ATTEMPTS">;

export function createApp(db: Db, config: AppConfig) {
  const app = express();
  app.disable("x-powered-by");
  // Detrás del proxy del hosting, para que el límite por IP use la IP real.
  app.set("trust proxy", 1);
  app.use(helmet());
  // credentials: el panel manda la cookie de sesión. Solo los orígenes de la revista.
  app.use(
    cors({
      origin: corsOrigins(config),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", CSRF_HEADER],
      maxAge: 86_400,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
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

  // Las respuestas públicas se pueden cachear un minuto (CDN y navegador);
  // las del panel y el login, nunca.
  app.use("/api", (req, res, next) => {
    const priv = req.path.startsWith("/admin") || req.path.startsWith("/auth");
    res.set("Cache-Control", priv ? "no-store" : "public, max-age=60, stale-while-revalidate=300");
    next();
  });

  app.get("/api", (_req, res) => {
    res.json({
      nombre: "API de SKATE CULTURE UY",
      publico: [
        "GET /api/health",
        "GET /api/home",
        "GET /api/articles?seccion=news|street|culture|stories&tema=&formato=&pagina=",
        "GET /api/articles/:slug",
        "GET /api/skaters?pagina=",
        "GET /api/skaters/:slug",
        "GET /api/spots?depto=&tipo=&pagina=",
        "GET /api/spots/:slug",
        "GET /api/events?cuando=proximos|pasados",
        "GET /api/events/:slug",
      ],
      panel: [
        "POST /api/auth/login · POST /api/auth/logout · GET /api/auth/me",
        "/api/admin/articles · skaters · spots · events · media · quotes · categories · staff (requiere sesión)",
      ],
    });
  });

  app.get("/api/health", async (_req, res) => {
    await db.execute(sql`select 1`);
    res.set("Cache-Control", "no-store").json({ ok: true });
  });

  app.use("/api/auth", authRouter(db, config));
  app.use("/api/admin", adminRouter(db));
  app.use("/api", publicRouter(db));

  app.use((_req, res) => {
    res.status(404).json({ error: "No encontrado" });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "El cuerpo del pedido no es JSON válido" });
      return;
    }
    if (err?.type === "entity.too.large") {
      res.status(413).json({ error: "El pedido es demasiado grande" });
      return;
    }
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
