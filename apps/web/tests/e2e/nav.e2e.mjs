/**
 * Fase 3: navegación entre páginas, filtros en la URL, "Cargar más",
 * páginas de detalle, 404 y metadatos. Lo ejecuta tests/e2e/run.mjs.
 */
import path from "node:path";
import assert from "node:assert/strict";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const PAGES = [
  "/news", "/street", "/culture", "/stories", "/stories/la-noche-es-de-los-que-ruedan", "/stories/entrevista-martina-r",
  "/stories/domingo-de-bowl", "/stories/parte-nico-f", "/skaters", "/skaters/martina-r", "/spots", "/spots/spot-demo-1",
  "/spots/spot-demo-2", "/events", "/events?cuando=pasados", "/events/jam-fin-de-ano-demo", "/events/campeonato-invierno-demo",
  "/about", "/no-existe",
];

export async function navSuite({ browser, baseUrl, shots, check }) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/fonts\.g|ERR_|Failed to load resource|status of 404/.test(m.text())) errors.push(`${page.url()}: ${m.text()}`);
    });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const go = async (p) => {
      const res = await page.goto(baseUrl + p, { waitUntil: "load" });
      await page.waitForSelector("html[data-hydrated]");
      return res;
    };
    const P = `[nav ${vp.name}]`;
    const cards = () => page.locator("section[aria-label=Publicaciones] article").count();

    await check(`${P} el menú navega sin recargar y marca la sección activa`, async () => {
      await go("/");
      await page.evaluate(() => { window.__sinRecargar = true; });
      if (vp.name === "mobile") {
        await page.getByRole("button", { name: "Abrir menú" }).click();
        await page.locator("#menu-movil").getByRole("link", { name: "SPOTS" }).click();
      } else {
        await page.getByRole("navigation", { name: "Secciones", exact: true }).getByRole("link", { name: "SPOTS" }).click();
      }
      await page.waitForURL(`${baseUrl}/spots`);
      await page.locator("h1", { hasText: "SPOTS" }).waitFor();
      assert.equal(await page.evaluate(() => window.__sinRecargar), true, "la página se recargó");
      assert.equal(await page.locator("#menu-movil").count(), 0, "el menú quedó abierto");
      if (vp.name === "desktop") {
        const link = page.getByRole("navigation", { name: "Secciones", exact: true }).getByRole("link", { name: "SPOTS" });
        assert.equal(await link.getAttribute("aria-current"), "page");
      }
    });

    await check(`${P} noticias: el filtro por tema queda en la URL`, async () => {
      await go("/news");
      await page.getByRole("navigation", { name: "Filtrar noticias por tema" }).getByRole("link", { name: "Competencias" }).click();
      await page.waitForURL(/tema=competencias/);
      const text = await page.locator("section[aria-label=Publicaciones]").innerText();
      assert.match(text, /Jam de fin de año: abren las inscripciones/);
      assert.doesNotMatch(text, /convocatoria para fotógrafos/);
      await page.getByRole("navigation", { name: "Filtrar noticias por tema" }).getByRole("link", { name: "Todas" }).click();
      await page.waitForURL((u) => !u.search.includes("tema"));
      assert.match(await page.locator("section[aria-label=Publicaciones]").innerText(), /convocatoria para fotógrafos/);
    });

    await check(`${P} historias: "Cargar más" suma la siguiente tanda sin volver arriba`, async () => {
      await go("/stories");
      assert.equal(await cards(), 9);
      const more = page.getByRole("link", { name: /Cargar más/ });
      await more.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => window.scrollY);
      await more.click();
      await page.waitForURL(/pagina=2/);
      await page.waitForFunction(() => document.querySelectorAll("section[aria-label=Publicaciones] article").length > 9);
      const after = await page.evaluate(() => window.scrollY);
      assert.ok(after > 0 && Math.abs(after - before) < 400, `scroll antes ${before}, después ${after}`);
      const n = await cards();
      assert.match(await page.getByText(/Mostrando \d+ de \d+/).innerText(), new RegExp(`Mostrando ${n} de`, "i"));
    });

    await check(`${P} street: filtro Videos y link a la nota`, async () => {
      await go("/street");
      await page.getByRole("navigation", { name: "Filtrar por tipo de publicación" }).getByRole("link", { name: "Videos" }).click();
      await page.waitForURL(/formato=videos/);
      const text = await page.locator("section[aria-label=Publicaciones]").innerText();
      assert.match(text, /Parte completo: Nico F\./);
      assert.doesNotMatch(text, /Una plaza, tres generaciones/);
      await page.getByRole("link", { name: "Ver video: Parte completo: Nico F." }).click();
      await page.waitForURL(/\/stories\/parte-nico-f$/);
      assert.equal(await page.getByRole("button", { name: /Video de demostración/ }).isDisabled(), true);
    });

    await check(`${P} nota: título, compartir, relacionadas y volver`, async () => {
      await go("/stories/la-noche-es-de-los-que-ruedan");
      assert.match(await page.locator("h1").innerText(), /LA NOCHE ES DE LOS QUE RUEDAN/i);
      const wa = await page.locator("a[href^='https://wa.me/']").first().getAttribute("href");
      assert.ok(wa.includes(encodeURIComponent("/stories/la-noche-es-de-los-que-ruedan")), wa);
      assert.equal(await page.locator("#relacionadas").count(), 1);
      await page.getByRole("link", { name: "← Street" }).click();
      await page.waitForURL(`${baseUrl}/street`);
    });

    await check(`${P} entrevista: preguntas y link al perfil del skater`, async () => {
      await go("/stories/entrevista-martina-r");
      assert.match(await page.locator("article").first().innerText(), /¿Cómo empezaste a patinar\?/);
      await page.getByRole("complementary", { name: "En esta nota" }).getByRole("link", { name: /Martina R\./ }).click();
      await page.waitForURL(/\/skaters\/martina-r$/);
      assert.match(await page.locator("#skater-notas ~ *").first().innerText(), /El skate me enseñó a mirar la ciudad/);
    });

    await check(`${P} galería: 8 fotos con texto alternativo`, async () => {
      await go("/stories/domingo-de-bowl");
      const g = page.getByRole("region", { name: /Galería de 8 fotos/ });
      assert.equal(await g.locator("li").count(), 8);
    });

    await check(`${P} spots: filtros por tipo y departamento`, async () => {
      await go("/spots");
      await page.getByRole("navigation", { name: "Filtrar spots por tipo" }).getByRole("link", { name: "Calle" }).click();
      await page.waitForURL(/tipo=calle/);
      await page.getByRole("navigation", { name: "Filtrar spots por departamento" }).getByRole("link", { name: "Montevideo" }).click();
      await page.waitForURL(/depto=montevideo/);
      assert.ok(page.url().includes("tipo=calle"), "se perdió el filtro de tipo");
      const items = page.locator("section[aria-label=Spots] li");
      assert.equal(await items.count(), 1);
      assert.match(await items.first().innerText(), /Calle · Montevideo/i);
    });

    await check(`${P} spot de calle: solo barrio y departamento, sin dirección ni "cómo llegar"`, async () => {
      await go("/spots/spot-demo-2");
      const loc = await page.locator("#spot-ubicacion ~ *").first().innerText();
      assert.match(loc, /no publicamos la dirección exacta/);
      assert.equal(await page.getByRole("link", { name: /Cómo llegar/ }).count(), 0);
    });

    await check(`${P} skatepark demo: sin dirección inventada`, async () => {
      await go("/spots/spot-demo-1");
      assert.match(await page.locator("#spot-ubicacion ~ *").first().innerText(), /no tiene dirección real/);
      assert.equal(await page.getByRole("link", { name: /Cómo llegar/ }).count(), 0);
    });

    await check(`${P} eventos: próximos, pasados y cancelado`, async () => {
      await go("/events");
      const up = await page.locator("section[aria-label='Próximos eventos']").innerText();
      assert.match(up, /Jam de fin de año/i);
      assert.doesNotMatch(up, /Campeonato de invierno/i);
      await page.getByRole("link", { name: "Pasados" }).click();
      await page.waitForURL(/cuando=pasados/);
      const past = await page.locator("section[aria-label='Eventos pasados']").innerText();
      assert.match(past, /CANCELADO/);
      await page.getByRole("link", { name: /Campeonato de invierno/ }).click();
      await page.waitForURL(/campeonato-invierno-demo/);
      await page.getByText("Este evento se canceló").waitFor();
    });

    await check(`${P} about: anclas de enviar material, colaborar y contacto`, async () => {
      await go("/about#enviar");
      for (const id of ["enviar", "colaborar", "contacto"]) assert.equal(await page.locator(`#${id}`).count(), 1, id);
    });

    await check(`${P} 404: responde 404 y ofrece volver`, async () => {
      const res = await go("/no-existe");
      assert.equal(res.status(), 404);
      assert.match(await page.locator("h1").innerText(), /SPOT\s*QUEMADO/);
      assert.equal(await page.title(), "Página no encontrada | SKATE CULTURE UY");
      assert.equal((await go("/stories/no-existe")).status(), 404);
      await page.getByRole("link", { name: "Volver a la portada" }).click();
      await page.waitForURL(`${baseUrl}/`);
    });

    if (vp.name === "desktop") {
      await check(`${P} metadatos para compartir (Open Graph) y canónica`, async () => {
        await go("/skaters/martina-r");
        const og = (p) => page.locator(`meta[property="${p}"]`).getAttribute("content");
        assert.equal(await og("og:title"), "Martina R. — Montevideo");
        assert.match(await og("og:url"), /\/skaters\/martina-r$/);
        assert.match(await og("og:image"), /^https?:\/\//);
        assert.match(await page.locator("link[rel=canonical]").getAttribute("href"), /\/skaters\/martina-r$/);
        assert.equal(await page.title(), "Martina R. — Montevideo | SKATE CULTURE UY");
      });
    }

    await check(`${P} todas las páginas: sin scroll horizontal, con alt y área táctil ≥ 44px`, async () => {
      for (const p of PAGES) {
        await go(p);
        const r = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          noAlt: [...document.querySelectorAll("img:not([alt]), [role=img]:not([aria-label])")].length,
          small: [...document.querySelectorAll("main button, main nav a")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).length,
          h1: document.querySelectorAll("h1").length,
          // Títulos que se salen de su caja (palabras largas en el celular).
          clipped: [...document.querySelectorAll("h1, h2")].filter((h) => h.scrollWidth > h.clientWidth + 1).map((h) => h.textContent.slice(0, 30)),
        }));
        assert.ok(r.overflow <= 0, `${p} desborda ${r.overflow}px`);
        assert.equal(r.noAlt, 0, `${p} sin alt`);
        assert.equal(r.small, 0, `${p} con botones chicos`);
        assert.equal(r.h1, 1, `${p} tiene ${r.h1} h1`);
        assert.deepEqual(r.clipped, [], `${p} títulos cortados`);
      }
    });

    // Capturas para revisar el diseño.
    for (const [name, p] of [["noticias", "/news"], ["street", "/street"], ["nota", "/stories/la-noche-es-de-los-que-ruedan"], ["entrevista", "/stories/entrevista-martina-r"], ["skater", "/skaters/martina-r"], ["spots", "/spots"], ["spot-calle", "/spots/spot-demo-2"], ["eventos", "/events"], ["about", "/about"], ["404", "/no-existe"]]) {
      await go(p);
      await page.screenshot({ path: path.join(shots, `${vp.name}-${name}.png`), fullPage: true, animations: "disabled" });
    }

    await check(`${P} sin errores de JavaScript ni de hidratación`, async () => assert.deepEqual(errors, []));
    await ctx.close();
  }

  // Sin JavaScript: los filtros y "Cargar más" funcionan como links comunes.
  await check("[nav sin JS] filtros y Cargar más funcionan sin JavaScript", async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(`${baseUrl}/stories`);
    await page.getByRole("link", { name: /Cargar más/ }).click();
    await page.waitForURL(/pagina=2/);
    assert.ok((await page.locator("section[aria-label=Publicaciones] article").count()) > 9);
    await page.goto(`${baseUrl}/spots?tipo=diy`);
    assert.ok((await page.locator("section[aria-label=Spots] li").count()) >= 1);
    await ctx.close();
  });
}
