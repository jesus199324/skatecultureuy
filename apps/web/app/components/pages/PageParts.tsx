import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { ARTICLE_FORMAT_LABELS, type ArticleSummary, type Paginated } from "../../../../../packages/shared/src";
import { relativeTime } from "../../lib/format";
import { Photo } from "../editorial/Photo";
import { A } from "../ui/A";
import { Grain, MarkerNote, Tag, cx } from "../ui/primitives";

export const wrap = "mx-auto max-w-[1440px] px-5 md:px-12";

/** Cabecera de sección: título gigante, bajada y nota a marcador. */
export function PageHeader({
  kicker, title, intro, note, dark = false, children,
}: { kicker: string; title: string; intro?: string; note?: string; dark?: boolean; children?: ReactNode }) {
  return (
    <header className={cx("relative border-b-2 border-ink", dark ? "bg-ink text-bone" : "bg-concrete")}>
      {dark && <Grain strength="grip" />}
      <div className={cx(wrap, "relative flex flex-col gap-5 pb-10 pt-12 md:pb-14 md:pt-16")}>
        <span className={cx("label text-[13px] tracking-[0.2em]", dark ? "text-stone" : "text-muted")}>{kicker}</span>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <h1 className="m-0 font-display text-[48px] [overflow-wrap:anywhere] sm:text-[56px] leading-[0.82] tracking-[-0.03em] md:text-[120px]">{title}</h1>
          {note && <MarkerNote className={cx("pb-2 text-[22px]", dark ? "text-celeste" : "")} rotate={-4}>{note}</MarkerNote>}
        </div>
        {intro && <p className={cx("m-0 max-w-[60ch] text-lg leading-relaxed", dark ? "text-stone" : "text-body")}>{intro}</p>}
        {children}
      </div>
    </header>
  );
}

export interface FilterLinkOption {
  /** Valor del parámetro en la URL; null = "todos". */
  value: string | null;
  label: string;
}

/**
 * Filtros como links: el filtro queda en la URL (se puede compartir) y
 * funciona aunque el JavaScript no haya cargado. Cambiar de filtro vuelve
 * a la primera tanda de resultados.
 */
export function FilterLinks({ param, options, label, onDark = false }: { param: string; options: FilterLinkOption[]; label: string; onDark?: boolean }) {
  const [params] = useSearchParams();
  const current = params.get(param);
  const hrefFor = (value: string | null) => {
    const next = new URLSearchParams(params);
    next.delete("pagina");
    if (value) next.set(param, value);
    else next.delete(param);
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };
  return (
    <nav aria-label={label}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {options.map((o) => {
          const on = (o.value ?? null) === (current ?? null) || (o.value === null && !options.some((x) => x.value === current));
          return (
            <li key={o.value ?? "todos"}>
              <Link
                to={hrefFor(o.value)}
                preventScrollReset
                aria-current={on ? "true" : undefined}
                className={cx(
                  "label inline-flex min-h-11 items-center border px-4 text-[13px] transition-colors",
                  onDark
                    ? on ? "border-celeste bg-celeste text-ink" : "border-stone text-bone hover:border-celeste"
                    : on ? "border-ink bg-ink text-bone" : "border-ink text-ink hover:bg-ink/5",
                )}
              >
                {o.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * "Cargar más": link a la página siguiente que trae la tanda acumulada.
 * Con JS no recarga ni mueve el scroll; sin JS, funciona como link normal.
 */
export function LoadMore({ page, label = "Cargar más", onDark = false }: { page: Paginated<unknown>; label?: string; onDark?: boolean }) {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set("pagina", String(page.page + 1));
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <p className={cx("label m-0 text-[13px]", onDark ? "text-stone" : "text-muted")} aria-live="polite">
        Mostrando {page.items.length} de {page.total}
      </p>
      {page.hasMore && (
        <Link
          to={`?${next.toString()}`}
          preventScrollReset
          className={cx(
            "label inline-flex min-h-12 items-center gap-2 border-2 px-8 text-[15px] transition-colors",
            onDark ? "border-bone text-bone hover:bg-bone hover:text-ink" : "border-ink bg-ink text-bone hover:bg-accent",
          )}
        >
          {label} ↓
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return <p className={cx("label border-t-2 py-12 text-base", onDark ? "border-stone text-stone" : "border-ink text-muted")}>{children}</p>;
}

const storyHref = (a: ArticleSummary) => `/stories/${a.slug}`;

/** Tarjeta de nota para las grillas de listado. */
export function ArticleCard({ article: a, now, onDark = false, size = "md" }: { article: ArticleSummary; now: number; onDark?: boolean; size?: "md" | "lg" }) {
  const isVideo = a.format === "VIDEO";
  return (
    <article className="group flex flex-col gap-3">
      <A href={storyHref(a)} aria-label={`${isVideo ? "Ver video" : "Leer"}: ${a.title}`} className="block">
        <Photo
          asset={a.coverImage}
          sizes={size === "lg" ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className={size === "lg" ? "h-[300px] md:h-[480px]" : "aspect-[4/3]"}
          caption={isVideo ? `Video demo${a.videoDuration ? ` · ${a.videoDuration}` : ""}` : a.coverImage ? "Foto demo" : "Sin foto"}
        >
          {isVideo && (
            <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-bone bg-celeste transition-transform group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="var(--color-ink)" /></svg>
            </span>
          )}
        </Photo>
      </A>
      <Tag demo={a.isDemo} onDark={onDark}>
        {a.category.name} · {ARTICLE_FORMAT_LABELS[a.format]}
      </Tag>
      <h2 className={cx("m-0 font-display leading-[1.05]", size === "lg" ? "text-3xl md:text-[44px]" : "text-[24px]")}>
        <A href={storyHref(a)} className="hl">{a.title}</A>
      </h2>
      {a.excerpt && <p className={cx("m-0 leading-relaxed", onDark ? "text-stone" : "text-body", size === "md" && "text-[15px]")}>{a.excerpt}</p>}
      <span className={cx("text-sm", onDark ? "text-stone" : "text-muted")}>
        <time dateTime={a.publishedAt}>{relativeTime(a.publishedAt, new Date(now))}</time> · {a.author}
        {a.format !== "VIDEO" && a.format !== "GALLERY" && <> · {a.readMinutes} min de lectura</>}
      </span>
    </article>
  );
}

/** Link "← Volver a ..." de las páginas de detalle. */
export function BackLink({ href, children, onDark = false }: { href: string; children: ReactNode; onDark?: boolean }) {
  return (
    <A href={href} className={cx("label inline-flex min-h-11 items-center text-[13px]", onDark ? "text-stone hover:text-sun" : "text-accent hover:text-ink")}>
      ← {children}
    </A>
  );
}
