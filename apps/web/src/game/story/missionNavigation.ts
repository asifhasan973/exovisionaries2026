import {reduceRover} from './moon/rover.ts';
import { STORY_FLOW, getStoryStep } from './flow.ts';
import { reduceStoryProgress } from './progress.ts';
import type { StoryProgress } from './types.ts';
import type { WorkshopSession } from './workshopSession.ts';

export type StoryCursor=Pick<StoryProgress,'stepId'|'lineIndex'>;
export interface MissionReview { anchor:StoryProgress; forward:StoryCursor[] }
export function savedMissionProgress(s:WorkshopSession){return s.review?.anchor??s.progress;}

export function pauseMission(s:WorkshopSession):WorkshopSession{
  const {moon,readiness}=s;
  const isActive=(stage:string,stages:readonly string[])=>stages.includes(stage);
  return {
    ...s,
    flight:{...s.flight,status:s.flight.status==='running'?'paused':s.flight.status},
    readiness:{...readiness,trial:{...readiness.trial,paused:readiness.trial.paused||isActive(readiness.trial.phase,['outbound','drilling','returning'])}},
    moon:{
      ...moon,
      ...(moon.rover?{rover:reduceRover(moon.rover,{type:'rover-pause'},moon)}:{}),
      journey:{...moon.journey,paused:moon.journey.paused||!isActive(moon.journey.stage,['route','complete'])},
      landing:{...moon.landing,paused:moon.landing.paused||isActive(moon.landing.stage,['separating','braking','descending','aborting'])},
      surface:{...moon.surface,paused:moon.surface.paused||isActive(moon.surface.stage,['deploying','driving','charging']),held:false},
      science:{...moon.science,paused:moon.science.paused||isActive(moon.science.phase,['outbound','survey','drilling','analysis','listening','returning','recovering','transmitting'])},
      returnFlight:{...moon.returnFlight,paused:moon.returnFlight.paused||isActive(moon.returnFlight.stage,['ascending','burning','coast','entry','chutes'])},
      human:{...moon.human,
        returnTest:{...moon.human.returnTest,paused:moon.human.returnTest.paused||moon.human.returnTest.phase==='running',held:false},
        packingGame:{...moon.human.packingGame,held:false},
      },
    },
  };
}

/** A backwards visit never spends resources, clears receipts or restarts physics. */
export function navigateBack(s:WorkshopSession):WorkshopSession{
  const paused=pauseMission(s),current=s.progress,step=getStoryStep(current.stepId,current.selections.objective);
  let progress:StoryProgress;
  if(step.kind==='conversation'&&current.lineIndex>0)progress=reduceStoryProgress(current,{type:'back'});
  else{
    const history=[...current.history];
    while(history.at(-1)?.stepId===current.stepId)history.pop();
    const previous=history.pop()??STORY_FLOW[STORY_FLOW.findIndex(item=>item.id===current.stepId)-1];
    if(!previous)return paused;
    const target=getStoryStep('stepId' in previous?previous.stepId:previous.id,current.selections.objective);
    progress={...current,stepId:target.id,lineIndex:'lineIndex' in previous?previous.lineIndex:target.kind==='conversation'?target.lines.length-1:0,history};
  }
  const locked=!!s.review||s.flight.t>0||!['prepare','validate'].includes(s.moon.phase);
  return {...paused,progress:{...progress,milestones:progress.milestones?{...progress.milestones,pending:undefined}:undefined},
    ...(locked?{review:{anchor:s.review?.anchor??current,forward:[...(s.review?.forward??[]),{stepId:current.stepId,lineIndex:current.lineIndex}]}}:{})};
}
export function navigateForward(s:WorkshopSession):WorkshopSession{
  if(!s.review)return s;
  const forward=[...s.review.forward],target=forward.pop();
  if(!target||!forward.length){const {review,...rest}=s;return {...rest,progress:review!.anchor};}
  return {...s,review:{...s.review,forward},progress:{...s.progress,...target,history:[...s.progress.history,{stepId:s.progress.stepId,lineIndex:s.progress.lineIndex}]}};
}
