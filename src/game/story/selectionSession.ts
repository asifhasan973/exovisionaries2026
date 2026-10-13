import {restoreReturn,returnAuthorized,returnResources,returnPhase,returnComplete,missionOutcome} from './moon/return.ts';
import {surfaceSecured} from './moon/incidents.ts';
import {reduceScience} from './moon/science.ts';
import { restoreScience, scienceComplete } from './moon/science.ts';
import { restoreSurface, surfaceResources, surfaceReady, surfacePosition, surfaceLink } from './moon/surface.ts';
import { restoreLanding, landingResources, safeTouchdown } from './moon/landing.ts';
import { restoreJourney, journeyResources, emptyJourney, routeReport } from './moon/journey.ts';
import { emptyFlight, launchAuthorized, flightComplete, restoreFlight } from './flight.ts';
import type { FlightState } from './flight.ts';
import { createStoryProgress, restoreStoryProgress, STORY_SAVE_KEY } from './progress.ts';
import { createPreparationSelection } from './design.ts';
import type { PreparationSelection } from './design.ts';
import { restorePreparation, verifiedActivities, normalizeObjective } from './preparation.ts';
import { emptyReadiness, missionActivities, restoreReadiness } from './readiness.ts';
import type { ReadinessState } from './readiness.ts';
import type { StoryProgress } from './types.ts';
import { createMoonSession, restoreMoonSession, syncMoonDesign } from './moon/session.ts';
import type { MoonSession } from './moon/session.ts';
import { allChecksAccepted } from './readiness.ts';
import { humanPacked, humanManifest, departureResources, humanCheckAccepted } from './moon/validation.ts';
import { crewReport } from './moon/catalog.ts';
import { restoreRepairGuide } from './repairGuidance.ts';
import type { RepairGuide } from './repairGuidance.ts';

