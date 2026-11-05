import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Bot, Check, CheckCircle2, Coins, FlaskConical, Gem, Info, Orbit, Rocket, Trash2, Users, Wrench } from 'lucide-react';
import { CREW_CANDIDATES, crewCapabilities, crewReport } from '@/game/moon/shared/catalog';
import { moonDesignReport } from '@/game/moon/shared/session';
import { CREW_ADVICE } from './crewDialogue';
import { MOON_RULES, MOON_SOURCES } from '@/game/moon/shared/rules';
import { preparationTotals } from '@/game/moon/core/preparation';
import { rehearsalBudget } from '@/game/moon/shared/resources';
import { geologyBudget } from '@/game/moon/science/geologyBudget';
import type { MissionEvent, WorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import type { SelectionFrame } from './SelectionScreens';
import { StoryShell, StoryControls } from '@/shared/shell';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import { GameInfo } from '@exo/ui';
import { sound } from '@exo/audio';
import { useGameSettings } from '@/shared/shell';
import './selection.css';

const CrewViewport=lazy(()=>import('./CrewViewport.tsx').then(module=>({default:module.CrewViewport})));
const roster = {
  geologist:{name:'Geologist',job:'Find rock clues',skill:'Mineral interpretation hints',icon:Gem,color:'#b892ef'},
  astrobiologist:{name:'Astrobiologist',job:'Find water clues',skill:'Water and volatile interpretation hints',icon:FlaskConical,color:'#66d5ce'},
  'robotics-specialist':{name:'Robotics expert',job:'Plan gentler drives',skill:'10% lower driving load in the team rehearsal',icon:Bot,color:'#f2ca72'},
  'systems-engineer':{name:'Systems engineer',job:'Help fix systems',skill:'Power, thermal and radio repair advice',icon:Wrench,color:'#f393aa'},
} as const;
type Specialist=keyof typeof roster;
function CandidatePortrait({id}:{id:Specialist}){
  return <img src={`/story/crew-portraits/${id}.webp`} alt="" draggable={false} />;
}

export function CrewScreen({session,dispatch,frame,onBack}:{session:WorkshopSession;dispatch(event:MissionEvent):void;frame:SelectionFrame;onBack():void}){
  const {effects}=useGameSettings(),review=session.progress.stepId==='crew-plan';
  const [selected,setSelected]=useState<Specialist|null>(null),[dragging,setDragging]=useState<{id:Specialist;x:number;y:number}|null>(null);
  const [advice,setAdvice]=useState<keyof typeof CREW_ADVICE>('intro'),[token,setToken]=useState(0),[info,setInfo]=useState<Specialist|'platform'|'budget'|null>(null);
  const pointer=useRef<{id:Specialist;pointerId:number;startX:number;startY:number;moved:boolean}|null>(null),suppress=useRef(false);
  const slots=useRef<Partial<Record<'scientist'|'support',HTMLButtonElement|null>>>({});
  const crew=crewReport(session.moon.crew),report=moonDesignReport(session.moon,session.preparation),totals=preparationTotals(session.preparation);
  const geology=session.moon.objective==='lunar-geology'?geologyBudget(session.preparation,session.moon.crew,session.moon.plan):null;
  const baseline=rehearsalBudget(report.equipment.parts,session.preparation.drillDepthCm),savedWh=Math.max(0,baseline.requiredWh-report.rehearsal.requiredWh);
  const capabilities=crewCapabilities(session.moon.crew);
  const message=CREW_ADVICE[review?'complete':advice];
  const say=(id:keyof typeof CREW_ADVICE)=>{setAdvice(id);setToken(value=>value+1);};
  const assign=(role:'scientist'|'support',id:Specialist|null)=>{
    if(review||!id)return;
    const candidate=CREW_CANDIDATES.find((person: (typeof CREW_CANDIDATES)[number])=>person.id===id)!;
    if(candidate.role!==(role==='scientist'?'science':'support')){say(role==='scientist'?'wrongScience':'wrongSupport');sound.setMuted(!effects);sound.playBoing();return;}
    dispatch({type:'moon-assign-crew',role,id});setSelected(null);sound.setMuted(!effects);sound.playSnap();
    say(id==='robotics-specialist'?'robotics':id==='systems-engineer'?'systems':id);
  };
  const begin=(event:React.PointerEvent<HTMLButtonElement>,id:Specialist)=>{if(event.button!==0||!event.isPrimary||review)return;suppress.current=false;pointer.current={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);};
  const move=(event:React.PointerEvent<HTMLButtonElement>)=>{const active=pointer.current;if(!active||active.pointerId!==event.pointerId)return;if(Math.hypot(event.clientX-active.startX,event.clientY-active.startY)>7)active.moved=true;if(active.moved){suppress.current=true;setDragging({id:active.id,x:event.clientX,y:event.clientY});}};
  const end=(event:React.PointerEvent<HTMLButtonElement>)=>{const active=pointer.current;if(!active||active.pointerId!==event.pointerId)return;
    if(active.moved){for(const role of ['scientist','support'] as const){const rect=slots.current[role]?.getBoundingClientRect();if(rect&&event.clientX>=rect.left-12&&event.clientX<=rect.right+12&&event.clientY>=rect.top-12&&event.clientY<=rect.bottom+12){assign(role,active.id);break;}}}
    pointer.current=null;setDragging(null);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
  const cancel=()=>{pointer.current=null;setDragging(null);suppress.current=true;};
  useEffect(() => { const stop = () => { pointer.current = null; setDragging(null); suppress.current = true; }; window.addEventListener('blur', stop); window.addEventListener('game-help-open', stop); return () => { window.removeEventListener('blur', stop); window.removeEventListener('game-help-open', stop); }; }, []);
  const complete=crew.complete&&(geology?.valid??crew.credits<=MOON_RULES.crewCredits);
  const next=()=>{sound.setMuted(!effects);sound.playFanfare();dispatch({type:'next'});};
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={next} nextDisabled={!complete} nextLabel={review?'Flight checks':'Save crew'} progress={<span>Prepare · Crew</span>} nextHint={review?'Flight checks come next':!session.moon.crew.scientist?'Match a science expert':!session.moon.crew.support?'Match a support expert':undefined}/> }>
    <main className="crew-main" data-moon-objective={session.moon.objective} id="story-content" tabIndex={-1} aria-labelledby="crew-title">
      <div className="workshop-top-row crew-top"><div className="workshop-heading"><div><h1 id="crew-title">{review?'Crew assembled!':'Choose your crew'}</h1><p>{review?'Your team and equipment are ready.':'Drag an expert to a job, or tap an expert and a seat.'}</p></div></div>
        <EngineerCompanion reaction={review?'complete':'intro'} token={token} voiceEnabled={frame.voiceEnabled??true} scriptedReply={{id:`crew-advice-${review?'complete':advice}`,text:message}}/>
      </div>
      <div className="crew-layout">
        <section className="crew-roster" aria-label="Crew candidates">
          <div className="crew-command"><span className="crew-command-icon"><Rocket size={24}/></span><div><strong>{session.progress.playerName||'Commander'}</strong><span>Commander · surface team</span></div><CheckCircle2 size={22}/></div>
          <div className="crew-candidate-grid">{(Object.keys(roster) as Specialist[]).map(id=>{const data=roster[id],candidate=CREW_CANDIDATES.find((person: (typeof CREW_CANDIDATES)[number])=>person.id===id)!,assigned=session.moon.crew.scientist===id||session.moon.crew.support===id;const Icon=data.icon;
            return <article className={`crew-candidate ${selected===id?'is-picked':''} ${assigned?'is-assigned':''}`} key={id} style={{'--candidate-color':data.color} as React.CSSProperties}>
              <button className="crew-candidate-info" aria-label={`About ${data.name}`} onClick={()=>setInfo(id)}><Info size={15}/></button>
              <button className="moon-crew-pick" data-crew-id={id} aria-label={`Choose ${data.name}`} aria-pressed={selected===id} disabled={review} onPointerDown={event=>begin(event,id)} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={()=>{if(pointer.current?.id===id)cancel();}}
                onClick={()=>{if(suppress.current){suppress.current=false;return;}setSelected(id);say(candidate.role==='science'?'scienceSeat':'supportSeat');}}>
                <CandidatePortrait id={id}/><strong>{data.name}</strong><span><Icon size={13}/>{data.job}</span><small>{assigned?'✓ Assigned':geology?`${candidate.massKg} kg · crew systems included`:`${candidate.credits} cr · ${candidate.massKg} kg`}</small>
              </button>
            </article>;
          })}</div>
          <div className="crew-accounts"><div><Coins size={17}/><span>{geology?'Mission budget':'Crew allocation'}</span><strong>{geology?`${geology.spent}/10,000 MC`:`${crew.credits}/${MOON_RULES.crewCredits} cr`}</strong><button aria-label="Explain crew allocation" onClick={()=>setInfo('budget')}><Info size={16}/></button></div><div><Users size={17}/><span>Crew mass</span><strong>{crew.massKg} kg</strong></div><div><span>{geology?'Moon payload':'Ice kit'}</span><strong>{geology?`${totals.massKg}/350 kg`:`${totals.credits}/1000 cr · ${totals.massKg}/350 kg`}</strong></div></div>
        </section>
        <section className="crew-mission-board" aria-label="Match experts to mission roles">
          <div className="crew-role-slots">{(['scientist','support'] as const).map(role=>{const id=session.moon.crew[role] as Specialist|null;return <div key={role} className={`crew-role ${id?'is-filled':''} ${selected?'is-target':''}`}>
            <button className="moon-crew-seat" data-crew-role={role} ref={node=>{slots.current[role]=node;}} disabled={review} onClick={()=>assign(role,selected)} aria-label={`Assign ${role==='scientist'?'science':'support'} seat`}>
              {id?<CandidatePortrait id={id}/>:role==='scientist'?<FlaskConical size={23}/>:<Orbit size={23}/>}<span>{role==='scientist'?'Science seat':'Support seat'}</span><strong>{id?roster[id].name:'Choose an expert'}</strong><small>{role==='scientist'?'Lands with you':'Stays in lunar orbit'}</small>{id?<Check size={18}/>:null}
            </button>{id&&!review?<button className="crew-unassign" aria-label={`Remove ${role==='scientist'?'scientist':'support expert'}`} onClick={()=>{dispatch({type:'moon-remove-crew',role});say('open');}}><Trash2 size={14}/></button>:null}
          </div>;})}</div>
          <div className="crew-platform-bay"><span className="crew-platform-badge">YOUR MISSION SPACECRAFT</span><button className="crew-platform-info" aria-label="Explain mission spacecraft" onClick={()=>setInfo('platform')}><Info size={18}/></button><Suspense fallback={<div className="crew-model-fallback">Opening your spacecraft…</div>}><CrewViewport/></Suspense><div className="crew-platform-labels"><span>Crew capsule · return shield</span><span>Lunar lander · ascent stage</span></div></div>
          <div className="crew-skills" aria-label="Selected crew abilities"><div><FlaskConical size={17}/><span>{capabilities.interpretation==='minerals'?'Rock clues helped':capabilities.interpretation==='volatiles'?'Water clues helped':'Choose a science helper'}</span></div><div>{session.moon.crew.support==='robotics-specialist'?<Bot size={17}/>:<Wrench size={17}/>}<span>{session.moon.crew.support==='robotics-specialist'?`Drive rehearsal saves ${savedWh.toFixed(1)} Wh`:session.moon.crew.support==='systems-engineer'?'Repair advice: power · heat · radio':'Choose a support helper'}</span></div><small>Game abilities · equipment limits still apply</small></div>
        </section>
      </div>
      <span className="visually-hidden" role="status">{message}</span>
      {dragging?<div className="crew-drag-ghost" style={{left:dragging.x,top:dragging.y}} aria-hidden="true"><CandidatePortrait id={dragging.id}/><strong>{roster[dragging.id].name}</strong></div>:null}
    </main>
    {info?<GameInfo title={info==='platform'?'Your mission spacecraft':info==='budget'?geology?'One mission budget':'Two separate allocations':roster[info].name} onClose={()=>setInfo(null)} pages={[
      <div key="explain">{info==='platform'?<><p>Two explorers land on the Moon. One stays with the crew capsule in orbit.</p><p>The lander brings them back to orbit. The capsule and heat shield bring everyone home.</p><a href={MOON_SOURCES.apollo} target="_blank" rel="noreferrer">NASA: Apollo architecture ↗</a></>:info==='budget'?geology?<><p>Everything in this Geology mission shares 10,000 MC. The platform, launch, crew systems, rover and power are already included. Science tools and upgrades add cost.</p><p>MC values are fictional game credits.</p></>:<><p>Your equipment has 1,000 credits and 350 kg. Your three-person crew has a separate 240-credit allocation.</p><p>The full-size crew spacecraft, life support and return fuel are supplied separately. These are game allocations, not real mission costs.</p></>:<><p>{roster[info].skill}.</p><p>{geology?'Crew systems already in mission budget':`${CREW_CANDIDATES.find((person: (typeof CREW_CANDIDATES)[number]) => person.id === info)?.credits} credits`} · {CREW_CANDIDATES.find((person: (typeof CREW_CANDIDATES)[number]) => person.id === info)?.massKg} kg</p><p>{info==='robotics-specialist'?'Gentler route planning reduces the driving load by 10% in this game. It does not increase battery capacity.':info==='systems-engineer'?'The engineer adds advice for three repair types. Fixes still need suitable equipment and resources.':'This specialist helps interpret clues. Evidence and successful observations still decide the result.'}</p></>}</div>
    ]}/>:null}
  </StoryShell>;
}
