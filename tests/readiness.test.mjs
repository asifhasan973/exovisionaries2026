import { satisfyInteraction } from './mission-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { quickPreparation, installPart, verifiedActivities, WORKSHOP_PARTS } from '../src/game/story/preparation.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
import { evaluateReadiness, CHECK_IDS, PACKING_ACTIONS, missionSignature, packingComplete, emptyReadiness } from '../src/game/story/readiness.ts';
import { readSelectionSession, writeSelectionSession } from '../src/game/story/selectionSession.ts';
const start = (prep = quickPreparation(), site = 'crater-rim') => createWorkshopSession({ ...createStoryProgress(), playerName: 'Asha', stepId: 'mass-check', selections: { destination: 'moon', objective: 'lunar-ice', site }, completedActivities: verifiedActivities(prep) }, prep);
function checkAll(session) { for (const id of CHECK_IDS) { assert.equal(session.progress.stepId, id); session = reduceMission(satisfyInteraction(session), { type: 'run-check' }); session = reduceMission(session, { type: 'next' }); } return session; }
function approve(session = start()) { session = checkAll(session); for (const action of PACKING_ACTIONS) session = reduceMission(session, { type: 'pack', action }); return reduceMission(session, { type: 'next' }); }
const storage = () => { const entries = new Map(); return { entries, getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }; };

