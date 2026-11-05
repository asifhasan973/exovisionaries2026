import { Suspense, lazy, useEffect } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { StoryShell, StoryControls } from '@/shared/shell';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import { useGameSettings } from '@/shared/shell';
import { useStoryNavigation } from '@/game/moon/core/storyNavigationContext';
import { sound } from '@exo/audio';
import { CHECK_LINES } from '@/game/moon/readiness';
import './departureSuccess.css';
const MainRocketViewport=lazy(()=>import('@/game/moon/workshop/rocket/MainRocketViewport').then(module=>({default:module.MainRocketViewport})));

export function DepartureSuccess({session,dispatch,frame,onBack}:{session:WorkshopSession;dispatch(event:MissionEvent):void;frame:SelectionFrame;onBack():void}){
  const {effects,gentle}=useGameSettings(),navigation=useStoryNavigation();
  useEffect(()=>{if(effects&&navigation?.autoplay!==false&&!navigation?.reviewing){sound.setMuted(false);sound.playFanfare();}},[effects,navigation?.autoplay,navigation?.reviewing]);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={()=>dispatch({type:'next'})} nextLabel={session.flight.t>0?'Return to flight':'Launch pad'} hintDisabled/>}>
    <main id="story-content" tabIndex={-1} className={`departure-success ${gentle?'is-gentle':''}`} aria-labelledby="departure-title">
      <div className="departure-orbit departure-orbit-one" aria-hidden="true"/><div className="departure-orbit departure-orbit-two" aria-hidden="true"/>
      <section className="departure-message">
        <span className="departure-eyebrow">MISSION PREPARATION COMPLETE</span>
        <div className="departure-medal"><ShieldCheck size={65}/><span><Check size={16}/></span></div>
        <h1 id="departure-title">Ready for<br/><em>liftoff!</em></h1>
        <p>Your crew is ready.<br/>The Moon is waiting.</p>
        <div className="departure-checks">{['Crew secured','Supplies packed','Rocket assembled'].map(label=><span key={label}><Check size={17}/>{label}</span>)}</div>
        <EngineerCompanion reaction="complete" token={1} voiceEnabled={frame.voiceEnabled??true} scriptedReply={{id:'check-ready',text:CHECK_LINES.ready}}/>
      </section>
      <section className="departure-rocket" aria-label="Your completed launch rocket">
        <div className="departure-rocket-halo" aria-hidden="true"/>
        <Suspense fallback={<div className="human-loading">Opening your rocket…</div>}><MainRocketViewport preparation={session.preparation} installed={session.moon.human.rocketBuild.installed} gentle={gentle} readOnly/></Suspense>
        <span className="departure-next">NEXT STOP <strong>THE LAUNCH PAD</strong></span>
      </section>
    </main>
  </StoryShell>;
}
