import {
  Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useRouteError, type LinksFunction,
} from "react-router";
import { useEffect } from "react";
import "./styles/app.css";
import { NotFoundContent } from "./components/pages/NotFound";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { GrainDefs } from "./components/ui/primitives";
import { buildMeta } from "./lib/seo";
import type { Route } from "./+types/root";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo+Narrow:wght@500;600;700&family=Inter:wght@400;500;600&family=Permanent+Marker&display=swap",
  },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

/** Documento HTML común a todas las páginas (también a la de error). */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111111" />
        {/* Con JS, las secciones aparecen al hacer scroll; sin JS se ven igual. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  // Marca que React ya tomó el control de la página (lo usan los tests).
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bone text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-sun focus:px-4 focus:py-2 focus:font-label focus:font-bold">
        Saltar al contenido
      </a>
      <GrainDefs />
      <Header />
      <main id="contenido" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) console.error(error);
  return (
    <Shell>
      <NotFoundContent variant={notFound ? "404" : "500"} />
    </Shell>
  );
}

export const meta: Route.MetaFunction = ({ error, location }) => {
  if (!error) return buildMeta({ title: "SKATE CULTURE UY", path: "/" });
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return buildMeta({ title: notFound ? "Página no encontrada" : "Algo se rompió", path: location.pathname, noindex: true });
};
