import { data, useLoaderData } from "react-router";
import { DEPARTMENT_LABELS, SPOT_FEATURE_LABELS, SPOT_TYPE_LABELS } from "../../../../packages/shared/src";
import { Gallery } from "../components/editorial/ArticleParts";
import { Photo } from "../components/editorial/Photo";
import { ShareButtons } from "../components/editorial/ShareButtons";
import { ArticleCard, BackLink, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { DemoBadge, Grain, cx } from "../components/ui/primitives";
import { DEPARTMENT_PARAM, getSpot } from "../lib/content";
import { buildMeta, clip } from "../lib/seo";
import type { Route } from "./+types/spot";

export async function loader({ params }: Route.LoaderArgs) {
  const now = Date.now();
  const spot = await getSpot(params.slug, now);
  if (!spot) throw data("Spot no encontrado", { status: 404 });
  return { spot, now };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  if (!data) return buildMeta({ title: "Spot no encontrado", path: location.pathname, noindex: true });
  const s = data.spot;
  return buildMeta({
    title: `${s.name} — ${SPOT_TYPE_LABELS[s.type]} en ${DEPARTMENT_LABELS[s.department]}`,
    description: clip(s.description),
    path: location.pathname,
    image: s.coverImage,
  });
};

/** Links para llegar: solo con ubicación exacta y coordenadas reales. */
const directions = (lat: number, lng: number) => [
  { label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` },
  { label: "Waze", href: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` },
  { label: "OpenStreetMap", href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}` },
];

export default function SpotPage() {
  const { spot: s, now } = useLoaderData<typeof loader>();
  const dept = DEPARTMENT_LABELS[s.department];
  const exact = s.locationPrecision === "EXACT";
  return (
    <>
      <section aria-labelledby="spot-nombre" className="relative border-b-2 border-ink bg-ink text-bone">
        <Grain strength="grip" />
        <div className={cx(wrap, "relative grid grid-cols-1 gap-8 pb-14 pt-8 md:grid-cols-12")}>
          <div className="md:col-span-12"><BackLink href="/spots" onDark>Todos los spots</BackLink></div>
          <div className="flex flex-col gap-5 md:col-span-6">
            <span className="label text-[13px] tracking-[0.2em] text-celeste">
              {SPOT_TYPE_LABELS[s.type]} · {dept}
              {s.isDemo && <DemoBadge onDark />}
            </span>
            <h1 id="spot-nombre" className="m-0 font-display text-[34px] uppercase leading-[0.9] tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-[52px] md:text-[92px]">{s.name}</h1>
            <p className="m-0 max-w-[52ch] text-lg leading-relaxed text-stone">{s.description}</p>
            <ShareButtonsOnDark title={s.name} path={`/spots/${s.slug}`} />
          </div>
          <div className="md:col-span-6">
            <Photo asset={s.coverImage} priority sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3]" caption={s.coverImage ? "Foto demo del spot" : "Sin foto todavía"} />
          </div>
        </div>
      </section>

      <div className={cx(wrap, "grid grid-cols-1 gap-12 py-14 lg:grid-cols-12")}>
        <section aria-labelledby="spot-datos" className="flex flex-col gap-6 lg:col-span-5">
          <h2 id="spot-datos" className="label m-0 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em]">FICHA</h2>
          <dl className="m-0 grid grid-cols-1 border-t-2 border-ink">
            <Row label="Tipo">{SPOT_TYPE_LABELS[s.type]}</Row>
            <Row label="Departamento"><A href={`/spots?depto=${DEPARTMENT_PARAM[s.department]}`} className="underline decoration-celeste decoration-2 underline-offset-4 hover:text-accent">{dept}</A></Row>
            <Row label="Barrio o localidad">{s.locality}</Row>
            <Row label="Obstáculos">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {s.features.map((f) => (
                  <li key={f} className="label border-2 border-ink bg-sun px-2 py-1 text-[12px] text-ink">{SPOT_FEATURE_LABELS[f]}</li>
                ))}
              </ul>
            </Row>
          </dl>
        </section>

        <section aria-labelledby="spot-ubicacion" className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7">
          <h2 id="spot-ubicacion" className="label m-0 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em]">UBICACIÓN</h2>
          {exact ? (
            s.address && s.coordinates ? (
              <div className="flex flex-col gap-4">
                <p className="m-0 font-display text-2xl">{s.address}</p>
                <p className="m-0 text-muted">{s.locality}, {dept}</p>
                <div className="flex flex-wrap gap-2">
                  {directions(s.coordinates.lat, s.coordinates.lng).map((d) => (
                    <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer" className="label inline-flex min-h-11 items-center border-2 border-ink px-4 text-[13px] hover:bg-ink hover:text-bone">
                      Cómo llegar · {d.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="m-0 border-2 border-dashed border-stone p-5 text-body">
                Skatepark {s.isDemo ? "de demostración: no tiene dirección real." : "público: la dirección se está verificando."}
                {" "}Cuando la tenga, acá aparecen la dirección y los links para llegar.
              </p>
            )
          ) : (
            <div className="halftone -rotate-[0.6deg] p-6 text-ink">
              <p className="m-0 font-display text-2xl leading-tight">{s.locality} · {dept}</p>
              <p className="m-0 mt-3 leading-relaxed">
                Para cuidar este spot no publicamos la dirección exacta. Los spots de calle y DIY se queman rápido: guardias, rejas o una obra y se terminó. Si lo conocés, ya sabés dónde es.
              </p>
            </div>
          )}
        </section>
      </div>

      {s.gallery.length > 0 && (
        <section aria-label="Fotos del spot" className={cx(wrap, "pb-16")}>
          <Gallery photos={s.gallery} />
        </section>
      )}

      {s.articles.length > 0 && (
        <section aria-labelledby="spot-notas" className="border-t-2 border-ink bg-concrete">
          <div className={cx(wrap, "py-16")}>
            <h2 id="spot-notas" className="label m-0 mb-8 border-t-[6px] border-ink pt-3 text-xl tracking-[0.16em]">SESIONES EN ESTE SPOT</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {s.articles.map((a) => <ArticleCard key={a.id} article={a} now={now} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4 border-b border-stone py-4">
      <dt className="label pt-1 text-[12px] text-muted">{label}</dt>
      <dd className="m-0 text-lg">{children}</dd>
    </div>
  );
}

/** Botones de compartir sobre fondo negro. */
function ShareButtonsOnDark({ title, path }: { title: string; path: string }) {
  return (
    <div className="[&_a]:text-bone [&_button]:text-bone [&_[role=status]]:text-celeste">
      <ShareButtons title={title} path={path} />
    </div>
  );
}
