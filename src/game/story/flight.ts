import { missionSignature, packingComplete, allChecksAccepted } from './readiness.ts';
import { humanPacked } from './moon/validation.ts';
import type { MoonSession } from './moon/session.ts';
import type { ReadinessState } from './readiness.ts';
import type { PreparationSelection } from './design.ts';
import type { StoryProgress } from './types.ts';

export const FLIGHT_DURATION = 38;
export const FLIGHT_GATES = [{ t: 16, event: 'booster', label: 'Separate booster' }, { t: 24, event: 'fairing', label: 'Release fairing' }] as const;
export type FlightAction = 'booster' | 'fairing';
export type FlightMode = 'guided' | 'challenge';
export const RELEASE_WINDOW_SECONDS = 4;
export interface FlightState { version: 1; signature: string | null; t: number; status: 'ready' | 'running' | 'paused' | 'awaiting' | 'complete'; speed: 1 | 1.5 | 2; events: FlightAction[]; skipped: boolean; mode: FlightMode; missedWindow: boolean; attempts: number; feedback: string | null }
export type FlightEvent = { type: 'flight-start' } | { type: 'flight-tick'; seconds: number } | { type: 'flight-pause' } | { type: 'flight-resume' }
  | { type: 'flight-speed'; speed: number } | { type: 'flight-action'; action: FlightAction } | { type: 'flight-skip' } | { type: 'flight-replay' }
  | { type: 'flight-mode'; mode: FlightMode } | { type: 'flight-retry-window' };
