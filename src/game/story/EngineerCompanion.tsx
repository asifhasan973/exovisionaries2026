import { useEffect, useState, useSyncExternalStore } from 'react';
import { Volume2 } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { NarrationController, browserNarrationEnvironment } from './narration.ts';
import { ENGINEER_LINES } from './voiceClips.ts';
import { engineerCue } from './engineer.ts';
import './playability.css';

export type EngineerReaction = keyof typeof ENGINEER_LINES;
export function EngineerCompanion({ reaction, token, voiceEnabled }: { reaction: EngineerReaction; token: number; voiceEnabled: boolean }) {
  const [controller] = useState(() => new NarrationController(browserNarrationEnvironment()));
  const narration = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const text = ENGINEER_LINES[reaction];
  const celebrate = reaction === 'complete' || reaction === 'trialPass';
  const cue = engineerCue(reaction);
  useEffect(() => {
    const timer = token && voiceEnabled ? setTimeout(() => controller.speak(text, 'commander', `engineer-${reaction}`), 0) : undefined;
    const hide = () => { if (document.hidden) controller.stop(); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearTimeout(timer); controller.stop(); document.removeEventListener('visibilitychange', hide); };
  }, [controller, reaction, token, text, voiceEnabled]);
  return <aside className={`workshop-engineer ${celebrate ? 'is-celebrating' : ''}`} aria-label="Mission engineer">
    <div className="engineer-character"><CharacterStage cue={cue} active speaking={narration.status === 'speaking'} label="Commander" /></div>
    <div className="engineer-bubble"><span>COMMANDER · MISSION ENGINEER</span><p role="status" aria-live="polite">{text}</p></div>
    <button className="conversation-icon" disabled={!voiceEnabled} aria-label="Replay engineer advice" onClick={() => controller.speak(text, 'commander', `engineer-${reaction}`)}><Volume2 size={19} /></button>
  </aside>;
}
