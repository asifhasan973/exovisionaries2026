import type { PreparationSelection } from '@/game/moon/core/design';
import {
  INCIDENT_MODEL,
  openIncident,
  primaryIncident,
  type IncidentAction,
  type IncidentKind,
} from '@/game/moon/hazards/incidents';
import { drillDurationSeconds, energyWh } from '@/game/moon/shared/resources';
import type { MoonSession } from '@/game/moon/shared/session';
import {
  SURFACE_MODEL,
  beginSurfaceTrip,
  legProfile,
  surfaceLink,
  surfacePath,
  surfacePosition,
  surfaceTaskPower,
  type SurfaceState,
} from '@/game/moon/surface/surface';
import { GEOLOGY_MODEL, geoTask, geoTools } from './geologyScience';
import {
  SCIENCE_MODEL,
  scienceActive,
  scienceFrameLimit,
  sciencePlan,
  type ScienceState,
} from './science';

export const INCIDENT_ACTIONS: readonly IncidentAction[] = [
  'continue-dust', 'return-clean', 'brush', 'calibrate', 'follow-plan',
  'boost-radio', 'shorter', 'shed-gas', 'closer', 'charge', 'safe-return',
  'shelter-wait', 'robot-only', 'eva',
];

/** Remaining route/task forecast changes when panels become dusty; it never invents charging. */
export function remainingScienceWh(
  s: ScienceState,
  surface: SurfaceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  if (s.phase === 'plan') return sciencePlan(s, { ...moon, surface, science: s }, prep).required;
  const context = { ...moon, surface, science: s };
  let wh = 0;
  if (surface.stage === 'driving') {
    surface.legs.forEach((l, i) => {
      wh += legProfile(l, context, prep, 'eco').wh * (i === 0 ? 1 - surface.legFrame / SURFACE_MODEL.legFrames : 1);
    });
  }
  if (!['returning', 'ready', 'report', 'transmitting'].includes(s.phase)) {
    const at = { ...surface, stage: 'idle' as const, location: s.target, legs: [] };
    const there = { ...context, surface: at };
    const home = surfacePath(s.target, 'base', there, prep);
    wh += home?.wh ?? Infinity;
    const add = (mode: 'analysis' | 'drilling', ids: string[], seconds: number) => {
      wh += energyWh(surfaceTaskPower(there, prep, mode, ids).deficitW, seconds);
    };
    if (s.objective === 'lunar-geology') {
      for (const phase of ['survey', 'drilling', 'analysis', 'listening'] as const) {
        const order = ['outbound', 'survey', 'drilling', 'analysis', 'sensor-site', 'listening'];
        const current = order.indexOf(s.phase);
        const index = order.indexOf(phase);
        if (
          index < current ||
          (phase !== 'survey' && s.program !== 'sample') ||
          (phase === 'listening' && !geoTools(prep).some((p: any) => p.scienceFamily === 'seismometer'))
        ) {
          continue;
        }
        const task = geoTask(s, prep, phase);
        add(
          task.mode === 'standby' ? 'analysis' : task.mode,
          task.ids,
          task.seconds * (s.phase === phase ? 1 - s.frame / scienceFrameLimit(phase) : 1),
        );
      }
      if (
        s.program === 'sample' &&
        geoTools(prep).some((p: any) => p.scienceFamily === 'seismometer') &&
        s.phase !== 'listening'
      ) {
        add('analysis', [], GEOLOGY_MODEL.deploySeconds);
      }
    } else {
      if (s.phase === 'outbound' || s.phase === 'survey') {
        add('analysis', ['nss'], SCIENCE_MODEL.surveySeconds * (s.phase === 'survey' ? 1 - s.frame / SCIENCE_MODEL.surveyFrames : 1));
      }
      if (s.program === 'sample' && ['outbound', 'survey', 'drilling'].includes(s.phase)) {
        add('drilling', ['trident'], drillDurationSeconds(s.depthCm) * (s.phase === 'drilling' ? 1 - s.frame / SCIENCE_MODEL.drillFrames : 1));
      }
      if (s.program === 'sample') {
        add('analysis', s.useGas ? ['nirvss', 'msolo'] : ['nirvss'], SCIENCE_MODEL.analysisSeconds * (s.phase === 'analysis' ? 1 - s.frame / SCIENCE_MODEL.analysisFrames : 1));
      }
    }
  }
  return wh + moon.resources.capacityWh * 0.2;
}

export function triggerIncident(
  s: ScienceState,
  surface: SurfaceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  if (
    s.commands.length < s.incidentActivationIndex ||
    s.hazards.pending ||
    s.committed ||
    s.fieldworkStopped ||
    s.hazards.log.length >= INCIDENT_MODEL.maxEvents ||
    !scienceActive(s) ||
    s.phase === 'recovering'
  ) {
    return s;
  }
  const primary = primaryIncident(moon.scenarioSeed);
  const point = surfacePosition(surface);
  const linked = surfaceLink(point.x, point.z, prep) === 'connected';
  let kind: IncidentKind | null = null;
  let reason = '';
  if (
    ['outbound', 'survey', 'drilling', 'analysis'].includes(s.phase) &&
    surface.batteryWh + 1e-6 < remainingScienceWh(s, surface, moon, prep) + 2
  ) {
    kind = 'power';
    reason = 'Projected remaining tasks and return would approach the protected energy reserve.';
  } else if (primary === 'radiation' && surface.elapsedSeconds - (s.origin?.elapsedSeconds ?? 0) >= 600) {
    kind = 'radiation';
    reason = 'Saved space-weather scenario reached its virtual-time threshold.';
  } else if (primary === 'dust' && s.phase === 'drilling' && s.frame >= 8) {
    kind = 'dust';
    reason = 'Excavation disturbed local regolith; dust adhered to optical tools and panels.';
  } else if (primary === 'radio' && s.phase === 'outbound' && !linked) {
    kind = 'radio';
    reason = 'Range or ridge line-of-sight geometry blocks the selected rover radio.';
  }
  return kind ? { ...s, hazards: openIncident(s.hazards, kind, reason, surface) } : s;
}

export function stopExpedition(
  s: ScienceState,
  surface: SurfaceState,
  moon: MoonSession,
  prep: PreparationSelection,
  finish = false,
) {
  const context = { ...moon, surface, science: s };
  const l = surface.stage === 'driving' ? surface.legs[0] : null;
  const home = surfacePath(l ? l.from : surface.location, 'base', context, prep);
  if (!home) return { science: { ...s, hazards: { ...s.hazards, feedback: 'unsafe' as const } }, surface };
  const vehicle =
    l && surface.legFrame > 0
      ? { ...beginSurfaceTrip(surface, [{ ...l, from: l.to, to: l.from }, ...home.legs]), legFrame: SURFACE_MODEL.legFrames - surface.legFrame }
      : beginSurfaceTrip(surface, home.legs);
  const records = s.currentIds.map(id => s.records.find(r => r.id === id)).filter(Boolean);
  const hasSample = records.some(r =>
    s.objective === 'lunar-geology' ? r?.kind === 'mineral-evidence' : r?.instrumentId === 'nirvss',
  );
  return {
    science: {
      ...s,
      phase: vehicle.stage === 'driving' ? ('returning' as const) : records.length ? ('report' as const) : finish ? ('ready' as const) : ('plan' as const),
      transit: 'home' as const,
      fieldworkStopped: s.fieldworkStopped || finish,
      program: hasSample ? s.program : ('survey' as const),
      frame: 0,
      paused: false,
      hazards: { ...s.hazards, feedback: finish ? ('partial' as const) : ('accepted' as const) },
    },
    surface: vehicle,
  };
}
