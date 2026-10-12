import type { PreparationSelection } from '../design.ts';
import type { StoryProgress } from '../types.ts';
import { CREW_CANDIDATES, crewReport, emptyCrew, equipmentIds, equipmentReport, missingEquipment, moonPart } from './catalog.ts';
import type { CrewAssignment, CrewId, MoonObjective } from './catalog.ts';
import { MOON_IMPLEMENTED, MOON_RULES, CREW_PLATFORM } from './rules.ts';
import { rehearsalBudget } from './resources.ts';

export type MoonPhase = 'prepare' | 'validate' | 'earth-orbit' | 'transfer' | 'lunar-orbit' | 'descent' | 'surface' | 'ascent' | 'docking' | 'earth-return' | 'reentry' | 'debrief';
export const MOON_PHASE_ORDER: readonly MoonPhase[] = ['prepare', 'validate', 'earth-orbit', 'transfer', 'lunar-orbit', 'descent', 'surface', 'ascent', 'docking', 'earth-return', 'reentry', 'debrief'];
export type MoonSite = 'crater-rim' | 'permanent-shadow' | null;
export type TrajectoryId = 'fast' | 'balanced' | 'efficient';
export interface ScienceObservation {
  id: string; objective: MoonObjective; locationId: string; instrumentId: string; depthCm: number | null;
  kind: 'hydrogen-clue' | 'water-evidence' | 'mineral-evidence' | 'subsurface' | 'seismic';
  confidence: 'low' | 'medium' | 'high'; points: number; transmitted: boolean;
}
export interface MissionResources {
  batteryWh: number; capacityWh: number; roverHealth: number; elapsedMissionSeconds: number;
  supportUnitsRemaining: number | null; ascentPropellantKg: number | null; returnPropellantKg: number | null;
}
export interface MoonCheckpoint { id: string; phase: MoonPhase; designSignature: string; resources: MissionResources }
export interface MoonSession {
  version: 1; rulesVersion: 1; architecture: typeof CREW_PLATFORM.id;
  objective: MoonObjective | null; site: MoonSite; phase: MoonPhase; designSignature: string;
  crew: CrewAssignment; geologyPartIds: string[]; scenarioSeed: number;
  trajectory: TrajectoryId | null; resources: MissionResources;
  navigation: { locationId: string; routeIds: string[]; communication: 'unknown' | 'connected' | 'blocked' };
  evidence: ScienceObservation[]; incidents: { id: string; kind: string; resolved: boolean }[];
  checkpoints: MoonCheckpoint[];
  launchSnapshot: { signature: string; platformId: string; equipmentIds: string[]; crew: CrewAssignment } | null;
  outcome: { status: 'success' | 'partial' | 'safe-return'; reasons: string[] } | null;
  migration: 'fresh' | 'legacy-design-revalidation';
}
export type MoonEvent = { type: 'moon-assign-crew'; role: 'scientist' | 'support'; id: CrewId }
  | { type: 'moon-geology-equipment'; ids: string[] }
  | { type: 'moon-request-phase'; phase: MoonPhase };

