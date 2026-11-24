import { describe, expect, test } from "bun:test";
import { cloudinarySrcSet, cloudinaryUrl } from "../../app/lib/cloudinary";
import { buildDemoHome } from "../../../../packages/shared/src/demo/home";
import { eventDateParts, eventState, pad2, relativeTime } from "../../app/lib/format";
import { absoluteUrl, copyLink, shareOrCopy, whatsappShareUrl } from "../../app/lib/share";

const NOW = new Date("2026-11-20T15:00:00Z");

describe("relativeTime", () => {
  const h = (n: number) => new Date(NOW.getTime() - n * 3600_000).toISOString();
  test.each([
    [new Date(NOW.getTime() - 20_000).toISOString(), "Recién"],
    [new Date(NOW.getTime() - 15 * 60_000).toISOString(), "Hace 15 min"],
    [h(2), "Hace 2 h"],
    [h(30), "Ayer"],
    [h(72), "Hace 3 días"],
  ])("%s → %s", (iso, expected) => expect(relativeTime(iso, NOW)).toBe(expected));

  test("más de una semana muestra la fecha en hora de Montevideo", () => {
    // 1 nov 01:00 UTC = 31 oct 22:00 en Montevideo
    expect(relativeTime("2026-11-01T01:00:00Z", NOW)).toBe("31 OCT");
  });
});

describe("eventos", () => {
  test("fecha de agenda en hora de Montevideo (UTC−3)", () => {
    expect(eventDateParts("2026-12-14T18:00:00Z")).toEqual({ day: "14", month: "DIC", year: "2026", time: "15:00" });
  });
  test("estado calculado: próximo, finalizado y cancelado", () => {
    const base = { endDate: null, cancelled: false };
    expect(eventState({ ...base, eventDate: "2026-12-14T18:00:00Z" }, NOW)).toBe("PROXIMO");
    expect(eventState({ ...base, eventDate: "2026-11-01T18:00:00Z" }, NOW)).toBe("FINALIZADO");
    expect(eventState({ ...base, eventDate: "2026-12-14T18:00:00Z", cancelled: true }, NOW)).toBe("CANCELADO");
    // Evento de varios días que empezó ayer y termina mañana sigue "próximo/en curso".
    expect(eventState({ eventDate: "2026-11-19T12:00:00Z", endDate: "2026-11-21T22:00:00Z", cancelled: false }, NOW)).toBe("PROXIMO");
  });
  test("pad2", () => {
    expect(pad2(1)).toBe("01");
    expect(pad2(12)).toBe("12");
  });
});

describe("cloudinary", () => {
  test("URL con formato y calidad automáticos y ancho", () => {
    expect(cloudinaryUrl("scuy", "street/sesion-01", { width: 640 })).toBe(
      "https://res.cloudinary.com/scuy/image/upload/f_auto,q_auto,c_fill,g_auto,w_640/street/sesion-01",
    );
  });
  test("recorte por relación de aspecto", () => {
    expect(cloudinaryUrl("scuy", "a", { width: 400, aspectRatio: "4:5" })).toContain("w_400,ar_4:5/a");
  });
  test("escapa caracteres raros del publicId", () => {
    expect(cloudinaryUrl("scuy", "carpeta/foto con espacio", { width: 400 })).toEndWith("/carpeta/foto%20con%20espacio");
  });
  test("srcset con un ancho por candidato", () => {
    const s = cloudinarySrcSet("scuy", "a", [400, 800]);
    expect(s.split(", ")).toHaveLength(2);
    expect(s).toEndWith("800w");
  });
  test("sin cloud name falla con mensaje claro", () => {
    expect(() => cloudinaryUrl("", "a", { width: 1 })).toThrow("CLOUDINARY_CLOUD_NAME");
  });
});

