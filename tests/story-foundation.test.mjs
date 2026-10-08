import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { STORY_DIALOGUE } from '../src/game/story/dialogue.ts';
import { STORY_FLOW, getDialogueText, getSpeakerLabel } from '../src/game/story/flow.ts';
import { createStoryProgress, reduceStoryProgress, restoreStoryProgress, serializeStoryProgress } from '../src/game/story/progress.ts';
import { SCRIPT_COMPONENTS, SCRIPT_RESOURCES, createPreparationSelection } from '../src/game/story/design.ts';

const source = readFileSync(new URL('../docs/story/user-script.txt', import.meta.url), 'utf8');
const next = progress => reduceStoryProgress(progress, { type: 'next' });
const namedProgress = () => next(reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: 'Charlie' }));

function reachStep(targetId) {
  let progress = namedProgress();
  for (let guard = 0; guard < 100 && progress.stepId !== targetId; guard++) {
    const step = STORY_FLOW.find(step => step.id === progress.stepId);
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type: 'select', choiceId: step.options.find(option => option.available).id });
    if (step.kind === 'activity') progress = reduceStoryProgress(progress, { type: 'complete-activity', activity: step.activity });
    progress = next(progress);
  }
  assert.equal(progress.stepId, targetId);
  return progress;
}

test('all 18 source dialogue lines keep their exact order, spelling and punctuation', () => {
  const sourceLines = source.split(/\r?\n/).filter(line => /^(Chief|Charlie|Commander):/.test(line)).map(line => {
    const [, sourceSpeaker, text] = line.match(/^(Chief|Charlie|Commander):\s*(.+?)\s*$/);
    return { sourceSpeaker, text };
  });
  const actual = Object.values(STORY_DIALOGUE).flat().map(({ sourceSpeaker, text }) => ({ sourceSpeaker, text }));
  assert.equal(actual.length, 18);
  assert.deepEqual(actual, sourceLines);
});

test('each dialogue line has a unique ID and a face/pose cue', () => {
  const lines = Object.values(STORY_DIALOGUE).flat();
  assert.equal(new Set(lines.map(line => line.id)).size, lines.length);
  for (const line of lines) {
    assert.ok(line.speaker.expression);
    assert.ok(line.speaker.pose);
    assert.equal(line.speaker.character, line.sourceSpeaker === 'Chief' ? 'chief' : 'commander');
  }
});

test('name substitution leaves source text intact and supports literal symbols', () => {
  const greeting = STORY_DIALOGUE.appointment[0];
  assert.equal(getDialogueText(greeting, 'Charlie'), greeting.text);
  assert.equal(getDialogueText(greeting, '$&'), '$&, good to see you.');
  assert.equal(getSpeakerLabel(STORY_DIALOGUE.appointment[1], 'Asha'), 'Asha');
  assert.equal(getDialogueText(STORY_DIALOGUE.appointment[4], 'Asha'), STORY_DIALOGUE.appointment[4].text);
});

test('name is required; one next click advances exactly one dialogue line', () => {
  const fresh = createStoryProgress();
  assert.equal(next(fresh), fresh);
  const progress = namedProgress();
  const advanced = next(progress);
  assert.equal(advanced.stepId, 'appointment');
  assert.equal(advanced.lineIndex, 1);
  assert.equal(reduceStoryProgress(advanced, { type: 'back' }).lineIndex, 0);
});

test('destination requires a selection and Mars cannot enter the live flow', () => {
  const progress = reachStep('destination');
  assert.equal(next(progress), progress);
  assert.equal(reduceStoryProgress(progress, { type: 'select', choiceId: 'mars' }), progress);
  assert.equal(reduceStoryProgress(progress, { type: 'select', choiceId: 'lunar-geology' }), progress);
  const selected = reduceStoryProgress(progress, { type: 'select', choiceId: 'moon' });
  assert.equal(next(selected).stepId, 'objective-briefing');
});

test('back restores the exact preceding dialogue without losing the selection', () => {
  const progress = reachStep('objective-briefing');
  const back = reduceStoryProgress(progress, { type: 'back' });
  assert.equal(back.stepId, 'destination');
  assert.equal(back.selections.destination, 'moon');
  assert.equal(next(back).stepId, 'objective-briefing');
});

test('activities and endpoint are gated; changing mission invalidates checks', () => {
  const progress = reachStep('lander-build');
  assert.equal(next(progress), progress);
  assert.equal(reduceStoryProgress(progress, { type: 'complete-activity', activity: 'budget-check' }), progress);
  const completed = reduceStoryProgress(progress, { type: 'complete-activity', activity: 'lander-build' });
  assert.equal(next(completed).stepId, 'rover-select');
  const endpoint = reachStep('earth-orbit');
  assert.equal(next(endpoint), endpoint);
  let earlier = endpoint;
  while (earlier.stepId !== 'objective') earlier = reduceStoryProgress(earlier, { type: 'back' });
  const changed = reduceStoryProgress(earlier, { type: 'select', choiceId: 'lunar-geology' });
  assert.deepEqual(changed.completedActivities, []);
});

test('save roundtrip restores gates, line cursor, choices and back history', () => {
  const cursor = next(reachStep('resource-briefing'));
  assert.deepEqual(restoreStoryProgress(serializeStoryProgress(cursor)), cursor);
  const selected = reduceStoryProgress(reachStep('site'), { type: 'select', choiceId: 'permanent-shadow' });
  assert.deepEqual(restoreStoryProgress(serializeStoryProgress(selected)), selected);
  const endpoint = reachStep('earth-orbit');
  assert.deepEqual(restoreStoryProgress(serializeStoryProgress(endpoint)), endpoint);
});

test('invalid/legacy saves reset safely; forged endpoint cannot bypass missing preparation', () => {
  assert.deepEqual(restoreStoryProgress('{'), createStoryProgress());
  assert.deepEqual(restoreStoryProgress(JSON.stringify({ version: 2 })), createStoryProgress());
  const forged = { ...createStoryProgress(), playerName: 'Charlie', stepId: 'launch-ready', selections: { destination: 'moon', objective: 'lunar-ice', site: 'crater-rim' } };
  assert.equal(restoreStoryProgress(JSON.stringify(forged)).stepId, 'resource-limits');
});

test('script catalogue preserves mandatory totals and explicitly missing specifications', () => {
  const lander = SCRIPT_COMPONENTS.filter(part => part.category === 'lander');
  assert.equal(lander.reduce((sum, part) => sum + part.credits, 0), SCRIPT_RESOURCES.mandatoryLanderCredits);
  assert.equal(lander.reduce((sum, part) => sum + part.massKg, 0), SCRIPT_RESOURCES.mandatoryLanderMassKg);
  assert.ok(lander.every(part => part.mandatory));
  assert.equal(SCRIPT_COMPONENTS.find(part => part.id === 'msolo').credits, null);
  assert.ok(SCRIPT_COMPONENTS.find(part => part.id === 'large-battery').specGaps.includes('capacity unit'));
  assert.deepEqual(createPreparationSelection().landerPartIds, []);
  assert.equal(new Set(SCRIPT_COMPONENTS.map(part => part.id)).size, SCRIPT_COMPONENTS.length);
});
