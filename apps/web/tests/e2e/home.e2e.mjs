/**
 * Prueba de flujos reales de la portada en Chromium (Playwright).
 * Uso: node tests/e2e/home.e2e.mjs [carpeta-dist] [carpeta-capturas]
 */
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const dist = path.resolve(process.argv[2] ?? "dist");
const shots = path.resolve(process.argv[3] ?? "tests/e2e/screenshots");
fs.mkdirSync(shots, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const file = path.join(dist, req.url === "/" ? "index.html" : req.url.split("?")[0]);
  if (!file.startsWith(dist) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }).end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(["✓", name]); } catch (e) { results.push(["✗", name, e.message.split("\n")[0]]); }
};

for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text()) && !/ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url, { waitUntil: "load" });
  const P = `[${vp.name}]`;

  await check(`${P} renderiza todas las secciones`, async () => {
    for (const id of ["noticias", "ultimas", "street", "skaters", "spots", "culture", "events", "about"]) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `falta #${id}`);
    }
    assert.match(await page.locator("h1").innerText(), /LA NOCHE ES DE LOS QUE RUEDAN/i);
  });

  await check(`${P} sin scroll horizontal`, async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `desborda ${overflow}px`);
  });

  await check(`${P} filtro de noticias: Competencias deja solo esa categoría`, async () => {
    const section = page.locator("section[aria-labelledby=noticias]");
    await section.getByRole("button", { name: "Competencias" }).click();
    assert.equal(await section.getByRole("button", { name: "Competencias" }).getAttribute("aria-pressed"), "true");
    const text = await section.innerText();
    assert.match(text, /Jam de fin de año: abren las inscripciones/);
    assert.doesNotMatch(text, /convocatoria para fotógrafos/);
    await section.getByRole("button", { name: "Industria" }).click();
    assert.match(await section.innerText(), /marca local de demostración/);
    await section.getByRole("button", { name: "Todas" }).click();
  });

  await check(`${P} filtro de Street: Videos muestra el parte de video`, async () => {
    const section = page.locator("section[aria-labelledby=street]");
    await section.getByRole("button", { name: "Videos" }).click();
    const t = await section.innerText();
    assert.match(t, /Parte completo: Nico F\./i);
    assert.doesNotMatch(t, /Una plaza, tres generaciones/i);
    await section.getByRole("button", { name: "Fotos" }).click();
    assert.match(await section.innerText(), /Una plaza, tres generaciones/i);
  });

  await check(`${P} compartir: link de WhatsApp correcto y copiar link`, async () => {
    const wa = page.locator("section[aria-labelledby=noticias] a[href^='https://wa.me/']").first();
    const href = await wa.getAttribute("href");
    assert.ok(href.includes(encodeURIComponent("/stories/convocatoria-fotografos")), href);
    await page.locator("section[aria-labelledby=noticias]").getByRole("button", { name: "Link" }).click();
    await page.getByText("Link copiado").waitFor({ timeout: 2000 });
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(clip, /\/stories\/convocatoria-fotografos$/);
  });

  await check(`${P} eventos con fecha en hora de Montevideo`, async () => {
    const t = await page.locator("section[aria-labelledby=events]").innerText();
    assert.match(t, /14\s+DIC 2026/);
    assert.match(t, /15:00 h/);
  });

  await check(`${P} todas las imágenes/placeholder tienen texto alternativo`, async () => {
    const missing = await page.evaluate(() => [...document.querySelectorAll("img:not([alt]), [role=img]:not([aria-label])")].length);
    assert.equal(missing, 0);
  });

  await check(`${P} botones y links con área táctil ≥ 44px en filtros y menú`, async () => {
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("button")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).length);
    assert.equal(small, 0);
  });

  if (vp.name === "mobile") {
    await check(`${P} menú de tres tablas: abre, cierra con Escape y devuelve el foco`, async () => {
      const btn = page.getByRole("button", { name: "Abrir menú" });
      await btn.click();
      assert.equal(await page.getByRole("button", { name: "Cerrar menú" }).getAttribute("aria-expanded"), "true");
      const menu = page.locator("#menu-movil");
      await menu.waitFor();
      assert.match(await menu.innerText(), /NOTICIAS[\s\S]*ABOUT/);
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), "NOTICIAS");
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      await page.screenshot({ path: path.join(shots, "mobile-menu-abierto.png") });
      await page.keyboard.press("Escape");
      assert.equal(await menu.count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Abrir menú");
    });
  } else {
    await check(`${P} navegación completa visible y menú oculto`, async () => {
      assert.equal(await page.getByRole("navigation", { name: "Secciones", exact: true }).isVisible(), true);
      assert.equal(await page.getByRole("button", { name: "Abrir menú" }).isVisible(), false);
    });
  }

  await check(`${P} crédito del autor en el pie`, async () => {
    const credit = page.locator("footer").getByRole("link", { name: "Jesús Albornoz" });
    assert.equal(await credit.getAttribute("href"), "https://micv-brown.vercel.app/");
  });

  await check(`${P} sin errores de JavaScript`, async () => assert.deepEqual(errors, []));

  // Captura de página completa (con todo revelado).
  await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-reveal", "in")));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, `${vp.name}-portada.png`), fullPage: true, animations: "disabled" });
  await ctx.close();
}

await browser.close();
server.close();
for (const r of results) console.log(r.join("  "));
const failed = results.filter((r) => r[0] === "✗").length;
console.log(`\n${results.length - failed}/${results.length} pruebas OK`);
process.exit(failed ? 1 : 0);
