import type { WorkshopSession } from '../workshopSession.ts';
import { launchAuthorized, flightComplete } from '../flight.ts';
import { reduceStoryProgress } from '../progress.ts';
import { departureResources } from './validation.ts';
import { emptyJourney, reduceJourney, routeReport, journeyResources } from './journey.ts';
import type { JourneyEvent } from './journey.ts';

export type JourneyMissionEvent=JourneyEvent|{type:'journey-confirm-route'}|{type:'journey-restart'};
export function enterEarthOrbit(s:WorkshopSession):WorkshopSession{
  if(!launchAuthorized(s.progress,s.preparation,s.readiness,s.moon)||!flightComplete(s.flight,s.moon.designSignature))return s;
  const j={...emptyJourney(),signature:s.moon.designSignature,mode:s.flight.mode,speed:s.flight.speed,assisted:s.flight.skipped||s.moon.human.stress.assisted};
  const moon={...s.moon,trajectory:null,journey:j};const resources=journeyResources(moon,j);
  return {...s,moon:{...moon,phase:'earth-orbit',resources,checkpoints:[...s.moon.checkpoints.filter(c=>c.id==='pre-departure'),{id:'earth-orbit',phase:'earth-orbit',designSignature:s.moon.designSignature,resources:{...resources}}]}};
}
export function reduceJourneyMission(s:WorkshopSession,event:JourneyMissionEvent):WorkshopSession{
  if(!['earth-orbit','moon-transfer','lunar-orbit'].includes(s.progress.stepId)||!launchAuthorized(s.progress,s.preparation,s.readiness,s.moon)||!flightComplete(s.flight,s.moon.designSignature))return s;
  if(event.type==='journey-restart'){
    const reset=enterEarthOrbit(s);reset.moon={...reset.moon,journey:{...reset.moon.journey,assisted:true,mode:s.moon.journey.mode,speed:s.moon.journey.speed,attempts:s.moon.journey.attempts+1}};return {...reset,progress:{...s.progress,stepId:'earth-orbit',lineIndex:0,completedActivities:s.progress.completedActivities.filter(id=>!['earth-orbit','moon-transfer'].includes(id))}};
  }
  if(event.type==='journey-confirm-route'){
    const j=s.moon.journey;
    if(s.progress.stepId!=='earth-orbit'||j.stage!=='route'||!j.route||!routeReport(s.moon,j.route).feasible)return s;
    const journey={...j,stage:'tli-window' as const,elapsed:0,paused:false};
    const completed=reduceStoryProgress(s.progress,{type:'complete-activity',activity:'earth-orbit'});
    return {...s,moon:{...s.moon,trajectory:j.route,journey},progress:reduceStoryProgress(completed,{type:'next'})};
  }
  const j=reduceJourney(s.moon.journey,event,s.moon);if(j===s.moon.journey)return s;
  const moon={...s.moon,journey:j},resources=journeyResources(moon,j);
  const phase=j.stage==='complete'?'lunar-orbit':['coast','loi-window','loi-burn'].includes(j.stage)?'transfer':'earth-orbit';
  const checkpoints=j.stage==='complete'?[...moon.checkpoints.filter(c=>c.id!=='lunar-orbit'),{id:'lunar-orbit',phase:'lunar-orbit' as const,designSignature:moon.designSignature,resources:{...resources}}]:moon.checkpoints;
  return {...s,moon:{...moon,phase,resources,checkpoints}};
}
export function resetDeparture(s:WorkshopSession){return {...s.moon,phase:'validate' as const,journey:emptyJourney(),trajectory:null,resources:departureResources(s.moon,s.preparation),checkpoints:s.moon.checkpoints.filter(c=>c.id==='pre-departure')};}
