import { usePlayerGender } from './playerCharacter.tsx';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AudioLines, SkipForward, Volume2 } from 'lucide-react';
import { CharacterStage } from './CharacterStage.tsx';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { getDialogueText, getSpeakerLabel } from './flow.ts';
import { browserNarrationEnvironment, NarrationController } from './narration.ts';
import type { CharacterCue, StoryLine } from './types.ts';
import type { ReactNode } from 'react';
import './conversation.css';
import './playability.css';
import { LearningText } from './Learning.tsx';
import { COMPACT_DIALOGUE } from './compactCopy.ts';

const CHIEF_LISTEN: CharacterCue = { character: 'chief', expression: 'encouraging', pose: 'listen' };
const COMMANDER_LISTEN: CharacterCue = { character: 'commander', expression: 'thoughtful', pose: 'listen' };

/** Controlled renderer: Module 4 supplies saved lineIndex and navigation from the story reducer. */
export function ConversationScene({ title, lines, lineIndex, playerName, onNext, onBack, headerExtra,
  nextLabel = 'Next', exitURL = import.meta.env.BASE_URL, onHome, narrationEnabled, onNarrationEnabledChange, onSkip, autoplay = true }: {
  title: string; lines: readonly StoryLine[]; lineIndex: number; playerName: string;
  onNext(): void; onBack(): void; headerExtra?: ReactNode; nextLabel?: string; exitURL?: string;
  onHome?: () => void; narrationEnabled?: boolean; onNarrationEnabledChange?: (enabled: boolean) => void;
  onSkip?: () => void; autoplay?: boolean;
}) {
  const gender = usePlayerGender();
  const line = lines[lineIndex];
  if (!line) throw new Error(`Missing conversation line: ${title}/${lineIndex}`);
  const text = getDialogueText({ ...line, text: COMPACT_DIALOGUE[line.id] ?? line.text }, playerName);
  const label = `${getSpeakerLabel(line, playerName)} · ${line.speaker.character === 'chief' ? 'Mission director' : line.sourceSpeaker === 'Charlie' ? 'You' : 'Mission engineer'}`;
  const [controller] = useState(() => new NarrationController(browserNarrationEnvironment()));
  const narration = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [localEnabled, setLocalEnabled] = useState(true);
  const enabled = narrationEnabled ?? localEnabled;
  const toggleVoice = () => {
    controller.stop();
    if (onNarrationEnabledChange) onNarrationEnabledChange(!enabled);
    else setLocalEnabled(!enabled);
  };
  useEffect(() => {
    // Defer one turn so StrictMode's setup/cleanup probe cannot submit duplicate audio.
    const timer = enabled && autoplay ? setTimeout(() => {
      if (!document.hidden) controller.speak(text, line.speaker.character, COMPACT_DIALOGUE[line.id] ? `short-${line.id}` : line.id, gender);
    }, 0) : undefined;
    if (!enabled) controller.stop();
    return () => { clearTimeout(timer); controller.stop(); };
  }, [controller, text, line.id, line.speaker.character, enabled, autoplay, gender]);
  useEffect(() => {
    const hide = () => { if (document.hidden) controller.stop(); };
    document.addEventListener('visibilitychange', hide);
    const pause = () => controller.stop(); window.addEventListener('game-help-open', pause);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('game-help-open', pause); controller.stop(); };
  }, [controller]);
  const next = () => { controller.stop(); onNext(); };
  const back = () => { controller.stop(); onBack(); };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  });
  const twoActors = lines.some(item => item.speaker.character === 'chief');
  const chief = line.speaker.character === 'chief' ? line.speaker : line.listener?.character === 'chief' ? line.listener : CHIEF_LISTEN;
  const commander = line.speaker.character === 'commander' ? line.speaker : line.listener?.character === 'commander' ? line.listener : COMMANDER_LISTEN;
  const available = narration.status !== 'unavailable';

  return <StoryShell onHome={onHome} exitURL={exitURL} headerExtra={headerExtra} voiceEnabled={enabled}
    onToggleVoice={toggleVoice} voiceAvailable={available} skipTarget="conversation-dialogue"
    controls={<StoryControls onBack={back} onNext={next} nextLabel={nextLabel} progress={<div className="story-briefing-progress">
      <span aria-label={`Line ${lineIndex + 1} of ${lines.length}`}>Briefing · {lineIndex + 1}/{lines.length}</span>
      {onSkip ? <button className="story-skip-briefing" aria-label="Skip briefing" title="Skip briefing" onClick={() => { controller.stop(); onSkip(); }}><SkipForward size={18} /><span>Skip briefing</span></button> : null}
    </div>} />}>
    <main className="conversation-main" aria-label={title}>
      <div className={`conversation-stage ${twoActors ? 'has-two-actors' : ''}`} aria-label="Character stage">
        <div className="conversation-stage-orbit orbit-one" /><div className="conversation-stage-orbit orbit-two" />
        <span className="conversation-stage-label">MISSION CONTROL</span>
        {twoActors ? <CharacterStage cue={chief} active={line.speaker.character === 'chief'} label="Chief"
          speechTime={controller.getSpeechTime} speaking={narration.status === 'speaking' && narration.character === 'chief'} /> : null}
        <CharacterStage cue={commander} active={line.speaker.character === 'commander'} label="Commander"
          speechTime={controller.getSpeechTime} speaking={narration.status === 'speaking' && narration.character === 'commander'} />
      </div>
      <section className="conversation-panel" aria-labelledby="conversation-title">
        <div className="conversation-scene-heading"><span>MISSION BRIEFING</span><h1 id="conversation-title">{title}</h1></div>
        <div className="conversation-dialogue" id="conversation-dialogue" tabIndex={0}>
          <div className="conversation-speaker"><AudioLines size={22} /><strong>{label}</strong>
            <button className="conversation-icon" aria-label="Replay this line" title="Replay this line"
              disabled={!available || !enabled} onClick={() => controller.speak(text, line.speaker.character, COMPACT_DIALOGUE[line.id] ? `short-${line.id}` : line.id, gender)}><Volume2 size={20} /></button>
          </div>
          <p key={line.id} data-line-id={line.id} aria-live="polite" aria-atomic="true"><LearningText text={text} /></p>
        </div>
        <span className="conversation-audio-status" role="status">
          {narration.status === 'unavailable' ? 'Voice unavailable · keep playing' : narration.status === 'error' ? 'Voice unavailable · tap replay to retry' : !enabled ? 'Voice off' : narration.status === 'speaking' ? '\u00a0' : '\u00a0'}
        </span>
      </section>
    </main>
  </StoryShell>;
}
