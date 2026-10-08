import { preparationTotals } from './preparation.ts';
import type { PreparationSelection } from './design.ts';

export type TrialPhase = 'ready' | 'outbound' | 'at-sample' | 'drilling' | 'sampled' | 'returning' | 'complete' | 'failed';
export type TrialFault = 'energy' | 'thermal' | 'peak' | null;
export interface TrialState { signature: string | null; phase: TrialPhase; progress: number; spentWh: number; paused: boolean; fault: TrialFault }
export type TrialEvent = { type: 'trial-drive' | 'trial-drill' | 'trial-return' | 'trial-retry' | 'trial-pause' | 'trial-resume' } | { type: 'trial-tick'; seconds: number };
export const emptyTrial = (): TrialState => ({ signature: null, phase: 'ready', progress: 0, spentWh: 0, paused: false, fault: null });
export const trialActive = (state: TrialState) => ['outbound', 'drilling', 'returning'].includes(state.phase);
/** Zero solar, 7.5 minutes each way, selected drilling depth, 20% reserve. Game rehearsal only. */
export function trialPlan(preparation: PreparationSelection, shadowSite: boolean) {
  const totals = preparationTotals(preparation, true);
  return { batteryWh: totals.batteryWh, usableWh: totals.batteryWh * .8, legWh: totals.normalW / 8,
    drillWh: totals.peakW * totals.drillMinutes / 60, drillSeconds: Math.max(1, totals.drillMinutes),
    thermalOK: !shadowSite || preparation.thermalId === 'advanced-thermal', peakOK: totals.peakW <= 450,
    requiredWh: totals.normalW / 4 + totals.peakW * totals.drillMinutes / 60 };
}
function phaseEnergy(state: TrialState, plan: ReturnType<typeof trialPlan>) {
  switch (state.phase) {
    case 'outbound': return plan.legWh * state.progress;
    case 'at-sample': return plan.legWh;
    case 'drilling': return plan.legWh + plan.drillWh * state.progress;
    case 'sampled': return plan.legWh + plan.drillWh;
    case 'returning': return plan.legWh + plan.drillWh + plan.legWh * state.progress;
    case 'complete': return plan.requiredWh;
    default: return 0;
  }
}
export function trialPassed(state: TrialState, signature: string, preparation: PreparationSelection, shadowSite: boolean) {
  const plan = trialPlan(preparation, shadowSite);
  return state.signature === signature && state.phase === 'complete' && state.progress === 1 && !state.fault
    && plan.thermalOK && plan.peakOK && plan.requiredWh <= plan.usableWh && Math.abs(state.spentWh - plan.requiredWh) < .001;
}
export function reduceTrial(state: TrialState, event: TrialEvent, signature: string, preparation: PreparationSelection, shadowSite: boolean): TrialState {
  if (event.type === 'trial-retry') return emptyTrial();
  const plan = trialPlan(preparation, shadowSite);
  if (event.type === 'trial-drive') {
    if (state.phase !== 'ready' || !plan.batteryWh) return state;
    return { ...emptyTrial(), signature, phase: plan.thermalOK ? 'outbound' : 'failed', fault: plan.thermalOK ? null : 'thermal' };
  }
  if (state.signature !== signature) return emptyTrial();
  if (event.type === 'trial-pause') return trialActive(state) ? { ...state, paused: true } : state;
  if (event.type === 'trial-resume') return { ...state, paused: false };
  if (event.type === 'trial-drill') return state.phase === 'at-sample' ? { ...state, phase: plan.peakOK ? 'drilling' : 'failed', progress: 0, fault: plan.peakOK ? null : 'peak' } : state;
  if (event.type === 'trial-return') return state.phase === 'sampled' ? { ...state, phase: 'returning', progress: 0 } : state;
  if (event.type !== 'trial-tick' || !trialActive(state) || state.paused || !Number.isFinite(event.seconds) || event.seconds <= 0) return state;
  const duration = state.phase === 'drilling' ? plan.drillSeconds : 2;
  const progress = Math.min(1, state.progress + Math.min(.25, event.seconds) / duration);
  const next = { ...state, progress };
  const spentWh = phaseEnergy(next, plan);
  if (spentWh > plan.usableWh + .00001) return { ...next, phase: 'failed', spentWh: plan.usableWh, fault: 'energy' };
  const phase = progress === 1 ? state.phase === 'outbound' ? 'at-sample' : state.phase === 'drilling' ? 'sampled' : 'complete' : state.phase;
  return { ...next, phase, spentWh };
}
export function restoreTrial(raw: unknown, signature: string, preparation: PreparationSelection, shadowSite: boolean): TrialState {
  if (!raw || typeof raw !== 'object') return emptyTrial();
  const state = raw as TrialState;
  if (state.signature !== signature || !['outbound', 'at-sample', 'drilling', 'sampled', 'returning', 'complete', 'failed'].includes(state.phase)
    || !Number.isFinite(state.progress) || state.progress < 0 || state.progress > 1 || !Number.isFinite(state.spentWh) || state.spentWh < 0) return emptyTrial();
  const plan = trialPlan(preparation, shadowSite);
  if (state.phase === 'failed') return emptyTrial();
  if (state.fault !== null || !plan.thermalOK || !plan.peakOK || state.spentWh > plan.usableWh + .00001
    || Math.abs(state.spentWh - phaseEnergy(state, plan)) > .001 || ['at-sample', 'sampled', 'complete'].includes(state.phase) && state.progress !== 1) return emptyTrial();
  return { ...state, paused: trialActive(state), fault: null };
}
