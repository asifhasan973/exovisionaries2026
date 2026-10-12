import { moonPart, crewCapabilities } from './catalog.ts';
import type { CrewAssignment } from './catalog.ts';
import type { PreparationSelection } from '../design.ts';
import { installedIds, partById } from '../preparation.ts';
import { operatingPower, energyWh } from './resources.ts';

export const STRESS_ORDER=['mobility','dust','communication','radiation'] as const;
export type StressId=typeof STRESS_ORDER[number];
export type StressMode='guided'|'challenge';
export type StressAction='safe-route'|'steep-route'|'clean-lens'|'drive-blind'|'move-ridge'|'boost-radio'|'shelter'|'keep-working';
export interface StressAttempt { id:StressId; action:StressAction }
export interface StressState { signature:string|null; mode:StressMode; passed:StressAttempt[]; last:StressAttempt|null; assisted:boolean }
export const emptyStress=():StressState=>({signature:null,mode:'guided',passed:[],last:null,assisted:false});
/** Shared surface constraints, with explicitly authored numerical ranges and mobility thresholds. */
export function mobilityConditions(preparation:PreparationSelection,crew:CrewAssignment,route:'safe'|'steep'){
  const rover=partById(preparation.roverId),parts=installedIds(preparation).map(moonPart).filter(p=>!!p);
  const power=operatingPower(parts,'traverse',0,[],crewCapabilities(crew));
  const missionSeconds=route==='safe'?120:150;
  return {terrainOK:route==='safe'||(rover?.terrainStars??0)>=3,missionSeconds,energyWh:energyWh(power.loadW*(route==='safe'?1:1.35),missionSeconds),account:'rehearsal' as const};
}
export function communicationConditions(preparation:PreparationSelection,lineOfSight:boolean,distanceM:number){
  const rangeM=preparation.communicationId==='high-gain-communication'?1200:400;
  return {lineOfSight,rangeM,distanceM,connected:lineOfSight&&distanceM<=rangeM};
}
export function dustConditions(clean:boolean){return {visibility:clean?1:.25,navigationOK:clean};}
export function radiationConditions(sheltered:boolean){return {sheltered,evaAllowed:false,risk:sheltered?'reduced':'elevated',quantitativeDoseModeled:false} as const;}
export function stressResult(id:StressId,action:StressAction,preparation:PreparationSelection,crew:CrewAssignment){
  if(id==='mobility') {const route=mobilityConditions(preparation,crew,action==='safe-route'?'safe':'steep');return {pass:['safe-route','steep-route'].includes(action)&&route.terrainOK,text:route.terrainOK?'Route passed. Keep a return reserve.':'Too steep for this rover. Take the gentle route.',energyWh:route.energyWh};}
  if(id==='dust') {const cleared=action==='clean-lens';return {pass:cleared&&dustConditions(cleared).navigationOK,text:cleared?'Clear view! Now we can navigate.':'Dust hides the rocks. Clean the lens before driving.',energyWh:0};}
  if(id==='communication') {const link=communicationConditions(preparation,action==='move-ridge',300);return {pass:link.connected,text:link.connected?'Signal restored. The lander is in view.':'The hill blocks the signal. Move into view; more power cannot see through it.',energyWh:0};}
  const exposure=radiationConditions(action==='shelter');return {pass:exposure.sheltered&&!exposure.evaAllowed,text:exposure.sheltered?'Sheltered. Wait for the all-clear.':'Stop the Moon walk. Shelter reduces exposure.',energyWh:0};
}
export function stressComplete(stress:StressState,signature:string,prep:PreparationSelection,crew:CrewAssignment){return stress.signature===signature&&stress.passed.length===STRESS_ORDER.length&&STRESS_ORDER.every((id,i)=>stress.passed[i]?.id===id&&stressResult(id,stress.passed[i].action,prep,crew).pass);}
export const STRESS_SCENES={
  mobility:{title:'Pick a safe route',text:'Help your rover cross the slope.',options:[{id:'safe-route',label:'Gentle route'},{id:'steep-route',label:'Steep shortcut'}],hint:'safe-route'},
  dust:{title:'Dust on the camera!',text:'Make the view clear before driving.',options:[{id:'drive-blind',label:'Keep driving'},{id:'clean-lens',label:'Clean the lens'}],hint:'clean-lens'},
  communication:{title:'We lost the signal!',text:'Get the lander back in view.',options:[{id:'boost-radio',label:'Turn up radio'},{id:'move-ridge',label:'Move to the ridge'}],hint:'move-ridge'},
  radiation:{title:'Space-weather alert',text:'Bring the surface team to shelter.',options:[{id:'shelter',label:'Go to shelter'},{id:'keep-working',label:'Keep exploring'}],hint:'shelter'},
} as const;
