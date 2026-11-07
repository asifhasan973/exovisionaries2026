import { roverEvidence } from './roverEquipment';
import type { WorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import type { MoonSession, ScienceObservation } from '@/game/moon/shared/session';
import type { ActivityId, StoryStepId } from '@/game/moon/core/types';
import { safeTouchdown } from '@/game/moon/landing/landing';
import { landingAuthorized } from '@/game/moon/landing/landingSession';
import { emptySurface } from '@/game/moon/surface/surface';
import { emptyScience } from '@/game/moon/science/science';
import { enterReturn } from '@/game/moon/return/returnSession';
import { freshRover, reduceRover, roverAtBase, roverReady, roverResources } from './rover';
import type { RoverEvent, RoverState } from './rover';

export function roverActivities(rover: RoverState): ActivityId[] {
  return [...(rover.deployed ? ['surface-deploy'] as const : []), ...(rover.deposited.length >= 2 ? ['surface-explore', 'ice-science'] as const : []), ...(roverReady(rover) ? ['surface-recovery'] as const : [])];
}
/** Derive shared accounting and evidence from successful collection/deposit receipts. */
export function reconcileRover(moon: MoonSession, rover: RoverState): MoonSession {
  const sameDeposits = moon.rover?.deposited.join() === rover.deposited.join();
  const measured=rover.version===4?roverEvidence(moon,[...rover.deposited,...rover.cargo],rover.deposited,rover.sampleTimes):null;
  const records: ScienceObservation[] = measured?measured.records:sameDeposits ? moon.science.records : rover.deposited.map(id => ({ id: `crew-sample-${id}`, objective: moon.objective ?? 'lunar-ice', locationId: id,
    instrumentId: 'crew-drill', kind: 'subsurface', confidence: 'low', points: 2, transmitted: true, quality: 'high', signal: 'Sealed soil sample; composition unconfirmed', depthCm: 10, depthRangeCm: [0, 10], missionSeconds: rover.elapsed, sampleId: `crew-sample-${id}` }));
  const ready = roverReady(rover), resources = roverResources(moon, rover);
  return { ...moon, rover, phase: 'surface', resources, evidence: records,
    surface: { ...emptySurface(), signature: moon.designSignature, deployed: rover.deployed, crewSheltered: rover.version>=3||['intro', 'cabin', 'boarding', 'ready', 'complete'].includes(rover.phase), stage: rover.deployed ? 'idle' : 'stowed', batteryWh: rover.batteryWh, elapsedSeconds: rover.elapsed, assisted: rover.assisted, location: 'base' },
    science: !measured&&sameDeposits && moon.science.committed === ready && moon.science.assisted === rover.assisted ? moon.science : { ...(measured??emptyScience()), objective: moon.objective ?? 'lunar-ice', signature: moon.designSignature, phase: 'ready', committed: ready, records, currentIds: records.map(record => record.id), assisted: rover.assisted },
    navigation: { locationId: roverAtBase(rover) ? 'base' : 'rover-field', routeIds: [], communication: 'connected' },
    checkpoints: sameDeposits ? moon.checkpoints : [...moon.checkpoints.filter((checkpoint: any) => !['surface-orientation', 'ice-science'].includes(checkpoint.id)), ...(rover.deposited.length >= 2 ? [{ id: 'ice-science', phase: 'surface' as const, designSignature: moon.designSignature, resources: { ...resources } }] : [])] };
}
export function reduceRoverMission(session: WorkshopSession, event: RoverEvent): WorkshopSession {
  if (session.review || !['lunar-surface', 'surface-explore', 'surface-ready', 'ice-science', 'science-ready', 'surface-recovery', 'surface-secured'].includes(session.progress.stepId) || !landingAuthorized(session) || !safeTouchdown(session.moon.landing)) return session;
  if(!session.moon.rover&&event.type!=='rover-talk')return session;
  let previous=session.moon.rover??freshRover(session.moon);
  if(!session.moon.rover&&session.moon.surface.deployed)previous=reduceRover(previous,{type:'rover-restart'},session.moon);
  const rover=reduceRover(previous,event,session.moon);
  if (rover === previous && session.moon.rover) return session;
  const moon = reconcileRover(session.moon, rover), activities = roverActivities(rover);
  const completedActivities = [...new Set([...session.progress.completedActivities.filter((id: any) => !['surface-deploy', 'surface-explore', 'ice-science', 'surface-recovery'].includes(id)), ...activities])];
  const stepId: StoryStepId = roverReady(rover) ? 'surface-secured' : rover.deployed ? 'surface-explore' : 'lunar-surface';
  const progress = session.progress.stepId === stepId && session.progress.completedActivities.join() === completedActivities.join() ? session.progress : { ...session.progress, completedActivities, stepId, lineIndex: 0, history: session.progress.stepId===stepId?session.progress.history:[...session.progress.history,{stepId:session.progress.stepId,lineIndex:session.progress.lineIndex}] };
  const next: WorkshopSession = { ...session, moon, progress };
  return event.type === 'rover-launch' && rover.phase === 'complete' ? enterReturn(next) : next;
}
