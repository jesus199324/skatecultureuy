import type { ReactNode } from "react";
import { cx } from "../ui/primitives";
import { A } from "../ui/A";

/** Título gigante de sección (STREET, SPOTS...). */
export function SectionTitle({ id, children, size = "xl", tilt = 0, className }: { id: string; children: ReactNode; size?: "lg" | "xl"; tilt?: number; className?: string }) {
  return (
    <h2
      id={id}
      style={tilt ? { transform: `rotate(${tilt}deg)`, transformOrigin: "left bottom" } : undefined}
      className={cx(
        "m-0 font-display leading-[0.82] tracking-[-0.03em]",
        size === "xl" ? "text-[56px] md:text-[128px]" : "text-[56px] md:text-[64px] xl:text-[80px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** Encabezado chico con filete grueso: "ÚLTIMAS HISTORIAS — Ver todo →". */
export function RuleHeader({ id, title, href, linkLabel = "Ver todo →", onDark = false }: { id: string; title: string; href: string; linkLabel?: string; onDark?: boolean }) {
  return (
    <div className={cx("mb-8 flex items-baseline justify-between border-t-[6px] pt-3.5", onDark ? "border-bone" : "border-ink")}>
      <h2 id={id} className="label m-0 text-xl tracking-[0.16em]">{title}</h2>
      <A href={href} className={cx("label text-[13px]", onDark ? "text-bone hover:text-sun" : "text-accent hover:text-ink")}>{linkLabel}</A>
    </div>
  );
}
