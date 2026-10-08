import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createStoryProgress, reduceStoryProgress, STORY_SAVE_KEY } from '../src/game/story/progress.ts';
import { STORY_FLOW } from '../src/game/story/flow.ts';
import { quickPreparation, verifiedActivities } from '../src/game/story/preparation.ts';
import { createWorkshopSession, reduceMission } from '../src/game/story/workshopSession.ts';
import { CHECK_IDS, PACKING_ACTIONS } from '../src/game/story/readiness.ts';
const require=createRequire('/Users/asifhasan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium }=require('playwright');
const baseURL=process.env.STORY_REVIEW_URL||'http://127.0.0.1:5173/';
const directory=new URL('../docs/story/flight-review/',import.meta.url); await mkdir(directory,{recursive:true});
let progress=reduceStoryProgress(createStoryProgress(),{type:'set-name',name:'Asha'}); const preparation=quickPreparation();
while(progress.stepId!=='mass-check'){
  const step=STORY_FLOW.find(step=>step.id===progress.stepId);
  if(step.kind==='choice') progress=reduceStoryProgress(progress,{type:'select',choiceId:step.options.find(option=>option.available).id});
  if(step.kind==='activity') progress={...progress,completedActivities:verifiedActivities(preparation)};
  progress=reduceStoryProgress(progress,{type:'next'});
}
let mission=createWorkshopSession(progress,preparation);
for(const id of CHECK_IDS){assert.equal(mission.progress.stepId,id);mission=reduceMission(reduceMission(mission,{type:'run-check'}),{type:'next'});}
for(const action of PACKING_ACTIONS)mission=reduceMission(mission,{type:'pack',action});
mission=reduceMission(mission,{type:'next'});
const save={...mission.progress,preparationVersion:1,preparation,readinessVersion:1,readiness:mission.readiness,flightVersion:1,flight:mission.flight};
const browser=await chromium.launch({headless:true}); const errors=[],failedRequests=[],results=[];
const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORY_SAVE_KEY);
const waitState=(page,status)=>page.waitForFunction(({key,status})=>JSON.parse(localStorage.getItem(key)).flight.status===status,{key:STORY_SAVE_KEY,status},{timeout:25000});
const shot=async(page,name)=>{await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(requestAnimationFrame);});await page.screenshot({path:fileURLToPath(new URL(name,directory)),fullPage:true});};
async function open(viewport={width:1440,height:1000},fallback=false){
  const ctx=await browser.newContext({viewport});
  await ctx.addInitScript(({key,save,fallback})=>{
    if(!localStorage.getItem(key)){localStorage.setItem(key,JSON.stringify(save));localStorage.setItem('zero_to_beyond_story_voice_v1','off');}
    window.__flightAudio={started:0,stopped:0};
    const native=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(...args){const node=native.apply(this,args),start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...args)=>{window.__flightAudio.started++;return start(...args);};node.stop=(...args)=>{window.__flightAudio.stopped++;return stop(...args);};return node;};
    if(fallback){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).startsWith('webgl'))return null;return get.call(this,kind,...args);};}
  },{key:STORY_SAVE_KEY,save,fallback});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(r.url().startsWith(baseURL))failedRequests.push(r.url());});
  await page.goto(baseURL);await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Launch pad',exact:true}).click();
  return{page,ctx};
}
try{
  if(process.env.STORY_REVIEW_VISUAL_ONLY){
    for(const width of [1440,390,320]){
      const {page,ctx}=await open({width,height:width===1440?1000:844});await page.locator('.flight-canvas canvas').waitFor();await page.waitForTimeout(300);
      await shot(page,width===1440?'pad-desktop.png':`pad-mobile-${width}.png`);
      await page.getByRole('button',{name:'Skip flight',exact:true}).click();await page.getByRole('button',{name:'View orbit',exact:true}).click();await page.waitForTimeout(300);
      await shot(page,width===1440?'orbit-desktop.png':`orbit-mobile-${width}.png`);await ctx.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);console.log('Final visual framing and local texture check passed.');
  }else{
  const {page,ctx}=await open(); await page.locator('.flight-canvas canvas').waitFor();
  await shot(page,'pad-desktop.png'); await page.getByRole('button',{name:'Enable narration',exact:true}).click(); await page.getByRole('button',{name:'2×',exact:true}).click();
  await page.getByRole('button',{name:'Start countdown',exact:true}).click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).flight.t>5,STORY_SAVE_KEY);
  assert.ok((await page.evaluate(()=>window.__flightAudio.started))>0);
  await page.getByRole('button',{name:'Mute narration',exact:true}).click();
  await page.getByRole('button',{name:'Pause flight',exact:true}).click(); await waitState(page,'paused');
  assert.ok((await page.evaluate(()=>window.__flightAudio.stopped))>0); const paused=(await read(page)).flight.t; await page.waitForTimeout(650); assert.equal((await read(page)).flight.t,paused);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal((await read(page)).flight.status,'paused');assert.equal((await read(page)).flight.t,paused);
  await page.getByRole('button',{name:'Resume flight',exact:true}).click(); await waitState(page,'awaiting');
  assert.equal((await read(page)).flight.t,16);await shot(page,'booster-desktop.png');
  await page.waitForTimeout(650);assert.equal((await read(page)).flight.t,16);
  await page.getByRole('button',{name:'Separate booster',exact:true}).click();await waitState(page,'awaiting');
  assert.equal((await read(page)).flight.t,24);await shot(page,'fairing-desktop.png');
  await page.getByRole('button',{name:'Release fairing',exact:true}).click();await waitState(page,'complete');
  await page.getByRole('button',{name:'View orbit',exact:true}).click();
  assert.equal((await read(page)).stepId,'earth-orbit'); assert.match(await page.locator('.flight-telemetry').innerText(),/200[\s\S]*7.79/);
  await page.waitForTimeout(650); await shot(page,'orbit-desktop.png');
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();assert.equal((await read(page)).stepId,'earth-orbit');
  await page.getByRole('button',{name:'Replay launch',exact:true}).click();await waitState(page,'ready');
  await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal((await read(page)).stepId,'launch-ready');
  await page.getByRole('button',{name:'Launch pad',exact:true}).click();await page.getByRole('button',{name:'Skip flight',exact:true}).click();await waitState(page,'complete');assert.equal((await read(page)).flight.skipped,true);
  results.push('approved packing → countdown → 2× → engine-audio start/mute → pause/reload/resume → ordered booster/fairing actions → Earth orbit → replay/back → honest skip');await ctx.close();
  for(const width of [390,320]){
    const mobile=await open({width,height:844});await mobile.page.locator('.flight-canvas canvas').waitFor();
    assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await mobile.page.getByRole('checkbox',{name:'Gentle motion',exact:true}).check();
    await shot(mobile.page,`pad-mobile-${width}.png`);
    await mobile.page.getByRole('button',{name:'1.5×',exact:true}).click();await mobile.page.getByRole('button',{name:'Skip flight',exact:true}).click();
    await mobile.page.getByRole('button',{name:'View orbit',exact:true}).click();assert.equal((await read(mobile.page)).stepId,'earth-orbit');
    assert.equal(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await shot(mobile.page,`orbit-mobile-${width}.png`);await mobile.ctx.close();results.push(`${width}px mobile controls, orbit and no horizontal overflow`);
  }
  const fallback=await open({width:1200,height:900},true);await fallback.page.getByText('3D unavailable',{exact:true}).waitFor();
  await fallback.page.getByRole('button',{name:'Skip flight',exact:true}).click();await fallback.page.getByRole('button',{name:'View orbit',exact:true}).click();
  assert.equal((await read(fallback.page)).stepId,'earth-orbit');await shot(fallback.page,'fallback.png');await fallback.ctx.close();results.push('WebGL failure still allows skip and orbit');
  assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
  const report={baseURL,results,errors,failedRequests};await writeFile(new URL('browser-review.json',directory),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }
}finally{await browser.close();}
