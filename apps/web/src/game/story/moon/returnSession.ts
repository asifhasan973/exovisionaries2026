import type {WorkshopSession} from '../workshopSession.ts';
import type {ReturnEvent} from './return.ts';
import {freshReturn,reduceReturn,returnAuthorized,returnComplete,returnResources,returnPhase,missionOutcome} from './return.ts';
import {reduceStoryProgress,createBlueprintReplayProgress} from '../progress.ts';
import {createMoonSession,syncMoonDesign} from './session.ts';
import {createWorkshopSession} from '../workshopSession.ts';
import {verifiedActivities} from '../preparation.ts';

export function enterReturn(s:WorkshopSession):WorkshopSession {
  if(s.progress.stepId!=='surface-secured'||!returnAuthorized(s.moon))return s;
  const returnFlight=freshReturn(s.moon),progress=reduceStoryProgress(s.progress,{type:'next'});
  return {...s,progress,moon:{...s.moon,returnFlight,outcome:null}};
}
export function reduceReturnMission(s:WorkshopSession,event:ReturnEvent):WorkshopSession {
  if(!['crew-return','mission-debrief'].includes(s.progress.stepId)||!returnAuthorized(s.moon))return s;
  if(event.type==='return-new-attempt'){
    if(!returnComplete(s.moon.returnFlight,s.moon.designSignature))return s;
    // Same blueprint/crew on Earth; approvals and all flight evidence must be earned again.
    const progress=createBlueprintReplayProgress(s.progress,verifiedActivities(s.preparation,s.moon.objective??'lunar-ice'));
    const moon=syncMoonDesign({...createMoonSession(progress,s.preparation),crew:{...s.moon.crew},plan:{...s.moon.plan},designSignature:''},progress,s.preparation);
    return createWorkshopSession(progress,s.preparation,undefined,undefined,moon);
  }
  if(s.progress.stepId==='mission-debrief')return s;
  const returnFlight=reduceReturn(s.moon.returnFlight,event,s.moon);if(returnFlight===s.moon.returnFlight)return s;
  const resources=returnResources(s.moon,returnFlight),phase=returnPhase(returnFlight),moon={...s.moon,returnFlight,resources,phase,navigation:{...s.moon.navigation,locationId:returnFlight.stage==='splashdown'?'earth-ocean':phase==='surface'?'moon-base':phase==='ascent'||phase==='docking'?'lunar-orbit':phase==='reentry'?'earth-atmosphere':'earth-return',communication:'connected' as const}};
  const completed=returnComplete(returnFlight,moon.designSignature);
  return {...s,moon:{...moon,outcome:missionOutcome(moon),checkpoints:completed?[...moon.checkpoints.filter(c=>c.id!=='crew-recovered'),{id:'crew-recovered',phase:'debrief',designSignature:moon.designSignature,resources:{...resources}}]:moon.checkpoints}};
}
export function advanceReturn(s:WorkshopSession):WorkshopSession {
  if(!returnAuthorized(s.moon)||!returnComplete(s.moon.returnFlight,s.moon.designSignature))return s;
  const progress=reduceStoryProgress(s.progress,{type:'complete-activity',activity:'crew-return'});
  return {...s,progress:reduceStoryProgress(progress,{type:'next'})};
}
