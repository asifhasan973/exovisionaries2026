import { useState } from 'react';
import { GameInfo } from './GameInfo.tsx';
import { DEMO_CHAPTERS, DEMO_GROUPS } from './demoChapters.ts';
import type { DemoChapterId } from './demoChapters.ts';

/** Short chapter pages keep every shortcut reachable without scrolling. */
export function DemoMenu({ onChoose, onResume, onClose, resumeAvailable, busy, error }: {
  onChoose(id: DemoChapterId): void; onResume(): void; onClose(): void;
  resumeAvailable: boolean; busy: boolean; error: string | null;
}) {
  const [group, setGroup] = useState<typeof DEMO_GROUPS[number]>('Start here');
  return <GameInfo title="Judge demo" onClose={onClose} pages={[
    <div key="chapters" className="judge-menu">
      <p>Assisted chapters. Your saved game stays safe.</p>
      <div className="judge-tabs" role="group" aria-label="Demo chapters">{DEMO_GROUPS.map(name => <button key={name} disabled={busy} aria-pressed={name === group} onClick={() => setGroup(name)}>{name}</button>)}</div>
      <div className="story-demo-grid">{DEMO_CHAPTERS.filter(chapter => chapter.group === group).map(chapter => <button key={chapter.id} disabled={busy} onClick={() => onChoose(chapter.id)}>{chapter.label}<small>{chapter.id === 'battery-challenge' ? 'Fix it → retry → fly' : 'Assisted checkpoint'}</small></button>)}</div>
      {resumeAvailable ? <button className="game-info-trigger" disabled={busy} onClick={onResume}>Resume demo checkpoint</button> : null}
      <p role="status">{busy ? 'Preparing your chapter…' : error ?? (group === 'Start here' ? 'Battery challenge: try 100 Wh, then upgrade or drill less.' : '')}</p>
    </div>,
  ]} />;
}
