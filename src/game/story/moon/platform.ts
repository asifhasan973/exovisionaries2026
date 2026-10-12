import { availableDeltaV, energyWh } from './resources.ts';
import { CREW_CANDIDATES, crewReport } from './catalog.ts';
import type { CrewAssignment } from './catalog.ts';

/** Authored platform inputs; the equation is physical, the numeric design is not certified Apollo hardware. */
export const PLATFORM_MODEL = Object.freeze({
  id: 'moon-class-platform-v2', capacity: 3, surfaceCapacity: 2,
  ascentDryKg: 2200, ascentPropellantKg: 2600, ascentIspSeconds: 300, ascentRequiredMS: 2000,
  descentDryKg: 1500, descentPropellantKg: 8500, descentIspSeconds: 300, descentRequiredMS: 2100,
  serviceDryKg: 5900, servicePropellantKg: 8000, serviceIspSeconds: 315,
  // Lunar insertion + Earth departure + course correction allowance; TLI belongs to the supplied launch stage.
  serviceRequiredMS: 2300, maneuverMargin: .05, sampleReturnKg: 10,
  lifeSupportLoadW: 600, lifeSupportCapacityWh: 300000, lifeSupportReserve: .2,
  supplyKgPerCrewDay: 4, contingencyDays: 2, minimumPlanDays: 8, maximumPlanDays: 14,
});
export interface FlightPlan { days: number; supplyPack: 'standard' | 'extended' }
export const SUPPLY_PACKS = { standard: {name:'Standard supplies',crewDays:30}, extended:{name:'Extended supplies',crewDays:48} } as const;
export const defaultFlightPlan = (): FlightPlan => ({ days:8, supplyPack:'standard' });
export function restoreFlightPlan(raw: unknown): FlightPlan {
  const p=raw as Partial<FlightPlan>|null;
  return {days:Number.isInteger(p?.days)&&p!.days!>=8&&p!.days!<=14?p!.days!:8,supplyPack:p?.supplyPack==='extended'?'extended':'standard'};
}
export function platformReport(crew: CrewAssignment, equipmentKg: number, plan: FlightPlan){
  const roster=crewReport(crew),members=[crew.commander,crew.scientist,crew.support].filter(Boolean).length;
  const surfaceKg=[crew.commander,crew.scientist].reduce((sum,id)=>sum+(CREW_CANDIDATES.find(p=>p.id===id)?.massKg??0),0);
  const requiredCrewDays=members*(plan.days+PLATFORM_MODEL.contingencyDays),capacityCrewDays=SUPPLY_PACKS[plan.supplyPack].crewDays;
  const suppliesKg=capacityCrewDays*PLATFORM_MODEL.supplyKgPerCrewDay;
  const supportWh=energyWh(PLATFORM_MODEL.lifeSupportLoadW,(plan.days+2)*24*3600);
  const usableSupportWh=PLATFORM_MODEL.lifeSupportCapacityWh*(1-PLATFORM_MODEL.lifeSupportReserve);
  const dv=(dry:number,fuel:number,isp:number,required:number)=>{const available=availableDeltaV(9.80665*isp,dry,fuel);const needed=required*(1+PLATFORM_MODEL.maneuverMargin);return {dryKg:dry,propellantKg:fuel,availableMS:available,requiredMS:needed,marginMS:available-needed,pass:available>=needed};};
  const ascent=dv(PLATFORM_MODEL.ascentDryKg+surfaceKg+PLATFORM_MODEL.sampleReturnKg,PLATFORM_MODEL.ascentPropellantKg,PLATFORM_MODEL.ascentIspSeconds,PLATFORM_MODEL.ascentRequiredMS);
  const descent=dv(PLATFORM_MODEL.descentDryKg+PLATFORM_MODEL.ascentDryKg+PLATFORM_MODEL.ascentPropellantKg+surfaceKg+equipmentKg,PLATFORM_MODEL.descentPropellantKg,PLATFORM_MODEL.descentIspSeconds,PLATFORM_MODEL.descentRequiredMS);
  const service=dv(PLATFORM_MODEL.serviceDryKg+roster.massKg+suppliesKg+PLATFORM_MODEL.sampleReturnKg,PLATFORM_MODEL.servicePropellantKg,PLATFORM_MODEL.serviceIspSeconds,PLATFORM_MODEL.serviceRequiredMS);
  return {crew:roster,requiredCrewDays,capacityCrewDays,suppliesKg,supportWh,usableSupportWh,ascent,descent,service,
    grossSpacecraftKg:PLATFORM_MODEL.serviceDryKg+PLATFORM_MODEL.servicePropellantKg+PLATFORM_MODEL.ascentDryKg+PLATFORM_MODEL.ascentPropellantKg+PLATFORM_MODEL.descentDryKg+PLATFORM_MODEL.descentPropellantKg+roster.massKg+suppliesKg+equipmentKg,
    suppliesOK:roster.complete&&requiredCrewDays<=capacityCrewDays,
    energyOK:supportWh<=usableSupportWh,
    propulsionOK:ascent.pass&&descent.pass&&service.pass,
    capacityOK:roster.complete&&members<=PLATFORM_MODEL.capacity&&roster.surface.filter(Boolean).length<=PLATFORM_MODEL.surfaceCapacity,
  };
}
export const PLATFORM_NOTES=[
  'The 8–14-day range is this game scenario, not a universal lunar mission limit. Two spare days are included in the supply calculation.',
  'Crew-days mean one person supported for one day. The 30/48 crew-day packs, 4 kg per crew-day, 600 W cabin load and 300 kWh platform supply are authored game allocations, not a nutrition or life-support certification.',
  'Empty masses, fuel masses, specific impulses and maneuver allowances are illustrative Moon-class game inputs. Ideal delta-v uses g₀ × Isp × ln(wet mass / dry mass), with an authored 5% maneuver margin.',
  'The descent calculation carries the equipment kit. That kit stays on the Moon; the ascent calculation carries two crew and a 10-kg return-sample allowance. The command spacecraft carries all three crew home.',
  'Service fuel covers an authored lunar insertion, Earth-departure and correction budget. TLI propulsion belongs to the launch stage and will be validated with trajectory gameplay in Module 4.',
  'This review does not certify temperature survival, structural strength, crew radiation dose, entry heating or launch performance. It locks a consistent educational game design for later flight.',
] as const;
