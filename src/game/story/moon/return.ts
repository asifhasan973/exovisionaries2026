import {returnedSampleKg} from './geologyScience.ts';
import type {MoonSession,MissionResources,MoonPhase} from './session.ts';
import {surfaceResources} from './surface.ts';
import {surfaceSecured} from './incidents.ts';
import {PLATFORM_MODEL} from './platform.ts';
import {TRANSFER_MODEL,fuelForBurn} from './journey.ts';

/** Authored teaching model. Timings/altitudes are scene cues, not a navigation solution. */
export const RETURN_MODEL={id:'crew-return-v1',step:.1,ascentSeconds:600,rendezvousSeconds:3600,burnSeconds:180,entrySeconds:600,chuteSeconds:180,
  ascentFrames:45,burnFrames:25,coastFrames:90,entryFrames:45,chuteFrames:35,dockMS:20,maxClosingMS:.25,maxAlignment:.2} as const;
export type ReturnStage='ready'|'ascending'|'rendezvous'|'docked'|'burning'|'coast'|'entry-ready'|'entry'|'chute-ready'|'chutes'|'splashdown';
export type ReturnAction='launch'|'brake'|'left'|'right'|'dock'|'depart'|'shield'|'nose'|'chutes'|'skip-coast'|'assist';
export type ReturnEvent={type:'return-action';action:ReturnAction}|{type:'return-tick';seconds:number}|{type:'return-pause'}|{type:'return-resume'}|{type:'return-speed';speed:number}|{type:'return-mode';mode:'guided'|'challenge'}|{type:'return-hint'}|{type:'return-new-attempt'};
type ReturnCommand={type:'action';action:ReturnAction}|{type:'advance';frames:number}|{type:'mode';mode:'guided'|'challenge'};
export interface ReturnState {
  version:1;model:typeof RETURN_MODEL.id;signature:string|null;stage:ReturnStage;frame:number;remainder:number;
  mode:'guided'|'challenge';speed:number;paused:boolean;assisted:boolean;mistakes:number;
  closingMS:number;alignment:number;elapsedSeconds:number;ascentUsedKg:number;serviceUsedKg:number;
  crewLocation:'moon-and-orbit'|'ascent-and-orbit'|'command-module'|'ocean';
  feedback:'ready'|'ascending'|'rendezvous'|'unsafeDock'|'docked'|'burning'|'coast'|'entry-ready'|'shield'|'wrongShield'|'chute-ready'|'chutes'|'splashdown'|'fuel'|'reserve'|'assisted';
  commands:ReturnCommand[];
}
export const emptyReturn=():ReturnState=>({version:1,model:RETURN_MODEL.id,signature:null,stage:'ready',frame:0,remainder:0,mode:'guided',speed:1.5,paused:false,assisted:false,mistakes:0,closingMS:1.2,alignment:.6,elapsedSeconds:0,ascentUsedKg:0,serviceUsedKg:0,crewLocation:'moon-and-orbit',feedback:'ready',commands:[]});
export function returnAuthorized(moon:MoonSession){return surfaceSecured(moon)&&moon.launchSnapshot?.signature===moon.designSignature&&!!moon.human.approved&&moon.science.signature===moon.designSignature;}
export function freshReturn(moon:MoonSession):ReturnState{return {...emptyReturn(),signature:moon.designSignature,mode:moon.journey.mode,speed:moon.journey.speed,assisted:moon.journey.mode==='guided'||moon.science.assisted||moon.surface.assisted||moon.landing.assisted||moon.journey.assisted};}
export function returnResources(moon:MoonSession,r:ReturnState):MissionResources {
  const origin=surfaceResources(moon,moon.surface);
  return {...origin,elapsedMissionSeconds:origin.elapsedMissionSeconds+r.elapsedSeconds,
    supportUnitsRemaining:Math.max(0,(origin.supportUnitsRemaining??0)-3*r.elapsedSeconds/86400),
    platformEnergyWh:Math.max(0,(origin.platformEnergyWh??0)-PLATFORM_MODEL.lifeSupportLoadW*r.elapsedSeconds/3600),
    ascentPropellantKg:Math.max(0,(origin.ascentPropellantKg??0)-r.ascentUsedKg),
    returnPropellantKg:Math.max(0,(origin.returnPropellantKg??0)-r.serviceUsedKg)};
}
export function returnReport(moon:MoonSession,r:ReturnState){
  const origin=surfaceResources(moon,moon.surface),account=moon.human.approved?.accounting;
  // The manifest's 10-kg sample allocation is conservative ballast. Actual collected mass is reported separately and may not exceed the allocation.
  const ascentDry=account?.ascent.dryKg??0,serviceDry=account?.service.dryKg??0;
  const ascentFuel=origin.ascentPropellantKg??0,serviceFuel=origin.returnPropellantKg??0;
  const ascentBurn=fuelForBurn(ascentDry+ascentFuel,PLATFORM_MODEL.ascentRequiredMS*(1+PLATFORM_MODEL.maneuverMargin),PLATFORM_MODEL.ascentIspSeconds);
  const dockingBurn=fuelForBurn(ascentDry+ascentFuel-ascentBurn,RETURN_MODEL.dockMS,PLATFORM_MODEL.ascentIspSeconds);
  const earthBurn=fuelForBurn(serviceDry+serviceFuel,TRANSFER_MODEL.earthReturnMS*(1+PLATFORM_MODEL.maneuverMargin),PLATFORM_MODEL.serviceIspSeconds);
  const tripSeconds=RETURN_MODEL.ascentSeconds+RETURN_MODEL.rendezvousSeconds+RETURN_MODEL.burnSeconds+TRANSFER_MODEL.returnDays*86400+RETURN_MODEL.entrySeconds+RETURN_MODEL.chuteSeconds;
  // Contingency is a consumable reserve, not a reason to strand a crew who can still get home.
  const supplyOK=(origin.supportUnitsRemaining??0)>=3*tripSeconds/86400;
  const energyOK=(origin.platformEnergyWh??0)>=PLATFORM_MODEL.lifeSupportLoadW*tripSeconds/3600;
  const contingencyOK=(origin.supportUnitsRemaining??0)>=3*(tripSeconds/86400+PLATFORM_MODEL.contingencyDays);
  return {ascentBurn,dockingBurn,earthBurn,contingencyOK,supplyOK,energyOK,fuelOK:ascentFuel>=ascentBurn+dockingBurn&&serviceFuel>=earthBurn,
    feasible:!!account&&supplyOK&&energyOK&&ascentFuel>=ascentBurn+dockingBurn&&serviceFuel>=earthBurn,
    resources:returnResources(moon,r),physicalSampleKg:returnedSampleKg(moon)};
}
export const returnActive=(r:ReturnState)=>['ascending','burning','coast','entry','chutes'].includes(r.stage);
export const returnFrameLimit=(r:ReturnState)=>r.stage==='ascending'?RETURN_MODEL.ascentFrames:r.stage==='burning'?RETURN_MODEL.burnFrames:r.stage==='coast'?RETURN_MODEL.coastFrames:r.stage==='entry'?RETURN_MODEL.entryFrames:RETURN_MODEL.chuteFrames;
export function returnPhase(r:ReturnState):MoonPhase{return r.stage==='ready'?'surface':r.stage==='ascending'?'ascent':r.stage==='rendezvous'?'docking':r.stage==='splashdown'?'debrief':['entry-ready','entry','chute-ready','chutes'].includes(r.stage)?'reentry':'earth-return';}
const dockSafe=(r:ReturnState)=>r.closingMS<=RETURN_MODEL.maxClosingMS&&Math.abs(r.alignment)<=RETURN_MODEL.maxAlignment;
export const canDock=(r:ReturnState)=>r.stage==='rendezvous'&&dockSafe(r);
function action(r:ReturnState,a:ReturnAction,moon:MoonSession):ReturnState {
  const report=returnReport(moon,r);
  if(a==='launch'&&r.stage==='ready'){
    if(!report.feasible)return {...r,feedback:report.fuelOK?'reserve':'fuel'};
    return {...r,stage:'ascending',frame:0,crewLocation:'ascent-and-orbit',feedback:'ascending'};
  }
  if(r.stage==='rendezvous'){
    if(a==='brake')return {...r,closingMS:Math.max(.1,r.closingMS-.35),feedback:'rendezvous'};
    if(a==='left'||a==='right')return {...r,alignment:Math.max(-1,Math.min(1,r.alignment+(a==='left'?-.2:.2))),feedback:'rendezvous'};
    if(a==='assist')return {...r,closingMS:.15,alignment:0,assisted:true,feedback:'assisted'};
    if(a==='dock'){
      if(!dockSafe(r))return {...r,feedback:'unsafeDock',mistakes:r.mistakes+1};
      if((report.resources.ascentPropellantKg??0)<report.dockingBurn)return {...r,feedback:'fuel'};
      return {...r,stage:'docked',crewLocation:'command-module',elapsedSeconds:r.elapsedSeconds+RETURN_MODEL.rendezvousSeconds,ascentUsedKg:r.ascentUsedKg+report.dockingBurn,feedback:'docked'};
    }
  }
  if(a==='depart'&&r.stage==='docked')return {...r,stage:'burning',frame:0,feedback:'burning'};
  if(a==='skip-coast'&&r.stage==='coast')return advance(r,RETURN_MODEL.coastFrames-r.frame,moon,true);
  if(r.stage==='entry-ready'){
    if(a==='nose')return {...r,feedback:'wrongShield',mistakes:r.mistakes+1};
    if(a==='shield')return {...r,stage:'entry',frame:0,feedback:'shield'};
  }
  if(a==='chutes'){
    if(r.stage!=='chute-ready')return r;
    return {...r,stage:'chutes',frame:0,feedback:'chutes'};
  }
  return r;
}
function advance(r:ReturnState,frames:number,moon:MoonSession,assisted=false):ReturnState {
  if(!returnActive(r))return r;
  const limit=returnFrameLimit(r),n=Math.min(limit-r.frame,Math.max(0,Math.floor(frames)));
  if(!n)return r;
  const report=returnReport(moon,r);
  const phaseSeconds=r.stage==='ascending'?RETURN_MODEL.ascentSeconds:r.stage==='burning'?RETURN_MODEL.burnSeconds:r.stage==='coast'?TRANSFER_MODEL.returnDays*86400:r.stage==='entry'?RETURN_MODEL.entrySeconds:RETURN_MODEL.chuteSeconds;
  let next:ReturnState={...r,frame:r.frame+n,elapsedSeconds:r.elapsedSeconds+phaseSeconds*n/limit,
    ascentUsedKg:r.ascentUsedKg+(r.stage==='ascending'?report.ascentBurn*n/limit:0),
    serviceUsedKg:r.serviceUsedKg+(r.stage==='burning'?report.earthBurn*n/limit:0),assisted:r.assisted||assisted};
  if(next.frame>=limit){const stage:ReturnStage=r.stage==='ascending'?'rendezvous':r.stage==='burning'?'coast':r.stage==='coast'?'entry-ready':r.stage==='entry'?'chute-ready':'splashdown';
    next={...next,stage,frame:0,remainder:0,feedback:stage,crewLocation:stage==='splashdown'?'ocean':next.crewLocation};}
  return next;
}
function receipt(r:ReturnState,c:ReturnCommand,moon:MoonSession):ReturnState {
  if(c.type==='mode')return {...r,mode:c.mode,assisted:r.assisted||c.mode==='guided'};
  return c.type==='action'?action(r,c.action,moon):advance(r,c.frames,moon);
}
function record(r:ReturnState,c:ReturnCommand,moon:MoonSession):ReturnState {
  const next=receipt(r,c,moon);if(next===r)return r;
  if(c.type==='advance')c={...c,frames:Math.min(c.frames,returnFrameLimit(r)-r.frame)};
  const commands=[...r.commands],prev=commands.at(-1);
  if(c.type==='advance'&&prev?.type==='advance')commands[commands.length-1]={type:'advance',frames:prev.frames+c.frames};else commands.push(c);
  // Consecutive advance receipts cannot cross a user action, only burn→coast.
  return {...next,commands};
}
export function reduceReturn(r:ReturnState,e:ReturnEvent,moon:MoonSession):ReturnState {
  if(r.signature!==moon.designSignature||!returnAuthorized(moon))return r;
  if(e.type==='return-pause')return r.paused?r:{...r,paused:true};
  if(e.type==='return-resume')return {...r,paused:false};
  if(e.type==='return-speed')return [1,1.5,2].includes(e.speed)?{...r,speed:e.speed}:r;
  if(e.type==='return-hint')return {...r,assisted:true};
  if(e.type==='return-mode')return ['ready','rendezvous'].includes(r.stage)?record(r,{type:'mode',mode:e.mode},moon):r;
  if(e.type==='return-action')return r.paused?r:record(r,{type:'action',action:e.action},moon);
  if(e.type!=='return-tick'||r.paused||!returnActive(r)||!Number.isFinite(e.seconds)||e.seconds<=0)return r;
  const total=r.remainder+Math.min(e.seconds,.5)*r.speed,frames=Math.floor((total+1e-8)/RETURN_MODEL.step);
  const next=frames?record(r,{type:'advance',frames},moon):r;
  return {...next,remainder:next.stage!==r.stage?0:total-frames*RETURN_MODEL.step};
}
/** Reconstruct fuel, time, crew location and success from bounded commands, not saved flags. */
export function restoreReturn(raw:unknown,moon:MoonSession):ReturnState {
  const fresh=freshReturn(moon);if(!raw||typeof raw!=='object'||!returnAuthorized(moon))return fresh;
  const saved=raw as Partial<ReturnState>;
  if(saved.version!==1||saved.model!==RETURN_MODEL.id||saved.signature!==moon.designSignature||!Array.isArray(saved.commands)||saved.commands.length>600)return fresh;
  let r=fresh;
  for(const c of saved.commands){
    if(!c||typeof c!=='object')return fresh;
    if(c.type==='action'&&['launch','brake','left','right','dock','depart','shield','nose','chutes','skip-coast','assist'].includes(c.action))r=record(r,c,moon);
    else if(c.type==='mode'&&['guided','challenge'].includes(c.mode))r=record(r,c,moon);
    else if(c.type==='advance'&&Number.isInteger(c.frames)&&c.frames>0&&c.frames<=500){
      // Live ticks merge across the automatic burn→coast transition. Replay each phase separately.
      let remaining=c.frames;while(remaining>0&&returnActive(r)){const n=Math.min(remaining,returnFrameLimit(r)-r.frame);r=record(r,{type:'advance',frames:n},moon);remaining-=n;}
    }else return fresh;
  }
  return {...r,speed:[1,1.5,2].includes(saved.speed??0)?saved.speed!:1.5,paused:true,assisted:r.assisted||saved.assisted===true};
}
export const returnComplete=(r:ReturnState,signature:string)=>r.signature===signature&&r.stage==='splashdown'&&r.crewLocation==='ocean';
export function missionOutcome(moon:MoonSession){
  if(!returnComplete(moon.returnFlight,moon.designSignature))return null;
  const records=moon.science.records.filter(r=>r.transmitted),confirmed=records.some(r=>r.kind==='water-evidence'&&r.result==='confirmed');
  const geological=records.some(r=>r.classification&&r.classification!=='inconclusive'),achieved=moon.objective==='lunar-geology'?geological:confirmed;
  const status=achieved&&!moon.science.fieldworkStopped?'success':records.length?'partial':'safe-return';
  const reasons=['Three crew recovered on Earth.',moon.objective==='lunar-geology'?geological?'Rock classification supported by delivered clues.':records.length?'Rock data delivered; classification remains uncertain.':'Crew returned without a rock finding.':confirmed?'Water evidence delivered.':records.length?'Useful data delivered; water was not confirmed.':'Crew returned without a water finding.',
    ...(moon.science.fieldworkStopped?['Fieldwork stopped early for safety.']:[]),'Rover and descent stage left on the Moon.',moon.objective==='lunar-geology'?`${returnedSampleKg(moon).toFixed(1)} kg of sealed rock samples returned.`:'No physical sample collected for Earth return.'];
  return {status:status as 'success'|'partial'|'safe-return',reasons};
}
