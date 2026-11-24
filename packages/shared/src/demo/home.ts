/**
 * CONTENIDO DE DEMOSTRACIÓN — todo es ficticio y lleva isDemo: true.
 * Tiene la misma forma que GET /api/home, así que en la Fase 6 se
 * reemplaza por la respuesta real de la API sin tocar los componentes.
 * Spots sin ubicaciones reales; personas inventadas; sin fotos reales.
 */
import type {
  ArticleSummary, Category, EventSummary, HomePayload, MediaAsset, NewsTopic, SkaterSummary, SpotSummary,
} from "../index";

const cat = (name: string, slug: string): Category => ({ id: `cat-${slug}`, name, slug });
export const CATEGORIES = {
  news: cat("Noticias", "news"),
  street: cat("Street", "street"),
  skaters: cat("Skaters", "skaters"),
  culture: cat("Culture", "culture"),
  magazine: cat("Revista", "revista"),
};

let photoSeq = 0;
const photo = (altText: string, tone: MediaAsset["placeholderTone"] = "dark", w = 1600, h = 1067): MediaAsset => ({
  id: `demo-photo-${++photoSeq}`,
  publicId: null,
  width: w,
  height: h,
  altText,
  credit: null,
  isDemo: true,
  placeholderTone: tone,
});

const HOUR = 3600_000;
const ago = (hours: number, now: number) => new Date(now - hours * HOUR).toISOString();

let artSeq = 0;
function article(p: Partial<ArticleSummary> & Pick<ArticleSummary, "title" | "slug" | "category">): ArticleSummary {
  return {
    id: `demo-article-${++artSeq}`,
    excerpt: "",
    format: "STORY",
    author: "Redacción",
    coverImage: null,
    featured: false,
    publishedAt: new Date("2026-11-18T15:00:00Z").toISOString(),
    newsTopic: null,
    readMinutes: 4,
    isDemo: true,
    ...p,
  };
}

const news = (title: string, slug: string, topic: NewsTopic, hoursAgo: number, now: number, extra: Partial<ArticleSummary> = {}) =>
  article({ title, slug, category: CATEGORIES.news, format: "NEWS", newsTopic: topic, publishedAt: ago(hoursAgo, now), readMinutes: 2, ...extra });

