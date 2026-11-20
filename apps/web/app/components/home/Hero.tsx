import type { ArticleSummary } from "../../../../../packages/shared/src";
import { FilmFrame, Photo } from "../editorial/Photo";
import { MarkerNote, Scribble, Tag } from "../ui/primitives";

/**
 * Bandera de Uruguay recortada en círculo: 9 franjas (5 blancas, 4 azules),
 * cantón blanco y Sol de Mayo de 16 rayos (8 rectos y 8 ondulados, simplificados).
 * Proporciones de la bandera: alto 120 → cantón 66,7 y sol de 11/15 del cantón.
 */
const SUN_RAYS = Array.from({ length: 16 }, (_, i) => i);
function FlagUY() {
  const cx = 33.3, cy = 33.3, core = 11, tip = 24.4;
  return (
    <svg viewBox="-10 -10 130 130" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id="flag-circle"><circle cx="55" cy="55" r="65" /></clipPath>
      </defs>
      <g clipPath="url(#flag-circle)">
        <rect x="-10" y="-10" width="140" height="140" fill="var(--color-bone)" />
        {[1, 3, 5, 7].map((n) => (
          <rect key={n} x="-10" y={(n * 120) / 9} width="140" height={120 / 9} fill="var(--color-accent)" />
        ))}
        <rect x="-10" y="-10" width={66.7 + 10} height={66.7 + 10} fill="var(--color-bone)" />
        {SUN_RAYS.map((i) => {
          const a = (i * Math.PI) / 8 - Math.PI / 2;
          const w = i % 2 === 0 ? 0.16 : 0.09;
          const r = i % 2 === 0 ? tip : tip - 3;
          const p = (ang: number, rad: number) => `${cx + rad * Math.cos(ang)} ${cy + rad * Math.sin(ang)}`;
          return <path key={i} d={`M${p(a - w, core)}L${p(a, r)}L${p(a + w, core)}Z`} fill="var(--color-sun)" stroke="#7B3F00" strokeWidth="0.8" strokeLinejoin="round" />;
        })}
        <circle cx={cx} cy={cy} r={core} fill="var(--color-sun)" stroke="#7B3F00" strokeWidth="0.9" />
      </g>
    </svg>
  );
}

/** Rayos del sol dibujados a mano, un poco desparejos (fijos, no aleatorios). */
const RAYS = [0, 23, 44, 68, 90, 111, 136, 158, 180, 203, 224, 247, 270, 292, 316, 338];
function SunRays() {
  return (
    <svg aria-hidden="true" viewBox="-30 -30 192 192" className="pointer-events-none absolute -inset-[25%] h-[150%] w-[150%]">
      {RAYS.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const r1 = 72 + (i % 3);
        const r2 = i % 2 === 0 ? 92 - (i % 4) : 84 + (i % 3);
        return <path key={deg} d={`M${66 + r1 * Math.cos(a)} ${66 + r1 * Math.sin(a)}L${66 + r2 * Math.cos(a)} ${66 + r2 * Math.sin(a)}`} stroke="var(--color-ink)" strokeWidth="3.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function Hero({ story }: { story: ArticleSummary }) {
  const href = `/stories/${story.slug}`;
  return (
    <section aria-label="Historia destacada" className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 md:px-12 md:pb-20 md:pt-12">
      <article className="group grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="relative md:col-span-8">
          <FilmFrame frame="SCUY 400 ▸ 12A" tilt={-0.6}>
            <a href={href} aria-label={`Leer: ${story.title}`} className="block">
              <Photo asset={story.coverImage} priority sizes="(min-width: 768px) 66vw, 100vw" className="h-[440px] md:h-[640px]" caption="Foto demo · sesión nocturna, B/N" />
            </a>
          </FilmFrame>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-6 z-10 block h-24 w-24 rotate-12 rounded-full border-[3px] border-ink bg-bone font-display uppercase leading-none text-ink md:-right-7 md:-top-9 md:h-[132px] md:w-[132px]"
          >
            <SunRays />
            <FlagUY />
            <span className="absolute -left-[17%] bottom-[2%] flex w-[134%] -rotate-6 items-center justify-center gap-1 whitespace-nowrap border-2 border-ink bg-bone py-1 text-[9.5px] md:gap-1.5 md:py-1.5 md:text-[13px]">
              <span className="text-accent">100%</span> HECHO EN UY
            </span>
          </span>
        </div>
        <div className="flex flex-col gap-4 pb-2 md:col-span-4">
          <span className="flex items-end gap-3">
            <span aria-hidden="true" className="font-display text-[72px] leading-[0.8] text-accent md:text-[96px]">01</span>
            <MarkerNote className="pb-1.5 text-xl">la de tapa ↓</MarkerNote>
          </span>
          <Tag demo={story.isDemo}>{story.category.name} · Crónica</Tag>
          <h1 className="m-0 font-display text-[46px] uppercase leading-[0.92] tracking-[-0.025em] md:text-[66px]">
            <a href={href} className="hl">{story.title}</a>
          </h1>
          <Scribble className="-mt-1.5" />
          <p className="m-0 max-w-[40ch] text-lg leading-relaxed text-body">{story.excerpt}</p>
          <div className="label flex justify-between border-t border-ink pt-3 text-[13px] font-medium tracking-[0.1em] text-muted">
            <span>Texto: {story.author} · Fotos: {story.coverImage?.credit ?? "[Fotógrafo]"}</span>
            <span>{story.readMinutes} min</span>
          </div>
        </div>
      </article>
    </section>
  );
}
