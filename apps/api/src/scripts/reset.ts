/**
 * Borra contenido. Por defecto solo el demo (antes de lanzar la revista).
 *   npm run db:reset           → borra solo el contenido DEMO
 *   npm run db:reset -- --todo → vacía todas las tablas (no se permite en producción)
 */
import { loadConfig } from "../config";
import { createDb } from "../db/client";
import { deleteDemo, truncateAll } from "../db/seed-demo";

const config = loadConfig();
const all = process.argv.includes("--todo");
if (all && config.NODE_ENV === "production") {
  console.error("No se puede vaciar toda la base en producción.");
  process.exit(1);
}
const { db, pool } = createDb(config.DATABASE_URL);
if (all) await truncateAll(db);
else await deleteDemo(db);
await pool.end();
console.log(all ? "Base vacía." : "Contenido DEMO borrado. El contenido real no se tocó.");
