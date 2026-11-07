import { getStoryStep } from '@/game/moon/core/flow';
import {
  installPart,
  partById,
  quickPreparation,
  removePart,
  stageReady,
  STAGE_CATEGORIES,
  verifiedActivities,
  WORKSHOP_STAGES,
  partsForObjective,
  selectedDrill,
} from '@/game/moon/core/preparation';
import type { WorkshopStage } from '@/game/moon/core/preparation';
import { crewReport, crewCapabilities } from '@/game/moon/shared/catalog';
import { humanCheckAccepted } from '@/game/moon/shared/validation';
import { MOON_IMPLEMENTED } from '@/game/moon/shared/rules';
import { reduceStoryProgress } from '@/game/moon/core/progress';
import type { StoryEvent, StoryProgress } from '@/game/moon/core/types';
import { emptyReadiness, missionSignature, checkAccepted } from '@/game/moon/readiness/readiness';
import type { PackingAction } from '@/game/moon/readiness/readiness';
import { reduceTrial, trialPassed } from '@/game/moon/hazards/trial';
import type { TrialEvent } from '@/game/moon/hazards/trial';
import { syncMoonDesign } from '@/game/moon/shared/session';
import { emptyFlight, launchAuthorized, reduceFlight } from '@/game/moon/flight/launch/flight';
import type { FlightEvent } from '@/game/moon/flight/launch/flight';
import { resetDeparture } from '@/game/moon/flight/journey/journeySession';
import { recommendRepair, repairApplied } from '@/game/moon/hazards/repairGuidance';
import type { RepairProblem } from '@/game/moon/hazards/repairGuidance';
import { createPreparationSelection } from '@/game/moon/core/design';
import type { PreparationSelection } from '@/game/moon/core/design';
import type { WorkshopSession } from './workshopSession';
import {
  handleWorkshopRunCheck,
  handleWorkshopPack,
  handleWorkshopNextActivity,
  handleWorkshopBack,
  handleWorkshopMissionChange,
} from './workshopGates';

export type WorkshopEvent =
  | StoryEvent
  | FlightEvent
  | TrialEvent
  | { type: 'connect-radar' }
  | { type: 'install'; ids: string[] }
  | { type: 'remove'; id: string }
  | { type: 'depth'; cm: number }
  | { type: 'fix-problem'; problem: RepairProblem }
  | { type: 'repair-recheck' }
  | { type: 'run-check' }
  | { type: 'pack'; action: PackingAction }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'quick-build' }
  | { type: 'begin-auto-build' }
  | { type: 'visit-stage'; stage: WorkshopStage };

export function withPreparation(session: WorkshopSession, preparation: PreparationSelection, record = true): WorkshopSession {
  if (preparation === session.preparation || JSON.stringify(preparation) === JSON.stringify(session.preparation)) return session;
  const valid = verifiedActivities(preparation, session.progress.selections.objective);
  const updated: WorkshopSession = {
    ...session,
    preparation,
    readiness: emptyReadiness(),
    flight: emptyFlight(),
    progress: { ...session.progress, completedActivities: session.progress.completedActivities.filter(id => valid.includes(id)) },
    past: record ? [...session.past.slice(-29), session.preparation] : session.past,
    future: record ? [] : session.future,
  };
  if (session.repair && !repairApplied(session.repair, preparation, session.moon.crew, session.progress.selections.objective ?? 'lunar-ice', session.moon.plan)) {
    const context = session.repair.fromChecks ? { ...updated, progress: { ...updated.progress, stepId: 'mass-check' as const } } : updated;
    const guide = recommendRepair(context, session.repair.problem);
    if (guide) return { ...updated, repair: { ...guide, fromChecks: session.repair.fromChecks }, progress: { ...updated.progress, stepId: guide.stage, lineIndex: 0 } };
  }
  return updated;
}

