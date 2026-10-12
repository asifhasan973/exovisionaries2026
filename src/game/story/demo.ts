import { STORY_FLOW } from './flow.ts';
import { createStoryProgress, reduceStoryProgress } from './progress.ts';
import { quickPreparation, verifiedActivities } from './preparation.ts';
import { createWorkshopSession } from './workshopSession.ts';
import type { PlayerGender } from './types.ts';
import type { MoonObjective } from './moon/catalog.ts';

/** Separate objective-specific demo. Crew, checks and science are never auto-approved. */
export function createJudgeMission(gender: PlayerGender = 'female', objective: MoonObjective = 'lunar-ice') {
  const preparation = quickPreparation(objective);
  let progress = reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: 'Charlie', gender });
  // Bounded traversal also protects against an accidentally added gate/endpoint.
  for (let i = 0; i < STORY_FLOW.length && progress.stepId !== 'crew-selection'; i++) {
    const step = STORY_FLOW.find(step => step.id === progress.stepId)!;
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: step.choiceKey === 'objective' ? objective : step.options.find(option => option.available)!.id });
    if (step.kind === 'activity') progress = { ...progress, completedActivities: verifiedActivities(preparation, objective) };
    const next = reduceStoryProgress(progress, { type: step.kind === 'conversation' ? 'skip-briefing' : 'next' });
    if (next.stepId === progress.stepId) break;
    progress = next;
  }
  return createWorkshopSession(progress, preparation);
}
