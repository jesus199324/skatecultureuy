import type { ArticleSummary } from "../../../../../packages/shared/src";
import { SunDoodle } from "../ui/primitives";

/** Barra "AL PASO": cinta de obra con titulares que se desplazan. Pausa al pasar el mouse. */
export function Ticker({ items }: { items: ArticleSummary[] }) {
  if (items.length === 0) return null;
  const row = (hidden: boolean) =>
    items.map((a) => (
      <span key={`${hidden ? "b" : "a"}-${a.id}`} className="flex items-center" aria-hidden={hidden || undefined}>
        <a href={`/stories/${a.slug}`} tabIndex={hidden ? -1 : undefined} className="px-7 hover:underline">
          {a.isDemo && "Demo · "}
          {a.title}
        </a>
        <SunDoodle size={18} />
      </span>
    ));

  return (
    <section aria-label="Noticias al paso" className="group/ticker relative flex items-stretch overflow-hidden border-y-2 border-ink bg-celeste text-ink">
      <a href="/news" className="z-[1] flex flex-none items-center gap-2 border-r-2 border-ink bg-accent px-4 py-3.5 font-display text-[15px] tracking-[0.06em] text-bone">
        AL PASO
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="3" fill="none" /></svg>
      </a>
      <div className="flex flex-1 items-center overflow-hidden">
        <div className="label flex w-max animate-ticker whitespace-nowrap text-[15px] tracking-[0.08em] group-hover/ticker:[animation-play-state:paused] group-focus-within/ticker:[animation-play-state:paused]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