function planObjective(progress: StoryProgress): MoonObjective | null {
  return progress.selections.objective === 'lunar-ice' || progress.selections.objective === 'lunar-geology' ? progress.selections.objective : null;
}
function planSite(progress: StoryProgress): MoonSite {
  return progress.selections.site === 'crater-rim' || progress.selections.site === 'permanent-shadow' ? progress.selections.site : null;
}
function seedFor(progress: StoryProgress) {
  // Stable across reloads. Not wall-clock or Math.random-based incident rerolling.
  let seed = 2166136261;
  for (const char of `${progress.playerName}|${progress.selections.objective}|${progress.selections.site}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}
export function moonDesignSignature(progress: StoryProgress, preparation: PreparationSelection, crew: CrewAssignment, geologyPartIds: string[]) {
  const objective = planObjective(progress);
  return JSON.stringify({ rules: MOON_RULES.version, platform: CREW_PLATFORM.id, player: progress.playerName, gender: progress.playerGender,
    destination: progress.selections.destination ?? null, objective, site: planSite(progress),
    equipment: equipmentIds(preparation, objective ?? 'lunar-ice', geologyPartIds).sort(), depthCm: preparation.drillDepthCm,
    crew: [crew.commander, crew.scientist, crew.support] });
}
export function createMoonSession(progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  const crew = emptyCrew(), objective = planObjective(progress);
  const report = equipmentReport(equipmentIds(preparation, objective ?? 'lunar-ice', []), objective ?? 'lunar-ice');
  const capacityWh = report.parts.find(part => part.category === 'battery')?.capacityWh ?? 0;
  return { version: 1, rulesVersion: 1, architecture: CREW_PLATFORM.id, objective, site: planSite(progress), phase: 'prepare',
    crew, geologyPartIds: [], designSignature: moonDesignSignature(progress, preparation, crew, []), scenarioSeed: seedFor(progress),
    trajectory: null, resources: { batteryWh: capacityWh, capacityWh, roverHealth: 100, elapsedMissionSeconds: 0,
      supportUnitsRemaining: null, ascentPropellantKg: null, returnPropellantKg: null },
    navigation: { locationId: 'earth-workshop', routeIds: [], communication: 'unknown' },
    evidence: [], incidents: [], checkpoints: [], launchSnapshot: null, outcome: null, migration: 'fresh' };
}

/** Only design-time fields restore in Module 1. Saved flags cannot enable unimplemented human flight/science. */
export function restoreMoonSession(raw: unknown, progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  const fresh = createMoonSession(progress, preparation);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fresh;
  const saved = raw as Partial<MoonSession>;
  if (saved.version !== 1 || saved.rulesVersion !== MOON_RULES.version || saved.architecture !== CREW_PLATFORM.id) return fresh;
  const crew = emptyCrew();
  for (const role of ['scientist', 'support'] as const) {
    const person = CREW_CANDIDATES.find(person => person.id === saved.crew?.[role]);
    if (person?.role === (role === 'scientist' ? 'science' : 'support')) crew[role] = person.id;
  }
  const geologyPartIds = Array.isArray(saved.geologyPartIds) ? [...new Set(saved.geologyPartIds.slice(0, 21)
    .filter((id): id is string => typeof id === 'string' && !!moonPart(id)?.tier))] : [];
  const canonical = moonDesignSignature(progress, preparation, crew, geologyPartIds);
  // A changed underlying design invalidates even formerly valid specialist/payload selections.
  if (saved.designSignature !== canonical) return { ...fresh, migration: saved.migration === 'legacy-design-revalidation' ? saved.migration : 'fresh' };
  const report = equipmentReport(equipmentIds(preparation, fresh.objective ?? 'lunar-ice', geologyPartIds), fresh.objective ?? 'lunar-ice');
  if (report.errors.some(error => error.startsWith('Choose one option'))) return fresh;
  return { ...fresh, crew, geologyPartIds, designSignature: canonical,
    migration: saved.migration === 'legacy-design-revalidation' ? saved.migration : 'fresh' };
}

/** Reconcile every existing workshop/selection action with the same future mission state. */
export function syncMoonDesign(state: MoonSession, progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  const objective = planObjective(progress), site = planSite(progress);
  const geologyPartIds = objective === state.objective ? state.geologyPartIds : [];
  const signature = moonDesignSignature(progress, preparation, state.crew, geologyPartIds);
  if (signature === state.designSignature) return state;
  const fresh = createMoonSession(progress, preparation);
  return { ...fresh, crew: state.crew, geologyPartIds, designSignature: signature, site,
    migration: state.migration };
}

export function moonDesignReport(state: MoonSession, preparation: PreparationSelection) {
  const objective = state.objective ?? 'lunar-ice';
  const equipment = equipmentReport(equipmentIds(preparation, objective, state.geologyPartIds), objective);
  const missing = missingEquipment(equipment, objective);
  const crew = crewReport(state.crew);
  const rehearsal = rehearsalBudget(equipment.parts, preparation.drillDepthCm);
  const issues = [...equipment.errors, ...missing.map(id => `Missing equipment: ${id}`)];
  if (!state.objective || !state.site) issues.push('Choose a mission objective and site.');
  if (equipment.parts.some(part => part.id === 'trident' || part.family === 'drill') && preparation.drillDepthCm === null) issues.push('Choose a drill depth.');
  if (!crew.complete) issues.push('Assign a science and an orbit-support specialist.');
  if (crew.credits > MOON_RULES.crewCredits) issues.push('Crew exceeds its separate credit allocation.');
  if (state.site === 'permanent-shadow' && !equipment.parts.some(part => part.id === 'advanced-thermal')) issues.push('Deep shadow needs advanced thermal protection.');
  if (!rehearsal.peakOK) issues.push('Battery cannot support the simultaneous peak load.');
  if (!rehearsal.energyOK) issues.push('Rehearsal needs more energy while preserving return reserve.');
  return { equipment, crew, rehearsal, issues, designReady: issues.length === 0,
    crewedDepartureAuthorized: false as const,
    platformIssues: ['Crewed departure awaits platform propellant, life-support duration, return validation and playable crew readiness.'],
    earnedScience: state.evidence.reduce((sum, observation) => sum + observation.points, 0) };
}

export function canEnterMoonPhase(state: MoonSession, target: MoonPhase): boolean {
  const index = MOON_PHASE_ORDER.indexOf(state.phase);
  if (target !== MOON_PHASE_ORDER[index + 1]) return false;
  const implemented = target === 'validate' ? MOON_IMPLEMENTED.crewDeparture
    : ['earth-orbit', 'transfer', 'lunar-orbit'].includes(target) ? MOON_IMPLEMENTED.journey
    : target === 'descent' ? MOON_IMPLEMENTED.landing
    : target === 'surface' ? MOON_IMPLEMENTED.surface : MOON_IMPLEMENTED.return;
  if (!implemented) return false;
  // A valid human manifest is required beyond preparation; legacy robotic flags cannot satisfy it.
  return target === 'validate' ? crewReport(state.crew).complete
    : !!state.launchSnapshot && state.launchSnapshot.signature === state.designSignature
      && state.launchSnapshot.platformId === CREW_PLATFORM.id;
}

export function reduceMoonSession(state: MoonSession, event: MoonEvent, progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  if (event.type === 'moon-request-phase') return canEnterMoonPhase(state, event.phase) ? { ...state, phase: event.phase } : state;
  if (state.phase !== 'prepare') return state;
  let next = state;
  if (event.type === 'moon-assign-crew') {
    const person = CREW_CANDIDATES.find(person => person.id === event.id);
    if (person?.role !== (event.role === 'scientist' ? 'science' : 'support')) return state;
    next = { ...state, crew: { ...state.crew, [event.role]: event.id } };
  }
  if (event.type === 'moon-geology-equipment') {
    if (state.objective !== 'lunar-geology' || event.ids.length > 21 || event.ids.some(id => !moonPart(id)?.tier)) return state;
    if (equipmentReport(event.ids, 'lunar-geology').errors.some(error => error.startsWith('Duplicate') || error.startsWith('Choose one'))) return state;
    next = { ...state, geologyPartIds: [...event.ids] };
  }
  if (next === state) return state;
  // Recompute rather than retaining validation/checkpoints from a previous crew or payload.
  return syncMoonDesign({ ...next, designSignature: '' }, progress, preparation);
}
