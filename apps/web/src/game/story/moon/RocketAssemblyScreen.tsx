import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Check, Eye, PackageOpen, Rocket, RotateCcw, Trash2, WandSparkles, X } from 'lucide-react';
import type { SelectionFrame } from '../SelectionScreens.tsx';
import type { MissionEvent, WorkshopSession } from '../workshopSession.ts';
import { StoryShell, StoryControls } from '../StoryShell.tsx';
import { EngineerCompanion } from '../EngineerCompanion.tsx';
import { useGameSettings } from '../gameSettingsContext.ts';
import { MainRocketViewport } from './MainRocketViewport.tsx';
import type { RocketSockets } from './MainRocketViewport.tsx';
import { ROCKET_PARTS, ROCKET_SHELVES, nextRocketPart, needsOpenCover, rocketComplete, rocketHasCover } from './rocketAssembly.ts';
import type { RocketPartId } from './rocketAssembly.ts';
import { sound } from '@exo/audio';
import { isEngineFrozen, useOrientationLifecycleStore } from '@exo/ui';
import { ROCKET_LINES } from './rocketAssemblyCopy.ts';
import type { RocketAdvice } from './rocketAssemblyCopy.ts';
import './checks.css';
import './rocketAssembly.css';

const FALLBACK_SOCKETS:RocketSockets=Object.fromEntries(ROCKET_PARTS.map((part,index)=>[part.id,{x:part.id==='cover-left'?38:part.id==='cover-right'?62:part.id==='rover'?61:part.id==='lander'?39:50,y:[92,74,57,48,41,34,37,24,23,17,7][index],anchorX:50,anchorY:[92,74,57,48,41,34,37,24,23,17,7][index],width:14,height:part.id==='core'?28:9}]));
const LABELS=Object.fromEntries(ROCKET_PARTS.map(part=>[part.id,part.name])) as Record<RocketPartId,string>;
interface Drag {id:RocketPartId;x:number;y:number;startX:number;startY:number;moved:boolean}
interface AutoGhost {id:RocketPartId;x:number;y:number}

