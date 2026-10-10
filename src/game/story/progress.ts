import { getStoryStep, STORY_FLOW } from './flow.ts';
import type { StoryEvent, StoryProgress, StoryStepId } from './types.ts';

export const STORY_SAVE_KEY = 'zero_to_beyond_script_story_v1';

export function createStoryProgress(): StoryProgress {
  return { version: 1, playerName: '', playerGender: 'female', stepId: 'player-name', lineIndex: 0, selections: {}, completedActivities: [], history: [] };
}

function advanceStep(progress: StoryProgress): StoryProgress {
  const next = STORY_FLOW[STORY_FLOW.findIndex(step => step.id === progress.stepId) + 1];
  if (!next) return progress;
  return {
    ...progress, stepId: next.id, lineIndex: 0,
    history: [...progress.history, { stepId: progress.stepId, lineIndex: progress.lineIndex }]
  };
}

/** A click advances one full source line. Selection and activity gates cannot be skipped. */
export function reduceStoryProgress(progress: StoryProgress, event: StoryEvent): StoryProgress {
  const step = getStoryStep(progress.stepId);
  switch (event.type) {
    case 'set-name': {
      if (step.kind !== 'name') return progress;
      const playerName = event.name.trim().replace(/\s+/g, ' ').normalize('NFC').slice(0, 40);
      return { ...progress, playerName, playerGender: event.gender ?? progress.playerGender };
    }
    case 'select': {
      if (step.kind !== 'choice' || !step.options.some(option => option.id === event.choiceId && option.available)) return progress;
      const changed = progress.selections[step.choiceKey] !== event.choiceId;
      return { ...progress, selections: { ...progress.selections, [step.choiceKey]: event.choiceId }, completedActivities: changed ? [] : progress.completedActivities };
    }
    case 'complete-activity': {
      // Module 5/6 must verify the live design before sending this event.
      if (step.kind !== 'activity' || event.activity !== step.activity) return progress;
      return {
        ...progress,
        completedActivities: [...new Set([...progress.completedActivities, event.activity])]
      };
    }
    case 'next': {
      if (step.kind === 'name' && !progress.playerName) return progress;
      if (step.kind === 'choice' && !step.options.some(option => option.available && option.id === progress.selections[step.choiceKey])) return progress;
      if (step.kind === 'activity' && !progress.completedActivities.includes(step.activity)) return progress;
      if (step.kind === 'endpoint') return progress;
      if (step.kind === 'conversation' && progress.lineIndex < step.lines.length - 1) {
        return { ...progress, lineIndex: progress.lineIndex + 1 };
      }
      return advanceStep(progress);
    }
    case 'skip-briefing': {
      if (step.kind !== 'conversation') return progress;
      let next = progress;
      // Skip speech only; never skip a choice, installation or approval gate.
      while (getStoryStep(next.stepId).kind === 'conversation') next = advanceStep(next);
      return next;
    }
    case 'back': {
      if (step.kind === 'conversation' && progress.lineIndex > 0) return { ...progress, lineIndex: progress.lineIndex - 1 };
      const previous = progress.history.at(-1);
      if (!previous) return progress;
      return { ...progress, ...previous, history: progress.history.slice(0, -1) };
    }
  }
}

/** Saved progress is reconstructed through the same gates as normal play. */
export function restoreStoryProgress(raw: string | null): StoryProgress {
  const fresh = createStoryProgress();
  if (!raw) return fresh;
  try {
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || typeof saved.playerName !== 'string') return fresh;
    const target = STORY_FLOW.find(step => step.id === saved.stepId);
    if (!target) return fresh;
    let progress = reduceStoryProgress(fresh, { type: 'set-name', name: saved.playerName, gender: saved.playerGender === 'male' ? 'male' : 'female' });
    // Back navigation may leave valid later choices in the save. Keep them across reloads,
    // while validating each option and still reconstructing the current cursor through gates.
    for (const step of STORY_FLOW) {
      if (step.kind !== 'choice') continue;
      const option = step.options.find(option => option.available && option.id === saved.selections?.[step.choiceKey]);
      if (option) progress.selections[step.choiceKey] = option.id;
    }
    for (const step of STORY_FLOW) {
      if (step.id === target.id) {
        const maxLine = step.kind === 'conversation' ? step.lines.length - 1 : 0;
        const lineIndex = Number.isInteger(saved.lineIndex) ? Math.max(0, Math.min(maxLine, saved.lineIndex)) : 0;
        if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: saved.selections?.[step.choiceKey] });
        if (step.kind === 'activity' && Array.isArray(saved.completedActivities) && saved.completedActivities.includes(step.activity)) {
          progress = reduceStoryProgress(progress, { type: 'complete-activity', activity: step.activity });
        }
        return { ...progress, lineIndex };
      }
      if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: saved.selections?.[step.choiceKey] });
      if (step.kind === 'activity' && Array.isArray(saved.completedActivities) && saved.completedActivities.includes(step.activity)) {
        progress = reduceStoryProgress(progress, { type: 'complete-activity', activity: step.activity });
      }
      if (step.kind === 'conversation') progress = { ...progress, lineIndex: step.lines.length - 1 };
      const advanced = reduceStoryProgress(progress, { type: 'next' });
      if (advanced.stepId === progress.stepId) return progress;
      progress = advanced;
    }
    return progress;
  } catch {
    return fresh;
  }
}

export function serializeStoryProgress(progress: StoryProgress): string {
  return JSON.stringify(progress);
}

export function isStoryStepId(value: unknown): value is StoryStepId {
  return typeof value === 'string' && STORY_FLOW.some(step => step.id === value);
}
