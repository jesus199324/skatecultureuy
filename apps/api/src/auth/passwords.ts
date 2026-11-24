/** Contraseñas del staff: Argon2id (parámetros por defecto de @node-rs/argon2). */
import { hash, verify } from "@node-rs/argon2";

export const MIN_PASSWORD_LENGTH = 12;

export const hashPassword = (plain: string) => hash(plain);

/** Hash de relleno: se verifica contra él cuando el email no existe, para que la respuesta tarde lo mismo. */
let dummy: Promise<string> | null = null;

export async function verifyPassword(hashed: string | null, plain: string): Promise<boolean> {
  dummy ??= hash("contraseña-de-relleno-para-igualar-tiempos");
  try {
    return await verify(hashed ?? (await dummy), plain) && hashed !== null;
  } catch {
    return false;
  }
}
