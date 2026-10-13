import type { WorkshopSession } from '../workshopSession.ts';

/** Provenance affects labels, never evidence points or gate authorization. */
export function missionAssistance(s: WorkshopSession) {
  const m = s.moon;
  return [...new Set([
    ...(s.progress.assistance ?? []),
    ...(s.flight.mode === 'guided' ? ['guided-launch'] : []),
    ...(s.flight.skipped ? ['launch-skip'] : []),
    ...(m.human.stress.assisted ? ['readiness-hint'] : []),
    ...(m.journey.assisted ? ['journey-assistance'] : []),
    ...(m.landing.assisted ? ['landing-assistance'] : []),
    ...(m.surface.assisted ? ['surface-assistance'] : []),
    ...(m.science.assisted ? ['science-assistance'] : []),
    ...(m.returnFlight.assisted ? ['return-assistance'] : []),
  ])];
}
