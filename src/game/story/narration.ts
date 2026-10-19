import type { StoryCharacterId } from './types.ts';
import { recordedVoiceURL } from './voiceClips.ts';

export type NarrationStatus = 'idle' | 'starting' | 'speaking' | 'unavailable' | 'error';
export const NARRATION_SPEED = 1.5;
export interface NarrationSnapshot { status: NarrationStatus; character: StoryCharacterId | null }
export interface NarrationEnvironment {
  synthesis?: Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'>;
  createUtterance?(text: string): SpeechSynthesisUtterance;
  setTimer(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimer(timer: ReturnType<typeof setTimeout>): void;
  createRecording?(url: string): HTMLAudioElement;
}
export function browserNarrationEnvironment(): NarrationEnvironment | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  return {
    synthesis: window.speechSynthesis,
    createUtterance: window.SpeechSynthesisUtterance ? text => new SpeechSynthesisUtterance(text) : undefined,
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: timer => clearTimeout(timer),
    createRecording: url => new Audio(url),
  };
}

import { isEngineFrozen } from '../../state/orientationLifecycleStore';
import { useAudioStore } from '../../state/audioStore';

// One radio channel across scenes, companions and the glossary. A new message
// interrupts the old owner; it never queues behind an obsolete instruction.
let activeNarrator: NarrationController | null = null;

/** Owns one utterance. Late callbacks from cancelled lines cannot animate the next line. */
export class NarrationController {
  private snapshot: NarrationSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private utterance: SpeechSynthesisUtterance | null = null;
  private recording: HTMLAudioElement | null = null;
  private speechStartedAt = 0;
  private environment: NarrationEnvironment | null;
  private isPaused = false;
  private pausedByEngine = false;
  private pausedAt: number | null = null;
  private totalPausedTime = 0;
  private lastSpokenParams: {
    text: string;
    character: StoryCharacterId;
    clipId?: string;
    gender: 'male' | 'female';
  } | null = null;

  constructor(environment: NarrationEnvironment | null) {
    this.environment = environment;
    this.snapshot = { status: environment ? 'idle' : 'unavailable', character: null };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  /** Sampled by canvas, without causing React renders for every audio frame. */
  getSpeechTime = () => {
    if (this.snapshot.status !== 'speaking' && !this.isPaused) return 0;
    if (this.recording) return this.recording.currentTime * 1000;
    const now = this.isPaused && this.pausedAt !== null ? this.pausedAt : performance.now();
    return Math.max(0, now - this.speechStartedAt - this.totalPausedTime) * NARRATION_SPEED;
  };

  pause = (byEngine = false) => {
    if (this.isPaused) return;
    if (this.snapshot.status !== 'speaking' && this.snapshot.status !== 'starting') return;
    const params = this.lastSpokenParams;
    if (!params) return;
    // Cancel old callbacks/watchdogs before replaying this line after suspension.
    this.stop();
    activeNarrator = this;
    this.lastSpokenParams = params;
    this.isPaused = true;
    this.pausedByEngine = byEngine;
    this.pausedAt = performance.now();
    this.update('starting', params.character);
  };

  resume = (byEngine = false) => {
    if (!this.isPaused || byEngine && !this.pausedByEngine) return;
    this.isPaused = false;
    this.pausedByEngine = false;
    this.pausedAt = null;
    this.totalPausedTime = 0;

    // Replay from start of dialogue when unfreezing to ensure the player hears full context
    if (this.lastSpokenParams) {
      const { text, character, clipId, gender } = this.lastSpokenParams;
      this.speak(text, character, clipId, gender);
    }
  };

  private update(status: NarrationStatus, character: StoryCharacterId | null = null) {
    this.snapshot = { status, character };
    this.listeners.forEach(listener => listener());
  }
  private clearTimer() {
    if (this.timer !== undefined) this.environment?.clearTimer(this.timer);
    this.timer = undefined;
  }
  stop = () => {
    if (activeNarrator === this) activeNarrator = null;
    this.generation++;
    this.clearTimer();
    this.isPaused = false;
    this.pausedByEngine = false;
    this.pausedAt = null;
    this.totalPausedTime = 0;
    this.lastSpokenParams = null;
    const owned = this.utterance;
    this.utterance = null;
    if (this.recording) {
      this.recording.onplaying = this.recording.onended = this.recording.onerror = this.recording.onwaiting = this.recording.onstalled = this.recording.onpause = null;
      this.recording.pause(); this.recording = null;
    }
    if (owned) this.environment?.synthesis?.cancel();
    this.update(this.environment ? 'idle' : 'unavailable');
  };
  speak(text: string, character: StoryCharacterId, clipId?: string, gender: 'male' | 'female' = 'female') {
    this.stop();
    const audio = useAudioStore.getState();
    if (audio.isMuted || !audio.voicesEnabled) return;
    const environment = this.environment;
    if (!environment) return;
    activeNarrator?.stop();
    activeNarrator = this;
    this.lastSpokenParams = { text, character, clipId, gender };

    // If game engine is currently suspended by orientation lock or loading screen,
    // defer playback until engine resume
    if (isEngineFrozen()) {
      this.isPaused = true;
      this.pausedByEngine = true;
      this.update('starting', character);
      return;
    }

    this.isPaused = false;
    const generation = this.generation;
    const valid = () => generation === this.generation;
    const finish = (status: 'idle' | 'error') => {
      if (!valid()) return;
      this.generation++;
      if (activeNarrator === this) activeNarrator = null;
      this.clearTimer();
      this.utterance = null;
      if (this.recording) {
        this.recording.onplaying = this.recording.onended = this.recording.onerror = this.recording.onwaiting = this.recording.onstalled = this.recording.onpause = null;
        this.recording.pause(); this.recording = null;
      }
      this.lastSpokenParams = null;
      this.isPaused = false;
      this.update(status);
    };
    const speech = (voiceWait = 0) => { try {
      if (!valid()) return;
      if (!environment.synthesis || !environment.createUtterance) { finish('error'); return; }
      // Chromium loads system voices asynchronously. Do not accidentally speak Chief
      // with the female default before the male voice inventory arrives.
      if (environment.createRecording && !environment.synthesis.getVoices().length && voiceWait < 15) {
        this.update('starting'); this.clearTimer();
        this.timer = environment.setTimer(() => speech(voiceWait + 1), 100);
        return;
      }
      const utterance = environment.createUtterance(text);
      this.utterance = utterance;
      utterance.lang = 'en-US';
      utterance.rate = NARRATION_SPEED;
      utterance.pitch = 1;
      const voices = environment.synthesis.getVoices().filter(voice => /^en[-_]/i.test(voice.lang));
      const voice = selectCharacterVoice(voices, character, gender);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (!valid()) return;
        this.clearTimer();
        this.speechStartedAt = performance.now();
        this.update('speaking', character);
        // Safety net for speech services which disappear or never send an end event.
        this.timer = environment.setTimer(() => {
          if (!valid()) return;
          this.stop(); this.update('error');
        }, Math.max(15000, text.length * 180 + 10000));
      };
      utterance.onend = () => finish('idle');
      utterance.onerror = () => finish('error');
      utterance.onpause = () => { if (valid()) this.update('starting'); };
      utterance.onresume = () => { if (valid()) this.update('speaking', character); };
      this.update('starting');
      this.timer = environment.setTimer(() => {
        if (!valid()) return;
        this.stop(); this.update('error');
      }, 10000);
      environment.synthesis.speak(utterance);
    } catch {
      this.stop(); this.update('error');
    } };
    const recordingURL = environment.createRecording ? recordedVoiceURL(clipId, text, character, gender) : null;
    if (!recordingURL) { speech(); return; }
    try {
      const audio = environment.createRecording!(recordingURL);
      audio.playbackRate = NARRATION_SPEED;
      audio.preservesPitch = true;
      this.recording = audio;
      const current = () => valid() && this.recording === audio;
      this.update('starting');
      audio.onplaying = () => {
        if (!current()) return;
        this.clearTimer(); this.update('speaking', character);
        this.timer = environment.setTimer(() => { if (current()) finish('error'); }, Math.max(15000, text.length * 180 + 10000));
      };
      audio.onended = () => { if (current()) finish('idle'); };
      // Buffering and pause are not speech: keep the actor's mouth closed until
      // the browser confirms that audio is actually playing again.
      audio.onwaiting = audio.onstalled = audio.onpause = () => { if (current()) this.update('starting'); };
      audio.onerror = () => {
        if (!current()) return;
        this.clearTimer(); audio.pause(); this.recording = null; speech();
      };
      this.timer = environment.setTimer(() => { if (current()) { audio.pause(); this.recording = null; speech(); } }, 10000);
      void audio.play().catch(() => { if (current()) finish('error'); });
    } catch { speech(); }
  }
}

