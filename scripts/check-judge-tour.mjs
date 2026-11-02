import assert from 'node:assert/strict';
import {skipJudgePage} from '../src/game/story/judgeTour.ts';
import {createStoryProgress} from '../src/game/story/progress.ts';
import {createWorkshopSession,reduceMission} from '../src/game/story/workshopSession.ts';
import {readSelectionSession,writeSelectionSession} from '../src/game/story/selectionSession.ts';
import {returnAuthorized,returnComplete} from '../src/game/story/moon/return.ts';
import {emptyPackingGame,reducePackingGame,restorePackingGame,shuffledSupplyLayout,SUPPLY_ORDERS,SUPPLY_ITEMS,SUPPLY_SOCKETS} from '../src/game/story/moon/packingGame.ts';
for(const objective of ['lunar-ice','lunar-geology']){
  let s=createWorkshopSession(createStoryProgress()),visited=[];
  for(let n=0;n<50&&s.progress.stepId!=='mission-debrief';n++){
    if(s.progress.stepId==='objective')s=reduceMission(s,{type:'select',choiceId:objective});
    visited.push(s.progress.stepId);const original=JSON.stringify(s),next=skipJudgePage(s);
    assert.equal(JSON.stringify(s),original,'Preview cannot mutate the source mission');
    assert.notEqual(next.progress.stepId,s.progress.stepId,'Every Skip must leave its page');
    assert.ok(next.progress.assistance.includes('judge-demo'));
    const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
    assert.ok(writeSelectionSession(storage,next.progress,true,next.preparation,next.readiness,next.flight,next.moon));
    const loaded=readSelectionSession(storage);assert.equal(loaded.progress.stepId,next.progress.stepId,`Checkpoint survives reload at ${next.progress.stepId}`);
    s=next;
    if(s.progress.stepId==='crew-return')assert.ok(returnAuthorized(s.moon));
  }
  assert.equal(s.progress.stepId,'mission-debrief');assert.ok(returnComplete(s.moon.returnFlight,s.moon.designSignature));
  assert.ok(visited.includes('rocket-pack')&&visited.includes('rocket-assembly')&&visited.includes('launch-ready')&&visited.includes('lunar-descent')&&visited.includes('lunar-surface'));
  console.log(`${objective}: ${visited.length} pages → authorized return → completed debrief; source isolation and every save roundtrip passed`);
}
for(let previous=0;previous<6;previous++)for(const random of [()=>0,()=>.5,()=>.999]){
  const layout=shuffledSupplyLayout(previous,random);assert.notEqual(layout,previous);assert.equal(new Set(SUPPLY_ORDERS[layout]).size,3);
}
let game=emptyPackingGame('supplies');game=reducePackingGame(game,{type:'packing-game-reset',layout:3});assert.equal(game.supplyLayout,3);
game=reducePackingGame(game,{type:'packing-game-drop',item:'food',...SUPPLY_SOCKETS.water});assert.equal(game.stowed.length,0,'Shuffle cannot change symbol matching');
for(const item of SUPPLY_ITEMS)game=reducePackingGame(game,{type:'packing-game-drop',item,...SUPPLY_SOCKETS[item]});
assert.equal(game.phase,'passed');assert.equal(restorePackingGame(game).supplyLayout,3);assert.equal(restorePackingGame({...game,supplyLayout:999}).supplyLayout,0);
console.log('Supply shuffle: every round changes order, correct matching and save restoration passed');

const {ROCKET_LINES}=await import('../src/game/story/moon/rocketAssemblyCopy.ts');
const {LANDING_LINES}=await import('../src/game/story/moon/landingCopy.ts');
const {recordedVoiceURL}=await import('../src/game/story/voiceClips.ts');
const {statSync}=await import('node:fs');
let clips=0;
for(const [prefix,lines] of [['rocket',ROCKET_LINES],['landing',LANDING_LINES]])for(const [id,text] of Object.entries(lines))for(const gender of ['female','male']){
 const clip=`${prefix}-${id}`,file=`${gender==='male'?'male-':''}${clip}.mp3`;
 assert.ok(recordedVoiceURL(clip,text,'commander',gender)?.endsWith(file));assert.ok(statSync(new URL(`../public/story/audio/${file}`,import.meta.url)).size>1000,file);clips++;
}
console.log(`${clips} rocket/landing voice variants resolve to recorded MP3 assets`);
