/**
 * Tests de la API contra un PostgreSQL real.
 * Necesita TEST_DATABASE_URL apuntando a una base de prueba (se vacía en cada corrida).
 * Uso: TEST_DATABASE_URL=postgresql://... npm test -w apps/api
 */
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import type { ArticleDetail, ArticleSummary, EventSummary, HomePayload, Paginated, SkaterDetail, SpotDetail, SpotSummary } from "../../../packages/shared/src";
import { buildDemoDb } from "../../../packages/shared/src/demo/content";
import { createApp } from "../src/app";
import { createDb } from "../src/db/client";
import * as t from "../src/db/schema";
import { deleteDemo, seedDemo, truncateAll } from "../src/db/seed-demo";
import { runMigrations } from "../src/scripts/migrate";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Falta TEST_DATABASE_URL (una base de prueba que se puede vaciar).");

const NOW = Date.now();
const { db, pool } = createDb(url);
const config = { CORS_ORIGIN: "https://skateculture.uy,http://localhost:5173", RATE_LIMIT_PER_MINUTE: 1000, NODE_ENV: "test" as const, SESSION_DAYS: 7, LOGIN_ATTEMPTS: 5 };
let base = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

async function get<T = unknown>(path: string, headers: Record<string, string> = {}) {
  const res = await fetch(base + path, { headers });
  return { status: res.status, headers: res.headers, body: (await res.json()) as T };
}

before(async () => {
  await runMigrations(db);
  await truncateAll(db);
  await seedDemo(db, NOW);
  server = createApp(db, config).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});

describe("salud y errores", () => {
  test("health responde ok", async () => {
    const r = await get<{ ok: boolean }>("/health");
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true });
  });
  test("ruta inexistente = 404 en JSON", async () => {
    const r = await get<{ error: string }>("/no-existe");
    assert.equal(r.status, 404);
    assert.equal(r.body.error, "No encontrado");
  });
  test("filtro inválido = 400 con detalle en español", async () => {
    const r = await get<{ error: string; detalles: { campo: string }[] }>("/articles?seccion=news&tema=cualquiera");
    assert.equal(r.status, 400);
    assert.equal(r.body.detalles[0].campo, "tema");
  });
  test("parámetros desconocidos y slugs raros = 400", async () => {
    assert.equal((await get("/articles?seccion=news&hack=1")).status, 400);
    assert.equal((await get("/articles?seccion=admin")).status, 400);
    assert.equal((await get("/spots/..%2F..%2Fetc")).status, 400);
    assert.equal((await get("/articles?seccion=news&pagina=0")).status, 400);
  });
});

describe("notas", () => {
  test("los listados traen las mismas notas que las páginas demo", async () => {
    const demo = buildDemoDb(NOW);
    for (const section of ["news", "street", "culture", "stories"] as const) {
      const r = await get<Paginated<ArticleSummary>>(`/articles?seccion=${section}&pagina=10`);
      const expected = demo.articles.filter((a) => (section === "stories" ? a.format !== "NEWS" : a.category.slug === section)).map((a) => a.slug).sort();
      assert.deepEqual(r.body.items.map((a) => a.slug).sort(), expected, section);
    }
  });
  test("Cargar más: 9 por tanda, acumuladas", async () => {
    const p1 = (await get<Paginated<ArticleSummary>>("/articles?seccion=stories")).body;
    const p2 = (await get<Paginated<ArticleSummary>>("/articles?seccion=stories&pagina=2")).body;
    assert.equal(p1.items.length, 9);
    assert.equal(p1.hasMore, true);
    assert.ok(p2.items.length > 9);
    assert.deepEqual(p2.items.slice(0, 9).map((a) => a.id), p1.items.map((a) => a.id));
    const dates = p2.items.map((a) => Date.parse(a.publishedAt));
    assert.deepEqual([...dates].sort((a, b) => b - a), dates, "de la más nueva a la más vieja");
  });
  test("filtros por tema y formato", async () => {
    const news = (await get<Paginated<ArticleSummary>>("/articles?seccion=news&tema=competencias")).body;
    assert.ok(news.items.length > 0);
    assert.ok(news.items.every((a) => a.newsTopic === "COMPETENCIAS"));
    const videos = (await get<Paginated<ArticleSummary>>("/articles?seccion=street&formato=videos")).body;
    assert.ok(videos.items.length > 0);
    assert.ok(videos.items.every((a) => a.format === "VIDEO" && a.category.slug === "street"));
  });
  test("detalle: entrevista con preguntas, skater vinculado y relacionadas", async () => {
    const a = (await get<ArticleDetail>("/articles/entrevista-martina-r")).body;
    assert.ok(a.body.some((b) => b.type === "qa"));
    assert.deepEqual(a.skaters.map((s) => s.slug), ["martina-r"]);
    assert.ok(a.related.length > 0 && a.related.every((r) => r.slug !== a.slug));
  });
  test("detalle: galería en orden y video", async () => {
    const g = (await get<ArticleDetail>("/articles/domingo-de-bowl")).body;
    assert.equal(g.gallery.length, 8);
    assert.match(g.gallery[0].altText, /Foto demo 1 /);
    const v = (await get<ArticleDetail>("/articles/parte-nico-f")).body;
    assert.deepEqual(v.video, { provider: "YOUTUBE", videoId: null, title: "Parte completo: Nico F." });
  });
  test("borradores y notas programadas no se publican", async () => {
    const [cat] = await db.select().from(t.categories).where(eq(t.categories.slug, "news"));
    await db.insert(t.articles).values([
      { title: "Borrador secreto", slug: "borrador-secreto", format: "NEWS", categoryId: cat.id, author: "Test", status: "DRAFT", publishedAt: new Date(NOW - 1000) },
      { title: "Programada", slug: "programada-manana", format: "NEWS", categoryId: cat.id, author: "Test", status: "PUBLISHED", publishedAt: new Date(NOW + 86_400_000) },
    ]);
    const list = (await get<Paginated<ArticleSummary>>("/articles?seccion=news&pagina=10")).body;
    assert.ok(!list.items.some((a) => a.slug === "borrador-secreto" || a.slug === "programada-manana"));
    assert.equal((await get("/articles/borrador-secreto")).status, 404);
    assert.equal((await get("/articles/programada-manana")).status, 404);
    await db.delete(t.articles).where(eq(t.articles.author, "Test"));
  });
  test("nota inexistente = 404", async () => {
    assert.equal((await get("/articles/no-existe")).status, 404);
  });
});

