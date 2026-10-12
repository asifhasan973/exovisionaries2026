import { SCRIPT_RESOURCES } from './design.ts';
import type { PreparationSelection } from './design.ts';
import { installedIds, partById, preparationTotals, verifiedActivities, WORKSHOP_STAGES, stageReady } from './preparation.ts';
import type { ActivityId, StoryProgress } from './types.ts';
import { emptyTrial, restoreTrial, trialPassed, trialPlan } from './trial.ts';
import type { TrialState } from './trial.ts';
import { MOON_RULES } from './moon/rules.ts';

export const CHECK_IDS = ['mass-check', 'power-check', 'budget-check'] as const;
export type CheckId = typeof CHECK_IDS[number];
export const PACKING_ACTIONS = ['adapter', 'payload', 'fairing'] as const;
export type PackingAction = typeof PACKING_ACTIONS[number];
export const READINESS_RULES_VERSION = 2;
export const SHADOW_REHEARSAL_MINUTES = MOON_RULES.rehearsalTravelSeconds / 60;
export const RESERVE_FRACTION = MOON_RULES.reserveFraction;
export const FAIRING_SOURCE = 'https://science.nasa.gov/blogs/dart/2021/11/22/nasas-dart-spacecraft-secured-in-payload-fairing-flight-readiness-review-complete/';
export const LAUNCH_CONFIGURATION = Object.freeze({ id: 'robotic-payload-v1', name: 'Robotic launch carrier', included: true,
  allowanceKg: SCRIPT_RESOURCES.payloadMassLimitKg, description: 'Illustrative two-stage carrier with payload adapter and fairing. Launch hardware is supplied outside the equipment budget and mass allowance. Display scale is illustrative; no real vehicle performance or dimensional fit is certified.' });
