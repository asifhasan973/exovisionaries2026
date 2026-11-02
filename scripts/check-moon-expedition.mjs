import assert from 'node:assert/strict';
import { createScienceDemo, createSurfaceDemo } from '../src/game/story/moon/journeyDemo.ts';
import { reduceMission } from '../src/game/story/workshopSession.ts';
import { recommendedSite, expeditionSites, nextSurfaceTask, nextReturnAction } from '../src/game/story/moon/moonExpedition.ts';
import { scienceActive, scienceResult, scienceComplete, restoreScience, sciencePlan } from '../src/game/story/moon/science.ts';
import { surfaceSecured } from '../src/game/story/moon/incidents.ts';
import { returnActive, returnComplete } from '../src/game/story/moon/return.ts';

function geologyStart() {
  let session = createSurfaceDemo('female', 'lunar-geology');
  const act = event => { session = reduceMission(session, event); };
  const drive = () => { for (let i = 0; i < 100 && ['deploying', 'driving'].includes(session.moon.surface.stage); i++) act({ type: 'surface-tick', seconds: .25 }); };
  act({ type: 'surface-deploy' }); drive(); act({ type: 'next' });
  for (let leg = 0; leg < 2; leg++) { act({ type: 'surface-select', edge: 'base-lookout' }); act({ type: 'surface-start' }); drive(); }
  act({ type: 'next' }); act({ type: 'next' });
  return session;
}

for (const objective of ['lunar-ice', 'lunar-geology']) {
  let session = objective === 'lunar-ice' ? createScienceDemo('female') : geologyStart();
  const act = event => { session = reduceMission(session, event); };
  assert.equal(session.progress.stepId, 'ice-science');
  act({ type: 'science-target', target: 'edge' });
  const before = JSON.stringify(session.moon);
  const sites = expeditionSites(session.moon.science, session.moon, session.preparation);
  const site = recommendedSite(session.moon.science, session.moon, session.preparation);
  assert.equal(JSON.stringify(session.moon), before, 'A recommendation must never spend resources or modify evidence');
  assert.ok(site.plan.feasible, `${objective} must have a safe sample trip`);
  const cold = sites.find(option => option.target === 'edge');
  if (cold.plan.reason === 'thermal') assert.notEqual(site.target, 'edge', 'Do not preselect an unusable cold site');
  act({ type: 'science-target', target: site.target }); act({ type: 'science-program', program: 'sample' });
  if (site.depthCm) act({ type: 'science-depth', cm: site.depthCm });
  if (session.preparation.sciencePartIds.includes('msolo')) act({ type: 'science-gas', enabled: site.useGas });
  if (objective === 'lunar-geology') act({ type: 'science-sensor-plan', placement: 'ground' });
  act({ type: 'science-start' });
  for (let i = 0; i < 2200 && !scienceComplete(session.moon.science, session.moon.surface); i++) {
    const s = session.moon.science;
    assert.notEqual(s.phase, 'failed', 'Safe recommendation must complete with its modeled resources');
    if (s.hazards.pending) {
      const action = s.hazards.pending === 'dust' ? 'continue-dust' : s.hazards.pending === 'radio' ? 'follow-plan' : s.hazards.pending === 'radiation' ? 'robot-only' : 'safe-return';
      act({ type: 'science-incident', action });
    } else if (s.phase === 'sensor-site') act({ type: 'science-place-sensor', placement: 'ground' });
    else if (scienceActive(s)) act({ type: s.paused ? 'science-resume' : 'science-tick', seconds: .25 });
    else if (s.phase === 'report') { if (!s.fieldworkStopped) act({ type: 'science-claim', finding: scienceResult(s) }); act({ type: 'science-transmit' }); }
    else if (s.phase === 'ready' && session.moon.surface.location !== 'base') act({ type: 'science-home' });
  }
  assert.ok(scienceComplete(session.moon.science, session.moon.surface));
  assert.ok(session.moon.science.records.length > 0, 'Discovery must have actual instrument records');
  let restored = restoreScience(session.moon.science, session.moon, session.preparation);
  assert.deepEqual(restored.science.records, session.moon.science.records);
  assert.equal(restored.surface.batteryWh, session.moon.surface.batteryWh);
  act({ type: 'next' }); act({ type: 'next' }); assert.equal(session.progress.stepId, 'surface-recovery');
  for (let i = 0; i < 1000 && !surfaceSecured(session.moon); i++) {
    const science = session.moon.science;
    if (scienceActive(science)) act({ type: science.paused ? 'science-resume' : 'science-tick', seconds: .25 });
    else if (science.hazards.evaBlocked) act({ type: 'science-incident', action: 'shelter-wait' });
    else { const item = nextSurfaceTask(session.moon); assert.ok(item); act({ type: 'science-secure', item }); }
  }
  assert.ok(surfaceSecured(session.moon));
  assert.equal(nextSurfaceTask(session.moon), null);
  restored = restoreScience(session.moon.science, session.moon, session.preparation);
  assert.ok(surfaceSecured({ ...session.moon, science: restored.science, surface: restored.surface }));
  act({ type: 'next' }); act({ type: 'next' }); assert.equal(session.progress.stepId, 'crew-return');
  for (let i = 0; i < 1200 && !returnComplete(session.moon.returnFlight, session.moon.designSignature); i++) {
    const flight = session.moon.returnFlight;
    if (flight.paused) act({ type: 'return-resume' });
    else if (flight.stage === 'entry-ready') act({ type: 'return-action', action: 'shield' });
    else { const action = nextReturnAction(flight); if (action) act({ type: 'return-action', action }); else { assert.ok(returnActive(flight)); act({ type: 'return-tick', seconds: .25 }); } }
  }
  assert.ok(returnComplete(session.moon.returnFlight, session.moon.designSignature));
  assert.equal(session.moon.returnFlight.mistakes, 0);
  assert.equal(session.moon.returnFlight.crewLocation, 'ocean');
  console.log(`${objective}: safe recommendation → evidence → receipt replay → sequential packing → docking → splashdown passed`);
}

