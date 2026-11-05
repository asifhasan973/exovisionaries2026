import { STORY_FLOW, getStoryStep } from '@/game/moon/core/flow';
import { createStoryProgress, reduceStoryProgress } from '@/game/moon/core/progress';
import { quickPreparation, verifiedActivities } from '@/game/moon/core/preparation';
import { createWorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import type { PlayerGender } from '@/game/moon/core/types';
import type { PreparationSelection } from '@/game/moon/core/design';
import type { MoonObjective } from '@/game/moon/shared/catalog';

/** Separate objective-specific demo. Crew, checks and science are never auto-approved. */
export function createJudgeMission(
  gender: PlayerGender = 'female',
  objective: MoonObjective = 'lunar-ice',
  options?: { preparation?: PreparationSelection; playerName?: string },
) {
  const preparation = options?.preparation ?? quickPreparation(objective);
  let progress = reduceStoryProgress(createStoryProgress(), {
    type: 'set-name',
    name: options?.playerName ?? 'Charlie',
    gender,
  });
  progress = { ...progress, assistance: ['judge-demo'] };

  for (let i = 0; i < STORY_FLOW.length && progress.stepId !== 'crew-selection'; i++) {
    const step = getStoryStep(progress.stepId, objective);
    if (step.kind === 'choice') {
      progress = reduceStoryProgress(progress, {
        type: 'select',
        choiceId: step.choiceKey === 'objective' ? objective : step.options.find(option => option.available)!.id,
      });
    }
    if (step.kind === 'activity') {
      progress = { ...progress, completedActivities: verifiedActivities(preparation, objective) };
    }
    const next = reduceStoryProgress(progress, {
      type: step.kind === 'conversation' ? 'skip-briefing' : 'next',
    });
    if (next.stepId === progress.stepId) break;
    progress = next;
  }
  return createWorkshopSession(progress, preparation);
}