export interface ReadinessState { checks: Partial<Record<CheckId, string>>; packing: PackingAction[]; signature: string | null; approved: MissionManifest | null; radarConnected: boolean; trial: TrialState }
export function emptyReadiness(): ReadinessState { return { checks: {}, packing: [], signature: null, approved: null, radarConnected: false, trial: emptyTrial() }; }
/** Full canonical content, rather than a collision-prone hash, binds every acknowledgement to this design. */
export function missionSignature(progress: StoryProgress, preparation: PreparationSelection): string {
  return JSON.stringify({ rules: READINESS_RULES_VERSION, name: progress.playerName, destination: progress.selections.destination ?? null,
    objective: progress.selections.objective ?? null, site: progress.selections.site ?? null,
    parts: installedIds(preparation).sort(), depth: preparation.drillDepthCm, carrier: LAUNCH_CONFIGURATION.id });
}
export function evaluateReadiness(progress: StoryProgress, preparation: PreparationSelection) {
  const shadow = progress.selections.site === 'permanent-shadow';
  const totals = preparationTotals(preparation, shadow);
  const complete = WORKSHOP_STAGES.every(stage => stageReady(stage, preparation, progress.selections.objective)) && progress.selections.destination === 'moon'
    && ['lunar-ice', 'lunar-geology'].includes(progress.selections.objective ?? '') && ['crater-rim', 'permanent-shadow'].includes(progress.selections.site ?? '');
  // Conservative rover-only rehearsal: 15 min of other operations plus drilling at full peak, zero solar.
  // No claim about lander battery sizing, mission duration, temperature survival or orbital mechanics.
  const budget = trialPlan(preparation, shadow);
  const rehearsalWh = Math.round(budget.requiredWh * 10) / 10;
  const usableWh = budget.usableWh;
  const batteryOK = budget.energyOK;
  const thermalOK = !shadow || preparation.thermalId === 'advanced-thermal';
  const availableW = budget.availableW;
  return { ...totals, complete, availableW, marginW: availableW - totals.peakW, rehearsalWh, usableWh,
    remainingWh: Math.round((totals.batteryWh - rehearsalWh) * 10) / 10, batteryOK, thermalOK,
    remainingCredits: SCRIPT_RESOURCES.budgetCredits - totals.credits,
    excessKg: Math.max(0, totals.massKg - SCRIPT_RESOURCES.payloadMassLimitKg),
    pass: { 'mass-check': complete && totals.massKg <= SCRIPT_RESOURCES.payloadMassLimitKg,
      'power-check': complete && totals.peakW <= availableW && batteryOK && thermalOK,
      'budget-check': complete && totals.credits <= SCRIPT_RESOURCES.budgetCredits } };
}
export function checkAccepted(id: CheckId, progress: StoryProgress, preparation: PreparationSelection, readiness: ReadinessState) {
  return evaluateReadiness(progress, preparation).pass[id] && readiness.checks[id] === missionSignature(progress, preparation)
    && (id !== 'mass-check' || readiness.radarConnected)
    && (id !== 'power-check' || trialPassed(readiness.trial, missionSignature(progress, preparation), preparation, progress.selections.site === 'permanent-shadow'));
}
export function allChecksAccepted(progress: StoryProgress, preparation: PreparationSelection, readiness: ReadinessState) {
  return CHECK_IDS.every(id => checkAccepted(id, progress, preparation, readiness));
}
export function packingComplete(progress: StoryProgress, preparation: PreparationSelection, readiness: ReadinessState) {
  return allChecksAccepted(progress, preparation, readiness) && readiness.signature === missionSignature(progress, preparation)
    && PACKING_ACTIONS.every((action, i) => readiness.packing[i] === action) && readiness.packing.length === 3;
}
export function missionActivities(progress: StoryProgress, preparation: PreparationSelection, readiness: ReadinessState): ActivityId[] {
  const valid = verifiedActivities(preparation, progress.selections.objective);
  for (const id of CHECK_IDS) { if (!checkAccepted(id, progress, preparation, readiness)) return valid; valid.push(id); }
  if (packingComplete(progress, preparation, readiness)) { valid.push('rocket-pack'); if (readiness.approved?.signature === missionSignature(progress, preparation)) valid.push('launch-ready'); }
  return valid;
}
export interface MissionManifest {
  version: 1; status: 'GAME MISSION APPROVED'; signature: string; commander: string;
  destination: string; objective: string; site: string; drillDepthCm: number | null;
  components: { id: string; name: string; massKg: number; credits: number; nominalPowerW: number }[];
  totals: ReturnType<typeof evaluateReadiness>; launch: typeof LAUNCH_CONFIGURATION;
  assumptions: readonly string[]; scienceEarned: 0;
}
export const READINESS_ASSUMPTIONS = [
  'All mass, credits and electrical loads are source-script values or documented game estimates, not vendor quotes or flight certification.',
  'The 350 kg allowance counts selected lander and rover equipment, including the scripted propulsion game part. Carrier, adapter and fairing are supplied separately.',
  'The rover rehearsal assumes a full battery, zero solar for 15 minutes of non-drilling operation plus the selected drill time, and a 20% battery reserve. It is not a full mission-duration estimate.',
  'Drilling assumes 30 seconds per 10 cm at the complete rover peak load; 175 W replaces the drill’s normal 20 W. Battery discharge ceiling is an authored 450 W rule.',
  'Permanent shadow requires advanced thermal protection in this game; this qualitative equipment rule is not a temperature or thermal-survival simulation. No solar recharge occurs there.',
  'Lander avionics power is a separate descent-mode load. Lander energy storage, propellant sizing, route length, eclipse duration, radio geometry and flight mechanics are not validated here.',
  'Packing uses illustrative folded hardware and a generic two-stage robotic carrier, not a certified dimensional or launch-performance model. Science points remain unearned until exploration.'
] as const;
function freezeSnapshot<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeSnapshot); Object.freeze(value); }
  return value;
}
export function createMissionManifest(progress: StoryProgress, preparation: PreparationSelection): MissionManifest {
  return freezeSnapshot({ version: 1, status: 'GAME MISSION APPROVED', signature: missionSignature(progress, preparation), commander: progress.playerName,
    destination: progress.selections.destination ?? '', objective: progress.selections.objective ?? '', site: progress.selections.site ?? '', drillDepthCm: preparation.drillDepthCm,
    components: installedIds(preparation).sort().map(id => { const p = partById(id)!; return { id, name: p.name, massKg: p.massKg, credits: p.credits, nominalPowerW: p.nominalPowerW }; }),
    totals: evaluateReadiness(progress, preparation), launch: { ...LAUNCH_CONFIGURATION }, assumptions: [...READINESS_ASSUMPTIONS], scienceEarned: 0 });
}
/** Validate against freshly computed values; never trust a saved Approved label. */
export function restoreReadiness(raw: unknown, progress: StoryProgress, preparation: PreparationSelection): ReadinessState {
  const clean = emptyReadiness();
  if (!raw || typeof raw !== 'object') return clean;
  const saved = raw as ReadinessState, signature = missionSignature(progress, preparation), result = evaluateReadiness(progress, preparation);
  clean.radarConnected = saved.radarConnected === true;
  clean.trial = restoreTrial(saved.trial, signature, preparation, progress.selections.site === 'permanent-shadow');
  for (const id of CHECK_IDS) {
    if (saved.checks?.[id] !== signature || !result.pass[id]
      || id === 'mass-check' && !clean.radarConnected
      || id === 'power-check' && !trialPassed(clean.trial, signature, preparation, progress.selections.site === 'permanent-shadow')) return clean;
    clean.checks[id] = signature;
  }
  if (saved.signature === signature && Array.isArray(saved.packing)) {
    clean.signature = signature;
    for (const [i, action] of PACKING_ACTIONS.entries()) { if (saved.packing[i] !== action) break; clean.packing.push(action); }
  }
  if (packingComplete(progress, preparation, clean) && JSON.stringify(saved.approved) === JSON.stringify(createMissionManifest(progress, preparation))) clean.approved = createMissionManifest(progress, preparation);
  return clean;
}
