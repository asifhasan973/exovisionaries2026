import assert from 'node:assert/strict';
import { createSurfaceDemo } from '../src/game/story/moon/journeyDemo.ts';
import { reduceMission } from '../src/game/story/workshopSession.ts';
import { ROVER_BASE, ROVER_SITES, ROVER_CAMPS, ROVER_ROCKS, ROVER_HOLES, restoreRover, roverReady, freshRover, reduceRover } from '../src/game/story/moon/rover.ts';
import { returnedSampleKg } from '../src/game/story/moon/geologyScience.ts';
import { readSelectionSession, writeSelectionSession, FULL_MOON_SAVE_KEY } from '../src/game/story/selectionSession.ts';
import { returnAuthorized } from '../src/game/story/moon/return.ts';

function playable(objective) {
  let session = createSurfaceDemo('female', objective);
  session={...session,moon:{...session.moon,rover:freshRover(session.moon,1)}};
  const act = event => { session = reduceMission(session, event); };
  const tick = (n = 1) => { for (let i = 0; i < n; i++) act({ type: 'rover-tick', seconds: .1 }); };
  const control = (throttle = 0, steer = 0, drill = false) => act({ type: 'rover-control', throttle, steer, drill });
  const clear = (x, z) => Math.abs(x) < 44 && Math.abs(z) < 44 && !ROVER_ROCKS.some(r => Math.hypot(x - r.x, z - r.z) < r.radius + 1.7) && !ROVER_HOLES.some(h => Math.hypot(x - h.x, z - h.z) < h.radius + 1.7);
  const direct = (a, b) => { const n = Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) * 4); for (let i = 0; i <= n; i++) if (!clear(a.x + (b.x - a.x) * i / Math.max(1, n), a.z + (b.z - a.z) * i / Math.max(1, n))) return false; return true; };
  function pathTo(destination) {
    const start = { x: Math.round(session.moon.rover.x / 2) * 2, z: Math.round(session.moon.rover.z / 2) * 2 }, target = { x: Math.round(destination.x / 2) * 2, z: Math.round(destination.z / 2) * 2 };
    const key = p => `${p.x},${p.z}`, open = [start], costs = new Map([[key(start), 0]]), previous = new Map(), closed = new Set();
    while (open.length) {
      open.sort((a, b) => costs.get(key(a)) + Math.hypot(a.x - target.x, a.z - target.z) - costs.get(key(b)) - Math.hypot(b.x - target.x, b.z - target.z));
      const at = open.shift(), id = key(at); if (closed.has(id)) continue; closed.add(id);
      if (Math.hypot(at.x - target.x, at.z - target.z) < .1) {
        const path = [destination]; let cursor = at; while (cursor) { path.unshift(cursor); cursor = previous.get(key(cursor)); }
        path.unshift({ x: session.moon.rover.x, z: session.moon.rover.z });
        const smooth = []; let i = 0; while (i < path.length - 1) { let j = path.length - 1; while (j > i + 1 && !direct(path[i], path[j])) j--; smooth.push(path[j]); i = j; } return smooth;
      }
      for (const dx of [-2, 0, 2]) for (const dz of [-2, 0, 2]) {
        if (!dx && !dz) continue; const next = { x: at.x + dx, z: at.z + dz }, nextId = key(next), cost = costs.get(id) + Math.hypot(dx, dz);
        if (!clear(next.x, next.z) || !direct(at, next) || cost >= (costs.get(nextId) ?? Infinity)) continue;
        costs.set(nextId, cost); previous.set(nextId, at); open.push(next);
      }
    }
    throw new Error('No navigable route to ' + JSON.stringify(destination));
  }
  function navigate(destination) {
    for (const waypoint of pathTo(destination)) {
      control(); tick(8);
      for (let i = 0; i < 100; i++) {
        const r = session.moon.rover, heading = Math.atan2(waypoint.x - r.x, -(waypoint.z - r.z)), error = Math.atan2(Math.sin(heading - r.heading), Math.cos(heading - r.heading));
        if (Math.abs(error) < .085) break; control(0, Math.sign(error)); tick();
      }
      control(1);
      for (let i = 0; i < 250 && Math.hypot(waypoint.x - session.moon.rover.x, waypoint.z - session.moon.rover.z) > .6; i++) {
        const r = session.moon.rover, heading = Math.atan2(waypoint.x - r.x, -(waypoint.z - r.z)), error = Math.atan2(Math.sin(heading - r.heading), Math.cos(heading - r.heading));
        control(1, Math.abs(error) > .1 ? Math.sign(error) : 0); tick(); assert.notEqual(session.moon.rover.phase, 'failed', 'Navigation must not teleport or cross blocked terrain');
      }
      control(); tick(8);
    }
    assert.ok(Math.hypot(destination.x - session.moon.rover.x, destination.z - session.moon.rover.z) < 2.7, 'Must physically reach destination');
  }
  const drill = () => { act({ type: 'rover-drill' }); assert.equal(session.moon.rover.phase, 'drilling'); control(0, 0, true); tick(70); control(); };
  act({ type: 'rover-talk' }); act({ type: 'rover-talk' }); tick(40); assert.equal(session.moon.rover.phase, 'exploring');
  return { get session() { return session; }, act, tick, control, navigate, drill };
}
for (const objective of ['lunar-ice', 'lunar-geology']) {
  const game = playable(objective);
  if(objective==='lunar-ice'){game.navigate(ROVER_SITES[1]); game.drill(); assert.equal(game.session.moon.rover.cargo.length, 0); assert.ok(game.session.moon.rover.hardSeen, 'Hard site can be the first stop');}
  game.navigate(ROVER_SITES[2]); game.drill(); assert.deepEqual(game.session.moon.rover.cargo, ['C']);
  game.act({ type: 'rover-drill' }); assert.equal(game.session.moon.rover.phase, 'exploring', 'A collected site cannot generate another sample');
  game.navigate(ROVER_SITES[0]); game.drill(); assert.deepEqual(game.session.moon.rover.cargo, ['C', 'A']);
  assert.equal(game.session.moon.rover.deposited.length, 0, 'Cargo alone does not finish the mission');
  game.navigate(ROVER_BASE); game.act({ type: 'rover-unload' });
  if(objective==='lunar-ice'){assert.equal(game.session.moon.rover.phase,'cabin');game.act({ type: 'rover-talk' }); game.act({ type: 'rover-talk' });}else{assert.equal(game.session.moon.rover.phase,'exploring');assert.equal(game.session.moon.rover.drilled.length,2,'Two drills suffice when hard soil is avoided');}
  game.control(1); game.tick(2); game.act({ type: 'rover-pause' }); const stop = { x: game.session.moon.rover.x, z: game.session.moon.rover.z };
  game.tick(20); assert.equal(game.session.moon.rover.z, stop.z); game.act({ type: 'rover-resume' }); game.tick(5); assert.equal(game.session.moon.rover.z, stop.z);
  const replay = restoreRover({ ...game.session.moon.rover, x: 999, deposited: ['D', 'E', 'F'] }, game.session.moon);
  assert.deepEqual(replay.deposited, ['C', 'A']); assert.equal(replay.x, game.session.moon.rover.x); assert.equal(replay.batteryWh, game.session.moon.rover.batteryWh);
  game.act({ type: 'rover-prepare' }); game.act({ type: 'rover-talk' }); game.act({ type: 'rover-talk' }); game.tick(50);
  assert.ok(roverReady(game.session.moon.rover)); assert.equal(returnedSampleKg(game.session.moon), .4);
  game.act({ type: 'rover-launch' }); assert.equal(game.session.progress.stepId, 'crew-return'); assert.ok(returnAuthorized(game.session.moon));
  const data = new Map(), storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const s = game.session; assert.ok(writeSelectionSession(storage, s.progress, true, s.preparation, s.readiness, s.flight, s.moon)); assert.ok(data.has(FULL_MOON_SAVE_KEY));
  const loaded = readSelectionSession(storage); assert.equal(loaded.progress.stepId, 'crew-return'); assert.deepEqual(loaded.moon.rover.deposited, ['C', 'A']); assert.ok(returnAuthorized(loaded.moon));
  console.log(objective + ': any-order driving, optional hard soil, two deposits, neutral pause replay, physical samples, launch and complete save roundtrip passed');
}
const game = playable('lunar-ice');
game.navigate(ROVER_SITES[0]); game.drill(); game.navigate(ROVER_CAMPS[1]); game.tick(30);
assert.deepEqual(game.session.moon.rover.checkpoint.cargo, ['A']);
game.navigate(ROVER_SITES[5]); game.drill(); assert.deepEqual(game.session.moon.rover.cargo, ['A', 'F']);
game.tick(1500); assert.equal(game.session.moon.rover.phase, 'failed');
game.act({ type: 'rover-retry' }); assert.equal(game.session.moon.rover.phase, 'exploring'); assert.deepEqual(game.session.moon.rover.cargo, ['A']); assert.equal(game.session.moon.rover.x, ROVER_CAMPS[1].x); assert.equal(game.session.moon.rover.batteryWh, game.session.moon.rover.capacityWh);
const restored = restoreRover(game.session.moon.rover, game.session.moon); assert.deepEqual(restored.cargo, ['A']); assert.equal(restored.attempts, 1);
console.log('Darkness failure: retry returns to saved sunny camp; secured samples stay, unsaved samples do not');

