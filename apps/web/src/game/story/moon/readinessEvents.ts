import type { WorkshopSession } from '../workshopSession.ts';
import { emptyReadiness, allChecksAccepted } from '../readiness.ts';
import { emptyFlight } from '../flight.ts';
import { syncMoonDesign } from './session.ts';
import { humanReport, humanCheckAccepted, allHumanChecks, HUMAN_CHECKS, RETURN_CONNECTIONS, HUMAN_PACKING } from './validation.ts';
import type { HumanCheck, HumanPack, ReturnConnection } from './validation.ts';
import { stressComplete, STRESS_ORDER, STRESS_SCENES } from './stress.ts';
import type { StressAction, StressMode } from './stress.ts';
import { verifiedActivities } from '../preparation.ts';
import { GEOLOGY_PROPULSION, GEOLOGY_CABINS, GEOLOGY_LIFE_SUPPORT } from './geologyBudget.ts';
import type { GeologyPropulsion, GeologyCabin, GeologyLifeSupport } from './geologyBudget.ts';
import { reduceReturnTest } from './returnTests.ts';
import type { ReturnTestAction } from './returnTests.ts';
import { reducePackingGame, emptyPackingGame } from './packingGame.ts';
import type { PackingGameAction } from './packingGame.ts';
import { reduceRocketAssembly, emptyRocketAssembly } from './rocketAssembly.ts';
import type { RocketAssemblyEvent } from './rocketAssembly.ts';
import { humanPacked } from './validation.ts';

export type HumanEvent = {type:'human-days';days:number}|{type:'human-supplies';pack:'standard'|'extended'}|{type:'human-propulsion';pack:GeologyPropulsion}
  |{type:'human-cabin';pack:GeologyCabin}|{type:'human-life-support';pack:GeologyLifeSupport}
  |{type:'human-seal'}|{type:'human-connect';id:ReturnConnection}|{type:'human-check'}
  |{type:'human-mode';mode:StressMode}|{type:'human-stress';action:StressAction}|{type:'human-stress-next'}|{type:'human-stress-restart'}
  |{type:'human-assist'}|{type:'human-pack';id:HumanPack}|{type:'visit-crew'}|ReturnTestAction|PackingGameAction|RocketAssemblyEvent;
