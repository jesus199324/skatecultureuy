import { describe, expect, test } from "bun:test";
import { PAGE_SIZE, publicLocationPrecision } from "../../../../packages/shared/src";
import {
  DEPARTMENT_PARAM, FORMAT_PARAM, TOPIC_PARAM, fromParam, getArticle, getSpot, listArticles, listEvents, listSkaters, listSpots,
  paginate, parsePage, slugify,
} from "../../app/lib/content";
import { buildDemoDb } from "../../app/lib/demo-content";
import { buildMeta, clip, jsonLd } from "../../app/lib/seo";

const NOW = new Date("2026-11-20T15:00:00Z").getTime();

describe("parámetros de URL", () => {
  test("slugify quita tildes y espacios", () => {
    expect(slugify("Paysandú")).toBe("paysandu");
    expect(slugify("Treinta y Tres")).toBe("treinta-y-tres");
    expect(DEPARTMENT_PARAM.CERRO_LARGO).toBe("cerro-largo");
  });
  test("fromParam traduce el valor de la URL y descarta valores inválidos", () => {
    expect(fromParam(TOPIC_PARAM, "competencias")).toBe("COMPETENCIAS");
    expect(fromParam(FORMAT_PARAM, "videos")).toBe("VIDEO");
    expect(fromParam(TOPIC_PARAM, "cualquier-cosa")).toBeNull();
    expect(fromParam(TOPIC_PARAM, null)).toBeNull();
  });
  test.each([["2", 2], [null, 1], ["0", 1], ["-3", 1], ["1.5", 1], ["abc", 1], ["999", 1]])("parsePage(%p) = %p", (v, n) => {
    expect(parsePage(v as string | null)).toBe(n);
  });
});

describe("Cargar más", () => {
  const all = Array.from({ length: 20 }, (_, i) => i);
  test("acumula tandas y avisa si hay más", () => {
    expect(paginate(all, 1, 9)).toMatchObject({ items: all.slice(0, 9), total: 20, hasMore: true });
    expect(paginate(all, 2, 9).items).toHaveLength(18);
    expect(paginate(all, 3, 9)).toMatchObject({ hasMore: false, total: 20 });
    expect(paginate(all, 3, 9).items).toHaveLength(20);
  });
  test("las historias tienen más de una tanda y la segunda trae más", async () => {
    const p1 = await listArticles({ section: "stories", page: 1 }, NOW);
    const p2 = await listArticles({ section: "stories", page: 2 }, NOW);
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p1.hasMore).toBe(true);
    expect(p2.items.length).toBeGreaterThan(PAGE_SIZE);
    expect(p2.items.slice(0, PAGE_SIZE)).toEqual(p1.items);
  });
});

describe("listados", () => {
  test("noticias filtradas por tema", async () => {
    const p = await listArticles({ section: "news", topic: "COMPETENCIAS" }, NOW);
    expect(p.items.length).toBeGreaterThan(0);
    expect(p.items.every((a) => a.newsTopic === "COMPETENCIAS")).toBe(true);
  });
  test("historias no incluye noticias y está ordenado de más nueva a más vieja", async () => {
    const p = await listArticles({ section: "stories", page: 5 }, NOW);
    expect(p.items.some((a) => a.format === "NEWS")).toBe(false);
    const t = p.items.map((a) => Date.parse(a.publishedAt));
    expect([...t].sort((a, b) => b - a)).toEqual(t);
  });
  test("street filtrado por video", async () => {
    const p = await listArticles({ section: "street", format: "VIDEO" }, NOW);
    expect(p.items.every((a) => a.format === "VIDEO" && a.category.slug === "street")).toBe(true);
  });
  test("spots por departamento y tipo; el filtro solo ofrece departamentos con spots", async () => {
    const p = await listSpots({ department: "MONTEVIDEO", type: "STREET" }, NOW);
    expect(p.items.every((s) => s.department === "MONTEVIDEO" && s.type === "STREET")).toBe(true);
    const all = await listSpots({}, NOW);
    expect(all.departments).toContain("MONTEVIDEO");
    expect(all.departments).not.toContain("ARTIGAS");
  });
  test("eventos: próximos del más cercano al más lejano; pasados incluye cancelados", async () => {
    const up = await listEvents("proximos", NOW);
    expect(up.map((e) => e.slug)).toEqual(["jam-fin-de-ano-demo", "best-trick-verano-demo"]);
    const past = await listEvents("pasados", NOW);
    expect(past.some((e) => e.cancelled)).toBe(true);
    expect(past.some((e) => up.some((u) => u.id === e.id))).toBe(false);
  });
  test("skaters", async () => {
    const p = await listSkaters(1, NOW);
    expect(p.items.length).toBe(6);
    expect(p.hasMore).toBe(false);
  });
});

