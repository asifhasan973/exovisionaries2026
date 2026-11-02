import assert from 'node:assert/strict';
import {createSurfaceDemo} from '../src/game/story/moon/journeyDemo.ts';
import {freshRover,reduceRover,restoreRover} from '../src/game/story/moon/rover.ts';
import {roverEquipment,roverPower,roverEvidence,roverCapability} from '../src/game/story/moon/roverEquipment.ts';
import {reconcileRover} from '../src/game/story/moon/roverSession.ts';
import {missionOutcome} from '../src/game/story/moon/return.ts';
import {batteryStep} from '../src/game/story/moon/resources.ts';
const change=(moon,remove,add)=>({...moon,launchSnapshot:{...moon.launchSnapshot,equipmentIds:[...moon.launchSnapshot.equipmentIds.filter(id=>!remove.includes(id)),...add]}});
for(const objective of ['lunar-ice','lunar-geology']){
 const moon=createSurfaceDemo('female',objective).moon;
 assert.ok(roverEquipment(moon).roverId);
 let r=freshRover(moon);assert.equal(r.version,4);
 for(let i=0;i<2;i++)r=reduceRover(r,{type:'rover-talk'},moon);
 for(let i=0;i<15;i++)r=reduceRover(r,{type:'rover-tick',seconds:.25},moon);
 const restored=restoreRover(r,moon);assert.ok(restored);assert.equal(restored.version,4);assert.equal(restored.batteryWh,r.batteryWh);
 const power=roverPower(moon,'traverse',0);
 const small=batteryStep(220,220,power.loadW,0,3600),large=batteryStep(400,400,power.loadW,0,3600);assert.ok(large.remainingWh/400>small.remainingWh/220);
 assert.ok(roverPower(moon,'traverse',1).solarW>0);
 const standard=change(moon,[roverEquipment(moon).solarId],['standard-solar']),efficient=change(moon,[roverEquipment(moon).solarId],['efficient-solar']);assert.ok(roverPower(efficient,'charging',1).solarW>roverPower(standard,'charging',1).solarW);
 const noSun=change(moon,[roverEquipment(moon).solarId],[]);assert.equal(roverPower(noSun,'charging',1).solarW,0);
 assert.ok(batteryStep(100,220,power.loadW,power.solarW+300,600).remainingWh>batteryStep(100,220,power.loadW,0,600).remainingWh);
 const measured=roverEvidence(moon,['A','C'],['A']);assert.ok(measured.records.length);assert.ok(measured.records.some(x=>x.transmitted));assert.ok(measured.records.some(x=>!x.transmitted));
 const noInstruments=change(moon,roverEquipment(moon).sciencePartIds,[]);assert.equal(roverEvidence(noInstruments,['A','C'],['A','C']).records.length,0);
 const samples={...r,cargo:[],deposited:['A','C']};const reconciled=reconcileRover(noInstruments,samples);const done={...reconciled,returnFlight:{...reconciled.returnFlight,signature:moon.designSignature,stage:'splashdown',crewLocation:'ocean'}};assert.notEqual(missionOutcome(done).status,'success');
 const basic=change(moon,[roverEquipment(moon).roverId],['basic-rover']),heavy=change(moon,[roverEquipment(moon).roverId],['heavy-rover']);assert.ok(roverCapability(heavy).terrain>roverCapability(basic).terrain);assert.notEqual(roverPower(basic,'traverse',0).loadW,roverPower(heavy,'traverse',0).loadW);
 if(objective==='lunar-geology'){const scoop=change(moon,roverEquipment(moon).sciencePartIds.filter(x=>x.startsWith('geo-drill')),['geo-scoop-basic']);assert.equal(roverCapability(scoop).depth,0);assert.ok(roverCapability(moon).depth>0);assert.ok(measured.records.some(x=>x.kind==='mineral-evidence'));}
 else assert.ok(measured.records.some(x=>x.kind==='water-evidence'));
 console.log(objective+': equipment power, capacity, solar, rover/tool capabilities, objective evidence, delivery distinction, science outcome and v4 replay passed');
}
