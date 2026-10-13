import {incidentEffects} from './incidents.ts';
import type {MoonSession,MissionResources} from './session.ts';
import type {PreparationSelection} from '../design.ts';
import {equipmentIds,equipmentReport,crewCapabilities} from './catalog.ts';
import {operatingPower,batteryStep,energyWh} from './resources.ts';
import {landingResources,safeTouchdown} from './landing.ts';
import {TRANSFER_MODEL} from './journey.ts';
import {PLATFORM_MODEL} from './platform.ts';
import type {SURFACE_LINES} from './surfaceCopy.ts';

export const SURFACE_MODEL={id:'surface-waypoints-v1',step:.1,legFrames:80,deployFrames:30,chargeFrames:60,
  deploySeconds:600,chargeSeconds:900,headlightW:12,evaLimitSeconds:3600,baseReserve:.2,worldDistanceScale:3} as const;
export const SURFACE_NODES=[{id:'base',name:'Base',x:-35,z:0},{id:'ridge',name:'Sunny ridge',x:-5,z:-40},
  {id:'lookout',name:'Lookout',x:15,z:20},{id:'edge',name:'Shadow edge',x:45,z:-25},{id:'target',name:'Cold crater',x:140,z:-35}] as const;
export type SurfaceNodeId=typeof SURFACE_NODES[number]['id'];
export const SURFACE_EDGES=[
  {id:'base-ridge',a:'base',b:'ridge',name:'Sunny path',grade:5,rough:false},
  {id:'base-lookout',a:'base',b:'lookout',name:'Lookout path',grade:4,rough:false},
  {id:'ridge-edge',a:'ridge',b:'edge',name:'Ridge path',grade:6,rough:false},
  {id:'lookout-edge',a:'lookout',b:'edge',name:'Smooth detour',grade:7,rough:false},
  {id:'base-edge',a:'base',b:'edge',name:'Boulder shortcut',grade:12,rough:true},
  {id:'edge-target',a:'edge',b:'target',name:'Dark crater loop',grade:7,rough:false},
] as const;
export type SurfaceEdgeId=typeof SURFACE_EDGES[number]['id'];
export interface SurfaceLeg {edge:SurfaceEdgeId;from:SurfaceNodeId;to:SurfaceNodeId}
type SurfaceCommand={type:'deploy'}|{type:'mode';mode:'guided'|'hold'}|{type:'pace';pace:'eco'|'fast'}|{type:'select';edge:SurfaceEdgeId}
  |{type:'start'}|{type:'charge'}|{type:'arm'}|{type:'home'}|{type:'turn-back'}|{type:'hint'}|{type:'advance';frames:number};
export interface SurfaceState {
  version:1;signature:string|null;stage:'stowed'|'deploying'|'idle'|'driving'|'charging'|'failed';deployed:boolean;crewSheltered:boolean;
  location:SurfaceNodeId;selected:SurfaceEdgeId|null;legs:SurfaceLeg[];legFrame:number;phaseFrame:number;
  mode:'guided'|'hold';pace:'eco'|'fast';paused:boolean;held:boolean;autonomyArmed:boolean;autonomous:boolean;assisted:boolean;
  batteryWh:number;elapsedSeconds:number;remainder:number;evaSeconds:number;coldSeconds:number;warmSeconds:number;
  visited:SurfaceNodeId[];traversed:SurfaceEdgeId[];attempts:number;feedback:keyof typeof SURFACE_LINES|null;commands:SurfaceCommand[];
}
export const emptySurface=():SurfaceState=>({version:1,signature:null,stage:'stowed',deployed:false,crewSheltered:true,location:'base',selected:null,legs:[],legFrame:0,phaseFrame:0,
  mode:'guided',pace:'eco',paused:false,held:false,autonomyArmed:false,autonomous:false,assisted:false,batteryWh:0,elapsedSeconds:0,remainder:0,evaSeconds:0,coldSeconds:0,warmSeconds:0,visited:['base'],traversed:[],attempts:0,feedback:null,commands:[]});
