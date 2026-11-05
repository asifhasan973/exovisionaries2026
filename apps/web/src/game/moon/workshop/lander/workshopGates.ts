import { getStoryStep } from '@/game/moon/core/flow';
import {
  stageReady,
  WORKSHOP_STAGES,
  verifiedActivities,
} from '@/game/moon/core/preparation';
import { crewReport, crewCapabilities } from '@/game/moon/shared/catalog';
import {
  humanCheckAccepted,
  humanPacked,
  rocketReady,
  humanManifest,
  departureResources,
} from '@/game/moon/shared/validation';
import { reduceStoryProgress } from '@/game/moon/core/progress';
import type { StoryProgress } from '@/game/moon/core/types';
import {
  emptyReadiness,
  CHECK_IDS,
  checkAccepted,
  allChecksAccepted,
  evaluateReadiness,
  missionActivities,
  missionSignature,
  PACKING_ACTIONS,
} from '@/game/moon/readiness/readiness';
import type { PackingAction } from '@/game/moon/readiness/readiness';
import { trialPassed } from '@/game/moon/hazards/trial';
import { launchAuthorized, flightComplete, emptyFlight } from '@/game/moon/flight/launch/flight';
import type { WorkshopSession } from './workshopSession';

export function handleWorkshopRunCheck(session: WorkshopSession, stepId: string): WorkshopSession {
  const id = CHECK_IDS.find(id => id === stepId);
  if (
    !id ||
    !humanCheckAccepted('crew-check', session.moon, session.preparation) ||
    !evaluateReadiness(session.progress, session.preparation, session.moon).pass[id]
  )
    return session;
  if (
    (id === 'mass-check' && !session.readiness.radarConnected) ||
    (id === 'power-check' &&
      !trialPassed(
        session.readiness.trial,
        missionSignature(session.progress, session.preparation, session.moon),
        session.preparation,
        session.progress.selections.site === 'permanent-shadow',
        crewCapabilities(session.moon.crew),
      ))
  )
    return session;
  const earlier = CHECK_IDS.slice(0, CHECK_IDS.indexOf(id));
  if (!earlier.every(check => checkAccepted(check, session.progress, session.preparation, session.readiness, session.moon))) return session;
  return {
    ...session,
    readiness: { ...session.readiness, checks: { ...session.readiness.checks, [id]: missionSignature(session.progress, session.preparation, session.moon) } },
  };
}

export function handleWorkshopPack(session: WorkshopSession, stepId: string, action: PackingAction): WorkshopSession {
  if (
    stepId !== 'rocket-pack' ||
    !allChecksAccepted(session.progress, session.preparation, session.readiness, session.moon) ||
    action !== PACKING_ACTIONS[session.readiness.packing.length]
  )
    return session;
  return {
    ...session,
    readiness: {
      ...session.readiness,
      signature: missionSignature(session.progress, session.preparation, session.moon),
      packing: [...session.readiness.packing, action],
    },
  };
}