describe("spots: la ubicación exacta solo sale en skateparks", () => {
  let created: string[] = [];
  before(async () => {
    const rows = await db
      .insert(t.spots)
      .values([
        { name: "Calle con dirección guardada", slug: "test-calle", type: "STREET", department: "ROCHA", locality: "Barrio test", address: "Calle Falsa 123", lat: -34.9, lng: -56.1, status: "PUBLISHED" },
        { name: "DIY con dirección guardada", slug: "test-diy", type: "DIY", department: "ROCHA", locality: "Barrio test", address: "Otra 456", lat: -34.8, lng: -56.2, status: "PUBLISHED" },
        { name: "Skatepark público", slug: "test-skatepark", type: "SKATEPARK", department: "ROCHA", locality: "Centro test", address: "Plaza 1", lat: -34.7, lng: -56.3, status: "PUBLISHED" },
        { name: "Spot sin publicar", slug: "test-borrador", type: "SKATEPARK", department: "ARTIGAS", locality: "X", status: "DRAFT" },
      ])
      .returning({ id: t.spots.id });
    created = rows.map((r) => r.id);
  });
  after(async () => {
    for (const id of created) await db.delete(t.spots).where(eq(t.spots.id, id));
  });

  test("calle y DIY: sin dirección ni coordenadas aunque estén en la base", async () => {
    for (const slug of ["test-calle", "test-diy"]) {
      const s = (await get<SpotDetail>(`/spots/${slug}`)).body;
      assert.equal(s.locationPrecision, "AREA");
      assert.equal(s.address, null);
      assert.equal(s.coordinates, null);
      assert.equal(s.locality, "Barrio test");
      assert.ok(!JSON.stringify(s).includes("Calle Falsa") && !JSON.stringify(s).includes("-34."), "se filtró la ubicación");
    }
  });
  test("skatepark: dirección y coordenadas", async () => {
    const s = (await get<SpotDetail>("/spots/test-skatepark")).body;
    assert.equal(s.locationPrecision, "EXACT");
    assert.equal(s.address, "Plaza 1");
    assert.deepEqual(s.coordinates, { lat: -34.7, lng: -56.3 });
  });
  test("filtros por departamento y tipo; borradores ocultos", async () => {
    const r = (await get<Paginated<SpotSummary> & { departments: string[] }>("/spots?depto=rocha&tipo=calle")).body;
    assert.ok(r.items.length >= 1);
    assert.ok(r.items.every((s) => s.department === "ROCHA" && s.type === "STREET"));
    assert.ok(r.departments.includes("ROCHA"));
    assert.ok(!r.departments.includes("ARTIGAS"), "un departamento con solo borradores no aparece en el filtro");
    assert.equal((await get("/spots/test-borrador")).status, 404);
  });
  test("los spots demo no tienen ubicación", async () => {
    const r = (await get<Paginated<SpotSummary>>("/spots?pagina=5")).body;
    for (const s of r.items.filter((x) => x.isDemo)) {
      const d = (await get<SpotDetail>(`/spots/${s.slug}`)).body;
      assert.equal(d.address, null);
      assert.equal(d.coordinates, null);
    }
  });
});

