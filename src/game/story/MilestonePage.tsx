import { useEffect, useRef } from 'react';
import { Check, Globe2, Star } from 'lucide-react';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import type { SelectionFrame } from './SelectionScreens.tsx';
import { MILESTONES } from './missionMilestones.ts';
import type { MilestoneId } from './missionMilestones.ts';
import { useGameSettings } from './gameSettingsContext.ts';
import { sound } from '../../audio/soundEngine.ts';
import { isEngineFrozen, useOrientationLifecycleStore } from '../../state/orientationLifecycleStore.ts';
import './milestones.css';

export function MilestonePage({frame,mode,current,completed,onBack,onNext}:{frame:SelectionFrame;mode:'intro'|'map'|'complete';current:number;completed?:MilestoneId;onBack():void;onNext():void}){
  const {effects,gentle}=useGameSettings(),done=MILESTONES.find(m=>m.id===completed),index=done?MILESTONES.indexOf(done):current;
  const frozen=useOrientationLifecycleStore(state=>state.isFrozen);
  const last=done?.id==='home';
  const main=useRef<HTMLElement>(null);
  useEffect(()=>{main.current?.focus({preventScroll:true});},[mode,completed]);
  useEffect(()=>{
    if(mode!=='complete'||!effects)return;
    let played=false;const celebrate=()=>{if(played||isEngineFrozen()||document.hidden)return;played=true;sound.setMuted(!effects);sound.playFanfare();};
    celebrate();window.addEventListener('game-orientation-resume',celebrate);
    return()=>window.removeEventListener('game-orientation-resume',celebrate);
  },[mode,completed,effects]);
  return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={onNext} nextLabel={mode==='intro'?'Start mission':mode==='map'?'Keep playing':last?'See mission results':'Next milestone'} hintDisabled/>}>
    <main ref={main} className={`milestone-page ${mode==='complete'?'is-complete':''} ${gentle?'is-gentle':''} ${frozen?'is-frozen':''}`} id="story-content" tabIndex={-1} aria-labelledby="milestone-title">
      <div className="milestone-universe" aria-hidden="true"><i/><i/><i/></div>
      <section className="milestone-hero" aria-label={done ? `${done.name} complete` : 'Your Moon adventure'}>
        <img src={`/story/milestone-${done ? index+1 : 6}-v1.webp`} alt="" />
        <div className="milestone-hero-caption"><small>{done ? 'MISSION MILESTONE COMPLETE' : 'YOUR MISSION AWAITS'}</small><strong>{done ? `${done.name} complete!` : <>From Earth to the Moon<br/>and back again.</>}</strong></div>
      </section>
      <section className="milestone-copy">
        <span className="milestone-eyebrow">{mode==='complete'?`MILESTONE ${index+1} / ${MILESTONES.length}`:'YOUR MOON ADVENTURE'}</span>
        <h1 id="milestone-title">{done?<>{done.name}<br/><em>complete!</em></>:<>{MILESTONES.length} milestones.<br/><em>One Moon mission.</em></>}</h1>
        {done?<div className="milestone-next-card">{last?<><Globe2/><span>Everyone’s home. Let’s see your discoveries.</span></>:<><span className="milestone-next-number">{current+1}</span><div><small>UP NEXT</small><strong>{MILESTONES[current].name}</strong></div><span className="milestone-reset">0%</span></>}</div>:null}
        {done?<div className="milestone-earned-stars" aria-hidden="true"><Star/><Star/><Star/></div>:<ol className="milestone-map" aria-label="Eight mission milestones">{MILESTONES.map((m,i)=>{
          const passed=i<current;
          return <li className={`${passed?'is-done':''} ${i===current?'is-current':''}`} key={m.id} aria-current={i===current?'step':undefined}><img src={`/story/milestone-${i+1}-v1.webp`} alt=""/><strong>{m.name}</strong><small>{passed?<Check size={12}/>:String(i+1).padStart(2,'0')}</small></li>;
        })}</ol>}
      </section>
    </main>
  </StoryShell>;
}
