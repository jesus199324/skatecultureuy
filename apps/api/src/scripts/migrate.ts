/** Aplica las migraciones pendientes (apps/api/drizzle). Uso: npm run db:migrate */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadConfig } from "../config";
import { createDb, type Db } from "../db/client";

export const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export async function runMigrations(db: Db) {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { db, pool } = createDb(loadConfig().DATABASE_URL);
  await runMigrations(db);
  await pool.end();
  console.log("Migraciones aplicadas.");
}
