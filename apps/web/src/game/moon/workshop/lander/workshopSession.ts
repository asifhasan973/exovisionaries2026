import { reduceRoverMission } from '@/game/moon/rover/roverSession';
import type { RoverEvent } from '@/game/moon/rover/rover';
import { enterReturn, reduceReturnMission, advanceReturn } from '@/game/moon/return/returnSession';
import type { ReturnEvent } from '@/game/moon/return/return';
import { enterScience, reduceScienceMission, advanceScience, advanceRecovery } from '@/game/moon/science/scienceSession';
import type { ScienceEvent } from '@/game/moon/science/science';
import { enterSurface, reduceSurfaceMission, advanceSurface } from '@/game/moon/surface/surfaceSession';
import type { SurfaceMissionEvent } from '@/game/moon/surface/surfaceSession';
import { enterLanding, reduceLandingMission, finishLanding } from '@/game/moon/landing/landingSession';
import type { LandingMissionEvent } from '@/game/moon/landing/landingSession';
import { reduceJourneyMission, enterEarthOrbit } from '@/game/moon/flight/journey/journeySession';
import type { JourneyMissionEvent } from '@/game/moon/flight/journey/journeySession';
import type { RepairGuide } from '@/game/moon/hazards/repairGuidance';
import { emptyFlight, launchAuthorized, flightComplete } from '@/game/moon/flight/launch/flight';
import type { FlightState } from '@/game/moon/flight/launch/flight';
import { createPreparationSelection } from '@/game/moon/core/design';
import type { PreparationSelection } from '@/game/moon/core/design';
import { verifiedActivities, normalizeObjective } from '@/game/moon/core/preparation';
import { reduceHumanEvent } from '@/game/moon/readiness/readinessEvents';
import type { HumanEvent } from '@/game/moon/readiness/readinessEvents';
import { crewCapabilities } from '@/game/moon/shared/catalog';
import { reduceStoryProgress } from '@/game/moon/core/progress';
import type { StoryProgress } from '@/game/moon/core/types';
import { emptyReadiness, missionSignature } from '@/game/moon/readiness/readiness';
import type { ReadinessState } from '@/game/moon/readiness/readiness';
import { trialPassed } from '@/game/moon/hazards/trial';
import { createMoonSession, reduceMoonSession, syncMoonDesign } from '@/game/moon/shared/session';
import type { MoonEvent, MoonSession } from '@/game/moon/shared/session';
import { navigateBack, navigateForward } from '@/game/moon/core/missionNavigation';
import type { MissionReview } from '@/game/moon/core/missionNavigation';
import { restoreMilestones } from '@/game/moon/core/missionMilestones';
import { withPreparation, reduceWorkshopMission, type WorkshopEvent } from './workshopReducer';

export interface WorkshopSession {
  review?: MissionReview;
  repair?: RepairGuide;
  progress: StoryProgress;
  preparation: PreparationSelection;
  past: PreparationSelection[];
  future: PreparationSelection[];
  readiness: ReadinessState;
  flight: FlightState;
  moon: MoonSession;
}

export type MissionEvent =
  | RoverEvent
  | WorkshopEvent
  | MoonEvent
  | HumanEvent
  | JourneyMissionEvent
  | LandingMissionEvent
  | SurfaceMissionEvent
  | ScienceEvent
  | ReturnEvent
  | { type: 'milestone-start' | 'milestone-continue' };

export function createWorkshopSession(
  progress: StoryProgress,
  preparation = createPreparationSelection(),
  readiness = emptyReadiness(),
  flight = emptyFlight(),
  moon = createMoonSession(progress, preparation),
  repair?: RepairGuide,
): WorkshopSession {
  const session: WorkshopSession = {
    repair,
    progress,
    preparation,
    readiness,
    flight,
    moon: syncMoonDesign(moon, progress, preparation),
    past: [],
    future: [],
  };
  return progress.stepId === 'power-check' &&
    trialPassed(
      readiness.trial,
      missionSignature(progress, preparation, session.moon),
      preparation,
      progress.selections.site === 'permanent-shadow',
      crewCapabilities(session.moon.crew),
    )
    ? reduceMission(session, { type: 'run-check' })
    : session;
}