test('live mass, peak replacement, drill energy and credit totals pass the real sample', () => {
  const session = start(), data = evaluateReadiness(session.progress, session.preparation);
  assert.equal(data.massKg, 280); assert.equal(data.credits, 960); assert.equal(data.peakW, 373); assert.equal(data.marginW, 77);
  assert.equal(data.rehearsalWh, 60.7); assert.equal(data.usableWh, 176); assert.equal(data.remainingWh, 159.3);
  assert.deepEqual(Object.values(data.pass), [true, true, true]);
  assert.equal(data.spentScience, 0);
});
test('Next cannot bypass scans or ordered packing, and approval snapshots are immutable', () => {
  let session = start(); assert.equal(reduceMission(session, { type: 'next' }), session);
  assert.equal(reduceMission(session, { type: 'pack', action: 'payload' }), session);
  session = checkAll(session); assert.equal(session.progress.stepId, 'rocket-pack');
  assert.equal(reduceMission(session, { type: 'next' }), session);
  assert.equal(reduceMission(session, { type: 'pack', action: 'fairing' }), session);
  for (const action of PACKING_ACTIONS) session = reduceMission(session, { type: 'pack', action });
  assert.equal(packingComplete(session.progress, session.preparation, session.readiness), true);
  assert.equal(session.readiness.approved, null);
  session = reduceMission(session, { type: 'next' });
  assert.equal(session.progress.stepId, 'launch-ready');
  assert.equal(session.readiness.approved.components.length, 15);
  assert.equal(Object.isFrozen(session.readiness.approved.totals), true);
  assert.throws(() => { session.readiness.approved.components[0].massKg = 0; }, TypeError);
});
test('shadow equipment and finite energy gates require an actual correction', () => {
  let session = start(quickPreparation(), 'permanent-shadow');
  session = reduceMission(reduceMission(satisfyInteraction(session), { type: 'run-check' }), { type: 'next' });
  assert.equal(session.progress.stepId, 'power-check');
  assert.equal(evaluateReadiness(session.progress, session.preparation).thermalOK, false);
  assert.equal(reduceMission(session, { type: 'run-check' }), session);
  assert.equal(reduceMission(session, { type: 'next' }), session);
  const corrected = installPart(session.preparation, 'advanced-thermal');
  assert.equal(evaluateReadiness(session.progress, corrected).credits, 1000);
  assert.equal(evaluateReadiness(session.progress, corrected).pass['power-check'], true);
  let empty = installPart(installPart(corrected, 'heavy-rover'), 'small-battery');
  empty = { ...empty, drillDepthCm: 100 };
  const data = evaluateReadiness(session.progress, empty);
  assert.equal(data.batteryOK, false); assert.equal(data.pass['power-check'], false);
});
test('budget rejects real expensive hardware; incomplete designs reject every check', () => {
  let prep = quickPreparation(); for (const id of ['heavy-rover', 'msolo', 'large-battery', 'advanced-thermal', 'high-gain-communication']) prep = installPart(prep, id);
  const data = evaluateReadiness(start(prep).progress, prep);
  assert.ok(data.remainingCredits < 0); assert.equal(data.pass['budget-check'], false);
  const broken = { ...prep, roverId: null };
  assert.deepEqual(Object.values(evaluateReadiness(start(broken).progress, broken).pass), [false, false, false]);
  // Do not fabricate the script's overweight example; the live catalogue must remain truthful.
  const maximum = WORKSHOP_PARTS.filter(p => ['lander', 'science'].includes(p.category)).reduce((sum, p) => sum + p.massKg, 0)
    + ['rover', 'solar', 'battery', 'thermal', 'navigation', 'communication'].reduce((sum, category) => sum + Math.max(...WORKSHOP_PARTS.filter(p => p.category === category).map(p => p.massKg)), 0);
  assert.equal(maximum <= 350, true);
});
test('edits invalidate every check, packing and approval; Back cannot return to a stale endpoint', () => {
  let session = approve(); const snapshot = session.readiness.approved;
  session = reduceMission(session, { type: 'visit-stage', stage: 'science-build' });
  session = reduceMission(session, { type: 'depth', cm: 30 });
  assert.deepEqual(session.readiness, emptyReadiness());
  session = reduceMission(session, { type: 'back' });
  assert.equal(session.progress.stepId, 'mass-check');
  assert.equal(snapshot.drillDepthCm, 20);
  assert.equal(session.progress.completedActivities.includes('rocket-pack'), false);
  const named = approve();
  const renamed = reduceMission({ ...named, progress: { ...named.progress, stepId: 'player-name' } }, { type: 'set-name', name: 'Nova' });
  assert.deepEqual(renamed.readiness, emptyReadiness());
  const reselected = reduceMission({ ...named, progress: { ...named.progress, stepId: 'site' } }, { type: 'select', choiceId: 'permanent-shadow' });
  assert.deepEqual(reselected.readiness, emptyReadiness());
});
test('atomic saves resume checks and packing; altered specs and fake approval are repaired', () => {
  const store = storage(); let session = start();
  session = reduceMission(satisfyInteraction(session), { type: 'run-check' });
  writeSelectionSession(store, session.progress, false, session.preparation, session.readiness);
  let saved = readSelectionSession(store); assert.equal(saved.readiness.checks['mass-check'], missionSignature(session.progress, session.preparation));
  session = approve(); writeSelectionSession(store, session.progress, false, session.preparation, session.readiness);
  saved = readSelectionSession(store); assert.equal(saved.progress.stepId, 'launch-ready'); assert.deepEqual(saved.readiness.approved, session.readiness.approved);
  let corrupt = JSON.parse(store.entries.get(STORY_SAVE_KEY)); corrupt.preparation.drillDepthCm = 100;
  store.entries.set(STORY_SAVE_KEY, JSON.stringify(corrupt)); saved = readSelectionSession(store);
  assert.equal(saved.progress.stepId, 'mass-check'); assert.equal(saved.readiness.approved, null);
  writeSelectionSession(store, session.progress, false, session.preparation, session.readiness);
  corrupt = JSON.parse(store.entries.get(STORY_SAVE_KEY)); corrupt.readiness.approved.totals.credits = 0;
  store.entries.set(STORY_SAVE_KEY, JSON.stringify(corrupt)); saved = readSelectionSession(store);
  assert.equal(saved.progress.stepId, 'rocket-pack'); assert.equal(saved.readiness.approved, null);
  const partial = reduceMission(checkAll(start()), { type: 'pack', action: 'adapter' });
  writeSelectionSession(store, partial.progress, false, partial.preparation, partial.readiness);
  assert.deepEqual(readSelectionSession(store).readiness.packing, ['adapter']);
});
