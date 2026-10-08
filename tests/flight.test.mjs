import { satisfyInteraction } from './mission-helpers.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryProgress, reduceStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { STORY_FLOW } from '../src/game/story/flow.ts';
import { quickPreparation, verifiedActivities } from '../src/game/story/preparation.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
import { CHECK_IDS, PACKING_ACTIONS, missionSignature } from '../src/game/story/readiness.ts';
import { emptyFlight, reduceFlight, restoreFlight, flightComplete, flightTelemetry } from '../src/game/story/flight.ts';
import { readSelectionSession, writeSelectionSession } from '../src/game/story/selectionSession.ts';
export function approvedMission() {
  const preparation = quickPreparation();
  let progress = reduceStoryProgress(createStoryProgress(), { type:'set-name', name:'Asha' });
  while (progress.stepId !== 'mass-check') {
    const step = STORY_FLOW.find(step => step.id === progress.stepId);
    if (step.kind === 'choice') progress = reduceStoryProgress(progress, { type:'select', choiceId:step.options.find(option => option.available).id });
    if (step.kind === 'activity') progress = { ...progress, completedActivities:verifiedActivities(preparation) };
    progress = reduceStoryProgress(progress, { type:'next' });
  }
  let mission = createWorkshopSession(progress, preparation);
  for (const id of CHECK_IDS) { assert.equal(mission.progress.stepId,id); mission = reduceMission(reduceMission(satisfyInteraction(mission),{type:'run-check'}),{type:'next'}); }
  for (const action of PACKING_ACTIONS) mission=reduceMission(mission,{type:'pack',action});
  return reduceMission(mission,{type:'next'});
}
const tickUntil = (flight,t) => { while(flight.t<t && flight.status==='running') flight=reduceFlight(flight,{type:'flight-tick',seconds:.25},'design'); return flight; };
test('only approved, packed hardware can enter flight; Next requires completed ascent',()=>{
  const approved=approvedMission();
  assert.equal(approved.progress.stepId,'launch-ready');
  assert.equal(reduceMission(approved,{type:'flight-start'}),approved);
  const launch=reduceMission(approved,{type:'next'});
  assert.equal(launch.progress.stepId,'liftoff');
  assert.equal(reduceMission(launch,{type:'next'}),launch);
  const invalid={...launch,readiness:{...launch.readiness,approved:null}};
  assert.equal(reduceMission(invalid,{type:'flight-start'}),invalid);
});
test('ascent pauses at both ordered actions; clock rejects invalid values and limits stalls',()=>{
  let flight=reduceFlight(emptyFlight(),{type:'flight-start'},'design');
  const original=flight;
  assert.equal(reduceFlight(flight,{type:'flight-tick',seconds:NaN},'design'),original);
  flight=reduceFlight(flight,{type:'flight-tick',seconds:100},'design'); assert.equal(flight.t,.25);
  flight=tickUntil(flight,16); assert.equal(flight.status,'awaiting');
  assert.equal(reduceFlight(flight,{type:'flight-tick',seconds:.25},'design'),flight);
  assert.equal(reduceFlight(flight,{type:'flight-action',action:'fairing'},'design'),flight);
  flight=reduceFlight(flight,{type:'flight-action',action:'booster'},'design');
  flight=tickUntil(flight,24); assert.equal(flight.status,'awaiting');
  assert.equal(flightTelemetry(flight).engineOn,true);
  flight=reduceFlight(flight,{type:'flight-action',action:'fairing'},'design');
  flight=tickUntil(flight,38); assert.equal(flightComplete(flight,'design'),true);
  const data=flightTelemetry(flight); assert.equal(data.altitudeKm,200); assert.ok(Math.abs(data.speedKmS-7.7885)<.002); assert.ok(data.gravityMS2>9); assert.equal(data.engineOn,false);
});
test('pause and speed changes preserve position; skip is marked and replay clears completion',()=>{
  let flight=tickUntil(reduceFlight(emptyFlight(),{type:'flight-start'},'design'),10);
  flight=reduceFlight(flight,{type:'flight-pause'},'design'); const t=flight.t;
  flight=reduceFlight(flight,{type:'flight-speed',speed:2},'design'); assert.equal(flight.t,t);
  assert.equal(reduceFlight(flight,{type:'flight-tick',seconds:.25},'design'),flight);
  assert.equal(reduceFlight(flight,{type:'flight-speed',speed:50},'design'),flight);
  flight=reduceFlight(flight,{type:'flight-resume'},'design'); flight=reduceFlight(flight,{type:'flight-tick',seconds:.25},'design'); assert.equal(flight.t,t+.5);
  flight=reduceFlight(flight,{type:'flight-skip'},'design'); assert.equal(flight.skipped,true); assert.equal(flightComplete(flight,'design'),true);
  assert.deepEqual(reduceFlight(flight,{type:'flight-replay'},'design'),{...emptyFlight(),speed:2});
});
test('reload pauses running flights, retains pending actions and repairs forged orbit saves',()=>{
  let session=reduceMission(approvedMission(),{type:'next'});
  session=reduceMission(session,{type:'flight-start'}); session=reduceMission(session,{type:'flight-tick',seconds:.2});
  const entries=new Map(), storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
  const save=()=>writeSelectionSession(storage,session.progress,false,session.preparation,session.readiness,session.flight);
  save(); let restored=readSelectionSession(storage); assert.equal(restored.progress.stepId,'liftoff'); assert.equal(restored.flight.status,'paused'); assert.equal(restored.flight.t,.2);
  const signature=missionSignature(session.progress,session.preparation);
  assert.equal(restoreFlight({...session.flight,t:20},signature,true).status,'ready');
  assert.equal(restoreFlight({...session.flight,t:16,status:'awaiting'},signature,true).status,'awaiting');
  const corrupt=JSON.parse(entries.get(STORY_SAVE_KEY)); corrupt.stepId='earth-orbit'; corrupt.completedActivities.push('liftoff');
  entries.set(STORY_SAVE_KEY,JSON.stringify(corrupt)); assert.equal(readSelectionSession(storage).progress.stepId,'liftoff');
  session=reduceMission(reduceMission(session,{type:'flight-skip'}),{type:'next'}); save(); restored=readSelectionSession(storage); assert.equal(restored.progress.stepId,'earth-orbit'); assert.equal(restored.flight.skipped,true);
  const replay=reduceMission(session,{type:'flight-replay'}); assert.equal(replay.progress.stepId,'liftoff'); assert.equal(replay.progress.completedActivities.includes('liftoff'),false); assert.equal(reduceMission(replay,{type:'back'}).progress.stepId,'launch-ready');
  const edited={...session,progress:{...session.progress,stepId:'science-build',history:[...session.progress.history,{stepId:'earth-orbit',lineIndex:0}]}};
  const changed=reduceMission(edited,{type:'depth',cm:30}); assert.deepEqual(changed.flight,emptyFlight()); assert.equal(changed.readiness.approved,null);
  assert.equal(reduceMission(changed,{type:'back'}).progress.stepId,'mass-check');
});
