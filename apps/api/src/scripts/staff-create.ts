/**
 * Crea una cuenta del staff (o le cambia la contraseña si ya existe).
 * Uso: npm run staff:create -- --email vos@mail.com --name "Tu nombre" [--role ADMIN|EDITOR]
 * La contraseña se pide por la terminal (no queda en el historial).
 */
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../auth/passwords";
import { deleteUserSessions } from "../auth/sessions";
import { loadConfig } from "../config";
import { createDb } from "../db/client";
import { staffUsers } from "../db/schema";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "ADMIN" } },
});
const email = values.email?.trim().toLowerCase();
const role = values.role?.toUpperCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !values.name || (role !== "ADMIN" && role !== "EDITOR")) {
  console.error('Uso: npm run staff:create -- --email vos@mail.com --name "Tu nombre" [--role ADMIN|EDITOR]');
  process.exit(1);
}

/** Una sola interfaz de lectura para todas las preguntas; lo que se escribe no se muestra. */
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WritableStream };
let muted = false;
out._writeToOutput = (s) => {
  if (!muted) out.output.write(s);
};
const lines = rl[Symbol.asyncIterator]();

/** Pregunta sin mostrar la respuesta. Con STAFF_PASSWORD en el entorno no pregunta (para automatizar). */
async function askHidden(question: string): Promise<string> {
  if (process.env.STAFF_PASSWORD) return process.env.STAFF_PASSWORD;
  process.stdout.write(question);
  muted = true;
  const { value } = await lines.next();
  muted = false;
  process.stdout.write("\n");
  return String(value ?? "");
}

const password = await askHidden(`Contraseña para ${email} (mínimo ${MIN_PASSWORD_LENGTH} caracteres): `);
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  process.exit(1);
}
if (!process.env.STAFF_PASSWORD && (await askHidden("Repetila: ")) !== password) {
  console.error("Las contraseñas no coinciden.");
  process.exit(1);
}
rl.close();

const { db, pool } = createDb(loadConfig().DATABASE_URL);
const passwordHash = await hashPassword(password);
const [existing] = await db.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.email, email));
if (existing) {
  await db.update(staffUsers).set({ passwordHash, name: values.name, role: role as "ADMIN" | "EDITOR", active: true }).where(eq(staffUsers.id, existing.id));
  await deleteUserSessions(db, existing.id);
  console.log(`Cuenta actualizada: ${email} (${role}). Se cerraron sus sesiones abiertas.`);
} else {
  await db.insert(staffUsers).values({ email, name: values.name, role: role as "ADMIN" | "EDITOR", passwordHash });
  console.log(`Cuenta creada: ${email} (${role}).`);
}
await pool.end();
