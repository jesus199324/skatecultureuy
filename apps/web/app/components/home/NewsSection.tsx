import { useMemo, useState } from "react";
import { NEWS_TOPIC_LABELS, type ArticleSummary, type NewsTopic } from "../../../../../packages/shared/src";
import { relativeTime } from "../../lib/format";
import { FilterChips, type FilterOption } from "../editorial/FilterChips";
import { Photo } from "../editorial/Photo";
import { Reveal } from "../editorial/Reveal";
import { SectionTitle } from "../editorial/SectionTitle";
import { ShareButtons } from "../editorial/ShareButtons";
import { ButtonLink, DemoBadge, MarkerNote, Sticker, SunDoodle } from "../ui/primitives";

type TopicFilter = "TODAS" | NewsTopic;
const OPTIONS: FilterOption<TopicFilter>[] = [
  { id: "TODAS", label: "Todas" },
  ...(Object.keys(NEWS_TOPIC_LABELS) as NewsTopic[]).map((t) => ({ id: t, label: NEWS_TOPIC_LABELS[t] })),
];

export function NewsSection({ items, now }: { items: ArticleSummary[]; now: Date }) {
  const [topic, setTopic] = useState<TopicFilter>("TODAS");
  const filtered = useMemo(() => (topic === "TODAS" ? items : items.filter((n) => n.newsTopic === topic)), [items, topic]);
  const [lead, ...rest] = filtered;

  return (
    <section aria-labelledby="noticias" className="relative border-y-2 border-ink bg-concrete">
      <div className="mx-auto max-w-[1440px] px-5 pb-[72px] pt-16 md:px-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 self-start"><SunDoodle size={26} /><MarkerNote className="text-[22px]" rotate={-4}>lo que pasa en la escena</MarkerNote></span>
            <SectionTitle id="noticias" className="md:!text-[112px]">NOTICIAS</SectionTitle>
          </div>
          <FilterChips label="Filtrar noticias por tema" options={OPTIONS} value={topic} onChange={setTopic} />
        </div>

        {!lead ? (
          <p className="label border-t-2 border-ink py-10 text-base text-muted">Todavía no hay noticias de este tema.</p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
            <Reveal as="article" className="group relative flex flex-col gap-3.5 md:col-span-5">
              <a href={`/stories/${lead.slug}`} aria-label={`Leer: ${lead.title}`} className="block">
                <Photo asset={lead.coverImage} sizes="(min-width: 768px) 40vw, 100vw" className="h-[300px] md:h-[380px]" caption="Foto demo" />
              </a>
              {Date.parse(lead.publishedAt) > now.getTime() - 24 * 3600_000 && (
                <Sticker tone="celeste" rotate={-8} className="-left-3.5 -top-3.5">¡Nuevo!</Sticker>
              )}
              <NewsMeta article={lead} now={now} />
              <h3 className="m-0 font-display text-3xl leading-none md:text-[38px]">
                <a href={`/stories/${lead.slug}`} className="hl">{lead.title}</a>
              </h3>
              {lead.excerpt && <p className="m-0 text-base leading-relaxed text-body">{lead.excerpt}</p>}
              <ShareButtons title={lead.title} path={`/stories/${lead.slug}`} />
            </Reveal>

            <ol className="m-0 list-none border-t-2 border-ink p-0 md:col-span-7">
              {rest.map((n) => (
                <li key={n.id} className="group grid grid-cols-1 items-center gap-2 border-b border-stone py-4.5 md:grid-cols-[120px_1fr_auto] md:gap-5">
                  <NewsMeta article={n} now={now} stacked />
                  <a href={`/stories/${n.slug}`} className="font-display text-[21px] leading-[1.1]">
                    <span className="hl">{n.title}</span>
                    {n.isDemo && <DemoBadge />}
                  </a>
                  <div className="hidden md:block">
                    <ShareButtons compact title={n.title} path={`/stories/${n.slug}`} />
                  </div>
                </li>
              ))}
              <li className="flex flex-wrap items-center justify-between gap-4 pt-5">
                <ButtonLink href="/news" variant="solid">Todas las noticias →</ButtonLink>
                <a href="/about#enviar" className="flex items-center gap-2">
                  <MarkerNote className="text-xl" rotate={0}>¿tenés una noticia? mandala</MarkerNote>
                  <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true"><path d="M2 14 C 12 4, 20 18, 31 8 M24 6l7 2-3 7" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
                </a>
              </li>
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

function NewsMeta({ article, now, stacked = false }: { article: ArticleSummary; now: Date; stacked?: boolean }) {
  return (
    <span className={stacked ? "label flex flex-row gap-3 text-[13px] md:flex-col md:gap-0.5" : "label flex items-center gap-3 text-[13px]"}>
      <span className="text-accent">{article.newsTopic ? NEWS_TOPIC_LABELS[article.newsTopic] : "Noticias"}</span>
      <time dateTime={article.publishedAt} className="text-muted">{relativeTime(article.publishedAt, now)}</time>
      {!stacked && article.isDemo && <DemoBadge />}
    </span>
  );
}
