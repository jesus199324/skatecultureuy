import type { Department, NewsTopic, SpotFeature, SpotType } from "./types";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  ARTIGAS: "Artigas",
  CANELONES: "Canelones",
  CERRO_LARGO: "Cerro Largo",
  COLONIA: "Colonia",
  DURAZNO: "Durazno",
  FLORES: "Flores",
  FLORIDA: "Florida",
  LAVALLEJA: "Lavalleja",
  MALDONADO: "Maldonado",
  MONTEVIDEO: "Montevideo",
  PAYSANDU: "Paysandú",
  RIO_NEGRO: "Río Negro",
  RIVERA: "Rivera",
  ROCHA: "Rocha",
  SALTO: "Salto",
  SAN_JOSE: "San José",
  SORIANO: "Soriano",
  TACUAREMBO: "Tacuarembó",
  TREINTA_Y_TRES: "Treinta y Tres",
};

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  SKATEPARK: "Skatepark",
  STREET: "Calle",
  DIY: "DIY",
};

export const SPOT_FEATURE_LABELS: Record<SpotFeature, string> = {
  BOWL: "Bowl",
  MINI_RAMP: "Mini rampa",
  PLAZA: "Plaza",
  RAILS: "Barandas",
  LEDGES: "Bordes",
  STAIRS: "Escalinata",
  MANUAL_PAD: "Manual pad",
  GAP: "Gap",
  BANKS: "Bancos",
  LIGHTING: "Iluminación",
  ROOFED: "Techado",
};

export const NEWS_TOPIC_LABELS: Record<NewsTopic, string> = {
  ESCENA_LOCAL: "Escena local",
  COMPETENCIAS: "Competencias",
  INTERNACIONAL: "Internacional",
  INDUSTRIA: "Industria",
};

/** Navegación principal: orden y rutas aprobadas en la Fase 1. */
export const NAV_ITEMS = [
  { label: "NOTICIAS", href: "/news" },
  { label: "STREET", href: "/street" },
  { label: "SKATERS", href: "/skaters" },
  { label: "SPOTS", href: "/spots" },
  { label: "CULTURE", href: "/culture" },
  { label: "EVENTS", href: "/events" },
  { label: "ABOUT", href: "/about" },
] as const;

export const ARTICLE_FORMAT_LABELS: Record<import("./types").ArticleFormat, string> = {
  STORY: "Historia",
  INTERVIEW: "Entrevista",
  GALLERY: "Galería",
  VIDEO: "Video",
  NEWS: "Noticia",
};
