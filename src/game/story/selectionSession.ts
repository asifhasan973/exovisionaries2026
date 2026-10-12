import { emptyFlight, restoreFlight, launchAuthorized, flightComplete } from './flight.ts';
import type { FlightState } from './flight.ts';
import { missionSignature } from './readiness.ts';
import { createStoryProgress, restoreStoryProgress, STORY_SAVE_KEY } from './progress.ts';
import { createPreparationSelection } from './design.ts';
import type { PreparationSelection } from './design.ts';
import { restorePreparation, verifiedActivities, normalizeObjective } from './preparation.ts';
import { emptyReadiness, missionActivities, restoreReadiness } from './readiness.ts';
import type { ReadinessState } from './readiness.ts';
import type { StoryProgress } from './types.ts';
import { createMoonSession, restoreMoonSession, syncMoonDesign } from './moon/session.ts';
import type { MoonSession } from './moon/session.ts';
import { crewReport } from './moon/catalog.ts';

export const STORY_VOICE_KEY = 'zero_to_beyond_story_voice_v1';
export const FULL_MOON_SAVE_KEY = 'zero_to_beyond_full_moon_v3';
export const PREVIOUS_MOON_SAVE_KEY = 'zero_to_beyond_full_moon_v2';
export const FULL_MOON_SAVE_VERSION = 3;
export type StoryStorage = Pick<Storage, 'getItem' | 'setItem'>;
export interface SelectionSession { progress: StoryProgress; preparation: PreparationSelection; readiness: ReadinessState; flight: FlightState; moon: MoonSession; voiceEnabled: boolean; storageAvailable: boolean }
function readSaved(raw: string | null) {
  let data: Record<string, unknown> = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* Invalid saves start fresh. */ }
  if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
  const preparation = normalizeObjective(data.preparationVersion === 1 ? restorePreparation(data.preparation) : createPreparationSelection(), (data.selections as Record<string,string> | undefined)?.objective ?? 'lunar-ice');
  const buildActivities = verifiedActivities(preparation, (data.selections as Record<string,string> | undefined)?.objective);
  const base = restoreStoryProgress(JSON.stringify({ ...data, completedActivities: buildActivities }));
  const readiness = data.readinessVersion === 1 ? restoreReadiness(data.readiness, base, preparation) : emptyReadiness();
  const moon = [2,3].includes(data.sessionVersion as number) && data.moonVersion === 1
    ? restoreMoonSession(data.moon, base, preparation) : { ...createMoonSession(base, preparation), migration: 'legacy-design-revalidation' as const };
  const valid = missionActivities(base, preparation, readiness);
  if (crewReport(moon.crew).complete && verifiedActivities(preparation, base.selections.objective).length === 6) valid.push('crew-selection');
  const flight = data.flightVersion === 1 ? restoreFlight(data.flight, missionSignature(base, preparation), launchAuthorized(base, preparation, readiness)) : emptyFlight();
  if (flightComplete(flight, missionSignature(base, preparation))) valid.push('liftoff');
  const completedActivities = Array.isArray(data.completedActivities) ? data.completedActivities.filter(id => valid.includes(id)) : [];
  const progress = restoreStoryProgress(JSON.stringify({ ...data, completedActivities,
    ...(['launch-ready', 'liftoff', 'earth-orbit'].includes(data.stepId as string) && !readiness.approved ? { stepId: 'rocket-pack', lineIndex: 0 } : {}) }));
  return { progress, preparation, readiness, flight, moon: syncMoonDesign(moon, progress, preparation) };
}
/** Saved progress is bounded by live hardware, check acknowledgements and the approved snapshot. */
export function restoreSelectionProgress(raw: string | null): StoryProgress { return readSaved(raw).progress; }
function freshSession(): SelectionSession {
  const progress = createStoryProgress(), preparation = createPreparationSelection();
  return { progress, preparation, readiness: emptyReadiness(), flight: emptyFlight(), moon: createMoonSession(progress, preparation), voiceEnabled: true, storageAvailable: false };
}
function validEnvelope(raw: string | null) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
export function readSelectionSession(storage: StoryStorage): SelectionSession {
  try {
    const current = storage.getItem(FULL_MOON_SAVE_KEY), previous = storage.getItem(PREVIOUS_MOON_SAVE_KEY);
    const modern = validEnvelope(current)?.sessionVersion === FULL_MOON_SAVE_VERSION ? current : previous;
    const envelope = validEnvelope(modern);
    const valid = envelope !== null && [2,3].includes(envelope.sessionVersion as number) && envelope.version === 1
      && typeof envelope.playerName === 'string' && envelope.preparationVersion === 1;
    const legacy = storage.getItem(STORY_SAVE_KEY);
    const raw = valid ? modern : legacy;
    // A later app version's save is read-only to this build, rather than silently overwritten.
    const currentVersion = validEnvelope(current)?.sessionVersion;
    const future = typeof currentVersion === 'number' && currentVersion > FULL_MOON_SAVE_VERSION;
    return { ...(raw ? readSaved(raw) : freshSession()),
      voiceEnabled: valid && typeof envelope.voiceEnabled === 'boolean' ? envelope.voiceEnabled : storage.getItem(STORY_VOICE_KEY) !== 'off', storageAvailable: !future };
  } catch { return freshSession(); }
}
export function writeSelectionSession(storage: StoryStorage, progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight(), moon = createMoonSession(progress, preparation)): boolean {
  try {
    const existing = validEnvelope(storage.getItem(FULL_MOON_SAVE_KEY));
    if (typeof existing?.sessionVersion === 'number' && existing.sessionVersion > FULL_MOON_SAVE_VERSION) return false;
    const valid = missionActivities(progress, preparation, readiness);
    if (crewReport(moon.crew).complete && verifiedActivities(preparation, progress.selections.objective).length === 6) valid.push('crew-selection');
    if (launchAuthorized(progress, preparation, readiness) && flightComplete(flight, missionSignature(progress, preparation))) valid.push('liftoff');
    // One atomic payload prevents progress and hardware becoming separate stale saves.
    // One atomic new envelope; the old story/voice keys stay untouched for rollback.
    storage.setItem(FULL_MOON_SAVE_KEY, JSON.stringify({ ...progress, sessionVersion: FULL_MOON_SAVE_VERSION, voiceEnabled,
      completedActivities: progress.completedActivities.filter(id => valid.includes(id)), preparationVersion: 1, preparation,
      readinessVersion: 1, readiness, flightVersion: 1, flight, moonVersion: 1, moon: syncMoonDesign(moon, progress, preparation) }));
    return true;
  } catch { return false; }
}
export function readBrowserSelectionSession(): SelectionSession {
  try { return readSelectionSession(window.localStorage); } catch { return freshSession(); }
}
export function writeBrowserSelectionSession(progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight(), moon = createMoonSession(progress, preparation)): boolean {
  try { return writeSelectionSession(window.localStorage, progress, voiceEnabled, preparation, readiness, flight, moon); } catch { return false; }
}