describe("detalle", () => {
  test("nota inexistente = null (la página responde 404)", async () => {
    expect(await getArticle("no-existe", NOW)).toBeNull();
    expect(await getSpot("no-existe", NOW)).toBeNull();
  });
  test("cada formato tiene su contenido", async () => {
    expect((await getArticle("entrevista-martina-r", NOW))!.body.some((b) => b.type === "qa")).toBe(true);
    expect((await getArticle("domingo-de-bowl", NOW))!.gallery).toHaveLength(8);
    expect((await getArticle("parte-nico-f", NOW))!.video).toMatchObject({ provider: "YOUTUBE", videoId: null });
  });
  test("relaciones entre notas, skaters y spots", async () => {
    const a = (await getArticle("entrevista-martina-r", NOW))!;
    expect(a.skaters.map((s) => s.slug)).toEqual(["martina-r"]);
    expect(a.related.every((r) => r.slug !== a.slug)).toBe(true);
  });
});

describe("ubicación de los spots (regla de la Fase 3)", () => {
  test("solo los skateparks se publican con ubicación exacta", () => {
    expect(publicLocationPrecision("SKATEPARK")).toBe("EXACT");
    expect(publicLocationPrecision("STREET")).toBe("AREA");
    expect(publicLocationPrecision("DIY")).toBe("AREA");
  });
  test("los spots demo no tienen dirección ni coordenadas, y todo es demo", () => {
    const db = buildDemoDb(NOW);
    for (const s of db.spots) {
      expect(s.address).toBeNull();
      expect(s.coordinates).toBeNull();
      expect(s.locationPrecision).toBe(publicLocationPrecision(s.type));
      expect(s.isDemo).toBe(true);
    }
    const fictional = db.articles.filter((a) => a.slug !== "como-enviar-material");
    expect(fictional.every((a) => a.isDemo)).toBe(true);
    expect([...db.skaters, ...db.events].every((x) => x.isDemo)).toBe(true);
  });
  test("slugs únicos en toda la base demo", () => {
    const db = buildDemoDb(NOW);
    for (const list of [db.articles, db.skaters, db.spots, db.events]) {
      const slugs = list.map((x) => x.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("SEO", () => {
  test("buildMeta arma título, canónica y Open Graph", () => {
    const m = buildMeta({ title: "Spots", path: "/spots" });
    expect(m).toContainEqual({ title: "Spots | SKATE CULTURE UY" });
    expect(m).toContainEqual({ tagName: "link", rel: "canonical", href: "https://skateculture.uy/spots" });
    expect(m).toContainEqual({ property: "og:image", content: "https://skateculture.uy/og-default.png" });
    expect(buildMeta({ title: "X", path: "/x", noindex: true })).toContainEqual({ name: "robots", content: "noindex" });
  });
  test("clip corta sin partir palabras y jsonLd escapa <", () => {
    expect(clip("uno dos tres cuatro", 9)).toBe("uno dos…");
    expect(jsonLd({ a: "</script>" })).not.toContain("</script>");
  });
});
