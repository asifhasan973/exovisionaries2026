import type { MoonSession, MissionResources } from './session.ts';
import type { PreparationSelection } from '../design.ts';
import { PLATFORM_MODEL } from './platform.ts';
import { fuelForBurn, journeyResources } from './journey.ts';
import { LANDING_LINES } from './landingCopy.ts';

/** Final approach is planar; the preceding orbital braking profile is authored. */
export const LANDING_MODEL = {id:'moon-terminal-descent-v1',gravity:1.62,step:1/30,timeScale:2,
  thrustN:45000,initialHeight:130,brakingMS:1700,brakingSeconds:600,
  verticalLimit:2.5,horizontalLimit:1.5,padRadius:12,abortOrbitMS:2100,abortSeconds:480} as const;
export const LANDING_PADS=[{id:'left',x:-45,name:'Clear patch A',safe:true},{id:'planned',x:0,name:'Planned spot',safe:false},{id:'right',x:45,name:'Clear patch B',safe:true}] as const;
export type PadId=typeof LANDING_PADS[number]['id'];
export type LandingStage='ready'|'separating'|'separated'|'braking'|'descending'|'landed'|'failed'|'aborting'|'aborted';
type Command={type:'separate'}|{type:'brake'}|{type:'mode';mode:'guided'|'challenge'}|{type:'target';id:PadId}
  |{type:'control';throttle?:number;steer?:number}|{type:'continue'}|{type:'abort'}|{type:'hint'}|{type:'advance';frames:number};
