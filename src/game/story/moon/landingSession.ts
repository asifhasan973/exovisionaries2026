import {emptyScience} from './science.ts';
import type {WorkshopSession} from '../workshopSession.ts';
import {launchAuthorized,flightComplete} from '../flight.ts';
import {reduceStoryProgress} from '../progress.ts';
import {emptySurface} from './surface.ts';
import {emptyLanding,reduceLanding,landingResources,safeTouchdown} from './landing.ts';
import type {LandingEvent} from './landing.ts';
export type LandingMissionEvent=LandingEvent|{type:'landing-restart'};
export function landingAuthorized(s:WorkshopSession){return launchAuthorized(s.progress,s.preparation,s.readiness,s.moon)&&flightComplete(s.flight,s.moon.designSignature)&&s.moon.journey.signature===s.moon.designSignature&&s.moon.journey.stage==='complete';}
export function enterLanding(s:WorkshopSession):WorkshopSession{
  if(!landingAuthorized(s))return s;
  const landing={...emptyLanding(),signature:s.moon.designSignature,mode:s.moon.journey.mode,assisted:s.moon.journey.assisted};
  return {...s,moon:{...s.moon,landing,phase:'lunar-orbit',resources:landingResources(s.moon,landing)}};
}
export function reduceLandingMission(s:WorkshopSession,e:LandingMissionEvent):WorkshopSession{
  if(!['lunar-descent','lunar-surface'].includes(s.progress.stepId)||!landingAuthorized(s))return s;
  if(e.type==='landing-restart'){
    const reset=enterLanding(s);
    return {...reset,moon:{...reset.moon,surface:emptySurface(),science:emptyScience(),evidence:[],landing:{...reset.moon.landing,mode:s.moon.landing.mode,commands:[{type:'mode',mode:s.moon.landing.mode}],assisted:true,attempts:s.moon.landing.attempts+1},checkpoints:s.moon.checkpoints.filter(c=>c.id!=='touchdown'&&c.id!=='surface-orientation'),navigation:{...s.moon.navigation,locationId:'lunar-orbit'}},
      progress:{...s.progress,stepId:'lunar-descent',lineIndex:0,completedActivities:s.progress.completedActivities.filter(id=>!['lunar-descent','surface-deploy','surface-explore'].includes(id))}};
  }
  if(s.progress.stepId==='lunar-surface')return s;
  const landing=reduceLanding(s.moon.landing,e,s.moon,s.preparation);if(landing===s.moon.landing)return s;
  const resources=landingResources(s.moon,landing),landed=safeTouchdown(landing);
  const phase=landed?'surface':['ready','separating','separated','aborted'].includes(landing.stage)?'lunar-orbit':'descent';
  return {...s,moon:{...s.moon,landing,phase,resources,navigation:{...s.moon.navigation,locationId:landed?`landing-${landing.target}`:'lunar-orbit'},
    checkpoints:landed?[...s.moon.checkpoints.filter(c=>c.id!=='touchdown'&&c.id!=='surface-orientation'),{id:'touchdown',phase:'surface',designSignature:s.moon.designSignature,resources:{...resources}}]:s.moon.checkpoints}};
}
export function finishLanding(s:WorkshopSession):WorkshopSession{
  if(!landingAuthorized(s)||!safeTouchdown(s.moon.landing))return s;
  const completed=reduceStoryProgress(s.progress,{type:'complete-activity',activity:'lunar-descent'});
  return {...s,progress:reduceStoryProgress(completed,{type:'next'})};
}
