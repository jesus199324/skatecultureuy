import { data, useLoaderData } from "react-router";
import { DEPARTMENT_LABELS, SPOT_TYPE_LABELS } from "../../../../packages/shared/src";
import { Photo } from "../components/editorial/Photo";
import { ShareButtons } from "../components/editorial/ShareButtons";
import { BackLink, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { DemoBadge, Grain, Sticker, cx } from "../components/ui/primitives";
import { SITE_URL } from "../lib/config";
import { getEvent } from "../lib/content";
import { eventDateParts, eventState } from "../lib/format";
import { buildMeta, clip, jsonLd } from "../lib/seo";
import type { Route } from "./+types/event";

export async function loader({ params }: Route.LoaderArgs) {
  const now = Date.now();
  const event = await getEvent(params.slug, now);
  if (!event) throw data("Evento no encontrado", { status: 404 });
  return { event, now };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  if (!data) return buildMeta({ title: "Evento no encontrado", path: location.pathname, noindex: true });
  const e = data.event;
  const d = eventDateParts(e.eventDate);
  return buildMeta({ title: `${e.name} · ${Number(d.day)} ${d.month} ${d.year}`, description: clip(`${e.location}. ${e.description}`), path: location.pathname, image: e.coverImage });
};

const STATE_TEXT = { PROXIMO: "Próximo", FINALIZADO: "Finalizado", CANCELADO: "Cancelado" } as const;

export default function EventPage() {
  const { event: e, now } = useLoaderData<typeof loader>();
  const d = eventDateParts(e.eventDate);
  const state = eventState(e, new Date(now));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    startDate: e.eventDate,
    eventStatus: e.cancelled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.location },
    url: `${SITE_URL}/events/${e.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <section aria-labelledby="evento-nombre" className="relative bg-ink text-bone">
        <Grain strength="grip" />
        {state === "CANCELADO" && <div className="relative h-3 sun-stripe" />}
        <div className={cx(wrap, "relative grid grid-cols-1 gap-10 pb-14 pt-8 md:grid-cols-12")}>
          <div className="md:col-span-12"><BackLink href={state === "PROXIMO" ? "/events" : "/events?cuando=pasados"} onDark>Agenda</BackLink></div>
          <time dateTime={e.eventDate} className="relative flex flex-col leading-[0.85] md:col-span-3">
            <span className={cx("font-display text-[120px] md:text-[168px]", state === "PROXIMO" ? "text-sun" : "text-stone")}>{d.day}</span>
            <span className="label text-2xl tracking-[0.16em]">{d.month} {d.year}</span>
            <span className="label mt-3 text-lg text-stone">{d.time} h · hora de Uruguay</span>
          </time>
          <div className="flex flex-col gap-5 md:col-span-8 md:col-start-5">
            <span className="label text-[13px] tracking-[0.2em] text-celeste">
              EVENTO · {STATE_TEXT[state].toUpperCase()}
              {e.isDemo && <DemoBadge onDark />}
            </span>
            <h1 id="evento-nombre" className={cx("m-0 font-display text-[34px] uppercase leading-[0.9] tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-[52px] md:text-[92px]", state === "CANCELADO" && "line-through decoration-sun")}>{e.name}</h1>
            <p className="m-0 text-xl">{e.location}</p>
            {state === "CANCELADO" && <p className="label m-0 self-start bg-sun px-3 py-2 text-ink">Este evento se canceló</p>}
            <p className="m-0 max-w-[58ch] text-lg leading-relaxed text-stone">{e.description}</p>
            {e.spot && (
              <A href={`/spots/${e.spot.slug}`} className="label self-start text-celeste hover:text-sun">
                Spot: {e.spot.name} · {SPOT_TYPE_LABELS[e.spot.type]} · {DEPARTMENT_LABELS[e.spot.department]} →
              </A>
            )}
            {e.externalUrl && (
              <a href={e.externalUrl} target="_blank" rel="noopener noreferrer" className="label self-start border-2 border-bone px-4 py-3 hover:bg-bone hover:text-ink">
                Más info e inscripciones ↗
              </a>
            )}
            <div className="[&_a]:text-bone [&_button]:text-bone [&_[role=status]]:text-celeste">
              <ShareButtons title={`${e.name} · ${Number(d.day)} ${d.month}`} path={`/events/${e.slug}`} />
            </div>
          </div>
        </div>
      </section>
      {e.coverImage && (
        <div className={cx(wrap, "relative py-12")}>
          <Photo asset={e.coverImage} sizes="(min-width: 1440px) 1344px, 100vw" className="h-[260px] md:h-[520px]" caption="Foto demo del evento" />
          {state === "PROXIMO" && <Sticker tone="celeste" rotate={-6} className="left-2 top-6 md:left-8">¡No te lo pierdas!</Sticker>}
        </div>
      )}
    </>
  );
}
