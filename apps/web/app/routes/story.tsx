import { data, useLoaderData } from "react-router";
import { ARTICLE_FORMAT_LABELS, DEPARTMENT_LABELS, SPOT_TYPE_LABELS } from "../../../../packages/shared/src";
import { ArticleBody, Gallery, VideoPlayer } from "../components/editorial/ArticleParts";
import { Photo } from "../components/editorial/Photo";
import { ShareButtons } from "../components/editorial/ShareButtons";
import { ArticleCard, BackLink, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { DemoBadge, Tag, cx } from "../components/ui/primitives";
import { getArticle } from "../lib/content";
import { eventDateParts } from "../lib/format";
import { SITE_NAME, SITE_URL } from "../lib/config";
import { buildMeta, clip, jsonLd as toJsonLd, ogImage } from "../lib/seo";
import type { Route } from "./+types/story";

export async function loader({ params }: Route.LoaderArgs) {
  const now = Date.now();
  const article = await getArticle(params.slug, now);
  if (!article) throw data("Nota no encontrada", { status: 404 });
  return { article, now };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  if (!data) return buildMeta({ title: "Nota no encontrada", path: location.pathname, noindex: true });
  const a = data.article;
  const description = clip(a.excerpt || (a.body.find((b) => b.type === "paragraph") as { text: string } | undefined)?.text || a.title);
  return buildMeta({ title: a.title, description, path: location.pathname, image: a.coverImage, type: "article" });
};

/** Sección de origen de la nota, para el link "Volver". */
const SECTION_OF: Record<string, { href: string; label: string }> = {
  news: { href: "/news", label: "Noticias" },
  street: { href: "/street", label: "Street" },
  culture: { href: "/culture", label: "Culture" },
  skaters: { href: "/stories?formato=entrevistas", label: "Historias" },
};

export default function StoryPage() {
  const { article: a, now } = useLoaderData<typeof loader>();
  const back = SECTION_OF[a.category.slug] ?? { href: "/stories", label: "Historias" };
  const d = eventDateParts(a.publishedAt);
  const path = `/stories/${a.slug}`;
  const isVideo = a.format === "VIDEO" && a.video;
  const ld = {
    "@context": "https://schema.org",
    "@type": a.format === "NEWS" ? "NewsArticle" : "Article",
    headline: a.title,
    datePublished: a.publishedAt,
    author: { "@type": "Person", name: a.author },
    publisher: { "@type": "Organization", name: SITE_NAME },
    image: ogImage(a.coverImage),
    mainEntityOfPage: `${SITE_URL}${path}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(ld) }} />
      <header className="border-b-2 border-ink bg-concrete">
        <div className={cx(wrap, "flex flex-col gap-5 pb-10 pt-8 md:pb-14")}>
          <BackLink href={back.href}>{back.label}</BackLink>
          <Tag demo={a.isDemo}>{a.category.name} · {ARTICLE_FORMAT_LABELS[a.format]}</Tag>
          <h1 className="m-0 max-w-[18ch] font-display text-[34px] uppercase leading-[0.95] tracking-[-0.025em] [overflow-wrap:anywhere] sm:text-[44px] md:text-[84px]">{a.title}</h1>
          {a.excerpt && <p className="m-0 max-w-[58ch] text-xl leading-relaxed text-body">{a.excerpt}</p>}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-4">
            <p className="label m-0 text-[13px] text-muted">
              Por {a.author} · <time dateTime={a.publishedAt}>{Number(d.day)} {d.month} {d.year}</time>
              {a.format !== "VIDEO" && a.format !== "GALLERY" && <> · {a.readMinutes} min de lectura</>}
            </p>
            <ShareButtons title={a.title} path={path} />
          </div>
        </div>
      </header>

      <div className={cx(wrap, "py-10 md:py-14")}>
        {isVideo ? (
          <VideoPlayer video={a.video!} cover={a.coverImage} />
        ) : (
          a.format !== "GALLERY" && a.coverImage && (
            <Photo asset={a.coverImage} priority sizes="(min-width: 1440px) 1344px, 100vw" className="h-[280px] md:h-[600px]" caption="Foto demo · portada de la nota" />
          )
        )}
      </div>

      <div className={cx(wrap, "grid grid-cols-1 gap-12 pb-20 lg:grid-cols-12")}>
        <div className="flex flex-col gap-12 lg:col-span-8 lg:col-start-2">
          {a.isDemo && (
            <p className="label m-0 self-start border border-muted px-3 py-2 text-[12px] text-muted">
              Nota de demostración · el texto es ficticio
            </p>
          )}
          <div className="max-w-[68ch]"><ArticleBody blocks={a.body} /></div>
          <Gallery photos={a.gallery} />
          <div className="flex flex-col gap-3 border-t-2 border-ink pt-5">
            <span className="label text-[13px] text-muted">¿Te gustó? Compartila</span>
            <ShareButtons title={a.title} path={path} />
          </div>
        </div>

        {(a.skaters.length > 0 || a.spots.length > 0) && (
          <aside aria-label="En esta nota" className="flex flex-col gap-8 lg:col-span-3">
            {a.skaters.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="label m-0 border-t-[6px] border-ink pt-3 text-base tracking-[0.16em]">SKATERS</h2>
                {a.skaters.map((s) => (
                  <A key={s.id} href={`/skaters/${s.slug}`} className="group flex items-center gap-3">
                    <Photo asset={s.profileImage} sizes="64px" className="h-16 w-16 flex-none" />
                    <span className="flex flex-col">
                      <span className="hl font-display text-lg leading-tight">{s.name}{s.isDemo && <DemoBadge />}</span>
                      <span className="text-sm text-muted">{s.city}</span>
                    </span>
                  </A>
                ))}
              </div>
            )}
            {a.spots.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="label m-0 border-t-[6px] border-ink pt-3 text-base tracking-[0.16em]">SPOTS</h2>
                {a.spots.map((s) => (
                  <A key={s.id} href={`/spots/${s.slug}`} className="group flex flex-col">
                    <span className="hl font-display text-lg leading-tight">{s.name}</span>
                    <span className="text-sm text-muted">{SPOT_TYPE_LABELS[s.type]} · {DEPARTMENT_LABELS[s.department]}</span>
                  </A>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {a.related.length > 0 && (
        <section aria-labelledby="relacionadas" className="border-t-2 border-ink bg-concrete">
          <div className={cx(wrap, "py-16")}>
            <h2 id="relacionadas" className="label m-0 mb-8 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em]">SEGUÍ LEYENDO</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {a.related.map((r) => <ArticleCard key={r.id} article={r} now={now} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