export function reduceWorkshopMission(session: WorkshopSession, event: WorkshopEvent): WorkshopSession {
  const step = getStoryStep(session.progress.stepId);
  const objective = session.progress.selections.objective ?? 'lunar-ice';
  const ready = (id: Parameters<typeof stageReady>[0], preparation = session.preparation) => stageReady(id, preparation, objective);
  const stage = WORKSHOP_STAGES.find(id => id === step.id);
  if (event.type === 'fix-problem') {
    if (step.module !== 6 && !stage) return session;
    const repair = recommendRepair(session, event.problem);
    if (!repair || (stage && WORKSHOP_STAGES.indexOf(repair.stage) > WORKSHOP_STAGES.indexOf(stage))) return session;
    return {
      ...session,
      repair: { ...repair, fromChecks: step.module === 6 },
      progress: {
        ...session.progress,
        stepId: repair.stage,
        lineIndex: 0,
        history: [...session.progress.history, { stepId: step.id, lineIndex: session.progress.lineIndex }],
      },
    };
  }
  if (event.type === 'repair-recheck') {
    if (!stage || !session.repair || !repairApplied(session.repair, session.preparation, session.moon.crew, session.progress.selections.objective ?? 'lunar-ice', session.moon.plan) || !WORKSHOP_STAGES.every(id => ready(id))) return session;
    const target = MOON_IMPLEMENTED.readiness && crewReport(session.moon.crew).complete ? 'crew-check' : 'crew-briefing';
    return {
      ...session,
      repair: undefined,
      progress: {
        ...session.progress,
        stepId: target,
        lineIndex: 0,
        completedActivities: target === 'crew-check' ? [...new Set([...session.progress.completedActivities, 'crew-selection' as const, 'crew-plan' as const])] : session.progress.completedActivities,
        history: [...session.progress.history, { stepId: step.id, lineIndex: 0 }],
      },
    };
  }
  if (event.type === 'connect-radar') return step.id === 'mass-check' ? { ...session, readiness: { ...session.readiness, radarConnected: true } } : session;
  if (event.type.startsWith('trial-')) {
    if (step.id !== 'power-check' || !humanCheckAccepted('crew-check', session.moon, session.preparation) || !checkAccepted('mass-check', session.progress, session.preparation, session.readiness, session.moon)) return session;
    const trial = reduceTrial(session.readiness.trial, event as TrialEvent, missionSignature(session.progress, session.preparation, session.moon), session.preparation, session.progress.selections.site === 'permanent-shadow', crewCapabilities(session.moon.crew));
    const updated = { ...session, readiness: { ...session.readiness, trial } };
    return trialPassed(trial, missionSignature(session.progress, session.preparation, session.moon), session.preparation, session.progress.selections.site === 'permanent-shadow', crewCapabilities(session.moon.crew))
      ? reduceWorkshopMission(updated, { type: 'run-check' })
      : updated;
  }
  if (event.type.startsWith('flight-')) {
    if (!['liftoff', 'earth-orbit'].includes(step.id) || !launchAuthorized(session.progress, session.preparation, session.readiness, session.moon)) return session;
    if (step.id === 'earth-orbit' && event.type !== 'flight-replay') return session;
    const flight = reduceFlight(session.flight, event as FlightEvent, missionSignature(session.progress, session.preparation, session.moon));
    return {
      ...session,
      flight,
      moon: event.type === 'flight-replay' ? resetDeparture(session) : session.moon,
      progress: event.type === 'flight-replay'
        ? {
            ...session.progress,
            stepId: 'liftoff',
            history: session.progress.history.filter(cursor => cursor.stepId !== 'liftoff' && cursor.stepId !== 'earth-orbit'),
            completedActivities: session.progress.completedActivities.filter(id => id !== 'liftoff'),
          }
        : session.progress,
    };
  }
  if (event.type === 'install') {
    if (!stage) return session;
    const options = new Set(partsForObjective(objective).map(part => part.id));
    const allowed = event.ids.filter(id => {
      const p = partById(id);
      return p && options.has(id) && STAGE_CATEGORIES[stage].includes(p.category);
    });
    return withPreparation(session, allowed.reduce(installPart, session.preparation));
  }
  if (event.type === 'remove') {
    const part = partById(event.id);
    if (!stage || !part || !STAGE_CATEGORIES[stage].includes(part.category)) return session;
    return withPreparation(session, removePart(session.preparation, event.id));
  }
  if (event.type === 'depth') {
    const drill = selectedDrill(session.preparation);
    if (stage !== 'science-build' || !drill || !Number.isInteger(event.cm) || event.cm < 10 || event.cm > (drill.maxDepthCm ?? 100) || event.cm % 10) return session;
    return withPreparation(session, { ...session.preparation, drillDepthCm: event.cm });
  }
  if (event.type === 'undo' || event.type === 'redo') {
    if (!stage) return session;
    const list = event.type === 'undo' ? session.past : session.future;
    const snapshot = list.at(-1);
    if (!snapshot) return session;
    const restored = withPreparation(session, snapshot, false);
    const currentIndex = WORKSHOP_STAGES.indexOf(stage);
    const earlier = WORKSHOP_STAGES.find((id, index) => index < currentIndex && !ready(id, snapshot));
    return {
      ...restored,
      progress: earlier ? { ...restored.progress, stepId: earlier, lineIndex: 0 } : restored.progress,
      past: event.type === 'undo' ? session.past.slice(0, -1) : [...session.past, session.preparation],
      future: event.type === 'redo' ? session.future.slice(0, -1) : [...session.future, session.preparation],
    };
  }
  if (event.type === 'begin-auto-build') {
    if (!stage && step.id !== 'resource-limits') return session;
    const preparation = createPreparationSelection();
    const progress: StoryProgress = {
      ...session.progress,
      stepId: 'lander-build',
      lineIndex: 0,
      completedActivities: ['resource-limits'],
      assistance: [...new Set([...(session.progress.assistance ?? []), 'auto-build' as const])],
      history: session.progress.history.filter(cursor => getStoryStep(cursor.stepId).module < 5),
    };
    return {
      ...session,
      repair: undefined,
      preparation,
      progress,
      moon: syncMoonDesign(session.moon, progress, preparation),
      past: [],
      future: [],
      readiness: emptyReadiness(),
      flight: emptyFlight(),
    };
  }
  if (event.type === 'quick-build') {
    if (!stage && step.id !== 'resource-limits') return session;
    const updated = withPreparation(session, quickPreparation(objective));
    let progress: StoryProgress = {
      ...updated.progress,
      assistance: [...new Set([...(updated.progress.assistance ?? []), 'auto-build' as const])],
      completedActivities: verifiedActivities(updated.preparation, objective),
    };
    while (progress.stepId !== 'crew-selection') {
      const next = reduceStoryProgress(progress, { type: getStoryStep(progress.stepId).kind === 'conversation' ? 'skip-briefing' : 'next' });
      if (next.stepId === progress.stepId) break;
      progress = next;
    }
    return { ...updated, progress };
  }
  if (event.type === 'visit-stage') {
    if (![6, 8].includes(getStoryStep(step.id).module) && !stage) return session;
    const currentIndex = stage ? WORKSHOP_STAGES.indexOf(stage) : WORKSHOP_STAGES.length;
    const targetIndex = WORKSHOP_STAGES.indexOf(event.stage);
    if (targetIndex > currentIndex) return session;
    return {
      ...session,
      repair: undefined,
      progress: {
        ...session.progress,
        stepId: event.stage,
        lineIndex: 0,
        history: [...session.progress.history, { stepId: step.id, lineIndex: session.progress.lineIndex }],
      },
    };
  }
  if (event.type === 'run-check') return handleWorkshopRunCheck(session, step.id);
  if (event.type === 'pack') return handleWorkshopPack(session, step.id, event.action);
  if (event.type === 'complete-activity') return session;
  if (event.type === 'next' && step.kind === 'activity') return handleWorkshopNextActivity(session, step, objective);
  const progress = reduceStoryProgress(session.progress, event as StoryEvent);
  if (event.type === 'back') return handleWorkshopBack(session, progress, objective);
  return handleWorkshopMissionChange(session, progress, objective);
}
