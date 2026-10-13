import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { GameInfo } from './GameInfo.tsx';
import { MISSION_SOURCES, MODEL_BOUNDARIES } from './moon/missionSources.ts';
import './judgeExperience.css';

export function SourcesButton() {
  const [open, setOpen] = useState(false);
  const sourcePage = (title: string, ids: readonly string[]) => <div key={title} className="mission-source-page"><h3>{title}</h3>{MISSION_SOURCES.filter(source => ids.includes(source.id)).map(source => <article key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><p>{source.use}</p></article>)}</div>;
  return <><button className="conversation-icon" aria-label="NASA sources and game rules" title="NASA sources & game rules" onClick={() => setOpen(true)}><FlaskConical size={20}/></button>
    {open ? <GameInfo title="Science behind the game" onClose={() => setOpen(false)} pages={[
      sourcePage('Crew & flight', ['apollo', 'return', 'rocket']),
      sourcePage('Ice science', ['viper', 'water', 'operations']),
      sourcePage('Rock science', ['rocks', 'xray']),
      ...[0,3].map(start => <div key={`rules-${start}`} className="mission-source-page"><h3>Game rules</h3>{MODEL_BOUNDARIES.slice(start,start+3).map(rule => <article key={rule.title}><strong>{rule.title}</strong><p>{rule.text}</p></article>)}</div>),
    ]}/> : null}</>;
}
