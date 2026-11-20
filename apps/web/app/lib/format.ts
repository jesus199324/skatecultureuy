/** Formato de fechas en español, hora de Montevideo. */

export const TIME_ZONE = "America/Montevideo";
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/** Partes de una fecha en la zona horaria de Montevideo. */
function partsInZone(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { year: get("year"), month: Number(get("month")), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** "Hace 5 min", "Hace 2 h", "Ayer", "Hace 3 días" o "12 NOV". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMin = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Ayer";
  if (diffD < 7) return `Hace ${diffD} días`;
  const p = partsInZone(iso);
  return `${Number(p.day)} ${MONTHS[p.month - 1]}`;
}

/** Fecha de agenda: { day: "14", month: "DIC", year: "2026", time: "15:00" }. */
export function eventDateParts(iso: string) {
  const p = partsInZone(iso);
  return { day: p.day, month: MONTHS[p.month - 1], year: p.year, time: `${p.hour}:${p.minute}` };
}

export type EventState = "PROXIMO" | "FINALIZADO" | "CANCELADO";

/** El estado se calcula con la fecha: nunca queda desactualizado. */
export function eventState(
  e: { eventDate: string; endDate: string | null; cancelled: boolean },
  now: Date = new Date(),
): EventState {
  if (e.cancelled) return "CANCELADO";
  const end = new Date(e.endDate ?? e.eventDate).getTime();
  return end >= now.getTime() ? "PROXIMO" : "FINALIZADO";
}

/** Número de dos dígitos para índices editoriales: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0");
