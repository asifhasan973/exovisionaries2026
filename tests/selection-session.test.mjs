import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyFlight } from '../src/game/story/flight.ts';
import { emptyReadiness } from '../src/game/story/readiness.ts';
import { createPreparationSelection } from '../src/game/story/design.ts';
import { quickPreparation, verifiedActivities } from '../src/game/story/preparation.ts';
import { STORY_FLOW } from '../src/game/story/flow.ts';
import { createStoryProgress, reduceStoryProgress, serializeStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { readSelectionSession, restoreSelectionProgress, writeSelectionSession, STORY_VOICE_KEY } from '../src/game/story/selectionSession.ts';

function selectedPlan() {
  let progress = reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: '  Asha Rahman  ' });
  const choices = { destination: 'moon', objective: 'lunar-geology', site: 'permanent-shadow' };
  while (progress.stepId !== 'resource-limits') {
    const step = STORY_FLOW.find(step => step.id === progress.stepId);
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: choices[step.choiceKey] });
    progress = reduceStoryProgress(progress, { type: 'next' });
  }
  return progress;
}
const back = progress => reduceStoryProgress(progress, { type: 'back' });

test('selection save keeps name, all three choices, exact cursor and voice preference', () => {
  const entries = new Map([['legacy-game-save', 'keep-me']]);
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const plan = selectedPlan();
  assert.equal(plan.playerName, 'Asha Rahman');
  assert.equal(writeSelectionSession(storage, plan, false), true);
  assert.deepEqual(readSelectionSession(storage), { progress: plan, preparation: createPreparationSelection(), readiness: emptyReadiness(), flight: emptyFlight(), voiceEnabled: false, storageAvailable: true });
  assert.equal(entries.get(STORY_VOICE_KEY), 'off');
  assert.equal(entries.get('legacy-game-save'), 'keep-me');
  assert.equal(entries.size, 3);
  assert.ok(entries.has(STORY_SAVE_KEY));
});

test('Back then refresh preserves later choices without bypassing the active screen', () => {
  let earlier = selectedPlan();
  while (earlier.stepId !== 'objective') earlier = back(earlier);
  const restored = restoreSelectionProgress(serializeStoryProgress(earlier));
  assert.deepEqual(restored, earlier);
  assert.equal(restored.selections.site, 'permanent-shadow');
  const changed = reduceStoryProgress(restored, { type: 'select', choiceId: 'lunar-ice' });
  assert.equal(changed.stepId, 'objective');
  assert.equal(changed.selections.site, 'permanent-shadow');
  assert.equal(reduceStoryProgress(changed, { type: 'next' }).stepId, 'site-briefing');
});

test('invalid future choices and missing required choices cannot advance the restored cursor', () => {
  const invalid = { ...selectedPlan(), stepId: 'destination', lineIndex: 0, selections: { destination: 'mars', objective: 'invented', site: 'invented' } };
  const restored = restoreSelectionProgress(JSON.stringify(invalid));
  assert.equal(restored.stepId, 'destination');
  assert.deepEqual(restored.selections, {});
  assert.equal(reduceStoryProgress(restored, { type: 'next' }), restored);
  assert.deepEqual(restoreSelectionProgress('{bad'), createStoryProgress());
});

test('Unverified saves require real hardware and cannot claim approval', () => {
  let progress = selectedPlan();
  while (progress.stepId !== 'launch-ready') {
    const step = STORY_FLOW.find(step => step.id === progress.stepId);
    if (step.kind === 'activity') progress = reduceStoryProgress(progress, { type: 'complete-activity', activity: step.activity });
    progress = reduceStoryProgress(progress, { type: 'next' });
  }
  const restored = restoreSelectionProgress(serializeStoryProgress(progress));
  assert.equal(restored.stepId, 'lander-build');
  assert.deepEqual(restored.completedActivities, ['resource-limits']);
  assert.equal(reduceStoryProgress(restored, { type: 'next' }), restored);
  const preparation = quickPreparation();
  const complete = restoreSelectionProgress(JSON.stringify({ ...progress, preparationVersion: 1, preparation }));
  assert.equal(complete.stepId, 'mass-check');
  assert.deepEqual(complete.completedActivities, verifiedActivities(preparation));
});

test('denied storage and quota errors return an honest unsaved state without blocking play', () => {
  const denied = { getItem() { throw new Error('Access denied'); }, setItem() { throw new Error('Quota exceeded'); } };
  assert.deepEqual(readSelectionSession(denied), { progress: createStoryProgress(), preparation: createPreparationSelection(), readiness: emptyReadiness(), flight: emptyFlight(), voiceEnabled: true, storageAvailable: false });
  assert.equal(writeSelectionSession(denied, selectedPlan(), true), false);
});