export function handleWorkshopNextActivity(
  session: WorkshopSession,
  step: ReturnType<typeof getStoryStep>,
  objective: string,
): WorkshopSession {
  const ready = (id: Parameters<typeof stageReady>[0]) => stageReady(id, session.preparation, objective);
  if (step.id === 'rocket-pack') {
    if (!humanPacked(session.moon, session.preparation) || !allChecksAccepted(session.progress, session.preparation, session.readiness, session.moon))
      return session;
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: 'rocket-pack' });
    return { ...session, progress: reduceStoryProgress(completed, { type: 'next' }) };
  }
  if (step.id === 'rocket-assembly') {
    if (!rocketReady(session.moon, session.preparation) || !allChecksAccepted(session.progress, session.preparation, session.readiness, session.moon))
      return session;
    const approved = humanManifest(session.moon, session.preparation);
    const resources = departureResources(session.moon, session.preparation);
    const moon = {
      ...session.moon,
      phase: 'validate' as const,
      resources,
      human: { ...session.moon.human, approved },
      launchSnapshot: Object.freeze({
        signature: session.moon.designSignature,
        platformId: approved.platformId,
        equipmentIds: approved.equipment.map(p => p.id),
        crew: { ...approved.crew },
      }),
      checkpoints: [
        Object.freeze({
          id: 'pre-departure',
          phase: 'validate' as const,
          designSignature: session.moon.designSignature,
          resources: Object.freeze({ ...resources }),
        }),
      ],
    };
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: 'rocket-assembly' });
    return { ...session, moon, progress: reduceStoryProgress(completed, { type: 'next' }) };
  }
  const id = CHECK_IDS.find(id => id === step.id);
  const valid = id
    ? checkAccepted(id, session.progress, session.preparation, session.readiness, session.moon)
    : step.id === 'launch-ready'
    ? launchAuthorized(session.progress, session.preparation, session.readiness, session.moon)
    : step.id === 'liftoff'
    ? launchAuthorized(session.progress, session.preparation, session.readiness, session.moon) &&
      flightComplete(session.flight, missionSignature(session.progress, session.preparation, session.moon))
    : ['crew-check', 'systems-check', 'stress-check'].includes(step.id)
    ? humanCheckAccepted(step.id as 'crew-check' | 'systems-check' | 'stress-check', session.moon, session.preparation)
    : ['crew-selection', 'crew-plan'].includes(step.id)
    ? crewReport(session.moon.crew).complete && WORKSHOP_STAGES.every(id => ready(id))
    : ready(step.id);
  if (!valid || step.kind !== 'activity') return session;
  const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: step.activity });
  return { ...session, progress: reduceStoryProgress(completed, { type: 'next' }) };
}

export function handleWorkshopBack(
  session: WorkshopSession,
  progress: StoryProgress,
  objective: string,
): WorkshopSession {
  const ready = (id: Parameters<typeof stageReady>[0]) => stageReady(id, session.preparation, objective);
  const index = WORKSHOP_STAGES.findIndex(id => id === progress.stepId);
  const boundary = getStoryStep(progress.stepId).module >= 6 ? WORKSHOP_STAGES.length : index;
  const missing = WORKSHOP_STAGES.find((id, i) => i < boundary && !ready(id));
  if (missing) return { ...session, progress: { ...progress, stepId: missing, lineIndex: 0 } };
  if (
    getStoryStep(progress.stepId).module >= 6 &&
    !['crew-check', 'systems-check', 'stress-check', 'rocket-pack', 'rocket-assembly', 'launch-ready', 'crew-plan', 'crew-selection', 'crew-briefing'].includes(
      progress.stepId,
    )
  ) {
    const valid = missionActivities(progress, session.preparation, session.readiness, session.moon);
    if (flightComplete(session.flight, missionSignature(progress, session.preparation, session.moon))) valid.push('liftoff');
    const missingCheck = [...CHECK_IDS, 'rocket-pack' as const, 'rocket-assembly' as const, 'launch-ready' as const, 'liftoff' as const].find(
      id => !valid.includes(id),
    );
    const order = [...CHECK_IDS, 'rocket-pack', 'rocket-assembly', 'launch-ready', 'liftoff', 'earth-orbit'];
    if (missingCheck && order.indexOf(missingCheck) < order.indexOf(progress.stepId)) {
      return { ...session, progress: { ...progress, stepId: missingCheck, lineIndex: 0 } };
    }
  }
  return { ...session, progress };
}

export function handleWorkshopMissionChange(
  session: WorkshopSession,
  progress: StoryProgress,
  objective: string,
): WorkshopSession {
  const changedMission =
    missionSignature(progress, session.preparation, session.moon) !==
    missionSignature(session.progress, session.preparation, session.moon);
  return {
    ...session,
    progress: changedMission
      ? {
          ...progress,
          completedActivities: progress.completedActivities.filter(id =>
            verifiedActivities(session.preparation, objective).includes(id),
          ),
        }
      : progress,
    readiness: changedMission ? emptyReadiness() : session.readiness,
    flight: changedMission ? emptyFlight() : session.flight,
  };
}

