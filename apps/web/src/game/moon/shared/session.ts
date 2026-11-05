import type { PreparationSelection } from '@/game/moon/core/design';
import type { StoryProgress } from '@/game/moon/core/types';
import { CREW_CANDIDATES, crewReport, crewCapabilities, emptyCrew, equipmentIds, equipmentReport, missingEquipment, moonPart } from './catalog';
import type { CrewAssignment, CrewId, MoonObjective } from './catalog';
import { MOON_IMPLEMENTED, MOON_RULES, CREW_PLATFORM } from './rules';
import { defaultFlightPlan, restoreFlightPlan, PLATFORM_MODEL } from './platform';
import type { FlightPlan } from './platform';
import { emptyHuman, restoreHuman, rocketReady } from './validation';
import type { HumanValidation } from './validation';
import { emptyJourney, TRANSFER_MODEL } from '@/game/moon/flight/journey/journey';
import type { JourneyState } from '@/game/moon/flight/journey/journey';
import { emptyLanding } from '@/game/moon/landing/landing';
import type { LandingState } from '@/game/moon/landing/landing';
import { emptySurface } from '@/game/moon/surface/surface';
import type { RoverState } from '@/game/moon/rover/rover';
import type { SurfaceState } from '@/game/moon/surface/surface';
import { emptyScience } from '@/game/moon/science/science';
import type { ScienceState } from '@/game/moon/science/science';
import { emptyReturn } from '@/game/moon/return/return';
import type { ReturnState } from '@/game/moon/return/return';
import { rehearsalBudget } from './resources';
import { geologyBudget } from '@/game/moon/science/geologyBudget';

export type MoonPhase = 'prepare' | 'validate' | 'earth-orbit' | 'transfer' | 'lunar-orbit' | 'descent' | 'surface' | 'ascent' | 'docking' | 'earth-return' | 'reentry' | 'debrief';
export const MOON_PHASE_ORDER: readonly MoonPhase[] = ['prepare', 'validate', 'earth-orbit', 'transfer', 'lunar-orbit', 'descent', 'surface', 'ascent', 'docking', 'earth-return', 'reentry', 'debrief'];
export type MoonSite = 'crater-rim' | 'permanent-shadow' | 'lunar-highlands' | 'ancient-crater' | null;
export type TrajectoryId = 'fast' | 'balanced' | 'efficient';
export interface ScienceObservation {
  id: string; objective: MoonObjective; locationId: string; instrumentId: string; depthCm: number | null;
  kind: 'hydrogen-clue' | 'water-evidence' | 'mineral-evidence' | 'subsurface' | 'seismic' | 'texture';
  confidence: 'low' | 'medium' | 'high'; points: number; transmitted: boolean;
  quality?: 'low' | 'medium' | 'high'; signal?: string; result?: 'confirmed' | 'inconclusive' | 'negative';
  classification?: 'anorthosite' | 'basalt' | 'breccia' | 'inconclusive';
  missionSeconds?: number; sampleId?: string | null; depthRangeCm?: [number, number] | null;
}
export interface MissionResources {
  batteryWh: number; capacityWh: number; roverHealth: number; elapsedMissionSeconds: number;
  upperStagePropellantKg: number | null; descentPropellantKg: number | null;
  platformEnergyWh: number | null; supportUnitsRemaining: number | null;
  ascentPropellantKg: number | null; returnPropellantKg: number | null;
}
export interface MissionCheckpoint { id: string; phase: MoonPhase; designSignature: string; resources: MissionResources }
export interface MissionIncidents { id: string; kind: string; resolved: boolean }
export interface MissionOutcome { status: 'success' | 'partial' | 'safe-return' | 'failed'; reasons: string[]; completionDate?: string }
export interface MoonSession {
  version: 1; rulesVersion: number; architecture: string; objective: MoonObjective | null; site: MoonSite; phase: MoonPhase;
  crew: CrewAssignment; plan: FlightPlan; human: HumanValidation; journey: JourneyState; landing: LandingState;
  rover?: RoverState; surface: SurfaceState; science: ScienceState; returnFlight: ReturnState; geologyPartIds: string[];
  designSignature: string; scenarioSeed: number; trajectory: TrajectoryId | null; resources: MissionResources;
  navigation: { locationId: string; routeIds: string[]; communication: 'connected' | 'blocked' | 'unknown' };
  evidence: ScienceObservation[]; incidents: MissionIncidents[]; checkpoints: MissionCheckpoint[];
  launchSnapshot: { signature: string; platformId: string; equipmentIds: string[]; crew: CrewAssignment } | null;
  outcome: MissionOutcome | null; migration: string;
}

