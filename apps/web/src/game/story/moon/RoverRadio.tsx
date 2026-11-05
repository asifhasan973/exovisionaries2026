import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { NarrationController, browserNarrationEnvironment } from '../narration.ts';
import { usePlayerGender } from '../playerCharacterContext.ts';
import { useStoryNavigation } from '../storyNavigationContext.ts';
import { ROVER_RADIO } from './roverCopy.ts';

export function RoverRadio({id,enabled}:{id:keyof typeof ROVER_RADIO;enabled:boolean}){
  const [controller]=useState(()=>new NarrationController(browserNarrationEnvironment()));
  const navigation=useStoryNavigation(),gender=usePlayerGender(),line=ROVER_RADIO[id];
  const play=()=>controller.speak(line.text,line.speaker==='Scientist'?'chief':'commander',`rover-radio-${id}`,gender);
  useEffect(()=>{
    if(enabled&&navigation?.autoplay!==false&&!navigation?.reviewing)controller.speak(line.text,line.speaker==='Scientist'?'chief':'commander',`rover-radio-${id}`,gender);
    return()=>controller.stop();
  },[controller,enabled,id,line,gender,navigation?.autoplay,navigation?.reviewing]);
  return <aside className="rover-radio"><span>{line.speaker} · Cabin radio</span><p>{line.text}</p><button aria-label="Replay cabin radio" disabled={!enabled} onClick={play}><Volume2 size={15}/></button></aside>;
}
