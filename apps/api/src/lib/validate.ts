import { z } from "zod";
import { HttpError } from "../auth/middleware";

// Mensajes de validación en español.
z.config(z.locales.es());

const issues = (e: z.ZodError) => e.issues.map((i) => ({ campo: i.path.join(".") || "(cuerpo)", error: i.message }));

/** Valida el cuerpo de un pedido; si no es válido, responde 400 con el detalle por campo. */
export function parseBody<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input ?? {});
  if (!r.success) throw new HttpError(400, "Datos inválidos", issues(r.error));
  return r.data;
}

export function parseQuery<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input ?? {});
  if (!r.success) throw new HttpError(400, "Parámetros inválidos", issues(r.error));
  return r.data;
}

export const uuidParam = z.object({ id: z.string().uuid("id inválido") });
