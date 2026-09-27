import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Flag, Heart, Pause, Play, Radio, Rocket, ShieldCheck, SkipForward, Sparkles } from 'lucide-react';
import { useMissionStore } from '../state/missionStore';
import { sampleAscentTelemetry } from '../engine/ascent-profile';
import { sound } from '../audio/soundEngine';
import { Guide } from './shared';

const FlightScene3D = lazy(() => import('./FlightScene3D').then(m => ({ default: m.FlightScene3D })));
const OrbitScene3D = lazy(() => import('./FlightScene3D').then(m => ({ default: m.OrbitScene3D })));

export function Flight() {
 const phase=useMissionStore(s=>s.currentPhase);const installed=useMissionStore(s=>s.installedParts);const reducedMotion=useMissionStore(s=>s.audioSettings.reducedMotion);
 const [checks,setChecks]=useState<string[]>([]);const [count,setCount]=useState<number|null>(null);
 const [time,setTime]=useState(0);const [released,setReleased]=useState(0);const [paused,setPaused]=useState(false);
 const lastEvent=useRef('');
 const waitForStage=phase==='ascent'&&((time>=162&&released===0)||(time>=520&&released===1));
 const telemetry=sampleAscentTelemetry(time/720);
 const escapeReleased=time>=195;
 const isCoasting=time>=695;
 const landed=phase==='orbit';
 const enginesOn=phase==='ascent'&&!waitForStage&&!paused&&time<695;
 useEffect(()=>{
  if(count===null)return;
  const timer=window.setTimeout(()=>{
   if(count===0){sound.playCountdownBeep(true);setCount(null);setTime(0);useMissionStore.getState().setPhase('ascent');}
   else {sound.playCountdownBeep();setCount(c=>c===null?null:c-1);}
  },count===0?200:1000);
  return()=>clearTimeout(timer);
 },[count]);
 useEffect(()=>{
  if(phase!=='ascent'||paused||waitForStage)return;
  const timer=window.setInterval(()=>{if(document.hidden)return;setTime(t=>Math.min(released===0?162:released===1?520:720,t+1.2));},100);
  return()=>clearInterval(timer);
 },[phase,paused,waitForStage,released]);
 useEffect(()=>{if(time>=720&&phase==='ascent'){sound.playOrbitHarmony();useMissionStore.getState().setPhase('orbit');}},[time,phase]);
 useEffect(()=>{useMissionStore.getState().setAscentProgress(time/720);},[time]);
 useEffect(()=>{
  if(phase!=='ascent')return;
  const key=time>=695?'orbit':time>=520?'stage2':time>=195?'tower':time>=162?'stage1':time>=72?'maxq':'liftoff';
  if(key!==lastEvent.current){lastEvent.current=key;sound.playRadioBeep();}
 },[time,phase]);
 useEffect(()=>{
  if(phase==='ascent'&&!paused&&!waitForStage&&!isCoasting) sound.startRocketRoar();
  else sound.stopRocketRoar();
  return()=>sound.stopRocketRoar();
 },[phase,paused,waitForStage,isCoasting]);
 useEffect(()=>{if(phase==='ascent'&&!paused&&!waitForStage&&!isCoasting) sound.updateRocketIntensity(.55,Math.min(1,time/195));},[phase,paused,waitForStage,isCoasting,time]);
 const eventTitle=time>=695?'Hello, Earth orbit!':waitForStage?released===0?'Time to drop some weight!':'One last push!':time>=520?'Our orbit engine is on!':time>=195?'Goodbye, escape tower!':time>=162?'Second stage, let’s go!':time>=72?'Through the thickest air!':'We have liftoff!';
 const lesson=waitForStage?(released===0?'Our booster has used its fuel. Release it so the lighter rocket can keep going.':'Stage two has finished its job. Release it and let the orbit engine take over.'):time>=695?'Engines off! We are moving fast enough to keep circling Earth.':time>=520?'The third stage builds sideways speed. Orbit needs speed, not just height.':time>=195?'We are high above the thick air. The escape tower has finished its job.':time>=162?'Our second stage is lighter. It keeps us climbing and speeding up.':time>=72?'This is Max-Q: the strongest push from the air. Our rocket is holding steady.':'Look! Your rocket is carrying your crew into the sky.';
 function start(){const s=useMissionStore.getState();if(!s.prepareLaunch()){s.setPhase('readiness');return;}setCount(5);}
 function release(){sound.playStagingThud();setReleased(n=>n+1);setTime(t=>t+1.2);}
 function skipFlight(){sound.stopRocketRoar();setPaused(false);setReleased(2);setTime(720);useMissionStore.getState().setAscentProgress(1);useMissionStore.getState().setPhase('orbit');}
 if(landed)return <div className="chapter orbit-chapter"><div className="orbit-celebration"><Suspense fallback={null}><OrbitScene3D/></Suspense><div className="orbit-copy"><span className="label-tag light"><Sparkles size={16}/> CHAPTER COMPLETE</span><h1>You built it.<br/>You launched it.<br/><em>You did it!</em></h1><p>Your crew is safely circling Earth.<br/>The Moon is our next chapter.</p><div className="earned-badges"><span><Rocket/>Rocket builder</span><span><Heart/>Crew captain</span><span><Flag/>Orbit explorer</span></div><button className="primary" onClick={()=>useMissionStore.getState().openComingSoon('Next stop: the Moon','Moon travel, landing and your lunar base are coming in a future chapter. Today, you mastered launch!')}>What’s next?<ArrowRight size={19}/></button><button className="text-btn light-text" onClick={()=>useMissionStore.getState().setPhase('assembly')}>Back to my rocket</button></div><div className="orbit-stamp"><span>MISSION ONE</span><strong>★</strong><span>EARTH ORBIT</span></div></div><Guide person="leo" text="Every big discovery starts with someone curious. Today, that someone was you."/></div>;
 return <div className="chapter flight-chapter">
  <div className={`flight-workspace ${phase==='ascent'?'flying':''} ${paused||waitForStage?'paused':''}`}>
   <aside className="flight-control-panel flight-copy"><span className="label-tag">{phase==='launchpad'?'THE BIG MOMENT':'YOUR FLIGHT · 3D LAUNCH'}</span><h1>{phase==='launchpad'?<>From your hands<br/>to the stars<span className="dot">.</span></>:eventTitle}</h1>
    {phase==='launchpad'?<><p>Your rocket. Your crew.<br/>One unforgettable countdown.</p><div className="preflight-switches">{[{id:'belts',Icon:ShieldCheck,title:'Seat belts',hint:'Buckle up'},{id:'radio',Icon:Radio,title:'Radio check',hint:'Say hello'},{id:'hatch',Icon:CircleCheck,title:'Hatch sealed',hint:'Close the door'}].map(({id,Icon,title,hint})=><button key={id} disabled={count!==null} className={checks.includes(id)?'ready':''} aria-pressed={checks.includes(id)} onClick={()=>{setChecks(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);sound.playSnap();}}><Icon size={27}/><span>{title}<small>{checks.includes(id)?'Ready!':hint}</small></span>{checks.includes(id)?<Check size={19}/>:<span className="switch-dot"/>}</button>)}</div><button className="primary launch-button" disabled={checks.length<3||count!==null} onClick={start}>{count!==null?'Counting down…':'Start countdown'}<Rocket size={20}/></button>{count!==null&&<button className="text-btn" onClick={()=>setCount(null)}>Hold countdown</button>}</>:<><div className="flight-numbers"><span><small>UP ABOVE EARTH</small><strong>{Math.round(telemetry.altitudeKm)}<i> km</i></strong></span><span><small>OUR SPEED</small><strong>{(telemetry.velocityMs/1000).toFixed(1)}<i> km/s</i></strong></span></div><div className="flight-stage-track">{['Booster','Second stage','Orbit engine'].map((label,i)=><span key={label} className={released===i?'active':released>i?'done':''}><b>{released>i?<Check size={13}/>:i+1}</b>{label}</span>)}</div><p className="flight-caption">{waitForStage?'Flight paused for your next move.':paused?'Take your time. Your crew is waiting.':'Follow the journey. You’ll help at each stage.'}</p>{waitForStage?<button className="primary staging-button" onClick={release}>{released===0?'Release the booster':'Release second stage'}<ArrowRight size={20}/></button>:<button className="soft-button" onClick={()=>setPaused(p=>!p)}>{paused?<Play size={18}/>:<Pause size={18}/>} {paused?'Keep flying':'Pause flight'}</button>}</>}
   </aside>
   <div className={`flight-scene flight-scene--3d ${phase==='ascent'?'flying':''} ${paused||waitForStage?'paused':''}`}>
    <Suspense fallback={null}><FlightScene3D installed={installed} phase={phase==='launchpad'?'launchpad':'ascent'} metSeconds={time} released={released} escapeReleased={escapeReleased} enginesOn={enginesOn} reducedMotion={reducedMotion} countdown={count}/></Suspense>
    {phase==='ascent'&&<button className="flight-skip" onClick={skipFlight}><SkipForward size={16}/> Skip flight</button>}
    {phase==='ascent'&&telemetry.altitudeKm>=25&&<div className="sun-reference" style={{opacity:Math.min(1,.3+(telemetry.altitudeKm-25)/55)}}><span className="sun-reference-disc"/><span><strong>THE SUN</strong><small>≈ 150 million km away</small></span></div>}
    {count!==null&&<div className="countdown" role="status" aria-live="assertive"><span>READY, EXPLORER?</span><strong key={count}>{count||'GO!'}</strong></div>}
    <span className="flight-scene-label">{phase==='launchpad'?'EARTH · LAUNCH DAY · 3D':'CINEMATIC FLIGHT · TIME COMPRESSED'}</span>
   </div>
  </div>
  <div className="chapter-footer">{phase==='launchpad'&&count===null?<button className="text-btn" onClick={()=>useMissionStore.getState().setPhase('readiness')}><ArrowLeft size={16}/> Back</button>:<span className="flight-live"><span className="live-dot"/>{waitForStage||paused?'ON HOLD':'LIVE'}</span>}<Guide person="kai" text={phase==='launchpad'?'Help the crew buckle up, check the radio, and seal the hatch. Then you’re in charge of countdown!':lesson}/></div>
 </div>;
}
