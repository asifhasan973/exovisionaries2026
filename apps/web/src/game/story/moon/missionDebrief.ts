import type {WorkshopSession} from '../workshopSession.ts';
import {missionCard} from './missionCard.ts';
import {landingResources} from './landing.ts';
import {roverCapability,roverEquipment,roverPower} from './roverEquipment.ts';
import {partById} from '../preparation.ts';
import {routeReport} from './journey.ts';
import {surfacePower} from './surface.ts';
import {PLATFORM_MODEL} from './platform.ts';

/** Describes recorded observations and calculated trade-offs, never counterfactual discoveries. */
export function missionDebrief(s:WorkshopSession){
 const card=missionCard(s),m=s.moon,r=m.rover,prep=r?roverEquipment(m):s.preparation,origin=landingResources(m,m.landing),end=m.resources;
 const readings=card.measurements.filter(x=>x.transmitted),findings=[...new Set(readings.flatMap(x=>x.kind==='water-evidence'?[x.result??'inconclusive']:x.kind==='mineral-evidence'?[x.classification??'inconclusive']:[]))];
 const decisions:string[]=[],recommendations:string[]=[];
 if(m.journey.route){const chosen=routeReport(m,m.journey.route);decisions.push(`${chosen.name} transfer took ${chosen.days} days; lunar insertion required ${chosen.loiFuelKg.toFixed(0)} kg of service propellant.`);const alternative=routeReport(m,m.journey.route==='efficient'?'balanced':'efficient');decisions.push(`${alternative.name} would change transfer time by ${(alternative.days-chosen.days).toFixed(2)} days and insertion fuel by ${(alternative.loiFuelKg-chosen.loiFuelKg).toFixed(0)} kg at this launch mass. ${alternative.feasible?'It passes':'It does not pass'} the saved fuel/supply checks. This is a planning comparison, not a replayed result.`);}
 if(r){const power=roverPower(m,'traverse',0),sun=roverPower(m,'traverse',1),cap=roverCapability(m);decisions.push(`${partById(prep.roverId)?.name??'Selected rover'} used ${power.loadW.toFixed(0)} W while traversing in darkness. Its terrain rating ${cap.terrain}/5 controls the slope speed penalty.`);decisions.push(`${partById(prep.solarId)?.name??'Selected panels'} generate ${sun.solarW.toFixed(0)} W in full game sunlight, against ${sun.loadW.toFixed(0)} W traverse load. ${sun.solarW>=sun.loadW?'This configuration can cover that load in sunlight.':'The battery covers the remaining load even in sunlight.'}`);decisions.push(`${partById(cap.collector)?.name??'Collection tool'} reached ${cap.depth} cm in this run; the authored target limit is 40 cm.`);}
 if(!readings.length)recommendations.push('Collect and deliver instrument readings; sample delivery alone does not establish composition.');
 else if(m.objective==='lunar-ice'&&!readings.some(x=>x.result==='confirmed'))recommendations.push(prep.sciencePartIds.includes('msolo')?'Retain optical and gas instruments for the next attempt and check whether their readings agree; this record does not confirm water.':'Add MSolo if the budget and power checks allow: water confirmation requires agreeing optical and gas readings, not hydrogen alone.');
 else if(m.objective==='lunar-geology'&&!readings.some(x=>x.classification&&x.classification!=='inconclusive'))recommendations.push('Carry complementary mineral/element tools and compare their readings; the current record does not support a rock classification.');
 else recommendations.push('Compare another location using the same instrument families; test whether its evidence supports the same finding.');
 if(r&&r.batteryWh<r.capacityWh*.2)recommendations.push('Increase battery capacity or reduce operating loads; the final rover battery is below the game’s 20% reserve.');
 else if(r&&roverPower(m,'traverse',1).deficitW>0)recommendations.push('Compare a more efficient solar panel or a lower-power rover to reduce the measured sunlit power deficit.');
 else recommendations.push('Compare a lighter valid equipment kit while retaining the instruments that produced your useful readings.');
 if(m.journey.route!=='efficient')recommendations.push('Preview the efficient transfer: compare its lower arrival burn against the extra supply days before choosing it.');
 else recommendations.push('Preview the balanced transfer to compare shorter travel against its higher arrival burn.');
 const supplied=m.human.approved?.accounting;
 return {card,findings,decisions,recommendations:recommendations.slice(0,3),operational:card.crewRecovered===3?'Crew recovered':'Crew not yet recovered',
  collected:r?r.cargo.length+r.deposited.length:card.samples.length,returned:card.crewRecovered===3?(r?r.deposited.length:card.samples.filter(x=>x.stowed).length):0,
  battery:origin.capacityWh>0?{capacityWh:r?.capacityWh??origin.capacityWh,startWh:origin.batteryWh,endWh:r?.batteryWh??m.surface.batteryWh,solarW:r?roverPower(m,'traverse',1).solarW:surfacePower(m,prep,'traverse',1).solarW,loadW:r?roverPower(m,'traverse',0).loadW:surfacePower(m,prep,'traverse',0).loadW}:null,
  resources:{elapsedDays:card.elapsedDays,crewDaysUsed:supplied?supplied.capacityCrewDays-(end.supportUnitsRemaining??0):null,cabinUsedKWh:supplied?(supplied.lifeSupportCapacityWh-(end.platformEnergyWh??0))/1000:null,descentUsedKg:PLATFORM_MODEL.descentPropellantKg-(end.descentPropellantKg??PLATFORM_MODEL.descentPropellantKg),ascentUsedKg:card.ascentFuelUsedKg,serviceUsedKg:supplied?supplied.service.propellantKg-(end.returnPropellantKg??0):null}};
}
export const COMPARISON_KEY='zero_to_beyond_mission_comparison_v1';
export function comparisonRecord(s:WorkshopSession){const d=missionDebrief(s);return {version:1 as const,objective:s.moon.objective,signature:s.moon.designSignature,seed:s.moon.scenarioSeed,route:d.card.route,assisted:d.card.assisted,points:d.card.deliveredSciencePoints,samples:d.returned,outcome:d.card.outcome?.status??'incomplete',massKg:d.card.massKg,credits:d.card.credits,days:d.card.elapsedDays,fuelKg:d.resources.serviceUsedKg,batteryWh:d.battery?.capacityWh??null,solarW:d.battery?.solarW??null};}
export type ComparisonRecord=ReturnType<typeof comparisonRecord>;
export function readComparison(raw:string|null):ComparisonRecord|null{try{const r=JSON.parse(raw??'null');return r?.version===1&&['lunar-ice','lunar-geology'].includes(r.objective)&&typeof r.signature==='string'&&Number.isFinite(r.seed)&&typeof r.assisted==='boolean'&&typeof r.route==='string'&&['points','samples','massKg','credits','days'].every(k=>Number.isFinite(r[k])&&r[k]>=0)&&['fuelKg','batteryWh','solarW'].every(k=>r[k]===null||Number.isFinite(r[k])&&r[k]>=0)&&typeof r.outcome==='string'?r:null;}catch{return null;}}
