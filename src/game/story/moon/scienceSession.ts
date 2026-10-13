import {verifiedActivities} from '../preparation.ts';
import {surfaceSecured} from './incidents.ts';
import {createBlueprintReplayProgress} from '../progress.ts';
import {createWorkshopSession} from '../workshopSession.ts';
import {emptyReadiness} from '../readiness.ts';
import {emptyFlight} from '../flight.ts';
import {createMoonSession,syncMoonDesign} from './session.ts';
import type {WorkshopSession} from '../workshopSession.ts';
import {reduceStoryProgress} from '../progress.ts';
import {surfaceAuthorized} from './surfaceSession.ts';
import {freshScience,reduceScience,scienceComplete} from './science.ts';
import type {ScienceEvent} from './science.ts';
import {surfaceReady,surfaceResources,surfacePosition,surfaceLink} from './surface.ts';
export function scienceAuthorized(s:WorkshopSession){return surfaceAuthorized(s)&&!!s.moon.objective&&s.progress.completedActivities.includes('surface-explore');}
export function enterScience(s:WorkshopSession):WorkshopSession{
  if(!scienceAuthorized(s)||!surfaceReady(s.moon.surface,s.moon,s.preparation))return s;
  return {...s,moon:{...s.moon,science:freshScience(s.moon,s.preparation),evidence:[]}};
}
export function reduceScienceMission(s:WorkshopSession,event:ScienceEvent):WorkshopSession{
  if(!['ice-science','science-ready','surface-recovery','surface-secured'].includes(s.progress.stepId)||!scienceAuthorized(s)||s.moon.science.signature!==s.moon.designSignature)return s;
  if(event.type==='science-design-retry'){
    const progress=createBlueprintReplayProgress(s.progress,verifiedActivities(s.preparation,s.moon.objective??'lunar-ice'));
    const fresh=createMoonSession(progress,s.preparation),moon=syncMoonDesign({...fresh,crew:{...s.moon.crew},plan:{...s.moon.plan},designSignature:''},progress,s.preparation);
    return createWorkshopSession(progress,s.preparation,emptyReadiness(),emptyFlight(),moon);
  }
  if(s.progress.stepId==='surface-secured')return s;
  if(s.progress.stepId!=='ice-science'&&!['science-incident','science-tick','science-pause','science-resume','science-secure','science-commit','science-hint'].includes(event.type))return s;
  const {science,surface}=reduceScience(s.moon.science,s.moon.surface,event,s.moon,s.preparation);if(science===s.moon.science&&surface===s.moon.surface)return s;
  const resources=surfaceResources(s.moon,surface),position=surfacePosition(surface),ready=scienceComplete(science,surface);
  return {...s,moon:{...s.moon,science,surface,evidence:science.records,incidents:science.hazards.log.map(r=>({id:r.id,kind:r.kind,resolved:r.status==='resolved'})),resources,navigation:{locationId:surface.location,routeIds:surface.traversed,communication:surfaceLink(position.x,position.z,s.preparation)},
    checkpoints:ready?[...s.moon.checkpoints.filter(c=>c.id!=='ice-science'),{id:'ice-science',phase:'surface',designSignature:s.moon.designSignature,resources:{...resources}}]:s.moon.checkpoints.filter(c=>c.id!=='ice-science')}};
}
export function advanceScience(s:WorkshopSession):WorkshopSession{
  if(!scienceAuthorized(s)||s.moon.science.signature!==s.moon.designSignature||!scienceComplete(s.moon.science,s.moon.surface))return s;
  const committed=reduceScienceMission(s,{type:'science-commit'});
  const progress=reduceStoryProgress(committed.progress,{type:'complete-activity',activity:'ice-science'});return {...committed,progress:reduceStoryProgress(progress,{type:'next'})};
}
export function advanceRecovery(s:WorkshopSession):WorkshopSession{
  if(s.progress.stepId==='science-ready'&&s.moon.science.committed)return {...s,progress:reduceStoryProgress(s.progress,{type:'next'})};
  if(s.progress.stepId!=='surface-recovery'||!surfaceSecured(s.moon))return s;
  const progress=reduceStoryProgress(s.progress,{type:'complete-activity',activity:'surface-recovery'});
  return {...s,progress:reduceStoryProgress(progress,{type:'next'})};
}
