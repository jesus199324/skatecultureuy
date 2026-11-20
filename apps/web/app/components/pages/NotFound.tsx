import { NAV_ITEMS } from "../../../../../packages/shared/src";
import { A } from "../ui/A";
import { ButtonLink, Grain, MarkerNote, Sticker } from "../ui/primitives";

/** 404 con estética callejera: un cono de obra y la ruta cortada. */
export function NotFoundContent({ variant = "404" }: { variant?: "404" | "500" }) {
  const is404 = variant === "404";
  return (
    <section aria-labelledby="error-titulo" className="relative overflow-hidden bg-ink text-bone">
      <Grain strength="grip" />
      <div className="h-3 sun-stripe" />
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 md:grid-cols-12 md:px-12 md:py-28">
        <div className="relative flex flex-col gap-6 md:col-span-7">
          <span className="label text-[13px] tracking-[0.2em] text-stone">{is404 ? "ERROR 404 · CALLE SIN SALIDA" : "ERROR · ALGO SE ROMPIÓ"}</span>
          <h1 id="error-titulo" className="m-0 font-display text-[52px] leading-[0.85] tracking-[-0.03em] sm:text-[64px] md:text-[132px]">
            {is404 ? <>SPOT<br />QUEMADO</> : <>TABLA<br />PARTIDA</>}
          </h1>
          <p className="m-0 max-w-[46ch] text-lg leading-relaxed text-stone">
            {is404
              ? "Esta página no existe o la movieron. Pasa con los mejores spots: un día están y al otro los taparon."
              : "Tuvimos un problema al cargar esta página. Probá de nuevo en un rato."}
          </p>
          <MarkerNote className="text-2xl text-sun" rotate={-4}>{is404 ? "buscá otra línea →" : "volvé a intentar →"}</MarkerNote>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/" variant="outline-light">Volver a la portada</ButtonLink>
            {is404 && <ButtonLink href="/stories" variant="outline-light">Últimas historias</ButtonLink>}
          </div>
        </div>
        <div className="relative md:col-span-5">
          <ConeArt />
          <Sticker tone="celeste" rotate={8} className="right-0 top-0">{variant}</Sticker>
        </div>
      </div>
      {is404 && (
        <nav aria-label="Secciones de la revista" className="relative border-t border-[#4A4946]">
          <ul className="label mx-auto m-0 flex max-w-[1440px] list-none flex-wrap gap-x-8 gap-y-0 px-5 py-4 text-[15px] md:px-12">
            {NAV_ITEMS.map((i) => (
              <li key={i.href}><A href={i.href} className="inline-flex min-h-11 items-center hover:text-sun">{i.label}</A></li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}

/** Cono de obra dibujado (decorativo). */
function ConeArt() {
  return (
    <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-[360px]" aria-hidden="true">
      <ellipse cx="160" cy="276" rx="140" ry="14" fill="#2B2A28" />
      <path d="M118 40 L202 40 L262 262 L58 262 Z" fill="#F2F0EA" stroke="#111" strokeWidth="5" strokeLinejoin="round" />
      <path d="M108 78 L212 78 L224 122 L96 122 Z" fill="#FCD116" stroke="#111" strokeWidth="4" />
      <path d="M86 160 L234 160 L246 204 L74 204 Z" fill="#75AADB" stroke="#111" strokeWidth="4" />
      <rect x="30" y="252" width="260" height="24" fill="#111" stroke="#F2F0EA" strokeWidth="3" />
      <path d="M150 8 Q160 -2 170 8 L176 40 L144 40 Z" fill="#111" />
    </svg>
  );
}
