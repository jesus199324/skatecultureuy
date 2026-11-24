import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>["db"];

/**
 * Conexión a PostgreSQL. Con Neon, la URL trae `sslmode=require` y pg usa TLS.
 * Pool chico: el plan gratis de Neon limita las conexiones.
 */
export function createDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 30_000 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  return { db, pool };
}
