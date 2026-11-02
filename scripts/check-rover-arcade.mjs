import assert from 'node:assert/strict';
import {createSurfaceDemo} from '../src/game/story/moon/journeyDemo.ts';
import {reduceMission} from '../src/game/story/workshopSession.ts';
import {freshRover,reduceRover,restoreRover,roverAim,roverRocks,roverHoles,ROVER_SITES,ROVER_BASE} from '../src/game/story/moon/rover.ts';
import {COURSE_PATHS,courseHeight} from '../src/game/story/moon/roverCourse.ts';
import {readSelectionSession,writeSelectionSession} from '../src/game/story/selectionSession.ts';

const mission=createSurfaceDemo('female','lunar-ice'),moon=mission.moon;
mission.moon.rover=freshRover(moon,2);
function start(version=2){let s=freshRover(moon,version);s=reduceRover(s,{type:'rover-talk'},moon);s=reduceRover(s,{type:'rover-talk'},moon);for(let i=0;i<40;i++)s=reduceRover(s,{type:'rover-tick',seconds:.1},moon);return s;}
function tick(s,n){for(let i=0;i<n;i++)s=reduceRover(s,{type:'rover-tick',seconds:.05},moon);return s;}
function control(s,throttle,steer=0){return reduceRover(s,{type:'rover-control',throttle,steer,drill:false},moon);}
let parked=start(),heading=parked.heading;parked=tick(control(parked,0,1),30);assert.equal(parked.heading,heading,'Steering cannot spin the stopped vehicle');
let driving=start();driving=tick(control(driving,1,1),20);assert.ok(driving.heading>heading);assert.ok(driving.speed>0&&driving.speed<=7.5);
let braking=tick(control(driving,-1,0),4);assert.ok(braking.speed<driving.speed);braking=tick(braking,80);assert.ok(braking.speed<0,'S brakes first, then reverses');
let reverse={...start(),phase:'exploring',speed:-2};const initial=reverse.heading;reverse=tick(control(reverse,-1,1),4);assert.ok(reverse.heading<initial,'Steering reverses with vehicle direction');
assert.ok(courseHeight(-28,-23)>courseHeight(ROVER_BASE.x,ROVER_BASE.z)+4,'The ridge is a real climb');assert.equal(COURSE_PATHS.length,4);
assert.notDeepEqual(roverRocks(start()),roverRocks(start(1)),'New obstacles must not change legacy receipts');
console.log('Arcade acceleration, braking/reverse, rolling steering, course relief and legacy isolation passed');

let s=mission;
const act=event=>{s=reduceMission(s,event);};
const steps=n=>{for(let i=0;i<n;i++)act({type:'rover-tick',seconds:.05});};
act({type:'rover-talk'});act({type:'rover-talk'});steps(65);
const a=ROVER_SITES[0];
act({type:'rover-control',throttle:1,steer:0,drill:false});
for(let i=0;i<120&&Math.hypot(s.moon.rover.x-a.x,s.moon.rover.z-a.z)>3.8;i++)steps(1);
act({type:'rover-control',throttle:-1,steer:0,drill:false});for(let i=0;i<30&&s.moon.rover.speed>.05;i++)steps(1);
act({type:'rover-control',throttle:0,steer:0,drill:false});steps(10);
assert.ok(Math.hypot(s.moon.rover.x-a.x,s.moon.rover.z-a.z)<2.7,'Physically park at site A');
act({type:'rover-drill'});assert.equal(s.moon.rover.phase,'drilling');
act({type:'rover-aim'});assert.equal(s.moon.rover.phase,'drilling');assert.equal(s.moon.rover.cargo.length,0,'A missed alignment gives no sample');
for(let i=0;i<60&&!(roverAim(s.moon.rover)>=.4&&roverAim(s.moon.rover)<=.6);i++)steps(1);
act({type:'rover-aim'});assert.equal(s.moon.rover.phase,'collecting');assert.equal(s.moon.rover.cargo.length,0,'Alignment alone cannot grant a sample');
steps(60);assert.equal(s.moon.rover.phase,'sample-result');assert.deepEqual(s.moon.rover.cargo,['A']);
act({type:'rover-continue'});assert.equal(s.moon.rover.phase,'exploring');
const replay=restoreRover({...s.moon.rover,cargo:['A','C','D'],x:999},s.moon);assert.deepEqual(replay.cargo,['A']);assert.equal(replay.x,s.moon.rover.x);
const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
assert.ok(writeSelectionSession(storage,s.progress,true,s.preparation,s.readiness,s.flight,s.moon));const loaded=readSelectionSession(storage);assert.equal(loaded.moon.rover.version,2);assert.deepEqual(loaded.moon.rover.cargo,['A']);
console.log('Real drive to sample site, timing miss/hit, extraction-before-reward, explicit result, replay and saved cargo passed');