const moon=createSurfaceDemo('female','lunar-ice').moon;
const rock=ROVER_ROCKS[0];let collision={...freshRover(moon,1),phase:'exploring',deployed:true,x:rock.x,z:rock.z+rock.radius+2,throttle:1};
for(let i=0;i<20;i++)collision=reduceRover(collision,{type:'rover-tick',seconds:.1},moon);
assert.ok(Math.hypot(collision.x-rock.x,collision.z-rock.z)>=rock.radius+1);assert.equal(collision.notice,'rock');
const hole=ROVER_HOLES[0];let trapped={...freshRover(moon,1),phase:'exploring',deployed:true,x:hole.x,z:hole.z+hole.radius+1.5,throttle:1};
for(let i=0;i<30;i++)trapped=reduceRover(trapped,{type:'rover-tick',seconds:.1},moon);
assert.equal(trapped.phase,'failed');assert.equal(trapped.failedReason,'hole');
let freeze={...freshRover(moon,1),phase:'exploring',deployed:true,throttle:1};freeze=reduceRover(freeze,{type:'rover-input-pause'},moon);
assert.equal(freeze.paused,false);assert.equal(freeze.throttle,0);freeze=reduceRover(freeze,{type:'rover-pause'},moon);freeze=reduceRover(freeze,{type:'rover-input-pause'},moon);assert.equal(freeze.paused,true);
assert.equal(restoreRover({...freeze,commands:[{type:'advance',frames:Infinity}]},moon),undefined);
console.log('Collision, hole failure, global freeze without accidental resume, and invalid receipt rejection passed');

let midDrive={...freshRover(moon,1),phase:'exploring',deployed:true};
// Create an authentic deployment prefix before checking a moving-save reload.
let authentic=freshRover(moon,1);authentic=reduceRover(authentic,{type:'rover-talk'},moon);authentic=reduceRover(authentic,{type:'rover-talk'},moon);
for(let i=0;i<35;i++)authentic=reduceRover(authentic,{type:'rover-tick',seconds:.1},moon);
authentic=reduceRover(authentic,{type:'rover-control',throttle:1,steer:0,drill:false},moon);authentic=reduceRover(authentic,{type:'rover-tick',seconds:.2},moon);
midDrive=restoreRover(authentic,moon);const savedZ=midDrive.z;midDrive=reduceRover(midDrive,{type:'rover-resume'},moon);midDrive=reduceRover(midDrive,{type:'rover-tick',seconds:.2},moon);
assert.equal(midDrive.z,savedZ);assert.equal(restoreRover(midDrive,moon).z,midDrive.z);
console.log('Mid-drive reload resumes neutral, and the second receipt replay remains identical');
