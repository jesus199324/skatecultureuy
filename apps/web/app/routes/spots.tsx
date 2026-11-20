import { useLoaderData } from "react-router";
import { DEPARTMENT_LABELS, SPOT_FEATURE_LABELS, SPOT_TYPE_LABELS, type Department, type SpotType } from "../../../../packages/shared/src";
import { Photo } from "../components/editorial/Photo";
import { EmptyState, FilterLinks, LoadMore, PageHeader, wrap, type FilterLinkOption } from "../components/pages/PageParts";
import { A } from "../components/ui/A";
import { DemoBadge, cx } from "../components/ui/primitives";
import { DEPARTMENT_PARAM, SPOT_TYPE_PARAM, fromParam, listSpots, parsePage } from "../lib/content";
import { pad2 } from "../lib/format";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/spots";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const department = fromParam<Department>(DEPARTMENT_PARAM, url.searchParams.get("depto"));
  const type = fromParam<SpotType>(SPOT_TYPE_PARAM, url.searchParams.get("tipo"));
  const page = await listSpots({ department, type, page: parsePage(url.searchParams.get("pagina")) });
  return { page, department };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  const where = data?.department ? ` en ${DEPARTMENT_LABELS[data.department]}` : " de Uruguay";
  return buildMeta({
    title: `Spots${where}`,
    path: location.pathname + location.search,
    description: `Skateparks, spots de calle y DIY${where}, por departamento y tipo.`,
  });
};

const TYPE_OPTIONS: FilterLinkOption[] = [
  { value: null, label: "Todos" },
  ...(Object.keys(SPOT_TYPE_PARAM) as SpotType[]).map((t) => ({ value: SPOT_TYPE_PARAM[t], label: SPOT_TYPE_LABELS[t] })),
];

export default function SpotsPage() {
  const { page } = useLoaderData<typeof loader>();
  const deptOptions: FilterLinkOption[] = [
    { value: null, label: "Todo el país" },
    ...page.departments.map((d) => ({ value: DEPARTMENT_PARAM[d], label: DEPARTMENT_LABELS[d] })),
  ];
  return (
    <>
      <PageHeader
        kicker="DIRECTORIO DE SPOTS"
        title="SPOTS"
        note="cuidalos"
        intro="Skateparks, spots de calle y DIY de todo el país. Para cuidarlos, de los spots de calle y DIY publicamos solo el departamento y el barrio. La dirección exacta va solo en los skateparks públicos."
      >
        <div className="flex flex-col gap-3">
          <span className="label text-[12px] text-muted">Tipo</span>
          <FilterLinks param="tipo" label="Filtrar spots por tipo" options={TYPE_OPTIONS} />
          <span className="label mt-2 text-[12px] text-muted">Departamento</span>
          <FilterLinks param="depto" label="Filtrar spots por departamento" options={deptOptions} />
        </div>
      </PageHeader>
      <section aria-label="Spots" className={cx(wrap, "py-14 md:py-20")}>
        {page.items.length === 0 ? (
          <EmptyState>No hay spots con esos filtros todavía. ¿Conocés uno? Contanos desde About.</EmptyState>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((s, i) => (
              <li key={s.id} className="group flex flex-col gap-3">
                <A href={`/spots/${s.slug}`} aria-label={`Ver spot: ${s.name}`} className="block">
                  <Photo asset={s.coverImage} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[4/3]" caption={s.coverImage ? "Foto demo" : "Sin foto"}>
                    <span aria-hidden="true" className="absolute left-3 top-2 font-display text-[40px] leading-none text-bone drop-shadow">{pad2(i + 1)}</span>
                  </Photo>
                </A>
                <span className="label text-[13px] text-accent">
                  {SPOT_TYPE_LABELS[s.type]} · {DEPARTMENT_LABELS[s.department]}
                  {s.isDemo && <DemoBadge />}
                </span>
                <h2 className="m-0 font-display text-[24px] leading-[1.05]"><A href={`/spots/${s.slug}`} className="hl">{s.name}</A></h2>
                <p className="m-0 text-[15px] text-muted">{s.features.map((f) => SPOT_FEATURE_LABELS[f]).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
        <LoadMore page={page} label="Más spots" />
      </section>
    </>
  );
}
