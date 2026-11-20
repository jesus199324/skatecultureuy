import { useMemo, useState } from "react";
import {
  DEPARTMENT_LABELS, SPOT_FEATURE_LABELS, SPOT_TYPE_LABELS,
  type ArticleFormat, type ArticleSummary, type EventSummary, type PullQuote, type SkaterSummary, type SpotSummary,
} from "../../../../../packages/shared/src";
import { eventDateParts, eventState, pad2 } from "../../lib/format";
import { FilterChips, type FilterOption } from "../editorial/FilterChips";
import { FilmFrame, Photo, Polaroid } from "../editorial/Photo";
import { Reveal } from "../editorial/Reveal";
import { RuleHeader, SectionTitle } from "../editorial/SectionTitle";
import { ButtonLink, Grain, MarkerNote, Scribble, Sticker, SunDoodle, Tag, Tape, cx } from "../ui/primitives";

const storyHref = (a: ArticleSummary) => `/stories/${a.slug}`;
const FORMAT_LABEL: Record<ArticleFormat, string> = { STORY: "Historia", INTERVIEW: "Entrevista", GALLERY: "Galería", VIDEO: "Video", NEWS: "Noticia" };
const wrap = "mx-auto max-w-[1440px] px-5 md:px-12";

/* ───────── Últimas historias: tres tamaños ───────── */
export function LatestSection({ items }: { items: ArticleSummary[] }) {
  const [lead, m1, m2, ...list] = items;
  return (
    <section aria-labelledby="ultimas" className={cx(wrap, "pb-24 pt-[88px]")}>
      <RuleHeader id="ultimas" title="ÚLTIMAS HISTORIAS" href="/stories" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {lead && (
          <Reveal as="article" className="group flex flex-col gap-3.5 md:col-span-6">
            <a href={storyHref(lead)} aria-label={`Leer: ${lead.title}`}><Photo asset={lead.coverImage} sizes="(min-width: 768px) 50vw, 100vw" className="h-[360px] md:h-[520px]" caption="Foto demo · retrato" /></a>
            <Tag demo={lead.isDemo}>{FORMAT_LABEL[lead.format]}</Tag>
            <h3 className="m-0 font-display text-3xl leading-none tracking-[-0.01em] md:text-[40px]"><a href={storyHref(lead)} className="hl">{lead.title}</a></h3>
            <p className="m-0 max-w-[52ch] leading-relaxed text-body">{lead.excerpt}</p>
          </Reveal>
        )}
        <div className="flex flex-col gap-10 md:col-span-3 md:pt-24">
          {[m1, m2].filter(Boolean).map((a, i) => (
            <Reveal as="article" key={a.id} delay={i * 120} className="group flex flex-col gap-3">
              <a href={storyHref(a)} aria-label={`Leer: ${a.title}`}><Photo asset={a.coverImage} sizes="(min-width: 768px) 25vw, 100vw" className={i === 0 ? "h-[300px]" : "h-[200px]"} caption="Foto demo" /></a>
              <Tag demo={a.isDemo}>{a.category.name} · {FORMAT_LABEL[a.format]}</Tag>
              <h3 className="m-0 font-display text-2xl leading-[1.05]"><a href={storyHref(a)} className="hl">{a.title}</a></h3>
            </Reveal>
          ))}
        </div>
        <ol className="m-0 flex list-none flex-col border-t-2 border-ink p-0 md:col-span-3">
          {list.map((a, i) => (
            <li key={a.id} className="group flex gap-4 border-b border-stone py-5">
              <span aria-hidden="true" className="font-display text-[28px] leading-none text-accent">{pad2(i + 2)}</span>
              <a href={storyHref(a)} className="flex flex-col gap-1.5">
                <Tag demo={a.isDemo} className="text-[12px]">{a.category.name}</Tag>
                <span className="hl font-display text-[19px] leading-[1.1]">{a.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────── STREET: banda negra con lija y filtros ───────── */
type StreetFilter = "TODO" | "STORY" | "GALLERY" | "VIDEO";
const STREET_OPTIONS: FilterOption<StreetFilter>[] = [
  { id: "TODO", label: "Todo" }, { id: "STORY", label: "Sesiones" }, { id: "GALLERY", label: "Fotos" }, { id: "VIDEO", label: "Videos" },
];

export function StreetSection({ items }: { items: ArticleSummary[] }) {
  const [filter, setFilter] = useState<StreetFilter>("TODO");
  const shown = useMemo(() => (filter === "TODO" ? items : items.filter((a) => a.format === filter)), [items, filter]);
  const [main, ...side] = shown;

  return (
    <section aria-labelledby="street" className="relative bg-ink pb-24 pt-20 text-bone">
      <Grain strength="grip" />
      <div className={cx(wrap, "relative")}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div className="relative flex flex-col gap-2">
            <span className="label text-[13px] tracking-[0.16em] text-stone">SESIONES · FOTOS · VIDEO</span>
            <SectionTitle id="street" tilt={-2} className="md:!text-[136px]">STREET</SectionTitle>
            <MarkerNote className="absolute -right-40 top-6 hidden text-[22px] text-celeste md:inline-block" rotate={8}>grip tape edition</MarkerNote>
          </div>
          <FilterChips label="Filtrar Street" options={STREET_OPTIONS} value={filter} onChange={setFilter} onDark />
        </div>

        {!main ? (
          <p className="label border-t border-stone py-10 text-base text-stone">No hay publicaciones de este tipo todavía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <article className="group flex flex-col gap-3.5 md:col-span-8">
              <FilmFrame frame="SCUY 400 ▸ 07">
                <a href={storyHref(main)} aria-label={`${main.format === "VIDEO" ? "Ver video" : "Leer"}: ${main.title}`} className="block">
                  <Photo asset={main.coverImage} sizes="(min-width: 768px) 66vw, 100vw" className="h-[300px] md:h-[460px]" caption={main.format === "VIDEO" ? `Video demo · YouTube / Vimeo · ${main.videoDuration ?? ""}` : "Foto demo"}>
                    {main.format === "VIDEO" && (
                      <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-bone bg-celeste transition-transform group-hover:scale-110">
                        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="var(--color-ink)" /></svg>
                      </span>
                    )}
                  </Photo>
                </a>
              </FilmFrame>
              <Tag onDark demo={main.isDemo}>{FORMAT_LABEL[main.format]}</Tag>
              <h3 className="m-0 font-display text-3xl uppercase leading-none md:text-[40px]"><a href={storyHref(main)} className="hl">{main.title}</a></h3>
            </article>
            <div className="grid grid-cols-1 gap-6 md:col-span-4">
              {side.slice(0, 2).map((a, i) => (
                <article key={a.id} className="group flex flex-col gap-2.5">
                  <a href={storyHref(a)} aria-label={`Leer: ${a.title}`} className="block" style={{ transform: `rotate(${i === 0 ? 1.5 : -1.2}deg)` }}>
                    <Photo asset={a.coverImage} sizes="(min-width: 768px) 33vw, 100vw" className="h-[240px]" caption="Foto demo" />
                  </a>
                  <Tag onDark demo={a.isDemo}>{FORMAT_LABEL[a.format]}</Tag>
                  <h3 className="m-0 font-display text-[22px] leading-[1.05]"><a href={storyHref(a)} className="hl">{a.title}</a></h3>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────── SKATERS: cita en semitono + polaroids ───────── */
export function SkatersSection({ skaters, quote }: { skaters: SkaterSummary[]; quote: PullQuote }) {
  return (
    <section aria-labelledby="skaters" className={cx(wrap, "py-[104px]")}>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
        <div className="flex flex-col gap-5 md:col-span-4">
          <span className="label text-[13px] tracking-[0.16em] text-muted">LOS PROTAGONISTAS</span>
          <SectionTitle id="skaters" size="lg">SKATERS</SectionTitle>
          <figure className="halftone m-0 mt-6 -rotate-[1.5deg] px-6 pb-6 pt-7">
            <blockquote className="m-0 font-display text-[26px] leading-[1.1] text-ink md:text-[30px]">“{quote.text}”</blockquote>
            <figcaption className="label mt-3.5 text-[13px] text-ink">{quote.attribution}</figcaption>
          </figure>
          <ButtonLink href="/skaters" className="mt-2 self-start">Todos los perfiles →</ButtonLink>
        </div>
        {skaters.map((s, i) => (
          <Reveal as="article" key={s.id} delay={i * 150} className={cx("group relative flex flex-col gap-3 md:col-span-4", i === 1 && "md:mt-[120px]")}>
            <Tape className={i === 0 ? "left-1/2 -top-3 -ml-[60px]" : "-right-2.5 -top-2"} rotate={i === 0 ? -4 : 30} tint={i === 0 ? "celeste" : "sun"} />
            <Polaroid tilt={i === 0 ? -2 : 2.5} label={`${s.name} — ${s.city}`}>
              <a href={`/skaters/${s.slug}`} aria-label={`Ver perfil de ${s.name}`} className="block">
                <Photo asset={s.profileImage} sizes="(min-width: 768px) 30vw, 100vw" className="aspect-[4/5]" caption="Retrato demo" aspectRatio="4:5" />
              </a>
            </Polaroid>
            <span className="pt-1.5 text-sm text-muted">{s.isDemo ? "Perfil de demostración" : "Perfil"} · {s.highlights}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── SPOTS: índice tipo tabla de revista ───────── */
export function SpotsSection({ spots }: { spots: SpotSummary[] }) {
  return (
    <section aria-labelledby="spots" className="border-y-2 border-ink bg-concrete">
      <div className={cx(wrap, "pb-20 pt-[72px]")}>
        <div className="mb-7 grid grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <SectionTitle id="spots">SPOTS</SectionTitle>
            <Scribble width={300} className="hidden md:block" />
          </div>
          <p className="m-0 max-w-[48ch] text-lg leading-relaxed md:col-span-6 md:justify-self-end">
            Directorio editorial de skateparks y spots callejeros, por departamento. Los de abajo son de demostración: sin ubicaciones reales. El mapa interactivo llega en una próxima etapa.
          </p>
        </div>
        <ul className="m-0 list-none border-t-2 border-ink p-0">
          {spots.map((s, i) => (
            <li key={s.id} className="group grid grid-cols-[40px_1fr] items-center gap-6 border-b border-stone py-5 transition-colors hover:bg-celeste/25 md:grid-cols-[72px_2fr_1fr_1fr_1.4fr_120px]">
              <span aria-hidden="true" className="font-display text-[32px] text-accent">{pad2(i + 1)}</span>
              <a href={`/spots/${s.slug}`} className="font-display text-[22px] leading-[1.05] md:text-[26px]">
                <span className="hl">{s.name}</span>
                <span className="mt-1 block font-sans text-sm font-normal text-muted md:hidden">
                  {DEPARTMENT_LABELS[s.department]} · {SPOT_TYPE_LABELS[s.type]}
                </span>
              </a>
              <span className="label hidden text-[13px] md:block">{DEPARTMENT_LABELS[s.department]}</span>
              <span className="hidden text-[15px] md:block">{SPOT_TYPE_LABELS[s.type]}</span>
              <span className="hidden text-[15px] text-muted md:block">{s.features.map((f) => SPOT_FEATURE_LABELS[f]).join(" · ")}</span>
              <Photo asset={s.coverImage} sizes="120px" className="hidden h-[72px] md:block" />
            </li>
          ))}
        </ul>
        <ButtonLink href="/spots" variant="solid" className="mt-7">Explorar spots →</ButtonLink>
      </div>
    </section>
  );
}

/* ───────── CULTURE: grilla asimétrica ───────── */
export function CultureSection({ items }: { items: ArticleSummary[] }) {
  const [big, music, art, doc] = items;
  return (
    <section aria-labelledby="culture" className={cx(wrap, "py-24")}>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
        <SectionTitle id="culture">CULTURE</SectionTitle>
        <span className="label pb-2.5 text-[13px] tracking-[0.16em] text-muted">MARCAS · DOCUMENTALES · MÚSICA · ARTE</span>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {big && (
          <Reveal as="article" className="group relative flex flex-col gap-3.5 md:col-span-5 md:row-span-2">
            <a href={storyHref(big)} aria-label={`Leer: ${big.title}`}><Photo asset={big.coverImage} sizes="(min-width: 768px) 42vw, 100vw" className="h-[360px] md:h-[560px]" caption="Foto demo · color" /></a>
            <Sticker tone="sun" rotate={6} className="-right-3 top-6">Do it yourself</Sticker>
            <Tag demo={big.isDemo}>Marcas</Tag>
            <h3 className="m-0 font-display text-3xl leading-none md:text-4xl"><a href={storyHref(big)} className="hl">{big.title}</a></h3>
          </Reveal>
        )}
        {music && (
          <article className="group flex flex-col gap-2.5 border-t-2 border-ink pt-4 md:col-span-4">
            <Tag demo={music.isDemo}>Música</Tag>
            <h3 className="m-0 font-display text-[28px] leading-[1.05]"><a href={storyHref(music)} className="hl">{music.title}</a></h3>
            {music.excerpt && <p className="m-0 text-[15px] leading-relaxed text-body">{music.excerpt}</p>}
          </article>
        )}
        {art && (
          <article className="group flex flex-col gap-2.5 border-t-2 border-ink pt-4 md:col-span-3">
            <Tag demo={art.isDemo}>Arte</Tag>
            <h3 className="m-0 font-display text-[22px] leading-[1.05]"><a href={storyHref(art)} className="hl">{art.title}</a></h3>
          </article>
        )}
        {doc && (
          <article className="group grid grid-cols-1 items-end gap-6 sm:grid-cols-2 md:col-span-7">
            <FilmFrame frame="VHS ▸ 1998">
              <a href={storyHref(doc)} aria-label={`Ver: ${doc.title}`} className="block"><Photo asset={doc.coverImage} sizes="(min-width: 768px) 28vw, 100vw" className="h-[220px]" caption="Still demo" /></a>
            </FilmFrame>
            <div className="flex flex-col gap-2.5">
              <Tag demo={doc.isDemo}>Documental</Tag>
              <h3 className="m-0 font-display text-[26px] leading-[1.05]"><a href={storyHref(doc)} className="hl">{doc.title}</a></h3>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

/* ───────── Próximos eventos ───────── */
export function EventsSection({ events, now }: { events: EventSummary[]; now: Date }) {
  const upcoming = events.filter((e) => eventState(e, now) === "PROXIMO");
  return (
    <section aria-labelledby="events" className="relative bg-ink pb-20 pt-[72px] text-bone">
      <Grain strength="grip" />
      <div className={cx(wrap, "relative")}>
        <RuleHeader id="events" title="PRÓXIMOS EVENTOS" href="/events" linkLabel="AGENDA COMPLETA →" onDark />
        {upcoming.length === 0 ? (
          <p className="label py-8 text-base text-stone">No hay eventos próximos. Mirá la agenda completa.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {upcoming.map((e, i) => {
              const d = eventDateParts(e.eventDate);
              return (
                <li key={e.id} className="group grid grid-cols-[84px_1fr] items-center gap-6 border-b border-dashed border-[#6B6964] py-7 md:grid-cols-[200px_1fr_1fr_160px]">
                  <time dateTime={e.eventDate} className="flex flex-col leading-[0.85]">
                    <span className="font-display text-[56px] text-sun md:text-[72px]">{d.day}</span>
                    <span className="label text-base tracking-[0.16em]">{d.month} {d.year}</span>
                  </time>
                  <a href={`/events/${e.slug}`} className="flex flex-col gap-1.5">
                    <span className="hl font-display text-2xl uppercase leading-[1.05] md:text-[30px]">{e.name}</span>
                    <span className="text-sm text-stone">{e.isDemo ? "Evento de demostración" : "Evento"} · {d.time} h<span className="md:hidden"> · {e.location}</span></span>
                  </a>
                  <span className="hidden text-[15px] text-stone md:block">{e.location}</span>
                  <span aria-hidden="true" className={cx("hidden justify-self-start px-2.5 py-1.5 font-display text-[13px] tracking-[0.08em] text-ink md:block", i % 2 ? "bg-sun" : "bg-celeste")} style={{ transform: `rotate(${i % 2 ? 3 : -4}deg)` }}>PRÓXIMO</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ───────── Presentación de la revista ───────── */
export function AboutSection() {
  return (
    <section aria-labelledby="about" className={cx(wrap, "py-28")}>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
        <span className="label pt-3 text-[13px] tracking-[0.16em] text-muted md:col-span-3">SOBRE SKATE CULTURE UY</span>
        <div className="flex flex-col gap-8 md:col-span-9">
          <h2 id="about" className="m-0 font-display text-[30px] leading-[1.02] tracking-[-0.015em] md:text-[54px]">
            Documentamos el <span className="bg-sun px-1.5 [box-decoration-break:clone]">skateboarding uruguayo</span>:{" "}
            <span className="bg-celeste px-2 text-ink [box-decoration-break:clone]">la gente, las calles</span>{" "}
            y la historia que no queda en ningún otro lado.
          </h2>
          <p className="m-0 max-w-[60ch] text-lg leading-relaxed text-body">
            Un medio independiente hecho desde adentro de la escena. ¿Tenés fotos, video, una noticia o una historia para contar? Mandala: cada material publicado lleva el crédito de quien lo hizo.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/about#enviar" variant="accent">Enviar material</ButtonLink>
            <ButtonLink href="/about#colaborar">Cómo colaborar</ButtonLink>
            <MarkerNote className="ml-3 hidden text-[22px] md:inline-block">← ¡mandá tu clip!</MarkerNote>
          </div>
        </div>
      </div>
    </section>
  );
}

