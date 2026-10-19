import { create } from 'zustand';
import { sound } from '../audio/soundEngine';

const STORAGE_KEY = 'zero_to_beyond_audio_muted_v1';
const VOICE_KEY = 'zero_to_beyond_story_voice_v1';
const EFFECTS_KEY = 'ztb-effects';

function saved(key: string, fallback: boolean, enabledValue = 'true'): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === enabledValue;
  } catch { return fallback; }
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
const initialEffects = saved(EFFECTS_KEY, true);
sound.setMuted(initialMuted || !initialEffects);

/** Master mute temporarily silences both channels without overwriting preferences. */
export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: initialMuted,
  voicesEnabled: saved(VOICE_KEY, true, 'on'),
  effectsEnabled: initialEffects,
  setMuted: muted => {
    set({ isMuted: muted });
    sound.setMuted(muted || !get().effectsEnabled);
    if (muted) sound.stopAll();
    try { localStorage.setItem(STORAGE_KEY, String(muted)); } catch { /* In-memory preference remains. */ }
    window.dispatchEvent(new CustomEvent('game-audio-mute-change', { detail: { isMuted: muted } }));
  },
  toggleMute: () => get().setMuted(!get().isMuted),
  setVoicesEnabled: enabled => {
    set({ voicesEnabled: enabled });
    try { localStorage.setItem(VOICE_KEY, enabled ? 'on' : 'off'); } catch { /* In-memory preference remains. */ }
    window.dispatchEvent(new CustomEvent('game-audio-voices-change', { detail: { enabled } }));
  },
  setEffectsEnabled: enabled => {
    set({ effectsEnabled: enabled });
    sound.setMuted(get().isMuted || !enabled);
    if (!enabled) sound.stopAll();
    try { localStorage.setItem(EFFECTS_KEY, String(enabled)); } catch { /* In-memory preference remains. */ }
  },
}));