export const surfaceNode=(id:SurfaceNodeId)=>SURFACE_NODES.find(n=>n.id===id)!;
export function legPoint(l:SurfaceLeg,f:number){
  const a=surfaceNode(l.from),b=surfaceNode(l.to),points=l.edge==='base-edge'?[a,{x:5,z:6},b]:[a,b];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.z-points[i].z)),total=lengths.reduce((a,b)=>a+b,0);let remaining=Math.max(0,Math.min(1,f))*total;
  for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const t=remaining/lengths[i];return {x:points[i].x+(points[i+1].x-points[i].x)*t,z:points[i].z+(points[i+1].z-points[i].z)*t};}remaining-=lengths[i];}return b;
}
export function surfacePosition(s:SurfaceState){return ['driving','failed'].includes(s.stage)&&s.legs[0]?legPoint(s.legs[0],s.legFrame/SURFACE_MODEL.legFrames):surfaceNode(s.location);}
export const surfaceNodeName=(id:SurfaceNodeId,moon:MoonSession)=>moon.objective==='lunar-geology'?({base:'Base',ridge:'Highland ridge',lookout:'Light-rock patch',edge:'Lava fragments',target:'Crater ejecta'} as const)[id]:surfaceNode(id).name;
export function surfaceLight(x:number,z:number,moon:MoonSession){if(x>30&&z<8||moon.site==='permanent-shadow'&&Math.hypot(x+35,z)<20)return 0;return z<-25&&x<15?.9:.75;}
export function surfaceLink(x:number,z:number,prep:PreparationSelection){return x>85?'blocked' as const:Math.hypot(x+35,z)>(prep.communicationId==='high-gain-communication'?260:75)?'blocked' as const:'connected' as const;}
export function surfaceParts(moon:MoonSession,prep:PreparationSelection){return equipmentReport(equipmentIds(prep,moon.objective??'lunar-ice'),moon.objective??'lunar-ice').parts;}
export function surfacePower(moon:MoonSession,prep:PreparationSelection,mode:'traverse'|'standby'|'charging',light:number,pace:'eco'|'fast'='eco',rough=false){
  const parts=surfaceParts(moon,prep),base=operatingPower(parts,mode,light,[],crewCapabilities(moon.crew));
  const roverW=parts.find(p=>p.category==='rover')?.nominalPowerW??0;
  const extra=(mode==='traverse'?roverW*crewCapabilities(moon.crew).driveLoadMultiplier*((pace==='fast'?1.4:1)*(rough?1.25:1)-1):0)+(light===0?SURFACE_MODEL.headlightW:0);
  const effects=incidentEffects(moon),loadW=base.loadW+extra+(mode==='traverse'?roverW*crewCapabilities(moon.crew).driveLoadMultiplier*(effects.driveMultiplier-1):0),solarW=base.solarW*effects.solarMultiplier;return {...base,loadW,solarW,deficitW:Math.max(0,loadW-solarW),surplusW:Math.max(0,solarW-loadW),peakOK:Math.max(0,loadW-solarW)<=base.dischargeLimitW};
}
interface LegEnergyProfile {seconds:number;wh:number;coldSeconds:number;peakOK:boolean;distance:number}
const legProfileCache=new WeakMap<PreparationSelection,Map<string,LegEnergyProfile>>();
/** A leg depends on terrain, hardware and dust, not the current battery/time. */
export function legProfile(l:SurfaceLeg,moon:MoonSession,prep:PreparationSelection,pace:'eco'|'fast'):LegEnergyProfile{
  const effects=incidentEffects(moon),key=[moon.designSignature,moon.site,moon.objective,moon.crew.support,l.edge,l.from,l.to,pace,effects.solarMultiplier,effects.driveMultiplier].join('|');
  let cache=legProfileCache.get(prep);if(!cache){cache=new Map();legProfileCache.set(prep,cache);}const cached=cache.get(key);if(cached)return cached;
  const edge=SURFACE_EDGES.find(e=>e.id===l.edge)!,a=surfaceNode(l.from),b=surfaceNode(l.to);
  const distance=(l.edge==='base-edge'?Math.hypot(a.x-5,a.z-6)+Math.hypot(b.x-5,b.z-6):Math.hypot(a.x-b.x,a.z-b.z))*SURFACE_MODEL.worldDistanceScale;
  const speed=(prep.roverId==='basic-rover'?.12:prep.roverId==='heavy-rover'?.22:.18)*(pace==='fast'?1.2:1)/(edge.rough?1.2:1);
  let wh=0,coldSeconds=0,peakOK=true;
  const seconds=distance/speed;
  for(let i=0;i<SURFACE_MODEL.legFrames;i++){const f=(i+.5)/SURFACE_MODEL.legFrames,point=legPoint(l,f),light=surfaceLight(point.x,point.z,moon),power=surfacePower(moon,prep,'traverse',light,pace,edge.rough);wh+=energyWh(power.deficitW,seconds/SURFACE_MODEL.legFrames);if(!light)coldSeconds+=seconds/SURFACE_MODEL.legFrames;peakOK&&=power.peakOK;}
  const profile=Object.freeze({seconds,wh,coldSeconds,peakOK,distance});if(cache.size>500)cache.clear();cache.set(key,profile);return profile;
}
function hardwareReason(edge:typeof SURFACE_EDGES[number],prep:PreparationSelection){return (edge.grade>(prep.roverId==='basic-rover'?8:prep.roverId==='heavy-rover'?16:14)||edge.rough&&prep.navigationId!=='stereo-hazard-camera')?'terrain' as const:edge.id==='edge-target'&&prep.thermalId!=='advanced-thermal'?'thermal' as const:null;}
/** Minimal conservative energy home path; forecasts never credit hoped-for charging. */
export function returnPlan(location:SurfaceNodeId,moon:MoonSession,prep:PreparationSelection,pace:'eco'|'fast'='eco'){
  const paths:{legs:SurfaceLeg[];wh:number;seconds:number}[]=[];
  const walk=(node:SurfaceNodeId,seen:SurfaceNodeId[],legs:SurfaceLeg[],wh:number,seconds:number)=>{
    if(node==='base'){paths.push({legs,wh,seconds});return;}
    for(const edge of SURFACE_EDGES){if(hardwareReason(edge,prep)||edge.a!==node&&edge.b!==node)continue;const to=(edge.a===node?edge.b:edge.a) as SurfaceNodeId;if(seen.includes(to))continue;
      const leg={edge:edge.id,from:node,to},p=legProfile(leg,moon,prep,pace);if(!p.peakOK)continue;walk(to,[...seen,to],[...legs,leg],wh+p.wh,seconds+p.seconds);}
  };walk(location,[location],[],0,0);return paths.sort((a,b)=>a.wh-b.wh)[0]??null;
}
export function routeReport(s:SurfaceState,id:SurfaceEdgeId,moon:MoonSession,prep:PreparationSelection){
  const edge=SURFACE_EDGES.find(e=>e.id===id)!;if(edge.a!==s.location&&edge.b!==s.location)return null;
  const to=(edge.a===s.location?edge.b:edge.a) as SurfaceNodeId,leg={edge:id,from:s.location,to},p=legProfile(leg,moon,prep,s.pace);
  const autonomous=surfaceLink(surfaceNode(to).x,surfaceNode(to).z,prep)==='blocked';
  const legs=autonomous?[leg,{edge:id,from:to,to:s.location}]:[leg];
  const profiles=legs.map(l=>legProfile(l,moon,prep,s.pace)),home=returnPlan(autonomous?s.location:to,moon,prep,s.pace),capacity=moon.resources.capacityWh;
  const wh=profiles.reduce((a,p)=>a+p.wh,0),seconds=profiles.reduce((a,p)=>a+p.seconds,0),cold=profiles.reduce((a,p)=>a+p.coldSeconds,0);
  const coldLimit=prep.thermalId==='advanced-thermal'?7200:1200;
  const account=surfaceResources(moon,s),futureSeconds=seconds+(home?.seconds??0);
  const remainingSupport=(account.supportUnitsRemaining??0)-3*futureSeconds/86400;
  const remainingCabin=(account.platformEnergyWh??0)-PLATFORM_MODEL.lifeSupportLoadW*futureSeconds/3600;
  const returnDays=TRANSFER_MODEL.returnDays+PLATFORM_MODEL.contingencyDays;
  const required=wh+(home?.wh??Infinity)+capacity*SURFACE_MODEL.baseReserve;
  const reason=hardwareReason(edge,prep)??(!p.peakOK?'reserve':s.coldSeconds+cold>coldLimit?'thermal':autonomous&&!s.autonomyArmed?'autonomy':!home||s.batteryWh+1e-6<required||remainingSupport<3*returnDays||remainingCabin<PLATFORM_MODEL.lifeSupportLoadW*returnDays*24?'reserve':null);
  return {leg,legs,home,wh,seconds,required,autonomous,reason,feasible:!reason,to};
}
export function crewTimeOK(s:SurfaceState,moon:MoonSession,seconds:number){const r=surfaceResources(moon,s),days=TRANSFER_MODEL.returnDays+PLATFORM_MODEL.contingencyDays;return (r.supportUnitsRemaining??0)-3*seconds/86400>=3*days&&(r.platformEnergyWh??0)-PLATFORM_MODEL.lifeSupportLoadW*seconds/3600>=PLATFORM_MODEL.lifeSupportLoadW*days*24;}

