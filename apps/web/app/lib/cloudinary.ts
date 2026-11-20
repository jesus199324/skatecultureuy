/**
 * URLs optimizadas de Cloudinary: formato automático (WebP/AVIF), calidad
 * automática y ancho justo para cada pantalla. Toda la lógica de imágenes
 * pasa por acá para poder cambiar de proveedor (p. ej. Cloudflare R2)
 * reemplazando solo este módulo.
 */

export const DEFAULT_WIDTHS = [400, 640, 960, 1280, 1920] as const;

export interface ImageOptions {
  width: number;
  /** Relación de aspecto para recortar, p. ej. "4:5". */
  aspectRatio?: string;
}

export function cloudinaryUrl(cloudName: string, publicId: string, opts: ImageOptions): string {
  if (!cloudName) throw new Error("Falta CLOUDINARY_CLOUD_NAME");
  const t = ["f_auto", "q_auto", "c_fill", "g_auto", `w_${Math.round(opts.width)}`];
  if (opts.aspectRatio) t.push(`ar_${opts.aspectRatio}`);
  const id = publicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${t.join(",")}/${id}`;
}

export function cloudinarySrcSet(
  cloudName: string,
  publicId: string,
  widths: readonly number[] = DEFAULT_WIDTHS,
  aspectRatio?: string,
): string {
  return widths.map((w) => `${cloudinaryUrl(cloudName, publicId, { width: w, aspectRatio })} ${w}w`).join(", ");
}
