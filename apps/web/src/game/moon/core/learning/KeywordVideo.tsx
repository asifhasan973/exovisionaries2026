import { useEffect, useRef, useState } from "react";
import type { KeywordMedia } from "./keywordMedia";

interface VideoPlayer {
  destroy(): void;
  playVideo(): void;
}
interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host: string;
      width: string;
      height: string;
      playerVars: { playsinline: number; origin: string };
      events: {
        onReady(event: { target: VideoPlayer }): void;
        onError(): void;
        onStateChange(event: { data: number }): void;
      };
    },
  ) => VideoPlayer;
}
let apiPromise: Promise<YouTubeApi> | undefined;
function loadYouTube(): Promise<YouTubeApi> {
  const host = window as Window & {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  };
  if (host.YT?.Player) return Promise.resolve(host.YT);
  if (!apiPromise) {
    apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
      const script = document.createElement("script");
      const previous = host.onYouTubeIframeAPIReady;
      const timeout = window.setTimeout(() => {
        script.remove();
        reject(new Error("Video player unavailable"));
      }, 12000);
      host.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        previous?.();
        if (host.YT?.Player) resolve(host.YT);
        else reject(new Error("Video player unavailable"));
      };
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error("Video player unavailable"));
      };
      document.head.append(script);
    }).catch((error) => {
      apiPromise = undefined;
      throw error;
    });
  }
  return apiPromise;
}

/** The player is created only after Play; destroying it also stops its audio. */
export function KeywordVideo({
  media,
  onStop,
}: {
  media: KeywordMedia;
  onStop(): void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let unavailablePlayer = false;
    let player: VideoPlayer | undefined;
    const unavailable = () => {
      if (cancelled || unavailablePlayer) return;
      unavailablePlayer = true;
      clearTimeout(timeout);
      player?.destroy();
      player = undefined;
      setFailed(true);
      setLoading(false);
    };
    const timeout = window.setTimeout(unavailable, 15000);
    void loadYouTube()
      .then((api) => {
        if (cancelled || unavailablePlayer || !container.current) return;
        const target = document.createElement("div");
        container.current.replaceChildren(target);
        player = new api.Player(target, {
          videoId: media.videoId!,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, origin: window.location.origin },
          events: {
            onReady: (event) => {
              if (!cancelled && !unavailablePlayer) {
                clearTimeout(timeout);
                setLoading(false);
                event.target.playVideo();
              }
            },
            onError: unavailable,
            onStateChange: (event) => {
              if (event.data === 0) onStop();
            },
          },
        });
      })
      .catch(unavailable);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      player?.destroy();
    };
  }, [media, onStop]);
  return (
    <div className="keyword-video">
      {!failed ? <div className="keyword-youtube" ref={container} /> : null}
      {loading ? <span role="status">Opening video…</span> : null}
      {failed ? (
        <a href={media.src} target="_blank" rel="noreferrer">
          Watch video ↗
        </a>
      ) : null}
    </div>
  );
}
