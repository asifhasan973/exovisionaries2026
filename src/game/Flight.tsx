import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CircleCheck, Flag, Heart, Pause, Play, Radio, Rocket, ShieldCheck, SkipForward, Sparkles } from 'lucide-react';
import { useMissionStore } from '../state/missionStore';
import { sampleAscentTelemetry } from '../engine/ascent-profile';
import { sound } from '../audio/soundEngine';
import { Guide, MissionDock } from './shared';
import { MissionCinematic } from './MissionCinematic';

const FlightScene3D = lazy(() => import('./FlightScene3D').then(m => ({ default: m.FlightScene3D })));
const OrbitScene3D = lazy(() => import('./FlightScene3D').then(m => ({ default: m.OrbitScene3D })));

export function Flight() {
 const phase=useMissionStore(s=>s.currentPhase);const installed=useMissionStore(s=>s.installedParts);const reducedMotion=useMissionStore(s=>s.audioSettings.reducedMotion);
 const [checks,setChecks]=useState<string[]>([]);const [count,setCount]=useState<number|null>(null);
 const [time,setTime]=useState(0);const [released,setReleased]=useState(0);const [paused,setPaused]=useState(false);
 const [speed,setSpeed]=useState<1|1.5|2>(1.5);
 const [launchBriefing,setLaunchBriefing]=useState(phase==='launchpad');
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
  const timer=window.setInterval(()=>{if(document.hidden)return;setTime(t=>Math.min(released===0?162:released===1?520:720,t+3*speed));},100);
  return()=>clearInterval(timer);
 },[phase,paused,waitForStage,released,speed]);
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
 function start(){const s=useMissionStore.getState();if(!s.prepareLaunch()){s.setPhase('readiness');return;}setCount(5);}
 function release(){sound.playStagingThud();setReleased(n=>n+1);setTime(t=>t+3*speed);}
 function skipFlight(){sound.stopRocketRoar();setPaused(false);setReleased(2);setTime(720);useMissionStore.getState().setAscentProgress(1);useMissionStore.getState().setPhase('orbit');}
 function returnToPad(){sound.stopRocketRoar();setPaused(false);setReleased(0);setTime(0);useMissionStore.getState().setAscentProgress(0);useMissionStore.getState().setPhase('launchpad');}
 if(landed)return <div className="chapter orbit-chapter"><div className="orbit-celebration"><Suspense fallback={null}><OrbitScene3D/></Suspense><div className="orbit-copy"><span className="label-tag light"><Sparkles size={16}/> MISSION COMPLETE</span><h1>You reached<br/><em>Earth orbit!</em></h1><p>Crew safe. Mission complete.</p><div className="earned-badges"><span><Rocket/>Rocket builder</span><span><Heart/>Crew captain</span><span><Flag/>Orbit explorer</span></div><button className="primary" onClick={()=>useMissionStore.getState().openComingSoon('Next: the Moon','Moon flight is coming soon.')}>What’s next?<ArrowRight size={19}/></button><button className="text-btn light-text" onClick={()=>useMissionStore.getState().setPhase('assembly')}>← Back</button></div><div className="orbit-stamp"><span>MISSION ONE</span><strong>★</strong><span>EARTH ORBIT</span></div></div><Guide person="leo" text="Great flying, captain!"/></div>;
 return <div className="chapter flight-chapter">
  <div className={`flight-workspace ${phase==='ascent'?'flying':''} ${paused||waitForStage?'paused':''}`}>
   <aside className="flight-control-panel flight-copy"><span className="label-tag">{phase==='launchpad'?'THE BIG MOMENT':'YOUR FLIGHT · 3D LAUNCH'}</span><h1>{phase==='launchpad'?<>From your hands<br/>to the stars<span className="dot">.</span></>:eventTitle}</h1>
    {phase==='launchpad'?<><p>Finish three checks.<br/>Then launch!</p><div className="preflight-switches">{[{id:'belts',Icon:ShieldCheck,title:'Seat belts',hint:'Buckle up'},{id:'radio',Icon:Radio,title:'Radio check',hint:'Say hello'},{id:'hatch',Icon:CircleCheck,title:'Hatch sealed',hint:'Close hatch'}].map(({id,Icon,title,hint})=><button key={id} disabled={count!==null} className={checks.includes(id)?'ready':''} aria-pressed={checks.includes(id)} onClick={()=>{setChecks(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);sound.playSnap();}}><Icon size={27}/><span>{title}<small>{checks.includes(id)?'Ready!':hint}</small></span>{checks.includes(id)?<Check size={19}/>:<span className="switch-dot"/>}</button>)}</div>{count!==null&&<button className="text-btn" onClick={()=>setCount(null)}>Hold countdown</button>}</>:<><div className="flight-numbers"><span><small>ALTITUDE</small><strong>{Math.round(telemetry.altitudeKm)}<i> km</i></strong></span><span><small>SPEED</small><strong>{(telemetry.velocityMs/1000).toFixed(1)}<i> km/s</i></strong></span></div><div className="flight-stage-track">{['Booster','Second stage','Orbit engine'].map((label,i)=><span key={label} className={released===i?'active':released>i?'done':''}><b>{released>i?<Check size={13}/>:i+1}</b>{label}</span>)}</div><p className="flight-caption">{waitForStage?'Choose the next move.':paused?'Flight paused.':'Watch each stage.'}</p>{waitForStage?<button className="primary staging-button" onClick={release}>{released===0?'Release booster':'Release stage two'}<ArrowRight size={20}/></button>:<button className="soft-button" onClick={()=>setPaused(p=>!p)}>{paused?<Play size={18}/>:<Pause size={18}/>} {paused?'Keep flying':'Pause flight'}</button>}</>}
   </aside>
   <div className={`flight-scene flight-scene--3d ${phase==='ascent'?'flying':''} ${paused||waitForStage?'paused':''}`}>
    <Suspense fallback={null}><FlightScene3D installed={installed} phase={phase==='launchpad'?'launchpad':'ascent'} metSeconds={time} released={released} escapeReleased={escapeReleased} enginesOn={enginesOn} reducedMotion={reducedMotion} countdown={count}/></Suspense>
    {phase==='ascent'&&<div className="flight-speed-controls" aria-label="Flight speed"><span>FLIGHT SPEED</span>{([1,1.5,2] as const).map(value=><button key={value} className={speed===value?'active':''} aria-pressed={speed===value} onClick={()=>setSpeed(value)}>{value}×</button>)}</div>}
    {phase==='ascent'&&<button className="flight-skip" onClick={skipFlight}><SkipForward size={16}/> Skip flight</button>}
    {phase==='ascent'&&telemetry.altitudeKm>=25&&<div className="sun-reference" style={{opacity:Math.min(1,.3+(telemetry.altitudeKm-25)/55)}}><span className="sun-reference-disc"/><span><strong>THE SUN</strong><small>≈ 150 million km away</small></span></div>}
    {count!==null&&<div className="countdown" role="status" aria-live="assertive"><span>READY, EXPLORER?</span><strong key={count}>{count||'GO!'}</strong></div>}
    <span className="flight-scene-label">{phase==='launchpad'?'EARTH · LAUNCH DAY · 3D':'CINEMATIC FLIGHT · TIME COMPRESSED'}</span>
   </div>
  </div>
  {phase==='launchpad'?<MissionDock back={{label:'Readiness',onClick:()=>useMissionStore.getState().setPhase('readiness'),disabled:count!==null}} guide={{label:'Launch briefing with Kai',person:'kai',onClick:()=>setLaunchBriefing(true)}} next={{label:count!==null?'Counting down…':'Start countdown',disabled:checks.length<3||count!==null,icon:<Rocket size={19}/>,onClick:start}}/>:<MissionDock back={{label:'Launch pad',onClick:returnToPad}} status={<span className="flight-live"><span className="live-dot"/>{waitForStage||paused?'FLIGHT ON HOLD':'LIVE FLIGHT'}</span>}/> }
  {launchBriefing ? <MissionCinematic scene={{
    eyebrow:'FINAL LAUNCH BRIEFING', title:'You are flight director.', speaker:'Kai', mood:'briefing',
    lines:['Check belts, radio and hatch.', 'Start countdown. Release empty stages when called.'],
    actionLabel:'Go to the launch pad'
  }} onComplete={()=>setLaunchBriefing(false)} /> : null}
  {waitForStage ? <MissionCinematic scene={released===0?{
    eyebrow:'FLIGHT DECISION · STAGE 1', title:'The booster is empty!', speaker:'Kai', mood:'warning',
    lines:['The booster is empty.', 'Release it to make the rocket lighter.'],
    actionLabel:'Release the booster'
  }:{
    eyebrow:'FLIGHT DECISION · STAGE 2', title:'One last push!', speaker:'Kai', mood:'warning',
    lines:['Stage two is empty.', 'Release it and start the orbit engine.'],
    actionLabel:'Release stage two'
  }} onComplete={release} /> : null}
 </div>;
}
