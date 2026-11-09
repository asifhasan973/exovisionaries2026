import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Expand, Home, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { MobileGameContext, MOBILE_GAME_QUERY } from "./mobileGameContext";
import { GameInfo } from "@exo/ui";
import { useAudioStore } from "@exo/audio";
import { SettingsButton } from "../settings/GameSettings";
import { LearningControls } from "@/game/moon/core/learning/Learning";
import { StorySaveBadge } from "../StorySaveBadge";
import { MilestoneRing } from "@/game/moon/stages/milestones/MilestoneRing";
import "./mobileGame.css";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

/** Fullscreen is an enhancement. Unsupported or rejected browser APIs never block play. */
export function MobileGameProvider({
  children,
  active = true,
  voiceEnabled: propVoiceEnabled,
  onToggleVoice: propOnToggleVoice,
  onHome = () => {},
  onPause = () => {},
  onResume = () => {},
}: {
  children: ReactNode;
  active?: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?(): void;
  onHome?(): void;
  onPause?(): void;
  onResume?(): void;
}) {
  const isMuted = useAudioStore((s) => s.isMuted);
  const voicesEnabled = useAudioStore((s) => s.voicesEnabled);
  const effectsEnabled = useAudioStore((s) => s.effectsEnabled);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  const soundActive = !isMuted && (voicesEnabled || effectsEnabled);
  const isSoundOn =
    propVoiceEnabled !== undefined ? propVoiceEnabled : soundActive;
  const handleToggleSound = propOnToggleVoice ?? toggleMute;

  const [mobile, setMobile] = useState(
    () => matchMedia(MOBILE_GAME_QUERY).matches,
  );
  const [menu, setMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [screenMessage, setScreenMessage] = useState("");
  const wanted = useRef(false),
    ownedFullscreen = useRef(false),
    ownedLock = useRef(false);

  const release = useCallback(() => {
    wanted.current = false;
    if (ownedLock.current) {
      screen.orientation?.unlock?.();
      ownedLock.current = false;
    }
    if (ownedFullscreen.current && document.fullscreenElement)
      void document.exitFullscreen?.().catch(() => {});
    ownedFullscreen.current = false;
  }, []);

  const requestScreen = useCallback(() => {
    if (!matchMedia(MOBILE_GAME_QUERY).matches) return;
    wanted.current = true;
    setScreenMessage("");
    const lock = async () => {
      if (!wanted.current) return;
      try {
        const orientation = screen.orientation as
          LockableOrientation | undefined;
        await orientation?.lock?.("landscape");
        ownedLock.current = true;
      } catch {
        // Many mobile browsers reject lock without fullscreen first.
      }
    };
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .then(() => {
          ownedFullscreen.current = true;
          setFullscreen(true);
          void lock();
        })
        .catch(() => {
          setScreenMessage("Turn your phone sideways for full screen.");
        });
    } else {
      void lock();
    }
  }, []);

  const start = useCallback(() => {
    requestScreen();
  }, [requestScreen]);

  useEffect(() => {
    const query = matchMedia(MOBILE_GAME_QUERY);
    const update = () => {
      const isMobile = query.matches;
      setMobile(isMobile);
      if (!isMobile) release();
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [release]);

  useEffect(() => {
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    if (!menu) onResume();
  }, [menu, onResume]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      release();
      setFullscreen(false);
    } else {
      requestScreen();
    }
  };

  const openMenu = () => {
    onPause();
    setMenu(true);
  };

  const mode = mobile && active;

  return (
    <MobileGameContext.Provider
      value={{ mobile, active: mode, start, openMenu }}
    >
      {children}
      {mode ? (
        <aside className="mobile-game-tools" aria-label="Quick game controls">
          <StorySaveBadge />
          <MilestoneRing />
          <button
            type="button"
            aria-label={isSoundOn ? "Mute sound" : "Enable sound"}
            title={isSoundOn ? "Mute sound" : "Enable sound"}
            aria-pressed={isSoundOn}
            onClick={handleToggleSound}
          >
            {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            type="button"
            aria-label="Pause menu"
            title="Pause menu"
            onClick={openMenu}
          >
            <Pause size={20} />
          </button>
        </aside>
      ) : null}
      {menu ? (
        <GameInfo
          title="Mission paused"
          onClose={() => setMenu(false)}
          pages={[
            <div className="mobile-pause-menu" key="pause">
              <button className="mobile-resume" onClick={() => setMenu(false)}>
                <Play size={20} />
                Resume mission
              </button>
              <div className="mobile-menu-grid">
                <button
                  type="button"
                  aria-label={isSoundOn ? "Mute sound" : "Enable sound"}
                  title={isSoundOn ? "Mute sound" : "Enable sound"}
                  aria-pressed={isSoundOn}
                  onClick={() => {
                    setMenu(false);
                    handleToggleSound();
                  }}
                >
                  {isSoundOn ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  {isSoundOn ? "Mute sound" : "Sound on"}
                </button>
                <button onClick={toggleFullscreen}>
                  <Expand size={18} />
                  {fullscreen ? "Normal screen" : "Full screen"}
                </button>
                <SettingsButton
                  onOpen={() => {
                    setMenu(false);
                  }}
                />
                <LearningControls
                  onOpen={() => {
                    setMenu(false);
                  }}
                />
              </div>
              <button
                className="mobile-menu-home"
                onClick={() => {
                  setMenu(false);
                  onHome();
                }}
              >
                <Home size={18} />
                Mission control
              </button>
              {screenMessage ? <p role="status">{screenMessage}</p> : null}
            </div>,
          ]}
        />
      ) : null}
    </MobileGameContext.Provider>
  );
}
