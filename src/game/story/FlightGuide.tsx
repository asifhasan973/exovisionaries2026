import { usePlayerGender } from './playerCharacter.tsx';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Volume2 } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { engineerCue } from './engineer.ts';
import { NarrationController, browserNarrationEnvironment } from './narration.ts';
import { flightVoiceId } from './voiceClips.ts';

/** Brief radio reactions, triggered by a new flight phase rather than every telemetry tick. */
export function FlightGuide({ text, phase, celebrate, warning, voiceEnabled }: { text: string; phase: string; celebrate: boolean; warning: boolean; voiceEnabled: boolean }) {
  const gender = usePlayerGender();
  const [controller] = useState(() => new NarrationController(browserNarrationEnvironment()));
  const narration = useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  useEffect(() => {
    const timer = voiceEnabled ? setTimeout(() => { if (!document.hidden) controller.speak(text,'commander',flightVoiceId(text),gender); },0) : undefined;
    const pause = () => controller.pause();
    window.addEventListener('game-help-open',pause); document.addEventListener('visibilitychange',pause);
    return () => { clearTimeout(timer); controller.stop(); window.removeEventListener('game-help-open',pause); document.removeEventListener('visibilitychange',pause); };
  },[controller,phase,text,voiceEnabled,gender]);
  return <aside className={`launch-guide ${celebrate ? 'is-celebrating' : ''}`} aria-label="Mission engineer">
    <div className="launch-guide-art"><CharacterStage cue={engineerCue(celebrate ? 'complete' : warning ? 'warning' : 'intro', flightVoiceId(text))} active speechTime={controller.getSpeechTime} speaking={narration.status === 'speaking'} label="Commander" /></div>
    <div><span>COMMANDER · FLIGHT COMMS</span><p role="status">{text}</p></div>
    <button className="conversation-icon" disabled={!voiceEnabled} aria-label="Replay flight advice" onClick={() => controller.speak(text,'commander',flightVoiceId(text),gender)}><Volume2 size={18}/></button>
  </aside>;
}
