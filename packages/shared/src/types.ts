/**
 * Tipos del dominio compartidos entre web y API.
 * Reflejan el modelo de datos aprobado en la Fase 1 (schema Prisma).
 * Las fechas viajan como string ISO 8601 en UTC.
 */

export type PublishStatus = "DRAFT" | "PUBLISHED";
export type ArticleFormat = "STORY" | "INTERVIEW" | "GALLERY" | "VIDEO" | "NEWS";
export type NewsTopic = "ESCENA_LOCAL" | "COMPETENCIAS" | "INTERNACIONAL" | "INDUSTRIA";
export type SpotType = "SKATEPARK" | "STREET" | "DIY";
export type SpotFeature =
  | "BOWL" | "MINI_RAMP" | "PLAZA" | "RAILS" | "LEDGES" | "STAIRS"
  | "MANUAL_PAD" | "GAP" | "BANKS" | "LIGHTING" | "ROOFED";
export type Department =
  | "ARTIGAS" | "CANELONES" | "CERRO_LARGO" | "COLONIA" | "DURAZNO" | "FLORES"
  | "FLORIDA" | "LAVALLEJA" | "MALDONADO" | "MONTEVIDEO" | "PAYSANDU" | "RIO_NEGRO"
  | "RIVERA" | "ROCHA" | "SALTO" | "SAN_JOSE" | "SORIANO" | "TACUAREMBO" | "TREINTA_Y_TRES";

/** Foto de la biblioteca de medios. publicId null = foto de demostración sin archivo real. */
export interface MediaAsset {
  id: string;
  publicId: string | null;
  width: number;
  height: number;
  altText: string;
  credit: string | null;
  isDemo: boolean;
  /** Solo para placeholders de demo: tono del bloque gris. */
  placeholderTone?: "dark" | "mid" | "light";
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  format: ArticleFormat;
  category: Category;
  author: string;
  coverImage: MediaAsset | null;
  featured: boolean;
  publishedAt: string;
  newsTopic: NewsTopic | null;
  readMinutes: number;
  /** Duración "m:ss" cuando format = VIDEO. */
  videoDuration?: string;
  isDemo: boolean;
}

export interface SkaterSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  profileImage: MediaAsset | null;
  highlights: string;
  isDemo: boolean;
}

export interface SpotSummary {
  id: string;
  name: string;
  slug: string;
  type: SpotType;
  department: Department;
  features: SpotFeature[];
  coverImage: MediaAsset | null;
  isDemo: boolean;
}

export interface EventSummary {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  endDate: string | null;
  location: string;
  cancelled: boolean;
  externalUrl: string | null;
  isDemo: boolean;
}

export interface PullQuote {
  text: string;
  attribution: string;
  isDemo: boolean;
}

/** Respuesta de GET /api/home. */
export interface HomePayload {
  hero: ArticleSummary;
  news: ArticleSummary[];
  latest: ArticleSummary[];
  street: ArticleSummary[];
  skaters: SkaterSummary[];
  quote: PullQuote;
  spots: SpotSummary[];
  culture: ArticleSummary[];
  events: EventSummary[];
}

/* ───────── Fase 3: páginas internas ───────── */

/** Página de un listado con "Cargar más": items acumulados hasta la página pedida. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Bloques del cuerpo de una nota (se guardan como JSON en la base). */
export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; attribution: string | null }
  | { type: "qa"; question: string; answer: string }
  | { type: "image"; image: MediaAsset; caption: string | null };

export interface VideoEmbed {
  provider: "YOUTUBE" | "VIMEO";
  /** null en demo: no hay video real. */
  videoId: string | null;
  title: string;
}

export interface ArticleDetail extends ArticleSummary {
  body: ArticleBlock[];
  gallery: MediaAsset[];
  video: VideoEmbed | null;
  /** Skaters y spots mencionados en la nota. */
  skaters: SkaterSummary[];
  spots: SpotSummary[];
  related: ArticleSummary[];
}

export interface SkaterDetail extends SkaterSummary {
  bio: string;
  stance: "REGULAR" | "GOOFY" | null;
  instagram: string | null;
  articles: ArticleSummary[];
}

/**
 * Precisión de la ubicación pública. AREA = solo departamento y barrio
 * (spots de calle y DIY, para no quemarlos). EXACT = dirección y mapa
 * (solo skateparks públicos).
 */
export type LocationPrecision = "EXACT" | "AREA";

export interface SpotDetail extends SpotSummary {
  description: string;
  /** Barrio o localidad. */
  locality: string;
  locationPrecision: LocationPrecision;
  /** Solo con precisión EXACT. */
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  gallery: MediaAsset[];
  articles: ArticleSummary[];
}

export interface EventDetail extends EventSummary {
  description: string;
  coverImage: MediaAsset | null;
  /** Spot donde se hace, si está en la revista. */
  spot: SpotSummary | null;
}
