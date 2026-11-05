import {roverPower,roverCapability} from './roverEquipment.ts';
import {batteryStep} from './resources.ts';
import {COURSE_HOLES,COURSE_ROCKS,courseHeight} from './roverCourse.ts';
import type { MoonSession, MissionResources } from './session.ts';
import { landingResources } from './landing.ts';
import { PLATFORM_MODEL } from './platform.ts';

export const ROVER_MODEL = { id: 'crew-rover-v1', step: .1, speed: 5, turn: 1.65, radius: 1, drillSeconds: 6, required: 2, bounds: 46, virtualRate: 10 } as const;
export const ROVER_BASE = { id: 'base', name: 'Lander', x: -32, z: 25 } as const;
export const ROVER_SITES = [
  { id: 'A', name: 'Sunny Flats', x: -13, z: 18, hard: false },
  { id: 'B', name: 'Rocky Edge', x: 8, z: 3, hard: true },
  { id: 'C', name: 'Sunlit Ridge', x: -28, z: -23, hard: false },
  { id: 'D', name: 'Dark Crater', x: 27, z: -24, hard: false },
  { id: 'E', name: 'Crater Trail', x: 37, z: 23, hard: false },
  { id: 'F', name: 'Backup Basin', x: 0, z: -34, hard: false },
] as const;
export type RoverSiteId = typeof ROVER_SITES[number]['id'];
export const ROVER_CAMPS = [ROVER_BASE, { id: 'west', name: 'Sunny Camp', x: -20, z: -3 }, { id: 'east', name: 'Solar Ridge', x: 28, z: 6 }] as const;
export const RUN_SITES = [ROVER_SITES[0], {id:'B',name:'Shadow Outcrop',x:27,z:-24,hard:true}, {id:'C',name:'Shadow Edge',x:18,z:-19,hard:false}] as const;
export const ROVER_CHARGER=ROVER_CAMPS[2];
export const roverSites=(s:{version?:number})=>(s.version??0)>=3?RUN_SITES:ROVER_SITES;
export const ROVER_HOLES = [{ id: 'h1', x: 1, z: 18, radius: 4 }, { id: 'h2', x: 12, z: -11, radius: 4.4 }, { id: 'h3', x: 25, z: 32, radius: 3.8 }, { id: 'h4', x: -13, z: -29, radius: 3.2 }] as const;
export const ROVER_ROCKS = Array.from({ length: 46 }, (_, i) => ({ id: `r${i}`, x: Math.sin(i * 7.13) * 40, z: Math.cos(i * 3.71) * 39, radius: .8 + i % 4 * .25 })).filter(rock => ![...ROVER_SITES, ...ROVER_CAMPS].some(site => Math.hypot(site.x - rock.x, site.z - rock.z) < 5) && !ROVER_HOLES.some(hole => Math.hypot(hole.x - rock.x, hole.z - rock.z) < hole.radius + 2));
export function roverLight(x: number, z: number) {
  return ((x - 27) / 18) ** 2 + ((z + 24) / 17) ** 2 < 1 || x > 29 && z > 14 || x > -7 && z < -27 ? 0 : 1;
}
export const roverHeight = (x: number, z: number) => Math.sin(x * .12) * Math.cos(z * .1) * .55 + .6 * Math.exp(-((x + 28) ** 2 + (z + 23) ** 2) / 110);
export type RoverPhase = 'charging' | 'delivering' | 'delivery-result' | 'stowing' | 'collecting' | 'sample-result' | 'intro' | 'deploying' | 'exploring' | 'drilling' | 'failed' | 'cabin' | 'boarding' | 'ready' | 'complete';
export const roverActive=(s:Pick<RoverState,'phase'>)=>['deploying','exploring','drilling','collecting','charging','delivering','stowing','boarding'].includes(s.phase);
export interface RoverCheckpoint { camp: number; cargo: RoverSiteId[]; deposited: RoverSiteId[]; drilled: RoverSiteId[]; hardSeen: boolean; debriefed: boolean; elapsed: number; chargeDone?:boolean }
export interface RoverState {
  version: 1 | 2 | 3 | 4; originVersion?: 1 | 2 | 3 | 4; signature: string; phase: RoverPhase; deployed: boolean; x: number; z: number; heading: number;
  sampleTimes?:Record<string,number>; chargeDone?:boolean; chargeHeld?:boolean; chargeSeconds?:number; stowed?:boolean; deliveryIds?:RoverSiteId[];
  throttle: number; steer: number; drillHeld: boolean; speed: number; batteryWh: number; capacityWh: number;
  paused: boolean; elapsed: number; frames: number; remainder: number; phaseTime: number; drillSite: RoverSiteId | null; drillProgress: number; heat: number;
  steerAngle: number; sampleStage: 'aim' | 'extract' | 'result'; sampleResult: 'success' | 'hard' | null; aimMisses: number;
  cargo: RoverSiteId[]; deposited: RoverSiteId[]; drilled: RoverSiteId[]; hardSeen: boolean; debriefed: boolean;
  talk: 'intro' | 'setback' | 'launch'; line: number; failedReason: 'battery' | 'hole' | 'supplies' | null;
  checkpoint: RoverCheckpoint; campTime: number; attempts: number; assisted: boolean;
  notice: 'ready' | 'rock' | 'edge' | 'hard' | 'sample' | 'deposit' | 'checkpoint' | 'heat' | null; commands: RoverCommand[];
}
type RoverCommand = {type:'tour'} | {type:'charge';held:boolean} | { type: 'upgrade' } | { type: 'aim' } | { type: 'continue' } | { type: 'restart' } | { type: 'stop' } | { type: 'talk' } | { type: 'control'; throttle: number; steer: number; drill: boolean } | { type: 'advance'; frames: number }
  | { type: 'drill' } | { type: 'cancel' } | { type: 'unload' } | { type: 'prepare' } | { type: 'retry' } | { type: 'launch' };
