import type { NextFunction, Request, Response } from "express";
import type { Db } from "../db/client";
import { SESSION_COOKIE, userFromToken, type StaffUser } from "./sessions";

declare module "express-serve-static-core" {
  interface Request {
    staff?: StaffUser;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Requiere sesión iniciada; deja el usuario en req.staff. */
export const requireStaff = (db: Db) => async (req: Request, _res: Response, next: NextFunction) => {
  const user = await userFromToken(db, req.cookies?.[SESSION_COOKIE]);
  if (!user) throw new HttpError(401, "Tenés que iniciar sesión");
  req.staff = user;
  next();
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.staff?.role !== "ADMIN") throw new HttpError(403, "Solo un administrador puede hacer esto");
  next();
};

/**
 * Protección CSRF: toda acción que cambia datos tiene que traer el encabezado
 * X-SCUY-CSRF. Un sitio ajeno no puede agregarlo (el navegador pide permiso
 * por CORS y solo los orígenes de la revista lo tienen).
 */
export const CSRF_HEADER = "x-scuy-csrf";
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get(CSRF_HEADER) !== "1") throw new HttpError(403, "Falta el encabezado de seguridad X-SCUY-CSRF");
  next();
}
