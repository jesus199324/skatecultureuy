import { data, useLoaderData } from "react-router";
import { Photo, Polaroid } from "../components/editorial/Photo";
import { ShareButtons } from "../components/editorial/ShareButtons";
import { ArticleCard, BackLink, EmptyState, wrap } from "../components/pages/PageParts";
import { DemoBadge, MarkerNote, Tape, cx } from "../components/ui/primitives";
import { getSkater } from "../lib/content";
import { buildMeta, clip } from "../lib/seo";
import type { Route } from "./+types/skater";

export async function loader({ params }: Route.LoaderArgs) {
  const now = Date.now();
  const skater = await getSkater(params.slug, now);
  if (!skater) throw data("Skater no encontrado", { status: 404 });
  return { skater, now };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  if (!data) return buildMeta({ title: "Skater no encontrado", path: location.pathname, noindex: true });
  const s = data.skater;
  return buildMeta({ title: `${s.name} — ${s.city}`, description: clip(s.bio), path: location.pathname, image: s.profileImage, type: "profile" });
};

const STANCE = { REGULAR: "Regular", GOOFY: "Goofy" } as const;

export default function SkaterPage() {
  const { skater: s, now } = useLoaderData<typeof loader>();
  return (
    <>
      <section aria-labelledby="skater-nombre" className="border-b-2 border-ink">
        <div className={cx(wrap, "grid grid-cols-1 items-start gap-10 pb-16 pt-8 md:grid-cols-12")}>
          <div className="md:col-span-12"><BackLink href="/skaters">Todos los skaters</BackLink></div>
          <div className="relative md:col-span-5">
            <Tape className="left-1/2 -top-3 -ml-[60px]" rotate={-4} tint="celeste" />
            <Polaroid tilt={-2} label={`${s.name} — ${s.city}`}>
              <Photo asset={s.profileImage} priority sizes="(min-width: 768px) 40vw, 100vw" className="aspect-[4/5]" caption="Retrato demo" aspectRatio="4:5" />
            </Polaroid>
          </div>
          <div className="flex flex-col gap-6 md:col-span-6 md:col-start-7 md:pt-10">
            <span className="label text-[13px] tracking-[0.2em] text-muted">PERFIL{s.isDemo && <DemoBadge />}</span>
            <h1 id="skater-nombre" className="m-0 font-display text-[48px] uppercase leading-[0.85] [overflow-wrap:anywhere] sm:text-[64px] tracking-[-0.03em] md:text-[110px]">{s.name}</h1>
            <MarkerNote className="text-2xl" rotate={-3}>{s.city}</MarkerNote>
            <dl className="m-0 grid grid-cols-2 border-y-2 border-ink">
              <div className="border-r border-stone py-4 pr-4">
                <dt className="label text-[12px] text-muted">Ciudad</dt>
                <dd className="m-0 font-display text-xl">{s.city}</dd>
              </div>
              <div className="py-4 pl-4">
                <dt className="label text-[12px] text-muted">Postura</dt>
                <dd className="m-0 font-display text-xl">{s.stance ? STANCE[s.stance] : "—"}</dd>
              </div>
            </dl>
            <p className="m-0 max-w-[56ch] text-lg leading-relaxed text-body">{s.bio}</p>
            {s.instagram && (
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" className="label text-accent hover:text-ink">
                Instagram: @{s.instagram} ↗
              </a>
            )}
            <ShareButtons title={`${s.name} en SKATE CULTURE UY`} path={`/skaters/${s.slug}`} />
          </div>
        </div>
      </section>
      <section aria-labelledby="skater-notas" className={cx(wrap, "py-16")}>
        <h2 id="skater-notas" className="label m-0 mb-8 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em]">EN LA REVISTA</h2>
        {s.articles.length === 0 ? (
          <EmptyState>Todavía no hay notas publicadas sobre {s.name}.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {s.articles.map((a) => <ArticleCard key={a.id} article={a} now={now} />)}
          </div>
        )}
      </section>
    </>
  );
}
