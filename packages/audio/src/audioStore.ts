import { create } from "zustand";
import { sound } from "./soundEngine";

const STORAGE_KEY = "zero_to_beyond_audio_muted_v1";
const VOICE_KEY = "zero_to_beyond_story_voice_v1";
const EFFECTS_KEY = "ztb-effects";

function saved(key: string, fallback: boolean, enabledValue = "true"): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === enabledValue;
  } catch {
    return fallback;
  }
}

export interface AudioState {
  isMuted: boolean;
  voicesEnabled: boolean;
  effectsEnabled: boolean;
  setMuted(muted: boolean): void;
  toggleMute(): void;
  setVoicesEnabled(enabled: boolean): void;
  setEffectsEnabled(enabled: boolean): void;
}

const initialMuted = saved(STORAGE_KEY, false);
const initialVoices = saved(VOICE_KEY, true, "on");
const initialEffects = saved(EFFECTS_KEY, true);
sound.setMuted(initialMuted || !initialEffects);

/** Master mute temporarily silences both channels without overwriting preferences. */
export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: initialMuted,
  voicesEnabled: initialVoices,
  effectsEnabled: initialEffects,
  setMuted: (muted) => {
    const prev = get();
    if (muted) {
      set({ isMuted: true });
      sound.setMuted(true);
      sound.stopAll();
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* In-memory preference remains. */
      }
      window.dispatchEvent(
        new CustomEvent("game-audio-mute-change", {
          detail: { isMuted: true },
        }),
      );
    } else {
      const bothDisabled = !prev.voicesEnabled && !prev.effectsEnabled;
      const nextVoices = bothDisabled ? true : prev.voicesEnabled;
      const nextEffects = bothDisabled ? true : prev.effectsEnabled;
      set({
        isMuted: false,
        voicesEnabled: nextVoices,
        effectsEnabled: nextEffects,
      });
      sound.setMuted(!nextEffects);
      try {
        localStorage.setItem(STORAGE_KEY, "false");
        if (bothDisabled) {
          localStorage.setItem(VOICE_KEY, "on");
          localStorage.setItem(EFFECTS_KEY, "true");
        }
      } catch {
        /* In-memory preference remains. */
      }
      window.dispatchEvent(
        new CustomEvent("game-audio-mute-change", {
          detail: { isMuted: false },
        }),
      );
      if (bothDisabled) {
        window.dispatchEvent(
          new CustomEvent("game-audio-voices-change", {
            detail: { enabled: true },
          }),
        );
      }
    }
  },
  toggleMute: () => {
    const s = get();
    const isActive = !s.isMuted && (s.voicesEnabled || s.effectsEnabled);
    s.setMuted(isActive);
  },
  setVoicesEnabled: (enabled) => {
    const prev = get();
    if (enabled) {
      set({ voicesEnabled: true, isMuted: false });
      sound.setMuted(!prev.effectsEnabled);
      try {
        localStorage.setItem(VOICE_KEY, "on");
        localStorage.setItem(STORAGE_KEY, "false");
      } catch {
        /* In-memory preference remains. */
      }
      window.dispatchEvent(
        new CustomEvent("game-audio-voices-change", {
          detail: { enabled: true },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("game-audio-mute-change", {
          detail: { isMuted: false },
        }),
      );
    } else {
      const allOff = !prev.effectsEnabled;
      set({ voicesEnabled: false, ...(allOff ? { isMuted: true } : {}) });
      try {
        localStorage.setItem(VOICE_KEY, "off");
        if (allOff) localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* In-memory preference remains. */
      }
      window.dispatchEvent(
        new CustomEvent("game-audio-voices-change", {
          detail: { enabled: false },
        }),
      );
      if (allOff) {
        sound.setMuted(true);
        sound.stopAll();
        window.dispatchEvent(
          new CustomEvent("game-audio-mute-change", {
            detail: { isMuted: true },
          }),
        );
      }
    }
  },
  setEffectsEnabled: (enabled) => {
    const prev = get();
    if (enabled) {
      set({ effectsEnabled: true, isMuted: false });
      sound.setMuted(false);
      try {
        localStorage.setItem(EFFECTS_KEY, "true");
        localStorage.setItem(STORAGE_KEY, "false");
      } catch {
        /* In-memory preference remains. */
      }
      window.dispatchEvent(
        new CustomEvent("game-audio-mute-change", {
          detail: { isMuted: false },
        }),
      );
    } else {
      const allOff = !prev.voicesEnabled;
      set({ effectsEnabled: false, ...(allOff ? { isMuted: true } : {}) });
      sound.setMuted(true);
      sound.stopAll();
      try {
        localStorage.setItem(EFFECTS_KEY, "false");
        if (allOff) localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* In-memory preference remains. */
      }
      if (allOff) {
        window.dispatchEvent(
          new CustomEvent("game-audio-mute-change", {
            detail: { isMuted: true },
          }),
        );
      }
    }
  },
}));
