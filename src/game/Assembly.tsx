import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { PointerEvent, CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckSquare2, Hand, LockKeyhole, PackagePlus, Redo2, Square, Trash2, Undo2 } from 'lucide-react';
import { PARTS, SLOTS } from '../data/parts';
import { MISSIONS } from '../data/missions';
import { useMissionStore } from '../state/missionStore';
import type { SlotInterface } from '../types/mission';
import { PartArt, RocketArt } from './art';
import { CORE_SLOTS, MARS_PREVIEW_PARTS, MOON_MISSION_PARTS, SYSTEM_SLOTS, partLesson, partName } from './catalog';
import { Guide } from './shared';
import { sound } from '../audio/soundEngine';
import './builder3d.css';
import { computeBudgetAccounting, computeMassAccounting } from '../engine/accounting';
const RocketBuilder3D = lazy(() => import('./RocketBuilder3D'));
const groups = [
 {title:'Build your rocket',short:'Rocket',icon:'01',ids:CORE_SLOTS.map(s=>SLOTS.find(x=>x.id===s)!.acceptedPartIds![0]),lesson:'An empty workshop. A big adventure. Pick a part and match its glowing spot.'},
 {title:'Give your crew a home',short:'Life support',icon:'02',ids:SYSTEM_SLOTS.map(s=>SLOTS.find(x=>x.id===s)!.acceptedPartIds![0]),lesson:'Astronauts need air, electricity, navigation and a way to call home.'},
 {title:'Choose mission equipment',short:'Mission gear',icon:'03',ids:MOON_MISSION_PARTS,lesson:'Start with the two mission essentials. Then choose Moon tools that fit your mass and budget.'}
];
const targetY:Record<string,number>={'booster-stage-1':78,'interstage-1':67,'booster-stage-2':55,'interstage-2':45,'booster-stage-3':36,'instrument-unit':31,'lunar-payload-bay':25,'service-module':18,'crew-capsule':11,'launch-escape-system':4};
export function Assembly({onInspect}:{onInspect:(id:string)=>void}) {
 const installed=useMissionStore(s=>s.installedParts); const crew=useMissionStore(s=>s.crewAssignments); const duration=useMissionStore(s=>s.missionDurationDays); const undoCount=useMissionStore(s=>s.undoStack.length); const redoCount=useMissionStore(s=>s.redoStack.length);
 const [group,setGroup]=useState(()=>CORE_SLOTS.every(s=>installed[s])?SYSTEM_SLOTS.every(s=>installed[s])?2:1:0);
 const [picked,setPicked]=useState<string|null>(null); const [message,setMessage]=useState('');
 const [missionTab,setMissionTab]=useState<'moon'|'mars'>('moon');
 const [marked,setMarked]=useState<Set<string>>(()=>new Set());
 const [view,setView]=useState<'2d'|'3d'>(()=>{try{return localStorage.getItem('moonbound_assembly_view_v1')==='3d'?'3d':'2d';}catch{return '2d';}}); const [hovered,setHovered]=useState<string|null>(null);
 const [thumbs,setThumbs]=useState<Record<string,string>>({});
 const snapSequence=useRef(0);
 const [snapFx,setSnapFx]=useState<{id:string;x:number;y:number;dx:number;dy:number;key:number}|null>(null);
 const shelf=useRef<HTMLDivElement>(null); const floating=useRef<HTMLDivElement>(null); const drag=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null); const suppressClick=useRef(false);
 const [dragId,setDragId]=useState<string|null>(null);
 const store=useMissionStore;
 const groupData=groups[group];
 const inRocket=(id:string)=>Object.values(installed).includes(id);
 const next=groupData.ids.find(id=>!inRocket(id)) || null;
 const active=picked||(view==='2d'?next:null);
 const preferredSlotFor=(id:string):SlotInterface|undefined=>{
  if(inRocket(id))return undefined;
  const compatible=PARTS[id].compatibleSlots;
  const empty=compatible.find(s=>!installed[s]);
  if(empty)return empty;
  const optional=[...compatible].reverse().find(s=>installed[s]&&!MISSIONS['lunar-ice-explorer'].requiredPayloads.includes(installed[s]));
  return optional||[...compatible].reverse().find(s=>installed[s]);
 };
 const slot=active?preferredSlotFor(active):undefined;
 const required=group===0?groups[0].ids:group===1?groups[1].ids:MISSIONS['lunar-ice-explorer'].requiredPayloads;
 const done=required.filter(inRocket).length; const complete=done===required.length;
 const mass=computeMassAccounting(installed,crew,duration); const budget=computeBudgetAccounting(installed);
 const limitsOk=!mass.isOverScienceMassLimit&&!budget.isOverBudget;
 const select=(id:string)=>{onInspect(id); if (inRocket(id)) { setPicked(id); setMessage(partLesson[id]||`${partName(id)} is on your rocket.`); return; } setPicked(id);setMessage('');};
 const mark=(id:string)=>setMarked(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});
 const selectableIds=groupData.ids.filter(id=>!inRocket(id));
 const toggleAll=()=>setMarked(current=>current.size===selectableIds.length&&selectableIds.length?new Set():new Set(selectableIds));
 const addMarked=()=>{
  const chosen=[...marked];
  if(!chosen.length)return;
  const result=store.getState().installBatch(chosen);
  if(result.installed.length){result.installed.forEach(id=>onInspect(id));setMarked(new Set());setPicked(null);setMessage(`${result.installed.length} ${result.installed.length===1?'part':'parts'} snapped into place${result.skipped.length?`. ${result.skipped.length} did not fit—remove an optional item or add them one at a time.`:'!'}`);}
  else setMessage('Those parts need an empty compatible bay. Remove an optional item or choose a different set.');
 };
 function showSnap(id:string,target:SlotInterface,origin?:{x:number;y:number}){
  if(store.getState().audioSettings.reducedMotion)return;
  const source=shelf.current?.querySelector<HTMLElement>(`[data-part-id="${id}"]`)?.getBoundingClientRect();
  const destination=document.querySelector<HTMLElement>(view==='3d'?'.builder-target':`[data-slot="${target}"]`)?.getBoundingClientRect();
  const bay=document.querySelector<HTMLElement>(view==='3d'?'.rocket-builder-3d':'.assembly-bay')?.getBoundingClientRect();
  if(!destination&&!bay)return;
  const x=origin?.x??(source?source.left+source.width/2:0),y=origin?.y??(source?source.top+source.height/2:0);
  const endX=destination?destination.left+destination.width/2:bay!.left+bay!.width/2;
  const endY=destination?destination.top+destination.height/2:bay!.top+bay!.height/2;
  setSnapFx({id,x:x-34,y:y-34,dx:endX-x,dy:endY-y,key:++snapSequence.current});
 }
 function place(id:string,target:SlotInterface,origin?:{x:number;y:number}) {
  const before=store.getState().installedParts;
  if (!PARTS[id].compatibleSlots.includes(target)) { setMessage('Almost! Match this piece to its glowing spot.'); sound.playBoing(); return; }
  const replaced=before[target];
  if(replaced===id)return;
  if(replaced)store.getState().replacePart(target,id);else store.getState().installPart(target,id);
  if(store.getState().installedParts[target]===id) {
   showSnap(id,target,origin);sound.playSnap();setMessage(replaced?`${partName(id)} snapped in! ${partName(replaced)} is back on the shelf. Undo can reverse this swap.`:partLesson[id]||`${partName(id)} packed. Another tool for our explorers!`); setPicked(null);onInspect(id);
  }
 }
 function resolveDropTarget(x:number,y:number,id:string):SlotInterface|undefined{
  const element=document.elementFromPoint(x,y);
  const direct=element?.closest<HTMLElement>('[data-slot]')?.dataset.slot as SlotInterface|undefined;
  if(direct&&PARTS[id].compatibleSlots.includes(direct))return direct;
  const bay=document.querySelector<HTMLElement>(view==='3d'?'.rocket-builder-3d':'.assembly-bay')?.getBoundingClientRect();
  if(bay&&x>=bay.left-100&&x<=bay.right+100&&y>=bay.top-100&&y<=bay.bottom+100)return preferredSlotFor(id);
  return undefined;
 }
 function pointerDown(e:PointerEvent<HTMLButtonElement>,id:string) {
  if(e.button!==0||inRocket(id)) return;
  e.currentTarget.setPointerCapture(e.pointerId); drag.current={id,x:e.clientX,y:e.clientY,moved:false};
  select(id);
 }
 function pointerMove(e:PointerEvent<HTMLButtonElement>) {
  const current=drag.current; if(!current)return;
  if(Math.hypot(e.clientX-current.x,e.clientY-current.y)>6) current.moved=true;
  if(!current.moved)return;
  setDragId(current.id);
  if(floating.current)floating.current.style.transform=`translate3d(${e.clientX-42}px,${e.clientY-42}px,0)`;
  setHovered(resolveDropTarget(e.clientX,e.clientY,current.id)||null);
 }
 function pointerUp(e:PointerEvent<HTMLButtonElement>) {
  const current=drag.current;drag.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(current?.moved) {
   suppressClick.current=true; window.setTimeout(()=>{suppressClick.current=false;},0);
   const target=resolveDropTarget(e.clientX,e.clientY,current.id);
   if(target)place(current.id,target,{x:e.clientX,y:e.clientY});else setMessage('Move the part into the highlighted assembly bay, or tap the install button.');
  }
  setDragId(null);setHovered(null);
 }
 const cancelDrag=()=>{drag.current=null;setDragId(null);setHovered(null);};
 useEffect(()=>{try{localStorage.setItem('moonbound_assembly_view_v1',view);}catch{}},[view]);
 useEffect(()=>{shelf.current?.scrollTo({top:0,left:0});},[group,view]);
 useEffect(()=>{if(view!=='3d')return;let cancelled=false;import('./partThumbnails').then(m=>m.renderPartThumbnails(groupData.ids,(id,url)=>{if(!cancelled)setThumbs(current=>current[id]?current:{...current,[id]:url});},()=>cancelled));return()=>{cancelled=true;};},[view,group,groupData.ids]);
 useEffect(()=>{const cancel=(e:KeyboardEvent)=>{if(e.key==='Escape'){drag.current=null;setDragId(null);setHovered(null);setPicked(null);}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 function changeGroup(value:number){setGroup(value);setPicked(null);setMarked(new Set());setMessage('');if(shelf.current){shelf.current.scrollTop=0;shelf.current.scrollLeft=0;}}
 const occupiedSlot=active?Object.entries(installed).find(([,id])=>id===active)?.[0] as SlotInterface|undefined:undefined;
 return <div className={`chapter assembly-chapter view-${view}`}>
  <div className="chapter-top assembly-heading"><div className="assembly-title"><p className="eyebrow">THE WORKSHOP · BUILT BY YOU</p><h1>{groupData.title}<span className="dot">.</span></h1></div><div className="assembly-guide-top"><Guide person="mira" text={message||(complete?(group===2?'Your discovery kit is ready. Let’s meet the crew!':'Beautiful work! Ready for the next little challenge?'):groupData.lesson)}/></div></div>
  <div className="workshop">
   <section className="parts-shelf" aria-label="Rocket parts"><div className="workshop-top-actions"><div className="view-tabs" role="tablist" aria-label="Workshop view"><button role="tab" aria-selected={view==='2d'} className={view==='2d'?'current':''} onClick={()=>{setView('2d');setPicked(null);}}>2D</button><button role="tab" aria-selected={view==='3d'} className={view==='3d'?'current':''} onClick={()=>{setView('3d');setPicked(null);}}>3D</button></div><div className="workshop-progress">{groups.map((g,i)=><button key={g.short} className={group===i?'current':''} onClick={()=>changeGroup(i)} aria-current={group===i?'step':undefined}><span>{i===0?CORE_SLOTS.every(s=>installed[s])?<Check size={13}/>:g.icon:i===1?SYSTEM_SLOTS.every(s=>installed[s])?<Check size={13}/>:g.icon:g.icon}</span>{g.short}</button>)}</div></div><div className="shelf-heading"><h2>{group===0?'Required flight systems':group===1?'Required crew systems':'Destination equipment'}</h2><div className="shelf-controls"><button aria-label="Previous parts" onClick={()=>shelf.current?.scrollBy({left:-220,top:-220,behavior:'smooth'})}><ArrowLeft size={13}/></button><span>{done}/{required.length}</span><button aria-label="More parts" onClick={()=>shelf.current?.scrollBy({left:220,top:220,behavior:'smooth'})}><ArrowRight size={13}/></button></div></div><p className="mini muted">{group<2?'Must install before launch · tap several or select all':'Choose Moon gear that fits the six equipment bays'}</p>
    {group===2&&<div className="destination-part-tabs" role="tablist" aria-label="Destination equipment"><button role="tab" aria-selected={missionTab==='moon'} className={missionTab==='moon'?'current':''} onClick={()=>{setMissionTab('moon');setMarked(new Set());}}>Moon · available</button><button role="tab" aria-selected={missionTab==='mars'} className={missionTab==='mars'?'current':''} onClick={()=>{setMissionTab('mars');setMarked(new Set());setPicked(null);}}>Mars · locked <LockKeyhole size={12}/></button></div>}
    {group===2&&missionTab==='mars'?<div className="parts-grid mars-preview-grid" ref={shelf}>{MARS_PREVIEW_PARTS.map(part=><div className="part-card locked-part-card" key={part.id}><span className="locked-part-icon"><LockKeyhole size={22}/></span><strong>{part.name}</strong><small>{part.note}</small><span className="locked-label">MARS ONLY · COMING SOON</span></div>)}</div>:<><div className="batch-actions"><button className="batch-select" onClick={toggleAll} disabled={!selectableIds.length}>{marked.size===selectableIds.length&&selectableIds.length?<CheckSquare2 size={15}/>:<Square size={15}/>} Select all</button><button className="batch-add" onClick={addMarked} disabled={!marked.size}><PackagePlus size={15}/> Add selected {marked.size?`(${marked.size})`:''}</button></div><div className="parts-grid" ref={shelf}>{groupData.ids.map(id=><button key={id} data-part-id={id} aria-label={`${inRocket(id)?'Inspect':'Select'} ${partName(id)}`} aria-pressed={marked.has(id)||active===id} className={`part-card ${view==='3d'?'real-part-card':''} ${active===id?'picked':''} ${marked.has(id)?'marked':''} ${inRocket(id)?'installed':''}`} onPointerDown={e=>pointerDown(e,id)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}select(id);if(!inRocket(id))mark(id);}}><span className="part-select-indicator">{inRocket(id)?<Check size={12}/>:marked.has(id)?<CheckSquare2 size={13}/>:<Square size={13}/>}</span>{view==='3d'?thumbs[id]?<img className="part-thumb-3d" src={thumbs[id]} alt="" draggable={false}/>:<span className="part-thumb-loading" aria-hidden="true"/>:<PartArt id={id}/>}<strong>{partName(id)}</strong>{inRocket(id)?<span className="part-tick"><Check size={12}/></span>:group===2?<small>{MISSIONS['lunar-ice-explorer'].requiredPayloads.includes(id)?'MUST PACK · mission essential':`$${(PARTS[id].costDollars/1e6).toFixed(1)}M · ${PARTS[id].massKg} kg`}</small>:<small>MUST INSTALL · included</small>}</button>)}</div></>}
    <div className={`mission-meters ${!limitsOk?'over':''}`}><div><span>Estimated mission</span><strong>${(budget.totalMissionCommittedDollars/1e9).toFixed(3)}B</strong><small>NASA OIG $4.068B launch reference + selected gear</small></div><div><span>Moon equipment</span><strong>{mass.sciencePayloadMassKg} / 250 kg</strong><small>${(budget.discretionarySpentDollars/1e6).toFixed(1)} / 25M equipment allowance</small></div><div><span>{duration}-day crew plan</span><strong>{Math.round(mass.crewDailyConsumablesKg)} kg</strong><small>Food, water, oxygen, clothing & margin</small></div>{!limitsOk&&<p>Limit crossed. Remove a heavy or expensive optional item before launch.</p>}</div>
    <div className="shelf-navigation"><button className="text-btn" onClick={()=>group>0?changeGroup(group-1):store.getState().setPhase('site')}><ArrowLeft size={15}/> Back</button><button className="primary" disabled={!complete||(group===2&&!limitsOk)} onClick={()=>group<2?changeGroup(group+1):store.getState().setPhase('crew')}>{complete?group===2?'Meet crew':'Next':`${required.length-done} to go`}<ArrowRight size={16}/></button></div>
   </section>
   {view==='2d'?<section className={`assembly-bay group-${group}`} aria-label="Assembly bay">
    <div className="bay-header"><span className="label-tag"><span className="live-dot"/> LITTLE BUILDER LAB</span><div className="bay-tools"><button className="round-btn" aria-label="Undo last part" title="Undo" disabled={!undoCount} onClick={()=>{store.getState().undo();setPicked(null);setMessage('One step back. Try a new idea!');}}><Undo2 size={18}/></button><button className="round-btn" aria-label="Redo last part" title="Redo" disabled={!redoCount} onClick={()=>{store.getState().redo();setPicked(null);setMessage('That step is back.');}}><Redo2 size={18}/></button></div></div>
    {group===0?<><div className="hangar-window"><span/><span/><span/></div><div className="hangar-beam"/><div className="rocket-position"><RocketArt installed={installed}/>{CORE_SLOTS.map(s=>{const id=installed[s];if(!id)return null;const heights:Record<string,number>={'booster-stage-1':22,'interstage-1':4,'booster-stage-2':18,'interstage-2':4,'booster-stage-3':11,'instrument-unit':3,'lunar-payload-bay':9,'service-module':8,'crew-capsule':6,'launch-escape-system':8};const tops:Record<string,number>={'booster-stage-1':69,'interstage-1':66,'booster-stage-2':48,'interstage-2':44,'booster-stage-3':33,'instrument-unit':30,'lunar-payload-bay':22,'service-module':15,'crew-capsule':9,'launch-escape-system':0};return <button key={s} className="rocket-piece-hit" style={{top:`${tops[s]}%`,height:`${heights[s]}%`}} onClick={()=>{onInspect(id);setMessage(partLesson[id]||`${partName(id)} is part of your rocket.`);}} aria-label={`Inspect ${partName(id)} on rocket`} title={partName(id)}/>;})}</div><div className="launch-plinth"/><div className="floor-lines"/>
     {!CORE_SLOTS.some(s=>installed[s])&&<div className="empty-note"><span>ALL GREAT ADVENTURES</span><strong>start with<br/>one piece.</strong><svg viewBox="0 0 90 70"><path d="M8 8q-2 50 70 42m-15-16 17 17-22 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></div>}
     {slot&&<button data-slot={slot} className={`drop-spot ${hovered===slot?'over':''}`} style={{top:`${Math.min(78,Math.max(12,targetY[slot]||50))}%`}} onClick={()=>active&&place(active,slot)} aria-label={`Place ${partName(active!)}`}><span className="drop-plus">+</span><span>{partName(active!)}<small>Drop or tap here</small></span></button>}
    </>:<><div className="bay-illustration"><RocketArt installed={installed}/></div><div className="packing-title"><span className="label-tag">{group===1?'CAPSULE CHECK-IN':'THE DISCOVERY CASE'}</span><h2>{group===1?'A little home in space.':'Big discoveries. Small tools.'}</h2></div><div className={`packing-slots ${group===1?'systems':''}`}>{(group===1?SYSTEM_SLOTS:SLOTS.filter(s=>s.viewMode==='sciencePayload').map(s=>s.id)).map((s,i)=>{const id=installed[s];const match=Boolean(active&&PARTS[active].compatibleSlots.includes(s)&&active!==id);return <button key={s} data-slot={s} className={`packing-slot ${match?'match':''} ${hovered===s?'over':''} ${id?'filled':''}`} onClick={()=>active&&match?place(active,s):id?select(id):setMessage('Choose a tool from your shelf first.')} aria-label={match?`${id?'Swap':'Place'} ${partName(active!)} in bay ${i+1}`:id?`Inspect installed ${partName(id)}`:`Empty bay ${i+1}`}>{id?<><PartArt id={id}/><strong>{partName(id)}</strong>{match?<small>Tap to swap</small>:<Check size={15}/>}</>:<><span className="slot-number">{group===1?['Air','Navigation','Power','Radio'][i]:i<4?`Tool ${i+1}`:`Extra ${i-3}`}</span><span className="drop-plus">+</span><small>{match?'Drop or tap here':group===1?'Find its match':'Empty bay'}</small></>}</button>;})}</div></>}
    <div className="bay-bottom"><span><Hand size={16}/> Drag a piece · or tap to place</span>{occupiedSlot&&<button className="text-btn" onClick={()=>{store.getState().uninstallPart(occupiedSlot);setMessage(`${partName(active!)} is back on the shelf.`);}}><Trash2 size={15}/> Remove piece</button>}</div>
   </section>:<Suspense fallback={<div className="rocket-builder-loading">Opening the 3D workshop…</div>}><RocketBuilder3D installed={installed} selectedId={picked} targetSlot={slot} group={group} canUndo={undoCount>0} canRedo={redoCount>0} dragging={Boolean(dragId)} dropReady={Boolean(hovered)} onPlace={place} onInspect={id=>{setPicked(id);onInspect(id);}} onUndo={()=>{store.getState().undo();setPicked(null);setMessage('One step back. Try a new idea!');}} onRedo={()=>{store.getState().redo();setPicked(null);setMessage('That step is back.');}} onRemove={target=>{store.getState().uninstallPart(target);setPicked(null);setMessage('The part is back on the shelf.');}}/></Suspense>}
  </div>
  <div ref={floating} className={`drag-ghost ${dragId?'visible':''}`} aria-hidden="true">{dragId&&(view==='3d'&&thumbs[dragId]?<img className="part-thumb-3d" src={thumbs[dragId]} alt=""/>:<PartArt id={dragId}/>)}</div>
  {snapFx&&<div key={snapFx.key} className="snap-flight" style={{left:snapFx.x,top:snapFx.y,'--snap-x':`${snapFx.dx}px`,'--snap-y':`${snapFx.dy}px`} as CSSProperties} onAnimationEnd={()=>setSnapFx(null)} aria-hidden="true">{view==='3d'&&thumbs[snapFx.id]?<img src={thumbs[snapFx.id]} alt=""/>:<PartArt id={snapFx.id}/>}</div>}
 </div>;
}
