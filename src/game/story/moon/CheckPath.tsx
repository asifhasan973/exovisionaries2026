import { Check } from 'lucide-react';
import type { StoryStepId } from '../types.ts';
import { CHECK_PATH } from './checkPathData.ts';
export function CheckPath({step}:{step:StoryStepId}){
  const active=CHECK_PATH.findIndex(([id])=>id===step);
  return <ol className="readiness-path human-check-path" aria-label="Readiness stages">{CHECK_PATH.map(([id,label],index)=><li key={id} aria-current={index===active?'step':undefined} className={`${index<active?'done':''} ${index>active+1?'is-distant':''}`}><span>{index<active?<Check size={14}/>:index+1}</span>{label}</li>)}</ol>;
}
