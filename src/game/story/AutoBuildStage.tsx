import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Hand, PackageCheck } from 'lucide-react';
import { installedIds, partById, STAGE_CATEGORIES, WORKSHOP_STAGES } from './preparation.ts';
import type { WorkshopStage } from './preparation.ts';
import type { PreparationSelection } from './design.ts';
import type { MissionEvent } from './workshopSession.ts';
import { useGameSettings } from './gameSettingsContext.ts';
import { autoBuildParts } from './autoBuildPlan.ts';
import { sound } from '../../audio/soundEngine.ts';

type Ghost = { id: string; fromX: number; fromY: number; toX: number; toY: number };
/** Runs the same install and Next events as the player, one visible part at a time. */
export function AutoBuildStage({ stage, preparation, shadow, thumbnails, dispatch, onFocus, onInstalled, onDepthPreview, onDone }: {
  stage: WorkshopStage; preparation: PreparationSelection; shadow: boolean; thumbnails: Record<string, string>;
  dispatch(event: MissionEvent): void; onFocus(id: string): void; onInstalled(id: string): void; onDepthPreview(): void; onDone(): void;
}) {
  const { effects, gentle } = useGameSettings();
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [paused, setPaused] = useState(document.hidden);
  const callbacks = useRef({ dispatch, onFocus, onInstalled, onDepthPreview, onDone });
  useEffect(() => { callbacks.current = { dispatch, onFocus, onInstalled, onDepthPreview, onDone }; });
  const installed = installedIds(preparation);
  const nextId = autoBuildParts(shadow).find(id => STAGE_CATEGORIES[stage].includes(partById(id)!.category) && !installed.includes(id));
  useEffect(() => { const visibility = () => setPaused(document.hidden); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, []);
  useEffect(() => {
    if (paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!nextId) {
      if (stage === 'science-build') callbacks.current.onDepthPreview();
      timers.push(setTimeout(() => {
        if (stage === WORKSHOP_STAGES.at(-1)) { callbacks.current.onDone(); sound.setMuted(!effects); sound.playFanfare(); }
        callbacks.current.dispatch({ type: 'next' });
      }, 550));
    } else {
      callbacks.current.onFocus(nextId);
      timers.push(setTimeout(() => {
        const source = document.querySelector(`[data-part-id="${nextId}"] .workshop-pick`)?.getBoundingClientRect();
        const target = document.querySelector('.workshop-drop-zone')?.getBoundingClientRect();
        if (source && target) setGhost({ id: nextId, fromX: source.x + source.width / 2, fromY: source.y + source.height / 2, toX: target.x + target.width * .55, toY: target.y + target.height * .5 });
      }, 130));
      timers.push(setTimeout(() => {
        callbacks.current.dispatch({ type: 'install', ids: [nextId] });
        callbacks.current.onInstalled(nextId); setGhost(null);
        sound.setMuted(!effects); sound.playSnap();
      }, 600));
    }
    return () => timers.forEach(clearTimeout);
  }, [stage, nextId, paused, effects]);
  return ghost && !paused ? createPortal(<div key={ghost.id} className={`auto-build-ghost ${gentle ? 'is-gentle' : ''}`} style={{ '--from-x': `${ghost.fromX}px`, '--from-y': `${ghost.fromY}px`, '--to-x': `${ghost.toX}px`, '--to-y': `${ghost.toY}px` } as CSSProperties} aria-hidden="true">
    {thumbnails[ghost.id] ? <img src={thumbnails[ghost.id]} alt=""/> : <PackageCheck size={36}/>}<Hand className="auto-build-hand" size={26}/><span>{partById(ghost.id)?.name}</span>
  </div>, document.body) : null;
}