describe("compartir", () => {
  test("link de WhatsApp con título y URL codificados", () => {
    expect(whatsappShareUrl("Jam & ollies", "https://x.uy/a")).toBe("https://wa.me/?text=Jam%20%26%20ollies%20https%3A%2F%2Fx.uy%2Fa");
  });
  test("absoluteUrl", () => {
    expect(absoluteUrl("/stories/a", "https://skateculture.uy")).toBe("https://skateculture.uy/stories/a");
  });
  test("usa el menú nativo si existe", async () => {
    const nav = { share: async () => {}, clipboard: { writeText: async () => {} } } as unknown as Navigator;
    expect(await shareOrCopy({ title: "t", url: "u" }, nav)).toBe("shared");
  });
  test("si se cancela el menú nativo no copia", async () => {
    const abort = Object.assign(new Error("x"), { name: "AbortError" });
    const nav = { share: async () => { throw abort; }, clipboard: { writeText: async () => { throw new Error("no"); } } } as unknown as Navigator;
    expect(await shareOrCopy({ title: "t", url: "u" }, nav)).toBe("cancelled");
  });
  test("sin menú nativo copia el link", async () => {
    let copied = "";
    const nav = { clipboard: { writeText: async (t: string) => { copied = t; } } } as unknown as Navigator;
    expect(await shareOrCopy({ title: "t", url: "https://x.uy" }, nav)).toBe("copied");
    expect(copied).toBe("https://x.uy");
  });
  test("si el portapapeles falla devuelve failed", async () => {
    const nav = { clipboard: { writeText: async () => { throw new Error("denied"); } } } as unknown as Navigator;
    expect(await copyLink("u", nav)).toBe("failed");
  });
});

describe("contenido demo", () => {
  const data = buildDemoHome(NOW.getTime());
  const all = [data.hero, ...data.news, ...data.latest, ...data.street, ...data.culture];

  test("todo el contenido ficticio está marcado como demo", () => {
    const fictional = all.filter((a) => a.slug !== "como-enviar-material");
    expect(fictional.every((a) => a.isDemo)).toBe(true);
    expect(data.skaters.every((s) => s.isDemo)).toBe(true);
    expect(data.spots.every((s) => s.isDemo)).toBe(true);
    expect(data.events.every((e) => e.isDemo)).toBe(true);
  });
  test("spots sin coordenadas ni fotos reales, con nombre de demostración", () => {
    for (const s of data.spots) {
      expect(s.name).toStartWith("Spot de demostración");
      expect(s.coverImage?.publicId ?? null).toBeNull();
    }
  });
  test("slugs únicos", () => {
    const slugs = all.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  test("las noticias tienen tema y formato NEWS, ordenadas de más nueva a más vieja", () => {
    expect(data.news.every((n) => n.format === "NEWS" && n.newsTopic)).toBe(true);
    const times = data.news.map((n) => Date.parse(n.publishedAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
  test("cada foto tiene texto alternativo", () => {
    const photos = [...all.map((a) => a.coverImage), ...data.skaters.map((s) => s.profileImage)].filter(Boolean);
    expect(photos.every((p) => p!.altText.length > 5)).toBe(true);
  });
});

describe("paleta Uruguay: contraste WCAG", () => {
  const css = require("node:fs").readFileSync(require("node:path").join(import.meta.dir, "../../app/styles/app.css"), "utf8");
  const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`))![1];
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  test("azul profundo sobre hueso ≥ 4.5 (texto chico)", () => expect(ratio(token("accent"), token("bone"))).toBeGreaterThanOrEqual(4.5));
  test("hueso sobre azul profundo ≥ 4.5 (botón principal)", () => expect(ratio(token("bone"), token("accent"))).toBeGreaterThanOrEqual(4.5));
  test("celeste sobre negro ≥ 4.5", () => expect(ratio(token("celeste"), token("ink"))).toBeGreaterThanOrEqual(4.5));
  test("negro sobre celeste ≥ 4.5 (sticker UY, cita, resaltado)", () => expect(ratio(token("ink"), token("celeste"))).toBeGreaterThanOrEqual(4.5));
  test("negro sobre amarillo ≥ 4.5 (ticker, stickers)", () => expect(ratio(token("ink"), token("sun"))).toBeGreaterThanOrEqual(4.5));
  test("gris de texto sobre hueso ≥ 4.5", () => expect(ratio(token("muted"), token("bone"))).toBeGreaterThanOrEqual(4.5));
});
