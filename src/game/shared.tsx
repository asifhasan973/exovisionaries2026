import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Volume2, X } from 'lucide-react';
import { Portrait } from './art';
import { useMissionStore } from '../state/missionStore';
export function Guide({text,person='mira'}:{text:string;person?:'mira'|'leo'|'kai'}) {
 const muted=useMissionStore(s=>s.audioSettings.isMuted);
 function read(){if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const line=new SpeechSynthesisUtterance(text);line.rate=.9;window.speechSynthesis.speak(line);}
 useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();},[text]);
 return <div className="guide"><Portrait person={person}/><div><span className="guide-name">{person==='mira'?'MIRA · YOUR MISSION GUIDE':person==='kai'?'KAI · FLIGHT CONTROL':'LEO · YOUR CREWMATE'}</span><p aria-live="polite">{text}</p></div>{!muted&&'speechSynthesis' in window&&<button className="read-aloud" onClick={read} aria-label="Read the hint aloud"><Volume2 size={17}/></button>}</div>;
}
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=ref.current;d?.showModal();return()=>d?.close();},[]);
 return <dialog ref={ref} className="story-dialog" aria-label={title} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog-heading"><h2>{title}</h2><button autoFocus className="round-btn" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></div>{children}</dialog>;
}
