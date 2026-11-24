import type { VideoEmbed } from "./types";

/**
 * Saca el proveedor y el id de un link de YouTube o Vimeo.
 * Acepta youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/ y vimeo.com/123.
 * Devuelve null si el link no es de un video válido.
 */
export function parseVideoUrl(url: string): Pick<VideoEmbed, "provider" | "videoId"> | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  const ytId = /^[A-Za-z0-9_-]{11}$/;
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? null;
    return id && ytId.test(id) ? { provider: "YOUTUBE", videoId: id } : null;
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return ytId.test(id) ? { provider: "YOUTUBE", videoId: id } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(?:^|\/)(\d{5,12})(?:$|\/)/)?.[1];
    return id ? { provider: "VIMEO", videoId: id } : null;
  }
  return null;
}

/** Minutos de lectura estimados (200 palabras por minuto, mínimo 1). */
export function readingMinutes(texts: string[]): number {
  const words = texts.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
