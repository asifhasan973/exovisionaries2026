import { recommendRepair, repairApplied } from './repairGuidance.ts';
import type { RepairGuide, RepairProblem } from './repairGuidance.ts';
import { emptyFlight, reduceFlight, launchAuthorized, flightComplete } from './flight.ts';
import type { FlightState, FlightEvent } from './flight.ts';
import { createPreparationSelection } from './design.ts';
import type { PreparationSelection } from './design.ts';
import { getStoryStep } from './flow.ts';
import { installPart, partById, quickPreparation, removePart, stageReady, STAGE_CATEGORIES, verifiedActivities, WORKSHOP_STAGES, partsForObjective, normalizeObjective, selectedDrill } from './preparation.ts';
import { crewReport } from './moon/catalog.ts';
import { MOON_IMPLEMENTED } from './moon/rules.ts';
import { reduceStoryProgress } from './progress.ts';
import type { StoryEvent, StoryProgress } from './types.ts';
import type { WorkshopStage } from './preparation.ts';
import { emptyReadiness, CHECK_IDS, checkAccepted, allChecksAccepted, evaluateReadiness, missionActivities, missionSignature, PACKING_ACTIONS, packingComplete, createMissionManifest } from './readiness.ts';
import type { ReadinessState, PackingAction } from './readiness.ts';
import { reduceTrial, trialPassed } from './trial.ts';
import type { TrialEvent } from './trial.ts';
import { createMoonSession, reduceMoonSession, syncMoonDesign } from './moon/session.ts';
import type { MoonEvent, MoonSession } from './moon/session.ts';

export interface WorkshopSession { repair?: RepairGuide; progress: StoryProgress; preparation: PreparationSelection; past: PreparationSelection[]; future: PreparationSelection[]; readiness: ReadinessState; flight: FlightState; moon: MoonSession }
type WorkshopEvent = StoryEvent | FlightEvent | TrialEvent | { type: 'connect-radar' } | { type: 'install'; ids: string[] } | { type: 'remove'; id: string } | { type: 'depth'; cm: number }
  | { type: 'fix-problem'; problem: RepairProblem } | { type: 'repair-recheck' } | { type: 'run-check' } | { type: 'pack'; action: PackingAction } | { type: 'undo' } | { type: 'redo' } | { type: 'quick-build' } | { type: 'begin-auto-build' } | { type: 'visit-stage'; stage: WorkshopStage };
