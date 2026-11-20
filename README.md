# SKATE CULTURE UY

**THE CULTURE. THE PEOPLE. THE STREETS.**

Revista digital independiente de skateboarding uruguayo. Proyecto full stack: React + TypeScript + Tailwind en el front; Node + Express + PostgreSQL (Prisma) en el back.

> Estado: **Fase 2 terminada** — sistema visual y prototipo de portada con datos de demostración. El README completo (instalación, API, deploy) llega en la Fase 8.

## Estructura

```text
apps/web/
  app/
    styles/app.css          tokens (colores, tipografías) + utilidades skate (film, halftone, cinta de obra…)
    lib/                    formato de fechas (hora de Montevideo), Cloudinary, compartir, datos demo
    components/ui/          Tag, DemoBadge, Sticker, MarkerNote, Scribble, Tape, ButtonLink, Grain
    components/editorial/   Photo, FilmFrame, Polaroid, Reveal, FilterChips, ShareButtons, SectionTitle
    components/layout/      Header (menú de tres tablas), Ticker "AL PASO", Footer
    components/home/        secciones de la portada
    routes/home.tsx         portada: recibe datos con la forma de GET /api/home
  prototype/                entrada del prototipo (se reemplaza por React Router en la Fase 3)
  scripts/build-prototype.mjs
  tests/unit, tests/e2e
packages/shared/src/        tipos del dominio y etiquetas (departamentos, temas de noticias…)
```

## Probar el prototipo

Requisitos: Node 22, [Bun](https://bun.sh) y Playwright con Chromium (`npx playwright install chromium`).

```bash
npm install
npm run prototype            # genera apps/web/dist (index.html y standalone.html)
npm test                     # tests de unidad (Bun) + flujos en navegador (Playwright)
```

Abrí `apps/web/dist/standalone.html` en el navegador.

## Contenido de demostración

Todo lo marcado **DEMO** es ficticio: personas, titulares, spots (sin ubicaciones reales) y eventos. No hay fotos reales: los bloques grises son lugares para fotografía con crédito. Los datos viven en `apps/web/app/lib/demo-data.ts`, con la misma forma que la respuesta de la API, para reemplazarlos sin tocar los componentes.

## Autor

Diseño y desarrollo: **Jesús Albornoz** — [portfolio](https://micv-brown.vercel.app/) · [GitHub](https://github.com/jesus199324)
