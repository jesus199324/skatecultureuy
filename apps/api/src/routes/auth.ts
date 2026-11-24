/**
 * Login del panel.
 *   POST /api/auth/login   { email, password }  → crea la sesión (cookie)
 *   POST /api/auth/logout                        → la cierra
 *   GET  /api/auth/me                            → usuario actual o 401
 */
import { Router, type CookieOptions } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Config } from "../config";
import type { Db } from "../db/client";
import { staffUsers } from "../db/schema";
import { HttpError, requireStaff } from "../auth/middleware";
import { verifyPassword } from "../auth/passwords";
import { SESSION_COOKIE, createSession, deleteSession } from "../auth/sessions";
import { parseBody } from "../lib/validate";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export function cookieOptions(config: Pick<Config, "NODE_ENV">, maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    // En producción solo viaja por HTTPS.
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

export function authRouter(db: Db, config: Pick<Config, "NODE_ENV" | "SESSION_DAYS" | "LOGIN_ATTEMPTS">) {
  const r = Router();

  // Freno a la fuerza bruta: pocos intentos fallidos cada 15 minutos por IP y email.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: config.LOGIN_ATTEMPTS,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? "")}|${String(req.body?.email ?? "").toLowerCase().slice(0, 200)}`,
    message: { error: "Demasiados intentos. Esperá 15 minutos y probá de nuevo." },
  });

  r.post("/login", loginLimiter, async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);
    const user = await db.query.staffUsers.findFirst({ where: eq(staffUsers.email, email) });
    const ok = await verifyPassword(user?.active ? user.passwordHash : null, password);
    // Mismo mensaje si el email no existe o la contraseña está mal (no revela qué cuentas hay).
    if (!user || !ok) throw new HttpError(401, "Email o contraseña incorrectos");
    const { token, expiresAt } = await createSession(db, user.id, config.SESSION_DAYS, req.get("user-agent"));
    await db.update(staffUsers).set({ lastLoginAt: new Date() }).where(eq(staffUsers.id, user.id));
    res
      .cookie(SESSION_COOKIE, token, cookieOptions(config, expiresAt.getTime() - Date.now()))
      .json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, expiresAt: expiresAt.toISOString() });
  });

  r.post("/logout", async (req, res) => {
    await deleteSession(db, req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions(config)).json({ ok: true });
  });

  r.get("/me", requireStaff(db), (req, res) => {
    res.json({ user: req.staff });
  });

  return r;
}
