import { useState } from "react";
import { SITE_URL } from "../../lib/config";
import { absoluteUrl, copyLink, shareOrCopy, whatsappShareUrl } from "../../lib/share";
import { cx } from "../ui/primitives";

const btn = "label inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border border-stone px-2.5 text-[12px] text-ink transition-colors hover:border-ink cursor-pointer bg-transparent";

/** WhatsApp, menú de compartir del celular y copiar link. */
export function ShareButtons({ title, path, compact = false }: { title: string; path: string; compact?: boolean }) {
  const url = absoluteUrl(path, SITE_URL);
  const [status, setStatus] = useState<string>("");

  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(""), 2200);
  };

  if (compact) {
    return (
      <button type="button" className={btn} aria-label={`Compartir: ${title}`} onClick={async () => {
        const r = await shareOrCopy({ title, url });
        if (r === "copied") flash("Link copiado");
      }}>
        <ShareIcon />
        <span className="sr-only" role="status">{status}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Compartir">
      <a className={btn} href={whatsappShareUrl(title, url)} target="_blank" rel="noopener noreferrer" aria-label={`Compartir por WhatsApp: ${title}`}>
        <ChatIcon /> WhatsApp
      </a>
      <button type="button" className={btn} onClick={async () => {
        const r = await shareOrCopy({ title, url });
        if (r === "copied") flash("Link copiado");
        if (r === "failed") flash("No se pudo compartir");
      }}>
        <ShareIcon /> Compartir
      </button>
      <button type="button" className={btn} onClick={async () => flash((await copyLink(url)) === "copied" ? "Link copiado" : "No se pudo copiar")}>
        <LinkIcon /> Link
      </button>
      <span role="status" className={cx("label text-[12px] text-accent", !status && "sr-only")}>{status}</span>
    </div>
  );
}

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.7z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>
);
const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v7h14v-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
);
