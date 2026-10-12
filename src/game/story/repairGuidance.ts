import { SCRIPT_RESOURCES } from './design.ts';
import type { DesignCategory, PreparationSelection } from './design.ts';
import { installedIds, installPart, partById, preparationTotals, removePart, STAGE_CATEGORIES, WORKSHOP_PARTS, WORKSHOP_STAGES, partsForObjective, stageReady } from './preparation.ts';
import type { WorkshopStage } from './preparation.ts';
import type { WorkshopSession } from './workshopSession.ts';
import { trialPlan } from './trial.ts';
import { REPAIR_LINES } from './voiceClips.ts';

export type RepairProblem = 'thermal' | 'energy' | 'peak' | 'mass' | 'budget' | 'depth';
export interface RepairGuide {
  problem: RepairProblem; stage: WorkshopStage; category: DesignCategory | 'depth';
  partId?: string; depthCm?: number; action: 'install' | 'remove' | 'depth';
  label: string; voiceId: keyof typeof REPAIR_LINES; text: string;
}
const speech = (id: keyof typeof REPAIR_LINES) => ({ voiceId: id, text: REPAIR_LINES[id] });
const partGuide = (problem: RepairProblem, partId: string, action: 'install' | 'remove' = 'install'): RepairGuide => {
  const part = partById(partId)!;
  const stage = WORKSHOP_STAGES.find(stage => STAGE_CATEGORIES[stage].includes(part.category))!;
  const voiceId = action === 'remove' ? problem === 'budget' ? 'repair-remove-budget' : problem === 'peak' ? 'repair-remove-peak' : 'repair-remove-mass' : `repair-${problem}` as keyof typeof REPAIR_LINES;
  return { problem, stage, category: part.category, partId, action, label: `${action === 'remove' ? 'Remove' : 'Pick'} ${part.name}${part.category === 'battery' ? ' battery' : part.category === 'solar' ? ' solar array' : part.category === 'communication' ? ' radio' : ''}`, ...speech(voiceId) };
};
export function repairApplied(guide: RepairGuide, preparation: PreparationSelection) {
  const totals = preparationTotals(preparation);
  const plan = trialPlan(preparation, false);
  if (guide.problem === 'energy' && plan.requiredWh <= plan.usableWh || guide.problem === 'mass' && totals.massKg <= SCRIPT_RESOURCES.payloadMassLimitKg || guide.problem === 'budget' && totals.credits <= SCRIPT_RESOURCES.budgetCredits || guide.problem === 'peak' && totals.peakW <= SCRIPT_RESOURCES.peakPowerLimitW) return true;
  return guide.action === 'depth' ? (preparation.drillDepthCm ?? 100) <= guide.depthCm!
    : guide.action === 'remove' ? !installedIds(preparation).includes(guide.partId!) : installedIds(preparation).includes(guide.partId!);
}
/** Recompute from the current build. Never remove required instruments or downgrade shadow protection. */
export function recommendRepair(session: WorkshopSession, problem: RepairProblem): RepairGuide | null {
  const { preparation } = session;
  const shadow = session.progress.selections.site === 'permanent-shadow';
  const plan = trialPlan(preparation, shadow);
  if (problem === 'thermal') return !plan.thermalOK ? partGuide(problem, 'advanced-thermal') : null;
  if (problem === 'energy') {
    if (plan.requiredWh <= plan.usableWh) return null;
    const batteries = WORKSHOP_PARTS.filter(part => part.category === 'battery' && (part.capacityWh ?? 0) > plan.batteryWh)
      .sort((a, b) => (a.capacityWh ?? 0) - (b.capacityWh ?? 0));
    const sufficient = batteries.find(part => { const trial = trialPlan(installPart(preparation, part.id), shadow); return trial.requiredWh <= trial.usableWh; });
    return sufficient ? partGuide(problem, sufficient.id) : recommendRepair(session, 'depth');
  }
  if (problem === 'depth') {
    // Choose the deepest shorter plan that fits, retaining the player's science potential where possible.
    for (let cm = (preparation.drillDepthCm ?? 20) - 10; cm >= 10; cm -= 10) {
      const shorter = trialPlan({ ...preparation, drillDepthCm: cm }, shadow);
      if (shorter.requiredWh <= shorter.usableWh) return { problem, stage: 'science-build', category: 'depth', action: 'depth', depthCm: cm, label: `Drill ${cm} cm or less`, ...speech('repair-depth') };
    }
    return null;
  }
  const totals = preparationTotals(preparation, shadow);
  const metric = problem === 'mass' ? 'massKg' : problem === 'budget' ? 'credits' : 'peakW';
  const limit = problem === 'mass' ? SCRIPT_RESOURCES.payloadMassLimitKg : problem === 'budget' ? SCRIPT_RESOURCES.budgetCredits : SCRIPT_RESOURCES.peakPowerLimitW;
  if (totals[metric] <= limit) return null;
  const installed = installedIds(preparation);
  const objective = session.progress.selections.objective ?? 'lunar-ice';
  const currentStageIndex = WORKSHOP_STAGES.findIndex(stage => stage === session.progress.stepId);
  const candidates: { id: string; action: 'install' | 'remove'; value: number; loss: number; energySafe: boolean }[] = [];
  for (const part of partsForObjective(objective)) {
    const partStageIndex = WORKSHOP_STAGES.findIndex(stage => STAGE_CATEGORIES[stage].includes(part.category));
    if (currentStageIndex >= 0 && partStageIndex > currentStageIndex) continue;
    const remove = (part.id === 'msolo' || !!part.objective) && installed.includes(part.id);
    const replace = !installed.includes(part.id) && (part.replaceGroup
      ? installed.some(id => partById(id)?.replaceGroup === part.replaceGroup)
      : !['science', 'lander'].includes(part.category) && installed.some(id => partById(id)?.category === part.category));
    if (!remove && !replace || shadow && part.id === 'basic-thermal') continue;
    const changed = remove ? removePart(preparation, part.id) : installPart(preparation, part.id);
    if (part.objective && !stageReady('science-build', changed, objective)) continue;
    const next = preparationTotals(changed, shadow), nextPlan = trialPlan(changed, shadow);
    if (next[metric] >= totals[metric]) continue;
    candidates.push({ id: part.id, action: remove ? 'remove' : 'install', value: next[metric], loss: Math.max(0, totals.potentialScience - next.potentialScience), energySafe: nextPlan.requiredWh <= nextPlan.usableWh });
  }
  candidates.sort((a, b) => Number(b.value <= limit) - Number(a.value <= limit) || Number(b.energySafe) - Number(a.energySafe) || (a.value <= limit && b.value <= limit ? a.loss - b.loss : a.value - b.value));
  const best = candidates[0];
  return best ? partGuide(problem, best.id, best.action) : null;
}
export const REPAIR_TITLES: Record<RepairProblem, string> = {
  thermal: 'Too cold!', energy: 'Not enough battery!', peak: 'Too much power at once!',
  mass: 'Too heavy!', budget: 'Over budget!', depth: 'Drill less, save energy!',
};
