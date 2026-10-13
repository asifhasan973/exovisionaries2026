import {GEOLOGY_MODEL,geoTools,geoCollector,geoTask,geoSurvey,geoCollect,geoAnalyze,geoListen,geologyFinding,geoAnalytical,geoMeasurementId} from './geologyScience.ts';
import type {GeoFinding,GeoSample} from './geologyScience.ts';
import {emptyIncidents,INCIDENT_MODEL,primaryIncident,incidentEffects,openIncident,chooseIncident,resolveIncident,updateIncidents,careKitAvailable} from './incidents.ts';
import type {IncidentState,IncidentKind,IncidentAction} from './incidents.ts';
import type {MoonSession,ScienceObservation} from './session.ts';
import type {PreparationSelection} from '../design.ts';
import {drillDurationSeconds,energyWh} from './resources.ts';
import {surfaceNode,surfacePath,surfacePosition,surfaceLink,surfaceReady,beginSurfaceTrip,reduceSurface,spendSurfaceTask,surfaceTaskPower,crewTimeOK,surfaceResources,restoreSurface,legProfile,SURFACE_MODEL} from './surface.ts';
import type {SurfaceState} from './surface.ts';
import type {SCIENCE_LINES} from './scienceCopy.ts';

export const SCIENCE_MODEL={id:'ice-evidence-v2',step:.1,surveySeconds:120,analysisSeconds:180,transmitSeconds:60,surveyFrames:30,drillFrames:50,analysisFrames:40,transmitFrames:25} as const;
export const SCIENCE_TARGETS=[{id:'lookout',name:'Sunny lookout',hint:'Close · sunlight'},{id:'edge',name:'Shadow edge',hint:'Cold · no solar'},{id:'target',name:'Crater floor',hint:'Long trip · deep cold'}] as const;
export type ScienceTarget=typeof SCIENCE_TARGETS[number]['id'];
export type ScienceFinding='confirmed'|'inconclusive'|'negative'|GeoFinding;
export type SciencePhase='plan'|'outbound'|'survey'|'drilling'|'analysis'|'returning'|'report'|'transmitting'|'ready'|'failed'|'recovering'|'sensor-site'|'listening';
type ScienceCommand={type:'sensor-plan';placement:'ground'|'rover'}|{type:'place-sensor';placement:'ground'|'rover'}|{type:'incident';action:IncidentAction}|{type:'commit'}|{type:'secure';item:'rover'|'data'|'crew'|'samples'}|{type:'target';target:ScienceTarget}|{type:'depth';cm:number}|{type:'program';program:'survey'|'sample'}|{type:'gas';enabled:boolean}|{type:'start'}|{type:'claim';finding:ScienceFinding}|{type:'transmit'}|{type:'new-trip'}|{type:'home'}|{type:'charge'}|{type:'retry'}|{type:'hint'}|{type:'advance';frames:number};
export interface ScienceState {
  version:2;model:typeof SCIENCE_MODEL.id|typeof GEOLOGY_MODEL.id;objective:'lunar-ice'|'lunar-geology';samples:GeoSample[];seismometerSite:ScienceTarget|null;sensorPlan:'ground'|'rover';signature:string|null;origin:SurfaceState|null;
  incidentActivationIndex:number;hazards:IncidentState;committed:boolean;fieldworkStopped:boolean;
  phase:SciencePhase;target:ScienceTarget;depthCm:number;program:'survey'|'sample';useGas:boolean;frame:number;remainder:number;paused:boolean;
  transit:'expedition'|'home'|'charge';expedition:number;currentIds:string[];records:ScienceObservation[];accepted:Record<string,ScienceFinding>;attempts:number;assisted:boolean;
  feedback:keyof typeof SCIENCE_LINES|null;commands:ScienceCommand[];
}
export const emptyScience=():ScienceState=>({version:2,model:SCIENCE_MODEL.id,objective:'lunar-ice',samples:[],seismometerSite:null,sensorPlan:'ground',incidentActivationIndex:0,hazards:emptyIncidents(),committed:false,fieldworkStopped:false,signature:null,origin:null,phase:'plan',target:'lookout',depthCm:20,program:'survey',useGas:false,frame:0,remainder:0,paused:false,transit:'expedition',expedition:0,currentIds:[],records:[],accepted:{},attempts:0,assisted:false,feedback:null,commands:[]});
export function freshScience(moon:MoonSession,prep:PreparationSelection):ScienceState{return {...emptyScience(),signature:moon.designSignature,objective:moon.objective??'lunar-ice',model:moon.objective==='lunar-geology'?GEOLOGY_MODEL.id:SCIENCE_MODEL.id,origin:structuredClone(moon.surface),depthCm:moon.objective==='lunar-geology'&&geoCollector(prep)?.id==='geo-scoop-basic'?0:prep.drillDepthCm??20,useGas:prep.sciencePartIds.includes('msolo'),assisted:moon.surface.assisted};}
export const scienceActive=(s:ScienceState)=>['outbound','survey','drilling','analysis','returning','transmitting','recovering','listening'].includes(s.phase);
export const scienceFrameLimit=(phase:SciencePhase)=>phase==='listening'?GEOLOGY_MODEL.listenFrames:phase==='recovering'?INCIDENT_MODEL.recoveryFrames:phase==='survey'?SCIENCE_MODEL.surveyFrames:phase==='drilling'?SCIENCE_MODEL.drillFrames:phase==='analysis'?SCIENCE_MODEL.analysisFrames:SCIENCE_MODEL.transmitFrames;
const iceTask=(s:ScienceState)=>s.phase==='recovering'?{mode:s.hazards.recovery==='calibrate'?'analysis' as const:'standby' as const,ids:s.hazards.recovery==='calibrate'?['nirvss']:[],seconds:s.hazards.recoverySeconds}:s.phase==='survey'?{mode:'analysis' as const,ids:['nss'],seconds:SCIENCE_MODEL.surveySeconds}:s.phase==='drilling'?{mode:'drilling' as const,ids:['trident'],seconds:drillDurationSeconds(s.depthCm)}:s.phase==='analysis'?{mode:'analysis' as const,ids:s.useGas?['nirvss','msolo']:['nirvss'],seconds:SCIENCE_MODEL.analysisSeconds}:{mode:'standby' as const,ids:[],seconds:SCIENCE_MODEL.transmitSeconds};
export const scienceTask=(s:ScienceState,prep?:PreparationSelection)=>s.objective==='lunar-geology'&&prep&&s.phase!=='recovering'?geoTask(s,prep):s.objective==='lunar-geology'&&prep&&s.hazards.recovery==='calibrate'?{mode:'analysis' as const,ids:geoTools(prep).filter(p=>p.scienceFamily==='ir').map(p=>p.id),seconds:s.hazards.recoverySeconds}:iceTask(s);

