import { useLoaderData } from "react-router";
import { Photo, Polaroid } from "../components/editorial/Photo";
import { LoadMore, PageHeader, wrap } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { Tape, cx } from "../components/ui/primitives";
import { listSkaters, parsePage } from "../lib/content";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/skaters";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return { page: await listSkaters(parsePage(url.searchParams.get("pagina"))) };
}

export const meta: Route.MetaFunction = ({ location }) =>
  buildMeta({ title: "Skaters", path: location.pathname, description: "Perfiles de skaters de todo Uruguay: quiénes son, qué patinan y dónde se los encuentra." });

const TILTS = [-2, 1.5, -1, 2.5, -1.5, 1];

export default function SkatersPage() {
  const { page } = useLoaderData<typeof loader>();
  return (
    <>
      <PageHeader kicker="LOS PROTAGONISTAS" title="SKATERS" note="de todo el país" intro="Perfiles de skaters de Montevideo y del interior. Cada perfil junta sus entrevistas, partes y fotos publicadas en la revista." />
      <section aria-label="Perfiles" className={cx(wrap, "py-16 md:py-20")}>
        <ul className="m-0 grid list-none grid-cols-1 gap-x-10 gap-y-16 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((s, i) => (
            <li key={s.id} className="group relative">
              <Tape className="left-1/2 -top-3 -ml-[60px]" rotate={i % 2 ? 4 : -4} tint={i % 2 ? "sun" : "celeste"} />
              <Polaroid tilt={TILTS[i % TILTS.length]} label={s.name}>
                <A href={`/skaters/${s.slug}`} aria-label={`Ver perfil de ${s.name}`} className="block">
                  <Photo asset={s.profileImage} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="aspect-[4/5]" caption="Retrato demo" aspectRatio="4:5" />
                </A>
              </Polaroid>
              <p className="m-0 pt-4 text-sm text-muted">
                {s.city} · {s.isDemo ? "Perfil de demostración" : "Perfil"} · {s.highlights}
              </p>
            </li>
          ))}
        </ul>
        <LoadMore page={page} label="Más skaters" />
      </section>
    </>
  );
}