// Follow the authored west route with real steering/throttle commands and no position edits.
function driveRoute(points){
  for(const [x,z] of points){
    let r=s.moon.rover;
    const bearing=Math.atan2(x-r.x,-(z-r.z)),direction=Math.cos(bearing-r.heading)>=0?1:-1;
    for(let i=0;i<700;i++){
      r=s.moon.rover;const distance=Math.hypot(x-r.x,z-r.z);if(distance<1)break;
      const heading=Math.atan2(x-r.x,-(z-r.z)),error=Math.atan2(Math.sin(heading-r.heading-(direction<0?Math.PI:0)),Math.cos(heading-r.heading-(direction<0?Math.PI:0)));
      const desired=direction*Math.min(3,Math.sqrt(distance*4)),throttle=Math.abs(r.speed-desired)<.2?0:Math.sign(desired-r.speed);
      act({type:'rover-control',throttle,steer:Math.abs(error)>.06?Math.sign(error)*direction:0,drill:false});steps(1);
      assert.notEqual(s.moon.rover.phase,'failed','The west route must be physically traversable');
    }
    act({type:'rover-control',throttle:0,steer:0,drill:false});steps(15);
    assert.ok(Math.hypot(x-s.moon.rover.x,z-s.moon.rover.z)<2.7,`Reach west-route stop ${x},${z}: ${JSON.stringify({x:s.moon.rover.x,z:s.moon.rover.z,notice:s.moon.rover.notice,heading:s.moon.rover.heading})}`);
  }
}
driveRoute([[-12,5],[-20,-3],[-28,-7],[-28,-23]]);
act({type:'rover-drill'});assert.equal(s.moon.rover.phase,'drilling');
while(roverAim(s.moon.rover)<.4)steps(1);
act({type:'rover-aim'});steps(60);assert.deepEqual(s.moon.rover.cargo,['A','C']);
act({type:'rover-continue'});act({type:'rover-launch'});assert.notEqual(s.moon.rover.phase,'complete','Carried samples cannot authorize ascent');
driveRoute([[-28,-7],[-20,-3],[-12,5],[-13,18],[-32,25]]);
act({type:'rover-unload'});assert.deepEqual(s.moon.rover.deposited,['A','C']);
const depositedReplay=restoreRover(s.moon.rover,s.moon);assert.deepEqual(depositedReplay.deposited,['A','C']);
act({type:'rover-prepare'});act({type:'rover-talk'});act({type:'rover-talk'});steps(90);
assert.equal(s.moon.rover.phase,'ready');act({type:'rover-launch'});assert.equal(s.progress.stepId,'crew-return');
console.log('Arcade route: two physical collections, ridge climb, base delivery, replay and ascent authorization passed');

const b=ROVER_SITES[1];let hard={...start(),x:b.x,z:b.z};hard=reduceRover(hard,{type:'rover-drill'},moon);hard=tick(hard,12);hard=reduceRover(hard,{type:'rover-aim'},moon);hard=tick(hard,60);
assert.equal(hard.phase,'sample-result');assert.equal(hard.sampleResult,'hard');assert.equal(hard.cargo.length,0);assert.ok(hard.hardSeen);
console.log('Arcade hard-soil result is explicit and grants no sample');

let legacy=start(1);legacy=tick(control(legacy,1,1),12);const oldPoint={x:legacy.x,z:legacy.z};
let upgraded=reduceRover(legacy,{type:'rover-upgrade'},moon);assert.equal(upgraded.version,2);assert.equal(upgraded.originVersion,1);upgraded=reduceRover(upgraded,{type:'rover-resume'},moon);upgraded=tick(control(upgraded,1),10);
const upgradeReplay=restoreRover(upgraded,moon);assert.equal(upgradeReplay.version,2);assert.equal(upgradeReplay.x,upgraded.x);assert.equal(upgradeReplay.z,upgraded.z);assert.ok(Number.isFinite(oldPoint.x));
const hole=roverHoles(start())[0];let trapped={...start(),x:hole.x,z:hole.z+hole.radius+1.3,heading:0};trapped=tick(control(trapped,1),60);assert.equal(trapped.phase,'failed');assert.equal(trapped.failedReason,'hole');
console.log('Recorded v1→v2 upgrade, second replay and new-course crater failure passed');