/** Preview the whole expedition, including science, radio recovery and the crew's home reserves. */
export function sciencePlan(s:ScienceState,moon:MoonSession,prep:PreparationSelection){
  const surface=moon.surface,out=surfacePath(surface.location,s.target,moon,prep),home=surfacePath(s.target,'base',moon,prep),target=surfaceNode(s.target),at={...surface,location:s.target,legs:[],stage:'idle' as const},context={...moon,surface:at};
  const tasks=s.objective==='lunar-geology'?[geoTask(s,prep,'survey'),...(s.program==='sample'?[geoTask(s,prep,'drilling'),geoTask(s,prep,'analysis'),...(geoTools(prep).some(p=>p.scienceFamily==='seismometer')?[geoTask(s,prep,'listening'),{mode:'standby' as const,ids:[],seconds:GEOLOGY_MODEL.deploySeconds}]:[])]:[])]:[{mode:'analysis' as const,ids:['nss'],seconds:SCIENCE_MODEL.surveySeconds},...(s.program==='sample'?[{mode:'drilling' as const,ids:['trident'],seconds:drillDurationSeconds(s.depthCm)},{mode:'analysis' as const,ids:s.useGas?['nirvss','msolo']:['nirvss'],seconds:SCIENCE_MODEL.analysisSeconds}]:[])];
  const operationEnergyWh=tasks.reduce((sum,t)=>sum+energyWh(surfaceTaskPower(context,prep,t.mode,t.ids).loadW,t.seconds),0);
  const operationWh=tasks.reduce((sum,t)=>sum+energyWh(surfaceTaskPower(context,prep,t.mode,t.ids).deficitW,t.seconds),0),operationSeconds=tasks.reduce((a,t)=>a+t.seconds,0),cold=surfaceTaskPower(context,prep,'standby').light===0;
  const seconds=(out?.seconds??0)+operationSeconds+(home?.seconds??0)+SCIENCE_MODEL.transmitSeconds;
  const reserve=moon.resources.capacityWh*.2,required=(out?.wh??Infinity)+operationWh+(home?.wh??Infinity)+reserve+energyWh(surfaceTaskPower({...moon,surface:{...at,location:'base'}},prep,'standby').deficitW,SCIENCE_MODEL.transmitSeconds);
  const cutoff=prep.thermalId==='advanced-thermal'?7200:1200;
  const reason:'terrain'|'thermal'|'reserve'|null=!out||!home?'terrain':surface.coldSeconds+(out.coldSeconds+home.coldSeconds)+(cold?operationSeconds:0)>cutoff?'thermal':tasks.some(t=>!surfaceTaskPower(context,prep,t.mode,t.ids).peakOK)||surface.batteryWh+1e-6<required||!crewTimeOK(surface,moon,seconds)?'reserve':null;
  return {out,home,operationWh,operationEnergyWh,seconds,required,reserve,reason,feasible:!reason,blackout:surfaceLink(target.x,target.z,prep)==='blocked'};
}

