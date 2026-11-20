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
