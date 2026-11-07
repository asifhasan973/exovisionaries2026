import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { WorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import { writeBrowserSelectionSession } from '@/game/moon/crew/selectionSession';

export interface StoryPersistenceState {
  progress: WorkshopSession['progress'];
  voiceEnabled: boolean;
  preparation: WorkshopSession['preparation'];
  readiness: WorkshopSession['readiness'];
  flight: WorkshopSession['flight'];
  moon: WorkshopSession['moon'];
  repair: WorkshopSession['repair'];
}

export function useStoryPersistence(
  mission: WorkshopSession,
  latestRef: MutableRefObject<StoryPersistenceState>,
  isDebugSession: boolean,
  voiceEnabled: boolean,
  voicesEnabled: boolean,
  setStorageAvailable: (available: boolean) => void,
  setIsSaving?: (saving: boolean) => void,
) {
  const isInitial = useRef(true);
  const { progress, preparation, readiness, flight, moon } = mission;

  const flightCheckpoint = Math.floor(flight.t * 2);
  const incident = moon.science.hazards;
  const incidentCheckpoint = [
    incident.pending,
    incident.dust,
    incident.kitUsed,
    incident.sensorCalibrated,
    incident.radiationUntil,
    incident.evaBlocked,
    incident.autoWaitAtBase,
    incident.recovery,
    incident.feedback,
    incident.roverParked,
    incident.dataArchived,
    incident.crewChecked,
    incident.log.map((r: any) => `${r.id}:${r.status}:${r.action}`).join(','),
  ].join('|');
  const returnCheckpoint = [
    moon.returnFlight.stage,
    Math.floor(moon.returnFlight.frame / 5),
    moon.returnFlight.paused,
    moon.returnFlight.speed,
    moon.returnFlight.mode,
    moon.returnFlight.mistakes,
    moon.returnFlight.alignment,
    moon.returnFlight.closingMS,
    moon.returnFlight.assisted,
  ].join('|');
  const scienceCheckpoint = Math.floor(moon.science.frame / 5);
  const roverCheckpoint = moon.rover
    ? `${moon.rover.phase}|${moon.rover.line}|${moon.rover.commands.length}|${Math.floor(moon.rover.frames / 20)}|${moon.rover.paused}|${moon.rover.attempts}`
    : '';
  const surfaceCheckpoint = Math.floor((moon.surface.phaseFrame + moon.surface.legFrame) / 5);
  const landingInputCheckpoint =
    moon.landing.mode === 'medium'
      ? `${moon.landing.direction}|${moon.landing.brake}`
      : moon.landing.mode === 'challenge'
      ? `${moon.landing.throttle}|${moon.landing.steer}`
      : '';
  const landingCheckpoint = Math.floor(moon.landing.steps / 30);
  const journeyCheckpoint = Math.floor(moon.journey.elapsed * 2);
  const trialCheckpoint = Math.floor(readiness.trial.progress * 10);

  useEffect(() => {
    if (isDebugSession) return;
    if (isInitial.current) {
      isInitial.current = false;
      const current = latestRef.current;
      const saved = writeBrowserSelectionSession(
        current.progress,
        current.voiceEnabled,
        current.preparation,
        current.readiness,
        current.flight,
        current.moon,
        current.repair,
      );
      setStorageAvailable(saved);
      return;
    }
    setIsSaving?.(true);
    const current = latestRef.current;
    const saved = writeBrowserSelectionSession(
      current.progress,
      current.voiceEnabled,
      current.preparation,
      current.readiness,
      current.flight,
      current.moon,
      current.repair,
    );
    setStorageAvailable(saved);
    const timer = setTimeout(() => {
      setIsSaving?.(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [
    isDebugSession,
    roverCheckpoint,
    returnCheckpoint,
    mission.repair,
    progress,
    voiceEnabled,
    voicesEnabled,
    preparation,
    moon.designSignature,
    moon.human,
    moon.phase,
    moon.journey.stage,
    moon.journey.route,
    moon.journey.direction,
    moon.journey.mode,
    moon.journey.speed,
    moon.journey.paused,
    moon.journey.assisted,
    moon.journey.attempts,
    journeyCheckpoint,
    landingCheckpoint,
    surfaceCheckpoint,
    scienceCheckpoint,
    moon.science.phase,
    moon.science.target,
    moon.science.depthCm,
    moon.science.program,
    moon.science.useGas,
    moon.science.sensorPlan,
    moon.science.samples,
    moon.science.seismometerSite,
    moon.science.paused,
    moon.science.records,
    moon.science.accepted,
    moon.science.feedback,
    moon.science.attempts,
    moon.science.assisted,
    incidentCheckpoint,
    moon.science.committed,
    moon.science.fieldworkStopped,
    moon.surface.stage,
    moon.surface.location,
    moon.surface.selected,
    moon.surface.mode,
    moon.surface.pace,
    moon.surface.paused,
    moon.surface.held,
    moon.surface.autonomyArmed,
    moon.surface.assisted,
    moon.surface.attempts,
    moon.landing.stage,
    moon.landing.paused,
    moon.landing.mode,
    moon.landing.target,
    landingInputCheckpoint,
    moon.landing.assisted,
    moon.landing.attempts,
    moon.landing.decisionPending,
    readiness.checks,
    readiness.packing,
    readiness.approved,
    readiness.radarConnected,
    trialCheckpoint,
    readiness.trial.phase,
    readiness.trial.paused,
    flightCheckpoint,
    flight.status,
    flight.speed,
    flight.events,
    flight.skipped,
    flight.mode,
    flight.missedWindow,
    latestRef,
    setStorageAvailable,
    setIsSaving,
  ]);

  useEffect(() => {
    if (isDebugSession) return;
    const save = () => {
      const current = latestRef.current;
      writeBrowserSelectionSession(
        current.progress,
        current.voiceEnabled,
        current.preparation,
        current.readiness,
        current.flight,
        current.moon,
        current.repair,
      );
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [isDebugSession, latestRef]);
}