export type RoverEvent = {type:'rover-tour'} | {type:'rover-charge';held:boolean} | { type: 'rover-upgrade' } | { type: 'rover-aim' } | { type: 'rover-continue' } | { type: 'rover-restart' } | { type: 'rover-talk' } | { type: 'rover-control'; throttle: number; steer: number; drill: boolean } | { type: 'rover-tick'; seconds: number }
  | { type: 'rover-drill' } | { type: 'rover-cancel' } | { type: 'rover-unload' } | { type: 'rover-prepare' } | { type: 'rover-retry' } | { type: 'rover-launch' } | { type: 'rover-input-pause' } | { type: 'rover-pause' } | { type: 'rover-resume' };
export const roverAtBase = (s: Pick<RoverState, 'x' | 'z'>) => Math.hypot(s.x - ROVER_BASE.x, s.z - ROVER_BASE.z) < 4;
export const nearbyRoverSite = (s: Pick<RoverState, 'x' | 'z'> & {version?:number}) => roverSites(s).find(site => Math.hypot(site.x - s.x, site.z - s.z) < 2.7);
export const roverReady = (s: RoverState | undefined) => !!s && ['ready', 'complete'].includes(s.phase) && roverAtBase(s) && new Set(s.deposited).size >= ROVER_MODEL.required && (s.version<3||!!s.stowed&&!!s.chargeDone&&s.hardSeen&&s.debriefed);
export function freshRover(moon: MoonSession, version: 1 | 2 | 3 | 4 = 4): RoverState {
  const account = landingResources(moon, moon.landing);
  return { version, originVersion:version, ...(version>=3?{chargeDone:false,chargeHeld:false,chargeSeconds:0,stowed:false,deliveryIds:[]}:{}), steerAngle: 0, sampleStage: 'aim', sampleResult: null, aimMisses: 0, signature: moon.designSignature, phase: 'intro', deployed: false, x: ROVER_BASE.x, z: ROVER_BASE.z, heading: version>=2?Math.atan2(ROVER_SITES[0].x-ROVER_BASE.x,-(ROVER_SITES[0].z-ROVER_BASE.z)):0,
    throttle: 0, steer: 0, drillHeld: false, speed: 0, batteryWh: account.batteryWh, capacityWh: account.capacityWh, paused: false, elapsed: 0, frames: 0, remainder: 0,
    phaseTime: 0, drillSite: null, drillProgress: 0, heat: 0, cargo: [], deposited: [], drilled: [], hardSeen: false, debriefed: false, talk: 'intro', line: 0,
    failedReason: null, checkpoint: { camp: 0, cargo: [], deposited: [], drilled: [], hardSeen: false, debriefed: false, elapsed: 0 }, campTime: 0, attempts: 0, assisted: moon.landing.assisted, notice: null, commands: [] };
}
export function roverResources(moon: MoonSession, s: RoverState): MissionResources {
  const base = landingResources(moon, moon.landing), cabinW = moon.human.approved?.accounting.lifeSupportLoadW ?? PLATFORM_MODEL.lifeSupportLoadW;
  return { ...base, batteryWh: s.batteryWh, elapsedMissionSeconds: base.elapsedMissionSeconds + s.elapsed,
    platformEnergyWh: Math.max(0, (base.platformEnergyWh ?? 0) - cabinW * s.elapsed / 3600), supportUnitsRemaining: Math.max(0, (base.supportUnitsRemaining ?? 0) - 3 * s.elapsed / 86400) };
}
const stopped = { throttle: 0, steer: 0, drillHeld: false, speed: 0, chargeHeld:false };
function saveCamp(s: RoverState, camp: number): RoverCheckpoint { return { camp, cargo: [...s.cargo], deposited: [...s.deposited], drilled: [...s.drilled], hardSeen: s.hardSeen, debriefed: s.debriefed, elapsed: s.elapsed, ...(s.version>=3?{chargeDone:s.chargeDone}:{}) }; }
function advance(s: RoverState, count: number, moon: MoonSession): RoverState {
  if(s.version>=2)return advanceArcade(s,count,moon);
  let next = { ...s };
  for (let i = 0; i < count; i++) {
    if (next.paused || !['deploying', 'exploring', 'drilling', 'collecting', 'boarding'].includes(next.phase)) break;
    const dt = ROVER_MODEL.step; next = { ...next, frames: next.frames + 1, elapsed: next.elapsed + dt * ROVER_MODEL.virtualRate, phaseTime: next.phaseTime + dt };
    if (next.phase === 'deploying') { if (next.phaseTime >= 3) next = { ...next, deployed: true, phase: 'exploring', phaseTime: 0, notice: 'ready' }; continue; }
    if (next.phase === 'boarding') { if (next.phaseTime >= 4) next = { ...next, phase: 'ready', phaseTime: 0, ...stopped }; continue; }
    const light = roverLight(next.x, next.z), drilling = next.phase === 'drilling';
    const rate = light ? drilling ? .4 : Math.abs(next.throttle) > 0 ? .23 : .035 : drilling ? 1.15 : .9;
    next.batteryWh = Math.max(0, next.batteryWh - next.capacityWh * rate / 100 * dt);
    const account = roverResources(moon, next);
    if (next.batteryWh <= 0 || (account.supportUnitsRemaining ?? 0) < 12 || (account.platformEnergyWh ?? 0) < 600 * 72) { next = { ...next, phase: 'failed', failedReason: next.batteryWh <= 0 ? 'battery' : 'supplies', ...stopped }; break; }
    if (drilling) {
      const site = ROVER_SITES.find(site => site.id === next.drillSite)!;
      if (next.drillHeld && next.heat < 1) { next.drillProgress += dt; next.heat = Math.min(1, next.heat + dt * .13); }
      else next.heat = Math.max(0, next.heat - dt * .35);
      if (site.hard && next.drillProgress >= 3) next = { ...next, phase: 'exploring', hardSeen: true, drilled: [...new Set([...next.drilled, site.id])], drillProgress: 0, notice: 'hard', ...stopped };
      else if (next.drillProgress >= ROVER_MODEL.drillSeconds) next = { ...next, phase: 'exploring', cargo: [...new Set([...next.cargo, site.id])], drilled: [...new Set([...next.drilled, site.id])], drillProgress: 0, notice: 'sample', ...stopped };
      continue;
    }
    next.heading += next.steer * ROVER_MODEL.turn * dt;
    next.speed += (next.throttle * ROVER_MODEL.speed - next.speed) * .5;
    if (Math.abs(next.speed) < .02) next.speed = 0;
    const x = next.x + Math.sin(next.heading) * next.speed * dt, z = next.z - Math.cos(next.heading) * next.speed * dt;
    const rock = ROVER_ROCKS.find(rock => Math.hypot(x - rock.x, z - rock.z) < rock.radius + ROVER_MODEL.radius);
    if (Math.abs(x) > ROVER_MODEL.bounds || Math.abs(z) > ROVER_MODEL.bounds) next = { ...next, speed: 0, notice: 'edge' };
    else if (rock) next = { ...next, speed: 0, notice: 'rock' };
    else { next.x = x; next.z = z; if (next.notice === 'rock' || next.notice === 'edge') next.notice = null; }
    if (ROVER_HOLES.some(hole => Math.hypot(next.x - hole.x, next.z - hole.z) < hole.radius - .35)) { next = { ...next, phase: 'failed', failedReason: 'hole', ...stopped }; break; }
    const camp = ROVER_CAMPS.findIndex(camp => Math.hypot(camp.x - next.x, camp.z - next.z) < 3.5);
    if (camp >= 0 && next.throttle === 0 && Math.abs(next.speed) < .1) {
      next.campTime += dt;
      next.batteryWh = Math.min(next.capacityWh, next.batteryWh + next.capacityWh * .035 * dt);
      if (next.campTime >= 1 && (next.checkpoint.elapsed === 0 || next.checkpoint.camp !== camp || next.checkpoint.cargo.join() !== next.cargo.join() || next.checkpoint.drilled.join() !== next.drilled.join())) next = { ...next, checkpoint: saveCamp(next, camp), notice: 'checkpoint' };
    } else next.campTime = 0;
  }
  return next;
}
export const roverAim=(s:Pick<RoverState,'phaseTime'>)=>1-Math.abs((s.phaseTime*.72)%2-1);
export const roverRocks=(s:Pick<RoverState,'version'>)=>s.version>=2?COURSE_ROCKS:ROVER_ROCKS;
export const roverHoles=(s:Pick<RoverState,'version'>)=>s.version>=2?COURSE_HOLES:ROVER_HOLES;
export const roverElevation=(s:Pick<RoverState,'version'>,x:number,z:number)=>s.version>=2?courseHeight(x,z):roverHeight(x,z);

