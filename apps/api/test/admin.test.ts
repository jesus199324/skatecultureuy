/**
 * Tests del login y de la API del panel, contra un PostgreSQL real.
 * Uso: TEST_DATABASE_URL=postgresql://... npm test -w apps/api
 */
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { createApp, type AppConfig } from "../src/app";
import { hashPassword } from "../src/auth/passwords";
import { createDb } from "../src/db/client";
import * as t from "../src/db/schema";
import { seedDemo, truncateAll } from "../src/db/seed-demo";
import { runMigrations } from "../src/scripts/migrate";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Falta TEST_DATABASE_URL (una base de prueba que se puede vaciar).");

const { db, pool } = createDb(url);
const config: AppConfig = { CORS_ORIGIN: "http://localhost:5173", RATE_LIMIT_PER_MINUTE: 10_000, NODE_ENV: "test", SESSION_DAYS: 7, LOGIN_ATTEMPTS: 5 };
const PASSWORD = "una-clave-larga-123";
let base = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

/** Cliente con su propia cookie de sesión (como un navegador). */
class Client {
  cookie = "";
  constructor(private csrf = true) {}
  async req<T = any>(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...extra };
    if (this.cookie) headers.Cookie = this.cookie;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.csrf && method !== "GET") headers["X-SCUY-CSRF"] = "1";
    const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const text = await res.text();
    return { status: res.status, headers: res.headers, setCookie: set, body: (text ? JSON.parse(text) : null) as T };
  }
  login(email: string, password = PASSWORD) {
    return this.req("POST", "/auth/login", { email, password });
  }
}

async function makeUser(email: string, role: "ADMIN" | "EDITOR", active = true) {
  const [u] = await db.insert(t.staffUsers).values({ email, name: email.split("@")[0], role, active, passwordHash: await hashPassword(PASSWORD) }).returning();
  return u;
}

let admin: Client;
let editor: Client;
let photoId = "";

before(async () => {
  await runMigrations(db);
  await truncateAll(db);
  await db.delete(t.staffUsers);
  await seedDemo(db);
  await makeUser("admin@scuy.uy", "ADMIN");
  await makeUser("editor@scuy.uy", "EDITOR");
  await makeUser("baja@scuy.uy", "EDITOR", false);
  server = createApp(db, config).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  admin = new Client();
  editor = new Client();
  assert.equal((await admin.login("admin@scuy.uy")).status, 200);
  assert.equal((await editor.login("EDITOR@scuy.uy")).status, 200, "el email no distingue mayúsculas");
});

after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});

