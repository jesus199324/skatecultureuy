/**
 * CONTENIDO DE DEMOSTRACIÓN para las páginas internas (Fase 3).
 * Parte de la portada demo (demo-data.ts) y le suma notas, skaters, spots
 * y eventos con el detalle que pide cada página. Todo es ficticio y lleva
 * isDemo: true: personas inventadas, spots sin ubicaciones reales, sin fotos.
 */
import {
  publicLocationPrecision,
  type ArticleBlock, type ArticleDetail, type ArticleFormat, type ArticleSummary, type Department, type EventDetail,
  type MediaAsset, type SkaterDetail, type SpotDetail, type SpotFeature, type SpotType,
} from "../index";
import { CATEGORIES, buildDemoHome } from "./home";

export interface DemoDb {
  articles: ArticleDetail[];
  skaters: SkaterDetail[];
  spots: SpotDetail[];
  events: EventDetail[];
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

let seq = 0;
const photo = (altText: string, tone: MediaAsset["placeholderTone"] = "dark", w = 1600, h = 1067): MediaAsset => ({
  id: `demo-extra-photo-${++seq}`, publicId: null, width: w, height: h, altText, credit: null, isDemo: true, placeholderTone: tone,
});

const P = (text: string): ArticleBlock => ({ type: "paragraph", text });

/** Cuerpo de demostración según el formato de la nota. */
function demoBody(a: ArticleSummary): { body: ArticleBlock[]; gallery: MediaAsset[] } {
  const intro = P(
    a.excerpt ||
      `${a.title}. Este es un texto de demostración: sirve para probar cómo se lee una nota en la revista, con su tipografía, sus citas y sus fotos. El contenido real lo escriben colaboradores de la escena.`,
  );
  switch (a.format as ArticleFormat) {
    case "INTERVIEW":
      return {
        body: [
          intro,
          { type: "qa", question: "¿Cómo empezaste a patinar?", answer: "Respuesta de demostración: con una tabla prestada, en la vereda de casa, cayéndome mucho." },
          { type: "qa", question: "¿Qué spot te formó?", answer: "Respuesta de demostración: una plaza con bordes de granito donde nos juntábamos todos los fines de semana." },
          { type: "quote", text: "El skate me enseñó a mirar la ciudad de otra manera.", attribution: "Cita de demostración" },
          { type: "qa", question: "¿Qué le falta a la escena?", answer: "Respuesta de demostración: más espacios cuidados y más gente documentando lo que pasa." },
        ],
        gallery: [],
      };
    case "GALLERY":
      return {
        body: [intro, P("Las fotos de esta galería son lugares reservados para fotografía con crédito. Tocá cualquiera para verla más grande.")],
        gallery: Array.from({ length: 8 }, (_, i) => photo(`Foto demo ${i + 1} de la galería`, i % 3 === 0 ? "light" : i % 2 ? "mid" : "dark")),
      };
    case "VIDEO":
      return { body: [intro, P("Video de demostración: cuando se cargue el real, se reproduce acá desde YouTube o Vimeo.")], gallery: [] };
    case "NEWS":
      return {
        body: [
          intro,
          P("Más detalles de la noticia de demostración: quién, dónde y cuándo. En la versión real, cada noticia enlaza a su fuente."),
          P("Si tenés información sobre este tema, escribinos desde la sección About."),
        ],
        gallery: [],
      };
    default:
      return {
        body: [
          intro,
          P("Segundo párrafo de demostración. La revista cuenta historias de la escena uruguaya con tiempo y con respeto por quienes las protagonizan."),
          { type: "heading", text: "Un subtítulo de demostración" },
          P("Tercer párrafo de demostración, para ver cómo respira el texto largo entre fotos y citas."),
          { type: "image", image: photo("Foto demo dentro de la nota", "mid"), caption: "Pie de foto de demostración · Foto: crédito del autor" },
          { type: "quote", text: "Acá no hay olas. Hay cordones, escalones y ganas.", attribution: "Cita de demostración" },
          P("Cierre de demostración."),
        ],
        gallery: [],
      };
  }
}

/** Notas extra para que los listados tengan más de una tanda. */
function extraArticles(now: number): ArticleSummary[] {
  const make = (i: number, title: string, slug: string, cat: keyof typeof CATEGORIES, format: ArticleFormat, daysAgo: number): ArticleSummary => ({
    id: `demo-extra-article-${i}`, title, slug, excerpt: "", format, category: CATEGORIES[cat], author: "Redacción",
    coverImage: i % 3 === 0 ? null : photo(`Foto demo: ${title}`, i % 2 ? "mid" : "dark"),
    featured: false, publishedAt: new Date(now - daysAgo * DAY).toISOString(), newsTopic: null, readMinutes: 3 + (i % 4),
    videoDuration: format === "VIDEO" ? `${2 + (i % 4)}:${String(10 + i).padStart(2, "0")}` : undefined, isDemo: true,
  });
  return [
    make(1, "Sesión de demostración en la rambla", "sesion-demo-rambla", "street", "GALLERY", 8),
    make(2, "Escalinata de demostración: tres trucos", "escalinata-demo-tres-trucos", "street", "VIDEO", 10),
    make(3, "Bordes, cera y paciencia", "bordes-cera-paciencia", "street", "STORY", 12),
    make(4, "Una tarde en un DIY de demostración", "tarde-diy-demo", "street", "GALLERY", 15),
    make(5, "Parte de demostración: Lucía P.", "parte-demo-lucia-p", "street", "VIDEO", 18),
    make(6, "El primer kickflip de la cuadra", "primer-kickflip-cuadra", "street", "STORY", 21),
    make(7, "Fotógrafos de la escena: cómo trabajan", "fotografos-de-la-escena", "culture", "STORY", 9),
    make(8, "Fanzines de skate: papel y fotocopia", "fanzines-de-skate", "culture", "GALLERY", 13),
    make(9, "Bandas que suenan en las sesiones", "bandas-sesiones", "culture", "STORY", 16),
    make(10, "Tablas pintadas a mano: muestra de demostración", "tablas-pintadas-muestra", "culture", "GALLERY", 22),
    make(11, "Entrevista de demostración: Joaquín D.", "entrevista-joaquin-d", "skaters", "INTERVIEW", 11),
  ];
}

const spotSeeds: [Department, SpotType, SpotFeature[]][] = [
  ["MONTEVIDEO", "SKATEPARK", ["BOWL", "MINI_RAMP"]],
  ["CANELONES", "STREET", ["STAIRS", "LEDGES"]],
  ["MALDONADO", "DIY", ["BANKS", "MANUAL_PAD"]],
  ["MONTEVIDEO", "STREET", ["RAILS", "LEDGES"]],
  ["MONTEVIDEO", "SKATEPARK", ["PLAZA", "RAILS", "LIGHTING"]],
  ["SALTO", "SKATEPARK", ["BOWL", "ROOFED"]],
  ["PAYSANDU", "STREET", ["GAP", "STAIRS"]],
  ["ROCHA", "DIY", ["BANKS", "MINI_RAMP"]],
  ["COLONIA", "SKATEPARK", ["PLAZA", "MANUAL_PAD"]],
  ["RIVERA", "STREET", ["LEDGES", "MANUAL_PAD"]],
  ["TACUAREMBO", "SKATEPARK", ["MINI_RAMP", "LIGHTING"]],
  ["FLORIDA", "DIY", ["BANKS"]],
];

export function buildDemoDb(now: number = Date.now()): DemoDb {
  seq = 0;
  const home = buildDemoHome(now);
  const summaries = new Map<string, ArticleSummary>();
  for (const a of [home.hero, ...home.news, ...home.latest, ...home.street, ...home.culture, ...extraArticles(now)]) {
    if (!summaries.has(a.slug)) summaries.set(a.slug, a);
  }

  // Spots: los tres de la portada + nueve más, todos de demostración.
  const spots: SpotDetail[] = spotSeeds.map(([department, type, features], i) => {
    const n = i + 1;
    const base = home.spots[i] ?? {
      id: `demo-spot-${n}`, name: `Spot de demostración ${n}`, slug: `spot-demo-${n}`, department, type, features,
      coverImage: n % 3 === 0 ? null : photo(`Foto demo del spot ${n}`, n % 2 ? "dark" : "light"), isDemo: true,
    };
    return {
      ...base,
      description:
        "Ficha de demostración: acá va la descripción del spot, cómo es el piso, qué se patina y cómo cuidarlo. No corresponde a ningún lugar real.",
      locality: "Zona de demostración",
      locationPrecision: publicLocationPrecision(base.type),
      // Spots ficticios: nunca tienen dirección ni coordenadas.
      address: null,
      coordinates: null,
      gallery: n % 2 ? [photo(`Foto demo 1 del spot ${n}`, "mid"), photo(`Foto demo 2 del spot ${n}`, "dark"), photo(`Foto demo 3 del spot ${n}`, "light")] : [],
      articles: [],
    };
  });

  // Skaters: los dos de la portada + cuatro más.
  const extraSkaters: [string, string, string, string][] = [
    ["Lucía P.", "lucia-p", "Canelones", "video"],
    ["Joaquín D.", "joaquin-d", "Paysandú", "entrevista"],
    ["Valen S.", "valen-s", "Maldonado", "galería"],
    ["Bruno C.", "bruno-c", "Rivera", "perfil"],
  ];
  const skaters: SkaterDetail[] = [
    ...home.skaters,
    ...extraSkaters.map(([name, slug, city, highlights], i) => ({
      id: `demo-skater-${slug}`, name, slug, city, highlights,
      profileImage: photo(`Retrato demo de ${name}`, i % 2 ? "light" : "dark", 1200, 1500), isDemo: true,
    })),
  ].map((s, i) => ({
    ...s,
    bio: `Perfil de demostración: ${s.name} no es una persona real. Acá va la historia del skater, cómo empezó, qué patina y dónde se lo encuentra.`,
    stance: i % 2 ? "GOOFY" : "REGULAR",
    instagram: null,
    articles: [],
  }));
  const skaterArticles: Record<string, string[]> = {
    "martina-r": ["entrevista-martina-r"],
    "nico-f": ["parte-nico-f"],
    "lucia-p": ["parte-demo-lucia-p"],
    "joaquin-d": ["entrevista-joaquin-d"],
  };

  const articles: ArticleDetail[] = [...summaries.values()].map((a) => {
    const { body, gallery } = demoBody(a);
    return {
      ...a,
      body,
      gallery,
      video: a.format === "VIDEO" ? { provider: "YOUTUBE", videoId: null, title: a.title } : null,
      skaters: [],
      spots: [],
      related: [],
    };
  });
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const summary = (a: ArticleDetail): ArticleSummary => {
    const { body: _b, gallery: _g, video: _v, skaters: _s, spots: _p, related: _r, ...rest } = a;
    return rest;
  };

  for (const s of skaters) {
    for (const slug of skaterArticles[s.slug] ?? []) {
      const a = bySlug.get(slug);
      if (!a) continue;
      s.articles.push(summary(a));
      a.skaters.push({ id: s.id, name: s.name, slug: s.slug, city: s.city, profileImage: s.profileImage, highlights: s.highlights, isDemo: s.isDemo });
    }
  }
  // Notas que pasan en spots de demostración.
  const spotLinks: [string, number][] = [["domingo-de-bowl", 0], ["la-linea-del-dia", 1], ["tarde-diy-demo", 2], ["una-plaza-tres-generaciones", 4]];
  for (const [slug, i] of spotLinks) {
    const a = bySlug.get(slug);
    const sp = spots[i];
    if (!a || !sp) continue;
    sp.articles.push(summary(a));
    a.spots.push({ id: sp.id, name: sp.name, slug: sp.slug, type: sp.type, department: sp.department, features: sp.features, coverImage: sp.coverImage, isDemo: sp.isDemo });
  }
  for (const a of articles) {
    a.related = articles.filter((o) => o.slug !== a.slug && o.category.slug === a.category.slug).slice(0, 3).map(summary);
  }

  // Eventos: los dos próximos de la portada + tres pasados (uno cancelado).
  const events: EventDetail[] = [
    ...home.events,
    { id: "demo-event-pasado-1", name: "Sesión de primavera", slug: "sesion-primavera-demo", eventDate: new Date(now - 20 * DAY).toISOString(), endDate: null, location: "Plaza de demostración · Canelones", cancelled: false, externalUrl: null, isDemo: true },
    { id: "demo-event-pasado-2", name: "Go Skateboarding Day", slug: "go-skateboarding-day-demo", eventDate: "2026-06-21T17:00:00Z", endDate: null, location: "Skatepark de demostración · Salto", cancelled: false, externalUrl: null, isDemo: true },
    { id: "demo-event-cancelado", name: "Campeonato de invierno", slug: "campeonato-invierno-demo", eventDate: "2026-08-09T15:00:00Z", endDate: null, location: "Skatepark de demostración · Montevideo", cancelled: true, externalUrl: null, isDemo: true },
  ].map((e, i) => ({
    ...e,
    description: e.cancelled
      ? "Evento de demostración cancelado. Así se ve un evento que no se hizo: queda en la agenda con su aviso."
      : "Evento de demostración: acá van el horario, las categorías, cómo inscribirse y quién organiza.",
    coverImage: i % 2 ? null : photo(`Foto demo del evento ${e.name}`, "dark"),
    spot: null,
  }));
  if (events[0] && spots[0]) {
    const sp = spots[0];
    events[0].spot = { id: sp.id, name: sp.name, slug: sp.slug, type: sp.type, department: sp.department, features: sp.features, coverImage: sp.coverImage, isDemo: sp.isDemo };
  }

  return { articles, skaters, spots, events };
}
