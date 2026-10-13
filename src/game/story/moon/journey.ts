import type { MoonSession, MissionResources } from './session.ts';
import { PLATFORM_MODEL, platformReport } from './platform.ts';

/** Authored transfer profiles, not Lambert solutions. Fuel uses the ideal rocket equation. */
export const ROUTES = [
  {id:'fast',name:'Fast',days:2.5,tliMS:3500,loiMS:1150,risk:'Higher arrival burn'},
  {id:'balanced',name:'Balanced',days:3.25,tliMS:3200,loiMS:900,risk:'Balanced fuel & time'},
  {id:'efficient',name:'Efficient',days:4.5,tliMS:3080,loiMS:750,risk:'More supplies needed'},
] as const;
export type RouteId=typeof ROUTES[number]['id'];
export type JourneyStage='route'|'tli-window'|'tli-burn'|'coast'|'loi-window'|'loi-burn'|'complete';
export type BurnDirection='prograde'|'retrograde';
export interface JourneyState {
  version:1;signature:string|null;route:RouteId|null;stage:JourneyStage;elapsed:number;
  mode:'guided'|'challenge';speed:1|1.5|2;direction:BurnDirection;paused:boolean;
  burns:('tli'|'loi')[];attempts:number;feedback:string|null;assisted:boolean;
}
export const emptyJourney=():JourneyState=>({version:1,signature:null,route:null,stage:'route',elapsed:0,mode:'guided',speed:1,direction:'prograde',paused:false,burns:[],attempts:0,feedback:null,assisted:false});
export const TRANSFER_MODEL={id:'moon-transfer-v1',upperDryKg:6000,upperFuelKg:75000,upperIspSeconds:450,parkingSeconds:7200,coastScreenSeconds:14,burnScreenSeconds:3,returnDays:3,surfaceDays:1,operationsDays:.5,earthReturnMS:1200,courseCorrectionMS:100} as const;
const g0=9.80665;
export function fuelForBurn(wetKg:number,deltaVMS:number,ispSeconds:number){return wetKg*(1-Math.exp(-deltaVMS/(g0*ispSeconds)));}
export function routeReport(moon:MoonSession,id:RouteId){
  const route=ROUTES.find(r=>r.id===id)!;
  const account=moon.human.approved?.accounting??platformReport(moon.crew,0,moon.plan);
  const wet=account.grossSpacecraftKg;
  const tliFuelKg=fuelForBurn(wet+TRANSFER_MODEL.upperDryKg+TRANSFER_MODEL.upperFuelKg,route.tliMS*1.05,TRANSFER_MODEL.upperIspSeconds);
  // Lunar insertion carries the full lander AND its descent/ascent propellant.
  const loiFuelKg=fuelForBurn(wet,route.loiMS*1.05,PLATFORM_MODEL.serviceIspSeconds);
  const correctionsFuelKg=fuelForBurn(wet-loiFuelKg,TRANSFER_MODEL.courseCorrectionMS,PLATFORM_MODEL.serviceIspSeconds);
  const returnReserveKg=fuelForBurn(account.service.dryKg+PLATFORM_MODEL.servicePropellantKg-loiFuelKg-correctionsFuelKg,TRANSFER_MODEL.earthReturnMS*1.05,PLATFORM_MODEL.serviceIspSeconds);
  const serviceRemainingKg=PLATFORM_MODEL.servicePropellantKg-loiFuelKg-correctionsFuelKg;
  const neededDays=Math.ceil(route.days+TRANSFER_MODEL.returnDays+TRANSFER_MODEL.surfaceDays+TRANSFER_MODEL.operationsDays);
  const suppliesOK=moon.plan.days>=neededDays&&account.capacityCrewDays>=3*(neededDays+2);
  const powerOK=(neededDays+2)*24*PLATFORM_MODEL.lifeSupportLoadW<=account.usableSupportWh;
  const fuelOK=tliFuelKg<=TRANSFER_MODEL.upperFuelKg&&serviceRemainingKg>=returnReserveKg;
  return {...route,tliFuelKg,loiFuelKg,correctionsFuelKg,returnReserveKg,serviceRemainingKg,neededDays,suppliesOK,powerOK,fuelOK,feasible:suppliesOK&&powerOK&&fuelOK};
}
export function burnSafe(j:JourneyState){return j.mode==='guided'||j.elapsed>=1.2&&j.elapsed<=2.8;}
export function coastFraction(j:JourneyState){return ['loi-window','loi-burn','complete'].includes(j.stage)?1:j.stage==='coast'?Math.min(1,j.elapsed/TRANSFER_MODEL.coastScreenSeconds):0;}
/** Rebuild accounting from receipts. Repeated ticks/reloads cannot double-spend fuel. */
export function journeyResources(moon:MoonSession,j:JourneyState):MissionResources{
  const start:MissionResources={...moon.resources,batteryWh:moon.resources.capacityWh,roverHealth:100,
    upperStagePropellantKg:TRANSFER_MODEL.upperFuelKg,descentPropellantKg:PLATFORM_MODEL.descentPropellantKg,ascentPropellantKg:PLATFORM_MODEL.ascentPropellantKg};
  const account=moon.human.approved!.accounting;
  const fraction=coastFraction(j),route=j.route?routeReport(moon,j.route):null;
  const seconds=TRANSFER_MODEL.parkingSeconds+(route?route.days*86400*fraction:0);
  const captured=j.stage==='complete';
  return {...start,upperStagePropellantKg:['coast','loi-window','loi-burn','complete'].includes(j.stage)?0:TRANSFER_MODEL.upperFuelKg,elapsedMissionSeconds:seconds,supportUnitsRemaining:account.capacityCrewDays-3*seconds/86400,
    platformEnergyWh:PLATFORM_MODEL.lifeSupportCapacityWh-PLATFORM_MODEL.lifeSupportLoadW*seconds/3600,
    returnPropellantKg:PLATFORM_MODEL.servicePropellantKg-(captured&&route?route.loiFuelKg+route.correctionsFuelKg:0)};
}
export type JourneyEvent={type:'journey-route';id:RouteId}|{type:'journey-direction';direction:BurnDirection}|{type:'journey-mode';mode:'guided'|'challenge'}
  |{type:'journey-speed';speed:number}|{type:'journey-tick';seconds:number}|{type:'journey-burn'}|{type:'journey-pause'}|{type:'journey-resume'}|{type:'journey-retry'}|{type:'journey-skip'}|{type:'journey-hint'};
