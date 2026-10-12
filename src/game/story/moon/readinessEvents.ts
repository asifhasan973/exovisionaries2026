import type { WorkshopSession } from '../workshopSession.ts';
import { emptyReadiness, allChecksAccepted } from '../readiness.ts';
import { emptyFlight } from '../flight.ts';
import { syncMoonDesign } from './session.ts';
import { humanReport, humanCheckAccepted, allHumanChecks, HUMAN_CHECKS, RETURN_CONNECTIONS, HUMAN_PACKING } from './validation.ts';
import type { HumanCheck, HumanPack, ReturnConnection } from './validation.ts';
import { stressResult, stressComplete, STRESS_ORDER } from './stress.ts';
import type { StressAction, StressMode } from './stress.ts';
import { verifiedActivities } from '../preparation.ts';

export type HumanEvent = {type:'human-days';days:number}|{type:'human-supplies';pack:'standard'|'extended'}
  |{type:'human-seal'}|{type:'human-connect';id:ReturnConnection}|{type:'human-check'}
  |{type:'human-mode';mode:StressMode}|{type:'human-stress';action:StressAction}|{type:'human-stress-next'}
  |{type:'human-assist'}|{type:'human-pack';id:HumanPack}|{type:'visit-crew'};
/** Every interaction is bound to its real stage and current design. No preview button awards flight/science. */
export function reduceHumanEvent(session:WorkshopSession,event:HumanEvent):WorkshopSession{
  const {moon,preparation,progress}=session,step=progress.stepId;
  if(!['prepare','validate'].includes(moon.phase))return session;
  if(event.type==='visit-crew')return {...session,repair:undefined,progress:{...progress,stepId:'crew-selection',lineIndex:0,history:[...progress.history,{stepId:step,lineIndex:progress.lineIndex}]}};
  if(event.type==='human-days'||event.type==='human-supplies'){
    if(step!=='crew-check')return session;
    if(event.type==='human-days'&&(!Number.isInteger(event.days)||event.days<8||event.days>14))return session;
    if(event.type==='human-supplies'&&!['standard','extended'].includes(event.pack))return session;
    const plan={...moon.plan,...(event.type==='human-days'?{days:event.days}:{supplyPack:event.pack})};
    if(JSON.stringify(plan)===JSON.stringify(moon.plan))return session;
    const next=syncMoonDesign({...moon,plan,designSignature:''},progress,preparation);
    return {...session,moon:next,readiness:emptyReadiness(),flight:emptyFlight(),progress:{...progress,completedActivities:progress.completedActivities.filter(id=>verifiedActivities(preparation,progress.selections.objective).includes(id)||['crew-selection','crew-plan'].includes(id))}};
  }
  const updated=(human:typeof moon.human):WorkshopSession=>({...session,moon:{...moon,phase:'prepare',human:{...human,signature:moon.designSignature,approved:null},launchSnapshot:null,checkpoints:[]},flight:emptyFlight()});
  if(event.type==='human-seal'){
    if(step!=='crew-check'||moon.human.cabinSealed)return session;
    return updated({...moon.human,cabinSealed:true});
  }
  if(event.type==='human-connect'){
    if(step!=='systems-check'||!RETURN_CONNECTIONS.includes(event.id)||!humanCheckAccepted('crew-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    return moon.human.connected.includes(event.id)?session:updated({...moon.human,connected:[...moon.human.connected,event.id]});
  }
  if(event.type==='human-assist') return step==='stress-check' ? updated({...moon.human,stress:{...moon.human.stress,assisted:true}}) : session;
  if(event.type==='human-mode'){
    if(step!=='stress-check'||!['guided','challenge'].includes(event.mode))return session;
    return updated({...moon.human,stress:{...moon.human.stress,mode:event.mode}});
  }
  if(event.type==='human-stress'){
    if(step!=='stress-check'||!humanCheckAccepted('systems-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const stress=moon.human.stress,id=STRESS_ORDER[stress.passed.length];if(!id||!['safe-route','steep-route','clean-lens','drive-blind','move-ridge','boost-radio','shelter','keep-working'].includes(event.action))return session;
    const attempt={id,action:event.action};
    // A successful choice is shown before Next moves to the next exercise.
    return updated({...moon.human,stress:{...stress,signature:moon.designSignature,last:attempt,assisted:stress.assisted||stress.mode==='guided',passed:stress.passed}});
  }
  if(event.type==='human-stress-next'){
    if(step!=='stress-check'||!humanCheckAccepted('systems-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const stress=moon.human.stress,id=STRESS_ORDER[stress.passed.length],attempt=stress.last;
    if(!id||attempt?.id!==id||!stressResult(id,attempt.action,preparation,moon.crew).pass)return session;
    const nextStress={...stress,passed:[...stress.passed,attempt],last:null};
    const human={...moon.human,stress:nextStress};
    if(stressComplete(nextStress,moon.designSignature,preparation,moon.crew))human.checks={...human.checks,'stress-check':moon.designSignature};
    return updated(human);
  }
  if(event.type==='human-check'){
    const id=HUMAN_CHECKS.find(id=>id===step) as HumanCheck|undefined;if(!id)return session;
    if(id!=='crew-check'&&(!humanCheckAccepted('crew-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon)))return session;
    if(id==='stress-check'&&!humanCheckAccepted('systems-check',moon,preparation))return session;
    const result=humanReport(moon,preparation),pass=id==='crew-check'?result.crewOK:id==='systems-check'?result.returnOK:result.stressOK;
    return pass?updated({...moon.human,checks:{...moon.human.checks,[id]:moon.designSignature}}):session;
  }
  if(event.type==='human-pack'){
    if(step!=='rocket-pack'||event.id!==HUMAN_PACKING[moon.human.packing.length]||!allHumanChecks(moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    return updated({...moon.human,packing:[...moon.human.packing,event.id]});
  }
  return session;
}