export interface LandingState {
  version:1;signature:string|null;stage:LandingStage;mode:'guided'|'challenge';target:PadId;paused:boolean;assisted:boolean;
  x:number;height:number;vx:number;vy:number;throttle:number;steer:number;fuelKg:number;abortFuelKg:number;
  steps:number;phaseSteps:number;remainder:number;hazardSeen:boolean;decisionPending:boolean;attempts:number;feedback:keyof typeof LANDING_LINES|null;
  commands:Command[];
}
export const emptyLanding=():LandingState=>({version:1,signature:null,stage:'ready',mode:'guided',target:'planned',paused:false,assisted:false,
  x:-12,height:LANDING_MODEL.initialHeight,vx:1,vy:-6,throttle:.3,steer:0,fuelKg:PLATFORM_MODEL.descentPropellantKg,abortFuelKg:0,
  steps:0,phaseSteps:0,remainder:0,hazardSeen:false,decisionPending:false,attempts:0,feedback:null,commands:[]});
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export const terrainHeight=(x:number)=>Math.abs(x)<16?3:Math.abs(x)>80?Math.max(0,(Math.abs(x)-80)*.22):0;
export function landingInputs(moon:MoonSession,preparation:PreparationSelection){
  const account=moon.human.approved!.accounting;
  const advanced=preparation.navigationId==='stereo-hazard-camera';
  return {dryKg:account.descent.dryKg,scanHeight:advanced?105:75,advanced,
    ascentDryKg:account.ascent.dryKg,ascentFuelKg:PLATFORM_MODEL.ascentPropellantKg};
}
export function descentEntryFuel(moon:MoonSession,preparation:PreparationSelection){const {dryKg}=landingInputs(moon,preparation);return PLATFORM_MODEL.descentPropellantKg-fuelForBurn(dryKg+PLATFORM_MODEL.descentPropellantKg,LANDING_MODEL.brakingMS*1.05,PLATFORM_MODEL.descentIspSeconds);}
export function abortReport(l:LandingState,moon:MoonSession,preparation:PreparationSelection){
  const input=landingInputs(moon,preparation),deltaV=LANDING_MODEL.abortOrbitMS+Math.hypot(l.vx,l.vy);
  const fuelKg=fuelForBurn(input.ascentDryKg+input.ascentFuelKg,deltaV,PLATFORM_MODEL.ascentIspSeconds);
  return {fuelKg,allowed:l.stage==='descending'&&l.height>=15&&l.vy>=-20&&fuelKg<=input.ascentFuelKg};
}
export function safeTouchdown(l:LandingState){return l.stage==='landed'&&Math.abs(l.vy)<=LANDING_MODEL.verticalLimit&&Math.abs(l.vx)<=LANDING_MODEL.horizontalLimit&&LANDING_PADS.some(p=>p.safe&&Math.abs(l.x-p.x)<=LANDING_MODEL.padRadius);}
function advance(l:LandingState,frames:number,moon:MoonSession,prep:PreparationSelection):LandingState{
  let next={...l};const input=landingInputs(moon,prep),dt=LANDING_MODEL.step;
  for(let i=0;i<frames;i++){
    if(next.paused||!['separating','braking','descending','aborting'].includes(next.stage))break;
    next.steps++;next.phaseSteps++;
    if(next.stage==='separating'){if(next.phaseSteps*dt>=4)next={...next,stage:'separated',phaseSteps:0};continue;}
    if(next.stage==='braking'){if(next.phaseSteps*dt>=10)next={...next,stage:'descending',phaseSteps:0,fuelKg:descentEntryFuel(moon,prep),assisted:next.assisted||next.mode==='guided'};continue;}
    if(next.stage==='aborting'){if(next.phaseSteps*dt>=12)next={...next,stage:'aborted',phaseSteps:0,height:100000,feedback:null};continue;}
    if(next.mode==='guided'){
      const target=LANDING_PADS.find(p=>p.id===next.target)!;
      const desiredVx=clamp((target.x-next.x)*.13,-3.5,3.5),ax=clamp((desiredVx-next.vx)*.8,-.75,.75);
      const desiredVy=-Math.min(6,Math.max(.65,Math.sqrt(Math.max(0,next.height))*.45));
      const ay=clamp((desiredVy-next.vy)*1.3,-.8,2);
      const angle=Math.atan2(ax,LANDING_MODEL.gravity+ay);
      next.steer=clamp(angle/(20*Math.PI/180),-1,1);
      next.throttle=clamp(Math.hypot(ax,LANDING_MODEL.gravity+ay)*(input.dryKg+next.fuelKg)/LANDING_MODEL.thrustN,0,1);
    }
    const requested=LANDING_MODEL.thrustN*next.throttle,flow=requested/(9.80665*PLATFORM_MODEL.descentIspSeconds);
    const used=Math.min(next.fuelKg,flow*dt),thrust=used/dt*9.80665*PLATFORM_MODEL.descentIspSeconds;
    const mass=input.dryKg+next.fuelKg-used/2,angle=next.steer*20*Math.PI/180;
    next.vx+=Math.sin(angle)*thrust/mass*dt;next.vy+=(Math.cos(angle)*thrust/mass-LANDING_MODEL.gravity)*dt;
    next.x+=next.vx*dt;next.height+=next.vy*dt;next.fuelKg-=used;
    if(!next.hazardSeen&&next.height<=input.scanHeight){next={...next,hazardSeen:true,decisionPending:true,paused:true,feedback:'hazard'};break;}
    if(next.height<=terrainHeight(next.x)){
      next.height=terrainHeight(next.x);
      const terrainOK=LANDING_PADS.some(p=>p.safe&&Math.abs(next.x-p.x)<=LANDING_MODEL.padRadius);
      const failure=!terrainOK?'terrain':Math.abs(next.vy)>LANDING_MODEL.verticalLimit?'fast':Math.abs(next.vx)>LANDING_MODEL.horizontalLimit?'sideways':null;
      next={...next,stage:failure?'failed':'landed',throttle:0,paused:false,feedback:failure};break;
    }
    if(next.fuelKg<=0){next={...next,stage:'failed',paused:false,throttle:0,feedback:'fuel'};break;}
    if(Math.abs(next.x)>160||next.height>260||next.steps>18000){next={...next,stage:'failed',throttle:0,feedback:'bounds',paused:false};break;}
  }
  return next;
}
function apply(l:LandingState,c:Command,moon:MoonSession,prep:PreparationSelection):LandingState{
  switch(c.type){
    case 'mode':return l.stage==='ready'?{...l,mode:c.mode}:l;
    case 'separate':return l.stage==='ready'?{...l,stage:'separating',phaseSteps:0,paused:false,feedback:null}:l;
    case 'brake':return l.stage==='separated'?{...l,stage:'braking',phaseSteps:0,paused:false,feedback:null}:l;
    case 'target':return l.stage==='descending'&&l.hazardSeen?{...l,target:c.id}:l;
    case 'continue':return l.stage==='descending'&&l.decisionPending?{...l,decisionPending:false,paused:false,feedback:null}:l;
    case 'control':{if(l.stage!=='descending'||l.mode!=='challenge')return l;const throttle=c.throttle===undefined?l.throttle:clamp(c.throttle,0,1),steer=c.steer===undefined?l.steer:clamp(c.steer,-1,1);return throttle===l.throttle&&steer===l.steer?l:{...l,throttle,steer,feedback:l.decisionPending?'hazard':null};}
    case 'hint':return {...l,assisted:true};
    case 'abort':{const report=abortReport(l,moon,prep);return report.allowed?{...l,stage:'aborting',phaseSteps:0,abortFuelKg:report.fuelKg,paused:false,decisionPending:false,throttle:0,feedback:null}:{...l,feedback:'blocked'};}
    case 'advance':return advance(l,c.frames,moon,prep);
  }
}
function record(l:LandingState,c:Command,moon:MoonSession,prep:PreparationSelection){
  const next=apply(l,c,moon,prep);if(next===l)return l;
  const commands=[...l.commands],last=commands.at(-1);
  if(c.type==='advance'&&last?.type==='advance')commands[commands.length-1]={type:'advance',frames:last.frames+c.frames};else commands.push(c);
  return {...next,commands};
}
export type LandingEvent={type:'landing-separate'}|{type:'landing-brake'}|{type:'landing-mode';mode:'guided'|'challenge'}|{type:'landing-target';id:PadId}
  |{type:'landing-control';throttle?:number;steer?:number}|{type:'landing-continue'}|{type:'landing-abort'}|{type:'landing-hint'}
  |{type:'landing-tick';seconds:number}|{type:'landing-pause'}|{type:'landing-resume'};
