import { create } from 'zustand';
import { sound } from '../audio/soundEngine';

const STORAGE_KEY = 'zero_to_beyond_audio_muted_v1';
const VOICE_KEY = 'zero_to_beyond_story_voice_v1';
const EFFECTS_KEY = 'ztb-effects';

function getInitialMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    const voice = localStorage.getItem(VOICE_KEY);
    if (voice !== null) {
      return voice === 'off';
    }
  } catch {}
  return false;
}

export interface AudioState {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

const initialMuted = getInitialMuted();
sound.setMuted(initialMuted);

export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: initialMuted,

  setMuted: (muted: boolean) => {
    sound.setMuted(muted);
    if (muted) {
      sound.stopAll();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(muted));
      localStorage.setItem(VOICE_KEY, muted ? 'off' : 'on');
      localStorage.setItem(EFFECTS_KEY, String(!muted));
    } catch {}

    set({ isMuted: muted });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-audio-mute-change', { detail: { isMuted: muted } }));
    }
  },

  toggleMute: () => {
    const current = get().isMuted;
    get().setMuted(!current);
  }
}));
