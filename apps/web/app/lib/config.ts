/**
 * Configuración pública del front (no son secretos). Vite la toma de las
 * variables VITE_* del entorno al compilar; ver .env.example.
 */
const env: Record<string, string | undefined> = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const CLOUDINARY_CLOUD_NAME = env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
export const SITE_URL = (env.VITE_SITE_URL ?? "https://skateculture.uy").replace(/\/$/, "");
export const SITE_NAME = "SKATE CULTURE UY";
