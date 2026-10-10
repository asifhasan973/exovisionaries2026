import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreparationSelection, SCRIPT_COMPONENTS } from '../src/game/story/design.ts';
import { installPart, removePart, restorePreparation, quickPreparation, preparationTotals, stageReady, drillPotential, verifiedActivities } from '../src/game/story/preparation.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
import { createStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { readSelectionSession, writeSelectionSession } from '../src/game/story/selectionSession.ts';
import { nextWorkshopAction } from '../src/game/story/workshopNavigation.ts';
const workshop = (stepId = 'lander-build') => createWorkshopSession({ ...createStoryProgress(), playerName: 'Asha', stepId, selections: { destination: 'moon', objective: 'lunar-ice', site: 'crater-rim' } });

test('empty workshop, real install gates and duplicate prevention', () => {
  let session = workshop();
  assert.deepEqual(preparationTotals(session.preparation), { credits: 0, massKg: 0, normalW: 0, peakW: 0, landerW: 0, solarW: 0, batteryWh: 0, deficitW: 0, drillMinutes: 0, drillEnergyWh: 0, drillRisk: 'None', batteryMinutes: null, potentialScience: 0, spentScience: 0 });
  assert.equal(reduceMission(session, { type: 'next' }), session);
  assert.equal(reduceMission(session, { type: 'complete-activity', activity: 'lander-build' }), session);
  assert.equal(reduceMission(session, { type: 'install', ids: ['nss', 'invented'] }), session);
  const ids = SCRIPT_COMPONENTS.filter(p => p.category === 'lander').map(p => p.id);
  session = reduceMission(session, { type: 'install', ids });
  assert.equal(stageReady('lander-build', session.preparation), true);
  assert.equal(preparationTotals(session.preparation).credits, 285);
  assert.equal(preparationTotals(session.preparation).massKg, 134);
  assert.equal(reduceMission(session, { type: 'install', ids }), session);
  assert.equal(reduceMission(session, { type: 'next' }).progress.stepId, 'rover-select');
});
test('single-choice swaps replace mass, power and price; removal does not charge twice', () => {
  let preparation = installPart(createPreparationSelection(), 'basic-rover');
  preparation = installPart(preparation, 'heavy-rover');
  assert.equal(preparationTotals(preparation).credits, 250);
  assert.equal(preparationTotals(preparation).massKg, 115);
  assert.equal(preparationTotals(preparation).normalW, 160);
  preparation = removePart(preparation, 'basic-rover');
  assert.equal(preparation.roverId, 'heavy-rover');
  assert.equal(preparationTotals(removePart(preparation, 'heavy-rover')).credits, 0);
});
test('solar output, Wh runtime, peak replacement and science are distinct', () => {
  const preparation = quickPreparation();
  const sunlight = preparationTotals(preparation);
  const shadow = preparationTotals(preparation, true);
  assert.equal(sunlight.credits, 960);
  assert.equal(sunlight.massKg, 280);
  assert.equal(sunlight.normalW, 218);
  assert.equal(sunlight.peakW, 373);
  assert.equal(sunlight.landerW, 60);
  assert.equal(sunlight.solarW, 250);
  assert.equal(sunlight.batteryMinutes, null); // no steady sunlight deficit
  assert.equal(shadow.solarW, 0);
  assert.equal(shadow.batteryWh, 220);
  assert.equal(shadow.batteryMinutes, Math.floor(220 * .8 / 218 * 60));
  assert.equal(shadow.spentScience, 0);
  const deeper = preparationTotals({ ...preparation, drillDepthCm: 100 }, true);
  assert.equal(deeper.peakW, shadow.peakW);
  assert.ok(deeper.drillEnergyWh > shadow.drillEnergyWh);
  assert.equal(deeper.drillRisk, 'High');
  assert.equal(drillPotential(20), 5); assert.equal(drillPotential(50), 15); assert.equal(drillPotential(100), 35);
  assert.ok(drillPotential(30) > 5 && drillPotential(30) < 15);
  assert.equal(SCRIPT_COMPONENTS.find(p => p.id === 'msolo').massKg, null);
});
test('depth gates, undo/redo and assembly without fake mission approval', () => {
  let session = workshop('science-build');
  assert.equal(reduceMission(session, { type: 'depth', cm: 100 }), session);
  session = reduceMission(session, { type: 'install', ids: ['nss', 'nirvss', 'trident'] });
  assert.equal(session.preparation.drillDepthCm, 20);
  assert.equal(reduceMission(session, { type: 'depth', cm: 15 }), session);
  session = reduceMission(session, { type: 'depth', cm: 100 });
  assert.equal(session.preparation.drillDepthCm, 100);
  session = reduceMission(session, { type: 'undo' });
  assert.equal(session.preparation.drillDepthCm, 20);
  session = reduceMission(session, { type: 'redo' });
  assert.equal(session.preparation.drillDepthCm, 100);
  session = reduceMission(workshop(), { type: 'quick-build' });
  assert.equal(session.progress.stepId, 'mass-check');
  assert.equal(reduceMission(session, { type: 'next' }), session);
  assert.equal(session.progress.completedActivities.includes('budget-check'), false);
});
test('atomic saves keep actual choices; corrupt hardware cannot validate a later screen', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const preparation = quickPreparation();
  const progress = { ...workshop().progress, stepId: 'mass-check', completedActivities: verifiedActivities(preparation) };
  assert.equal(writeSelectionSession(storage, progress, false, preparation), true);
  const restored = readSelectionSession(storage);
  assert.equal(restored.progress.stepId, 'mass-check');
  assert.deepEqual(restored.preparation, preparation);
  assert.equal(restored.voiceEnabled, false);
  const invalid = JSON.parse(entries.get(STORY_SAVE_KEY));
  invalid.preparation.roverId = 'nss'; invalid.preparation.sciencePartIds.push('invented', 'nss');
  entries.set(STORY_SAVE_KEY, JSON.stringify(invalid));
  const repaired = readSelectionSession(storage);
  assert.equal(repaired.progress.stepId, 'rover-select');
  assert.equal(repaired.preparation.roverId, null);
  assert.deepEqual(repaired.preparation.sciencePartIds, ['nss', 'nirvss', 'trident']);
  assert.equal(restorePreparation({ landerPartIds: ['nss'], sciencePartIds: [], solarId: 'large-battery' }).solarId, null);
});
test('expensive choices retain real totals and cannot fake budget approval', () => {
  let preparation = quickPreparation();
  for (const id of ['heavy-rover', 'msolo', 'large-battery', 'advanced-thermal', 'high-gain-communication']) preparation = installPart(preparation, id);
  const total = preparationTotals(preparation);
  assert.ok(total.credits > 1000);
  assert.ok(total.massKg > 300);
  assert.ok(total.peakW <= 450);
  assert.equal(stageReady('budget-check', preparation), false);
});

