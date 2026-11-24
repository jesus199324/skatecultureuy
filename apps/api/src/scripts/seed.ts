/** Carga el contenido de demostración (reemplaza el demo anterior). Uso: npm run db:seed */
import { loadConfig } from "../config";
import { createDb } from "../db/client";
import { seedDemo } from "../db/seed-demo";

const { db, pool } = createDb(loadConfig().DATABASE_URL);
const n = await seedDemo(db);
await pool.end();
console.log(`Demo cargado: ${n.articles} notas, ${n.skaters} skaters, ${n.spots} spots y ${n.events} eventos (todo marcado DEMO).`);
