/**
 * Configuración de la API desde variables de entorno (ver .env.example).
 * Si falta algo obligatorio, la API no arranca y dice qué falta.
 */
import { z } from "zod";

z.config(z.locales.es());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL tiene que ser una URL de PostgreSQL" }),
  /** Orígenes que pueden llamar a la API desde el navegador, separados por coma. */
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  /** Pedidos por minuto y por IP. */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Configuración inválida de la API:\n${issues}\nRevisá apps/api/.env (podés copiar .env.example).`);
  }
  return parsed.data;
}

export const corsOrigins = (c: Pick<Config, "CORS_ORIGIN">) => c.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
