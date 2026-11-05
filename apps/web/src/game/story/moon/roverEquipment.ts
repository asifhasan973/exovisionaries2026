import {createPreparationSelection} from '../design.ts';
import {installPart,partById} from '../preparation.ts';
import {equipmentReport} from './catalog.ts';
import {operatingPower} from './resources.ts';
import type {MoonSession} from './session.ts';
import type {OperatingMode} from './resources.ts';
import {geoCollector,geoSurvey,geoCollect,geoAnalyze,geologyFinding} from './geologyScience.ts';
import type {ScienceState} from './science.ts';
import {emptyScience,record,expectedFinding} from './science.ts';

/** Rebuild the immutable launch equipment, not the editable workshop draft. */
export function roverEquipment(moon:MoonSession){
 let prep=createPreparationSelection();for(const id of moon.launchSnapshot?.equipmentIds??[])prep=installPart(prep,id);
 return prep;
}
export function roverPower(moon:MoonSession,mode:OperatingMode,light:number){
 const prep=roverEquipment(moon),parts=equipmentReport(moon.launchSnapshot?.equipmentIds??[],moon.objective??'lunar-ice').parts;
 return operatingPower(parts,mode,light,prep.sciencePartIds);
}
export function roverCapability(moon:MoonSession){
 const prep=roverEquipment(moon),rover=partById(prep.roverId),collector=moon.objective==='lunar-geology'?geoCollector(prep):partById('trident');
 return {terrain:rover?.terrainStars??2,depth:Math.min(40,collector?.maxDepthCm??0),collector:collector?.id??null};
}
/** One successful core includes instrument survey and analysis; collection alone earns no science. */
export function roverEvidence(moon:MoonSession,ids:readonly string[],delivered:readonly string[],times:Record<string,number>={}){
 const prep=roverEquipment(moon),cap=roverCapability(moon);let science:ScienceState={...emptyScience(),objective:moon.objective??'lunar-ice',signature:moon.designSignature};
 for(const id of ids){
  science={...science,target:id==='A'?'lookout':'edge',depthCm:Math.min(cap.depth,40),currentIds:[]};
  if(moon.objective==='lunar-geology'){
   science=geoSurvey(science,moon,prep);science=geoCollect(science,prep);science=geoAnalyze(science,moon,prep);
   const finding=geologyFinding(science.records.filter(r=>science.currentIds.includes(r.id)));
   science={...science,records:science.records.map(r=>science.currentIds.includes(r.id)&&r.kind==='mineral-evidence'?{...r,classification:finding}:r)};
  }else{
   for(const instrument of ['nss','trident','nirvss','msolo'] as const)if(prep.sciencePartIds.includes(instrument))science=record(science,moon,instrument);
   const finding=expectedFinding(science.records.filter(r=>science.currentIds.includes(r.id)));
   science={...science,records:science.records.map(r=>science.currentIds.includes(r.id)&&r.kind==='water-evidence'?{...r,result:finding as 'confirmed'|'negative'|'inconclusive'}:r)};
  }
  science={...science,records:science.records.map(r=>science.currentIds.includes(r.id)?{...r,transmitted:delivered.includes(id),missionSeconds:times[id]??0}:r)};
 }
 return science;
}
