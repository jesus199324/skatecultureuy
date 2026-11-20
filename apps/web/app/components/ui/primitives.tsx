import type { ReactNode } from "react";
import { A } from "./A";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

/** Filtro de grano fotográfico: se monta una sola vez en la raíz. */
export function GrainDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="scuy-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}

/** Capa de grano. strength "grip" = textura de lija para fondos negros. */
export function Grain({ strength = "photo" }: { strength?: "photo" | "grip" }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cx("pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay", strength === "grip" ? "opacity-50" : "opacity-35")}
    >
      <rect width="100%" height="100%" filter="url(#scuy-grain)" />
    </svg>
  );
}

export function DemoBadge({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={cx("label ml-2 inline-block border border-current px-1.5 text-[11px] leading-[1.5]", onDark ? "text-stone" : "text-muted")}>
      DEMO
    </span>
  );
}

/** Etiqueta de sección/categoría en rojo condensado. */
export function Tag({ children, demo, onDark = false, className }: { children: ReactNode; demo?: boolean; onDark?: boolean; className?: string }) {
  return (
    <span className={cx("label text-[13px]", onDark ? "text-accent-soft" : "text-accent", className)}>
      {children}
      {demo && <DemoBadge onDark={onDark} />}
    </span>
  );
}

/** Sticker pegado: decorativo, por eso aria-hidden. */
export function Sticker({
  children, tone = "sun", rotate = -6, className,
}: { children: ReactNode; tone?: "sun" | "celeste" | "accent" | "bone"; rotate?: number; className?: string }) {
  const tones = {
    sun: "bg-sun text-ink",
    celeste: "bg-celeste text-ink",
    accent: "bg-accent text-bone",
    bone: "bg-bone text-ink",
  };
  return (
    <span
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cx("pointer-events-none absolute z-10 border-2 border-ink px-3 py-2 font-display text-[15px] uppercase leading-none", tones[tone], className)}
    >
      {children}
    </span>
  );
}

/** Nota escrita a marcador. */
export function MarkerNote({ children, rotate = -5, className }: { children: ReactNode; rotate?: number; className?: string }) {
  return (
    <span style={{ transform: `rotate(${rotate}deg)` }} className={cx("inline-block font-marker text-accent", className)}>
      {children}
    </span>
  );
}

/** Trazo rojo a mano alzada bajo un título. */
export function Scribble({ width = 240, className }: { width?: number; className?: string }) {
  return (
    <svg width={width} height="16" viewBox="0 0 240 16" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path d="M3 11 C 50 3, 90 14, 140 7 S 220 5, 237 9" stroke="var(--color-accent)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Solcito dibujado a mano (amarillo sol con trazo negro). Decorativo. */
export function SunDoodle({ size = 18, className }: { size?: number; className?: string }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {rays.map((d, i) => {
        const a = (d * Math.PI) / 180;
        const r2 = i % 2 ? 10.5 : 11.5;
        return <path key={d} d={`M${12 + 7.4 * Math.cos(a)} ${12 + 7.4 * Math.sin(a)}L${12 + r2 * Math.cos(a)} ${12 + r2 * Math.sin(a)}`} stroke="var(--color-ink)" strokeWidth="1.8" strokeLinecap="round" />;
      })}
      <circle cx="12" cy="12" r="5.6" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="1.6" />
    </svg>
  );
}

export function Tape({ className, rotate = -4, tint }: { className?: string; rotate?: number; tint?: "celeste" | "sun" }) {
  const bg = tint === "celeste" ? "rgb(117 170 219 / 0.75)" : tint === "sun" ? "rgb(252 209 22 / 0.75)" : undefined;
  return <span aria-hidden="true" className={cx("tape", className)} style={{ transform: `rotate(${rotate}deg)`, ...(bg ? { background: bg } : {}) }} />;
}

type ButtonVariant = "solid" | "accent" | "outline" | "outline-light";
export function ButtonLink({ href, children, variant = "outline", className }: { href: string; children: ReactNode; variant?: ButtonVariant; className?: string }) {
  const variants: Record<ButtonVariant, string> = {
    solid: "bg-ink text-bone hover:bg-accent",
    accent: "bg-accent text-bone hover:bg-ink",
    outline: "border-2 border-ink text-ink hover:bg-ink hover:text-bone",
    "outline-light": "border-2 border-bone text-bone hover:bg-bone hover:text-ink",
  };
  return (
    <A href={href} className={cx("label inline-flex min-h-11 items-center gap-2 px-5 text-sm transition-colors", variants[variant], className)}>
      {children}
    </A>
  );
}