export type MoonEvent =
  | { type: 'moon-assign-crew'; role: 'scientist' | 'support'; id: CrewId }
  | { type: 'moon-remove-crew'; role: 'scientist' | 'support' }
  | { type: 'moon-geology-equipment'; ids: string[] }
  | { type: 'moon-request-phase'; phase: MoonPhase };

export function canEnterMoonPhase(state: MoonSession, phase: MoonPhase): boolean {
  if (phase === 'prepare') return true;
  return MOON_PHASE_ORDER.indexOf(phase) <= MOON_PHASE_ORDER.indexOf(state.phase) + 1;
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
  if (event.type === 'moon-remove-crew') {
    next = { ...state, crew: { ...state.crew, [event.role]: null } };
  }
  if (event.type === 'moon-geology-equipment') {
    if (state.objective !== 'lunar-geology' || event.ids.length > 21 || event.ids.some(id => !moonPart(id)?.tier)) return state;
    if (equipmentReport(event.ids, 'lunar-geology').errors.some(error => error.startsWith('Duplicate') || error.startsWith('Choose one'))) return state;
    next = { ...state, geologyPartIds: [...event.ids] };
  }
  if (next === state) return state;
  return syncMoonDesign({ ...next, designSignature: '' }, progress, preparation);
}

const seedFor = (progress: StoryProgress) => Math.abs(Array.from(progress.playerName || 'guest').reduce((sum: number, ch: string) => ((sum << 5) - sum + ch.charCodeAt(0)) | 0, 7));
const planSite = (progress: StoryProgress) => progress.selections.site === 'permanent-shadow' ? 'permanent-shadow' as const : 'crater-rim' as const;
const planObjective = (progress: StoryProgress) => (progress.selections.objective ?? 'lunar-ice') as MoonObjective;

export function moonDesignSignature(progress: StoryProgress, preparation: PreparationSelection, crew: CrewAssignment, geologyPartIds: string[], plan: FlightPlan = defaultFlightPlan()) {
  const objective = planObjective(progress);
  return JSON.stringify({
    rules: MOON_RULES.version, platform: CREW_PLATFORM.id, player: progress.playerName, gender: progress.playerGender,
    destination: progress.selections.destination ?? null, objective, site: planSite(progress),
    equipment: equipmentIds(preparation, objective ?? 'lunar-ice', geologyPartIds).sort(), depthCm: preparation.drillDepthCm,
    crew: [crew.commander, crew.scientist, crew.support], plan, platformModel: PLATFORM_MODEL.id, transferModel: TRANSFER_MODEL.id,
  });
}

export function createMoonSession(progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  const crew = emptyCrew(), objective = planObjective(progress);
  const geologyPartIds = preparation.sciencePartIds.filter((id: string) => !!moonPart(id)?.tier);
  const report = equipmentReport(equipmentIds(preparation, objective ?? 'lunar-ice', []), objective ?? 'lunar-ice');
  const capacityWh = report.parts.find(part => part.category === 'battery')?.capacityWh ?? 0;
  return {
    version: 1, rulesVersion: MOON_RULES.version, architecture: CREW_PLATFORM.id, objective, site: planSite(progress), phase: 'prepare',
    crew, plan: defaultFlightPlan(), human: emptyHuman(), journey: emptyJourney(), landing: emptyLanding(), surface: emptySurface(), science: emptyScience(), returnFlight: emptyReturn(), geologyPartIds, designSignature: moonDesignSignature(progress, preparation, crew, geologyPartIds), scenarioSeed: seedFor(progress),
    trajectory: null, resources: {
      batteryWh: capacityWh, capacityWh, roverHealth: 100, elapsedMissionSeconds: 0,
      upperStagePropellantKg: null, descentPropellantKg: null, platformEnergyWh: null, supportUnitsRemaining: null, ascentPropellantKg: null, returnPropellantKg: null,
    },
    navigation: { locationId: 'earth-workshop', routeIds: [], communication: 'unknown' },
    evidence: [], incidents: [], checkpoints: [], launchSnapshot: null, outcome: null, migration: 'fresh',
  };
}