test('Back after removing an earlier part cannot jump into a falsely completed summary', () => {
  let session = reduceMission(workshop(), { type: 'quick-build' });
  session = reduceMission(session, { type: 'visit-stage', stage: 'lander-build' });
  session = reduceMission(session, { type: 'remove', id: 'lander-body' });
  session = reduceMission(session, { type: 'back' });
  assert.equal(session.progress.stepId, 'lander-build');
  assert.equal(session.progress.completedActivities.includes('lander-build'), false);
});

test('Next guides two-card and one-card lander shelves without bypassing required parts', () => {
  const ids = SCRIPT_COMPONENTS.filter(part => part.category === 'lander').map(part => part.id);
  for (const size of [1, 2]) {
    let preparation = createPreparationSelection();
    for (let page = 0; page < ids.length / size; page++) {
      assert.deepEqual(nextWorkshopAction('lander-build', preparation, 'lander', page, size), { kind: 'install', remaining: size });
      preparation = ids.slice(page * size, (page + 1) * size).reduce(installPart, preparation);
      assert.deepEqual(nextWorkshopAction('lander-build', preparation, 'lander', page, size),
        page === ids.length / size - 1 ? { kind: 'advance' } : { kind: 'shelf', category: 'lander', page: page + 1 });
    }
  }
});

test('Next covers power, survival and drill planning; optional science never blocks it', () => {
  const empty = createPreparationSelection();
  assert.deepEqual(nextWorkshopAction('rover-select', empty, 'rover', 0, 2), { kind: 'shelf', category: 'rover', page: 1 });
  assert.deepEqual(nextWorkshopAction('rover-select', empty, 'rover', 1, 2), { kind: 'install', remaining: 1 });
  assert.deepEqual(nextWorkshopAction('power-build', empty, 'battery', 0, 1), { kind: 'shelf', category: 'battery', page: 1 });
  let preparation = installPart(createPreparationSelection(), 'standard-solar');
  assert.deepEqual(nextWorkshopAction('power-build', preparation, 'solar', 0, 2), { kind: 'shelf', category: 'battery', page: 0 });
  preparation = installPart(preparation, 'large-battery');
  // An alternative selected on page 2 still completes a single-choice category.
  assert.deepEqual(nextWorkshopAction('power-build', preparation, 'battery', 0, 2), { kind: 'advance' });
  preparation = installPart(preparation, 'basic-navigation-camera');
  assert.deepEqual(nextWorkshopAction('survival-build', preparation, 'navigation', 0, 2), { kind: 'shelf', category: 'thermal', page: 0 });
  preparation = installPart(preparation, 'basic-thermal');
  assert.deepEqual(nextWorkshopAction('survival-build', preparation, 'thermal', 0, 2), { kind: 'shelf', category: 'communication', page: 0 });
  preparation = installPart(preparation, 'basic-communication');
  assert.deepEqual(nextWorkshopAction('survival-build', preparation, 'communication', 0, 2), { kind: 'advance' });
  preparation = ['nss', 'nirvss', 'trident'].reduce(installPart, preparation);
  assert.deepEqual(nextWorkshopAction('science-build', preparation, 'science', 1, 2), { kind: 'depth' });
  assert.deepEqual(nextWorkshopAction('science-build', preparation, 'science', 2, 1), { kind: 'shelf', category: 'science', page: 3 });
  assert.deepEqual(nextWorkshopAction('science-build', preparation, 'science', 3, 1), { kind: 'depth' });
  assert.deepEqual(nextWorkshopAction('science-build', preparation, 'science', 0, 2, true), { kind: 'advance' });
  preparation = removePart(preparation, 'nss');
  assert.deepEqual(nextWorkshopAction('science-build', preparation, 'science', 0, 2, true), { kind: 'shelf', category: 'science', page: 0 });
});