describe("skaters, eventos y portada", () => {
  test("skaters en orden y con sus notas", async () => {
    const list = (await get<Paginated<{ slug: string }>>("/skaters")).body;
    assert.deepEqual(list.items.slice(0, 2).map((s) => s.slug), ["martina-r", "nico-f"]);
    const k = (await get<SkaterDetail>("/skaters/martina-r")).body;
    assert.deepEqual(k.articles.map((a) => a.slug), ["entrevista-martina-r"]);
  });
  test("eventos: próximos en orden y pasados con el cancelado", async () => {
    const up = (await get<EventSummary[]>("/events")).body;
    assert.deepEqual(up.map((e) => e.slug), ["jam-fin-de-ano-demo", "best-trick-verano-demo"]);
    const past = (await get<EventSummary[]>("/events?cuando=pasados")).body;
    assert.ok(past.some((e) => e.cancelled));
    assert.ok(!past.some((e) => up.some((u) => u.id === e.id)));
    const ev = (await get<{ spot: { slug: string } | null }>("/events/jam-fin-de-ano-demo")).body;
    assert.equal(ev.spot?.slug, "spot-demo-1");
  });
  test("portada con todas las secciones", async () => {
    const h = (await get<HomePayload>("/home")).body;
    assert.equal(h.hero.slug, "la-noche-es-de-los-que-ruedan");
    assert.equal(h.news.length, 6);
    assert.ok(h.news.every((n) => n.format === "NEWS"));
    assert.deepEqual(h.skaters.map((s) => s.slug), ["martina-r", "nico-f"]);
    assert.deepEqual(h.spots.map((s) => s.slug), ["spot-demo-1", "spot-demo-2", "spot-demo-3"]);
    assert.equal(h.street.length, 4);
    assert.ok(h.culture.length > 0 && h.events.length > 0);
    assert.match(h.quote.text, /cordones/);
  });
});

describe("seguridad", () => {
  test("encabezados de seguridad y caché", async () => {
    const r = await get("/home");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-powered-by"), null);
    assert.match(r.headers.get("cache-control") ?? "", /max-age=60/);
  });
  test("CORS solo para los orígenes configurados", async () => {
    const ok = await get("/home", { Origin: "https://skateculture.uy" });
    assert.equal(ok.headers.get("access-control-allow-origin"), "https://skateculture.uy");
    const bad = await get("/home", { Origin: "https://otro-sitio.com" });
    assert.equal(bad.headers.get("access-control-allow-origin"), null);
  });
  test("límite de pedidos por IP", async () => {
    const limited = createApp(db, { ...config, RATE_LIMIT_PER_MINUTE: 3 }).listen(0);
    await new Promise((r) => limited.once("listening", r));
    const u = `http://127.0.0.1:${(limited.address() as AddressInfo).port}/api/health`;
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await fetch(u)).status);
    await new Promise((r) => limited.close(r));
    assert.deepEqual(codes, [200, 200, 200, 429]);
  });
  test("un error interno no muestra detalles", async () => {
    const broken = createApp({ execute: () => Promise.reject(new Error("password=secreto")) } as never, config).listen(0);
    await new Promise((r) => broken.once("listening", r));
    const origError = console.error;
    console.error = () => {};
    const res = await fetch(`http://127.0.0.1:${(broken.address() as AddressInfo).port}/api/health`);
    console.error = origError;
    await new Promise((r) => broken.close(r));
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: "Error interno" });
  });
});

describe("carga y borrado del demo", () => {
  test("borrar el demo no toca el contenido real", async () => {
    const [cat] = await db.select().from(t.categories).where(eq(t.categories.slug, "street"));
    await db.insert(t.articles).values({ title: "Nota real", slug: "nota-real", format: "STORY", categoryId: cat.id, author: "Redacción", status: "PUBLISHED", publishedAt: new Date(NOW - 1000) });
    await deleteDemo(db);
    const left = await db.select({ slug: t.articles.slug }).from(t.articles);
    // "Cómo enviar material" viene en el demo pero es contenido real (isDemo: false).
    assert.deepEqual(left.map((a) => a.slug).sort(), ["como-enviar-material", "nota-real"]);
    assert.equal((await db.select().from(t.spots).where(eq(t.spots.isDemo, true))).length, 0);
    // Cargar el demo dos veces seguidas no falla ni duplica.
    await seedDemo(db, NOW);
    await seedDemo(db, NOW);
    assert.equal((await db.select().from(t.articles).where(eq(t.articles.slug, "como-enviar-material"))).length, 1);
    await db.delete(t.articles).where(eq(t.articles.slug, "nota-real"));
    assert.equal((await get("/articles/la-noche-es-de-los-que-ruedan")).status, 200);
  });
});