export function reduceJourney(j:JourneyState,event:JourneyEvent,moon:MoonSession):JourneyState{
  if(event.type==='journey-route')return j.stage==='route'&&ROUTES.some(r=>r.id===event.id)?{...j,route:event.id,feedback:null}:j;
  if(event.type==='journey-speed')return [1,1.5,2].includes(event.speed)?{...j,speed:event.speed as JourneyState['speed']}:j;
  if(event.type==='journey-hint')return {...j,assisted:true};
  if(event.type==='journey-mode')return j.stage==='route'?{...j,mode:event.mode}:j;
  if(event.type==='journey-direction')return ['tli-window','loi-window'].includes(j.stage)&&['prograde','retrograde'].includes(event.direction)?{...j,direction:event.direction,feedback:null}:j;
  if(event.type==='journey-pause')return {...j,paused:true};
  if(event.type==='journey-resume'||event.type==='journey-retry')return {...j,paused:false,elapsed:event.type==='journey-retry'?0:j.elapsed,feedback:null};
  const route=j.route?routeReport(moon,j.route):null;
  if(event.type==='journey-skip')return j.stage!=='route'&&route?.feasible?{...j,stage:'complete',burns:['tli','loi'],elapsed:TRANSFER_MODEL.burnScreenSeconds,assisted:true,paused:false,feedback:null}:j;
  if(event.type==='journey-burn'){
    if(!['tli-window','loi-window'].includes(j.stage)||j.paused||!route?.feasible)return j;
    const correct=j.stage==='tli-window'?'prograde':'retrograde';
    if(j.direction!==correct||!burnSafe(j))return {...j,attempts:j.attempts+1,feedback:j.direction!==correct?(correct==='prograde'?'Point forward to head for the Moon.':'Point backward to slow down at the Moon.'):'Wait for the green window. No fuel spent.'};
    return {...j,stage:j.stage==='tli-window'?'tli-burn':'loi-burn',burns:j.stage==='tli-window'?['tli']:['tli','loi'],elapsed:0,feedback:null,assisted:j.assisted||j.mode==='guided'};
  }
  if(event.type!=='journey-tick'||j.paused||!Number.isFinite(event.seconds)||event.seconds<=0)return j;
  const window=['tli-window','loi-window'].includes(j.stage);
  if(j.stage==='route'||j.stage==='complete'||window&&j.mode==='guided')return j;
  const limit=window?4:j.stage==='coast'?TRANSFER_MODEL.coastScreenSeconds:TRANSFER_MODEL.burnScreenSeconds;
  const elapsed=Math.min(limit,j.elapsed+Math.min(event.seconds,.25)*j.speed);
  if(elapsed<limit)return {...j,elapsed};
  if(window)return {...j,elapsed,paused:true,feedback:'Window missed. Retry this burn; no fuel spent.'};
  return {...j,stage:j.stage==='tli-burn'?'coast':j.stage==='coast'?'loi-window':'complete',elapsed:0,direction:j.stage==='coast'?'prograde':j.direction,feedback:null};
}
export function restoreJourney(raw:unknown,moon:MoonSession):JourneyState{
  const clean=emptyJourney();if(!raw||typeof raw!=='object')return clean;
  const saved=raw as JourneyState;
  if(saved.version!==1||saved.signature!==moon.designSignature||!['route','tli-window','tli-burn','coast','loi-window','loi-burn','complete'].includes(saved.stage)||!Number.isFinite(saved.elapsed)||saved.elapsed<0||!Number.isInteger(saved.attempts)||saved.attempts<0)return clean;
  const expected=['route','tli-window'].includes(saved.stage)?'':['loi-burn','complete'].includes(saved.stage)?'tli,loi':'tli';
  if((saved.burns??[]).join(',')!==expected)return clean;
  const route=ROUTES.find(r=>r.id===saved.route),limit=saved.stage.endsWith('window')?4:saved.stage==='coast'?TRANSFER_MODEL.coastScreenSeconds:TRANSFER_MODEL.burnScreenSeconds;
  if(saved.elapsed>limit||saved.stage!=='route'&&(!route||!routeReport(moon,route.id).feasible))return clean;
  return {...clean,signature:moon.designSignature,route:route?.id??null,stage:saved.stage,elapsed:saved.elapsed,burns:[...(saved.burns??[])],attempts:saved.attempts,mode:saved.mode==='challenge'?'challenge':'guided',speed:[1,1.5,2].includes(saved.speed)?saved.speed:1,direction:saved.direction==='retrograde'?'retrograde':'prograde',assisted:saved.assisted===true,paused:saved.stage!=='route'&&saved.stage!=='complete'};
}

export const lunarOrbitSpeedKmS=Math.sqrt(4902.8/(1737.4+100));
