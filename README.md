# SKATE CULTURE UY

**THE CULTURE. THE PEOPLE. THE STREETS.**

Revista digital independiente de skateboarding uruguayo. Proyecto full stack: React + TypeScript + Tailwind en el front; Node + Express + PostgreSQL (Drizzle ORM) en el back.

> Estado: **Fase 5a terminada**: login del staff y API de administración. Faltan las pantallas del panel y la subida de fotos (Fase 5b). Las páginas pasan a leer la API en la Fase 6. El README completo (instalación, API, deploy) llega en la Fase 8.

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
apps/api/
  src/app.ts                Express: seguridad, CORS, límite de pedidos, errores
  src/routes/public.ts      endpoints públicos y validación de parámetros (zod)
  src/routes/auth.ts        login, logout y usuario actual
  src/routes/admin/         API del panel: notas, skaters, spots, eventos, fotos, citas y cuentas
  src/auth/                 contraseñas (Argon2id), sesiones y permisos
  src/services/content.ts   consultas (solo contenido publicado)
  src/lib/serialize.ts      filas de la base → formas públicas (aplica la regla de ubicación de spots)
  src/db/schema.ts          tablas de PostgreSQL (Drizzle)
  src/db/seed-demo.ts       carga y borrado del contenido DEMO
  drizzle/                  migraciones SQL generadas
  test/                     tests contra un PostgreSQL real
packages/shared/src/        tipos del dominio, etiquetas, reglas, parámetros de URL y contenido demo
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

## API

Base: `/api`. Solo lectura y solo contenido publicado. Las notas programadas no aparecen hasta su fecha de publicación. Los parámetros son los mismos que usan las URLs de la revista.

| Endpoint | Parámetros |
|---|---|
| `GET /api/health` | — |
| `GET /api/home` | — (la misma forma que usa la portada) |
| `GET /api/articles` | `seccion` (obligatorio: news · street · culture · stories), `tema`, `formato`, `pagina` |
| `GET /api/articles/:slug` | — |
| `GET /api/skaters` · `/api/skaters/:slug` | `pagina` |
| `GET /api/spots` · `/api/spots/:slug` | `depto`, `tipo`, `pagina` (la lista trae también `departments` para el filtro) |
| `GET /api/events` · `/api/events/:slug` | `cuando` (proximos · pasados) |

- **Errores:** `400` si un parámetro no es válido (con `detalles`), `404` si no existe y `500` sin detalles internos.
- **Ubicación de los spots:** la API nunca devuelve la dirección ni las coordenadas de un spot de calle o DIY, aunque estén guardadas en la base.
- **Seguridad:** encabezados de Helmet, CORS solo para los orígenes de `CORS_ORIGIN`, límite de pedidos por IP y caché pública de 60 segundos.

## Panel: acceso y API de administración

**Cuentas:** no hay registro público. La primera cuenta (admin) se crea desde la terminal; la contraseña se pide sin mostrarse:

```bash
npm run staff:create -- --email vos@mail.com --name "Tu nombre"            # ADMIN
npm run staff:create -- --email otra@mail.com --name "Otra" --role EDITOR
```

Si el email ya existe, el comando le cambia la contraseña y cierra sus sesiones abiertas.

- **Roles:** `ADMIN` puede todo, incluidas las cuentas. `EDITOR` carga y publica contenido.
- **Sesión:** cookie `scuy_session` httpOnly y `SameSite=Lax`; en producción solo viaja por HTTPS. En la base se guarda el hash del token. Dura `SESSION_DAYS` días.
- **Login:** se permiten `LOGIN_ATTEMPTS` intentos fallidos cada 15 minutos por IP y email. Si el email no existe o la contraseña está mal, el mensaje es el mismo.
- **CSRF:** toda acción que cambia datos lleva el encabezado `X-SCUY-CSRF: 1`.

| Endpoint | Qué hace |
|---|---|
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | sesión |
| `/api/admin/articles` | notas: `GET` (con `?q=`, `?estado=`, `?seccion=`, `?pagina=`), `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| `/api/admin/skaters` · `/spots` · `/events` | igual que las notas |
| `/api/admin/media` | fotos: alta (con texto alternativo y crédito obligatorios), edición y baja (no se borra una foto en uso) |
| `/api/admin/quotes` · `/categories` | citas de portada y secciones |
| `/api/admin/staff` | cuentas (solo `ADMIN`) |

**Reglas de las notas:**

- Una noticia necesita tema; una nota de video, un link de YouTube o Vimeo.
- Publicar sin fecha publica en ese momento. Con una fecha futura, la nota queda programada.
- El slug se arma solo a partir del título, y si ya existe responde `409`.
- `PATCH` cambia solo los campos que se mandan.

## Base de datos (PostgreSQL)

**Con Neon** (recomendado, gratis):

1. En [neon.tech](https://neon.tech) creá un proyecto y copiá la connection string.
2. Creá también una rama `test` para los tests.
3. Copiá `apps/api/.env.example` como `apps/api/.env` y completá `DATABASE_URL`.
4. Creá `apps/api/.env.test` con `DATABASE_URL` y `TEST_DATABASE_URL` apuntando a la rama `test`.

**Con Docker:** `docker compose up -d`. Las URLs están en `docker-compose.yml`.

```bash
npm run db:migrate     # crea las tablas
npm run db:seed        # carga el contenido DEMO (se puede repetir)
npm run dev:api        # http://localhost:4000/api
npm run db:reset       # borra solo el DEMO (antes de lanzar); con -- --todo vacía todo (no en producción)
```

Si cambiás `apps/api/src/db/schema.ts`, generá la migración con `npm run db:generate -w apps/api`.

## Desarrollo

Requisitos: Node 22 y [Bun](https://bun.sh) (tests de unidad). Para los tests en navegador, Playwright con Chromium (`npx playwright install chromium`).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de producción (apps/web/build)
npm start            # sirve el build con SSR (puerto 3000)
npm run typecheck
npm test             # web: unidad (Bun) + build + navegador (Playwright) · API: tests contra PostgreSQL
```

Configuración pública: copiá `apps/web/.env.example` como `apps/web/.env`.

## Contenido de demostración

Todo lo marcado **DEMO** es ficticio: personas, titulares, spots (sin ubicaciones reales) y eventos. No hay fotos reales: los bloques grises son lugares para fotografía con crédito. Los datos viven en `apps/web/app/lib/demo-data.ts`, con la misma forma que la respuesta de la API, para reemplazarlos sin tocar los componentes.

## Autor

Diseño y desarrollo: **Jesús Albornoz** — [portfolio](https://micv-brown.vercel.app/) · [GitHub](https://github.com/jesus199324)