export function roverGoal(s:RoverState){
  if(s.cargo.length)return {...ROVER_BASE,kind:'base' as const,label:'Bring the sample back to base'};
  if(s.deposited.length===0)return {...RUN_SITES[0],kind:'sample' as const,label:'Collect the sunlit sample'};
  if(!s.chargeDone)return {...ROVER_CHARGER,kind:'charge' as const,label:'Charge at Solar Ridge · hold E'};
  if(!s.hardSeen)return {...RUN_SITES[1],kind:'sample' as const,label:'Investigate the shadow outcrop'};
  if(s.deposited.length<2)return {...RUN_SITES[2],kind:'sample' as const,label:'Collect at the nearby shadow edge'};
  return {...ROVER_BASE,kind:s.stowed?'launch' as const:'stow' as const,label:s.stowed?'Samples secured. Ready for ascent.':'Return to base and park the rover inside'};
}
export function visibleRoverSites(s:RoverState){
  if(s.version<3)return [...ROVER_SITES];
  const goal=roverGoal(s);return goal.kind==='sample'?RUN_SITES.filter(site=>site.id===goal.id):[];
}
function advanceArcade(s:RoverState,count:number,moon:MoonSession):RoverState {
  let next={...s};const dt=.05;
  for(let i=0;i<count;i++){
    if(next.paused||!roverActive(next))break;
    next={...next,frames:next.frames+1,elapsed:next.elapsed+dt*(next.version===4?(next.phase==='charging'?600:next.phase==='collecting'?120:ROVER_MODEL.virtualRate):ROVER_MODEL.virtualRate),phaseTime:next.phaseTime+dt};
    if(next.phase==='deploying'){if(next.phaseTime>=3)next={...next,deployed:true,phase:'exploring',phaseTime:0,notice:'ready'};continue;}
    if(next.phase==='boarding'){if(next.phaseTime>=4)next={...next,phase:'ready',phaseTime:0,...stopped};continue;}
    if(next.version>=3&&next.phase==='charging'){
      if(!next.chargeHeld){next={...next,phase:'exploring',phaseTime:0,...stopped};continue;}
      next.chargeSeconds=(next.chargeSeconds??0)+dt;next.batteryWh=next.version===4?batteryStep(next.batteryWh,next.capacityWh,roverPower(moon,'charging',1).loadW,roverPower(moon,'charging',1).solarW,dt*600).remainingWh:Math.min(next.capacityWh,next.batteryWh+next.capacityWh*.17*dt);
      if(next.chargeSeconds>=2&&next.batteryWh>=next.capacityWh*.95){next={...next,chargeDone:true,phase:'exploring',phaseTime:0,notice:'checkpoint',...stopped};next.checkpoint=saveCamp(next,2);}
      continue;
    }
    if(next.version>=3&&next.phase==='delivering'){
      if(next.phaseTime>=3.8){next={...next,phase:'delivery-result',phaseTime:0,deposited:[...new Set([...next.deposited,...(next.deliveryIds??[])])],cargo:[],notice:'deposit',...stopped};next.checkpoint=saveCamp(next,0);}
      continue;
    }
    if(next.version>=3&&next.phase==='stowing'){
      if(next.phaseTime>=6){next={...next,stowed:true,phase:'cabin',talk:'launch',line:0,phaseTime:0,...stopped};next.checkpoint=saveCamp(next,0);}
      continue;
    }
    const rate=next.version>=3?(next.phase!=='exploring'?0:roverLight(next.x,next.z)?Math.abs(next.speed)>.1?.6:.02:Math.abs(next.speed)>.1?1.35:.4):roverLight(next.x,next.z)?next.phase==='collecting'?.4:Math.abs(next.speed)>.1?.2:.025:next.phase==='collecting'?1.1:.75;
    if(next.version===4){const mode=next.phase==='collecting'?'drilling':next.phase==='drilling'?'analysis':Math.abs(next.speed)>.1?'traverse':'standby',power=roverPower(moon,mode,roverLight(next.x,next.z));next.batteryWh=batteryStep(next.batteryWh,next.capacityWh,power.loadW,power.solarW,dt*(next.phase==='collecting'?120:ROVER_MODEL.virtualRate)).remainingWh;}else next.batteryWh=Math.max(0,next.batteryWh-next.capacityWh*rate/100*dt);
    const account=roverResources(moon,next);
    if(next.batteryWh<=0||(account.supportUnitsRemaining??0)<12||(account.platformEnergyWh??0)<600*72){next={...next,phase:'failed',failedReason:next.batteryWh<=0?'battery':'supplies',...stopped};break;}
    if(next.phase==='drilling')continue;
    if(next.phase==='collecting'){
      next.drillProgress=next.phaseTime;
      if(next.phaseTime>=(next.version===4?2.6+roverCapability(moon).depth/40:2.6)){const site=roverSites(next).find(site=>site.id===next.drillSite)!;
        next={...next,phase:'sample-result',sampleStage:'result',sampleResult:site.hard?'hard':'success',hardSeen:next.hardSeen||site.hard,cargo:site.hard?next.cargo:[...new Set([...next.cargo,site.id])],drilled:[...new Set([...next.drilled,site.id])],notice:site.hard?'hard':'sample',phaseTime:0,...stopped};
        if(next.version===4&&!site.hard)next.sampleTimes={...next.sampleTimes,[site.id]:next.elapsed};
        if(next.version>=3&&site.hard)next.checkpoint=saveCamp(next,2);
      }
      continue;
    }
    const speed=next.speed,forward={x:Math.sin(next.heading),z:-Math.cos(next.heading)},grade=(courseHeight(next.x+forward.x,next.z+forward.z)-courseHeight(next.x-forward.x,next.z-forward.z))/2;
    const top=7.5*Math.max(.5,1-Math.abs(grade)*(next.version===4?1.2/roverCapability(moon).terrain:.45)),target=next.throttle>0?top:next.throttle<0?-3.2:0;
    const braking=next.throttle!==0&&Math.sign(next.throttle)!==Math.sign(speed)&&Math.abs(speed)>.1;
    const acceleration=braking?12:next.throttle===0?6:5;
    next.speed=speed+Math.max(-acceleration*dt,Math.min(acceleration*dt,target-speed));
    if(Math.abs(next.speed)<.04)next.speed=0;
    next.steerAngle+=(next.steer*.55*(1-.2*Math.min(1,Math.abs(next.speed)/7.5))-next.steerAngle)*.45;
    next.heading+=next.speed/2.1*Math.tan(next.steerAngle)*dt;
    const x=next.x+Math.sin(next.heading)*next.speed*dt,z=next.z-Math.cos(next.heading)*next.speed*dt;
    const blocked=COURSE_ROCKS.some(rock=>Math.hypot(x-rock.x,z-rock.z)<rock.radius+(next.version>=3?.85:ROVER_MODEL.radius));
    if(Math.abs(x)>ROVER_MODEL.bounds||Math.abs(z)>ROVER_MODEL.bounds)next={...next,speed:0,notice:'edge'};
    else if(blocked)next={...next,speed:0,notice:'rock'};
    else{next.x=x;next.z=z;if(next.notice==='rock'||next.notice==='edge')next.notice=null;}
    if(COURSE_HOLES.some(hole=>Math.hypot(next.x-hole.x,next.z-hole.z)<hole.radius-.35)){next={...next,phase:'failed',failedReason:'hole',...stopped};break;}
    const camp=ROVER_CAMPS.findIndex(camp=>Math.hypot(camp.x-next.x,camp.z-next.z)<3.5);
    if(camp>=0&&next.throttle===0&&Math.abs(next.speed)<.1){next.campTime+=dt;if(next.version<3)next.batteryWh=Math.min(next.capacityWh,next.batteryWh+next.capacityWh*.035*dt);if(next.campTime>=1&&(next.checkpoint.elapsed===0||next.checkpoint.camp!==camp||next.checkpoint.cargo.join()!==next.cargo.join()||next.checkpoint.drilled.join()!==next.drilled.join()))next={...next,checkpoint:saveCamp(next,camp),notice:'checkpoint'};}
    else next.campTime=0;
  }
  return next;
}
function apply(s: RoverState, command: RoverCommand, moon: MoonSession): RoverState {
  switch (command.type) {
    case 'tour':{
      if(s.version>=3||['ready','complete'].includes(s.phase))return s;
      const base=s.version===1?apply(s,{type:'upgrade'},moon):s;
      const count=Math.min(2,s.deposited.length+s.cargo.length),deposits=Math.min(2,s.deposited.length);
      const deposited=(['A','C'] as RoverSiteId[]).slice(0,deposits),cargo=(['A','C'] as RoverSiteId[]).slice(deposits,count);
      const chargeDone=count>=2,hardSeen=chargeDone||s.hardSeen,debriefed=hardSeen;
      const next:RoverState={...base,version:3,originVersion:s.originVersion??s.version,phase:s.deployed?'exploring':'intro',talk:'intro',line:0,cargo,deposited,drilled:[...deposited,...cargo,...(hardSeen?['B' as const]:[])],chargeDone,hardSeen,debriefed,chargeSeconds:0,stowed:false,deliveryIds:[],phaseTime:0,drillSite:null,drillProgress:0,assisted:true,...stopped};
      next.checkpoint=saveCamp(next,Math.max(0,ROVER_CAMPS.findIndex(camp=>Math.hypot(camp.x-next.x,camp.z-next.z)<3.5)));
      return next;
    }
    case 'charge':{
      if(s.version<3||s.paused)return s;
      if(!command.held)return s.chargeHeld?{...s,chargeHeld:false}:s;
      return s.deposited.length>=1&&s.phase==='exploring'&&Math.abs(s.speed)<.25&&Math.hypot(s.x-ROVER_CHARGER.x,s.z-ROVER_CHARGER.z)<3.5?{...s,phase:'charging',phaseTime:0,...stopped,chargeHeld:true}:s;
    }
    case 'upgrade':{
      if(s.version>=2)return s;
      let x=s.x,z=s.z;const safe=(x:number,z:number)=>Math.abs(x)<45&&Math.abs(z)<45&&!COURSE_ROCKS.some(rock=>Math.hypot(x-rock.x,z-rock.z)<rock.radius+1.2)&&!COURSE_HOLES.some(hole=>Math.hypot(x-hole.x,z-hole.z)<hole.radius+1.2);
      if(!safe(x,z)){outer:for(let radius=1;radius<=12;radius++)for(let i=0;i<24;i++){const nx=s.x+Math.sin(i*Math.PI/12)*radius,nz=s.z+Math.cos(i*Math.PI/12)*radius;if(safe(nx,nz)){x=nx;z=nz;break outer;}}}
      return {...s,version:2,originVersion:s.originVersion??1,x,z,steerAngle:0,sampleStage:'aim',sampleResult:null,phaseTime:0,drillProgress:0,assisted:s.assisted||x!==s.x||z!==s.z,...stopped};
    }
    case 'restart': return s.phase==='intro'?{...s,assisted:true}:s;
    case 'stop': return { ...s, ...stopped };
    case 'talk': {
      if (!['intro', 'cabin'].includes(s.phase)) return s;
      if (s.line === 0) return { ...s, line: 1 };
      const phase = s.talk === 'intro' ? 'deploying' : s.talk === 'launch' ? 'boarding' : 'exploring';
      const next:RoverState={ ...s, phase, line: 0, phaseTime: 0, debriefed: s.debriefed || s.talk === 'setback', ...stopped };
      if(s.version>=3&&s.talk==='setback')next.checkpoint=saveCamp(next,2);
      return next;
    }
    case 'control': return ['exploring', 'drilling'].includes(s.phase) && !s.paused ? { ...s, throttle: s.phase === 'drilling' ? 0 : command.throttle, steer: s.phase === 'drilling' ? 0 : command.steer, drillHeld: s.phase === 'drilling' && command.drill } : s;
    case 'advance': return advance(s, command.frames, moon);
    case 'aim': {
      if(s.version<2||s.phase!=='drilling')return s;
      const hit=roverAim(s)>=.32&&roverAim(s)<=.68;
      return hit?{...s,phase:'collecting',sampleStage:'extract',drillProgress:0,phaseTime:0,notice:null,...stopped}:{...s,aimMisses:s.aimMisses+1,phaseTime:0,notice:'heat'};
    }
    case 'continue':return s.version>=2&&['sample-result','delivery-result'].includes(s.phase)?{...s,phase:s.version>=3&&s.sampleResult==='hard'?'cabin':'exploring',...(s.version>=3&&s.sampleResult==='hard'?{talk:'setback',line:0} as const:{}),sampleResult:null,phaseTime:0,notice:null,...stopped}:s;
    case 'drill': { const site = nearbyRoverSite(s),goal=roverGoal(s); return s.phase === 'exploring' && !s.paused && Math.abs(s.speed) < .25 && site && !s.drilled.includes(site.id) && (s.version<3||goal.kind==='sample'&&goal.id===site.id) ? { ...s, phase: 'drilling', drillSite: site.id, drillProgress: 0, heat: 0, phaseTime: 0, sampleStage:'aim', sampleResult:null, aimMisses:0, notice: null, ...stopped } : s; }
    case 'cancel': return s.phase === 'drilling' ? { ...s, phase: 'exploring', drillProgress: 0, ...stopped } : s;
    case 'unload': {
      if (s.phase !== 'exploring' || !roverAtBase(s) || Math.abs(s.speed) > .25) return s;
      if(s.version>=3)return s.cargo.length?{...s,phase:'delivering',phaseTime:0,deliveryIds:[...s.cargo],...stopped}:s;
      let next: RoverState = { ...s, deposited: [...new Set([...s.deposited, ...s.cargo])], cargo: [], notice: 'deposit', ...stopped };
      next.checkpoint = saveCamp(next, 0);
      if (next.hardSeen && !next.debriefed) next = { ...next, phase: 'cabin', talk: 'setback', line: 0 };
      return next;
    }
    case 'prepare': return s.phase === 'exploring' && roverAtBase(s) && s.deposited.length >= ROVER_MODEL.required && Math.abs(s.speed) < .25 && (s.version<3||s.chargeDone&&s.hardSeen&&s.debriefed) ? { ...s, phase: s.version>=3&&!s.stowed?'stowing':'cabin',phaseTime:0,talk: 'launch', line: 0, ...stopped } : s;
    case 'retry': {
      if (s.phase !== 'failed') return s;
      const checkpoint = s.checkpoint, camp = ROVER_CAMPS[checkpoint.camp];
      return { ...s, phase: 'exploring', x: camp.x, z: camp.z, heading: 0, batteryWh: s.capacityWh, ...stopped, cargo: [...checkpoint.cargo], deposited: [...checkpoint.deposited], drilled: [...checkpoint.drilled], hardSeen: checkpoint.hardSeen, debriefed: checkpoint.debriefed, ...(s.version>=3?{chargeDone:checkpoint.chargeDone??false,chargeSeconds:0,deliveryIds:[],stowed:false}:{}),elapsed: checkpoint.elapsed, attempts: s.attempts + 1, assisted: true, paused: false, remainder: 0, drillSite: null, drillProgress: 0, heat: 0, steerAngle:0, sampleStage:'aim',sampleResult:null, phaseTime: 0, failedReason: null, campTime: 0, notice: 'checkpoint' };
    }
    case 'launch': return roverReady(s) ? { ...s, phase: 'complete', ...stopped } : s;
  }
}
export function reduceRover(s: RoverState, event: RoverEvent, moon: MoonSession): RoverState {
  if (event.type === 'rover-pause' || event.type === 'rover-resume' || event.type === 'rover-input-pause') {
    const commands = s.throttle || s.steer || s.drillHeld || s.speed || s.chargeHeld || event.type === 'rover-resume' && s.commands.at(-1)?.type !== 'stop' ? [...s.commands, { type: 'stop' as const }] : s.commands;
    return { ...s, paused: event.type === 'rover-input-pause' ? s.paused : event.type === 'rover-pause' && roverActive(s), ...stopped, commands };
  }
  if (s.paused && !['rover-retry','rover-upgrade','rover-tour'].includes(event.type)) return s;
  let command: RoverCommand, remainder = s.remainder;
  if (event.type === 'rover-tick') {
    if (!Number.isFinite(event.seconds) || event.seconds <= 0 || !roverActive(s)) return s;
    const seconds = remainder + Math.min(.25, event.seconds), frames = Math.floor((seconds + 1e-9) / (s.version>=2?.05:ROVER_MODEL.step));
    remainder = Math.max(0, seconds - frames * (s.version>=2?.05:ROVER_MODEL.step)); if (!frames) return { ...s, remainder };
    command = { type: 'advance', frames };
  } else command = { ...event, type: event.type.replace('rover-', '') } as RoverCommand;
  if (!validCommand(command) || s.commands.length >= 16000) return s;
  if (command.type === 'control' && command.throttle === s.throttle && command.steer === s.steer && command.drill === s.drillHeld) return s;
  const next = apply(s, command, moon); if (next === s) return s;
  const commands = [...s.commands], last = commands.at(-1);
  if (command.type === 'advance' && last?.type === 'advance' && last.frames + command.frames <= 100000) commands[commands.length - 1] = { type: 'advance', frames: last.frames + command.frames }; else commands.push(command);
  return { ...next, remainder, commands };
}
function validCommand(command: RoverCommand) {
  return command && typeof command === 'object' && ['tour', 'charge', 'upgrade', 'aim', 'continue', 'restart', 'stop', 'talk', 'control', 'advance', 'drill', 'cancel', 'unload', 'prepare', 'retry', 'launch'].includes(command.type)
    && (command.type !== 'charge' || typeof command.held === 'boolean')
    && (command.type !== 'control' || [-1, 0, 1].includes(command.throttle) && [-1, 0, 1].includes(command.steer) && typeof command.drill === 'boolean')
    && (command.type !== 'advance' || Number.isInteger(command.frames) && command.frames > 0 && command.frames <= 100000);
}
/** Positions, battery, containers, checkpoints and success are reconstructed from bounded receipts. */
export function restoreRover(raw: unknown, moon: MoonSession): RoverState | undefined {
  if (!raw || typeof raw !== 'object') return undefined; const saved = raw as RoverState;
  if (![1,2,3,4].includes(saved.version) || saved.signature !== moon.designSignature || !Array.isArray(saved.commands) || saved.commands.length > 16000) return undefined;
  if(saved.originVersion!==undefined&&![1,2,3,4].includes(saved.originVersion))return undefined;
  let s = freshRover(moon,saved.originVersion??saved.version), frames = 0;
  for (const command of saved.commands) { if (!validCommand(command) || command.type === 'advance' && (frames += command.frames) > 200000) return undefined; s = apply(s, command, moon); }
  if(s.version!==saved.version)return undefined;
  return { ...s, commands: [...saved.commands], paused: roverActive(s), ...stopped, remainder: 0 };
}

