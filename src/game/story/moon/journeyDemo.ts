import {quickPreparation,removePart,installPart} from '../preparation.ts';
import {scienceResult} from './science.ts';
import {primaryIncident} from './incidents.ts';
import type {PreparationSelection} from '../design.ts';
import {createJudgeMission} from '../demo.ts';
import {reduceMission} from '../workshopSession.ts';
import type {MissionEvent} from '../workshopSession.ts';
import type {PlayerGender} from '../types.ts';
import type {MoonObjective} from './catalog.ts';
import {RETURN_CONNECTIONS,HUMAN_PACKING} from './validation.ts';
import {trialActive} from '../trial.ts';
/** Explicit assisted showcase: real readiness rules still have to accept the prepared kit. */
export function createJourneyDemo(gender:PlayerGender,objective:MoonObjective,options?:{preparation?:PreparationSelection;playerName?:string}){
  let s=createJudgeMission(gender,objective,options);const act=(e:MissionEvent)=>{s=reduceMission(s,e);};
  act({type:'moon-assign-crew',role:'scientist',id:objective==='lunar-ice'?'astrobiologist':'geologist'});
  act({type:'moon-assign-crew',role:'support',id:'robotics-specialist'});act({type:'next'});act({type:'next'});
  act({type:'human-seal'});act({type:'human-check'});act({type:'next'});
  act({type:'connect-radar'});act({type:'run-check'});act({type:'next'});
  for(const type of ['trial-drive','trial-drill','trial-return'] as const){act({type});for(let i=0;i<80&&trialActive(s.readiness.trial);i++)act({type:'trial-tick',seconds:.25});}
  act({type:'next'});act({type:'run-check'});act({type:'next'});
  RETURN_CONNECTIONS.forEach(id=>act({type:'human-connect',id}));act({type:'human-check'});act({type:'next'});
  for(const action of ['safe-route','clean-lens','move-ridge','shelter'] as const){act({type:'human-stress',action});act({type:'human-stress-next'});}
  act({type:'next'});HUMAN_PACKING.forEach(id=>act({type:'human-pack',id}));act({type:'next'});act({type:'next'});
  return s;
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
  act({type:'landing-mode',mode:'guided'});act({type:'landing-separate'});
  for(let i=0;i<30&&s.moon.landing.stage==='separating';i++)act({type:'landing-tick',seconds:.25});
  act({type:'landing-brake'});
  for(let i=0;i<120&&!s.moon.landing.decisionPending;i++)act({type:'landing-tick',seconds:.25});
  act({type:'landing-target',id:'left'});act({type:'landing-continue'});
  for(let i=0;i<600&&s.moon.landing.stage==='descending';i++)act({type:'landing-tick',seconds:.25});
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