let stopped = createScienceDemo('female');
stopped = reduceMission(stopped, { type: 'science-end-fieldwork' });
assert.equal(stopped.moon.science.fieldworkStopped, true);
assert.equal(stopped.moon.science.records.length, 0, 'Early stop must not invent science');
assert.equal(stopped.moon.surface.location, 'base');
const replayedStop = restoreScience(stopped.moon.science, stopped.moon, stopped.preparation);
assert.equal(replayedStop.science.fieldworkStopped, true);
assert.equal(replayedStop.science.records.length, 0);
console.log('Safe early finish and its receipt replay passed');

// Reproduce cold exposure accumulated by scouting before planning a sample trip.
let coldSession = createSurfaceDemo('female', 'lunar-ice');
const coldAct = event => { coldSession = reduceMission(coldSession, event); };
const coldTravel = () => { for (let i = 0; i < 150 && ['deploying', 'driving'].includes(coldSession.moon.surface.stage); i++) coldAct({ type: 'surface-tick', seconds: .25 }); };
coldAct({ type: 'surface-deploy' }); coldTravel(); coldAct({ type: 'next' });
for (const edge of ['base-lookout', 'lookout-edge']) {
  coldAct({ type: 'surface-mode', mode: 'hold' }); coldAct({ type: 'surface-select', edge }); coldAct({ type: 'surface-arm' });
  coldAct({ type: 'surface-start' }); coldAct({ type: 'surface-held', held: true }); coldTravel();
}
coldAct({ type: 'next' }); coldAct({ type: 'next' }); coldAct({ type: 'science-target', target: 'edge' }); coldAct({ type: 'science-program', program: 'sample' });
assert.equal(sciencePlan(coldSession.moon.science, coldSession.moon, coldSession.preparation).reason, 'thermal');
const warmSite = recommendedSite(coldSession.moon.science, coldSession.moon, coldSession.preparation);
assert.equal(warmSite.target, 'lookout'); assert.ok(warmSite.plan.feasible);
console.log('Accumulated-cold regression: feasible sunlit sample site selected');
