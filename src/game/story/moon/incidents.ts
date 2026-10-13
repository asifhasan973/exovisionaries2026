import type {MoonSession} from './session.ts';
import type {SurfaceState} from './surface.ts';
import type {PreparationSelection} from '../design.ts';
export type IncidentKind='dust'|'radio'|'power'|'radiation';
export type IncidentAction='continue-dust'|'return-clean'|'brush'|'calibrate'|'follow-plan'|'boost-radio'|'shorter'|'shed-gas'|'closer'|'charge'|'safe-return'|'shelter-wait'|'robot-only'|'eva';
export interface IncidentRecord {id:IncidentKind;kind:IncidentKind;status:'awaiting'|'mitigated'|'resolved';action:IncidentAction|null;actions:{action:IncidentAction;atSeconds:number}[];reason:string;atSeconds:number;resolvedAtSeconds:number|null}
export interface IncidentState {
  version:1;pending:IncidentKind|null;log:IncidentRecord[];dust:number;sensorCalibrated:boolean;kitUsed:boolean;
  radiationUntil:number|null;evaBlocked:boolean;autoWaitAtBase:boolean;shedGas:boolean;feedback:keyof typeof import('./incidentCopy.ts').INCIDENT_LINES|null;
  recovery:'brush'|'calibrate'|'wait'|null;recoveryFrame:number;recoverySeconds:number;
  resumePhase:string|null;resumeFrame:number;roverParked:boolean;dataArchived:boolean;crewChecked:boolean;
}
export const emptyIncidents=():IncidentState=>({version:1,pending:null,log:[],dust:0,sensorCalibrated:false,kitUsed:false,radiationUntil:null,evaBlocked:false,autoWaitAtBase:false,shedGas:false,feedback:null,recovery:null,recoveryFrame:0,recoverySeconds:0,resumePhase:null,resumeFrame:0,roverParked:false,dataArchived:false,crewChecked:false});
export const INCIDENT_MODEL={id:'surface-incidents-v1',maxEvents:2,dustFraction:.6,cleanedDust:.15,brushSeconds:480,calibrationSeconds:180,radiationWindow:1800,recoveryFrames:50} as const;
export function incidentHash(seed:number){return Math.imul(seed^0x5a17b38f,16777619)>>>0;}
export const primaryIncident=(seed:number):IncidentKind=>(['dust','radio','power','radiation'] as const)[incidentHash(seed)%4];
export function incidentEffects(moon:MoonSession){const h=moon.science?.hazards;return {solarMultiplier:1-(h?.dust??0)*.5,driveMultiplier:1+(h?.dust??0)*.2,opticalQuality:h?.dust&&h.dust>.3?h.sensorCalibrated?'medium' as const:'low' as const:null};}
export function openIncident(h:IncidentState,kind:IncidentKind,reason:string,surface:SurfaceState):IncidentState{
  if(h.pending||h.log.some(r=>r.id===kind)||h.log.length>=INCIDENT_MODEL.maxEvents)return h;
  return {...h,pending:kind,feedback:kind,log:[...h.log,{id:kind,kind,status:'awaiting',action:null,actions:[],reason,atSeconds:surface.elapsedSeconds,resolvedAtSeconds:null}],
    dust:kind==='dust'?INCIDENT_MODEL.dustFraction:h.dust,radiationUntil:kind==='radiation'?surface.elapsedSeconds+INCIDENT_MODEL.radiationWindow:h.radiationUntil,evaBlocked:kind==='radiation'||h.evaBlocked};
}
export function chooseIncident(h:IncidentState,kind:IncidentKind,action:IncidentAction,time:number,resolved=false):IncidentState{return {...h,pending:null,feedback:'accepted',log:h.log.map(r=>r.id===kind?{...r,action,actions:[...(r.actions??[]),{action,atSeconds:time}],status:resolved?'resolved':'mitigated',resolvedAtSeconds:resolved?time:null}:r)};}
export function resolveIncident(h:IncidentState,kind:IncidentKind,time:number):IncidentState{return {...h,pending:h.pending===kind?null:h.pending,log:h.log.map(r=>r.id===kind?{...r,status:'resolved',resolvedAtSeconds:time}:r)};}
export function updateIncidents(h:IncidentState,surface:SurfaceState,linked:boolean):IncidentState{
  let next=h;
  if(h.radiationUntil!==null&&surface.elapsedSeconds>=h.radiationUntil)next={...resolveIncident(next,'radiation',surface.elapsedSeconds),radiationUntil:null,evaBlocked:false,autoWaitAtBase:false,feedback:'clear'};
  if(linked&&h.log.some(r=>r.id==='radio'&&r.status==='mitigated'))next={...resolveIncident(next,'radio',surface.elapsedSeconds),feedback:'linked'};
  return next;
}
export function careKitAvailable(h:IncidentState,prep:PreparationSelection){return prep.sciencePartIds.includes('field-care-kit')&&!h.kitUsed;}
export function surfaceSecured(moon:MoonSession){const h=moon.science.hazards,s=moon.surface;return moon.science.committed&&s.location==='base'&&s.stage==='idle'&&s.crewSheltered&&!h.pending&&!h.recovery&&!h.evaBlocked&&h.roverParked&&h.dataArchived&&h.crewChecked&&moon.science.records.every(r=>r.transmitted)&&(moon.objective!=='lunar-geology'||moon.science.samples.every(p=>p.stowed));}