function hash(text:string){let n=2166136261;for(const char of text)n=Math.imul(n^char.charCodeAt(0),16777619);return n>>>0;}
/** Hidden, stable authored ground scenario. Only instrument readings enter public evidence. */
function measure(seed:number,target:ScienceTarget,depth:number){
  const n=hash(`${seed}|${target}|soil-v1`),ground=target==='lookout'?'dry':(['water','hydroxyl','dry','mixed'] as const)[n%4],buried=20+(hash(`${seed}|${target}|burial-v1`)%4)*20;
  const reached=depth>=buried,quality=ground==='mixed'?'low' as const:reached||ground==='dry'?'high' as const:'medium' as const;
  return {hydrogen:target==='lookout'?'Weak':ground==='dry'?'Weak':ground==='mixed'?'Medium':'Strong',
    optical:ground==='dry'?'Minerals only':!reached?'Unclear':ground==='water'?'Water signature':ground==='hydroxyl'?'Hydroxyl signature':'Mixed signatures',
    gas:ground==='dry'?'No water gas':!reached?'Unclear':ground==='water'?'Water gas':ground==='hydroxyl'?'No water gas':'Mixed gases',quality};
}
function measurementId(s:ScienceState,instrument:'nss'|'trident'|'nirvss'|'msolo'){const suffix=instrument==='nirvss'&&s.hazards.dust>.3?s.hazards.sensorCalibrated?':calibrated':':dusty':'';return `ice:${s.target}:${instrument}:${instrument==='nss'?'survey':s.depthCm}${suffix}`;}
function record(s:ScienceState,moon:MoonSession,instrument:'nss'|'trident'|'nirvss'|'msolo'):ScienceState{
  const depth=instrument==='nss'?null:s.depthCm,id=measurementId(s,instrument);
  if(s.records.some(r=>r.id===id))return {...s,currentIds:[...new Set([...s.currentIds,id])]};
  const reading=measure(moon.scenarioSeed,s.target,s.depthCm),signal=instrument==='nss'?reading.hydrogen:instrument==='nirvss'?reading.optical:instrument==='msolo'?reading.gas:'Cuttings exposed';
  const cap=instrument==='nirvss'?incidentEffects({...moon,science:s}).opticalQuality:null;
  const quality=instrument==='nss'?'medium':instrument==='trident'?'high':cap==='low'?'low':cap==='medium'&&reading.quality==='high'?'medium':reading.quality;
  // Points reflect new useful measurements, including negatives; never buy/depth/retry bonuses.
  const already=s.records.some(r=>r.locationId===s.target&&r.instrumentId===instrument),points=already?0:instrument==='nss'?4:instrument==='nirvss'?8:instrument==='msolo'?6:0;
  const observation:ScienceObservation={id,objective:'lunar-ice',locationId:s.target,instrumentId:instrument,depthCm:depth,kind:instrument==='nss'?'hydrogen-clue':instrument==='trident'?'subsurface':'water-evidence',confidence:quality==='low'?'low':instrument==='nss'?'low':quality==='high'?'high':'medium',points,transmitted:false,quality,signal,missionSeconds:surfaceResources(moon,moon.surface).elapsedMissionSeconds,sampleId:depth===null?null:`cuttings:${s.target}:${depth}`,depthRangeCm:depth===null?null:[Math.max(0,depth-10),depth]};
  return {...s,records:[...s.records,observation],currentIds:[...s.currentIds,id]};
}
export function currentEvidence(s:ScienceState){return s.records.filter(r=>s.currentIds.includes(r.id));}
export function expectedFinding(records:readonly ScienceObservation[]):ScienceFinding{
  const optical=records.find(r=>r.instrumentId==='nirvss'),gas=records.find(r=>r.instrumentId==='msolo');
  if(optical?.signal==='Water signature'&&optical.quality!=='low'&&gas?.signal==='Water gas'&&gas.quality!=='low')return 'confirmed';
  if(optical?.signal==='Minerals only'&&optical.quality==='high'&&(!gas||gas.signal==='No water gas'&&gas.quality==='high'))return 'negative';
  return 'inconclusive';
}
export function scienceResult(s:ScienceState){return s.objective==='lunar-geology'?geologyFinding(currentEvidence(s)):expectedFinding(currentEvidence(s));}
export const sciencePoints=(s:ScienceState)=>s.records.reduce((a,r)=>a+r.points,0);
export const deliveredPoints=(s:ScienceState)=>s.records.filter(r=>r.transmitted).reduce((a,r)=>a+r.points,0);
export function scienceComplete(s:ScienceState,surface:SurfaceState){return s.phase==='ready'&&s.signature!==null&&surface.location==='base'&&surface.stage==='idle'&&surface.crewSheltered&&!s.hazards.pending&&!s.hazards.recovery&&s.currentIds.every(id=>s.records.some(r=>r.id===id&&r.transmitted))&&(s.fieldworkStopped||s.records.some(r=>r.transmitted&&(s.objective==='lunar-geology'?r.kind==='mineral-evidence':r.instrumentId==='nirvss'))&&Object.keys(s.accepted).length>0);}
function key(s:ScienceState){return `${s.target}:${s.depthCm}`;}
function returnAfterWork(s:ScienceState,surface:SurfaceState,moon:MoonSession,prep:PreparationSelection){
  const home=surfacePath(surface.location,'base',moon,prep);
  if(!home)return {science:{...s,phase:'failed' as const,feedback:'terrain' as const},surface};
  return {science:{...s,phase:home.legs.length?'returning' as const:'report' as const,transit:'expedition' as const,frame:0},surface:beginSurfaceTrip(surface,home.legs)};
}
function advancePair(s:ScienceState,surface:SurfaceState,frames:number,moon:MoonSession,prep:PreparationSelection){
  let science={...s},vehicle={...surface};
  for(let i=0;i<frames;i++){
    if(science.paused||!scienceActive(science))break;
    const context={...moon,surface:vehicle,science};
    science={...science,hazards:updateIncidents(science.hazards,vehicle,surfaceLink(surfacePosition(vehicle).x,surfacePosition(vehicle).z,prep)==='connected')};
    if(science.hazards.pending)break;
    if(['outbound','returning'].includes(science.phase)){
      if(vehicle.stage==='driving'||vehicle.stage==='charging')vehicle=reduceSurface({...vehicle,paused:false,pace:'eco'},{type:'surface-tick',seconds:SCIENCE_MODEL.step},context,prep);
      if(vehicle.stage==='idle')science={...science,phase:science.phase==='outbound'?'survey':science.fieldworkStopped?(science.currentIds.length&&science.currentIds.some(id=>science.records.some(r=>r.id===id&&!r.transmitted))?'report':'ready'):science.transit==='charge'?'plan':science.transit==='home'&&science.currentIds.length&&science.currentIds.every(id=>science.records.some(r=>r.id===id&&r.transmitted))?'ready':science.currentIds.length?'report':'plan',frame:0,feedback:null};
    }else{
      if(science.phase==='recovering'){const recovered=advanceRecovery(science,vehicle,context,prep);science=recovered.science;vehicle=recovered.surface;}else{
      const task=scienceTask(science,prep),limit=scienceFrameLimit(science.phase);
      vehicle=spendSurfaceTask(vehicle,context,prep,task.seconds/limit,task.mode,task.ids);science.frame++;
      if(science.frame>=limit&&vehicle.stage!=='failed'){
        if(science.phase==='survey'){
          science=science.objective==='lunar-geology'?geoSurvey(science,{...moon,surface:vehicle},prep):record(science,{...moon,surface:vehicle},'nss');
          if(science.program==='sample')science={...science,phase:'drilling',frame:0};
          else ({science,surface:vehicle}=returnAfterWork(science,vehicle,moon,prep));
        }else if(science.phase==='drilling')science={...(science.objective==='lunar-geology'?geoCollect(science,prep):record(science,{...moon,surface:vehicle},'trident')),phase:'analysis',frame:0};
        else if(science.phase==='analysis'){
          if(science.objective==='lunar-geology'){science=geoAnalyze(science,{...moon,surface:vehicle},prep);if(geoTools(prep).some(p=>p.scienceFamily==='seismometer')){const p=surfacePosition(vehicle);if(surfaceLink(p.x,p.z,prep)==='blocked'&&science.sensorPlan==='ground'){vehicle=spendSurfaceTask(vehicle,{...moon,surface:vehicle,science},prep,GEOLOGY_MODEL.deploySeconds,'standby');science={...science,seismometerSite:science.target,phase:'listening',frame:0,feedback:'listening'};}else if(surfaceLink(p.x,p.z,prep)==='blocked'){({science,surface:vehicle}=returnAfterWork({...science,feedback:'sensorWrong'},vehicle,moon,prep));}else science={...science,phase:'sensor-site',frame:0,feedback:'sensorSite'};}else ({science,surface:vehicle}=returnAfterWork(science,vehicle,moon,prep));}
          else {science=record(science,{...moon,surface:vehicle},'nirvss');if(science.useGas)science=record(science,{...moon,surface:vehicle},'msolo');({science,surface:vehicle}=returnAfterWork(science,vehicle,moon,prep));}
        }else if(science.phase==='listening'){science=geoListen(science,{...moon,surface:vehicle},prep);({science,surface:vehicle}=returnAfterWork(science,vehicle,moon,prep));
        }else if(science.phase==='transmitting'){science={...science,phase:'ready',frame:0,records:science.records.map(r=>science.committed||science.currentIds.includes(r.id)?{...r,transmitted:true}:r),feedback:'delivered',hazards:science.committed?{...science.hazards,dataArchived:true}:science.hazards};}
      }
    }
    }
    if(vehicle.stage==='idle'&&vehicle.location==='base'&&science.hazards.autoWaitAtBase){
      const cleared={...science,hazards:{...science.hazards,autoWaitAtBase:false}};
      if(science.hazards.evaBlocked&&science.hazards.radiationUntil!==null){const result=startRecovery(cleared,vehicle,'wait',Math.max(1,science.hazards.radiationUntil-vehicle.elapsedSeconds),{...moon,science:cleared,surface:vehicle},prep);science=result.science;vehicle=result.surface;}else science=cleared;
    }
    if(vehicle.stage!=='failed')science=triggerIncident(science,vehicle,{...moon,surface:vehicle,science},prep);
    if(science.hazards.pending){science={...science,paused:true};break;}
    if(vehicle.stage==='failed'){science={...science,phase:'failed',paused:true,feedback:'failed'};break;}
  }
  return {science,surface:vehicle};
}
function apply(s:ScienceState,surface:SurfaceState,c:ScienceCommand,moon:MoonSession,prep:PreparationSelection):{science:ScienceState;surface:SurfaceState}{
  const same={science:s,surface},linked=surfaceLink(surfacePosition(surface).x,surfacePosition(surface).z,prep)==='connected';
  switch(c.type){
    case 'sensor-plan':return s.phase==='plan'&&s.objective==='lunar-geology'?{...same,science:{...s,sensorPlan:c.placement}}:same;
    case 'place-sensor':{
      if(s.objective!=='lunar-geology'||s.phase!=='sensor-site'||!geoTools(prep).some(p=>p.scienceFamily==='seismometer'))return same;
      if(!linked)return {...same,science:{...s,feedback:'noLink'}};
      if(c.placement!=='ground')return {...same,science:{...s,feedback:'sensorWrong'}};
      const vehicle=spendSurfaceTask(surface,{...moon,surface,science:s},prep,GEOLOGY_MODEL.deploySeconds,'standby');
      if(vehicle.stage==='failed')return {surface:vehicle,science:{...s,phase:'failed',feedback:'failed'}};
      return {surface:vehicle,science:{...s,seismometerSite:s.target,phase:'listening',frame:0,feedback:'listening',paused:false}};
    }
    case 'target':return s.phase==='plan'?{...same,science:{...s,target:c.target,feedback:null}}:same;
    case 'depth':return s.phase==='plan'&&(s.objective!=='lunar-geology'||!!geoCollector(prep)?.maxDepthCm&&c.cm<=geoCollector(prep)!.maxDepthCm!)?{...same,science:{...s,depthCm:c.cm,feedback:null}}:same;
    case 'program':return s.phase==='plan'?{...same,science:{...s,program:c.program,feedback:null}}:same;
    case 'gas':return s.phase==='plan'&&prep.sciencePartIds.includes('msolo')?{...same,science:{...s,useGas:c.enabled,hazards:{...s.hazards,shedGas:!c.enabled}}}:same;
    case 'incident':return applyIncident(s,surface,c.action,moon,prep);
    case 'commit':return scienceComplete(s,surface)?{...same,science:{...s,committed:true}}:same;
    case 'secure':{
      if(!s.committed||s.phase!=='ready'||surface.location!=='base'||surface.stage!=='idle'||s.hazards.pending||s.hazards.recovery||s.hazards.evaBlocked)return same;
      if(c.item==='samples'){if(s.objective!=='lunar-geology'||!s.samples.length||s.samples.every(p=>p.stowed))return same;const vehicle=spendSurfaceTask(surface,{...moon,surface,science:s},prep,60,'standby');if(vehicle.stage==='failed')return same;return {surface:vehicle,science:{...s,samples:s.samples.map(p=>({...p,stowed:true}))}};}
      if(c.item==='data'){if(s.hazards.dataArchived)return same;return {...same,science:{...s,phase:'transmitting',frame:0,paused:false,hazards:{...s.hazards,feedback:'archived'}}};}
      if(c.item==='crew'&&!surface.crewSheltered||c.item==='rover'&&s.hazards.roverParked||c.item==='crew'&&s.hazards.crewChecked)return same;
      const vehicle=spendSurfaceTask(surface,{...moon,surface,science:s},prep,60,'standby');
      if(vehicle.stage==='failed')return {surface:vehicle,science:{...s,phase:'failed',feedback:'failed'}};
      return {surface:vehicle,science:{...s,hazards:{...s.hazards,roverParked:c.item==='rover'||s.hazards.roverParked,crewChecked:c.item==='crew'||s.hazards.crewChecked,feedback:c.item==='rover'?'parked':'crew'}}};
    }
    case 'start':{
      if(s.phase!=='plan'||!linked||surface.stage!=='idle'||s.committed||s.fieldworkStopped)return same;
      const duplicate=s.objective==='lunar-geology'?(s.program==='survey'?geoTools(prep).filter(p=>['camera','gpr'].includes(p.scienceFamily)):geoTools(prep).filter(p=>['ir','xrf','xrd','seismometer'].includes(p.scienceFamily))).every(p=>s.records.some(r=>r.id===geoMeasurementId(s,p.id))):s.records.some(r=>r.id===measurementId(s,s.program==='survey'?'nss':'nirvss'))&&(s.program==='survey'||!s.useGas||s.records.some(r=>r.id===`ice:${s.target}:msolo:${s.depthCm}`));
      if(duplicate)return {...same,science:{...s,feedback:'duplicate'}};
      const plan=sciencePlan(s,{...moon,surface,science:s},prep);if(!plan.feasible){const hazards=plan.reason==='reserve'&&s.commands.length>=s.incidentActivationIndex?openIncident(s.hazards,'power','Full expedition would spend the return reserve.',surface):s.hazards;return {...same,science:{...s,feedback:plan.reason,hazards}};}
      return {science:{...s,phase:plan.out!.legs.length?'outbound':'survey',frame:0,currentIds:[],expedition:s.expedition+1,transit:'expedition',paused:false,feedback:null},surface:{...beginSurfaceTrip(surface,plan.out!.legs),pace:'eco'}};
    }
    case 'claim':{
      if(s.phase!=='report'||!linked)return same;const records=currentEvidence(s);
      if(!(s.objective==='lunar-geology'?geoAnalytical(records):records.some(r=>r.instrumentId==='nirvss')))return {...same,science:{...s,feedback:'sampleFirst'}};
      return c.finding===(s.objective==='lunar-geology'?geologyFinding(records):expectedFinding(records))?{...same,science:{...s,accepted:{...s.accepted,[key(s)]:c.finding},records:s.records.map(r=>s.currentIds.includes(r.id)?(s.objective==='lunar-geology'?r.kind==='mineral-evidence'?{...r,classification:c.finding as GeoFinding}:r:{...r,result:c.finding as 'confirmed'|'inconclusive'|'negative'}):r),feedback:c.finding==='inconclusive'?'inconclusive':s.objective==='lunar-geology'||c.finding==='confirmed'?'confirm':'negative'}}:{...same,science:{...s,feedback:'wrong'}};
    }
    case 'transmit':{
      if(!['report','ready'].includes(s.phase)||!linked||surface.stage!=='idle')return {...same,science:{...s,feedback:'noLink'}};
      if(!s.fieldworkStopped&&!s.committed&&s.program==='sample'&&!s.accepted[key(s)])return {...same,science:{...s,feedback:'report'}};
      if(!s.committed&&s.currentIds.every(id=>s.records.some(r=>r.id===id&&r.transmitted)))return same;
      const p=surfaceTaskPower({...moon,surface,science:s},prep,'standby');if(surface.batteryWh-energyWh(p.deficitW,SCIENCE_MODEL.transmitSeconds)<moon.resources.capacityWh*.2||!crewTimeOK(surface,moon,SCIENCE_MODEL.transmitSeconds))return {...same,science:{...s,feedback:'reserve'}};
      return {...same,science:{...s,phase:'transmitting',frame:0,paused:false,feedback:null}};
    }
    case 'new-trip':return ['report','ready'].includes(s.phase)&&linked?{...same,science:{...s,phase:'plan',program:s.program==='survey'?'sample':s.program,currentIds:[],feedback:null}}:same;
    case 'home':{
      if(s.phase==='sensor-site'&&linked)return returnAfterWork(s,surface,moon,prep);
      if(!['plan','report','ready'].includes(s.phase)||!linked||surface.location==='base')return same;
      const home=surfacePath(surface.location,'base',moon,prep);if(!home||surface.batteryWh<home.wh+moon.resources.capacityWh*.2||!crewTimeOK(surface,moon,home.seconds))return {...same,science:{...s,feedback:'reserve'}};
      return {science:{...s,phase:'returning',transit:'home',paused:false,frame:0},surface:beginSurfaceTrip(surface,home.legs)};
    }
    case 'charge':{
      if(s.phase!=='plan'||!linked)return same;const vehicle=reduceSurface(surface,{type:'surface-charge'},{...moon,science:s},prep);
      return vehicle.stage==='charging'?{science:{...s,phase:'returning',transit:'charge',paused:false,feedback:null},surface:vehicle}:{...same,science:{...s,feedback:vehicle.feedback==='dark'?'thermal':'reserve'}};
    }
    case 'retry':{
      if(s.phase!=='failed'||!s.origin)return same;
      // Replay the successful prefix before this expedition; keep evidence and prior resource expenditure.
      const cut=s.commands.findLastIndex(command=>['start','charge','home'].includes(command.type));
      if(cut<0)return same;const restored=replayScience(s.commands.slice(0,cut),s.origin,moon,prep,Math.min(s.incidentActivationIndex,cut));
      return {...restored,science:{...restored.science,attempts:s.attempts+1,assisted:true,phase:'plan',paused:false,feedback:null}};
    }
    case 'hint':return {...same,science:{...s,assisted:true}};
    case 'advance':return advancePair(s,surface,c.frames,moon,prep);
  }
}
export type ScienceEvent={type:'science-sensor-plan';placement:'ground'|'rover'}|{type:'science-place-sensor';placement:'ground'|'rover'}|{type:'science-incident';action:IncidentAction}|{type:'science-commit'}|{type:'science-secure';item:'rover'|'data'|'crew'|'samples'}|{type:'science-design-retry'}|{type:'science-target';target:ScienceTarget}|{type:'science-depth';cm:number}|{type:'science-program';program:'survey'|'sample'}|{type:'science-gas';enabled:boolean}|{type:'science-start'}|{type:'science-claim';finding:ScienceFinding}|{type:'science-transmit'}|{type:'science-new-trip'}|{type:'science-home'}|{type:'science-charge'}|{type:'science-retry'}|{type:'science-hint'}|{type:'science-tick';seconds:number}|{type:'science-pause'}|{type:'science-resume'};
function validCommand(c:ScienceCommand){return c&&typeof c==='object'&&['sensor-plan','place-sensor','incident','commit','secure','target','depth','program','gas','start','claim','transmit','new-trip','home','charge','retry','hint','advance'].includes(c.type)&&
  ((c.type!=='place-sensor'&&c.type!=='sensor-plan')||['ground','rover'].includes(c.placement))&&(c.type!=='incident'||INCIDENT_ACTIONS.includes(c.action))&&(c.type!=='secure'||['rover','data','crew','samples'].includes(c.item))&&(c.type!=='target'||SCIENCE_TARGETS.some(t=>t.id===c.target))&&(c.type!=='depth'||Number.isInteger(c.cm)&&c.cm>=10&&c.cm<=100&&c.cm%10===0)&&(c.type!=='program'||['survey','sample'].includes(c.program))&&(c.type!=='gas'||typeof c.enabled==='boolean')&&(c.type!=='claim'||['confirmed','negative','inconclusive','anorthosite','basalt','breccia'].includes(c.finding))&&(c.type!=='advance'||Number.isInteger(c.frames)&&c.frames>0&&c.frames<=30000);}
