/**
 * Configuración pública del front. En el proyecto final viene de
 * import.meta.env (Vite); en el prototipo, de window.__SCUY_ENV__.
 */
type PublicEnv = { CLOUDINARY_CLOUD_NAME?: string; SITE_URL?: string };

const env: PublicEnv = (typeof window !== "undefined" && (window as unknown as { __SCUY_ENV__?: PublicEnv }).__SCUY_ENV__) || {};

export const CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME ?? "";
export const SITE_URL = env.SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://skateculture.uy");