/** Prefer a natural voice and never select the same known female default for Chief. */
export function selectCharacterVoice(voices: readonly SpeechSynthesisVoice[], character: StoryCharacterId, gender: 'male' | 'female' = 'female') {
  const male = /Guy|Andrew|Brian|Ryan|Daniel|Alex|David|Aaron|Arthur|Tom|Rishi|\bMale\b/i;
  const female = /Sonia|Aria|Jenny|Ava|Emma|Samantha|Karen|Serena|Victoria|Zira|Susan|\bFemale\b/i;
  const useMale = character === 'chief' || gender === 'male';
  if (character === 'chief') {
    const directorVoice = voices.find(voice => /Guy|David|Arthur|Aaron/i.test(voice.name));
    if (directorVoice) return directorVoice;
  }
  if (character === 'commander' && useMale) {
    const distinctVoice = voices.find(voice => /Andrew|Ryan|Brian|Daniel|Alex/i.test(voice.name));
    if (distinctVoice) return distinctVoice;
  }
  const matches = voices.filter(voice => (useMale ? male : female).test(voice.name));
  return matches.find(voice => /Natural|Neural|Enhanced|Premium/i.test(voice.name)) ?? matches[0]
    ?? voices.find(voice => !(useMale ? female : male).test(voice.name) && voice.default)
    ?? voices.find(voice => !(useMale ? female : male).test(voice.name)) ?? voices[useMale ? 0 : Math.min(1, voices.length - 1)];
}

export function pauseActiveNarration() {
  activeNarrator?.pause(true);
}

export function resumeActiveNarration() {
  activeNarrator?.resume(true);
}

if (typeof window !== 'undefined') {
  window.addEventListener('game-orientation-pause', pauseActiveNarration);
  window.addEventListener('game-orientation-resume', resumeActiveNarration);
  const syncVoiceMute = () => {
    const audio = useAudioStore.getState();
    if (audio.isMuted || !audio.voicesEnabled) activeNarrator?.stop();
  };
  window.addEventListener('game-audio-mute-change', syncVoiceMute);
  window.addEventListener('game-audio-voices-change', syncVoiceMute);
}