export const STORY_VOICE_KEY = 'zero_to_beyond_story_voice_v1';
export const FULL_MOON_SAVE_KEY = 'zero_to_beyond_full_moon_v11';
export const PREVIOUS_MOON_SAVE_KEY = 'zero_to_beyond_full_moon_v10';
export const FULL_MOON_SAVE_VERSION = 11;
export type StoryStorage = Pick<Storage, 'getItem' | 'setItem'>;
export interface SelectionSession { repair?: RepairGuide; progress: StoryProgress; preparation: PreparationSelection; readiness: ReadinessState; flight: FlightState; moon: MoonSession; voiceEnabled: boolean; storageAvailable: boolean }
function readSaved(raw: string | null) {
  let data: Record<string, unknown> = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* Invalid saves start fresh. */ }
  if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
  const preparation = normalizeObjective(data.preparationVersion === 1 ? restorePreparation(data.preparation) : createPreparationSelection(), (data.selections as Record<string,string> | undefined)?.objective ?? 'lunar-ice');
  const buildActivities = verifiedActivities(preparation, (data.selections as Record<string,string> | undefined)?.objective);
  const base = restoreStoryProgress(JSON.stringify({ ...data, completedActivities: buildActivities }));
  let moon = [2,3,4,5,6,7,8,9,10,11].includes(data.sessionVersion as number) && data.moonVersion === 1
    ? restoreMoonSession(data.moon, base, preparation) : { ...createMoonSession(base, preparation), migration: 'legacy-design-revalidation' as const };
  const readiness = data.readinessVersion === 1 ? restoreReadiness(data.readiness, base, preparation, moon) : emptyReadiness();
  if (allChecksAccepted(base,preparation,readiness,moon)&&humanPacked(moon,preparation)) {
    const manifest=humanManifest(moon,preparation);
    const saved=(data.moon as MoonSession|undefined)?.human?.approved;
    if(JSON.stringify(saved)===JSON.stringify(manifest)) {
      const resources=departureResources(moon,preparation);
      moon={...moon,phase:'validate',resources,human:{...moon.human,approved:manifest},
        launchSnapshot:Object.freeze({signature:moon.designSignature,platformId:manifest.platformId,equipmentIds:manifest.equipment.map(p=>p.id),crew:{...manifest.crew}}),
        checkpoints:[Object.freeze({id:'pre-departure',phase:'validate',designSignature:moon.designSignature,resources:Object.freeze({...resources})})]};
    }
  }
  const valid = missionActivities(base, preparation, readiness, moon);
  const authorized=launchAuthorized(base,preparation,readiness,moon);
  const flight=[5,6,7,8,9,10,11].includes(data.sessionVersion as number)?restoreFlight(data.flight,moon.designSignature,authorized):emptyFlight();
  if(authorized&&flightComplete(flight,moon.designSignature)){
    const restored=restoreJourney((data.moon as MoonSession|undefined)?.journey,moon);
    const journey=restored.signature?restored:{...emptyJourney(),signature:moon.designSignature,mode:flight.mode,speed:flight.speed,assisted:flight.skipped||moon.human.stress.assisted};
    const resources=journeyResources(moon,journey);
    moon={...moon,journey,resources,trajectory:journey.route,phase:journey.stage==='complete'?'lunar-orbit':['coast','loi-window','loi-burn'].includes(journey.stage)?'transfer':'earth-orbit',checkpoints:[...moon.checkpoints,{id:'earth-orbit',phase:'earth-orbit',designSignature:moon.designSignature,resources:journeyResources(moon,{...emptyJourney(),signature:moon.designSignature})}]};
    if(journey.stage==='complete')moon.checkpoints.push({id:'lunar-orbit',phase:'lunar-orbit',designSignature:moon.designSignature,resources:{...resources}});
    valid.push('liftoff');
    if(journey.route&&routeReport(moon,journey.route).feasible&&journey.stage!=='route')valid.push('earth-orbit');
    if(journey.stage==='complete'){
      valid.push('moon-transfer','lunar-orbit');
      const landing=restoreLanding((data.moon as MoonSession|undefined)?.landing,moon,preparation);
      const resources=landingResources(moon,landing);
      const landed=safeTouchdown(landing);
      moon={...moon,landing,resources,phase:landed?'surface':['ready','separating','separated','aborted'].includes(landing.stage)?'lunar-orbit':'descent',navigation:{...moon.navigation,locationId:landed?`landing-${landing.target}`:'lunar-orbit'}};
      if(landed){
        valid.push('lunar-descent');moon.checkpoints.push({id:'touchdown',phase:'surface',designSignature:moon.designSignature,resources:{...resources}});
        const savedMoon=data.moon as MoonSession|undefined;
        const scienceOrigin=[8,9,10,11].includes(data.sessionVersion as number)&&savedMoon?.science?.signature===moon.designSignature?savedMoon.science.origin:null;
        const surface=restoreSurface(scienceOrigin??savedMoon?.surface,moon,preparation),current=surfaceResources(moon,surface),position=surfacePosition(surface);
        moon={...moon,surface,resources:current,navigation:{locationId:surface.location,routeIds:surface.traversed,communication:surfaceLink(position.x,position.z,preparation)}};
        if(surface.deployed&&surface.crewSheltered)valid.push('surface-deploy');
        if(surfaceReady(surface,moon,preparation)){valid.push('surface-explore');moon.checkpoints.push({id:'surface-orientation',phase:'surface',designSignature:moon.designSignature,resources:{...current}});}
        if([8,9,10,11].includes(data.sessionVersion as number)&&surfaceReady(surface,moon,preparation)){
          let restored=restoreScience(savedMoon?.science,moon,preparation);
          if(data.sessionVersion===8&&data.stepId==='science-ready'&&scienceComplete(restored.science,restored.surface))restored=reduceScience(restored.science,restored.surface,{type:'science-commit'},moon,preparation);
          const resources=surfaceResources(moon,restored.surface),position=surfacePosition(restored.surface);
          moon={...moon,...restored,evidence:restored.science.records,incidents:restored.science.hazards.log.map(r=>({id:r.id,kind:r.kind,resolved:r.status==='resolved'})),resources,navigation:{locationId:restored.surface.location,routeIds:restored.surface.traversed,communication:surfaceLink(position.x,position.z,preparation)}};
          if(restored.science.committed||scienceComplete(restored.science,restored.surface)){valid.push('ice-science');if(surfaceSecured(moon))valid.push('surface-recovery');moon.checkpoints.push({id:'ice-science',phase:'surface',designSignature:moon.designSignature,resources:{...resources}});}
          if([10,11].includes(data.sessionVersion as number)&&returnAuthorized(moon)&&savedMoon?.returnFlight?.signature===moon.designSignature){
            const returnFlight=restoreReturn(savedMoon.returnFlight,moon),resources=returnResources(moon,returnFlight);
            moon={...moon,returnFlight,resources,phase:returnPhase(returnFlight),navigation:{...moon.navigation,locationId:returnFlight.stage==='splashdown'?'earth-ocean':returnFlight.stage==='ready'?'moon-base':'crew-return',communication:'connected'}};
            moon={...moon,outcome:missionOutcome(moon)};
            if(returnComplete(returnFlight,moon.designSignature)){valid.push('crew-return');moon.checkpoints.push({id:'crew-recovered',phase:'debrief',designSignature:moon.designSignature,resources:{...resources}});}
          }
        }
      }
    }
  }
  const completedActivities = Array.isArray(data.completedActivities) ? data.completedActivities.filter(id => valid.includes(id)) : [];
  // A recalculated crew-check receipt proves the role matching and review were
  // completed, including saves made after an equipment-repair shortcut.
  if(humanCheckAccepted('crew-check',moon,preparation)) for(const id of ['crew-selection','crew-plan'] as const) if(!completedActivities.includes(id)) completedActivities.push(id);
  const progress = restoreStoryProgress(JSON.stringify({ ...data, completedActivities,
    ...(['launch-ready', 'liftoff', 'earth-orbit','moon-transfer','lunar-orbit','lunar-descent','lunar-surface','surface-explore','surface-ready','ice-science','science-ready','surface-recovery','surface-secured','crew-return','mission-debrief'].includes(data.stepId as string) && !moon.human.approved ? { stepId: 'rocket-pack', lineIndex: 0 } : {}) }));
  const restored = { progress, preparation, readiness, flight, moon: syncMoonDesign(moon, progress, preparation) };
  return { ...restored, repair: restoreRepairGuide(data.repair, { ...restored, past: [], future: [] }) };
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
const SAVE_KEYS = [FULL_MOON_SAVE_KEY, PREVIOUS_MOON_SAVE_KEY, ...[9,8,7,6,5,4,3,2].map(version => `zero_to_beyond_full_moon_v${version}`)];
const DEMO_KEYS = [11,10,9,8,7,6,5].map(version => `zero_to_beyond_demo_checkpoint_v${version}`);
/** A corrupt newer envelope must not hide an intact older checkpoint. */
function firstCompatibleSave(storage: StoryStorage, keys: readonly string[], minVersion = 2) {
  for (const key of keys) {
    const raw = storage.getItem(key), envelope = validEnvelope(raw);
    if (envelope && Number.isInteger(envelope.sessionVersion) && (envelope.sessionVersion as number) >= minVersion
      && (envelope.sessionVersion as number) <= FULL_MOON_SAVE_VERSION && envelope.version === 1
      && typeof envelope.playerName === 'string' && envelope.preparationVersion === 1) return { raw, envelope };
  }
  return null;
}
export function readSelectionSession(storage: StoryStorage): SelectionSession {
  try {
    const current = storage.getItem(FULL_MOON_SAVE_KEY), compatible = firstCompatibleSave(storage, SAVE_KEYS);
    const modern = compatible?.raw ?? null;
    const envelope = compatible?.envelope ?? null;
    const valid = envelope !== null && [2,3,4,5,6,7,8,9,10,11].includes(envelope.sessionVersion as number) && envelope.version === 1
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
export function writeSelectionSession(storage: StoryStorage, progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight(), moon = createMoonSession(progress, preparation), repair?: RepairGuide): boolean {
  try {
    const existing = validEnvelope(storage.getItem(FULL_MOON_SAVE_KEY));
    if (typeof existing?.sessionVersion === 'number' && existing.sessionVersion > FULL_MOON_SAVE_VERSION) return false;
    const valid = missionActivities(progress, preparation, readiness, moon);
    if (crewReport(moon.crew).complete && verifiedActivities(preparation, progress.selections.objective).length === 6) valid.push('crew-selection');
    if (launchAuthorized(progress, preparation, readiness, moon) && flightComplete(flight, moon.designSignature)) valid.push('liftoff');
    if(flightComplete(flight,moon.designSignature)&&moon.journey.signature===moon.designSignature&&moon.journey.route&&routeReport(moon,moon.journey.route).feasible){if(moon.journey.stage!=='route')valid.push('earth-orbit');if(moon.journey.stage==='complete'){valid.push('moon-transfer','lunar-orbit');if(safeTouchdown(moon.landing)){valid.push('lunar-descent');if(moon.surface.signature===moon.designSignature&&moon.surface.deployed&&moon.surface.crewSheltered)valid.push('surface-deploy');if(surfaceReady(moon.science.signature===moon.designSignature&&moon.science.origin?moon.science.origin:moon.surface,moon,preparation))valid.push('surface-explore');if(moon.science.signature===moon.designSignature&&(moon.science.committed||scienceComplete(moon.science,moon.surface)))valid.push('ice-science');if(surfaceSecured(moon))valid.push('surface-recovery');}}}
    if(returnAuthorized(moon)&&returnComplete(moon.returnFlight,moon.designSignature))valid.push('crew-return');
    // One atomic payload prevents progress and hardware becoming separate stale saves.
    // One atomic new envelope; the old story/voice keys stay untouched for rollback.
    storage.setItem(FULL_MOON_SAVE_KEY, JSON.stringify({ ...progress, sessionVersion: FULL_MOON_SAVE_VERSION, voiceEnabled,
      completedActivities: progress.completedActivities.filter(id => valid.includes(id)), preparationVersion: 1, preparation,
      readinessVersion: 1, readiness, flightVersion: 1, flight, repair, moonVersion: 1, moon: syncMoonDesign(moon, progress, preparation) }));
    return true;
  } catch { return false; }
}
export function readBrowserSelectionSession(): SelectionSession {
  try { return readSelectionSession(window.localStorage); } catch { return freshSession(); }
}
export function writeBrowserSelectionSession(progress: StoryProgress, voiceEnabled: boolean, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight(), moon = createMoonSession(progress, preparation), repair?: RepairGuide): boolean {
  try { return writeSelectionSession(window.localStorage, progress, voiceEnabled, preparation, readiness, flight, moon, repair); } catch { return false; }
}

// A tab-local demo checkpoint uses the same validation as a real save, without touching it.
const DEMO_CHECKPOINT_KEY = 'zero_to_beyond_demo_checkpoint_v11';
/** Menu availability only; expensive receipt replay happens when Resume is actually chosen. */
export function hasBrowserDemoCheckpoint(): boolean {
  try {
    return firstCompatibleSave(window.sessionStorage, DEMO_KEYS, 5) !== null;
  }catch{return false;}
}
export function readBrowserDemoSession(): SelectionSession | null {
  try {
    const compatible = firstCompatibleSave(window.sessionStorage, DEMO_KEYS, 5);
    if (!compatible) return null;
    const { raw, envelope } = compatible;
    return { ...readSaved(raw), voiceEnabled: envelope.voiceEnabled !== false, storageAvailable: true };
  } catch { return null; }
}
export function writeBrowserDemoSession(session: Omit<SelectionSession, 'storageAvailable'>): boolean {
  try {
    const storage: StoryStorage = {
      getItem: key => key === FULL_MOON_SAVE_KEY ? window.sessionStorage.getItem(DEMO_CHECKPOINT_KEY) : null,
      setItem: (_key, value) => window.sessionStorage.setItem(DEMO_CHECKPOINT_KEY, value),
    };
    return writeSelectionSession(storage, session.progress, session.voiceEnabled, session.preparation, session.readiness, session.flight, session.moon, session.repair);
  } catch { return false; }
}
