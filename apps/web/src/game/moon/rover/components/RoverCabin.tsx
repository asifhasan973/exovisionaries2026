import { useEffect, useState, useSyncExternalStore } from 'react';
import { Volume2 } from 'lucide-react';
import { CharacterStage } from '@/game/moon/narrative/components/CharacterStage';
import { NarrationController, browserNarrationEnvironment } from '@/game/moon/narrative/voice/narration';
import { usePlayerGender } from '@/game/moon/narrative/hooks/playerCharacterContext';
import { useStoryNavigation } from '@/game/moon/core/storyNavigationContext';
import { useCargoRoverImage } from '../useCargoRoverImage';
import { useLoadingStore } from '@exo/ui';
import type { PreparationSelection } from '@/game/moon/core/design';
import { ROVER_TALKS } from '../roverCopy';
import './roverCabin.css';
import type { RoverState } from '../rover';
import type { MoonSession } from '@/game/moon/shared/session';
export function RoverCabin({ rover, moon, preparation, voiceEnabled }: { rover: RoverState; moon: MoonSession; preparation:PreparationSelection; voiceEnabled: boolean }) {
  const [controller] = useState(() => new NarrationController(browserNarrationEnvironment())), gender = usePlayerGender(), navigation = useStoryNavigation();
  const narration = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const roverImage=useCargoRoverImage(preparation,true);
  useEffect(()=>{
    const loading=useLoadingStore.getState();if(!loading.isLoading)void loading.startLoading('custom','Opening the crew control cabin…');
    const task=Promise.all(['story/lunar-cabin-v1.webp','story/crew-portraits/scientist-seated-v1.webp'].map(path=>{const image=new Image();image.src=`${import.meta.env.BASE_URL}${path}`;return image.decode().catch(()=>{});}));loading.registerLoaderTask(task);
  },[]);
  const line = ROVER_TALKS[rover.talk][rover.line], commander = line.speaker === 'Commander';
  useEffect(() => {
    if (voiceEnabled && navigation?.autoplay !== false && !navigation?.reviewing) controller.speak(line.text, commander ? 'commander' : 'chief', `rover-run-${rover.talk}-${rover.line}`, gender);
    return () => controller.stop();
  }, [controller, line.text, commander, rover.talk, rover.line, voiceEnabled, gender, navigation?.autoplay, navigation?.reviewing]);
  return <section className="rover-cabin" aria-label="Inside the lunar lander">
    <div className="rover-cabin-scene" style={{backgroundImage:`url(${import.meta.env.BASE_URL}story/lunar-cabin-v1.webp)`}} aria-hidden="true"/>
    <span className="rover-cabin-location">LUNAR LANDER · REMOTE CONTROL CABIN</span>
    <div className="rover-cabin-crew">
      <div className={`rover-cabin-person rover-cabin-commander ${commander ? 'is-speaking' : ''}`}><CharacterStage cue={{ character: 'commander', expression: 'confident', pose: commander ? 'explain' : 'listen' }} active={commander} speaking={commander && narration.status === 'speaking'} speechTime={controller.getSpeechTime} label="Commander"/><span>Commander · Rover operator</span></div>
      <div className={`rover-cabin-person rover-cabin-scientist ${!commander ? 'is-speaking' : ''}`} data-speaking={!commander&&narration.status==='speaking'}><img src={`${import.meta.env.BASE_URL}story/crew-portraits/scientist-seated-v1.webp`} alt="Scientist seated at the lander's remote-control console"/><span>Scientist · {moon.objective==='lunar-geology'?'Geology':'Science'} navigator</span></div>
    </div>
    <div className="rover-cabin-console">
      <div className="rover-cabin-screen"><small>ROVER LINK · LIVE</small>{roverImage?<img src={roverImage} alt="Your rover controlled from inside the lander"/>:null}<span>REMOTE CONTROL ACTIVE</span></div>
      <div className="rover-cabin-readings"><span>CREW INSIDE <b>2 / 2</b></span><span>SAMPLES DELIVERED <b>{rover.deposited.length} / 2</b></span><span>BATTERY <b>{Math.round(rover.batteryWh/rover.capacityWh*100)}%</b></span></div>
      <div className="rover-cabin-switches" aria-hidden="true"><i/><i/><i/><i/><i/><i/><strong>COMMS ●</strong></div>
    </div>
    <div className="rover-cabin-dialogue"><strong>{line.speaker}</strong><p>{line.text}</p><button aria-label="Replay conversation" disabled={!voiceEnabled} onClick={() => controller.speak(line.text, commander ? 'commander' : 'chief', `rover-run-${rover.talk}-${rover.line}`, gender)}><Volume2 size={20}/></button><small>{rover.line + 1} / 2</small></div>
  </section>;
}
