import { ArrowLeft, ArrowRight, Rocket, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';
import './viewport.css';

export interface StoryShellProps {
  children: ReactNode;
  controls: ReactNode;
  headerExtra?: ReactNode;
  onHome?: () => void;
  exitURL?: string;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  voiceAvailable?: boolean;
  skipTarget?: string;
}

/** Shared navigation frame for conversations, mission cards and the workshop handoff. */
export function StoryShell({ children, controls, headerExtra, onHome, exitURL = import.meta.env.BASE_URL,
  voiceEnabled = true, onToggleVoice, voiceAvailable = true, skipTarget = 'story-content' }: StoryShellProps) {
  const brand = <><span><Rocket size={25} /></span>Zero To Beyond</>;
  return <div className="conversation-game">
    <a className="conversation-skip" href={`#${skipTarget}`}>Skip to mission</a>
    <header className="conversation-header">
      {onHome ? <button className="conversation-brand" onClick={onHome} aria-label="Zero To Beyond home">{brand}</button>
        : <a className="conversation-brand" href={exitURL}>{brand}</a>}
      <nav aria-label="Mission controls">
        {headerExtra}
        {onToggleVoice ? <button className="conversation-icon" onClick={onToggleVoice} disabled={!voiceAvailable}
          aria-label={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}
          aria-pressed={voiceEnabled && voiceAvailable} title={!voiceAvailable ? 'Narration unavailable' : voiceEnabled ? 'Mute narration' : 'Enable narration'}>
          {voiceEnabled && voiceAvailable ? <Volume2 size={21} /> : <VolumeX size={21} />}
        </button> : null}
      </nav>
    </header>
    {children}
    {controls}
  </div>;
}

export function StoryControls({ onBack, onNext, nextLabel = 'Next', nextDisabled = false, nextForm, progress }: {
  onBack(): void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; nextForm?: string; progress?: ReactNode;
}) {
  return <footer className="conversation-controls">
    <button className="conversation-back" type="button" onClick={onBack}><ArrowLeft size={21} />Back</button>
    <div className="conversation-progress">{progress}</div>
    <button className="conversation-next" type={nextForm ? 'submit' : 'button'} form={nextForm} disabled={nextDisabled} onClick={onNext}>
      {nextLabel}<ArrowRight size={22} />
    </button>
  </footer>;
}
