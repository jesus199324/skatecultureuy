import { useLoaderData } from "react-router";
import type { HomePayload } from "../../../../packages/shared/src";
import { Hero } from "../components/home/Hero";
import { NewsSection } from "../components/home/NewsSection";
import {
  AboutSection, CultureSection, EventsSection, LatestSection, SkatersSection, SpotsSection, StreetSection,
} from "../components/home/Sections";
import { Ticker } from "../components/layout/Ticker";
import { getHome } from "../lib/content";
import { buildMeta } from "../lib/seo";
import type { Route } from "./+types/home";

export async function loader() {
  const now = Date.now();
  return { data: await getHome(now), now };
}

export const meta: Route.MetaFunction = () =>
  buildMeta({ title: "SKATE CULTURE UY", path: "/", description: "Revista digital independiente de skateboarding uruguayo: noticias, street, skaters, spots, cultura y eventos." });

/** Contenido de la portada (header y footer los pone el layout general). */
export function HomeContent({ data, now }: { data: HomePayload; now: Date }) {
  return (
    <>
      <Ticker items={data.news.slice(0, 5)} />
      <Hero story={data.hero} />
      <NewsSection items={data.news} now={now} />
      <LatestSection items={data.latest} />
      <StreetSection items={data.street} />
      <SkatersSection skaters={data.skaters} quote={data.quote} />
      <SpotsSection spots={data.spots} />
      <CultureSection items={data.culture} />
      <EventsSection events={data.events} now={now} />
      <AboutSection />
    </>
  );
}

export default function Home() {
  const { data, now } = useLoaderData<typeof loader>();
  return <HomeContent data={data} now={new Date(now)} />;
}