export function buildDemoHome(now: number = Date.now()): HomePayload {
  artSeq = 0;
  photoSeq = 0;
  return {
    hero: article({
      title: "La noche es de los que ruedan",
      slug: "la-noche-es-de-los-que-ruedan",
      category: CATEGORIES.street,
      excerpt: "Una sesión de madrugada entre plazas, escalinatas y bordes de granito. Historia de demostración para probar la portada.",
      coverImage: photo("Foto demo: skater en una sesión nocturna, blanco y negro", "dark"),
      featured: true,
      readMinutes: 6,
    }),
    news: [
      news("Abre la convocatoria para fotógrafos de skate", "convocatoria-fotografos", "ESCENA_LOCAL", 2, now, {
        excerpt: "La revista busca colaboradores en todo el país. Noticia de demostración.",
        coverImage: photo("Foto demo: cámara y tabla sobre el cemento", "dark"),
      }),
      news("Jam de fin de año: abren las inscripciones", "jam-fin-de-ano-inscripciones", "COMPETENCIAS", 5, now),
      news("Un DIY de demostración suma una rampa nueva", "diy-demo-rampa-nueva", "ESCENA_LOCAL", 26, now),
      news("Así se vive el skate en la región: resumen de la semana", "resumen-semana-region", "INTERNACIONAL", 30, now),
      news("Una marca local de demostración lanza tablas propias", "marca-demo-tablas-propias", "INDUSTRIA", 72, now),
      news("Skaters de todo el país mandan su material", "skaters-mandan-material", "ESCENA_LOCAL", 96, now),
    ],
    latest: [
      article({
        title: "“El skate me enseñó a mirar la ciudad”",
        slug: "entrevista-martina-r",
        category: CATEGORIES.skaters,
        format: "INTERVIEW",
        excerpt: "Martina R., perfil ficticio, habla de sus comienzos, los spots que la formaron y la escena que viene.",
        coverImage: photo("Retrato demo de una skater", "dark", 1200, 1500),
      }),
      article({ title: "Domingo de bowl: una tarde en 24 fotos", slug: "domingo-de-bowl", category: CATEGORIES.street, format: "GALLERY", coverImage: photo("Foto demo: bowl de un skatepark", "light") }),
      article({ title: "Cinco documentales para ver este verano", slug: "cinco-documentales", category: CATEGORIES.culture, coverImage: photo("Foto demo: pantalla de un documental", "dark") }),
      article({ title: "Cómo cuidar un spot entre todos", slug: "cuidar-un-spot", category: CATEGORIES.street }),
      article({ title: "Marcas hechas acá: quién está detrás", slug: "marcas-hechas-aca", category: CATEGORIES.culture }),
      article({ title: "La primera tabla nunca se olvida", slug: "la-primera-tabla", category: CATEGORIES.skaters }),
      article({ title: "Cómo enviar tu material a la revista", slug: "como-enviar-material", category: CATEGORIES.magazine, isDemo: false }),
    ],
    street: [
      article({ title: "Parte completo: Nico F.", slug: "parte-nico-f", category: CATEGORIES.street, format: "VIDEO", videoDuration: "4:12", coverImage: photo("Video demo: parte de skate callejero", "mid") }),
      article({ title: "Una plaza, tres generaciones", slug: "una-plaza-tres-generaciones", category: CATEGORIES.street, format: "GALLERY", coverImage: photo("Foto demo: skaters en una plaza", "mid") }),
      article({ title: "La línea del día", slug: "la-linea-del-dia", category: CATEGORIES.street, format: "STORY", coverImage: photo("Foto demo: skater en una escalinata", "dark") }),
      article({ title: "Lluvia, cordones y un ollie", slug: "lluvia-cordones-ollie", category: CATEGORIES.street, format: "STORY", coverImage: photo("Foto demo: calle mojada", "dark") }),
    ],
    skaters: [
      skater("Martina R.", "martina-r", "Montevideo", "entrevista + galería", "dark"),
      skater("Nico F.", "nico-f", "Salto", "video + galería", "light"),
    ],
    quote: { text: "Acá no hay olas. Hay cordones, escalones y ganas.", attribution: "Nico F. · cita de demostración", isDemo: true },
    spots: [
      spot(1, "MONTEVIDEO", "SKATEPARK", ["BOWL", "MINI_RAMP"]),
      spot(2, "CANELONES", "STREET", ["STAIRS", "LEDGES"]),
      spot(3, "MALDONADO", "DIY", ["BANKS", "MANUAL_PAD"]),
    ],
    culture: [
      article({ title: "Tablas, ruedas y remeras: hacer una marca desde cero", slug: "hacer-una-marca", category: CATEGORIES.culture, coverImage: photo("Foto demo: taller de serigrafía", "dark") }),
      article({ title: "La banda sonora de la sesión", slug: "banda-sonora-sesion", category: CATEGORIES.culture, excerpt: "Qué suena en los parlantes del skatepark, y por qué importa." }),
      article({ title: "Gráficas de tabla: el lienzo que se rompe", slug: "graficas-de-tabla", category: CATEGORIES.culture }),
      article({ title: "Archivo VHS: el skate antes de las redes", slug: "archivo-vhs", category: CATEGORIES.culture, coverImage: photo("Still demo de un video VHS", "light") }),
    ],
    events: [
      event("Jam de fin de año", "jam-fin-de-ano-demo", "2026-12-14T18:00:00Z", "Skatepark de demostración · Montevideo"),
      event("Best trick de verano", "best-trick-verano-demo", "2027-01-17T19:00:00Z", "Spot de demostración · Maldonado"),
    ],
  };

  function skater(name: string, slug: string, city: string, highlights: string, tone: MediaAsset["placeholderTone"]): SkaterSummary {
    return { id: `demo-skater-${slug}`, name, slug, city, highlights, profileImage: photo(`Retrato demo de ${name}`, tone, 1200, 1500), isDemo: true };
  }
  function spot(n: number, department: SpotSummary["department"], type: SpotSummary["type"], features: SpotSummary["features"]): SpotSummary {
    return { id: `demo-spot-${n}`, name: `Spot de demostración ${n}`, slug: `spot-demo-${n}`, department, type, features, coverImage: photo(`Foto demo del spot ${n}`, n === 2 ? "light" : "dark"), isDemo: true };
  }
  function event(name: string, slug: string, eventDate: string, location: string): EventSummary {
    return { id: `demo-event-${slug}`, name, slug, eventDate, endDate: null, location, cancelled: false, externalUrl: null, isDemo: true };
  }
}
