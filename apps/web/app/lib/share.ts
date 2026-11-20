/** Compartir sin SDKs de redes sociales (no pesan ni rastrean). */

export function whatsappShareUrl(title: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
}

export function absoluteUrl(path: string, origin: string): string {
  return new URL(path, origin).toString();
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Usa el menú de compartir del celular; si no existe, copia el link. */
export async function shareOrCopy(data: { title: string; url: string }, nav: Navigator = navigator): Promise<ShareResult> {
  if (typeof nav.share === "function") {
    try {
      await nav.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }
  return copyLink(data.url, nav);
}

export async function copyLink(url: string, nav: Navigator = navigator): Promise<ShareResult> {
  try {
    await nav.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
