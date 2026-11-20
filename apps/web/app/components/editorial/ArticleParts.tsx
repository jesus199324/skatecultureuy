import { useState } from "react";
import type { ArticleBlock, MediaAsset, VideoEmbed } from "../../../../../packages/shared/src";
import { FilmFrame, Photo } from "./Photo";
import { cx } from "../ui/primitives";

/** Cuerpo de la nota: párrafos, subtítulos, citas, preguntas y fotos. */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-6 text-[18px] leading-[1.7] text-body md:text-[19px]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return <p key={i} className={cx("m-0", i === 0 && "text-[20px] leading-[1.6] text-ink md:text-[22px]")}>{b.text}</p>;
          case "heading":
            return <h2 key={i} className="m-0 mt-4 font-display text-[28px] leading-[1.05] text-ink md:text-[34px]">{b.text}</h2>;
          case "quote":
            return (
              <figure key={i} className="halftone m-0 my-4 -rotate-1 px-6 pb-6 pt-7 md:-mx-10">
                <blockquote className="m-0 font-display text-[26px] leading-[1.1] text-ink md:text-[32px]">“{b.text}”</blockquote>
                {b.attribution && <figcaption className="label mt-3 text-[13px] text-ink">{b.attribution}</figcaption>}
              </figure>
            );
          case "qa":
            return (
              <div key={i} className="flex flex-col gap-2">
                <p className="m-0 font-display text-[21px] leading-[1.2] text-accent">{b.question}</p>
                <p className="m-0">{b.answer}</p>
              </div>
            );
          case "image":
            return (
              <figure key={i} className="m-0 my-2 flex flex-col gap-2 md:-mx-10">
                <Photo asset={b.image} sizes="(min-width: 768px) 760px, 100vw" className="aspect-[3/2]" caption="Foto demo" />
                {b.caption && <figcaption className="text-sm text-muted">{b.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}

/** Galería en tira de rollo fotográfico. */
export function Gallery({ photos }: { photos: MediaAsset[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-label={`Galería de ${photos.length} fotos`} className="flex flex-col gap-6">
      <FilmFrame frame={`SCUY 400 ▸ ${photos.length} FOTOS`}>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 px-3 md:grid-cols-4">
          {photos.map((p, i) => (
            <li key={p.id} className={cx(i === 0 && "col-span-2 row-span-2")}>
              <figure className="m-0 h-full">
                <Photo asset={p} sizes="(min-width: 768px) 25vw, 50vw" className={i === 0 ? "h-full min-h-[240px]" : "aspect-square"} caption={`${String(i + 1).padStart(2, "0")}`} />
              </figure>
            </li>
          ))}
        </ul>
      </FilmFrame>
    </section>
  );
}

const embedUrl = (v: VideoEmbed) =>
  v.provider === "YOUTUBE"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.videoId ?? "")}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${encodeURIComponent(v.videoId ?? "")}?autoplay=1&dnt=1`;

/**
 * Video de YouTube o Vimeo que se carga recién al tocarlo (la página no
 * descarga el reproductor ni deja cookies hasta entonces).
 */
export function VideoPlayer({ video, cover }: { video: VideoEmbed; cover: MediaAsset | null }) {
  const [playing, setPlaying] = useState(false);
  if (playing && video.videoId) {
    return (
      <div className="relative aspect-video bg-ink">
        <iframe
          src={embedUrl(video)}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }
  return (
    <div className="relative">
      <Photo asset={cover} sizes="(min-width: 1024px) 66vw, 100vw" className="aspect-video" caption={video.videoId ? undefined : "Video demo · sin video real todavía"} />
      <button
        type="button"
        disabled={!video.videoId}
        onClick={() => setPlaying(true)}
        aria-label={video.videoId ? `Reproducir video: ${video.title}` : "Video de demostración: todavía no hay video para reproducir"}
        className="group absolute inset-0 flex cursor-pointer items-center justify-center disabled:cursor-not-allowed"
      >
        <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[3px] border-bone bg-celeste transition-transform group-enabled:group-hover:scale-110">
          <svg width="30" height="30" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="var(--color-ink)" /></svg>
        </span>
      </button>
    </div>
  );
}
