/**
 * API del panel: /api/admin/*. Requiere sesión iniciada y el encabezado
 * anti-CSRF en las acciones que cambian datos. Las cuentas, solo ADMIN.
 */
import { Router } from "express";
import type { Db } from "../../db/client";
import { requireAdmin, requireCsrfHeader, requireStaff } from "../../auth/middleware";
import { adminArticlesRouter } from "./articles";
import { adminCategoriesRouter, adminEventsRouter, adminMediaRouter, adminQuotesRouter, adminSkatersRouter, adminSpotsRouter } from "./resources";
import { adminStaffRouter } from "./staff";

export function adminRouter(db: Db) {
  const r = Router();
  r.use(requireStaff(db), requireCsrfHeader);
  r.use("/articles", adminArticlesRouter(db));
  r.use("/skaters", adminSkatersRouter(db));
  r.use("/spots", adminSpotsRouter(db));
  r.use("/events", adminEventsRouter(db));
  r.use("/media", adminMediaRouter(db));
  r.use("/quotes", adminQuotesRouter(db));
  r.use("/categories", adminCategoriesRouter(db));
  r.use("/staff", requireAdmin, adminStaffRouter(db));
  return r;
}
