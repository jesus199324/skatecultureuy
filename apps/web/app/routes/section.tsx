import { useLoaderData } from "react-router";
import { NEWS_TOPIC_LABELS, type ArticleFormat, type NewsTopic } from "../../../../packages/shared/src";
import { ArticleCard, EmptyState, FilterLinks, LoadMore, PageHeader, wrap, type FilterLinkOption } from "../components/pages/PageParts";
import { cx } from "../components/ui/primitives";
import { FORMAT_PARAM, TOPIC_PARAM, fromParam, listArticles, parsePage, type ArticleSection } from "../lib/content";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/section";

/** Listados de notas: /news, /street, /culture y /stories comparten esta página. */
const SECTIONS: Record<ArticleSection, {
  title: string; kicker: string; intro: string; note?: string; dark?: boolean; filter: "topic" | "format" | null; empty: string;
}> = {
  news: {
    title: "NOTICIAS", kicker: "LO QUE PASA EN LA ESCENA", note: "al día",
    intro: "Escena local, competencias, lo que pasa afuera y la industria. Noticias cortas, con fuente y fecha.",
    filter: "topic", empty: "Todavía no hay noticias de este tema.",
  },
  street: {
    title: "STREET", kicker: "SESIONES · FOTOS · VIDEO", note: "grip tape edition", dark: true,
    intro: "Sesiones, partes de video y fotos de la calle. El skate como se vive en las plazas, escalinatas y bordes del país.",
    filter: "format", empty: "No hay publicaciones de este tipo todavía.",
  },
  culture: {
    title: "CULTURE", kicker: "MARCAS · DOCUMENTALES · MÚSICA · ARTE",
    intro: "Todo lo que rodea al skate: quién hace las tablas, qué suena en las sesiones, el arte y el archivo.",
    filter: "format", empty: "No hay publicaciones de este tipo todavía.",
  },
  stories: {
    title: "HISTORIAS", kicker: "TODO LO PUBLICADO", note: "de la más nueva a la más vieja",
    intro: "Todas las notas de la revista: historias, entrevistas, galerías y videos.",
    filter: "format", empty: "No hay publicaciones de este tipo todavía.",
  },
};

const TOPIC_OPTIONS: FilterLinkOption[] = [
  { value: null, label: "Todas" },
  ...(Object.keys(TOPIC_PARAM) as NewsTopic[]).map((t) => ({ value: TOPIC_PARAM[t], label: NEWS_TOPIC_LABELS[t] })),
];
const FORMAT_OPTIONS: FilterLinkOption[] = [
  { value: null, label: "Todo" },
  { value: FORMAT_PARAM.STORY, label: "Historias" },
  { value: FORMAT_PARAM.INTERVIEW, label: "Entrevistas" },
  { value: FORMAT_PARAM.GALLERY, label: "Galerías" },
  { value: FORMAT_PARAM.VIDEO, label: "Videos" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const section = url.pathname.replace(/^\/|\/$/g, "") as ArticleSection;
  const now = Date.now();
  const topic = fromParam<NewsTopic>(TOPIC_PARAM, url.searchParams.get("tema"));
  const format = fromParam<Exclude<ArticleFormat, "NEWS">>(FORMAT_PARAM, url.searchParams.get("formato"));
  const page = await listArticles(
    { section, topic: section === "news" ? topic : null, format: section === "news" ? null : format, page: parsePage(url.searchParams.get("pagina")) },
    now,
  );
  return { section, page, now, filtered: Boolean(topic || format) };
}

export const meta: Route.MetaFunction = ({ data, location }) => {
  const s = data ? SECTIONS[data.section] : SECTIONS.stories;
  return buildMeta({ title: s.title.charAt(0) + s.title.slice(1).toLowerCase(), description: s.intro, path: location.pathname });
};

export default function SectionPage() {
  const { section, page, now, filtered } = useLoaderData<typeof loader>();
  const s = SECTIONS[section];
  const dark = Boolean(s.dark);
  const [lead, ...rest] = page.items;
  const showLead = !filtered && lead;
  return (
    <div className={cx(dark && "bg-ink text-bone")}>
      <PageHeader kicker={s.kicker} title={s.title} intro={s.intro} note={s.note} dark={dark}>
        {s.filter === "topic" && <FilterLinks param="tema" label="Filtrar noticias por tema" options={TOPIC_OPTIONS} />}
        {s.filter === "format" && <FilterLinks param="formato" label="Filtrar por tipo de publicación" options={FORMAT_OPTIONS} onDark={dark} />}
      </PageHeader>
      <section aria-label="Publicaciones" className={cx(wrap, "py-14 md:py-20")}>
        {page.items.length === 0 ? (
          <EmptyState onDark={dark}>{s.empty}</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {showLead && (
              <div className="sm:col-span-2">
                <ArticleCard article={lead} now={now} onDark={dark} size="lg" />
              </div>
            )}
            {(showLead ? rest : page.items).map((a) => (
              <ArticleCard key={a.id} article={a} now={now} onDark={dark} />
            ))}
          </div>
        )}
        <LoadMore page={page} onDark={dark} />
      </section>
    </div>
  );
}
