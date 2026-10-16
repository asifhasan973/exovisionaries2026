import { usePlayerGender } from './playerCharacter.tsx';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Volume2 } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { NarrationController, browserNarrationEnvironment } from './narration.ts';
import { ENGINEER_REPLIES, pickEngineerReply } from './voiceClips.ts';
import type { EngineerReaction } from './voiceClips.ts';
import { engineerCue } from './engineer.ts';
import './playability.css';
import { LearningText } from './Learning.tsx';

export type { EngineerReaction } from './voiceClips.ts';
export function EngineerCompanion({ reaction, token, voiceEnabled, statusText, scriptedReply }: { reaction: EngineerReaction; token: number; voiceEnabled: boolean; statusText?: string; scriptedReply?: { id: string; text: string } }) {
  const gender = usePlayerGender();
  const [controller] = useState(() => new NarrationController(browserNarrationEnvironment()));
  const narration = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [reply, setReply] = useState(() => ENGINEER_REPLIES[reaction][0]);
  const selection = useRef({ reaction, token, reply });
  const previousReplies = useRef<Partial<Record<EngineerReaction, string>>>({});
  const celebrate = reaction === 'complete' || reaction === 'trialPass';
  const cue = engineerCue(reaction, scriptedReply?.id);
  useEffect(() => {
    if (selection.current.reaction !== reaction || selection.current.token !== token) {
      const chosen = pickEngineerReply(reaction, previousReplies.current[reaction]);
      selection.current = { reaction, token, reply: chosen };
      previousReplies.current[reaction] = chosen.id;
      setReply(chosen);
    }
    const chosen = scriptedReply ?? selection.current.reply;
    const timer = (token || scriptedReply) && voiceEnabled && !statusText ? setTimeout(() => {
      if (!document.hidden) controller.speak(chosen.text, 'commander', chosen.id, gender);
    }, 0) : undefined;
    const hide = () => { if (document.hidden) controller.pause(); };
    document.addEventListener('visibilitychange', hide);
    const pause = () => controller.pause(); window.addEventListener('game-help-open', pause);
    return () => { clearTimeout(timer); controller.stop(); document.removeEventListener('visibilitychange', hide); window.removeEventListener('game-help-open', pause); };
  }, [controller, reaction, token, voiceEnabled, gender, scriptedReply?.id, scriptedReply?.text, statusText]);
  return <aside className={`workshop-engineer ${celebrate ? 'is-celebrating' : reaction === 'warning' || reaction === 'trialFail' ? 'is-warning' : ''}`} data-speaking={narration.status === 'speaking'} aria-label="Mission engineer">
    <div className="engineer-character"><CharacterStage cue={cue} active speechTime={controller.getSpeechTime} speaking={narration.status === 'speaking'} label="Commander" /></div>
    <div className="engineer-bubble"><span>COMMANDER · MISSION ENGINEER</span><p role="status" aria-live="polite"><LearningText text={statusText ?? scriptedReply?.text ?? reply.text} /></p></div>
    <button className="conversation-icon" disabled={!voiceEnabled || !!statusText} aria-label="Replay engineer advice" onClick={() => controller.speak(scriptedReply?.text ?? reply.text, 'commander', scriptedReply?.id ?? reply.id, gender)}><Volume2 size={19} /></button>
  </aside>;
}
