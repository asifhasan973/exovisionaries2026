import assert from 'node:assert/strict';
import {reduceMission} from '../src/game/story/workshopSession.ts';
import {writeSelectionSession,readSelectionSession} from '../src/game/story/selectionSession.ts';
import {missionDebrief,comparisonRecord,readComparison} from '../src/game/story/moon/missionDebrief.ts';
process.env.ROVER_TEST_MODEL='4';
const {completedRuns}=await import('./check-rover-sample-run.mjs');
for(let s of completedRuns){
 const act=e=>{s=reduceMission(s,e);};
 for(let i=0;i<700&&s.progress.stepId!=='mission-debrief';i++){
  const r=s.moon.returnFlight;if(r.paused){act({type:'return-resume'});continue;}
  const action=r.stage==='ready'?'launch':r.stage==='rendezvous'?r.closingMS>.25?'brake':Math.abs(r.alignment)>.2?r.alignment>0?'left':'right':'dock':r.stage==='docked'?'depart':r.stage==='entry-ready'?'shield':r.stage==='chute-ready'?'chutes':null;
  if(action)act({type:'return-action',action});else if(r.stage==='splashdown')act({type:'next'});else act({type:'return-tick',seconds:.25});
 }
 assert.equal(s.progress.stepId,'mission-debrief');
 const d=missionDebrief(s);assert.equal(d.card.crewRecovered,3);assert.equal(d.returned,2);assert.equal(d.collected,2);assert.equal(d.card.physicalSampleReturnedKg,.4);assert.equal(d.recommendations.length,3);assert.ok(d.decisions.length>=3);assert.ok(d.resources.cabinUsedKWh>0);assert.ok(d.resources.serviceUsedKg>0);assert.equal(d.card.samples[0].depthCm,s.moon.science.records.find(x=>x.depthCm!==null).depthCm);
 const storage=new Map(),adapter={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};assert.ok(writeSelectionSession(adapter,s.progress,true,s.preparation,s.readiness,s.flight,s.moon));const restored=readSelectionSession(adapter);const rounded=value=>JSON.parse(JSON.stringify(value,(_key,item)=>typeof item==='number'?Number(item.toFixed(7)):item));assert.deepEqual(rounded(missionDebrief(restored)),rounded(d),'Debrief survives saved replay within floating-point tolerance');
 const record=comparisonRecord(s);assert.deepEqual(readComparison(JSON.stringify(record)),record);assert.equal(readComparison('{broken'),null);assert.equal(readComparison(JSON.stringify({...record,points:-10})),null);
 console.log(`${s.moon.objective}: driven mission → unassisted return controls → debrief accounting, saved report replay within rounding tolerance and comparison validation passed (upstream preparation/launch uses assisted fixtures)`);
}