/** Only design-time fields restore during preparation modules. Saved flags cannot enable unimplemented human flight/science. */
export function restoreMoonSession(raw: unknown, progress: StoryProgress, preparation: PreparationSelection, legacyInFlight = false): MoonSession {
  const fresh = createMoonSession(progress, preparation);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fresh;
  const saved = raw as Partial<MoonSession>;
  if (saved.version !== 1 || ![1, 2, MOON_RULES.version].includes(saved.rulesVersion as number) || saved.architecture !== CREW_PLATFORM.id) return fresh;
  const crew = emptyCrew();
  for (const role of ['scientist', 'support'] as const) {
    const person = CREW_CANDIDATES.find(person => person.id === saved.crew?.[role]);
    if (person?.role === (role === 'scientist' ? 'science' : 'support')) crew[role] = person.id;
  }
  const geologyPartIds = preparation.sciencePartIds.filter((id: string) => !!moonPart(id)?.tier);
  const plan = restoreFlightPlan(saved.plan);
  const canonical = moonDesignSignature(progress, preparation, crew, geologyPartIds, plan);
  if (saved.designSignature !== canonical) return { ...fresh, crew, plan, designSignature: canonical, migration: saved.migration === 'legacy-design-revalidation' ? saved.migration : 'fresh' };
  const report = equipmentReport(equipmentIds(preparation, fresh.objective ?? 'lunar-ice', geologyPartIds), fresh.objective ?? 'lunar-ice');
  if (report.errors.some(error => error.startsWith('Choose one option'))) return fresh;
  const restored = { ...fresh, crew, plan, geologyPartIds, designSignature: canonical };
  return {
    ...restored, human: restoreHuman(saved.human, restored, preparation, progress.stepId === 'systems-check', progress.stepId === 'rocket-pack', legacyInFlight),
    migration: saved.migration === 'legacy-design-revalidation' ? saved.migration : 'fresh',
  };
}

/** Reconcile every existing workshop/selection action with the same future mission state. */
export function syncMoonDesign(state: MoonSession, progress: StoryProgress, preparation: PreparationSelection): MoonSession {
  const site = planSite(progress);
  const geologyPartIds = preparation.sciencePartIds.filter((id: string) => !!moonPart(id)?.tier);
  const signature = moonDesignSignature(progress, preparation, state.crew, geologyPartIds, state.plan);
  if (signature === state.designSignature) return state;
  const fresh = createMoonSession(progress, preparation);
  return {
    ...fresh, crew: state.crew, plan: state.plan, geologyPartIds, designSignature: signature, site,
    migration: state.migration,
  };
}

export function moonDesignReport(state: MoonSession, preparation: PreparationSelection) {
  const objective = state.objective ?? 'lunar-ice';
  const equipment = equipmentReport(equipmentIds(preparation, objective, state.geologyPartIds), objective);
  const missing = missingEquipment(equipment, objective);
  const crew = crewReport(state.crew);
  const rehearsal = rehearsalBudget(equipment.parts, preparation.drillDepthCm, crewCapabilities(state.crew));
  const issues = [...equipment.errors, ...missing.map(id => `Missing equipment: ${id}`)];
  if (!crew.complete) issues.push('Crew not fully assigned.');
  if (!rehearsal.energyOK || !rehearsal.peakOK) issues.push('Rehearsal simulation failed: battery reserve exhausted.');
  const budget = objective === 'lunar-geology' ? geologyBudget(preparation, state.crew, state.plan) : null;
  if (budget && budget.remaining < 0) issues.push(`Mission budget exceeded by ${Math.abs(budget.remaining)} MC.`);
  return {
    ready: issues.length === 0,
    equipment,
    crew,
    rehearsal,
    budget,
    issues,
    implemented: objective === 'lunar-geology' ? MOON_IMPLEMENTED.geologyScience : MOON_IMPLEMENTED.iceScience,
    rocketReady: rocketReady(state, preparation),
  };
}
