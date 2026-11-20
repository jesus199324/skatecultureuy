import { PageHeader, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { ButtonLink, MarkerNote, Sticker, cx } from "../components/ui/primitives";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/about";

export const meta: Route.MetaFunction = ({ location }) =>
  buildMeta({ title: "Sobre la revista", path: location.pathname, description: "Qué es SKATE CULTURE UY, cómo enviar tu material y cómo colaborar con la revista." });

const STEPS = [
  { t: "Elegí tu mejor material", d: "Fotos, un clip, una noticia o una historia. Mejor pocas cosas buenas que muchas a medias." },
  { t: "Contanos el contexto", d: "Quién patina, dónde (departamento y barrio alcanzan), cuándo y quién sacó la foto o filmó." },
  { t: "Mandalo por Instagram", d: "Escribinos por mensaje directo con el material o un link para descargarlo." },
  { t: "Te avisamos antes de publicar", d: "Cada publicación lleva el crédito de quien la hizo. Sin tu permiso, no se publica." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="SOBRE SKATE CULTURE UY"
        title="ABOUT"
        note="hecha desde adentro"
        intro="Una revista digital independiente que documenta el skateboarding uruguayo: la gente, las calles y la historia que no queda en ningún otro lado."
      />

      <section aria-labelledby="que-es" className={cx(wrap, "grid grid-cols-1 gap-10 py-20 md:grid-cols-12")}>
        <h2 id="que-es" className="label m-0 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em] md:col-span-3">QUÉ ES</h2>
        <div className="flex flex-col gap-6 text-lg leading-relaxed text-body md:col-span-8 md:col-start-5">
          <p className="m-0 font-display text-[28px] leading-[1.1] text-ink md:text-[40px]">
            Documentamos el <span className="bg-sun px-1.5 [box-decoration-break:clone]">skate uruguayo</span> con tiempo y con respeto por quienes lo hacen.
          </p>
          <p className="m-0">Publicamos noticias de la escena, sesiones de street, perfiles de skaters, un directorio de spots, cultura (marcas, música, arte, archivo) y la agenda de eventos de todo el país.</p>
          <p className="m-0">Cuidamos los spots: de los de calle y DIY publicamos solo el departamento y el barrio, nunca la dirección exacta.</p>
        </div>
      </section>

      <section id="enviar" aria-labelledby="enviar-titulo" className="scroll-mt-24 border-y-2 border-ink bg-concrete">
        <div className={cx(wrap, "relative py-20")}>
          <Sticker tone="sun" rotate={6} className="right-5 top-8 md:right-12">¡Mandá tu clip!</Sticker>
          <h2 id="enviar-titulo" className="m-0 mb-10 font-display text-[48px] leading-[0.9] tracking-[-0.03em] md:text-[88px]">ENVIAR MATERIAL</h2>
          <ol className="m-0 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex flex-col gap-3 border-t-2 border-ink pt-4">
                <span aria-hidden="true" className="font-display text-[44px] leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="m-0 font-display text-[22px] leading-[1.1]">{s.t}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-body">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="https://instagram.com/" variant="accent">Escribinos por Instagram ↗</ButtonLink>
            <MarkerNote className="text-xl" rotate={-3}>el crédito siempre es tuyo</MarkerNote>
          </div>
        </div>
      </section>

      <section id="colaborar" aria-labelledby="colaborar-titulo" className={cx(wrap, "scroll-mt-24 grid grid-cols-1 gap-10 py-20 md:grid-cols-12")}>
        <h2 id="colaborar-titulo" className="label m-0 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em] md:col-span-3">CÓMO COLABORAR</h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 md:col-span-8 md:col-start-5">
          {[
            ["Fotografía y video", "Si sacás fotos o filmás sesiones, sumate como colaborador fijo."],
            ["Escribir", "Notas, entrevistas o crónicas de lo que pasa en tu ciudad."],
            ["Corresponsales", "Buscamos gente en cada departamento que nos cuente su escena."],
            ["Marcas y eventos", "Si organizás un evento o tenés una marca local, contanos."],
          ].map(([t, d]) => (
            <li key={t} className="flex flex-col gap-2 border-b border-stone pb-5">
              <h3 className="m-0 font-display text-[22px]">{t}</h3>
              <p className="m-0 text-body">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="contacto" aria-labelledby="contacto-titulo" className="scroll-mt-24 bg-ink text-bone">
        <div className={cx(wrap, "flex flex-col gap-6 py-20")}>
          <h2 id="contacto-titulo" className="m-0 font-display text-[48px] leading-[0.9] tracking-[-0.03em] md:text-[88px]">CONTACTO</h2>
          <p className="m-0 max-w-[56ch] text-lg leading-relaxed text-stone">
            Para material, colaboraciones, correcciones o avisos sobre un spot, escribinos por Instagram. Respondemos todo.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="https://instagram.com/" variant="outline-light">Instagram ↗</ButtonLink>
            <ButtonLink href="/" variant="outline-light">Volver a la portada</ButtonLink>
          </div>
          <p className="m-0 text-sm text-stone">
            Diseño y desarrollo: <A href="https://micv-brown.vercel.app/" className="font-semibold text-bone underline decoration-celeste decoration-2 underline-offset-4">Jesús Albornoz</A>
          </p>
        </div>
      </section>
    </>
  );
}