export function reduceLanding(l:LandingState,event:LandingEvent,moon:MoonSession,prep:PreparationSelection):LandingState{
  if(event.type==='landing-pause')return l.paused||!['separating','braking','descending','aborting'].includes(l.stage)?l:{...l,paused:true};
  if(event.type==='landing-resume')return l.decisionPending||!['separating','braking','descending','aborting'].includes(l.stage)?l:{...l,paused:false,feedback:null};
  if(event.type==='landing-tick'){
    if(l.paused||!['separating','braking','descending','aborting'].includes(l.stage)||!Number.isFinite(event.seconds)||event.seconds<=0)return l;
    const seconds=l.remainder+Math.min(.25,event.seconds)*LANDING_MODEL.timeScale,frames=Math.floor(seconds/LANDING_MODEL.step);
    return {...record(l,{type:'advance',frames},moon,prep),remainder:seconds-frames*LANDING_MODEL.step};
  }
  const c={...event,type:event.type.replace('landing-','')} as Command;
  return record(l,c,moon,prep);
}
export function landingResources(moon:MoonSession,l:LandingState):MissionResources{
  const baseline=journeyResources(moon,moon.journey);
  const brakingDone=['descending','landed','failed','aborting','aborted'].includes(l.stage);
  const brakingFraction=l.stage==='braking'?Math.min(1,l.phaseSteps*LANDING_MODEL.step/10):brakingDone?1:0;
  const abortFraction=l.stage==='aborting'?Math.min(1,l.phaseSteps*LANDING_MODEL.step/12):l.stage==='aborted'?1:0;
  const seconds=l.steps*LANDING_MODEL.step+(LANDING_MODEL.brakingSeconds-10)*brakingFraction+(LANDING_MODEL.abortSeconds-12)*abortFraction;
  return {...baseline,descentPropellantKg:l.fuelKg,ascentPropellantKg:PLATFORM_MODEL.ascentPropellantKg-l.abortFuelKg,
    elapsedMissionSeconds:baseline.elapsedMissionSeconds+seconds,supportUnitsRemaining:(baseline.supportUnitsRemaining??0)-3*seconds/86400,
    platformEnergyWh:(baseline.platformEnergyWh??0)-PLATFORM_MODEL.lifeSupportLoadW*seconds/3600};
}
/** Replay bounded control receipts. Saved positions/pass flags and resource totals are never trusted. */
export function restoreLanding(raw:unknown,moon:MoonSession,prep:PreparationSelection):LandingState{
  const clean:LandingState={...emptyLanding(),signature:moon.designSignature,mode:moon.journey.mode,assisted:moon.journey.assisted};
  if(!raw||typeof raw!=='object')return clean;const saved=raw as LandingState;
  if(saved.version!==1||saved.signature!==moon.designSignature||!Array.isArray(saved.commands)||saved.commands.length>2000)return clean;
  let l=clean,total=0;
  for(const c of saved.commands){
    if(!c||typeof c!=='object'||!['separate','brake','mode','target','control','continue','abort','hint','advance'].includes(c.type))return clean;
    if(c.type==='advance'){if(!Number.isInteger(c.frames)||c.frames<0||c.frames>20000||(total+=c.frames)>20000)return clean;l={...l,paused:false};}
    if(c.type==='mode'&&!['guided','challenge'].includes(c.mode)||c.type==='target'&&!LANDING_PADS.some(p=>p.id===c.id))return clean;
    if(c.type==='control'&&(c.throttle!==undefined&&(!Number.isFinite(c.throttle)||c.throttle<0||c.throttle>1)||c.steer!==undefined&&(!Number.isFinite(c.steer)||Math.abs(c.steer)>1)))return clean;
    l=apply(l,c,moon,prep);
  }
  return {...l,commands:[...saved.commands],attempts:Number.isInteger(saved.attempts)&&saved.attempts>=0?saved.attempts:0,
    assisted:l.assisted||saved.assisted===true,paused:!['ready','landed','failed','aborted'].includes(l.stage),remainder:0};
}