/** A single contextual action is shared by the E key and its on-screen prompt. */
export function roverInteraction(s:RoverState):{label:string;event:RoverEvent}|null {
  if(s.paused)return {label:'Resume driving',event:{type:'rover-resume'}};
  if(s.phase==='delivery-result')return {label:'Delivery complete · Continue',event:{type:'rover-continue'}};
  if(s.phase==='sample-result')return {label:s.sampleResult==='hard'?'Try another site':'Back to driving',event:{type:'rover-continue'}};
  if(s.phase==='drilling'&&s.version>=2)return {label:'Stop the marker in the green zone',event:{type:'rover-aim'}};
  if(s.phase==='ready')return {label:'Launch ascent cabin',event:{type:'rover-launch'}};
  if(s.phase==='failed')return {label:'Retry sunny checkpoint',event:{type:'rover-retry'}};
  if(s.phase!=='exploring'||Math.abs(s.speed)>.3)return null;
  if(roverAtBase(s)&&s.cargo.length)return {label:`Unload ${s.cargo.length} sample${s.cargo.length>1?'s':''}`,event:{type:'rover-unload'}};
  if(s.version>=3&&s.deposited.length>=1&&Math.hypot(s.x-ROVER_CHARGER.x,s.z-ROVER_CHARGER.z)<3.5&&(!s.chargeDone||s.batteryWh<s.capacityWh*.95))return {label:'Hold E to charge',event:{type:'rover-charge',held:true}};
  if(roverAtBase(s)&&s.deposited.length>=2)return {label:s.version>=3?'Park rover inside':'Seal samples and prepare launch',event:{type:'rover-prepare'}};
  const site=nearbyRoverSite(s);return site&&!s.drilled.includes(site.id)&&(s.version<3||roverGoal(s).kind==='sample'&&roverGoal(s).id===site.id)?{label:`Collect at ${site.id} · ${site.name}`,event:{type:'rover-drill'}}:null;
}