export function RocketAssemblyScreen({session,dispatch,frame,onBack}:{session:WorkshopSession;dispatch(event:MissionEvent):void;frame:SelectionFrame;onBack():void}){
  const build=session.moon.human.rocketBuild,complete=rocketComplete(build),{effects,gentle}=useGameSettings();
  const frozen=useOrientationLifecycleStore(state=>state.isFrozen);
  const [selected,setSelected]=useState<RocketPartId|null>(null),[drag,setDrag]=useState<Drag|null>(null),[images,setImages]=useState<Record<string,string>>({}),[sockets,setSockets]=useState<RocketSockets>(FALLBACK_SOCKETS);
  const [inside,setInside]=useState(false),[bayView,setBayView]=useState(false),[ready,setReady]=useState(false),[viewKey,setViewKey]=useState(0),[auto,setAuto]=useState(false),[autoGhost,setAutoGhost]=useState<AutoGhost|null>(null);
  const [replyId,setReplyId]=useState<RocketAdvice>('intro');
  const [reply,setReply]=useState<string>(ROCKET_LINES.intro),[voiceToken,setVoiceToken]=useState(0);
  const bay=useRef<HTMLDivElement>(null),latest=useRef({build,sockets,selected,effects,gentle});
  useEffect(()=>{latest.current={build,sockets,selected,effects,gentle};},[build,sockets,selected,effects,gentle]);
  const say=(id:RocketAdvice)=>{setReplyId(id);setReply(ROCKET_LINES[id]);setVoiceToken(n=>n+1);};
  const place=(part:RocketPartId,target:RocketPartId|null)=>{
    if(isEngineFrozen()||auto)return;
    sound.setMuted(!effects);dispatch({type:'rocket-build-place',part,target});
    if(['lander','rover','capsule'].includes(part)&&rocketHasCover(build)){sound.playBoing();say('blocked');}
    else if(target!==part){sound.playBoing();say('wrong');}
    else{sound.playRocketFit(part);setSelected(null);if(build.installed.length===ROCKET_PARTS.length-1){sound.playFanfare();say('complete');}else say(part);}
  };
  const drop=(id:RocketPartId,x:number,y:number)=>{
    const rect=bay.current?.getBoundingClientRect(),slot=sockets[id];
    if(!rect||!slot)return;
    const px=(x-rect.left)/rect.width*100,py=(y-rect.top)/rect.height*100;
    const marker=Math.hypot((px-slot.x)*rect.width/100,(py-slot.y)*rect.height/100)<=40;
    const shape=Math.abs(px-slot.anchorX)<=Math.max(4,slot.width/2+2)&&Math.abs(py-slot.anchorY)<=Math.max(3,slot.height/2+1);
    place(id,px>=0&&px<=100&&py>=0&&py<=100&&(marker||shape)?id:null);
  };
  const grab=(event:PointerEvent<HTMLButtonElement>,id:RocketPartId)=>{
    if(event.button!==0||isEngineFrozen()||auto||!ready)return;
    event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);setSelected(id);
    setDrag({id,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false});
  };
  const move=(event:PointerEvent<HTMLElement>)=>{if(drag&&!frozen)setDrag({...drag,x:event.clientX,y:event.clientY,moved:drag.moved||Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>8});};
  const release=()=>{if(drag?.moved)drop(drag.id,drag.x,drag.y);setDrag(null);};
  const openCover=()=>{if(isEngineFrozen())return;dispatch({type:'rocket-build-open-cover'});sound.setMuted(!effects);sound.playHatchSeal();say('open');};
  useEffect(()=>{
    const cancel=()=>setDrag(null),stopAuto=()=>{setAuto(false);setAutoGhost(null);setDrag(null);};
    window.addEventListener('game-orientation-pause',cancel);window.addEventListener('blur',cancel);
    window.addEventListener('game-help-open',stopAuto);
    const hint=()=>{
      if(isEngineFrozen())return;
      dispatch({type:'rocket-build-assist'});
      setAuto(false);setAutoGhost(null);
      const state=latest.current;
      if(needsOpenCover(state.build)){setReplyId('blocked');setReply(ROCKET_LINES.blocked);}
      else{const id=state.selected&&!state.build.installed.includes(state.selected)?state.selected:nextRocketPart(state.build);setReplyId(id?'intro':'complete');setReply(id?'Hover over a circle to see its label. Match the part to the circle with its name.':ROCKET_LINES.complete);}
      setVoiceToken(n=>n+1);
    };
    window.addEventListener('replay-game-help',hint);
    return()=>{window.removeEventListener('game-orientation-pause',cancel);window.removeEventListener('blur',cancel);window.removeEventListener('game-help-open',stopAuto);window.removeEventListener('replay-game-help',hint);};
  },[dispatch]);
  useEffect(()=>{
    if(!auto)return;
    let last=performance.now(),elapsed=0,part:RocketPartId|undefined,placed=false;
    let from={x:0,y:0},to={x:0,y:0};
    const timer=window.setInterval(()=>{
      const now=performance.now(),dt=Math.min(.06,(now-last)/1000);last=now;
      if(document.hidden||isEngineFrozen()||document.querySelector('dialog[open]'))return;
      const current=latest.current;
      if(!part){
        if(needsOpenCover(current.build)){dispatch({type:'rocket-build-open-cover'});sound.setMuted(!current.effects);sound.playHatchSeal();return;}
        part=nextRocketPart(current.build);
        if(!part){setAuto(false);setAutoGhost(null);setReplyId('complete');setReply(ROCKET_LINES.complete);setVoiceToken(n=>n+1);sound.setMuted(!current.effects);sound.playFanfare();return;}
        const source=document.querySelector(`[data-rocket-part="${part}"]`),target=document.querySelector(`[data-rocket-socket="${part}"]`);
        if(!source||!target)return;
        const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();from={x:a.left+a.width/2,y:a.top+a.height/2};to={x:b.left+b.width/2,y:b.top+b.height/2};elapsed=0;placed=false;
      }
      elapsed+=dt;const t=Math.min(1,elapsed/.42),ease=1-(1-t)**3;
      setAutoGhost(t<1&&!current.gentle?{id:part,x:from.x+(to.x-from.x)*ease,y:from.y+(to.y-from.y)*ease}:null);
      if(t===1&&!placed){placed=true;dispatch({type:'rocket-build-place',part,target:part});sound.setMuted(!current.effects);sound.playRocketFit(part);}
      if(elapsed>=.66){part=undefined;}
    },30);
    return()=>window.clearInterval(timer);
  },[auto,dispatch]);
  const shownDrag=drag?.moved?drag:autoGhost;
  const shelf=(ids:readonly RocketPartId[],right=false)=><aside className="rocket-parts-shelf" aria-label={right?'Right rocket parts':'Left rocket parts'}>{ids.map(id=>{
    const installed=build.installed.includes(id),part=ROCKET_PARTS.find(part=>part.id===id)!;
    return <div className={`rocket-part-card ${installed?'is-installed':''} ${selected===id?'is-selected':''}`} key={id} style={{'--part-color':part.color} as React.CSSProperties}>
      <button className="rocket-part-pick" data-rocket-part={id} disabled={installed||auto||!ready} aria-label={`Select ${part.name}`} aria-pressed={selected===id}
        onPointerDown={event=>grab(event,id)} onPointerCancel={()=>setDrag(null)} onLostPointerCapture={()=>setDrag(null)}
        onClick={()=>{if(!isEngineFrozen())setSelected(id);}}>
        <span className="rocket-part-image">{images[id]?<img src={images[id]} alt="" draggable={false}/>:<Rocket/>}</span><strong>{part.name}</strong>{installed?<Check size={17}/>:null}
      </button>
      {installed?<button className="rocket-part-remove" disabled={auto} aria-label={`Remove ${part.name}`} onClick={()=>{if(isEngineFrozen())return;dispatch({type:'rocket-build-remove',part:id});sound.setMuted(!effects);sound.playClick(380);say('removed');}}><X size={14}/></button>:null}
    </div>;
  })}{right?<EngineerCompanion reaction={complete?'complete':build.fault?'warning':'intro'} token={voiceToken} voiceEnabled={frame.voiceEnabled??true} scriptedReply={{id:`rocket-${complete?'complete':replyId}`,text:complete?ROCKET_LINES.complete:reply}}/>:null}</aside>;
  return <StoryShell {...frame} controls={<StoryControls onBack={()=>{setAuto(false);setDrag(null);onBack();}} onNext={()=>dispatch({type:'next'})} nextLabel="Ready" nextDisabled={!complete||auto||!ready} progress={`${build.installed.length}/${ROCKET_PARTS.length}`}/> }>
    <main id="story-content" tabIndex={-1} className="workshop-main rocket-assembly-main" aria-labelledby="rocket-assembly-title" data-rocket-count={build.installed.length} data-rocket-ready={ready&&!frozen} data-rocket-selected={selected??''} data-rocket-blocked={needsOpenCover(build)} onPointerMove={move} onPointerUp={release}>
      <div className="rocket-assembly-heading"><h1 id="rocket-assembly-title">Build your rocket</h1><button className="rocket-quick-build" disabled={!ready||complete} aria-pressed={auto} onClick={()=>{if(isEngineFrozen())return;setBayView(false);setAuto(value=>!value);setAutoGhost(null);setDrag(null);dispatch({type:'rocket-build-assist'});}}>{auto?<X size={18}/>:<WandSparkles size={19}/>} {auto?'Stop build':'Quick build'}</button></div>
      <div className="rocket-assembly-layout">
        {shelf(ROCKET_SHELVES[0])}
        <section ref={bay} className="rocket-assembly-bay" aria-label="Main rocket assembly area">
          <MainRocketViewport preparation={session.preparation} installed={build.installed} inside={inside} bayView={bayView} viewKey={viewKey} gentle={gentle} onSockets={setSockets} onThumbnails={setImages} onReady={()=>setReady(true)}/>
          <div className="rocket-bay-toolbar"><span>ROCKET HANGAR · 3D</span><div>{rocketHasCover(build)?<button data-rocket-open-cover disabled={frozen||auto} onClick={openCover} aria-label="Remove rocket cover" title="Open cover"><Trash2 size={18}/></button>:null}<button disabled={frozen||auto} onClick={()=>setBayView(value=>!value)} aria-pressed={bayView} aria-label={bayView?'Show full rocket':'Inspect payload bay'} title={bayView?'Full rocket':'Payload bay'}><PackageOpen size={18}/></button><button disabled={frozen} onClick={()=>setInside(value=>!value)} aria-pressed={inside} aria-label="See inside rocket" title="See inside"><Eye size={18}/></button><button disabled={frozen||auto} onClick={()=>{setBayView(false);setInside(false);setViewKey(n=>n+1);}} aria-label="Reset rocket view" title="Reset view"><RotateCcw size={18}/></button></div></div>
          {!complete?<svg className="rocket-socket-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{ROCKET_PARTS.filter(part=>!build.installed.includes(part.id)).map(part=>{const s=sockets[part.id];return s&&s.y>3&&s.y<96?<line key={part.id} x1={s.anchorX} y1={s.anchorY} x2={s.x} y2={s.y} stroke={part.color}/>:null;})}</svg>:null}
          {ROCKET_PARTS.filter(part=>!build.installed.includes(part.id)).map(part=>{const s=sockets[part.id];return s&&s.y>0&&s.y<100?<button key={part.id} className="rocket-socket" data-rocket-socket={part.id} aria-label={`${part.name} slot`} title={part.name} style={{left:`${s.x}%`,top:`${s.y}%`,'--part-color':part.color} as React.CSSProperties} disabled={auto||!ready} onClick={()=>{if(selected)place(selected,part.id);}}><span/><small>{part.name}</small></button>:null;})}
          {build.fault?<div className="rocket-build-alert" role="alert"><strong>{build.fault==='cover-blocks'?'Cover blocks the bay!':'Wrong spot. Try the matching outline.'}</strong>{build.fault==='cover-blocks'?<button data-rocket-open-cover disabled={auto} onClick={openCover}><Trash2 size={17}/>Remove cover</button>:null}</div>:complete?<div className="rocket-build-complete" role="status"><Check size={22}/>Rocket ready!</div>:<span className="rocket-build-caption">{auto?'Building…':selected?LABELS[selected]:'Drag parts to the outline'}</span>}
        </section>
        {shelf(ROCKET_SHELVES[1],true)}
      </div>
      {shownDrag?<div className="rocket-drag-preview" aria-hidden="true" style={{left:shownDrag.x,top:shownDrag.y}}>{images[shownDrag.id]?<img src={images[shownDrag.id]} alt=""/>:<Rocket/>}</div>:null}
    </main>
  </StoryShell>;
}
