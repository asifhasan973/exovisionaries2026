import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {ROVER_TALKS,ROVER_RADIO} from '../src/game/story/moon/roverCopy.ts';
import {createSurfaceDemo} from '../src/game/story/moon/journeyDemo.ts';
import {reduceMission} from '../src/game/story/workshopSession.ts';
import {freshRover,reduceRover,restoreRover,roverGoal,visibleRoverSites,roverAim,roverReady,RUN_SITES,ROVER_CHARGER,roverLight} from '../src/game/story/moon/rover.ts';
import {returnAuthorized} from '../src/game/story/moon/return.ts';
import {readSelectionSession,writeSelectionSession} from '../src/game/story/selectionSession.ts';
const voiceCredits=JSON.parse(readFileSync(new URL('../public/story/audio/credits.json',import.meta.url),'utf8'));
const spokenLines=[...Object.entries(ROVER_TALKS).flatMap(([talk,lines])=>lines.map((line,index)=>[`rover-run-${talk}-${index}`,line])),...Object.entries(ROVER_RADIO).map(([id,line])=>[`rover-radio-${id}`,line])];
let voiceFiles=0;
for(const [id,line] of spokenLines){
 const credit=voiceCredits.lines.find(entry=>entry.id===id);
 assert.equal(credit?.text,line.text);
 assert.equal(credit?.character,line.speaker==='Commander'?'commander':'chief');
 for(const prefix of line.speaker==='Commander'?['','male-']:['']){
  assert.ok(statSync(new URL(`../public/story/audio/${prefix}${id}.mp3`,import.meta.url)).size>1000,`${prefix}${id} must contain recorded audio`);voiceFiles++;
 }
}
assert.notEqual(voiceCredits.voices.chief,voiceCredits.voices.commander);
console.log(`${voiceFiles} rover voice recordings and speaker assignments passed`);
export const completedRuns=[];
for(const objective of ['lunar-ice','lunar-geology']){
const model=Number(process.env.ROVER_TEST_MODEL??3);let s=createSurfaceDemo('female',objective);const moon=s.moon;s={...s,moon:{...moon,rover:freshRover(moon,model)}};
const act=e=>{s=reduceMission(s,e);};
const tick=n=>{for(let i=0;i<n;i++)act({type:'rover-tick',seconds:.05});};
function route(points){
 for(const [x,z] of points){
  let r=s.moon.rover;const direction=Math.cos(Math.atan2(x-r.x,-(z-r.z))-r.heading)>=0?1:-1;
  for(let i=0;i<700;i++){
   r=s.moon.rover;const distance=Math.hypot(x-r.x,z-r.z);if(distance<1)break;
   const bearing=Math.atan2(x-r.x,-(z-r.z)),error=Math.atan2(Math.sin(bearing-r.heading-(direction<0?Math.PI:0)),Math.cos(bearing-r.heading-(direction<0?Math.PI:0)));
   const target=direction*Math.min(3,Math.sqrt(distance*4));
   act({type:'rover-control',throttle:Math.abs(r.speed-target)<.2?0:Math.sign(target-r.speed),steer:Math.abs(error)>.06?Math.sign(error)*direction:0,drill:false});tick(1);
   assert.notEqual(s.moon.rover.phase,'failed',`Driving route ${x},${z}: ${JSON.stringify({x:r.x,z:r.z,notice:r.notice,battery:r.batteryWh})}`);
  }
  act({type:'rover-control',throttle:0,steer:0,drill:false});tick(15);
  assert.ok(Math.hypot(x-s.moon.rover.x,z-s.moon.rover.z)<2.7,`Reach ${x},${z}: ${JSON.stringify({x:s.moon.rover.x,z:s.moon.rover.z,notice:s.moon.rover.notice})}`);
 }
}
function collect(id){
 act({type:'rover-drill'});assert.equal(s.moon.rover.phase,'drilling');assert.equal(s.moon.rover.drillSite,id);
 const battery=s.moon.rover.batteryWh;tick(40);if(model===3)assert.equal(s.moon.rover.batteryWh,battery,'Alignment must not consume battery');
 while(roverAim(s.moon.rover)<.4||roverAim(s.moon.rover)>.6)tick(1);
 act({type:'rover-aim'});assert.equal(s.moon.rover.phase,'collecting');const cargo=[...s.moon.rover.cargo];tick(20);assert.deepEqual(s.moon.rover.cargo,cargo,'Core must finish extraction before credit');
 tick(80);assert.equal(s.moon.rover.phase,'sample-result');
}
function roundtrip(){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 assert.ok(writeSelectionSession(storage,s.progress,true,s.preparation,s.readiness,s.flight,s.moon));const loaded=readSelectionSession(storage);
 assert.equal(loaded.moon.rover.version,model);if(model===4)assert.deepEqual(loaded.moon.science.records,s.moon.science.records);assert.equal(loaded.moon.rover.phase,s.moon.rover.phase);assert.deepEqual(loaded.moon.rover.deposited,s.moon.rover.deposited);return loaded.moon.rover;
}
act({type:'rover-talk'});act({type:'rover-talk'});tick(65);
assert.equal(s.moon.rover.version,model);assert.deepEqual(visibleRoverSites(s.moon.rover).map(p=>p.id),['A']);
route([[-13,18]]);collect('A');assert.deepEqual(s.moon.rover.cargo,['A']);act({type:'rover-continue'});assert.equal(roverGoal(s.moon.rover).kind,'base');assert.equal(visibleRoverSites(s.moon.rover).length,0);
route([[-32,25]]);act({type:'rover-unload'});assert.equal(s.moon.rover.phase,'delivering');tick(25);assert.equal(s.moon.rover.deposited.length,0,'Transfer cannot award delivery early');
const mid=roundtrip();assert.ok(mid.paused);assert.equal(mid.phaseTime,s.moon.rover.phaseTime);let resumed=reduceRover(mid,{type:'rover-resume'},s.moon);for(let i=0;i<65;i++)resumed=reduceRover(resumed,{type:'rover-tick',seconds:.05},s.moon);assert.deepEqual(resumed.deposited,['A']);assert.equal(restoreRover(resumed,s.moon).phase,'delivery-result');const before=s.moon.rover.phaseTime;act({type:'rover-pause'});tick(50);assert.equal(s.moon.rover.phaseTime,before);act({type:'rover-resume'});tick(60);
assert.equal(s.moon.rover.phase,'delivery-result');assert.deepEqual(s.moon.rover.deposited,['A']);act({type:'rover-continue'});assert.equal(roverGoal(s.moon.rover).kind,'charge');
route([[-13,18],[-7,6],[8,3],[12,12],[22,12],[28,6]]);
const atPad=s.moon.rover.batteryWh;tick(25);assert.ok(s.moon.rover.batteryWh<=atPad,'Station cannot recharge automatically');
act({type:'rover-charge',held:true});tick(10);assert.ok(s.moon.rover.batteryWh>atPad||atPad===s.moon.rover.capacityWh);assert.equal(s.moon.rover.chargeDone,false);let pausedCharge=reduceRover(s.moon.rover,{type:'rover-pause'},s.moon);assert.equal(pausedCharge.chargeHeld,false);const frozenCharge=pausedCharge.batteryWh;pausedCharge=reduceRover(pausedCharge,{type:'rover-tick',seconds:.25},s.moon);assert.equal(pausedCharge.batteryWh,frozenCharge);pausedCharge=reduceRover(pausedCharge,{type:'rover-resume'},s.moon);pausedCharge=reduceRover(pausedCharge,{type:'rover-tick',seconds:.05},s.moon);assert.equal(pausedCharge.phase,'exploring');assert.equal(pausedCharge.batteryWh,frozenCharge);act({type:'rover-charge',held:false});tick(1);assert.equal(s.moon.rover.phase,'exploring');
const partial=s.moon.rover.batteryWh;tick(5);assert.ok(s.moon.rover.batteryWh<=partial);act({type:'rover-charge',held:true});tick(100);assert.equal(s.moon.rover.chargeDone,true);assert.deepEqual(visibleRoverSites(s.moon.rover).map(p=>p.id),['B']);roundtrip();
route([[28,-4],[28,-12],[27,-24]]);assert.equal(roverLight(s.moon.rover.x,s.moon.rover.z),0);collect('B');assert.equal(s.moon.rover.sampleResult,'hard');assert.equal(s.moon.rover.cargo.length,0);act({type:'rover-continue'});assert.equal(s.moon.rover.phase,'cabin');act({type:'rover-talk'});act({type:'rover-talk'});assert.deepEqual(visibleRoverSites(s.moon.rover).map(p=>p.id),['C']);
const checkpoint=s.moon.rover.checkpoint;assert.ok(checkpoint.hardSeen&&checkpoint.debriefed&&checkpoint.chargeDone);
let failed={...s.moon.rover,batteryWh:.01};for(let i=0;i<40&&failed.phase!=='failed';i++)failed=reduceRover(failed,{type:'rover-tick',seconds:.25},s.moon);assert.equal(failed.phase,'failed');failed=reduceRover(failed,{type:'rover-retry'},s.moon);assert.equal(failed.x,ROVER_CHARGER.x);assert.deepEqual(failed.deposited,['A']);assert.equal(roverGoal(failed).id,'C','Retry must not repeat the hard-soil story');
route([[18,-19]]);collect('C');assert.deepEqual(s.moon.rover.cargo,['C']);act({type:'rover-continue'});
route([[27,-24],[28,-12],[28,-4],[28,6],[22,12],[12,12],[8,3],[-7,6],[-13,18],[-32,25]]);
act({type:'rover-unload'});tick(80);assert.deepEqual(s.moon.rover.deposited,['A','C']);assert.deepEqual(s.moon.rover.drilled,['A','B','C']);act({type:'rover-continue'});
assert.equal(roverReady(s.moon.rover),false);act({type:'rover-launch'});assert.notEqual(s.moon.rover.phase,'complete');act({type:'rover-prepare'});assert.equal(s.moon.rover.phase,'stowing');tick(40);assert.equal(roverReady(s.moon.rover),false);const stowingSave=roundtrip();assert.ok(stowingSave.paused);let resumedStow=reduceRover(stowingSave,{type:'rover-resume'},s.moon);for(let i=0;i<90;i++)resumedStow=reduceRover(resumedStow,{type:'rover-tick',seconds:.05},s.moon);assert.ok(resumedStow.stowed);tick(90);assert.equal(s.moon.rover.stowed,true);assert.equal(s.moon.rover.phase,'cabin');act({type:'rover-talk'});act({type:'rover-talk'});tick(90);assert.ok(roverReady(s.moon.rover));
const forged=restoreRover({...s.moon.rover,cargo:['D','E','F'],batteryWh:9999,x:999},s.moon);assert.deepEqual(forged.cargo,[]);assert.equal(forged.x,s.moon.rover.x);assert.equal(forged.batteryWh,s.moon.rover.batteryWh);
act({type:'rover-launch'});assert.equal(s.progress.stepId,'crew-return');assert.ok(returnAuthorized(s.moon));roundtrip();completedRuns.push(s);
console.log(objective+': Sequential run: real driving → A → animated delivery → hold charge → hard B → replacement C → delivery → bay stow → authorized ascent passed');
console.log(`Model ${model}: target visibility, three collections, two deposits, hold/release charging, paused animations, checkpoint preservation, anti-forgery and save roundtrips passed`);
let upgrade=freshRover(moon,2);upgrade=reduceRover(upgrade,{type:'rover-talk'},moon);upgrade=reduceRover(upgrade,{type:'rover-tour'},moon);assert.equal(upgrade.version,3);assert.equal(restoreRover(upgrade,moon).version,3);
assert.equal(RUN_SITES.filter(site=>!site.hard).length,2);
console.log('Recorded model-2 migration to the sequential run passed');

}
