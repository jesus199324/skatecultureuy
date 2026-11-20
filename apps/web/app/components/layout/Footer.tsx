import { NAV_ITEMS } from "../../../../../packages/shared/src";
import { Grain, SunDoodle } from "../ui/primitives";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-ink pb-8 pt-16 text-bone">
      <Grain strength="grip" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-12 px-5 md:px-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="flex flex-col gap-3 md:col-span-6">
            <span className="font-display text-[44px] leading-[0.85] tracking-[-0.03em] md:text-[76px]">
              SKATE CULTURE <span className="inline-block -rotate-6 text-celeste">UY</span>
            </span>
            <span className="label flex items-center gap-3 text-[13px] font-semibold tracking-[0.28em] text-stone"><SunDoodle size={26} />THE CULTURE. THE PEOPLE. THE STREETS.</span>
          </div>
          <nav aria-label="Secciones (pie)" className="label flex flex-col gap-2.5 text-[15px] md:col-span-3">
            {NAV_ITEMS.filter((i) => i.href !== "/about").map((i) => (
              <a key={i.href} href={i.href} className="hover:text-sun">{i.label}</a>
            ))}
          </nav>
          <div className="label flex flex-col gap-2.5 text-[15px] md:col-span-3">
            <a href="/about" className="hover:text-sun">ABOUT</a>
            <a href="/about#enviar" className="hover:text-sun">ENVIAR MATERIAL</a>
            <a href="/about#contacto" className="hover:text-sun">CONTACTO</a>
            <a href="https://instagram.com/" className="hover:text-sun">INSTAGRAM</a>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-[#4A4946] pt-5 text-[13px] text-stone">
          <span>© {year} SKATE CULTURE UY · Montevideo, Uruguay</span>
          <span>El contenido marcado DEMO es ficticio y está solo para probar la plataforma.</span>
          <span className="w-full border-t border-[#4A4946] pt-4 md:w-auto md:border-0 md:pt-0">
            Diseño y desarrollo:{" "}
            <a href="https://micv-brown.vercel.app/" target="_blank" rel="noopener author" className="font-semibold text-bone underline decoration-celeste decoration-2 underline-offset-4 hover:text-celeste">
              Jesús Albornoz
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