export function reduceMission(session: WorkshopSession, event: MissionEvent): WorkshopSession {
  if (event.type === 'back') return navigateBack(session);
  if (session.review) return event.type === 'next' || event.type === 'skip-briefing' ? navigateForward(session) : session;
  if (event.type === 'milestone-start' || event.type === 'milestone-continue') {
    const state = session.progress.milestones ?? restoreMilestones(undefined, session.progress.stepId);
    return {
      ...session,
      progress: {
        ...session.progress,
        milestones: {
          introduced: true,
          celebrated: state.pending ? [...new Set([...state.celebrated, state.pending])] : state.celebrated,
        },
      },
    };
  }
  if (event.type.startsWith('rocket-build-')) return reduceHumanEvent(session, event as HumanEvent);
  if (event.type.startsWith('packing-game-')) return reduceHumanEvent(session, event as HumanEvent);
  if (event.type.startsWith('rover-')) return reduceRoverMission(session, event as RoverEvent);
  if (event.type.startsWith('return-test-')) return reduceHumanEvent(session, event as HumanEvent);
  if (event.type.startsWith('return-')) return reduceReturnMission(session, event as ReturnEvent);
  if (event.type === 'next' && session.progress.stepId === 'surface-secured') return enterReturn(session);
  if (event.type === 'next' && session.progress.stepId === 'crew-return') return advanceReturn(session);
  if (event.type === 'moon-request-phase') return session;
  if (event.type.startsWith('science-')) return reduceScienceMission(session, event as ScienceEvent);
  if (event.type === 'next' && ['science-ready', 'surface-recovery'].includes(session.progress.stepId)) return advanceRecovery(session);
  if (event.type === 'next' && session.progress.stepId === 'ice-science') return advanceScience(session);
  if (event.type === 'next' && session.progress.stepId === 'surface-ready') {
    const entered = enterScience(session);
    if (entered === session) return session;
    return { ...entered, progress: { ...entered.progress, stepId: 'ice-science', lineIndex: 0 } };
  }
  if (event.type.startsWith('surface-')) return reduceSurfaceMission(session, event as SurfaceMissionEvent);
  if (event.type === 'next' && ['lunar-surface', 'surface-explore'].includes(session.progress.stepId)) return advanceSurface(session);
  if (event.type.startsWith('landing-')) return reduceLandingMission(session, event as LandingMissionEvent);
  if (event.type === 'next' && session.progress.stepId === 'lunar-orbit') {
    const entered = enterLanding(session);
    if (entered === session) return session;
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: 'lunar-orbit' });
    return { ...entered, progress: reduceStoryProgress(completed, { type: 'next' }) };
  }
  if (event.type === 'next' && session.progress.stepId === 'lunar-descent') {
    const landed = finishLanding(session);
    return landed === session ? session : enterSurface(landed);
  }
  if (event.type.startsWith('journey-')) return reduceJourneyMission(session, event as JourneyMissionEvent);
  if (
    !['prepare', 'validate'].includes(session.moon.phase) &&
    ['install', 'remove', 'depth', 'undo', 'redo', 'quick-build', 'begin-auto-build', 'visit-stage', 'visit-crew', 'select', 'set-name'].includes(event.type)
  )
    return session;
  if (
    event.type === 'next' &&
    session.progress.stepId === 'liftoff' &&
    launchAuthorized(session.progress, session.preparation, session.readiness, session.moon) &&
    flightComplete(session.flight, session.moon.designSignature)
  ) {
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: 'liftoff' });
    return enterEarthOrbit({ ...session, progress: reduceStoryProgress(completed, { type: 'next' }) });
  }
  if (event.type === 'next' && session.progress.stepId === 'moon-transfer') {
    if (session.moon.journey.stage !== 'complete' || session.moon.journey.signature !== session.moon.designSignature) return session;
    const completed = reduceStoryProgress(session.progress, { type: 'complete-activity', activity: 'moon-transfer' });
    return { ...session, progress: reduceStoryProgress(completed, { type: 'next' }) };
  }
  if (event.type.startsWith('human-') || event.type === 'visit-crew') return reduceHumanEvent(session, event as HumanEvent);
  if (event.type.startsWith('moon-')) {
    if (session.progress.stepId !== 'crew-selection') return session;
    const moon = reduceMoonSession(session.moon, event as MoonEvent, session.progress, session.preparation);
    return moon === session.moon
      ? session
      : {
          ...session,
          moon,
          readiness: emptyReadiness(),
          flight: emptyFlight(),
          progress: {
            ...session.progress,
            completedActivities: session.progress.completedActivities.filter(id =>
              verifiedActivities(session.preparation, session.progress.selections.objective).includes(id),
            ),
          },
        };
  }
  let next = reduceWorkshopMission(session, event as WorkshopEvent);
  if (event.type === 'select' && next.progress.selections.objective !== session.progress.selections.objective) {
    next = withPreparation(next, normalizeObjective(next.preparation, next.progress.selections.objective ?? 'lunar-ice'));
  }
  const moon = syncMoonDesign(next.moon, next.progress, next.preparation);
  return moon === next.moon ? next : { ...next, moon };
}
