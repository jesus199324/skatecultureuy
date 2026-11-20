# SKATE CULTURE UY

**THE CULTURE. THE PEOPLE. THE STREETS.**

Revista digital independiente de skateboarding uruguayo. Proyecto full stack: React + TypeScript + Tailwind en el front; Node + Express + PostgreSQL (Prisma) en el back.

> Estado: **Fase 3 terminada**: navegación y páginas internas con React Router (SSR) y datos de demostración. El README completo (instalación, API, deploy) llega en la Fase 8.

## Estructura

```text
apps/web/
  app/
    root.tsx                layout común (header, footer, 404/error) y metadatos por defecto
    routes.ts               mapa de rutas
    routes/                 una página por archivo (ver tabla de abajo)
    styles/app.css          tokens (colores, tipografías) + utilidades skate (film, halftone, cinta de obra…)
    lib/content.ts          fuente de datos de las páginas (hoy demo; en la Fase 6, la API)
    lib/demo-data.ts        portada demo · lib/demo-content.ts: notas, skaters, spots y eventos demo
    lib/seo.ts              título, descripción, canónica, Open Graph y JSON-LD
    lib/                    fechas (hora de Montevideo), Cloudinary, compartir, configuración
    components/ui/          A (link interno/externo), Tag, DemoBadge, Sticker, MarkerNote, Tape, ButtonLink…
    components/editorial/   Photo, FilmFrame, Polaroid, Reveal, ShareButtons, ArticleBody, Gallery, VideoPlayer
    components/layout/      Header (menú de tres tablas, sección activa), Ticker "AL PASO", Footer
    components/home/        secciones de la portada
    components/pages/       cabeceras, filtros en la URL, "Cargar más", tarjetas, 404
  public/                   favicon, robots.txt, imagen para compartir (og-default.png)
  tests/unit, tests/e2e
packages/shared/src/        tipos del dominio, etiquetas y reglas (precisión de ubicación, tamaño de página)
```

## Páginas

| Ruta | Página | Filtros (en la URL) |
|---|---|---|
| `/` | Portada | — |
| `/news` | Noticias | `?tema=escena-local · competencias · internacional · industria` |
| `/street`, `/culture`, `/stories` | Listados de notas | `?formato=historias · entrevistas · galerias · videos` |
| `/stories/:slug` | Nota (historia, entrevista, galería, video o noticia) | — |
| `/skaters`, `/skaters/:slug` | Perfiles | — |
| `/spots`, `/spots/:slug` | Directorio de spots | `?tipo=skatepark · calle · diy` y `?depto=montevideo…` |
| `/events`, `/events/:slug` | Agenda | `?cuando=pasados` |
| `/about` | Sobre la revista (`#enviar`, `#colaborar`, `#contacto`) | — |
| cualquier otra | 404 "Spot quemado" (responde con estado 404) | — |

Los listados largos muestran 9 items y un botón **"Cargar más"** (`?pagina=2` trae los primeros 18). Filtros y "Cargar más" son links: se pueden compartir y funcionan aunque el JavaScript no haya cargado.

**Ubicación de los spots:** los spots de calle y DIY se publican solo con departamento y barrio, para no quemarlos. La dirección exacta y los links para llegar van solo en los skateparks públicos (`publicLocationPrecision` en `packages/shared`).

## Desarrollo

Requisitos: Node 22 y [Bun](https://bun.sh) (tests de unidad). Para los tests en navegador, Playwright con Chromium (`npx playwright install chromium`).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de producción (apps/web/build)
npm start            # sirve el build con SSR (puerto 3000)
npm run typecheck
npm test             # unidad (Bun) + build + flujos en navegador (Playwright)
```

Configuración pública: copiá `apps/web/.env.example` como `apps/web/.env`.

## Contenido de demostración

Todo lo marcado **DEMO** es ficticio: personas, titulares, spots (sin ubicaciones reales) y eventos. No hay fotos reales: los bloques grises son lugares para fotografía con crédito. Los datos viven en `apps/web/app/lib/demo-data.ts`, con la misma forma que la respuesta de la API, para reemplazarlos sin tocar los componentes.

## Autor

Diseño y desarrollo: **Jesús Albornoz** — [portfolio](https://micv-brown.vercel.app/) · [GitHub](https://github.com/jesus199324)
