import type { ReactNode } from "react";
import type { MediaAsset } from "../../../../../packages/shared/src";
import { CLOUDINARY_CLOUD_NAME } from "../../lib/config";
import { cloudinarySrcSet, cloudinaryUrl } from "../../lib/cloudinary";
import { Grain, cx } from "../ui/primitives";

const TONES = { dark: "bg-asphalt", mid: "bg-[#3A3936]", light: "bg-[#8E8B84]" } as const;

interface PhotoProps {
  asset: MediaAsset | null;
  /** Clases de tamaño: alto o aspect ratio (p. ej. "h-[640px]" o "aspect-[4/5]"). */
  className?: string;
  /** Atributo sizes del <img> para que el navegador elija el ancho justo. */
  sizes?: string;
  aspectRatio?: string;
  /** Texto de la etiqueta del placeholder demo. */
  caption?: string;
  priority?: boolean;
  children?: ReactNode;
}

/**
 * Foto editorial. Con publicId usa Cloudinary (WebP/AVIF, srcset, lazy);
 * sin publicId (demo) muestra un bloque gris con grano y su etiqueta.
 */
export function Photo({ asset, className, sizes = "100vw", aspectRatio, caption, priority = false, children }: PhotoProps) {
  const tone = TONES[asset?.placeholderTone ?? "dark"];
  const real = asset?.publicId && CLOUDINARY_CLOUD_NAME;
  return (
    <div className={cx("relative overflow-hidden", tone, className)}>
      {real ? (
        <img
          src={cloudinaryUrl(CLOUDINARY_CLOUD_NAME, asset!.publicId!, { width: 1280, aspectRatio })}
          srcSet={cloudinarySrcSet(CLOUDINARY_CLOUD_NAME, asset!.publicId!, undefined, aspectRatio)}
          sizes={sizes}
          alt={asset!.altText}
          width={asset!.width}
          height={asset!.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="photo-zoom h-full w-full object-cover"
        />
      ) : (
        <div role="img" aria-label={asset?.altText ?? "Foto pendiente"} className="photo-zoom absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_46px,rgb(242_240_234/0.035)_46px_48px)]" />
      )}
      <Grain />
      {!real && caption && (
        <span className="label absolute bottom-2.5 left-3 bg-ink/75 px-2 py-0.5 text-[12px] font-medium tracking-[0.08em] text-bone">{caption}</span>
      )}
      {real && asset?.credit && (
        <span className="label absolute bottom-2.5 right-3 bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-bone">Foto: {asset.credit}</span>
      )}
      {children}
    </div>
  );
}

/** Marco de rollo fotográfico con perforaciones y número de cuadro. */
export function FilmFrame({ children, frame, className, tilt = 0 }: { children: ReactNode; frame: string; className?: string; tilt?: number }) {
  return (
    <div className={cx("film", className)} style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      <span aria-hidden="true" className="label absolute -top-px left-3.5 text-[10.5px] tracking-[0.2em] text-sun">
        {frame}
      </span>
      {children}
    </div>
  );
}

/** Polaroid con nombre escrito a marcador. */
export function Polaroid({ children, label, tilt }: { children: ReactNode; label: string; tilt: number }) {
  return (
    <div className="border border-[#D6D3CA] bg-paper px-3.5 pt-3.5" style={{ transform: `rotate(${tilt}deg)` }}>
      {children}
      <p className="m-0 py-3.5 font-marker text-2xl text-ink">{label}</p>
    </div>
  );
}
