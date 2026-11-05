import type { PreparationSelection } from '@/game/moon/core/design';
import {
  INCIDENT_MODEL,
  careKitAvailable,
  chooseIncident,
  resolveIncident,
  type IncidentAction,
  type IncidentState,
} from '@/game/moon/hazards/incidents';
import { energyWh } from '@/game/moon/shared/resources';
import type { MoonSession } from '@/game/moon/shared/session';
import {
  SURFACE_MODEL,
  crewTimeOK,
  reduceSurface,
  spendSurfaceTask,
  surfaceLink,
  surfacePath,
  surfacePosition,
  surfaceTaskPower,
  type SurfaceState,
} from '@/game/moon/surface/surface';
import { geoTools } from './geologyScience';
import {
  type ScienceCommand,
  type SciencePhase,
  type ScienceState,
} from './science';
import { remainingScienceWh, stopExpedition } from './scienceIncidents';

export function startRecovery(
  s: ScienceState,
  surface: SurfaceState,
  kind: 'brush' | 'calibrate' | 'wait',
  seconds: number,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  const context = { ...moon, surface, science: s };
  const task = surfaceTaskPower(
    context,
    prep,
    kind === 'calibrate' ? 'analysis' : 'standby',
    kind === 'calibrate' ? (s.objective === 'lunar-geology' ? geoTools(prep).filter((p: any) => p.scienceFamily === 'ir').map((p: any) => p.id) : ['nirvss']) : [],
  );
  const home = surfacePath(surface.location, 'base', context, prep);
  if (
    !home ||
    !crewTimeOK(surface, moon, seconds + home.seconds) ||
    surface.batteryWh - energyWh(task.deficitW, seconds) < home.wh + moon.resources.capacityWh * 0.2 ||
    (task.light === 0 && surface.coldSeconds + seconds + home.coldSeconds > (prep.thermalId === 'advanced-thermal' ? 7200 : 1200))
  ) {
    return { science: { ...s, hazards: { ...s.hazards, feedback: 'unsafe' as const } }, surface };
  }
  const h = s.hazards;
  const base = chooseIncident(h, h.pending ?? (kind === 'wait' ? 'radiation' : 'dust'), kind === 'brush' ? 'brush' : kind === 'calibrate' ? 'calibrate' : 'shelter-wait', surface.elapsedSeconds);
  return {
    science: {
      ...s,
      phase: 'recovering' as const,
      frame: 0,
      paused: false,
      hazards: {
        ...base,
        roverParked: kind === 'brush' ? false : base.roverParked,
        crewChecked: kind === 'brush' ? false : base.crewChecked,
        pending: null,
        recovery: kind,
        recoveryFrame: 0,
        recoverySeconds: seconds,
        resumePhase: s.phase,
        resumeFrame: s.frame,
        feedback: kind === 'brush' ? ('brush' as const) : kind === 'calibrate' ? ('calibration' as const) : ('wait' as const),
      },
    },
    surface: kind === 'brush' ? { ...surface, crewSheltered: false } : surface,
  };
}

export function applyIncident(
  s: ScienceState,
  surface: SurfaceState,
  action: IncidentAction,
  moon: MoonSession,
  prep: PreparationSelection,
): { science: ScienceState; surface: SurfaceState } {
  const h = s.hazards;
  const kind = h.pending;
  const context = { ...moon, surface, science: s };
  const point = surfacePosition(surface);
  const linked = surfaceLink(point.x, point.z, prep) === 'connected';
  const same = { science: s, surface };
  const feedback = (key: any) => ({ ...same, science: { ...s, hazards: { ...h, feedback: key } } });

  if (action === 'eva') return feedback(h.evaBlocked ? 'evaBlocked' : 'kit');
  if (action === 'boost-radio') return feedback('radioBlocked');
  if (action === 'brush') {
    if (!careKitAvailable(h, prep)) return feedback('kit');
    if (h.evaBlocked) return feedback('evaBlocked');
    if (surface.location !== 'base' || surface.stage !== 'idle' || surface.evaSeconds + INCIDENT_MODEL.brushSeconds > SURFACE_MODEL.evaLimitSeconds) {
      return feedback('unsafe');
    }
    return startRecovery(s, surface, 'brush', INCIDENT_MODEL.brushSeconds, moon, prep);
  }
  if (action === 'calibrate') {
    if (!linked) return feedback('remote');
    if (
      moon.crew.support !== 'systems-engineer' ||
      !(s.objective === 'lunar-geology' ? geoTools(prep).some((p: any) => p.scienceFamily === 'ir') : prep.sciencePartIds.includes('nirvss')) ||
      !h.dust ||
      h.sensorCalibrated
    ) {
      return feedback('kit');
    }
    return startRecovery(s, surface, 'calibrate', INCIDENT_MODEL.calibrationSeconds, moon, prep);
  }
  if (action === 'shelter-wait') {
    if (!h.evaBlocked || h.radiationUntil === null) return same;
    const chosen = { ...s, hazards: kind ? chooseIncident(h, 'radiation', action, surface.elapsedSeconds) : h };
    if (surface.location !== 'base' || surface.stage !== 'idle') {
      const back = stopExpedition(chosen, surface, moon, prep);
      return { ...back, science: { ...back.science, hazards: { ...back.science.hazards, autoWaitAtBase: true, feedback: 'wait' } } };
    }
    return startRecovery(s, surface, 'wait', Math.max(1, h.radiationUntil - surface.elapsedSeconds), moon, prep);
  }
  if (!kind) return same;
  const chosen = { ...s, hazards: chooseIncident(h, kind, action, surface.elapsedSeconds), paused: false };
  if (action === 'safe-return') return stopExpedition(chosen, surface, moon, prep, true);
  if (kind === 'dust') {
    if (action === 'continue-dust') return { science: chosen, surface };
    if (action === 'return-clean') return stopExpedition(chosen, surface, moon, prep);
  }
  if (kind === 'radio' && action === 'follow-plan') return { science: chosen, surface };
  if (kind === 'radiation' && action === 'robot-only') {
    return { ...same, science: { ...chosen, hazards: { ...chosen.hazards, evaBlocked: true } } };
  }
  if (kind === 'power') {
    if (action === 'shed-gas' && s.useGas && s.phase !== 'analysis') {
      return { ...same, science: { ...chosen, useGas: false, hazards: { ...chosen.hazards, shedGas: true, feedback: 'shed' } } };
    }
    if (action === 'shorter' && s.phase === 'plan' && s.depthCm > 20) {
      return { ...same, science: { ...chosen, depthCm: 20, hazards: { ...chosen.hazards, feedback: 'shorter' } } };
    }
    if (action === 'closer' && s.phase === 'plan') {
      return { ...same, science: { ...chosen, target: 'lookout', hazards: { ...chosen.hazards, feedback: 'closer' } } };
    }
    if (action === 'charge' && s.phase === 'plan' && linked) {
      const vehicle = reduceSurface(surface, { type: 'surface-charge' }, context, prep);
      if (vehicle.stage === 'charging') return { science: { ...chosen, phase: 'returning' as const, transit: 'charge' as const }, surface: vehicle };
    }
  }
  return feedback('unsafe');
}

