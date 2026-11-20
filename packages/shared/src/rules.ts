import type { LocationPrecision, SpotType } from "./types";

/**
 * Regla aprobada en la Fase 3: los spots de calle y DIY se publican solo con
 * departamento y barrio (para no quemarlos); la ubicación exacta, solo en los
 * skateparks públicos.
 */
export function publicLocationPrecision(type: SpotType): LocationPrecision {
  return type === "SKATEPARK" ? "EXACT" : "AREA";
}

/** Cantidad de items por tanda en los listados con "Cargar más". */
export const PAGE_SIZE = 9;
