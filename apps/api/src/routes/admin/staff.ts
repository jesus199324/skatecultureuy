/**
 * Cuentas del staff (solo ADMIN). No hay registro público.
 * Reglas: nadie se puede sacar a sí mismo el rol de admin ni desactivarse,
 * y siempre queda al menos un admin activo.
 */
import { Router } from "express";
import { and, asc, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { HttpError } from "../../auth/middleware";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../../auth/passwords";
import { deleteUserSessions } from "../../auth/sessions";
import type { Db } from "../../db/client";
import { staffUsers } from "../../db/schema";
import { parseBody, parseQuery, uuidParam } from "../../lib/validate";
import { notFoundUnless } from "./common";

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `mínimo ${MIN_PASSWORD_LENGTH} caracteres`)
  .max(200);

const publicColumns = { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true } as const;

export function adminStaffRouter(db: Db) {
  const r = Router();
  const create = z
    .object({
      email: z.string().trim().toLowerCase().email().max(200),
      name: z.string().trim().min(2).max(120),
      role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
      password: passwordSchema,
    })
    .strict();
  const update = z
    .object({ name: z.string().trim().min(2).max(120), role: z.enum(["ADMIN", "EDITOR"]), active: z.boolean(), password: passwordSchema })
    .partial()
    .strict();

  const activeAdmins = async (exceptId: string) =>
    (await db.select({ n: count() }).from(staffUsers).where(and(eq(staffUsers.role, "ADMIN"), eq(staffUsers.active, true), ne(staffUsers.id, exceptId))))[0].n;

  r.get("/", async (_req, res) => {
    res.json(await db.query.staffUsers.findMany({ columns: publicColumns, orderBy: [asc(staffUsers.name)] }));
  });

  r.post("/", async (req, res) => {
    const input = parseBody(create, req.body);
    const [taken] = await db.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.email, input.email));
    if (taken) throw new HttpError(409, "Ya existe una cuenta con ese email");
    const [row] = await db
      .insert(staffUsers)
      .values({ email: input.email, name: input.name, role: input.role, passwordHash: await hashPassword(input.password) })
      .returning({ id: staffUsers.id });
    res.status(201).json(await db.query.staffUsers.findFirst({ where: eq(staffUsers.id, row.id), columns: publicColumns }));
  });

  r.patch("/:id", async (req, res) => {
    const { id } = parseQuery(uuidParam, req.params);
    const input = parseBody(update, req.body);
    const current = notFoundUnless(await db.query.staffUsers.findFirst({ where: eq(staffUsers.id, id) }), "Cuenta");
    const losesAdmin = (input.role && input.role !== "ADMIN") || input.active === false;
    if (losesAdmin && id === req.staff!.id) throw new HttpError(400, "No podés sacarte el rol de admin ni desactivar tu propia cuenta");
    if (losesAdmin && current.role === "ADMIN" && (await activeAdmins(id)) === 0) throw new HttpError(400, "Tiene que quedar al menos un admin activo");
    const { password, ...rest } = input;
    await db.update(staffUsers).set({ ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) }).where(eq(staffUsers.id, id));
    // Nueva contraseña o cuenta desactivada: se cierran sus sesiones abiertas.
    if (password || input.active === false) await deleteUserSessions(db, id);
    res.json(await db.query.staffUsers.findFirst({ where: eq(staffUsers.id, id), columns: publicColumns }));
  });

  return r;
}
