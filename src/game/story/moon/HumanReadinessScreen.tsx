import { lazy, Suspense, useEffect, useState } from 'react';
import { Check, ShieldCheck, Radio, Footprints, Sparkles, Rocket, Users, ShoppingBag, Minus, Plus, LockKeyhole, Info, Download, TriangleAlert } from 'lucide-react';
import type { WorkshopSession, MissionEvent } from '../workshopSession.ts';
import type { SelectionFrame } from '../SelectionScreens.tsx';
import { StoryControls, StoryShell } from '../StoryShell.tsx';
import { EngineerCompanion } from '../EngineerCompanion.tsx';
import { GameInfo } from '../GameInfo.tsx';
import { useGameSettings } from '../gameSettingsContext.ts';
import { sound } from '../../../audio/soundEngine.ts';
import { CheckPath } from './CheckPath.tsx';
import { humanReport, humanCheckAccepted, humanPacked, RETURN_CONNECTIONS, HUMAN_PACKING } from './validation.ts';
import { SUPPLY_PACKS, PLATFORM_NOTES } from './platform.ts';
import { STRESS_ORDER, STRESS_SCENES, stressResult, communicationConditions } from './stress.ts';
import type { StressAction } from './stress.ts';
import { CHECK_LINES } from './checkCopy.ts';
import { emptyTrial } from '../trial.ts';
import { missionCardPNG } from '../missionCard.ts';
import './checks.css';
const CrewViewport=lazy(()=>import('./CrewViewport.tsx').then(m=>({default:m.CrewViewport})));
const TrialViewport=lazy(()=>import('../TrialViewport.tsx').then(m=>({default:m.TrialViewport})));
const titles={'crew-check':'Get the crew ready','systems-check':'Plan the journey home','stress-check':'Practice Moon decisions','rocket-pack':'Secure your spacecraft','launch-ready':'Departure plan ready!'} as const;
const returnNames={ascent:'Ascent engine',service:'Service engine',shield:'Return heat shield',parachutes:'Earth parachutes'} as const;
const packNames={capsule:'Secure crew capsule',lander:'Secure lunar lander',supplies:'Stow crew supplies'} as const;
const sceneSources={
  dust:'https://www.nasa.gov/directorates/stmd/nasa-technologies-aim-to-solve-housekeepings-biggest-issue-dust/',
  communication:'https://www.nasa.gov/communicating-with-missions/lunanet/',
  radiation:'https://ccmc.gsfc.nasa.gov/ISEP/',
};
type Advice=keyof typeof CHECK_LINES;
function Warning({text,children}:{text:string;children?:React.ReactNode}){return <div className="human-warning" role="alert"><TriangleAlert size={27}/><strong>{text}</strong>{children}</div>;}
export function HumanReadinessScreen({session,dispatch,frame,onBack}:{session:WorkshopSession;dispatch(event:MissionEvent):void;frame:SelectionFrame;onBack():void}){
  const {moon,progress,preparation}=session,step=progress.stepId as keyof typeof titles,{effects,gentle}=useGameSettings();
  const report=humanReport(moon,preparation),stress=moon.human.stress,stressId=STRESS_ORDER[stress.passed.length],scene=stressId?STRESS_SCENES[stressId]:null;
  const [info,setInfo]=useState<'rules'|'supplies'|'return'|'practice'|null>(null),[card,setCard]=useState<string|null>(null),[pulse,setPulse]=useState(0),[token,setToken]=useState(0);
  const initial:Advice=step==='crew-check'?(humanCheckAccepted('crew-check',moon,preparation)?'crewPass':'crewIntro'):step==='systems-check'?(humanCheckAccepted('systems-check',moon,preparation)?'returnPass':'returnIntro'):step==='stress-check'?(stressId?`${stressId}Intro` as Advice:'practicePass'):step==='rocket-pack'?(humanPacked(moon,preparation)?'packed':'packIntro'):'ready';
  const [advice,setAdvice]=useState<Advice>(initial);
  const say=(id:Advice,celebrate=false)=>{setAdvice(id);setToken(n=>n+1);sound.setMuted(!effects);if(celebrate) sound.playFanfare(); else sound.playSnap();setPulse(n=>n+1);};
  const accepted=step==='crew-check'||step==='systems-check'?humanCheckAccepted(step,moon,preparation):false;
  const attempt=stress.last,attemptResult=attempt?stressResult(attempt.id,attempt.action,preparation,moon.crew):null;
  const spokenAdvice:Advice=step==='crew-check'&&!report.platform.suppliesOK?'suppliesFail':advice;
  const ready=step==='launch-ready'?!!moon.human.approved&&humanPacked(moon,preparation):step==='rocket-pack'?humanPacked(moon,preparation):step==='stress-check'?stress.passed.length===4:accepted;
  useEffect(()=>{const assist=()=>dispatch({type:'human-assist'});if(step==='stress-check')window.addEventListener('replay-game-help',assist);return()=>window.removeEventListener('replay-game-help',assist);},[step,dispatch]);
  const next=()=>{
    if(step==='crew-check'&&!accepted){dispatch({type:'human-check'});say('crewPass',true);return;}
    if(step==='systems-check'&&!accepted){dispatch({type:'human-check'});say('returnPass',true);return;}
    if(step==='stress-check'&&stressId){if(!attemptResult?.pass)return;dispatch({type:'human-stress-next'});const nextId=STRESS_ORDER[stress.passed.length+1];say(nextId?`${nextId}Intro` as Advice:'practicePass',!nextId);return;}
    if(step==='rocket-pack'&&!ready){dispatch({type:'human-pack',id:HUMAN_PACKING[moon.human.packing.length]});say('packed');return;}
    dispatch({type:'next'});
  };
  const nextDisabled=step==='launch-ready'?!ready:(step==='crew-check'?!ready&&!report.crewOK:step==='systems-check'?!ready&&!report.returnOK:step==='stress-check'?!ready&&!attemptResult?.pass:false);
  const nextLabel=step==='launch-ready'?'Launch pad':step==='crew-check'?accepted?'Next':'Check crew':step==='systems-check'?accepted?'Next':'Check return':step==='stress-check'?ready?'Pack spacecraft':'Next exercise':ready?'Lock departure plan':packNames[HUMAN_PACKING[moon.human.packing.length]];
  const chooseStress=(action:StressAction)=>{if(!stressId)return;const result=stressResult(stressId,action,preparation,moon.crew);dispatch({type:'human-stress',action});say(`${stressId}${result.pass?'Pass':'Fail'}` as Advice,result.pass);if(!result.pass){sound.setMuted(!effects);sound.playBoing();}};
  const ship=<Suspense fallback={<div className="human-loading">Opening spacecraft…</div>}><CrewViewport/></Suspense>;
  const allReturn=RETURN_CONNECTIONS.every(id=>moon.human.connected.includes(id));
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={next} nextLabel={nextLabel} nextDisabled={nextDisabled} progress={<span>Prepare · Checks</span>} nextHint={step==='crew-check'&&!moon.human.cabinSealed?'Seal the red hatch':step==='systems-check'&&!allReturn?'Check four systems':step==='stress-check'&&stressId?`${stress.passed.length+1}/4 practice`:undefined}/> }>
    <main className={`workshop-main human-main human-${step} ${gentle?'is-gentle':''}`} data-stress-mode={stress.mode} id="story-content" tabIndex={-1} aria-labelledby="human-title">
      <div className="human-heading"><h1 id="human-title">{titles[step]}</h1><div><button className="game-info-trigger" onClick={()=>dispatch({type:'visit-crew'})}><Users size={16}/>Edit crew</button><button className="game-info-trigger" onClick={()=>setInfo('rules')}><Info size={16}/>Rules</button></div></div>
      <CheckPath step={step}/>
      <div className="human-layout">
        <section className="human-console" aria-label="Mission check controls">
          {step==='crew-check'?<>
            <div className="human-stat-row"><span><Users size={20}/><strong>3 crew</strong></span><span><Check size={19}/>2 land · 1 orbits</span></div>
            <div className="human-duration"><span>Mission days <button className="human-info" aria-label="Explain mission supplies" onClick={()=>setInfo('supplies')}><Info size={16}/></button></span><button aria-label="One fewer mission day" disabled={moon.plan.days===8} onClick={()=>dispatch({type:'human-days',days:moon.plan.days-1})}><Minus size={18}/></button><strong>{moon.plan.days}</strong><button aria-label="One more mission day" disabled={moon.plan.days===14} onClick={()=>dispatch({type:'human-days',days:moon.plan.days+1})}><Plus size={18}/></button></div>
            <div className="human-supplies"><span>Pack day kits · need {report.platform.requiredCrewDays}</span>{(Object.keys(SUPPLY_PACKS) as ('standard'|'extended')[]).map(id=><button className={`human-supply ${SUPPLY_PACKS[id].crewDays>=report.platform.requiredCrewDays&&!report.platform.suppliesOK?'is-required':''}`} key={id} aria-pressed={moon.plan.supplyPack===id} onClick={()=>{dispatch({type:'human-supplies',pack:id});say('supplies');}}><ShoppingBag size={23}/><strong>{SUPPLY_PACKS[id].crewDays} day kits</strong><span>{id==='standard'?'Standard':'Extended'}</span></button>)}</div>
            {!report.platform.suppliesOK?<Warning text="Not enough day kits!"><button data-primary-action onClick={()=>{dispatch({type:'human-supplies',pack:'extended'});say('supplies');}}>Pack 48 kits →</button></Warning>:null}
            <div className={`human-status ${moon.human.cabinSealed?'is-pass':''}`} role="status">{moon.human.cabinSealed?<><Check/>Cabin sealed</>:<><TriangleAlert/>The red hatch is leaking</>}</div>
          </>:null}
          {step==='systems-check'?<>
            <p className="human-instruction">Check all four return systems.</p><div className="human-connections">{RETURN_CONNECTIONS.map(id=><button key={id} className={`human-connect ${moon.human.connected.includes(id)?'is-connected':''}`} aria-pressed={moon.human.connected.includes(id)} onClick={()=>{dispatch({type:'human-connect',id});say(id);}}>{moon.human.connected.includes(id)?<Check size={23}/>:id==='shield'?<ShieldCheck size={23}/>:id==='parachutes'?<Footprints size={23}/>:<Rocket size={23}/>}<strong>{returnNames[id]}</strong><span>{moon.human.connected.includes(id)?'Connected':'Tap to test'}</span></button>)}</div>
            <div className={`human-status ${report.platform.propulsionOK?'is-pass':''}`}><Rocket size={20}/>{report.platform.propulsionOK?'Fuel covers descent, ascent & Earth return':'Not enough maneuver fuel'}</div><button className="game-info-trigger" onClick={()=>setInfo('return')}><Info size={17}/>Fuel & return details</button>
          </>:null}
          {step==='stress-check'?<>
            <div className="human-mode" aria-label="Practice mode">{(['guided','challenge'] as const).map(mode=><button key={mode} aria-pressed={stress.mode===mode} onClick={()=>dispatch({type:'human-mode',mode})}>{mode==='guided'?'Guided':'Challenge'}</button>)}</div>
            <div className="human-practice-progress">{STRESS_ORDER.map((id,i)=><span key={id} className={i<stress.passed.length?'is-pass':i===stress.passed.length?'is-current':''}>{i<stress.passed.length?<Check size={16}/>:i+1}{id==='mobility'?'Route':id==='communication'?'Radio':id==='radiation'?'Shelter':'Dust'}</span>)}</div>
            {scene?<><h2>{scene.title}</h2><p>{scene.text}</p><div className="human-stress-actions">{scene.options.map(option=><button key={option.id} className={`human-stress-option ${stress.mode==='guided'&&option.id===scene.hint?'is-hinted':''}`} data-stress-hint={option.id===scene.hint?'true':undefined} onClick={()=>chooseStress(option.id)}>{option.label}{stress.mode==='guided'&&option.id===scene.hint?<Sparkles size={18}/>:null}</button>)}</div>{attemptResult?<div className={`human-stress-result ${attemptResult.pass?'is-pass':'is-failed'}`} role={attemptResult.pass?'status':'alert'}>{attemptResult.pass?<Check/>:<TriangleAlert/>}<span>{attemptResult.text}{attempt?.id==='mobility'?<small>{attemptResult.energyWh.toFixed(1)} Wh · practice energy</small>:null}</span></div>:null}</>:<div className="human-practice-done"><ShieldCheck size={50}/><h2>Practice passed!</h2><p>Four safe decisions. Ready to pack.</p></div>}
            <button className="game-info-trigger" onClick={()=>setInfo('practice')}><Info size={16}/>Practice details</button>
          </>:null}
          {step==='rocket-pack'?<><h2>Secure the flight kit.</h2><div className="human-pack-list">{HUMAN_PACKING.map((id,index)=><button className={`human-pack-item ${index<moon.human.packing.length?'is-packed':''}`} key={id} disabled={index!==moon.human.packing.length} onClick={()=>{dispatch({type:'human-pack',id});say('packed');}}>{index<moon.human.packing.length?<Check size={25}/>:<PackageIcon id={id}/>}<strong>{packNames[id]}</strong></button>)}</div><div className="human-status is-pass">{moon.human.packing.length}/3 secured</div></>:null}
          {step==='launch-ready'?<><div className="human-ready-medal"><ShieldCheck size={54}/></div><h2>All checks passed!</h2><div className="human-manifest-summary"><span>Equipment<strong>{report.equipment.credits}/1000 cr · {report.equipment.massKg}/350 kg</strong></span><span>Crew<strong>{report.crew.credits}/240 cr · {report.crew.massKg} kg</strong></span><span>Duration<strong>{moon.plan.days} days + 2 spare</strong></span><span>Practice<strong>{stress.assisted?'Guided':'Challenge'} · 4/4</strong></span></div><button className="conversation-next human-card" onClick={()=>setCard(missionCardPNG(session))}><Download size={20}/>Mission card</button><a className="game-info-trigger" download="zero-to-beyond-departure-plan.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(moon.human.approved,null,2))}`}><Download size={16}/>Save flight plan</a><p className="human-module-note">Plan locked. Your crew can launch!</p></>:null}
          <EngineerCompanion reaction={step==='launch-ready'||ready?'complete':(attemptResult&&!attemptResult.pass||step==='crew-check'&&!report.platform.suppliesOK)?'warning':'intro'} token={token} voiceEnabled={frame.voiceEnabled??true} scriptedReply={{id:`check-${spokenAdvice}`,text:CHECK_LINES[spokenAdvice]}}/>
        </section>
        <section className={`human-scene ${step==='stress-check'&&stressId==='dust'?'is-dusty':''} ${attemptResult?.pass?'is-resolved':''}`} aria-label="3D mission rehearsal">
          {step==='stress-check'&&stressId&&stressId!=='radiation'?<Suspense fallback={<div className="human-loading">Opening Moon practice…</div>}><TrialViewport preparation={preparation} trial={{...emptyTrial(),phase:attemptResult?.pass?'complete':'ready'}} position={attemptResult?.pass&&stressId==='mobility'?.8:stressId==='communication'?(attemptResult?.pass?.65:.2):0}/></Suspense>:ship}
          <div className="human-scene-label">{step==='stress-check'?'GROUND REHEARSAL · NO SCIENCE EARNED':'CREW SPACECRAFT · 3D'}</div>
          {step==='crew-check'?<button className={`human-hatch ${moon.human.cabinSealed?'is-sealed':''}`} data-primary-action={!moon.human.cabinSealed?true:undefined} onClick={()=>{dispatch({type:'human-seal'});say('sealed');}} aria-label={moon.human.cabinSealed?'Cabin hatch sealed':'Seal the leaking cabin hatch'}>{moon.human.cabinSealed?<Check size={30}/>:<TriangleAlert size={30}/>}<strong>{moon.human.cabinSealed?'Sealed':'Seal cabin'}</strong></button>:null}
          {step==='systems-check'?<div className="human-return-path"><span>Moon surface</span><i className={moon.human.connected.includes('ascent')?'done':''}>↑</i><span>Lunar orbit</span><i className={moon.human.connected.includes('service')?'done':''}>→</i><span>Earth</span></div>:null}
          {step==='stress-check'&&stressId==='dust'?<div className="human-dust-overlay" aria-hidden="true"><i/><i/><i/><i/><span>{attemptResult?.pass?'Lens cleared':'Dust on the lens'}</span></div>:null}
          {step==='stress-check'&&stressId==='communication'?<div className={`human-radio-link ${attemptResult?.pass?'is-connected':''}`}><Radio size={38}/><span>{attemptResult?.pass?'Signal restored':'Signal blocked by terrain'}</span><small>{communicationConditions(preparation,!!attemptResult?.pass,300).rangeM} m authored radio range</small></div>:null}
          {step==='stress-check'&&stressId==='radiation'?<div className={`human-shelter ${attemptResult?.pass?'is-sheltered':''}`}><ShieldCheck size={42}/><span>{attemptResult?.pass?'Team in lander shelter':'Surface team: seek shelter'}</span></div>:null}
          {step==='rocket-pack'?<div className="human-securing"><LockKeyhole size={32}/><span>{moon.human.packing.length}/3 secured</span></div>:null}
          {pulse>0?<div key={pulse} className="human-scan-pulse" aria-hidden="true"/>:null}
          <button className="human-scene-info" aria-label="Explain spacecraft and game model" onClick={()=>setInfo('rules')}><Info size={20}/></button>
        </section>
      </div>
    </main>
    {info?<GameInfo title={info==='supplies'?'Crew day kits':info==='return'?'Your return fuel':info==='practice'?'Moon practice':'Game model & sources'} onClose={()=>setInfo(null)} pages={info==='supplies'?[<div key="kits"><p>One day kit supports one explorer for one day. Three explorers need three kits each day.</p><p>Your {moon.plan.days}-day plan has 2 spare days: 3 × {moon.plan.days+2} = {report.platform.requiredCrewDays} kits.</p><p>These are game supply units. They include a simplified food, water and oxygen allowance.</p></div>]:info==='return'?[<div key="fuel">{(['descent','ascent','service'] as const).map(id=><p key={id}><strong>{id==='service'?'Lunar insertion & Earth return':id}</strong><br/>{Math.round(report.platform[id].availableMS)} m/s available · {Math.round(report.platform[id].requiredMS)} m/s needed</p>)}<p>Includes a 5% game maneuver margin. This ideal calculation is not flight certification.</p><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/" target="_blank" rel="noreferrer">NASA: rocket equation ↗</a></div>]:info==='practice'?[<div key="surface"><p>Your rover’s terrain rating, driving load and crew help are used in the route preview.</p><p>A blocked line of sight stops either radio. Dust reduces camera visibility. During a particle alert, stop EVA and use shelter.</p><p>Radio ranges and terrain thresholds are game rules. Radiation dose and real shelter performance are not simulated.</p>{Object.entries(sceneSources).map(([id,url])=><p key={id}><a href={url} target="_blank" rel="noreferrer">NASA: {id} ↗</a></p>)}</div>]:PLATFORM_NOTES.map((note,index)=><p key={index}>{note}</p>)}/>:null}
    {card?<GameInfo title="Your mission card" onClose={()=>setCard(null)} pages={[<div key="card"><img className="mission-card-preview" src={card} alt="Your crewed departure plan"/><a className="game-info-trigger" download="zero-to-beyond-mission.png" href={card}><Download size={18}/>Download PNG</a></div>]}/>:null}
  </StoryShell>;
}
function PackageIcon({id}:{id:'capsule'|'lander'|'supplies'}){return id==='supplies'?<ShoppingBag size={25}/>:<Rocket size={25}/>;}
