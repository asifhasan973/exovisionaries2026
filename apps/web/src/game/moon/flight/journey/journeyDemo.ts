import { quickPreparation, removePart, installPart } from '@/game/moon/core/preparation';
import { scienceResult } from '@/game/moon/science/science';
import { primaryIncident } from '@/game/moon/hazards/incidents';
import type { PreparationSelection } from '@/game/moon/core/design';
import { createJudgeMission } from '@/game/moon/stages/demo';
import { reduceMission } from '@/game/moon/workshop/lander/workshopSession';
import type { MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import type { PlayerGender, StoryStepId } from '@/game/moon/core/types';
import type { MoonObjective } from '@/game/moon/shared/catalog';
import { RETURN_CONNECTIONS, HUMAN_PACKING } from '@/game/moon/shared/validation';
import { trialActive } from '@/game/moon/hazards/trial';
import { CAPSULE_SOCKET, SUPPLY_ITEMS, SUPPLY_SOCKETS } from '@/game/moon/workshop/packing/packingGame';
import { ROCKET_ORDER } from '@/game/moon/workshop/rocket/rocketAssembly';
/** Explicit assisted showcase: real readiness rules still have to accept the prepared kit. */
export function createReadinessDemo(gender:PlayerGender,objective:MoonObjective,target:StoryStepId,options?:{preparation?:PreparationSelection;playerName?:string}){
  let s=createJudgeMission(gender,objective,options);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  act({type:'moon-assign-crew',role:'scientist',id:objective==='lunar-ice'?'astrobiologist':'geologist'});
  act({type:'moon-assign-crew',role:'support',id:'robotics-specialist'});act({type:'next'});act({type:'next'});
  if(s.progress.stepId===target)return s;
  act({type:'human-seal'});act({type:'human-check'});act({type:'next'});
  if(s.progress.stepId===target)return s;
  act({type:'connect-radar'});act({type:'run-check'});act({type:'next'});
  if(s.progress.stepId===target)return s;
  for(const type of ['trial-drive','trial-drill','trial-return'] as const){act({type});for(let i=0;i<80&&trialActive(s.readiness.trial);i++)act({type:'trial-tick',seconds:.25});}
  act({type:'next'});
  if(s.progress.stepId===target)return s;
  act({type:'run-check'});act({type:'next'});
  if(s.progress.stepId===target)return s;
  for(const id of RETURN_CONNECTIONS){
    act({type:'return-test-select',id});
    if(id==='ascent'){act({type:'return-test-throttle',value:65});act({type:'return-test-hold',held:true});}
    else if(id==='service'){for(let i=0;i<6;i++)act({type:'return-test-turn',direction:1});act({type:'return-test-start'});}
    else if(id==='shield'){for(let i=0;i<4;i++)act({type:'return-test-turn',direction:-1});act({type:'return-test-start'});}
    else{act({type:'return-test-start'});for(let i=0;i<20;i++)act({type:'return-test-tick',seconds:.1});act({type:'return-test-deploy'});}
    for(let i=0;i<30;i++)act({type:'return-test-tick',seconds:.1});
  }
  act({type:'next'});
  if(s.progress.stepId===target)return s;
  for(const action of ['safe-route','clean-lens','move-ridge','shelter'] as const){act({type:'human-stress',action});act({type:'human-stress-next'});}
  act({type:'next'});
  if(s.progress.stepId===target)return s;
  for(const id of HUMAN_PACKING){
    act({type:'packing-game-select',id});
    if(id==='capsule'){
      act({type:'packing-game-drop',item:'capsule',...CAPSULE_SOCKET});
      act({type:'packing-game-lock',latch:0});act({type:'packing-game-lock',latch:1});
    }else if(id==='lander'){
      for(let i=0;i<3;i++)act({type:'packing-game-turn',direction:1});
      act({type:'packing-game-hold',held:true});
      for(let i=0;i<20;i++)act({type:'packing-game-tick',seconds:.1});
    }else for(const item of SUPPLY_ITEMS)act({type:'packing-game-drop',item,...SUPPLY_SOCKETS[item]});
  }
  act({type:'next'});
  if(s.progress.stepId===target)return s;
  for(const part of ROCKET_ORDER)act({type:'rocket-build-place',part,target:part});
  act({type:'next'});
  if(s.progress.stepId===target)return s;
  act({type:'next'});
  return s;
}

export function createJourneyDemo(gender:PlayerGender,objective:MoonObjective,options?:{preparation?:PreparationSelection;playerName?:string}){
  return createReadinessDemo(gender,objective,'liftoff',options);
}

/** Declared chapter shortcut; departure and transfer still pass the real reducers. */
export function createLandingDemo(gender:PlayerGender,objective:MoonObjective,options?:{preparation?:PreparationSelection;playerName?:string}){
  let s=createJourneyDemo(gender,objective,options);
  for(const event of [{type:'flight-skip'},{type:'next'},{type:'journey-route',id:'balanced'},{type:'journey-confirm-route'},{type:'journey-skip'},{type:'next'},{type:'next'}] as const)s=reduceMission(s,event);
  return s;
}

/** Isolated, visibly assisted surface showcase; the real landing reducer must succeed. */
export function createSurfaceDemo(gender:PlayerGender,objective:MoonObjective,options?:{preparation?:PreparationSelection;playerName?:string}){
  let s=createLandingDemo(gender,objective,options);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  act({type:'landing-mode',mode:'medium'});act({type:'landing-separate'});
  for(let i=0;i<30&&s.moon.landing.stage==='separating';i++)act({type:'landing-tick',seconds:.25});
  act({type:'landing-brake'});
  for(let i=0;i<120&&!s.moon.landing.decisionPending;i++)act({type:'landing-tick',seconds:.25});
  act({type:'landing-target',id:'left'});act({type:'landing-continue'});
  for(let i=0;i<600&&s.moon.landing.stage==='descending';i++){
    const l=s.moon.landing;
    act({type:'landing-control',steer:Math.max(-1,Math.min(1,(-45-l.x)*.18-l.vx*.5)),brake:true});
    act({type:'landing-tick',seconds:.25});
  }
  act({type:'next'});return s;
}

/** Replays deployment/scouting gates. It grants neither samples nor science points. */
export function createScienceDemo(gender:PlayerGender,options?:{preparation?:PreparationSelection;playerName?:string}){
  let s=createSurfaceDemo(gender,'lunar-ice',options);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  act({type:'surface-deploy'});for(let i=0;i<40&&s.moon.surface.stage==='deploying';i++)act({type:'surface-tick',seconds:.25});act({type:'next'});
  act({type:'surface-select',edge:'base-ridge'});act({type:'surface-start'});for(let i=0;i<50&&s.moon.surface.stage==='driving';i++)act({type:'surface-tick',seconds:.25});
  act({type:'surface-arm'});act({type:'surface-select',edge:'ridge-edge'});act({type:'surface-start'});for(let i=0;i<90&&s.moon.surface.stage==='driving';i++)act({type:'surface-tick',seconds:.25});
  act({type:'surface-home'});for(let i=0;i<90&&s.moon.surface.stage==='driving';i++)act({type:'surface-tick',seconds:.25});
  act({type:'surface-charge'});for(let i=0;i<40&&s.moon.surface.stage==='charging';i++)act({type:'surface-tick',seconds:.25});
  act({type:'next'});act({type:'next'});return s;
}

/** A named, isolated dust scenario; deployment, science and incident gates still execute normally. */
export function createIncidentDemo(gender:PlayerGender){
  let playerName='Charlie';
  for(let i=0;i<30;i++){const name=i?`Charlie ${i}`:'Charlie';let seed=2166136261;for(const char of `${name}|lunar-ice|crater-rim`)seed=Math.imul(seed^char.charCodeAt(0),16777619);if(primaryIncident(seed>>>0)==='dust'){playerName=name;break;}}
  let s=createScienceDemo(gender,{playerName});
  s=reduceMission(s,{type:'science-program',program:'sample'});s=reduceMission(s,{type:'science-start'});
  for(let i=0;i<240&&!s.moon.science.hazards.pending&&s.moon.science.phase!=='failed';i++)s=reduceMission(s,{type:'science-tick',seconds:.25});
  return s;
}

/** Assisted return showcase. Every record and surface safety item passes the real reducers. */
export function createReturnDemo(gender:PlayerGender){
  let s=createIncidentDemo(gender);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  for(let i=0;i<1600;i++){
    const science=s.moon.science,h=science.hazards;
    if(h.pending){act({type:'science-incident',action:h.pending==='dust'?'continue-dust':h.pending==='radio'?'follow-plan':h.pending==='radiation'?'shelter-wait':'safe-return'});continue;}
    if(science.phase==='failed')return s;
    if(['outbound','survey','drilling','analysis','returning','recovering','transmitting'].includes(science.phase)){act({type:'science-tick',seconds:.25});continue;}
    if(science.phase==='report'){
      if(!science.fieldworkStopped){act({type:'science-claim',finding:scienceResult(science)});}
      act({type:'science-transmit'});continue;
    }
    if(science.phase==='ready')break;
    return s;
  }
  act({type:'next'});act({type:'next'});
  act({type:'science-secure',item:'rover'});act({type:'science-secure',item:'data'});
  for(let i=0;i<100&&s.moon.science.phase==='transmitting';i++)act({type:'science-tick',seconds:.25});
  act({type:'science-secure',item:'crew'});act({type:'next'});act({type:'next'});
  return s;
}

/** Prepared geology chapter. No rock measurements, samples or findings are granted. */
export function createGeologyDemo(gender:PlayerGender){
  let prep=quickPreparation('lunar-geology');
  prep=removePart(prep,'geo-drill-basic');prep=removePart(prep,'field-care-kit');
  for(const id of ['geo-scoop-basic','geo-xrd-basic','geo-gpr-basic','geo-seismometer-basic'])prep=installPart(prep,id);
  let s=createSurfaceDemo(gender,'lunar-geology',{preparation:prep,playerName:'Rock Explorer'});const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  act({type:'surface-deploy'});for(let i=0;i<40&&s.moon.surface.stage==='deploying';i++)act({type:'surface-tick',seconds:.25});act({type:'next'});
  act({type:'surface-select',edge:'base-lookout'});act({type:'surface-start'});for(let i=0;i<60&&s.moon.surface.stage==='driving';i++)act({type:'surface-tick',seconds:.25});
  act({type:'surface-home'});for(let i=0;i<60&&s.moon.surface.stage==='driving';i++)act({type:'surface-tick',seconds:.25});
  act({type:'surface-charge'});for(let i=0;i<40&&s.moon.surface.stage==='charging';i++)act({type:'surface-tick',seconds:.25});act({type:'next'});act({type:'next'});
  act({type:'science-program',program:'sample'});return s;
}

/** Fast, explicitly assisted ending preview; no injected observations or success flags. */
export function createGeologyReturnDemo(gender:PlayerGender){
  let s=createGeologyDemo(gender);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};act({type:'science-start'});
  for(let i=0;i<1800;i++){
    const science=s.moon.science,h=science.hazards;
    if(h.pending){act({type:'science-incident',action:h.pending==='dust'?'continue-dust':h.pending==='radio'?'follow-plan':h.pending==='radiation'?'shelter-wait':'safe-return'});continue;}
    if(science.phase==='failed')return s;
    if(science.phase==='sensor-site'){act({type:'science-place-sensor',placement:'ground'});continue;}
    if(['outbound','survey','drilling','analysis','listening','returning','recovering','transmitting'].includes(science.phase)){act({type:'science-tick',seconds:.25});continue;}
    if(science.phase==='report'){if(!science.fieldworkStopped)act({type:'science-claim',finding:scienceResult(science)});act({type:'science-transmit'});continue;}
    if(science.phase==='ready')break;return s;
  }
  act({type:'next'});act({type:'next'});act({type:'science-secure',item:'rover'});act({type:'science-secure',item:'data'});
  for(let i=0;i<100&&s.moon.science.phase==='transmitting';i++)act({type:'science-tick',seconds:.25});
  act({type:'science-secure',item:'samples'});act({type:'science-secure',item:'crew'});act({type:'next'});act({type:'next'});return s;
}