/** Science expeditions reuse the waypoint vehicle and terrain constraints. No teleporting. */
export function surfacePath(from:SurfaceNodeId,to:SurfaceNodeId,moon:MoonSession,prep:PreparationSelection,pace:'eco'|'fast'='eco'){
  const paths:{legs:SurfaceLeg[];wh:number;seconds:number;coldSeconds:number}[]=[];
  const walk=(node:SurfaceNodeId,seen:SurfaceNodeId[],legs:SurfaceLeg[],wh:number,seconds:number,coldSeconds:number)=>{
    if(node===to){paths.push({legs,wh,seconds,coldSeconds});return;}
    for(const edge of SURFACE_EDGES){if(hardwareReason(edge,prep)||edge.a!==node&&edge.b!==node)continue;const dest=(edge.a===node?edge.b:edge.a) as SurfaceNodeId;if(seen.includes(dest))continue;
      const leg={edge:edge.id,from:node,to:dest},profile=legProfile(leg,moon,prep,pace);if(profile.peakOK)walk(dest,[...seen,dest],[...legs,leg],wh+profile.wh,seconds+profile.seconds,coldSeconds+profile.coldSeconds);}
  };walk(from,[from],[],0,0,0);return paths.sort((a,b)=>a.wh-b.wh||a.seconds-b.seconds)[0]??null;
}
export function beginSurfaceTrip(s:SurfaceState,legs:SurfaceLeg[]):SurfaceState{
  return !legs.length?s:{...s,stage:'driving',legs,legFrame:0,paused:false,held:false,selected:null,autonomous:true,autonomyArmed:false,feedback:null};
}
/** The same battery integral and exposure clock serve real measurements and previews. */
export function surfaceTaskPower(moon:MoonSession,prep:PreparationSelection,mode:'analysis'|'drilling'|'standby',ids:readonly string[]=[]){
  const point=surfacePosition(moon.surface),light=surfaceLight(point.x,point.z,moon),power=operatingPower(surfaceParts(moon,prep),mode,light,ids,crewCapabilities(moon.crew)),loadW=power.loadW+(light===0?SURFACE_MODEL.headlightW:0);
  const solarW=power.solarW*incidentEffects(moon).solarMultiplier;return {...power,loadW,solarW,deficitW:Math.max(0,loadW-solarW),surplusW:Math.max(0,solarW-loadW),peakOK:Math.max(0,loadW-solarW)<=power.dischargeLimitW,light};
}
export function spendSurfaceTask(s:SurfaceState,moon:MoonSession,prep:PreparationSelection,seconds:number,mode:'analysis'|'drilling'|'standby',ids:readonly string[]=[]):SurfaceState{
  const p=surfaceTaskPower({...moon,surface:s},prep,mode,ids),battery=batteryStep(s.batteryWh,moon.resources.capacityWh,p.loadW,p.solarW,seconds),warm=p.light>0?s.warmSeconds+seconds:0,cold=p.light===0?s.coldSeconds+seconds:warm>=600?0:s.coldSeconds;
  const failed=!p.peakOK||battery.unmetWh>0||cold>(prep.thermalId==='advanced-thermal'?7200:1200)||!crewTimeOK(s,moon,seconds);
  return {...s,batteryWh:battery.remainingWh,elapsedSeconds:s.elapsedSeconds+seconds,warmSeconds:warm,coldSeconds:cold,stage:failed?'failed':s.stage,feedback:failed?'failed':null};
}
export function surfaceReady(s:SurfaceState,moon:MoonSession,prep:PreparationSelection){const home=returnPlan(s.location,moon,prep,s.pace);return s.deployed&&s.crewSheltered&&s.stage==='idle'&&(moon.objective==='lunar-geology'?s.visited.includes('lookout')&&s.location==='base':s.visited.includes('edge')&&(s.visited.includes('lookout')||s.visited.includes('ridge')))&&!!home&&crewTimeOK(s,moon,home.seconds)&&s.batteryWh>=home.wh+moon.resources.capacityWh*SURFACE_MODEL.baseReserve;}
function spend(s:SurfaceState,moon:MoonSession,prep:PreparationSelection,seconds:number,mode:'traverse'|'standby'|'charging',light:number,rough=false){
  const p=surfacePower(moon,prep,mode,light,s.pace,rough),step=batteryStep(s.batteryWh,moon.resources.capacityWh,p.loadW,p.solarW,seconds);
  const warm=light>0?s.warmSeconds+seconds:0,cold=light===0?s.coldSeconds+seconds:warm>=600?0:s.coldSeconds;
  return {...s,batteryWh:step.remainingWh,elapsedSeconds:s.elapsedSeconds+seconds,warmSeconds:warm,coldSeconds:cold,
    stage:step.unmetWh>0||!p.peakOK||cold>(prep.thermalId==='advanced-thermal'?7200:1200)?'failed' as const:s.stage,
    feedback:step.unmetWh>0||!p.peakOK?'failed' as const:cold>(prep.thermalId==='advanced-thermal'?7200:1200)?'thermal' as const:s.feedback};
}
function advance(s:SurfaceState,frames:number,moon:MoonSession,prep:PreparationSelection){
  let next={...s};for(let i=0;i<frames;i++){
    if(next.paused||!['deploying','driving','charging'].includes(next.stage))break;
    if(next.stage==='deploying'){
      next=spend(next,moon,prep,SURFACE_MODEL.deploySeconds/SURFACE_MODEL.deployFrames,'standby',surfaceLight(-35,0,moon));next.phaseFrame++;next.evaSeconds+=SURFACE_MODEL.deploySeconds/SURFACE_MODEL.deployFrames;
      if(next.evaSeconds>SURFACE_MODEL.evaLimitSeconds){next={...next,stage:'failed',feedback:'failed'};break;}
      if(next.phaseFrame>=SURFACE_MODEL.deployFrames&&next.stage!=='failed')next={...next,stage:'idle',deployed:true,crewSheltered:true,phaseFrame:0,feedback:null};
    }else if(next.stage==='charging'){
      const p=surfaceNode(next.location);next=spend(next,moon,prep,SURFACE_MODEL.chargeSeconds/SURFACE_MODEL.chargeFrames,'charging',surfaceLight(p.x,p.z,moon));next.phaseFrame++;
      if(next.phaseFrame>=SURFACE_MODEL.chargeFrames&&next.stage!=='failed')next={...next,stage:'idle',phaseFrame:0,feedback:null};
    }else{
      const leg=next.legs[0];if(!leg)break;
      const f=(next.legFrame+.5)/SURFACE_MODEL.legFrames,profile=legProfile(leg,moon,prep,next.pace),edge=SURFACE_EDGES.find(e=>e.id===leg.edge)!;
      const point=legPoint(leg,f);next=spend(next,moon,prep,profile.seconds/SURFACE_MODEL.legFrames,'traverse',surfaceLight(point.x,point.z,moon),edge.rough);next.legFrame++;
      if(next.legFrame>=SURFACE_MODEL.legFrames&&next.stage!=='failed'){
        const legs=next.legs.slice(1);next={...next,location:leg.to,visited:[...new Set([...next.visited,leg.to])],traversed:[...next.traversed,leg.edge],legs,legFrame:0,stage:legs.length?'driving':'idle',autonomous:legs.length?next.autonomous:false,autonomyArmed:false,selected:null,held:false,feedback:null};
      }
    }
  }return next;
}
function apply(s:SurfaceState,c:SurfaceCommand,moon:MoonSession,prep:PreparationSelection):SurfaceState{
  switch(c.type){
    case 'deploy':return s.stage==='stowed'?{...s,stage:'deploying',crewSheltered:false,paused:false,phaseFrame:0}:s;
    case 'mode':return ['stowed','idle'].includes(s.stage)?{...s,mode:c.mode}:s;
    case 'pace':return s.stage==='idle'?{...s,pace:c.pace}:s;
    case 'select':{const report=s.stage==='idle'?routeReport(s,c.edge,moon,prep):null;return report?{...s,selected:c.edge,feedback:report.reason}:s;}
    case 'arm':return s.stage==='idle'?{...s,autonomyArmed:true,feedback:null}:s;
    case 'hint':return {...s,assisted:true};
    case 'home':{const home=returnPlan(s.location,moon,prep,s.pace);return s.stage==='idle'&&home?.legs.length&&crewTimeOK(s,moon,home.seconds)&&s.batteryWh>=home.wh+moon.resources.capacityWh*SURFACE_MODEL.baseReserve?{...s,stage:'driving',legs:home.legs,legFrame:0,paused:false,autonomous:true,assisted:true,feedback:null}:s;}
    case 'start':{
      if(s.stage!=='idle'||!s.selected)return s;const r=routeReport(s,s.selected,moon,prep)!;
      return r.feasible?{...s,stage:'driving',legs:r.legs,legFrame:0,paused:s.mode==='hold'&&!r.autonomous,held:false,autonomous:r.autonomous,assisted:s.assisted||s.mode==='guided'||r.autonomous,feedback:null}:{...s,feedback:r.reason};
    }
    case 'charge':{
      if(s.stage!=='idle')return s;const p=surfaceNode(s.location),light=surfaceLight(p.x,p.z,moon),power=surfacePower(moon,prep,'charging',light);
      if(!crewTimeOK(s,moon,SURFACE_MODEL.chargeSeconds))return {...s,feedback:'reserve'};
      return light===0||power.surplusW<=0?{...s,feedback:'dark'}:s.batteryWh>=moon.resources.capacityWh-.01?{...s,feedback:'full'}:{...s,stage:'charging',phaseFrame:0,paused:false,feedback:null};
    }
    case 'turn-back':{
      if(s.stage!=='driving'||s.autonomous||!s.legs[0])return s;const l=s.legs[0];return {...s,legs:[{...l,from:l.to,to:l.from}],legFrame:SURFACE_MODEL.legFrames-s.legFrame,paused:s.mode==='hold'&&!s.held,feedback:null};
    }
    case 'advance':return advance(s,c.frames,moon,prep);
  }
}
export type SurfaceEvent={type:'surface-deploy'}|{type:'surface-mode';mode:'guided'|'hold'}|{type:'surface-pace';pace:'eco'|'fast'}|{type:'surface-select';edge:SurfaceEdgeId}|{type:'surface-start'}|{type:'surface-charge'}|{type:'surface-arm'}|{type:'surface-home'}|{type:'surface-turn-back'}|{type:'surface-hint'}
  |{type:'surface-tick';seconds:number}|{type:'surface-pause'}|{type:'surface-resume'}|{type:'surface-held';held:boolean};