export type MissionEvent = WorkshopEvent | MoonEvent;
export function createWorkshopSession(progress: StoryProgress, preparation = createPreparationSelection(), readiness = emptyReadiness(), flight = emptyFlight(), moon = createMoonSession(progress, preparation)): WorkshopSession {
  const session: WorkshopSession = { progress, preparation, readiness, flight, moon: syncMoonDesign(moon, progress, preparation), past: [], future: [] };
  return progress.stepId === 'power-check' && trialPassed(readiness.trial, missionSignature(progress, preparation), preparation, progress.selections.site === 'permanent-shadow')
    ? reduceMission(session, { type: 'run-check' }) : session;
}
function withPreparation(session: WorkshopSession, preparation: PreparationSelection, record = true): WorkshopSession {
  if (preparation === session.preparation || JSON.stringify(preparation) === JSON.stringify(session.preparation)) return session;
  const valid = verifiedActivities(preparation, session.progress.selections.objective);
  return { ...session, preparation, readiness: emptyReadiness(), flight: emptyFlight(), progress: { ...session.progress, completedActivities: session.progress.completedActivities.filter(id => valid.includes(id)) },
    past: record ? [...session.past.slice(-29), session.preparation] : session.past, future: record ? [] : session.future };
}
export function reduceMission(session: WorkshopSession, event: MissionEvent): WorkshopSession {
  if (event.type.startsWith('moon-')) {
    if (session.progress.stepId !== 'crew-selection') return session;
    const moon = reduceMoonSession(session.moon, event as MoonEvent, session.progress, session.preparation);
    return moon === session.moon ? session : { ...session, moon, readiness: emptyReadiness(), flight: emptyFlight(), progress: { ...session.progress, completedActivities: session.progress.completedActivities.filter(id => verifiedActivities(session.preparation, session.progress.selections.objective).includes(id)) } };
  }
  let next = reduceWorkshopMission(session, event as WorkshopEvent);
  if (event.type === 'select' && next.progress.selections.objective !== session.progress.selections.objective) {
    next = withPreparation(next, normalizeObjective(next.preparation, next.progress.selections.objective ?? 'lunar-ice'));
  }
  const moon = syncMoonDesign(next.moon, next.progress, next.preparation);
  return moon === next.moon ? next : { ...next, moon };
}
function reduceWorkshopMission(session: WorkshopSession, event: WorkshopEvent): WorkshopSession {
  const step = getStoryStep(session.progress.stepId);
  const objective = session.progress.selections.objective ?? 'lunar-ice';
  const ready = (id: Parameters<typeof stageReady>[0], preparation = session.preparation) => stageReady(id, preparation, objective);
  const stage = WORKSHOP_STAGES.find(id => id === step.id);
  if (event.type === 'fix-problem') {
    if (step.module !== 6 && !stage) return session;
    const repair = recommendRepair(session, event.problem);
    if (!repair || stage && WORKSHOP_STAGES.indexOf(repair.stage) > WORKSHOP_STAGES.indexOf(stage)) return session;
    return { ...session, repair, progress: { ...session.progress, stepId: repair.stage, lineIndex: 0,
      history: [...session.progress.history, { stepId: step.id, lineIndex: session.progress.lineIndex }] } };
  }
  if (event.type === 'repair-recheck') {
    if (!stage || !session.repair || !repairApplied(session.repair, session.preparation) || !WORKSHOP_STAGES.every(id => ready(id))) return session;
    const target = MOON_IMPLEMENTED.crewDeparture && crewReport(session.moon.crew).complete ? 'mass-check' : 'crew-briefing';
    return { ...session, repair: undefined, progress: { ...session.progress, stepId: target, lineIndex: 0,
      history: [...session.progress.history, { stepId: step.id, lineIndex: 0 }] } };
  }
  if (event.type === 'connect-radar') return step.id === 'mass-check' ? { ...session, readiness: { ...session.readiness, radarConnected: true } } : session;
  if (event.type.startsWith('trial-')) {
    if (step.id !== 'power-check' || !checkAccepted('mass-check', session.progress, session.preparation, session.readiness)) return session;
    const trial = reduceTrial(session.readiness.trial, event as TrialEvent, missionSignature(session.progress, session.preparation), session.preparation, session.progress.selections.site === 'permanent-shadow');
    const updated = { ...session, readiness: { ...session.readiness, trial } };
    // A completed real rehearsal is the power check; no second confirmation click.
    return trialPassed(trial, missionSignature(session.progress, session.preparation), session.preparation, session.progress.selections.site === 'permanent-shadow')
      ? reduceMission(updated, { type: 'run-check' }) : updated;
  }
  if (event.type.startsWith('flight-')) {
    if (!['liftoff', 'earth-orbit'].includes(step.id) || !launchAuthorized(session.progress, session.preparation, session.readiness)) return session;
    if (step.id === 'earth-orbit' && event.type !== 'flight-replay') return session;
    const flight = reduceFlight(session.flight, event as FlightEvent, missionSignature(session.progress, session.preparation));
    return { ...session, flight, progress: event.type === 'flight-replay' ? { ...session.progress, stepId: 'liftoff', history: session.progress.history.filter(cursor => cursor.stepId !== 'liftoff' && cursor.stepId !== 'earth-orbit'), completedActivities: session.progress.completedActivities.filter(id => id !== 'liftoff') } : session.progress };
  }
  if (event.type === 'install') {
    if (!stage) return session;
    const options = new Set(partsForObjective(objective).map(part => part.id));
    const allowed = event.ids.filter(id => { const p = partById(id); return p && options.has(id) && STAGE_CATEGORIES[stage].includes(p.category); });
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
    // Keep navigation on the earliest now-incomplete assembly stage.
    const currentIndex = WORKSHOP_STAGES.indexOf(stage);
    const earlier = WORKSHOP_STAGES.find((id, index) => index < currentIndex && !ready(id, snapshot));
    return { ...restored, progress: earlier ? { ...restored.progress, stepId: earlier, lineIndex: 0 } : restored.progress,
      past: event.type === 'undo' ? session.past.slice(0, -1) : [...session.past, session.preparation],
      future: event.type === 'redo' ? session.future.slice(0, -1) : [...session.future, session.preparation] };
  }
  if (event.type === 'begin-auto-build') {
    if (!stage && step.id !== 'resource-limits') return session;
    return { ...session, repair: undefined, preparation: createPreparationSelection(), past: [], future: [], readiness: emptyReadiness(), flight: emptyFlight(),
      progress: { ...session.progress, stepId: 'lander-build', lineIndex: 0, completedActivities: ['resource-limits'],
        history: session.progress.history.filter(cursor => getStoryStep(cursor.stepId).module < 5) } };
  }
  if (event.type === 'quick-build') {
    if (!stage && step.id !== 'resource-limits') return session;
    const updated = withPreparation(session, quickPreparation(objective));
    let progress = { ...updated.progress, completedActivities: verifiedActivities(updated.preparation, objective) };
    // Traverse real gates, retaining Back history. Leave crew assignment to the player.
    while (progress.stepId !== 'crew-selection') {
      const next = reduceStoryProgress(progress, { type: getStoryStep(progress.stepId).kind === 'conversation' ? 'skip-briefing' : 'next' });
      if (next.stepId === progress.stepId) break;
      progress = next;
    }
    return { ...updated, progress };
  }
  if (event.type === 'visit-stage') {
    if (![6,8].includes(getStoryStep(step.id).module) && !stage) return session;
    const currentIndex = stage ? WORKSHOP_STAGES.indexOf(stage) : WORKSHOP_STAGES.length;
    const targetIndex = WORKSHOP_STAGES.indexOf(event.stage);
    if (targetIndex > currentIndex) return session;
    return { ...session, repair: undefined, progress: { ...session.progress, stepId: event.stage, lineIndex: 0,
      history: [...session.progress.history, { stepId: step.id, lineIndex: session.progress.lineIndex }] } };
  }
  if (event.type === 'run-check') {
    const id = CHECK_IDS.find(id => id === step.id);
    if (!id || !evaluateReadiness(session.progress, session.preparation).pass[id]) return session;
    if (id === 'mass-check' && !session.readiness.radarConnected || id === 'power-check'
      && !trialPassed(session.readiness.trial, missionSignature(session.progress, session.preparation), session.preparation, session.progress.selections.site === 'permanent-shadow')) return session;
    const earlier = CHECK_IDS.slice(0, CHECK_IDS.indexOf(id));
    if (!earlier.every(check => checkAccepted(check, session.progress, session.preparation, session.readiness))) return session;
    return { ...session, readiness: { ...session.readiness, checks: { ...session.readiness.checks, [id]: missionSignature(session.progress, session.preparation) } } };
  }
  if (event.type === 'pack') {
    if (step.id !== 'rocket-pack' || !allChecksAccepted(session.progress, session.preparation, session.readiness)
      || event.action !== PACKING_ACTIONS[session.readiness.packing.length]) return session;
    return { ...session, readiness: { ...session.readiness, signature: missionSignature(session.progress, session.preparation), packing: [...session.readiness.packing, event.action] } };
  }
  if (event.type === 'complete-activity') return session; // Only live validation below can complete an activity.
  if (event.type === 'next' && step.kind === 'activity') {
    const id = CHECK_IDS.find(id => id === step.id);
    const valid = id ? checkAccepted(id, session.progress, session.preparation, session.readiness)
      : step.id === 'launch-ready' ? launchAuthorized(session.progress, session.preparation, session.readiness)
      : step.id === 'liftoff' ? launchAuthorized(session.progress, session.preparation, session.readiness) && flightComplete(session.flight, missionSignature(session.progress, session.preparation))
      : step.id === 'rocket-pack' ? packingComplete(session.progress, session.preparation, session.readiness)
      : step.id === 'crew-selection' ? crewReport(session.moon.crew).complete && WORKSHOP_STAGES.every(id => ready(id)) : ready(step.id);
    if (!valid) return session;
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: step.activity });
    return { ...session, progress: reduceStoryProgress(completed, { type: 'next' }), readiness: step.id === 'rocket-pack'
      ? { ...session.readiness, approved: createMissionManifest(session.progress, session.preparation) } : session.readiness };
  }
  const progress = reduceStoryProgress(session.progress, event as StoryEvent);
  if (event.type === 'back') {
    const index = WORKSHOP_STAGES.findIndex(id => id === progress.stepId);
    const boundary = getStoryStep(progress.stepId).module >= 6 ? WORKSHOP_STAGES.length : index;
    const missing = WORKSHOP_STAGES.find((id, i) => i < boundary && !ready(id));
    if (missing) return { ...session, progress: { ...progress, stepId: missing, lineIndex: 0 } };
    if (getStoryStep(progress.stepId).module >= 6) {
      const valid = missionActivities(progress, session.preparation, session.readiness);
      if (flightComplete(session.flight, missionSignature(progress, session.preparation))) valid.push('liftoff');
      const missingCheck = [...CHECK_IDS, 'rocket-pack' as const, 'launch-ready' as const, 'liftoff' as const].find(id => !valid.includes(id));
      const order = [...CHECK_IDS, 'rocket-pack', 'launch-ready', 'liftoff', 'earth-orbit'];
      if (missingCheck && order.indexOf(missingCheck) < order.indexOf(progress.stepId)) return { ...session, progress: { ...progress, stepId: missingCheck, lineIndex: 0 } };
    }
  }
  const changedMission = missionSignature(progress, session.preparation) !== missionSignature(session.progress, session.preparation);
  return { ...session, progress: changedMission ? { ...progress, completedActivities: progress.completedActivities.filter(id => verifiedActivities(session.preparation, objective).includes(id)) } : progress,
    readiness: changedMission ? emptyReadiness() : session.readiness, flight: changedMission ? emptyFlight() : session.flight };
}