describe("login y sesiones", () => {
  test("login correcto: cookie httpOnly, SameSite y sin el hash en la respuesta", async () => {
    const c = new Client();
    const r = await c.login("admin@scuy.uy");
    assert.equal(r.status, 200);
    assert.match(r.setCookie!, /scuy_session=/);
    assert.match(r.setCookie!, /HttpOnly/i);
    assert.match(r.setCookie!, /SameSite=Lax/i);
    assert.deepEqual(Object.keys(r.body.user).sort(), ["email", "id", "name", "role"]);
    assert.equal((await c.req("GET", "/auth/me")).body.user.email, "admin@scuy.uy");
  });
  test("en la base se guarda el hash del token, no el token", async () => {
    const c = new Client();
    await c.login("admin@scuy.uy");
    const token = c.cookie.split("=")[1];
    const rows = await db.select().from(t.sessions);
    assert.ok(rows.length > 0);
    assert.ok(rows.every((s) => s.id !== token && s.id.length === 64));
  });
  test("contraseña mala, email inexistente y cuenta desactivada: mismo mensaje", async () => {
    const msgs = [];
    for (const [email, pass] of [["admin@scuy.uy", "mal-mal-mal-mal"], ["nadie@scuy.uy", PASSWORD], ["baja@scuy.uy", PASSWORD]]) {
      const r = await new Client().login(email, pass);
      assert.equal(r.status, 401);
      msgs.push(r.body.error);
    }
    assert.equal(new Set(msgs).size, 1);
  });
  test("sin sesión: 401 en el panel y en /me", async () => {
    const anon = new Client();
    assert.equal((await anon.req("GET", "/admin/articles")).status, 401);
    assert.equal((await anon.req("GET", "/auth/me")).status, 401);
    const fake = new Client();
    fake.cookie = "scuy_session=inventado";
    assert.equal((await fake.req("GET", "/admin/articles")).status, 401);
  });
  test("cerrar sesión invalida la cookie", async () => {
    const c = new Client();
    await c.login("editor@scuy.uy");
    const old = c.cookie;
    assert.equal((await c.req("POST", "/auth/logout")).status, 200);
    c.cookie = old;
    assert.equal((await c.req("GET", "/auth/me")).status, 401);
  });
  test("sesión vencida = 401", async () => {
    const c = new Client();
    await c.login("editor@scuy.uy");
    await db.update(t.sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await c.req("GET", "/auth/me")).status, 401);
    // Se vuelve a iniciar sesión para el resto de los tests.
    await admin.login("admin@scuy.uy");
    await editor.login("editor@scuy.uy");
  });
  test("límite de intentos de login fallidos", async () => {
    const app = createApp(db, { ...config, LOGIN_ATTEMPTS: 3 }).listen(0);
    await new Promise((r) => app.once("listening", r));
    const u = `http://127.0.0.1:${(app.address() as AddressInfo).port}/api/auth/login`;
    const codes = [];
    for (let i = 0; i < 4; i++) {
      codes.push((await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@scuy.uy", password: "mal-mal-mal-mal" }) })).status);
    }
    await new Promise((r) => app.close(r));
    assert.deepEqual(codes, [401, 401, 401, 429]);
  });
  test("acciones sin el encabezado anti-CSRF: 403", async () => {
    const c = new Client(false);
    c.cookie = admin.cookie;
    const r = await c.req("POST", "/admin/quotes", { text: "Hola mundo", attribution: "Test" });
    assert.equal(r.status, 403);
    assert.match(r.body.error, /X-SCUY-CSRF/);
  });
  test("CORS del panel: credenciales solo para orígenes de la revista", async () => {
    const pre = await fetch(`${base}/admin/articles`, { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "PATCH", "Access-Control-Request-Headers": "content-type,x-scuy-csrf" } });
    assert.equal(pre.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(pre.headers.get("access-control-allow-credentials"), "true");
    const bad = await fetch(`${base}/admin/articles`, { method: "OPTIONS", headers: { Origin: "https://malo.com", "Access-Control-Request-Method": "PATCH" } });
    assert.equal(bad.headers.get("access-control-allow-origin"), null);
  });
  test("las respuestas del panel no se cachean", async () => {
    assert.equal((await admin.req("GET", "/admin/articles")).headers.get("cache-control"), "no-store");
  });
});

describe("fotos", () => {
  test("registrar una foto exige texto alternativo y crédito", async () => {
    const bad = await admin.req("POST", "/admin/media", { publicId: "scuy/test/a", width: 1600, height: 1000 });
    assert.equal(bad.status, 400);
    assert.deepEqual(bad.body.detalles.map((d: { campo: string }) => d.campo).sort(), ["altText", "credit"]);
    const ok = await admin.req("POST", "/admin/media", { publicId: "scuy/test/a", width: 1600, height: 1000, altText: "Skater en una baranda", credit: "Foto de prueba" });
    assert.equal(ok.status, 201);
    photoId = ok.body.id;
  });
});

describe("notas", () => {
  let id = "";
  test("crear borrador: slug automático y minutos de lectura calculados", async () => {
    const r = await editor.req("POST", "/admin/articles", {
      title: "Sesión de prueba en la Rambla",
      format: "STORY",
      category: "street",
      author: "Redacción",
      coverImageId: photoId,
      body: [
        { type: "paragraph", text: "palabra ".repeat(450) },
        { type: "image", imageId: photoId, caption: "Pie de foto" },
        { type: "quote", text: "Una cita" },
      ],
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    id = r.body.id;
    assert.equal(r.body.slug, "sesion-de-prueba-en-la-rambla");
    assert.equal(r.body.status, "DRAFT");
    assert.equal(r.body.visibility, "DRAFT");
    assert.equal(r.body.readMinutes, 2);
    assert.equal(r.body.body[1].imageId, photoId);
    assert.equal(r.body.body[2].attribution, null);
  });
  test("un borrador no sale en la API pública", async () => {
    assert.equal((await fetch(`${base}/articles/sesion-de-prueba-en-la-rambla`)).status, 404);
  });
  test("publicar sin fecha: se publica ahora y aparece en la API pública", async () => {
    const r = await editor.req("PATCH", `/admin/articles/${id}`, { status: "PUBLISHED" });
    assert.equal(r.status, 200);
    assert.equal(r.body.visibility, "PUBLISHED");
    assert.ok(r.body.publishedAt);
    const pub = await fetch(`${base}/articles/sesion-de-prueba-en-la-rambla`);
    assert.equal(pub.status, 200);
    const body = await pub.json();
    assert.equal(body.body[1].image.altText, "Skater en una baranda");
  });
  test("programar para mañana: deja de verse hasta esa fecha", async () => {
    const r = await editor.req("PATCH", `/admin/articles/${id}`, { publishedAt: new Date(Date.now() + 86_400_000).toISOString() });
    assert.equal(r.body.visibility, "SCHEDULED");
    assert.equal((await fetch(`${base}/articles/sesion-de-prueba-en-la-rambla`)).status, 404);
  });
  test("editar solo un campo no cambia los demás", async () => {
    const before = (await editor.req("GET", `/admin/articles/${id}`)).body;
    const r = await editor.req("PATCH", `/admin/articles/${id}`, { excerpt: "Bajada nueva" });
    assert.equal(r.body.excerpt, "Bajada nueva");
    for (const k of ["title", "slug", "status", "publishedAt", "coverImageId", "featured", "format"]) assert.deepEqual(r.body[k], before[k], k);
    assert.equal(r.body.body.length, 3);
  });
  test("cambiar el texto alternativo de una foto actualiza las notas que la usan", async () => {
    await admin.req("PATCH", `/admin/media/${photoId}`, { altText: "Skater haciendo un boardslide" });
    const a = (await editor.req("GET", `/admin/articles/${id}`)).body;
    assert.equal(a.body[1].image.altText, "Skater haciendo un boardslide");
  });
  test("una foto en uso no se puede borrar", async () => {
    const r = await admin.req("DELETE", `/admin/media/${photoId}`);
    assert.equal(r.status, 409);
  });
  test("reglas: noticia sin tema, video sin link, link inválido", async () => {
    const base = { title: "Prueba de reglas", category: "news", author: "R" };
    const noTopic = await editor.req("POST", "/admin/articles", { ...base, format: "NEWS" });
    assert.equal(noTopic.status, 400);
    assert.equal(noTopic.body.detalles[0].campo, "newsTopic");
    const noVideo = await editor.req("POST", "/admin/articles", { ...base, category: "street", format: "VIDEO" });
    assert.equal(noVideo.body.detalles[0].campo, "videoUrl");
    const badLink = await editor.req("POST", "/admin/articles", { ...base, category: "street", format: "VIDEO", videoUrl: "https://ejemplo.com/video" });
    assert.match(badLink.body.detalles[0].error, /YouTube o Vimeo/);
    const topicOnStory = await editor.req("PATCH", `/admin/articles/${id}`, { newsTopic: "INDUSTRIA" });
    assert.equal(topicOnStory.status, 400);
  });
  test("nota de video con link de YouTube", async () => {
    const r = await editor.req("POST", "/admin/articles", { title: "Parte de prueba", category: "street", author: "R", format: "VIDEO", videoUrl: "https://youtu.be/dQw4w9WgXcQ", status: "PUBLISHED" });
    assert.equal(r.status, 201);
    assert.equal(r.body.videoUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    const pub = await (await fetch(`${base}/articles/${r.body.slug}`)).json();
    assert.deepEqual(pub.video, { provider: "YOUTUBE", videoId: "dQw4w9WgXcQ", title: "Parte de prueba" });
  });
  test("slug repetido = 409; foto, skater o sección inexistentes = 400", async () => {
    const dup = await editor.req("POST", "/admin/articles", { title: "Otra", slug: "sesion-de-prueba-en-la-rambla", format: "STORY", category: "street", author: "R" });
    assert.equal(dup.status, 409);
    const ghost = "00000000-0000-4000-8000-000000000000";
    assert.equal((await editor.req("POST", "/admin/articles", { title: "Otra", format: "STORY", category: "street", author: "R", coverImageId: ghost })).status, 400);
    assert.equal((await editor.req("POST", "/admin/articles", { title: "Otra", format: "STORY", category: "street", author: "R", skaterIds: [ghost] })).status, 400);
    assert.equal((await editor.req("POST", "/admin/articles", { title: "Otra", format: "STORY", category: "nada", author: "R" })).status, 400);
  });
  test("campos desconocidos y JSON roto = 400", async () => {
    assert.equal((await editor.req("POST", "/admin/articles", { title: "Otra", format: "STORY", category: "street", author: "R", isDemo: true })).status, 400);
    const res = await fetch(`${base}/admin/articles`, { method: "POST", headers: { Cookie: editor.cookie, "X-SCUY-CSRF": "1", "Content-Type": "application/json" }, body: "{roto" });
    assert.equal(res.status, 400);
  });
  test("listado del panel: incluye borradores, busca sin tildes y filtra por estado", async () => {
    await editor.req("POST", "/admin/articles", { title: "Borrador en Paysandú", format: "STORY", category: "culture", author: "R" });
    const r = await editor.req("GET", "/admin/articles?q=paysandu");
    assert.deepEqual(r.body.items.map((a: { title: string }) => a.title), ["Borrador en Paysandú"]);
    const drafts = await editor.req("GET", "/admin/articles?estado=DRAFT");
    assert.ok(drafts.body.items.every((a: { status: string }) => a.status === "DRAFT"));
    assert.ok(!("body" in drafts.body.items[0]), "el listado no trae el cuerpo completo");
  });
  test("borrar", async () => {
    assert.equal((await editor.req("DELETE", `/admin/articles/${id}`)).status, 204);
    assert.equal((await editor.req("GET", `/admin/articles/${id}`)).status, 404);
    assert.equal((await admin.req("DELETE", `/admin/media/${photoId}`)).status, 204, "ya no está en uso");
  });
});

describe("spots, skaters, eventos y citas", () => {
  test("spot de calle: se guarda la dirección, el panel avisa y el público no la ve", async () => {
    const r = await editor.req("POST", "/admin/spots", { name: "Escalinata de prueba", type: "STREET", department: "MONTEVIDEO", locality: "Cordón", address: "Calle 123", lat: -34.9, lng: -56.17, features: ["STAIRS"], status: "PUBLISHED" });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.address, "Calle 123");
    assert.equal(r.body.publicLocation, "AREA");
    assert.match(r.body.locationNote, /no se publican/);
    const pub = await (await fetch(`${base}/spots/${r.body.slug}`)).json();
    assert.equal(pub.address, null);
    assert.equal(pub.coordinates, null);
  });
  test("coordenadas fuera de Uruguay o sin pareja = 400", async () => {
    const b = { name: "Fuera", type: "SKATEPARK", department: "SALTO", locality: "X" };
    assert.equal((await editor.req("POST", "/admin/spots", { ...b, lat: 40.4, lng: -3.7 })).status, 400);
    assert.equal((await editor.req("POST", "/admin/spots", { ...b, lat: -34.9 })).status, 400);
  });
  test("skater: crear, Instagram con @ y slug", async () => {
    const r = await editor.req("POST", "/admin/skaters", { name: "Skater De Prueba", city: "Rocha", instagram: "@skater.prueba" });
    assert.equal(r.status, 201);
    assert.equal(r.body.instagram, "skater.prueba");
    assert.equal(r.body.slug, "skater-de-prueba");
    const p = await editor.req("PATCH", `/admin/skaters/${r.body.id}`, { status: "PUBLISHED" });
    assert.equal(p.body.city, "Rocha");
    assert.equal((await fetch(`${base}/skaters/skater-de-prueba`)).status, 200);
  });
  test("evento: no puede terminar antes de empezar y el link tiene que ser https", async () => {
    const b = { name: "Jam de prueba", location: "Plaza X", eventDate: "2027-03-01T18:00:00Z" };
    assert.equal((await editor.req("POST", "/admin/events", { ...b, endDate: "2027-02-01T18:00:00Z" })).status, 400);
    assert.equal((await editor.req("POST", "/admin/events", { ...b, externalUrl: "http://inseguro.com" })).status, 400);
    const ok = await editor.req("POST", "/admin/events", { ...b, status: "PUBLISHED" });
    assert.equal(ok.status, 201);
    const up = await (await fetch(`${base}/events`)).json();
    assert.ok(up.some((e: { slug: string }) => e.slug === "jam-de-prueba"));
    const cancel = await editor.req("PATCH", `/admin/events/${ok.body.id}`, { cancelled: true });
    assert.equal(cancel.body.cancelled, true);
    assert.equal(cancel.body.location, "Plaza X");
  });
  test("citas y categorías", async () => {
    const q = await editor.req("POST", "/admin/quotes", { text: "Cita de prueba para la portada", attribution: "Alguien" });
    assert.equal(q.status, 201);
    assert.equal(q.body.active, true);
    const cats = await editor.req("GET", "/admin/categories");
    assert.ok(cats.body.some((c: { slug: string }) => c.slug === "street"));
  });
});

describe("cuentas (solo admin)", () => {
  test("un editor no puede ver ni crear cuentas", async () => {
    assert.equal((await editor.req("GET", "/admin/staff")).status, 403);
    assert.equal((await editor.req("POST", "/admin/staff", { email: "x@x.uy", name: "X", password: PASSWORD })).status, 403);
  });
  test("el admin crea una cuenta; la lista no muestra contraseñas", async () => {
    const r = await admin.req("POST", "/admin/staff", { email: "Nueva@SCUY.uy", name: "Nueva", password: PASSWORD });
    assert.equal(r.status, 201);
    assert.equal(r.body.email, "nueva@scuy.uy");
    assert.equal(r.body.role, "EDITOR");
    const list = await admin.req("GET", "/admin/staff");
    assert.ok(!JSON.stringify(list.body).includes("password"));
    assert.equal((await admin.req("POST", "/admin/staff", { email: "nueva@scuy.uy", name: "Otra", password: PASSWORD })).status, 409);
    assert.equal((await admin.req("POST", "/admin/staff", { email: "corta@scuy.uy", name: "Corta", password: "123" })).status, 400);
  });
  test("cambiar la contraseña o desactivar una cuenta cierra sus sesiones", async () => {
    const [u] = await db.select().from(t.staffUsers).where(eq(t.staffUsers.email, "nueva@scuy.uy"));
    const c = new Client();
    assert.equal((await c.login("nueva@scuy.uy")).status, 200);
    await admin.req("PATCH", `/admin/staff/${u.id}`, { password: "otra-clave-larga-456" });
    assert.equal((await c.req("GET", "/auth/me")).status, 401);
    assert.equal((await c.login("nueva@scuy.uy", "otra-clave-larga-456")).status, 200);
    await admin.req("PATCH", `/admin/staff/${u.id}`, { active: false });
    assert.equal((await c.req("GET", "/auth/me")).status, 401);
  });
  test("un admin no se puede desactivar ni sacarse el rol; siempre queda un admin", async () => {
    const [me] = await db.select().from(t.staffUsers).where(eq(t.staffUsers.email, "admin@scuy.uy"));
    assert.equal((await admin.req("PATCH", `/admin/staff/${me.id}`, { active: false })).status, 400);
    assert.equal((await admin.req("PATCH", `/admin/staff/${me.id}`, { role: "EDITOR" })).status, 400);
  });
});

describe("índice de la API", () => {
  test("/api lista los endpoints", async () => {
    const r = await (await fetch(base)).json();
    assert.ok(r.publico.includes("GET /api/home"));
  });
});
