import { useLoaderData } from "react-router";
import type { EventSummary } from "../../../../packages/shared/src";
import { EmptyState, FilterLinks, PageHeader, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { cx } from "../components/ui/primitives";
import { listEvents, type EventWhen } from "../lib/content";
import { eventDateParts, eventState } from "../lib/format";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/events";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const when: EventWhen = url.searchParams.get("cuando") === "pasados" ? "pasados" : "proximos";
  const now = Date.now();
  return { when, events: await listEvents(when, now), now };
}

export const meta: Route.MetaFunction = ({ location }) =>
  buildMeta({ title: "Agenda de eventos", path: location.pathname, description: "Jams, campeonatos, best tricks y juntadas de skate en Uruguay. Próximos eventos y archivo." });

const STATE_LABEL = { PROXIMO: "PRÓXIMO", FINALIZADO: "FINALIZADO", CANCELADO: "CANCELADO" } as const;

export default function EventsPage() {
  const { when, events, now } = useLoaderData<typeof loader>();
  return (
    <div className="bg-ink text-bone">
      <PageHeader dark kicker="JAMS · CAMPEONATOS · JUNTADAS" title="EVENTS" note="agendalo" intro="La agenda del skate uruguayo. Las fechas y horas están en hora de Uruguay.">
        <FilterLinks
          param="cuando"
          label="Elegir eventos próximos o pasados"
          onDark
          options={[{ value: null, label: "Próximos" }, { value: "pasados", label: "Pasados" }]}
        />
      </PageHeader>
      <section aria-label={when === "proximos" ? "Próximos eventos" : "Eventos pasados"} className={cx(wrap, "py-14 md:py-20")}>
        {events.length === 0 ? (
          <EmptyState onDark>{when === "proximos" ? "No hay eventos próximos cargados. Mirá los pasados." : "Todavía no hay eventos pasados."}</EmptyState>
        ) : (
          <ul className="m-0 list-none border-t border-dashed border-[#6B6964] p-0">
            {events.map((e, i) => <EventRow key={e.id} event={e} now={now} i={i} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventRow({ event: e, now, i }: { event: EventSummary; now: number; i: number }) {
  const d = eventDateParts(e.eventDate);
  const state = eventState(e, new Date(now));
  return (
    <li className={cx("group grid grid-cols-[84px_1fr] items-center gap-6 border-b border-dashed border-[#6B6964] py-7 md:grid-cols-[200px_1fr_1fr_170px]", state !== "PROXIMO" && "opacity-80")}>
      <time dateTime={e.eventDate} className="flex flex-col leading-[0.85]">
        <span className={cx("font-display text-[56px] md:text-[72px]", state === "PROXIMO" ? "text-sun" : "text-stone", state === "CANCELADO" && "line-through")}>{d.day}</span>
        <span className="label text-base tracking-[0.16em]">{d.month} {d.year}</span>
      </time>
      <A href={`/events/${e.slug}`} className="flex flex-col gap-1.5">
        <span className="hl font-display text-2xl uppercase leading-[1.05] md:text-[30px]">{e.name}</span>
        <span className="text-sm text-stone">{e.isDemo ? "Evento de demostración" : "Evento"} · {d.time} h<span className="md:hidden"> · {e.location}</span></span>
      </A>
      <span className="hidden text-[15px] text-stone md:block">{e.location}</span>
      <span
        className={cx(
          "label col-start-2 justify-self-start px-2.5 py-1.5 text-[13px] tracking-[0.08em] md:col-start-auto",
          state === "PROXIMO" ? (i % 2 ? "bg-sun text-ink" : "bg-celeste text-ink") : state === "CANCELADO" ? "border border-bone text-bone" : "bg-stone text-ink",
        )}
        style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
      >
        {STATE_LABEL[state]}
      </span>
    </li>
  );
}