export function reduceSurface(s:SurfaceState,e:SurfaceEvent,moon:MoonSession,prep:PreparationSelection):SurfaceState{
  if(e.type==='surface-pause')return s.paused||!['driving','deploying','charging'].includes(s.stage)?s:{...s,paused:true,held:false};
  if(e.type==='surface-resume')return !['driving','deploying','charging'].includes(s.stage)?s:{...s,paused:s.mode==='hold'&&s.stage==='driving'&&!s.autonomous&&!s.held};
  if(e.type==='surface-held')return s.stage==='driving'&&!s.autonomous?{...s,held:e.held,paused:!e.held}:s;
  let c:SurfaceCommand,remainder=s.remainder;
  if(e.type==='surface-tick'){if(s.paused||!['driving','deploying','charging'].includes(s.stage)||s.stage==='driving'&&s.mode==='hold'&&!s.held&&!s.autonomous||!Number.isFinite(e.seconds)||e.seconds<=0)return s;
    // UI sends one fixed presentation step. Virtual leg time comes from the same route profile as forecasts.
    const seconds=s.remainder+Math.min(.25,e.seconds),frames=Math.floor((seconds+1e-9)/SURFACE_MODEL.step);remainder=Math.max(0,seconds-frames*SURFACE_MODEL.step);if(!frames)return {...s,remainder};c={type:'advance',frames};
  }else c={...e,type:e.type.replace('surface-','')} as SurfaceCommand;
  const next=apply(s,c,moon,prep);if(next===s)return s;const commands=[...s.commands],last=commands.at(-1);
  if(c.type==='advance'&&last?.type==='advance')commands[commands.length-1]={type:'advance',frames:last.frames+c.frames};else commands.push(c);
  return {...next,commands,remainder};
}
export function freshSurface(moon:MoonSession):SurfaceState{return {...emptySurface(),signature:moon.designSignature,batteryWh:landingResources(moon,moon.landing).batteryWh,assisted:moon.landing.assisted};}
export function surfaceResources(moon:MoonSession,s:SurfaceState):MissionResources{
  const base=landingResources(moon,moon.landing);return {...base,batteryWh:s.batteryWh,elapsedMissionSeconds:base.elapsedMissionSeconds+s.elapsedSeconds,
    supportUnitsRemaining:(base.supportUnitsRemaining??0)-3*s.elapsedSeconds/86400,platformEnergyWh:(base.platformEnergyWh??0)-PLATFORM_MODEL.lifeSupportLoadW*s.elapsedSeconds/3600};
}
export function restoreSurface(raw:unknown,moon:MoonSession,prep:PreparationSelection):SurfaceState{
  const clean=freshSurface(moon);if(!safeTouchdown(moon.landing)||!raw||typeof raw!=='object')return clean;const saved=raw as SurfaceState;
  if(saved.version!==1||saved.signature!==moon.designSignature||!Array.isArray(saved.commands)||saved.commands.length>2000)return clean;
  let s=clean,total=0;
  for(const c of saved.commands){
    if(!c||typeof c!=='object'||!['deploy','mode','pace','select','start','charge','arm','home','turn-back','hint','advance'].includes(c.type))return clean;
    if(c.type==='advance'){if(!Number.isInteger(c.frames)||c.frames<0||(total+=c.frames)>30000)return clean;s={...s,paused:false};}
    if(c.type==='mode'&&!['guided','hold'].includes(c.mode)||c.type==='pace'&&!['eco','fast'].includes(c.pace)||c.type==='select'&&!SURFACE_EDGES.some(e=>e.id===c.edge))return clean;
    s=apply(s,c,moon,prep);
  }
  return {...s,commands:[...saved.commands],remainder:0,held:false,paused:['driving','deploying','charging'].includes(s.stage),assisted:s.assisted||saved.assisted===true,attempts:Number.isInteger(saved.attempts)&&saved.attempts>=0?saved.attempts:0};
}
