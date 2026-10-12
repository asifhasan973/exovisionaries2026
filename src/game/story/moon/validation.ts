import type { MoonSession } from './session.ts';
import type { PreparationSelection } from '../design.ts';
import { equipmentReport, equipmentIds, crewReport } from './catalog.ts';
import { MOON_RULES } from './rules.ts';
import { platformReport, PLATFORM_MODEL, PLATFORM_NOTES } from './platform.ts';
import type { FlightPlan } from './platform.ts';
import type { CrewAssignment } from './catalog.ts';
import { emptyStress, stressComplete, stressResult, STRESS_ORDER } from './stress.ts';
import type { StressState, StressAttempt } from './stress.ts';

export const HUMAN_CHECKS=['crew-check','systems-check','stress-check'] as const;
export type HumanCheck=typeof HUMAN_CHECKS[number];
export const RETURN_CONNECTIONS=['ascent','service','shield','parachutes'] as const;
export type ReturnConnection=typeof RETURN_CONNECTIONS[number];
export const HUMAN_PACKING=['capsule','lander','supplies'] as const;
export type HumanPack=typeof HUMAN_PACKING[number];
export interface HumanManifest {
  version:1; status:'GAME DEPARTURE PLAN APPROVED'; signature:string; platformId:string;
  objective:string|null; site:string|null; crew:CrewAssignment; plan:FlightPlan;
  equipment:{id:string;name:string;massKg:number;credits:number;nominalPowerW:number}[];
  accounting:ReturnType<typeof platformReport>; stress:StressAttempt[]; assisted:boolean;
  assumptions:readonly string[]; scienceEarned:0; flightExecuted:false;
}
export interface HumanValidation {
  signature:string|null; checks:Partial<Record<HumanCheck,string>>;
  cabinSealed:boolean; connected:ReturnConnection[]; stress:StressState;
  packing:HumanPack[]; approved:HumanManifest|null;
}
export const emptyHuman=():HumanValidation=>({signature:null,checks:{},cabinSealed:false,connected:[],stress:emptyStress(),packing:[],approved:null});
export function humanReport(moon:MoonSession,prep:PreparationSelection){
  const equipment=equipmentReport(equipmentIds(prep,moon.objective??'lunar-ice'),moon.objective??'lunar-ice');
  const platform=platformReport(moon.crew,equipment.massKg,moon.plan);
  const crew=crewReport(moon.crew);
  const connectionOK=RETURN_CONNECTIONS.every(id=>moon.human.connected.includes(id));
  return {equipment,platform,crew,connectionOK,
    crewOK:crew.complete&&crew.credits<=MOON_RULES.crewCredits&&platform.capacityOK&&platform.suppliesOK&&platform.energyOK&&moon.human.cabinSealed,
    returnOK:platform.propulsionOK&&connectionOK,
    stressOK:stressComplete(moon.human.stress,moon.designSignature,prep,moon.crew),
  };
}
export function humanCheckAccepted(id:HumanCheck,moon:MoonSession,prep:PreparationSelection){
  if(moon.human.checks[id]!==moon.designSignature)return false;
  const report=humanReport(moon,prep);
  return id==='crew-check'?report.crewOK:id==='systems-check'?report.returnOK:report.stressOK;
}
export function allHumanChecks(moon:MoonSession,prep:PreparationSelection){return HUMAN_CHECKS.every(id=>humanCheckAccepted(id,moon,prep));}
export function humanPacked(moon:MoonSession,prep:PreparationSelection){return allHumanChecks(moon,prep)&&moon.human.signature===moon.designSignature&&moon.human.packing.length===3&&HUMAN_PACKING.every((id,i)=>moon.human.packing[i]===id);}
function freezeSnapshot<T>(value:T):T{if(value&&typeof value==='object'){Object.values(value).forEach(freezeSnapshot);Object.freeze(value);}return value;}
export function humanManifest(moon:MoonSession,prep:PreparationSelection):HumanManifest{
  const report=humanReport(moon,prep);
  return freezeSnapshot({version:1,status:'GAME DEPARTURE PLAN APPROVED',signature:moon.designSignature,platformId:PLATFORM_MODEL.id,
    objective:moon.objective,site:moon.site,crew:{...moon.crew},plan:{...moon.plan},
    equipment:report.equipment.parts.map(p=>({id:p.id,name:p.name,massKg:p.massKg,credits:p.credits,nominalPowerW:p.nominalPowerW})).sort((a,b)=>a.id.localeCompare(b.id)),
    accounting:report.platform,stress:moon.human.stress.passed.map(attempt=>({...attempt})),assisted:moon.human.stress.assisted,
    assumptions:[...PLATFORM_NOTES,'The capsule, lander, crew and equipment are separate accounts. No real flight or science has happened during these rehearsals.'],scienceEarned:0,flightExecuted:false});
}
/** Restore interaction receipts and recalculate their results. Approval is restored later with all equipment checks present. */
export function restoreHuman(raw:unknown,moon:MoonSession,prep:PreparationSelection):HumanValidation{
  const clean=emptyHuman();if(!raw||typeof raw!=='object'||Array.isArray(raw))return clean;
  const saved=raw as HumanValidation;if(saved.signature!==moon.designSignature)return clean;
  clean.signature=moon.designSignature;clean.cabinSealed=saved.cabinSealed===true;
  clean.connected=RETURN_CONNECTIONS.filter(id=>Array.isArray(saved.connected)&&saved.connected.includes(id));
  const stress=saved.stress;
  if(stress?.signature===moon.designSignature){
    clean.stress={...emptyStress(),signature:moon.designSignature,mode:stress.mode==='challenge'?'challenge':'guided',assisted:stress.assisted===true||stress.mode!=='challenge'};
    for(const [i,id] of STRESS_ORDER.entries()) {const attempt=stress.passed?.[i];if(attempt?.id!==id||!stressResult(id,attempt.action,prep,moon.crew).pass)break;clean.stress.passed.push({id,action:attempt.action});}
  }
  const current={...moon,human:clean};
  for(const id of HUMAN_CHECKS){if(saved.checks?.[id]!==moon.designSignature)break;const report=humanReport(current,prep);if(!(id==='crew-check'?report.crewOK:id==='systems-check'?report.returnOK:report.stressOK))break;clean.checks[id]=moon.designSignature;}
  if(allHumanChecks(current,prep))for(const [i,id] of HUMAN_PACKING.entries()){if(saved.packing?.[i]!==id)break;clean.packing.push(id);}
  return clean;
}
export function departureResources(moon:MoonSession,prep:PreparationSelection){
  const report=humanReport(moon,prep);
  return {...moon.resources,batteryWh:moon.resources.capacityWh,supportUnitsRemaining:report.platform.capacityCrewDays,
    ascentPropellantKg:PLATFORM_MODEL.ascentPropellantKg,returnPropellantKg:PLATFORM_MODEL.servicePropellantKg,descentPropellantKg:PLATFORM_MODEL.descentPropellantKg,
    platformEnergyWh:PLATFORM_MODEL.lifeSupportCapacityWh,elapsedMissionSeconds:0};
}