export function reduceScience(s:ScienceState,surface:SurfaceState,e:ScienceEvent,moon:MoonSession,prep:PreparationSelection){
  if(e.type==='science-design-retry')return {science:s,surface};
  if(e.type==='science-resume'&&s.hazards.pending)return {science:s,surface};
  if(s.hazards.pending&&!['science-incident','science-pause','science-hint'].includes(e.type))return {science:s,surface};
  if(e.type==='science-pause'||e.type==='science-resume')return {science:scienceActive(s)?{...s,paused:e.type==='science-pause'}:s,surface};
  let c:ScienceCommand,remainder=s.remainder;
  if(e.type==='science-tick'){
    if(s.paused||!scienceActive(s)||!Number.isFinite(e.seconds)||e.seconds<=0)return {science:s,surface};
    const seconds=s.remainder+Math.min(.25,e.seconds),frames=Math.floor((seconds+1e-9)/SCIENCE_MODEL.step);remainder=Math.max(0,seconds-frames*SCIENCE_MODEL.step);
    if(!frames)return {science:{...s,remainder},surface};c={type:'advance',frames};
  }else c={...e,type:e.type.replace('science-','')} as ScienceCommand;
  if(!validCommand(c)||s.commands.length>=1900)return {science:s,surface};
  const next=finishCommand(s,apply(s,surface,c,{...moon,science:s},prep),c,moon,prep);
  if(next.science===s&&next.surface===surface)return next;
  // Retry drops only its failed attempt receipts; retained observations cannot be rescored.
  const commands=c.type==='retry'?[...next.science.commands]:[...s.commands],last=commands.at(-1);
  if(c.type==='advance'&&last?.type==='advance'&&!(s.incidentActivationIndex>0&&s.commands.length===s.incidentActivationIndex))commands[commands.length-1]={type:'advance',frames:last.frames+c.frames};else if(c.type!=='retry')commands.push(c);
  return {...next,science:{...next.science,commands,remainder}};
}
function replayScience(commands:readonly ScienceCommand[],origin:SurfaceState,moon:MoonSession,prep:PreparationSelection,activation=0){
  let science={...freshScience({...moon,surface:origin},prep),incidentActivationIndex:activation},surface=origin;
  for(const c of commands){const next=finishCommand(science,apply({...science,paused:false},surface,c,{...moon,surface,science},prep),c,moon,prep);science={...next.science,commands:[...science.commands,c]};surface=next.surface;}
  return {science,surface};
}
export function restoreScience(raw:unknown,moon:MoonSession,prep:PreparationSelection){
  const clean={science:emptyScience(),surface:moon.surface};if(!raw||typeof raw!=='object'||!moon.objective)return clean;const saved=raw as ScienceState;
  const legacy=moon.objective==='lunar-ice'&&(saved.version as number)===1&&(saved.model as string)==='ice-evidence-v1';
  if(!legacy&&(saved.version!==2||saved.model!==(moon.objective==='lunar-geology'?GEOLOGY_MODEL.id:SCIENCE_MODEL.id))||saved.signature!==moon.designSignature||!saved.origin||!Array.isArray(saved.commands)||saved.commands.length>1900)return clean;
  const origin=restoreSurface(saved.origin,moon,prep);if(!surfaceReady(origin,moon,prep))return clean;
  let frames=0;for(const c of saved.commands){if(!validCommand(c)||c.type==='retry'||c.type==='advance'&&(frames+=c.frames)>30000)return clean;}
  const activation=legacy?saved.commands.length:Number.isInteger(saved.incidentActivationIndex)&&saved.incidentActivationIndex>=0&&saved.incidentActivationIndex<=saved.commands.length?saved.incidentActivationIndex:0;
  const pair=replayScience(saved.commands,origin,moon,prep,activation);
  return {...pair,science:{...pair.science,paused:scienceActive(pair.science),remainder:0,assisted:pair.science.assisted||saved.assisted===true,attempts:Number.isInteger(saved.attempts)&&saved.attempts>=0?saved.attempts:0}};
}