export function emptyFlight(): FlightState { return { version: 1, signature: null, t: 0, status: 'ready', speed: 1, events: [], skipped: false, mode: 'guided', missedWindow: false, attempts: 0, feedback: null }; }
export function launchAuthorized(progress: StoryProgress, preparation: PreparationSelection, readiness: ReadinessState, moon?: MoonSession) {
  if(moon)return !!moon.human.approved&&moon.human.approved.signature===moon.designSignature&&humanPacked(moon,preparation)&&allChecksAccepted(progress,preparation,readiness,moon);
  return !!readiness.approved && readiness.approved.signature === missionSignature(progress, preparation) && packingComplete(progress, preparation, readiness);
}
export function pendingFlightAction(state: FlightState) { return FLIGHT_GATES.find(gate => state.t >= gate.t && !state.events.includes(gate.event)); }
export function nextFlightGate(state: FlightState) { return FLIGHT_GATES.find(gate => !state.events.includes(gate.event)); }
export function releaseIsSafe(state: FlightState) { const gate = nextFlightGate(state); return !!gate && state.t >= gate.t && state.t <= gate.t + RELEASE_WINDOW_SECONDS && !state.missedWindow; }
export function reduceFlight(state: FlightState, event: FlightEvent, signature: string): FlightState {
  if (event.type === 'flight-replay') return { ...emptyFlight(), speed: state.speed, mode: state.mode };
  if (event.type === 'flight-mode') return state.status === 'ready' && ['guided', 'challenge'].includes(event.mode) ? { ...state, mode: event.mode } : state;
  if (event.type === 'flight-speed') return [1, 1.5, 2].includes(event.speed) ? { ...state, speed: event.speed as FlightState['speed'] } : state;
  if (event.type === 'flight-start') return state.status === 'ready' ? { ...state, signature, status: 'running' } : state;
  if (event.type === 'flight-skip') return { ...state, signature, t: FLIGHT_DURATION, events: ['booster', 'fairing'], status: 'complete', skipped: true };
  if (state.signature !== signature) return emptyFlight();
  if (event.type === 'flight-retry-window') {
    const gate = nextFlightGate(state);
    return state.mode === 'challenge' && state.status === 'awaiting' && state.missedWindow && gate
      ? { ...state, t: gate.t, status: 'running', missedWindow: false, feedback: 'Try again. Release while the band is green.' } : state;
  }
  if (event.type === 'flight-pause') return state.status === 'running' ? { ...state, status: 'paused' } : state;
  if (event.type === 'flight-resume') return state.status === 'paused' ? { ...state, status: 'running' } : state;
  if (event.type === 'flight-action') {
    const gate = nextFlightGate(state);
    if (state.mode === 'guided') return state.status === 'awaiting' && gate?.event === event.action
      ? { ...state, events: [...state.events, event.action], status: 'running' } : state;
    if (state.status !== 'running' || !gate) return state;
    if (gate.event !== event.action || !releaseIsSafe(state)) return { ...state, attempts: state.attempts + 1,
      feedback: gate.event !== event.action ? 'Wrong order. Separate the booster first.' : gate.event === 'booster' ? 'Too soon! The booster is still pushing. Wait for green.' : 'Too soon! Keep the fairing through the thick air.' };
    return { ...state, events: [...state.events, event.action], status: 'running', feedback: 'Clean release! Great timing.' };
  }
  if (event.type !== 'flight-tick' || state.status !== 'running' || !Number.isFinite(event.seconds) || event.seconds <= 0) return state;
  // A suspended tab or stalled callback cannot leap over an interaction.
  const barrier = nextFlightGate(state);
  const stopAt = barrier ? barrier.t + (state.mode === 'challenge' ? RELEASE_WINDOW_SECONDS : 0) : FLIGHT_DURATION;
  const t = Math.min(state.t + Math.min(event.seconds, .25) * state.speed, stopAt);
  const missedWindow = !!barrier && t === stopAt && state.mode === 'challenge';
  return { ...state, t, missedWindow, feedback: missedWindow ? 'Window missed. Rewind this stage and try again.' : state.feedback,
    attempts: state.attempts + (missedWindow ? 1 : 0), status: t === FLIGHT_DURATION ? 'complete' : barrier && t === stopAt ? 'awaiting' : 'running' };
}
export function flightComplete(state: FlightState, signature: string) { return state.signature === signature && state.status === 'complete' && state.t === FLIGHT_DURATION && state.events.join(',') === 'booster,fairing'; }
export function restoreFlight(raw: unknown, signature: string, authorized: boolean): FlightState {
  if (!authorized || !raw || typeof raw !== 'object') return emptyFlight();
  const saved = raw as FlightState;
  if (saved.version !== 1 || saved.signature !== signature || !Number.isFinite(saved.t) || saved.t < 0 || saved.t > FLIGHT_DURATION || ![1, 1.5, 2].includes(saved.speed)
    || !Array.isArray(saved.events) || !['', 'booster', 'booster,fairing'].includes(saved.events.join(',')) || typeof saved.skipped !== 'boolean') return emptyFlight();
  const mode = saved.mode === 'challenge' ? 'challenge' : 'guided', allowance = mode === 'challenge' ? RELEASE_WINDOW_SECONDS : 0;
  if (saved.events.includes('booster') && saved.t < 16 || saved.events.includes('fairing') && saved.t < 24
    || saved.t > 16 + allowance && !saved.events.includes('booster') || saved.t > 24 + allowance && !saved.events.includes('fairing')) return emptyFlight();
  const gate = FLIGHT_GATES.find(item => !saved.events.includes(item.event));
  const missedWindow = mode === 'challenge' && !!gate && saved.t === gate.t + RELEASE_WINDOW_SECONDS;
  const clean: FlightState = { ...emptyFlight(), signature, t: saved.t, speed: saved.speed, events: [...saved.events], skipped: saved.skipped, mode, missedWindow,
    attempts: Number.isInteger(saved.attempts) && saved.attempts >= 0 ? saved.attempts : 0 };
  if (saved.t === FLIGHT_DURATION && saved.status === 'complete' && clean.events.length === 2) return { ...clean, status: 'complete' };
  if (saved.skipped || saved.status === 'complete' || !['running', 'paused', 'awaiting'].includes(saved.status)) return emptyFlight();
  return { ...clean, status: mode === 'guided' && pendingFlightAction(clean) || missedWindow ? 'awaiting' : 'paused' };
}
const anchors = [[4, 0, 0], [10, 8, .65], [16, 55, 2.2], [24, 120, 5.3], [32, 190, 7.2], [38, 200, 7.788]];
/** Authored time-compressed ascent samples. Only the final circular-orbit speed is calculated. */
export function flightTelemetry(state: FlightState) {
  const t = Math.max(4, state.t);
  const upper = anchors.findIndex(a => a[0] >= t), a = anchors[Math.max(0, upper - 1)], b = anchors[upper < 0 ? anchors.length - 1 : upper];
  const fraction = a[0] === b[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
  const altitudeKm = a[1] + (b[1] - a[1]) * fraction;
  const speedKmS = t === FLIGHT_DURATION ? Math.sqrt(398600.4418 / (6371 + 200)) : a[2] + (b[2] - a[2]) * fraction;
  return { altitudeKm, speedKmS, gravityMS2: 398600.4418 / Math.pow(6371 + altitudeKm, 2) * 1000,
    engineOn: state.t >= 4 && state.t < FLIGHT_DURATION && !(state.t >= 16 && !state.events.includes('booster')),
    countdown: state.t < 4 ? Math.ceil(4 - state.t) : 0,
    title: state.t < 4 ? 'Ready for liftoff?' : state.t < 16 ? 'Liftoff!' : !state.events.includes('booster') ? 'Booster is empty!' : state.t < 24 ? 'Upper stage burning' : !state.events.includes('fairing') ? 'Uncover your explorer' : state.t < 38 ? 'Building orbital speed' : 'Earth orbit reached!',
  };
}
