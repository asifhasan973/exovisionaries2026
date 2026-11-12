import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { isEngineFrozen } from "@exo/ui";
import { KeywordVideo } from "./KeywordVideo";
import { KEYWORD_MEDIA } from "./keywordMedia";
import type { LearningTerm } from "./glossary";

export function KeywordMediaCarousel({
  term,
  playing,
  onPlay,
  onStop,
}: {
  term: LearningTerm;
  playing: boolean;
  onPlay(): void;
  onStop(): void;
}) {
  const supplied = KEYWORD_MEDIA[term] ?? [];
  const [failed, setFailed] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const items = supplied.filter((item) => !failed.includes(item.src));
  const current = Math.min(index, Math.max(0, items.length - 1));
  const media = items[current];
  const video = useRef<HTMLVideoElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const element = video.current;
    return () => element?.pause();
  }, [media?.src]);
  const stop = useCallback(() => {
    video.current?.pause();
    onStop();
  }, [onStop]);
  useEffect(() => {
    if (!playing) video.current?.pause();
  }, [playing]);
  useEffect(() => {
    const pause = () => stop();
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("game-orientation-pause", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("game-orientation-pause", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [stop]);
  const move = (delta: number) => {
    stop();
    setIndex(
      (value) =>
        (Math.min(value, items.length - 1) + delta + items.length) %
        items.length,
    );
  };
  if (!media) return null;
  return (
    <figure className="keyword-media" aria-label={`${term} media`}>
      <div
        className="keyword-media-stage"
        role={items.length > 1 ? "group" : undefined}
        aria-roledescription={items.length > 1 ? "carousel" : undefined}
        tabIndex={items.length > 1 ? 0 : undefined}
        aria-label={
          items.length > 1
            ? "Media carousel: use left and right arrows"
            : undefined
        }
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (
            items.length > 1 &&
            (event.key === "ArrowLeft" || event.key === "ArrowRight")
          ) {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onTouchStart={(event) => {
          const t = event.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          const t = event.changedTouches[0],
            start = touch.current;
          touch.current = null;
          if (
            start &&
            items.length > 1 &&
            Math.abs(t.clientX - start.x) > 45 &&
            Math.abs(t.clientX - start.x) > Math.abs(t.clientY - start.y)
          )
            move(t.clientX < start.x ? 1 : -1);
        }}
      >
        {media.kind === "image" ? (
          <img
            key={media.src}
            src={media.src}
            alt={media.alt}
            loading="lazy"
            decoding="async"
            onError={() => {
              stop();
              setFailed((value) => [...value, media.src]);
            }}
          />
        ) : media.kind === "youtube" ? (
          playing ? (
            <KeywordVideo key={media.src} media={media} onStop={onStop} />
          ) : (
            <button
              className="keyword-play"
              onClick={() => {
                if (!isEngineFrozen()) onPlay();
              }}
            >
              <Play size={24} />
              Play video<span>{media.alt}</span>
            </button>
          )
        ) : (
          <video
            key={media.src}
            ref={video}
            src={media.src}
            controls
            playsInline
            preload="none"
            aria-label={media.alt}
            onPlay={() => {
              if (isEngineFrozen()) video.current?.pause();
              else onPlay();
            }}
            onError={() => {
              stop();
              setFailed((value) => [...value, media.src]);
            }}
          />
        )}
      </div>
      <figcaption>
        {media.kind === "image" ? (
          media.caption ? (
            <span>{media.caption}</span>
          ) : null
        ) : (
          <a href={media.src} target="_blank" rel="noreferrer" onClick={stop}>
            Watch video ↗
          </a>
        )}
        {media.sourceUrl ? (
          <a
            className="keyword-source"
            href={media.sourceUrl}
            target="_blank"
            rel="noreferrer"
            onClick={stop}
          >
            Source: {media.source ?? "media"} ↗
          </a>
        ) : null}
      </figcaption>
      {items.length > 1 ? (
        <div
          className="keyword-carousel-controls"
          aria-label="Media navigation"
        >
          <button aria-label="Previous media" onClick={() => move(-1)}>
            <ChevronLeft size={20} />
          </button>
          <span aria-live="polite" aria-atomic="true">
            {current + 1} / {items.length}
          </span>
          <button aria-label="Next media" onClick={() => move(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </figure>
  );
}
