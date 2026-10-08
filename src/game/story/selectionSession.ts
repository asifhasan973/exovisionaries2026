import { emptyFlight, restoreFlight, launchAuthorized, flightComplete } from './flight.ts';
import type { FlightState } from './flight.ts';
import { missionSignature } from './readiness.ts';
import { createStoryProgress, restoreStoryProgress, STORY_SAVE_KEY } from './progress.ts';
import { createPreparationSelection } from './design.ts';
import type { PreparationSelection } from './design.ts';
import { restorePreparation, verifiedActivities } from './preparation.ts';
import { emptyReadiness, missionActivities, restoreReadiness } from './readiness.ts';
import type { ReadinessState } from './readiness.ts';
import type { StoryProgress } from './types.ts';

export const STORY_VOICE_KEY = 'zero_to_beyond_story_voice_v1';
export type StoryStorage = Pick<Storage, 'getItem' | 'setItem'>;
export interface SelectionSession { progress: StoryProgress; preparation: PreparationSelection; readiness: ReadinessState; flight: FlightState; voiceEnabled: boolean; storageAvailable: boolean }
function readSaved(raw: string | null) {
  let data: Record<string, unknown> = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* Invalid saves start fresh. */ }
  if (!data || typeof data !== 'object') data = {};
  const preparation = data.preparationVersion === 1 ? restorePreparation(data.preparation) : createPreparationSelection();
  const buildActivities = verifiedActivities(preparation);
  const base = restoreStoryProgress(JSON.stringify({ ...data, completedActivities: buildActivities }));
  const readiness = data.readinessVersion === 1 ? restoreReadiness(data.readiness, base, preparation) : emptyReadiness();
  const valid = missionActivities(base, preparation, readiness);
  const flight = data.flightVersion === 1 ? restoreFlight(data.flight, missionSignature(base, preparation), launchAuthorized(base, preparation, readiness)) : emptyFlight();
  if (flightComplete(flight, missionSignature(base, preparation))) valid.push('liftoff');
  const completedActivities = Array.isArray(data.completedActivities) ? data.completedActivities.filter(id => valid.includes(id)) : [];
  const progress = restoreStoryProgress(JSON.stringify({ ...data, completedActivities,
    ...(['launch-ready', 'liftoff', 'earth-orbit'].includes(data.stepId as string) && !readiness.approved ? { stepId: 'rocket-pack', lineIndex: 0 } : {}) }));
  return { progress, preparation, readiness, flight };
}
/** Saved progress is bounded by live hardware, check acknowledgements and the approved snapshot. */
export function restoreSelectionProgress(raw: string | null): StoryProgress { return readSaved(raw).progress; }
function freshSession(): SelectionSession { return { progress: createStoryProgress(), preparation: createPreparationSelection(), readiness: emptyReadiness(), flight: emptyFlight(), voiceEnabled: true, storageAvailable: false }; }
export function readSelectionSession(storage: StoryStorage): SelectionSession {
  try {
    return { ...readSaved(storage.getItem(STORY_SAVE_KEY)), voiceEnabled: storage.getItem(STORY_VOICE_KEY) !== 'off', storageAvailable: true };
  } catch { return freshSession(); }
}
export function writeSelectionSession(storage: StoryStorage, progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight()): boolean {
  try {
    const valid = missionActivities(progress, preparation, readiness);
    if (launchAuthorized(progress, preparation, readiness) && flightComplete(flight, missionSignature(progress, preparation))) valid.push('liftoff');
    // One atomic payload prevents progress and hardware becoming separate stale saves.
    storage.setItem(STORY_SAVE_KEY, JSON.stringify({ ...progress, completedActivities: progress.completedActivities.filter(id => valid.includes(id)), preparationVersion: 1, preparation, readinessVersion: 1, readiness, flightVersion: 1, flight }));
    storage.setItem(STORY_VOICE_KEY, voiceEnabled ? 'on' : 'off');
    return true;
  } catch { return false; }
}
export function readBrowserSelectionSession(): SelectionSession {
  try { return readSelectionSession(window.localStorage); } catch { return freshSession(); }
}
export function writeBrowserSelectionSession(progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight()): boolean {
  try { return writeSelectionSession(window.localStorage, progress, voiceEnabled, preparation, readiness, flight); } catch { return false; }
}