/** Every interaction is bound to its real stage and current design. No preview button awards flight/science. */
export function reduceHumanEvent(session:WorkshopSession,event:HumanEvent):WorkshopSession{
  const {moon,preparation,progress}=session,step=progress.stepId;
  if(!['prepare','validate'].includes(moon.phase))return session;
  if(event.type==='visit-crew')return {...session,repair:undefined,progress:{...progress,stepId:'crew-selection',lineIndex:0,history:[...progress.history,{stepId:step,lineIndex:progress.lineIndex}]}};
  if(event.type==='human-days'||event.type==='human-supplies'||event.type==='human-propulsion'||event.type==='human-cabin'||event.type==='human-life-support'){
    if(step!=='crew-check')return session;
    if(event.type==='human-days'&&(!Number.isInteger(event.days)||event.days<8||event.days>14))return session;
    if(event.type==='human-supplies'&&!['standard','extended'].includes(event.pack))return session;
    if(event.type==='human-propulsion'&&(!Object.hasOwn(GEOLOGY_PROPULSION,event.pack)||moon.objective!=='lunar-geology'))return session;
    if(event.type==='human-cabin'&&(!Object.hasOwn(GEOLOGY_CABINS,event.pack)||moon.objective!=='lunar-geology'))return session;
    if(event.type==='human-life-support'&&(!Object.hasOwn(GEOLOGY_LIFE_SUPPORT,event.pack)||moon.objective!=='lunar-geology'))return session;
    const plan={...moon.plan,...(event.type==='human-days'?{days:event.days}:event.type==='human-supplies'?{supplyPack:event.pack}:event.type==='human-propulsion'?{propulsionPack:event.pack}:event.type==='human-cabin'?{cabinPack:event.pack}:{lifeSupportPack:event.pack})};
    if(JSON.stringify(plan)===JSON.stringify(moon.plan))return session;
    const next=syncMoonDesign({...moon,plan,designSignature:''},progress,preparation);
    return {...session,moon:next,readiness:emptyReadiness(),flight:emptyFlight(),progress:{...progress,completedActivities:progress.completedActivities.filter(id=>verifiedActivities(preparation,progress.selections.objective).includes(id)||['crew-selection','crew-plan'].includes(id))}};
  }
  const updated=(human:typeof moon.human):WorkshopSession=>({...session,moon:{...moon,phase:'prepare',human:{...human,signature:moon.designSignature,approved:null},launchSnapshot:null,checkpoints:[]},flight:emptyFlight()});
  if(event.type.startsWith('rocket-build-')){
    if(step!=='rocket-assembly'||!humanPacked(moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const rocketBuild=reduceRocketAssembly(moon.human.rocketBuild,event as RocketAssemblyEvent);
    return rocketBuild===moon.human.rocketBuild?session:updated({...moon.human,rocketBuild});
  }
  if(event.type==='human-seal'){
    if(step!=='crew-check'||moon.human.cabinSealed)return session;
    return updated({...moon.human,cabinSealed:true});
  }
  if(event.type==='human-connect'){
    if(step!=='systems-check'||!RETURN_CONNECTIONS.includes(event.id)||!humanCheckAccepted('crew-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    if(moon.human.returnTest.phase!=='passed'||moon.human.returnTest.id!==event.id)return session;
    return moon.human.connected.includes(event.id)?session:updated({...moon.human,connected:[...moon.human.connected,event.id]});
  }
  if(event.type.startsWith('return-test-')){
    if(step!=='systems-check'||!humanCheckAccepted('crew-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const action=event as ReturnTestAction;
    if(action.type==='return-test-select'&&!RETURN_CONNECTIONS.includes(action.id))return session;
    const returnTest=reduceReturnTest(moon.human.returnTest,action);
    if(returnTest===moon.human.returnTest)return session;
    const connected=returnTest.phase==='passed'&&!moon.human.connected.includes(returnTest.id)?[...moon.human.connected,returnTest.id]:moon.human.connected;
    const human={...moon.human,returnTest,connected};
    if(RETURN_CONNECTIONS.every(id=>connected.includes(id))&&humanReport(moon,preparation).platform.propulsionOK)human.checks={...human.checks,'systems-check':moon.designSignature};
    return updated(human);
  }
  if(event.type.startsWith('packing-game-')){
    if(step!=='rocket-pack'||!allHumanChecks(moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const action=event as PackingGameAction;
    if(action.type==='packing-game-select'&&(!HUMAN_PACKING.includes(action.id)||HUMAN_PACKING.indexOf(action.id)>moon.human.packing.length))return session;
    const packingGame=reducePackingGame(moon.human.packingGame,action);
    if(packingGame===moon.human.packingGame)return session;
    const packing=packingGame.phase==='passed'&&packingGame.id===HUMAN_PACKING[moon.human.packing.length]?[...moon.human.packing,packingGame.id]:moon.human.packing;
    return updated({...moon.human,packingGame,packing});
  }
  if(event.type==='human-assist') return step==='stress-check' ? updated({...moon.human,stress:{...moon.human.stress,assisted:true}}) : session;
  if(event.type==='human-mode'){
    if(step!=='stress-check'||!['guided','challenge'].includes(event.mode))return session;
    return updated({...moon.human,stress:{...moon.human.stress,mode:event.mode}});
  }
  if(event.type==='human-stress-restart'){
    if(step!=='stress-check')return session;
    return updated({...moon.human,checks:{...moon.human.checks,'stress-check':undefined},packing:[],packingGame:emptyPackingGame(),rocketBuild:emptyRocketAssembly(),stress:{signature:null,mode:'challenge',passed:[],last:null,assisted:false}});
  }
  if(event.type==='human-stress'){
    if(step!=='stress-check'||!humanCheckAccepted('systems-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const stress=moon.human.stress,id=STRESS_ORDER[stress.passed.length];if(!id||!STRESS_SCENES[id].options.some(option=>option.id===event.action))return session;
    const attempt={id,action:event.action};
    if(stress.last)return session;
    return updated({...moon.human,stress:{...stress,signature:moon.designSignature,last:attempt,passed:stress.passed}});
  }
  if(event.type==='human-stress-next'){
    if(step!=='stress-check'||!humanCheckAccepted('systems-check',moon,preparation)||!allChecksAccepted(progress,preparation,session.readiness,moon))return session;
    const stress=moon.human.stress,id=STRESS_ORDER[stress.passed.length],attempt=stress.last;
    if(!id||attempt?.id!==id)return session;
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
    if(moon.human.packingGame.phase!=='passed'||moon.human.packingGame.id!==event.id)return session;
    return updated({...moon.human,packing:[...moon.human.packing,event.id]});
  }
  return session;
}