export function advanceRecovery(
  s: ScienceState,
  surface: SurfaceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  const h = s.hazards;
  const seconds = h.recoverySeconds / INCIDENT_MODEL.recoveryFrames;
  const kind = h.recovery;
  let vehicle = spendSurfaceTask(
    surface,
    { ...moon, surface, science: s },
    prep,
    seconds,
    kind === 'calibrate' ? 'analysis' : 'standby',
    kind === 'calibrate' ? (s.objective === 'lunar-geology' ? geoTools(prep).filter((p: any) => p.scienceFamily === 'ir').map((p: any) => p.id) : ['nirvss']) : [],
  );
  if (kind === 'brush') vehicle = { ...vehicle, evaSeconds: vehicle.evaSeconds + seconds };
  let science = { ...s, frame: s.frame + 1, hazards: { ...h, recoveryFrame: h.recoveryFrame + 1 } };
  if (science.frame >= INCIDENT_MODEL.recoveryFrames && vehicle.stage !== 'failed') {
    const time = vehicle.elapsedSeconds;
    let hazards: IncidentState = { ...h, recovery: null, recoveryFrame: 0, resumePhase: null, resumeFrame: 0 };
    if (kind === 'brush') hazards = { ...resolveIncident(hazards, 'dust', time), dust: INCIDENT_MODEL.cleanedDust, kitUsed: true, feedback: 'cleaned' };
    else if (kind === 'calibrate') hazards = { ...resolveIncident(hazards, 'dust', time), sensorCalibrated: true, feedback: 'calibrated' };
    else hazards = { ...resolveIncident(hazards, 'radiation', time), radiationUntil: null, evaBlocked: false, feedback: 'clear' };
    science = { ...science, phase: (h.resumePhase ?? 'ready') as SciencePhase, frame: h.resumeFrame, hazards };
    vehicle = { ...vehicle, crewSheltered: true };
  }
  return { science, surface: vehicle };
}

export function finishCommand(
  previous: ScienceState,
  pair: { science: ScienceState; surface: SurfaceState },
  command: ScienceCommand,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  let next = pair;
  const required = () => remainingScienceWh(next.science, next.surface, { ...moon, science: next.science, surface: next.surface }, prep) + 2;
  if (
    command.type === 'incident' &&
    previous.hazards.pending === 'power' &&
    !['safe-return', 'charge'].includes(command.action) &&
    next.science.hazards.pending === null &&
    next.surface.batteryWh < required()
  ) {
    next = {
      ...next,
      science: {
        ...next.science,
        paused: true,
        hazards: {
          ...next.science.hazards,
          pending: 'power',
          feedback: 'unsafe',
          log: next.science.hazards.log.map((r: any) => (r.id === 'power' ? { ...r, status: 'awaiting' as const, resolvedAtSeconds: null } : r)),
        },
      },
    };
  }
  if (next.science.hazards.log.some((r: any) => r.id === 'power' && r.status === 'mitigated') && next.surface.batteryWh >= required()) {
    next = { ...next, science: { ...next.science, hazards: resolveIncident(next.science.hazards, 'power', next.surface.elapsedSeconds) } };
  }
  return next;
}

