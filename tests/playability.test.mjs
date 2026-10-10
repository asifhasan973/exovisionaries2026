import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryProgress, reduceStoryProgress } from '../src/game/story/progress.ts';
import { createJudgeMission } from '../src/game/story/demo.ts';
import { quickPreparation, installPart } from '../src/game/story/preparation.ts';
import { emptyTrial, reduceTrial, restoreTrial, trialPassed, trialPlan } from '../src/game/story/trial.ts';
import { emptyFlight, reduceFlight, restoreFlight } from '../src/game/story/flight.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
import { missionSignature } from '../src/game/story/readiness.ts';
import { readSelectionSession, writeSelectionSession } from '../src/game/story/selectionSession.ts';
import { finishTrial } from './mission-helpers.mjs';

const trialRun = (preparation, depth = 20, shadow = false) => {
  preparation = { ...preparation, drillDepthCm: depth };
  let state = reduceTrial(emptyTrial(), { type: 'trial-drive' }, 'design', preparation, shadow);
  for (const next of ['trial-drill', 'trial-return', null]) {
    for (let i = 0; i < 100 && ['outbound','drilling','returning'].includes(state.phase); i++) state = reduceTrial(state, { type: 'trial-tick', seconds: .25 }, 'design', preparation, shadow);
    if (next) state = reduceTrial(state, { type: next }, 'design', preparation, shadow);
  }
  return { state, preparation };
};
test('briefing skip preserves choices and never bypasses installation or approval', () => {
  let p = reduceStoryProgress(createStoryProgress(), { type: 'set-name', name: 'Sam' });
  p = reduceStoryProgress(p, { type: 'next' });
  p = reduceStoryProgress(p, { type: 'skip-briefing' });
  assert.equal(p.stepId, 'destination'); assert.equal(p.history.length, 3);
  assert.equal(reduceStoryProgress(p, { type: 'next' }), p);
  assert.equal(reduceStoryProgress(p, { type: 'skip-briefing' }), p);
  const demo = createJudgeMission();
  assert.equal(demo.progress.stepId, 'mass-check'); assert.equal(demo.preparation.landerPartIds.length, 6);
  assert.equal(demo.readiness.approved, null);
  assert.equal(reduceMission(demo, { type: 'flight-start' }), demo);
});
test('small battery fails deep drilling; changing battery or depth fixes the same test', () => {
  const small = installPart(quickPreparation(), 'small-battery');
  const failed = trialRun(small, 100); assert.equal(failed.state.phase, 'failed'); assert.equal(failed.state.fault, 'energy');
  const shallow = trialRun(small, 20); assert.equal(shallow.state.phase, 'complete');
  const bigger = trialRun(installPart(small, 'medium-battery'), 100);
  assert.equal(trialPassed(bigger.state, 'design', bigger.preparation, false), true);
  assert.ok(trialPlan(small, false).drillWh < trialPlan({ ...small, drillDepthCm: 100 }, false).drillWh);
  assert.equal(trialPlan(small, false).legWh, trialPlan(small, true).legWh); // Both rehearse zero solar.
});
test('thermal fault, wrong action, stale signature and forged trial completion cannot pass', () => {
  const prep = quickPreparation();
  const failed = trialRun(prep, 20, true); assert.equal(failed.state.fault, 'thermal');
  assert.equal(trialRun(installPart(prep,'advanced-thermal'),20,true).state.phase,'complete');
  assert.equal(reduceTrial(emptyTrial(),{type:'trial-return'},'design',prep,false).phase,'ready');
  const passed = trialRun(prep);
  assert.equal(trialPassed(passed.state,'other-design',prep,false),false);
  assert.equal(restoreTrial({...passed.state,spentWh:0},'design',prep,false).phase,'ready');
});
test('sensor repair and successful rehearsal are required, including after save/reload', () => {
  let mission = createJudgeMission();
  assert.equal(reduceMission(mission,{type:'run-check'}),mission);
  mission = reduceMission(reduceMission(reduceMission(mission,{type:'connect-radar'}),{type:'run-check'}),{type:'next'});
  assert.equal(mission.progress.stepId,'power-check');
  assert.equal(reduceMission(mission,{type:'run-check'}),mission);
  mission = reduceMission(mission,{type:'trial-drive'});
  mission = reduceMission(mission,{type:'trial-tick',seconds:.25});
  const store = new Map(), storage = {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  writeSelectionSession(storage,mission.progress,false,mission.preparation,mission.readiness,mission.flight);
  const restored = readSelectionSession(storage); assert.equal(restored.readiness.trial.paused,true); assert.equal(restored.readiness.trial.phase,'outbound');
  mission = reduceMission(mission,{type:'trial-retry'}); mission = finishTrial(mission);
  assert.equal(mission.readiness.trial.phase,'complete');
  mission = reduceMission(mission,{type:'run-check'});
  assert.equal(mission.readiness.checks['power-check'],missionSignature(mission.progress,mission.preparation));
  const edited = reduceMission(reduceMission(mission,{type:'visit-stage',stage:'power-build'}),{type:'install',ids:['large-battery']});
  assert.equal(edited.readiness.trial.phase,'ready'); assert.deepEqual(edited.readiness.checks,{});
});
test('challenge rejects early release, catches missed window, permits retry and safe ordered release', () => {
  let f = reduceFlight(emptyFlight(),{type:'flight-mode',mode:'challenge'},'d');
  f = reduceFlight(f,{type:'flight-start'},'d');
  const tick = target => { for(let i=0;i<300 && f.t<target && f.status==='running';i++) f=reduceFlight(f,{type:'flight-tick',seconds:.25},'d'); };
  tick(8); f=reduceFlight(f,{type:'flight-action',action:'booster'},'d'); assert.equal(f.events.length,0); assert.equal(f.attempts,1);
  tick(20); assert.equal(f.status,'awaiting'); assert.equal(f.missedWindow,true);
  const reload=restoreFlight(f,'d',true); assert.equal(reload.mode,'challenge'); assert.equal(reload.missedWindow,true);
  f=reduceFlight(f,{type:'flight-retry-window'},'d'); assert.equal(f.t,16);
  f=reduceFlight(f,{type:'flight-action',action:'booster'},'d'); assert.deepEqual(f.events,['booster']);
  tick(24); f=reduceFlight(f,{type:'flight-action',action:'fairing'},'d');
  tick(38); assert.equal(f.status,'complete'); assert.equal(f.attempts,2);
});


test('every engineer reaction has real face and body assets', async () => {
  const { readFile } = await import('node:fs/promises');
  const { engineerCue } = await import('../src/game/story/engineer.ts');
  const { ENGINEER_LINES } = await import('../src/game/story/voiceClips.ts');
  const manifest = JSON.parse(await readFile(new URL('../public/story/characters-v1/manifest.json', import.meta.url), 'utf8'));
  for (const reaction of Object.keys(ENGINEER_LINES)) {
    const cue = engineerCue(reaction);
    assert.ok(manifest.characters[cue.character].expressions[cue.expression], reaction + ': face');
    assert.ok(manifest.characters[cue.character].poses[cue.pose], reaction + ': pose');
  }
});


test('a real completed trial accepts power automatically; retry and forged completion cannot advance', () => {
  let mission = createJudgeMission();
  mission = reduceMission(reduceMission(reduceMission(mission, { type: 'connect-radar' }), { type: 'run-check' }), { type: 'next' });
  const passed = finishTrial(mission);
  assert.equal(passed.readiness.checks['power-check'], missionSignature(passed.progress, passed.preparation));
  assert.equal(reduceMission(passed, { type: 'next' }).progress.stepId, 'budget-check');
  const retry = reduceMission(passed, { type: 'trial-retry' });
  assert.equal(reduceMission(retry, { type: 'next' }), retry);
  const saved = { ...passed.readiness, checks: { 'mass-check': passed.readiness.checks['mass-check'] } };
  const resumed = createWorkshopSession(passed.progress, passed.preparation, saved);
  assert.equal(reduceMission(resumed, { type: 'next' }).progress.stepId, 'budget-check');
  const forged = createWorkshopSession(passed.progress, passed.preparation, { ...saved, trial: { ...saved.trial, spentWh: 0 } });
  assert.equal(reduceMission(forged, { type: 'next' }), forged);
});
