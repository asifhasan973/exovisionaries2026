import type { StoryCharacterId } from './types.ts';
import { recordedVoiceURL } from './voiceClips.ts';

export type NarrationStatus = 'idle' | 'starting' | 'speaking' | 'unavailable' | 'error';
export interface NarrationSnapshot { status: NarrationStatus; character: StoryCharacterId | null }
export interface NarrationEnvironment {
  synthesis: Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'>;
  createUtterance(text: string): SpeechSynthesisUtterance;
  setTimer(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearTimer(timer: ReturnType<typeof setTimeout>): void;
  createRecording?(url: string): HTMLAudioElement;
}
export function browserNarrationEnvironment(): NarrationEnvironment | null {
  if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return null;
  return {
    synthesis: window.speechSynthesis,
    createUtterance: text => new SpeechSynthesisUtterance(text),
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: timer => clearTimeout(timer),
    createRecording: url => new Audio(url),
  };
}

/** Owns one utterance. Late callbacks from cancelled lines cannot animate the next line. */
export class NarrationController {
  private snapshot: NarrationSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private utterance: SpeechSynthesisUtterance | null = null;
  private recording: HTMLAudioElement | null = null;
  private environment: NarrationEnvironment | null;
  constructor(environment: NarrationEnvironment | null) {
    this.environment = environment;
    this.snapshot = { status: environment ? 'idle' : 'unavailable', character: null };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(status: NarrationStatus, character: StoryCharacterId | null = null) {
    this.snapshot = { status, character };
    this.listeners.forEach(listener => listener());
  }
  private clearTimer() {
    if (this.timer !== undefined) this.environment?.clearTimer(this.timer);
    this.timer = undefined;
  }
  stop = () => {
    this.generation++;
    this.clearTimer();
    const owned = this.utterance;
    this.utterance = null;
    if (this.recording) {
      this.recording.onplaying = this.recording.onended = this.recording.onerror = null;
      this.recording.pause(); this.recording = null;
    }
    if (owned) this.environment?.synthesis.cancel();
    this.update(this.environment ? 'idle' : 'unavailable');
  };
  speak(text: string, character: StoryCharacterId, clipId?: string) {
    this.stop();
    const environment = this.environment;
    if (!environment) return;
    const generation = this.generation;
    const valid = () => generation === this.generation;
    const finish = (status: 'idle' | 'error') => {
      if (!valid()) return;
      this.generation++;
      this.clearTimer();
      this.utterance = null;
      if (this.recording) { this.recording.pause(); this.recording = null; }
      this.update(status);
    };
    const speech = (voiceWait = 0) => { try {
      if (!valid()) return;
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
      utterance.rate = .98;
      utterance.pitch = 1;
      const voices = environment.synthesis.getVoices().filter(voice => /^en[-_]/i.test(voice.lang));
      const voice = selectCharacterVoice(voices, character);
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (!valid()) return;
        this.clearTimer();
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
    const recordingURL = environment.createRecording ? recordedVoiceURL(clipId, text, character) : null;
    if (!recordingURL) { speech(); return; }
    try {
      const audio = environment.createRecording!(recordingURL);
      this.recording = audio;
      const current = () => valid() && this.recording === audio;
      this.update('starting');
      audio.onplaying = () => {
        if (!current()) return;
        this.clearTimer(); this.update('speaking', character);
        this.timer = environment.setTimer(() => { if (current()) finish('error'); }, Math.max(15000, text.length * 180 + 10000));
      };
      audio.onended = () => { if (current()) finish('idle'); };
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
export function selectCharacterVoice(voices: readonly SpeechSynthesisVoice[], character: StoryCharacterId) {
  const male = /Guy|Andrew|Brian|Ryan|Daniel|Alex|David|Aaron|Arthur|Tom|Rishi|\bMale\b/i;
  const female = /Sonia|Aria|Jenny|Ava|Emma|Samantha|Karen|Serena|Victoria|Zira|Susan|\bFemale\b/i;
  const matches = voices.filter(voice => (character === 'chief' ? male : female).test(voice.name));
  return matches.find(voice => /Natural|Neural|Enhanced|Premium/i.test(voice.name)) ?? matches[0]
    ?? voices.find(voice => !(character === 'chief' ? female : male).test(voice.name) && voice.default)
    ?? voices.find(voice => !(character === 'chief' ? female : male).test(voice.name)) ?? voices[character === 'chief' ? 0 : Math.min(1, voices.length - 1)];
}
