import { STORY_FLOW, getStoryStep } from './flow.ts';
import { createJudgeMission } from './demo.ts';
import { reduceMission } from './workshopSession.ts';
import type { WorkshopSession } from './workshopSession.ts';
import type { StoryStepId } from './types.ts';
import { stageReady, WORKSHOP_STAGES } from './preparation.ts';
import { returnAuthorized } from './moon/return.ts';
import { createReadinessDemo, createJourneyDemo, createLandingDemo, createSurfaceDemo, createReturnDemo, createGeologyReturnDemo } from './moon/journeyDemo.ts';

function finishReturn(session: WorkshopSession) {
  let s = session;
  s = reduceMission(s, { type: 'return-resume' });
  s = reduceMission(s, { type: 'return-mode', mode: 'guided' });
  for (let i = 0; i < 5000 && s.progress.stepId !== 'mission-debrief'; i++) {
    const stage = s.moon.returnFlight.stage;
    if (stage === 'ready') s = reduceMission(s, { type: 'return-action', action: 'launch' });
    else if (stage === 'rendezvous') {
      s = reduceMission(s, { type: 'return-action', action: 'assist' });
      s = reduceMission(s, { type: 'return-action', action: 'dock' });
    } else if (stage === 'docked') s = reduceMission(s, { type: 'return-action', action: 'depart' });
    else if (stage === 'coast') s = reduceMission(s, { type: 'return-action', action: 'skip-coast' });
    else if (stage === 'entry-ready') s = reduceMission(s, { type: 'return-action', action: 'shield' });
    else if (stage === 'chute-ready') s = reduceMission(s, { type: 'return-action', action: 'chutes' });
    else if (stage === 'splashdown') s = reduceMission(s, { type: 'next' });
    else s = reduceMission(s, { type: 'return-tick', seconds: .25 });
  }
  return s;
}

/** Judge shortcuts use assisted, reducer-built checkpoints in the separate demo save. */
export function skipJudgePage(source: WorkshopSession): WorkshopSession {
  const step = getStoryStep(source.progress.stepId, source.progress.selections.objective);
  if (step.kind === 'endpoint') return source;
  let s = source;
  if (step.kind === 'name') s = reduceMission(s, { type: 'set-name', name: s.progress.playerName || 'Explorer', gender: s.progress.playerGender });
  if (step.kind === 'choice') {
    const choice = s.progress.selections[step.choiceKey] || step.options.find(option => option.available)!.id;
    s = reduceMission(s, { type: 'select', choiceId: choice });
  }
  let next = reduceMission(s, { type: step.kind === 'conversation' ? 'skip-briefing' : 'next' });
  if (next.progress.stepId === source.progress.stepId) {
    const objective = source.progress.selections.objective === 'lunar-geology' ? 'lunar-geology' : 'lunar-ice', gender = source.progress.playerGender;
    const options = { playerName: source.progress.playerName || 'Explorer', ...(WORKSHOP_STAGES.every(stage => stageReady(stage, source.preparation, objective)) ? { preparation: source.preparation } : {}) };
    const target: StoryStepId = [11,12,13].includes(step.module) ? 'crew-return' : STORY_FLOW[STORY_FLOW.findIndex(item => item.id === step.id) + 1].id;
    const module = getStoryStep(target).module;
    if (module <= 5 || module === 8) {
      next = target === 'crew-plan' ? createReadinessDemo(gender, objective, 'crew-check', options) : createJudgeMission(gender, objective, options);
      next = { ...next, progress: { ...next.progress, stepId: target, lineIndex: 0 } };
    } else if (module === 6 || module === 7) {
      next = createReadinessDemo(gender, objective, target, options);
      if (next.progress.stepId !== target) next = createReadinessDemo(gender, objective, target, { playerName: options.playerName });
    } else if (module === 9) {
      next = createJourneyDemo(gender, objective, options);
      for (const event of [{ type: 'flight-skip' }, { type: 'next' }] as const) next = reduceMission(next, event);
      if (target !== 'earth-orbit') for (const event of [{ type: 'journey-route', id: 'balanced' }, { type: 'journey-confirm-route' }] as const) next = reduceMission(next, event);
      if (target === 'lunar-orbit') for (const event of [{ type: 'journey-skip' }, { type: 'next' }] as const) next = reduceMission(next, event);
    } else if (module === 10) next = createLandingDemo(gender, objective, options);
    else if (module === 11) next = createSurfaceDemo(gender, objective, options);
    else {
      next = target === 'mission-debrief' && returnAuthorized(source.moon) ? source : objective === 'lunar-geology' ? createGeologyReturnDemo(gender) : createReturnDemo(gender);
      if (target === 'mission-debrief') next = finishReturn(next);
    }
    if (next.progress.stepId !== target) throw new Error(`Judge checkpoint unavailable: ${target}`);
  }
  return { ...next, progress: { ...next.progress,
    assistance: [...new Set([...(next.progress.assistance ?? []), 'judge-demo' as const])],
    history: [...source.progress.history, { stepId: source.progress.stepId, lineIndex: source.progress.lineIndex }],
    milestones: { ...next.progress.milestones, celebrated: next.progress.milestones?.celebrated ?? [], introduced: true, pending: undefined },
  } };
}
