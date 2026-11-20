import type { HomePayload } from "../../../../packages/shared/src";
import { Hero } from "../components/home/Hero";
import { NewsSection } from "../components/home/NewsSection";
import {
  AboutSection, CultureSection, EventsSection, LatestSection, SkatersSection, SpotsSection, StreetSection,
} from "../components/home/Sections";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { Ticker } from "../components/layout/Ticker";
import { GrainDefs } from "../components/ui/primitives";

/**
 * Portada. Recibe los datos con la forma de GET /api/home.
 * En la Fase 3 se conecta al loader de React Router.
 */
export default function Home({ data, now = new Date() }: { data: HomePayload; now?: Date }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-bone text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-sun focus:px-4 focus:py-2 focus:font-label focus:font-bold">
        Saltar al contenido
      </a>
      <GrainDefs />
      <Header currentPath="/" />
      <Ticker items={data.news.slice(0, 5)} />
      <main id="contenido">
        <Hero story={data.hero} />
        <NewsSection items={data.news} now={now} />
        <LatestSection items={data.latest} />
        <StreetSection items={data.street} />
        <SkatersSection skaters={data.skaters} quote={data.quote} />
        <SpotsSection spots={data.spots} />
        <CultureSection items={data.culture} />
        <EventsSection events={data.events} now={now} />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
