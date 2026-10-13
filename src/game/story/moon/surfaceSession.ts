import {emptyScience} from './science.ts';
import type {WorkshopSession} from '../workshopSession.ts';
import {reduceStoryProgress} from '../progress.ts';
import {landingAuthorized} from './landingSession.ts';
import {safeTouchdown} from './landing.ts';
import {freshSurface,reduceSurface,surfaceResources,surfaceReady,surfacePosition,surfaceLink} from './surface.ts';
import type {SurfaceEvent} from './surface.ts';
export type SurfaceMissionEvent=SurfaceEvent|{type:'surface-restart'};
export function surfaceAuthorized(s:WorkshopSession){return landingAuthorized(s)&&safeTouchdown(s.moon.landing);}
export function enterSurface(s:WorkshopSession):WorkshopSession{
  if(!surfaceAuthorized(s))return s;const surface=freshSurface(s.moon);
  return {...s,moon:{...s.moon,surface,phase:'surface',science:emptyScience(),evidence:[],resources:surfaceResources(s.moon,surface),navigation:{locationId:'base',routeIds:[],communication:'connected'}}};
}
export function reduceSurfaceMission(s:WorkshopSession,e:SurfaceMissionEvent):WorkshopSession{
  if(!['lunar-surface','surface-explore','surface-ready'].includes(s.progress.stepId)||!surfaceAuthorized(s))return s;
  if(e.type==='surface-restart'){const fresh=enterSurface(s);return {...fresh,moon:{...fresh.moon,surface:{...fresh.moon.surface,attempts:s.moon.surface.attempts+1,assisted:true},checkpoints:s.moon.checkpoints.filter(c=>c.id!=='surface-orientation')},progress:{...s.progress,stepId:'lunar-surface',lineIndex:0,completedActivities:s.progress.completedActivities.filter(id=>!['surface-deploy','surface-explore'].includes(id))}};}
  if(s.progress.stepId==='surface-ready')return s;
  if(s.progress.stepId==='lunar-surface'&&!['surface-deploy','surface-tick','surface-pause','surface-resume','surface-hint'].includes(e.type))return s;
  const surface=reduceSurface(s.moon.surface,e,s.moon,s.preparation);if(surface===s.moon.surface)return s;
  const p=surfacePosition(surface),ready=surfaceReady(surface,s.moon,s.preparation),resources=surfaceResources(s.moon,surface);
  return {...s,moon:{...s.moon,surface,resources,navigation:{locationId:surface.location,routeIds:surface.traversed,communication:surfaceLink(p.x,p.z,s.preparation)},
    checkpoints:ready?[...s.moon.checkpoints.filter(c=>c.id!=='surface-orientation'),{id:'surface-orientation',phase:'surface',designSignature:s.moon.designSignature,resources:{...resources}}]:s.moon.checkpoints}};
}
export function advanceSurface(s:WorkshopSession):WorkshopSession{
  const activity=s.progress.stepId==='lunar-surface'?'surface-deploy':s.progress.stepId==='surface-explore'?'surface-explore':null;
  if(!surfaceAuthorized(s)||!activity||!s.moon.surface.deployed||!s.moon.surface.crewSheltered||activity==='surface-explore'&&!surfaceReady(s.moon.surface,s.moon,s.preparation))return s;
  const completed=reduceStoryProgress(s.progress,{type:'complete-activity',activity});return {...s,progress:reduceStoryProgress(completed,{type:'next'})};
}
