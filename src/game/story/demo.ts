import { STORY_FLOW } from './flow.ts';
import { createStoryProgress, reduceStoryProgress } from './progress.ts';
import { quickPreparation, verifiedActivities } from './preparation.ts';
import { createWorkshopSession } from './workshopSession.ts';

/** A separate demo design. No check, packing or flight is automatically approved. */
export function createJudgeMission() {
  const preparation = quickPreparation();
  let progress = reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: 'Charlie' });
  while (progress.stepId !== 'mass-check') {
    const step = STORY_FLOW.find(step => step.id === progress.stepId)!;
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: step.options.find(option => option.available)!.id });
    if (step.kind === 'activity') progress = { ...progress, completedActivities: verifiedActivities(preparation) };
    progress = reduceStoryProgress(progress, { type: step.kind === 'conversation' ? 'skip-briefing' : 'next' });
  }
  return createWorkshopSession(progress, preparation);
}
