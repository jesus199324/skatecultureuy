/**
 * Sesiones del panel. El token viaja en una cookie httpOnly; en la base se
 * guarda solo su SHA-256. Cerrar sesión o desactivar la cuenta la invalida.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Db } from "../db/client";
import { sessions, staffUsers } from "../db/schema";

export const SESSION_COOKIE = "scuy_session";

const sha256 = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(db: Db, userId: string, days: number, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt, userAgent: userAgent?.slice(0, 300) ?? null });
  // De paso, se limpian las sesiones vencidas.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return { token, expiresAt };
}

export type StaffUser = Pick<typeof staffUsers.$inferSelect, "id" | "email" | "name" | "role">;

/** Usuario de la sesión, o null si el token no existe, venció o la cuenta está desactivada. */
export async function userFromToken(db: Db, token: string | undefined): Promise<StaffUser | null> {
  if (!token || token.length > 100) return null;
  const s = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())),
    with: { user: true },
  });
  if (!s || !s.user.active) return null;
  const { id, email, name, role } = s.user;
  return { id, email, name, role };
}

export async function deleteSession(db: Db, token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

/** Cierra todas las sesiones de una cuenta (al cambiar la contraseña o desactivarla). */
export async function deleteUserSessions(db: Db, userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