const INCIDENT_ACTIONS:readonly IncidentAction[]=['continue-dust','return-clean','brush','calibrate','follow-plan','boost-radio','shorter','shed-gas','closer','charge','safe-return','shelter-wait','robot-only','eva'];
/** Remaining route/task forecast changes when panels become dusty; it never invents charging. */
export function remainingScienceWh(s:ScienceState,surface:SurfaceState,moon:MoonSession,prep:PreparationSelection){
  if(s.phase==='plan')return sciencePlan(s,{...moon,surface,science:s},prep).required;
  const context={...moon,surface,science:s};let wh=0;
  if(surface.stage==='driving')surface.legs.forEach((l,i)=>{wh+=legProfile(l,context,prep,'eco').wh*(i===0?1-surface.legFrame/SURFACE_MODEL.legFrames:1);});
  if(!['returning','ready','report','transmitting'].includes(s.phase)){
    const at={...surface,stage:'idle' as const,location:s.target,legs:[]},there={...context,surface:at},home=surfacePath(s.target,'base',there,prep);wh+=home?.wh??Infinity;
    const add=(mode:'analysis'|'drilling',ids:string[],seconds:number)=>{wh+=energyWh(surfaceTaskPower(there,prep,mode,ids).deficitW,seconds);};
    if(s.objective==='lunar-geology'){
      for(const phase of ['survey','drilling','analysis','listening'] as const){
        const order=['outbound','survey','drilling','analysis','sensor-site','listening'],current=order.indexOf(s.phase),index=order.indexOf(phase);
        if(index<current||phase!=='survey'&&s.program!=='sample'||phase==='listening'&&!geoTools(prep).some(p=>p.scienceFamily==='seismometer'))continue;
        const task=geoTask(s,prep,phase);add(task.mode==='standby'?'analysis':task.mode,task.ids,task.seconds*(s.phase===phase?1-s.frame/scienceFrameLimit(phase):1));
      }
      if(s.program==='sample'&&geoTools(prep).some(p=>p.scienceFamily==='seismometer')&&s.phase!=='listening')add('analysis',[],GEOLOGY_MODEL.deploySeconds);
    }else {
    if(s.phase==='outbound'||s.phase==='survey')add('analysis',['nss'],SCIENCE_MODEL.surveySeconds*(s.phase==='survey'?1-s.frame/SCIENCE_MODEL.surveyFrames:1));
    if(s.program==='sample'&&['outbound','survey','drilling'].includes(s.phase))add('drilling',['trident'],drillDurationSeconds(s.depthCm)*(s.phase==='drilling'?1-s.frame/SCIENCE_MODEL.drillFrames:1));
    if(s.program==='sample')add('analysis',s.useGas?['nirvss','msolo']:['nirvss'],SCIENCE_MODEL.analysisSeconds*(s.phase==='analysis'?1-s.frame/SCIENCE_MODEL.analysisFrames:1));
    }
  }
  return wh+moon.resources.capacityWh*.2;
}
function triggerIncident(s:ScienceState,surface:SurfaceState,moon:MoonSession,prep:PreparationSelection){
  if(s.commands.length<s.incidentActivationIndex||s.hazards.pending||s.committed||s.fieldworkStopped||s.hazards.log.length>=INCIDENT_MODEL.maxEvents||!scienceActive(s)||s.phase==='recovering')return s;
  const primary=primaryIncident(moon.scenarioSeed),point=surfacePosition(surface),linked=surfaceLink(point.x,point.z,prep)==='connected';
  let kind:IncidentKind|null=null,reason='';
  if(['outbound','survey','drilling','analysis'].includes(s.phase)&&surface.batteryWh+1e-6<remainingScienceWh(s,surface,moon,prep)+2){kind='power';reason='Projected remaining tasks and return would approach the protected energy reserve.';}
  else if(primary==='radiation'&&surface.elapsedSeconds-(s.origin?.elapsedSeconds??0)>=600){kind='radiation';reason='Saved space-weather scenario reached its virtual-time threshold.';}
  else if(primary==='dust'&&s.phase==='drilling'&&s.frame>=8){kind='dust';reason='Excavation disturbed local regolith; dust adhered to optical tools and panels.';}
  else if(primary==='radio'&&s.phase==='outbound'&&!linked){kind='radio';reason='Range or ridge line-of-sight geometry blocks the selected rover radio.';}
  return kind?{...s,hazards:openIncident(s.hazards,kind,reason,surface)}:s;
}
/** Reverse from the exact current fraction, then traverse a real available path to Base. */
function stopExpedition(s:ScienceState,surface:SurfaceState,moon:MoonSession,prep:PreparationSelection,finish=false){
  const context={...moon,surface,science:s},l=surface.stage==='driving'?surface.legs[0]:null;
  const home=surfacePath(l?l.from:surface.location,'base',context,prep);
  if(!home)return {science:{...s,hazards:{...s.hazards,feedback:'unsafe' as const}},surface};
  const vehicle=l&&surface.legFrame>0?{...beginSurfaceTrip(surface,[{...l,from:l.to,to:l.from},...home.legs]),legFrame:SURFACE_MODEL.legFrames-surface.legFrame}:beginSurfaceTrip(surface,home.legs);
  const records=s.currentIds.map(id=>s.records.find(r=>r.id===id)).filter(Boolean),hasSample=records.some(r=>s.objective==='lunar-geology'?r?.kind==='mineral-evidence':r?.instrumentId==='nirvss');
  return {science:{...s,phase:vehicle.stage==='driving'?'returning' as const:records.length?'report' as const:finish?'ready' as const:'plan' as const,transit:'home' as const,fieldworkStopped:s.fieldworkStopped||finish,program:hasSample?s.program:'survey' as const,frame:0,paused:false,hazards:{...s.hazards,feedback:finish?'partial' as const:'accepted' as const}},surface:vehicle};
}
function startRecovery(s:ScienceState,surface:SurfaceState,kind:'brush'|'calibrate'|'wait',seconds:number,moon:MoonSession,prep:PreparationSelection){
  const context={...moon,surface,science:s},task=surfaceTaskPower(context,prep,kind==='calibrate'?'analysis':'standby',kind==='calibrate'?s.objective==='lunar-geology'?geoTools(prep).filter(p=>p.scienceFamily==='ir').map(p=>p.id):['nirvss']:[]);
  const home=surfacePath(surface.location,'base',context,prep);
  if(!home||!crewTimeOK(surface,moon,seconds+home.seconds)||surface.batteryWh-energyWh(task.deficitW,seconds)<home.wh+moon.resources.capacityWh*.2||task.light===0&&surface.coldSeconds+seconds+home.coldSeconds>(prep.thermalId==='advanced-thermal'?7200:1200))return {science:{...s,hazards:{...s.hazards,feedback:'unsafe' as const}},surface};
  const h=s.hazards,base=chooseIncident(h,h.pending??(kind==='wait'?'radiation':'dust'),kind==='brush'?'brush':kind==='calibrate'?'calibrate':'shelter-wait',surface.elapsedSeconds);
  return {science:{...s,phase:'recovering' as const,frame:0,paused:false,hazards:{...base,roverParked:kind==='brush'?false:base.roverParked,crewChecked:kind==='brush'?false:base.crewChecked,pending:null,recovery:kind,recoveryFrame:0,recoverySeconds:seconds,resumePhase:s.phase,resumeFrame:s.frame,feedback:kind==='brush'?'brush' as const:kind==='calibrate'?'calibration' as const:'wait' as const}},surface:kind==='brush'?{...surface,crewSheltered:false}:surface};
}
function applyIncident(s:ScienceState,surface:SurfaceState,action:IncidentAction,moon:MoonSession,prep:PreparationSelection):{science:ScienceState;surface:SurfaceState}{
  const h=s.hazards,kind=h.pending,context={...moon,surface,science:s},point=surfacePosition(surface),linked=surfaceLink(point.x,point.z,prep)==='connected',same={science:s,surface};
  const feedback=(key:keyof typeof import('./incidentCopy.ts').INCIDENT_LINES)=>({...same,science:{...s,hazards:{...h,feedback:key}}});
  if(action==='eva')return feedback(h.evaBlocked?'evaBlocked':'kit');
  if(action==='boost-radio')return feedback('radioBlocked');
  if(action==='brush'){
    if(!careKitAvailable(h,prep))return feedback('kit');if(h.evaBlocked)return feedback('evaBlocked');
    if(surface.location!=='base'||surface.stage!=='idle'||surface.evaSeconds+INCIDENT_MODEL.brushSeconds>SURFACE_MODEL.evaLimitSeconds)return feedback('unsafe');
    return startRecovery(s,surface,'brush',INCIDENT_MODEL.brushSeconds,moon,prep);
  }
  if(action==='calibrate'){
    if(!linked)return feedback('remote');if(moon.crew.support!=='systems-engineer'||!(s.objective==='lunar-geology'?geoTools(prep).some(p=>p.scienceFamily==='ir'):prep.sciencePartIds.includes('nirvss'))||!h.dust||h.sensorCalibrated)return feedback('kit');
    return startRecovery(s,surface,'calibrate',INCIDENT_MODEL.calibrationSeconds,moon,prep);
  }
  if(action==='shelter-wait'){
    if(!h.evaBlocked||h.radiationUntil===null)return same;
    const chosen={...s,hazards:kind?chooseIncident(h,'radiation',action,surface.elapsedSeconds):h};
    if(surface.location!=='base'||surface.stage!=='idle'){const back=stopExpedition(chosen,surface,moon,prep);return {...back,science:{...back.science,hazards:{...back.science.hazards,autoWaitAtBase:true,feedback:'wait'}}};}
    return startRecovery(s,surface,'wait',Math.max(1,h.radiationUntil-surface.elapsedSeconds),moon,prep);
  }
  if(!kind)return same;
  const chosen={...s,hazards:chooseIncident(h,kind,action,surface.elapsedSeconds),paused:false};
  if(action==='safe-return')return stopExpedition(chosen,surface,moon,prep,true);
  if(kind==='dust'){
    if(action==='continue-dust')return {science:chosen,surface};
    if(action==='return-clean')return stopExpedition(chosen,surface,moon,prep);
  }
  if(kind==='radio'&&action==='follow-plan')return {science:chosen,surface};
  if(kind==='radiation'&&action==='robot-only')return {...same,science:{...chosen,hazards:{...chosen.hazards,evaBlocked:true}}};
  if(kind==='power'){
    if(action==='shed-gas'&&s.useGas&&s.phase!=='analysis')return {...same,science:{...chosen,useGas:false,hazards:{...chosen.hazards,shedGas:true,feedback:'shed'}}};
    if(action==='shorter'&&s.phase==='plan'&&s.depthCm>20)return {...same,science:{...chosen,depthCm:20,hazards:{...chosen.hazards,feedback:'shorter'}}};
    if(action==='closer'&&s.phase==='plan')return {...same,science:{...chosen,target:'lookout',hazards:{...chosen.hazards,feedback:'closer'}}};
    if(action==='charge'&&s.phase==='plan'&&linked){const vehicle=reduceSurface(surface,{type:'surface-charge'},context,prep);if(vehicle.stage==='charging')return {science:{...chosen,phase:'returning' as const,transit:'charge' as const},surface:vehicle};}
  }
  return feedback('unsafe');
}
function advanceRecovery(s:ScienceState,surface:SurfaceState,moon:MoonSession,prep:PreparationSelection){
  const h=s.hazards,seconds=h.recoverySeconds/INCIDENT_MODEL.recoveryFrames,kind=h.recovery;
  let vehicle=spendSurfaceTask(surface,{...moon,surface,science:s},prep,seconds,kind==='calibrate'?'analysis':'standby',kind==='calibrate'?s.objective==='lunar-geology'?geoTools(prep).filter(p=>p.scienceFamily==='ir').map(p=>p.id):['nirvss']:[]);
  if(kind==='brush')vehicle={...vehicle,evaSeconds:vehicle.evaSeconds+seconds};
  let science={...s,frame:s.frame+1,hazards:{...h,recoveryFrame:h.recoveryFrame+1}};
  if(science.frame>=INCIDENT_MODEL.recoveryFrames&&vehicle.stage!=='failed'){
    const time=vehicle.elapsedSeconds;
    let hazards:IncidentState={...h,recovery:null,recoveryFrame:0,resumePhase:null,resumeFrame:0};
    if(kind==='brush')hazards={...resolveIncident(hazards,'dust',time),dust:INCIDENT_MODEL.cleanedDust,kitUsed:true,feedback:'cleaned'};
    else if(kind==='calibrate')hazards={...resolveIncident(hazards,'dust',time),sensorCalibrated:true,feedback:'calibrated'};
    else hazards={...resolveIncident(hazards,'radiation',time),radiationUntil:null,evaBlocked:false,feedback:'clear'};
    science={...science,phase:(h.resumePhase??'ready') as SciencePhase,frame:h.resumeFrame,hazards};vehicle={...vehicle,crewSheltered:true};
  }
  return {science,surface:vehicle};
}

/** The same post-command safety reconciliation runs in play and saved-receipt replay. */
function finishCommand(previous:ScienceState,pair:{science:ScienceState;surface:SurfaceState},command:ScienceCommand,moon:MoonSession,prep:PreparationSelection){
  let next=pair;const required=()=>remainingScienceWh(next.science,next.surface,{...moon,science:next.science,surface:next.surface},prep)+2;
  if(command.type==='incident'&&previous.hazards.pending==='power'&&!['safe-return','charge'].includes(command.action)&&next.science.hazards.pending===null&&next.surface.batteryWh<required())next={...next,science:{...next.science,paused:true,hazards:{...next.science.hazards,pending:'power',feedback:'unsafe',log:next.science.hazards.log.map(r=>r.id==='power'?{...r,status:'awaiting' as const,resolvedAtSeconds:null}:r)}}};
  if(next.science.hazards.log.some(r=>r.id==='power'&&r.status==='mitigated')&&next.surface.batteryWh>=required())next={...next,science:{...next.science,hazards:resolveIncident(next.science.hazards,'power',next.surface.elapsedSeconds)}};
  return next;
}
