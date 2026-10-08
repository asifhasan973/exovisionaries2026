import { useState } from 'react';
import { ArrowRight, Clapperboard, Rocket } from 'lucide-react';
import { STORY_FLOW } from './flow.ts';
import { ConversationScene } from './ConversationScene.tsx';
import type { StoryStep } from './types.ts';
import './conversation.css';

const SCENES = STORY_FLOW.filter((step): step is Extract<StoryStep, { kind: 'conversation' }> => step.kind === 'conversation');

/** Review harness only. Choice screens and saved routing belong to Module 4. */
export default function ConversationPreview() {
  const [started, setStarted] = useState(false);
  const [name, setName] = useState('Charlie');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [menu, setMenu] = useState(false);
  const [finished, setFinished] = useState(false);
  const scene = SCENES[sceneIndex];
  const moveScene = (index: number, line = 0) => { setSceneIndex(index); setLineIndex(line); setMenu(false); };
  const next = () => {
    if (lineIndex + 1 < scene.lines.length) setLineIndex(index => index + 1);
    else if (sceneIndex + 1 < SCENES.length) moveScene(sceneIndex + 1);
    else { setStarted(false); setFinished(true); }
  };
  const back = () => {
    if (lineIndex > 0) setLineIndex(index => index - 1);
    else if (sceneIndex > 0) moveScene(sceneIndex - 1, SCENES[sceneIndex - 1].lines.length - 1);
    else setStarted(false);
  };
  const base = import.meta.env.BASE_URL;
  if (!started) return <div className="conversation-game conversation-welcome">
    <header className="conversation-header"><a className="conversation-brand" href={base}><span><Rocket size={25} /></span>Zero To Beyond</a><a className="conversation-exit" href={base}>Back to game</a></header>
    <main className="conversation-preview-intro">
      <span className="conversation-preview-badge"><Clapperboard size={18} />MODULE 3 · CONVERSATION PREVIEW</span>
      <h1>{finished ? 'Briefing complete!' : 'Meet your mission team.'}</h1>
      <p>{finished ? 'All five scenes reviewed. Mission selection comes next.' : 'Chief and Commander are ready. Click to follow their story.'}</p>
      <label htmlFor="preview-name">Preview name</label><input id="preview-name" value={name} maxLength={32} onChange={event => setName(event.target.value)} autoComplete="off" />
      <button className="conversation-next" onClick={() => { moveScene(0); setStarted(true); setFinished(false); }}>{finished ? 'Play again' : 'Start conversation'}<ArrowRight size={22} /></button>
      <small>This preview shows conversations only. Your existing game save is untouched.</small>
    </main>
  </div>;
  return <ConversationScene title={scene.title} lines={scene.lines} lineIndex={lineIndex} playerName={name.trim() || 'Charlie'}
    onNext={next} onBack={back} nextLabel={sceneIndex === SCENES.length - 1 && lineIndex === scene.lines.length - 1 ? 'Finish' : 'Next'}
    headerExtra={<div className="conversation-preview-menu">
      <button className="conversation-scene-picker" aria-label="Scenes" aria-expanded={menu} aria-controls="preview-scenes" onClick={() => setMenu(value => !value)}><Clapperboard size={17} /><span>Scenes</span></button>
      {menu ? <div id="preview-scenes" className="conversation-scene-options"><span>Preview scenes</span>{SCENES.map((item, index) => <button key={item.id} aria-current={index === sceneIndex ? 'true' : undefined} onClick={() => moveScene(index)}>{index + 1}. {item.title}</button>)}</div> : null}
    </div>} />;
}
