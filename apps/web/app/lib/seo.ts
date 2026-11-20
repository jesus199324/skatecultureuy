/**
 * Metadatos de cada página: título, descripción y vista previa al compartir
 * (Open Graph: WhatsApp, Instagram, Facebook; Twitter/X card).
 */
import type { MediaAsset } from "../../../../packages/shared/src";
import { cloudinaryUrl } from "./cloudinary";
import { CLOUDINARY_CLOUD_NAME, SITE_NAME, SITE_URL } from "./config";

export const DEFAULT_DESCRIPTION = "Revista digital independiente de skateboarding uruguayo. The culture. The people. The streets.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

/** Imagen para compartir: 1200×630 de Cloudinary, o la imagen general de la revista. */
export function ogImage(asset: MediaAsset | null | undefined): string {
  if (asset?.publicId && CLOUDINARY_CLOUD_NAME) {
    return cloudinaryUrl(CLOUDINARY_CLOUD_NAME, asset.publicId, { width: 1200, aspectRatio: "1200:630" });
  }
  return DEFAULT_OG_IMAGE;
}

export interface PageMeta {
  title: string;
  description?: string;
  /** Ruta de la página, p. ej. "/stories/mi-nota". */
  path: string;
  image?: MediaAsset | null;
  type?: "website" | "article" | "profile";
  /** Páginas que no deben aparecer en buscadores (404). */
  noindex?: boolean;
}

export function buildMeta({ title, description = DEFAULT_DESCRIPTION, path, image, type = "website", noindex }: PageMeta) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  const img = ogImage(image);
  const tags = [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "es_UY" },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: img },
    { property: "og:image:alt", content: image?.altText ?? SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (noindex) tags.push({ name: "robots", content: "noindex" });
  return tags;
}

/** Recorta un texto para la descripción (≈155 caracteres, sin cortar palabras). */
export function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** JSON-LD seguro para incrustar en <script> (escapa "<"). */
export const jsonLd = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c");
