import type { PlayerGender } from './types.ts';
import { createJudgeMission } from './demo.ts';
import { installPart, removePart, quickPreparation } from './preparation.ts';
import type { WorkshopSession } from './workshopSession.ts';

export const DEMO_CHAPTERS = [
  { id: 'battery-challenge', label: 'Battery challenge', group: 'Start here', objective: 'lunar-ice' },
  { id: 'ice-build', label: 'Ice Explorer', group: 'Start here', objective: 'lunar-ice' },
  { id: 'geology-build', label: 'Geology Explorer', group: 'Start here', objective: 'lunar-geology' },
  { id: 'journey', label: 'Launch & journey', group: 'Flight', objective: 'lunar-ice' },
  { id: 'landing', label: 'Moon landing', group: 'Flight', objective: 'lunar-ice' },
  { id: 'surface', label: 'Deploy & drive', group: 'Flight', objective: 'lunar-ice' },
  { id: 'ice-science', label: 'Ice science', group: 'Science', objective: 'lunar-ice' },
  { id: 'incidents', label: 'Fault & repair', group: 'Science', objective: 'lunar-ice' },
  { id: 'geology-science', label: 'Rock science', group: 'Science', objective: 'lunar-geology' },
  { id: 'ice-return', label: 'Ice crew return', group: 'Return', objective: 'lunar-ice' },
  { id: 'geology-return', label: 'Rock crew return', group: 'Return', objective: 'lunar-geology' },
] as const;
export type DemoChapterId = typeof DEMO_CHAPTERS[number]['id'];
export const DEMO_GROUPS = ['Start here', 'Flight', 'Science', 'Return'] as const;

/** Chapter shortcuts execute real reducers. The comparison starts with a failed
 * rehearsal; the player fixes the kit and earns subsequent checks normally. */
async function buildChapter(id: DemoChapterId, gender: PlayerGender): Promise<WorkshopSession> {
  if (id === 'ice-build' || id === 'geology-build') return createJudgeMission(gender, id === 'ice-build' ? 'lunar-ice' : 'lunar-geology');
  const chapters = await import('./moon/journeyDemo.ts');
  switch (id) {
    case 'battery-challenge': {
      const preparation = { ...installPart(removePart(quickPreparation(), 'medium-battery'), 'small-battery'), drillDepthCm: 100 };
      return chapters.createJourneyDemo(gender, 'lunar-ice', { preparation, playerName: 'Battery Explorer' });
    }
    case 'journey': return chapters.createJourneyDemo(gender, 'lunar-ice');
    case 'landing': return chapters.createLandingDemo(gender, 'lunar-ice');
    case 'surface': return chapters.createSurfaceDemo(gender, 'lunar-ice');
    case 'ice-science': return chapters.createScienceDemo(gender);
    case 'incidents': return chapters.createIncidentDemo(gender);
    case 'geology-science': return chapters.createGeologyDemo(gender);
    case 'ice-return': return chapters.createReturnDemo(gender);
    case 'geology-return': return chapters.createGeologyReturnDemo(gender);
  }
}

export async function createDemoChapter(id: DemoChapterId, gender: PlayerGender) {
  const mission = await buildChapter(id, gender);
  const expected = {
    'battery-challenge': 'power-check', 'ice-build': 'crew-selection', 'geology-build': 'crew-selection',
    journey: 'liftoff', landing: 'lunar-descent', surface: 'lunar-surface',
    'ice-science': 'ice-science', incidents: 'ice-science', 'geology-science': 'ice-science',
    'ice-return': 'crew-return', 'geology-return': 'crew-return',
  } as const;
  if (mission.progress.stepId !== expected[id]) throw new Error('Demo checkpoint did not pass its prior gates');
  if (id === 'battery-challenge' && (mission.readiness.trial.phase !== 'failed' || mission.readiness.trial.fault !== 'energy')) throw new Error('Comparison must expose a real energy fault');
  return mission;
}
