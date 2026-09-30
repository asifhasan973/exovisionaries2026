import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import {
  ArrowRight,
  Check,
  FastForward,
  Hand,
  Lightbulb,
  Play,
  Redo2,
  Shield,
  Sparkles,
  Undo2,
  WandSparkles
} from 'lucide-react';
import { PARTS } from '../data/parts';
import { computeBudgetAccounting, computeMassAccounting } from '../engine/accounting';
import { sound } from '../audio/soundEngine';
import { useMissionStore } from '../state/missionStore';
import type { SlotInterface } from '../types/mission';
import { PartArt, RocketArt } from './art';
import { partLesson, partName } from './catalog';
import { MissionDock } from './shared';
import { MissionCinematic } from './MissionCinematic';
import {
  ASSEMBLY_CLUES,
  ASSEMBLY_ROUNDS,
  STORY_BUILD_INSTALLED_PARTS,
  STORY_PART_IDS
} from './assemblyMission';
import './builder3d.css';
import './milestone1.css';

const RocketBuilder3D = lazy(() => import('./RocketBuilder3D'));

const targetY: Partial<Record<SlotInterface, number>> = {
  'booster-stage-1': 78,
  'interstage-1': 67,
  'booster-stage-2': 55,
  'interstage-2': 45,
  'booster-stage-3': 36,
  'instrument-unit': 31,
  'lunar-payload-bay': 25,
  'service-module': 18,
  'crew-capsule': 11,
  'launch-escape-system': 4
};

const slotForPart = new Map(
  Object.entries(STORY_BUILD_INSTALLED_PARTS).map(([slot, id]) => [id, slot as SlotInterface])
);

export function Assembly({ onInspect }: { onInspect: (id: string) => void }) {
  const installed = useMissionStore(s => s.installedParts);
  const crew = useMissionStore(s => s.crewAssignments);
  const duration = useMissionStore(s => s.missionDurationDays);
  const undoCount = useMissionStore(s => s.undoStack.length);
  const redoCount = useMissionStore(s => s.redoStack.length);
  const reducedMotion = useMissionStore(s => s.audioSettings.reducedMotion);
  const store = useMissionStore;

  const initialRound = Math.min(
    ASSEMBLY_ROUNDS.findIndex(round => round.ids.some(id => !Object.values(installed).includes(id))),
    ASSEMBLY_ROUNDS.length - 1
  );
  const [roundIndex, setRoundIndex] = useState(initialRound < 0 ? ASSEMBLY_ROUNDS.length - 1 : initialRound);
  const [view, setView] = useState<'2d' | '3d'>(() => {
    try { return localStorage.getItem('zero_to_beyond_assembly_view_v1') === '2d' ? '2d' : '3d'; }
    catch { return '3d'; }
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [shields, setShields] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [autoIndex, setAutoIndex] = useState(0);
  const autoTimer = useRef<number | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const floating = useRef<HTMLDivElement>(null);
  const snapSequence = useRef(0);
  const [snapFx, setSnapFx] = useState<{ id: string; x: number; y: number; dx: number; dy: number; key: number } | null>(null);
  const [returnFx, setReturnFx] = useState<{ id: string; x: number; y: number; dx: number; dy: number; key: number } | null>(null);
  const [cinematic, setCinematic] = useState<{ kind: 'briefing' | 'success' | 'rescue' | 'guide'; round: number } | null>(() =>
    STORY_PART_IDS.every(id => Object.values(installed).includes(id)) ? null : { kind: 'briefing', round: initialRound < 0 ? 0 : initialRound }
  );

  const round = ASSEMBLY_ROUNDS[roundIndex];
  const installedIds = Object.values(installed);
  const isInstalled = (id: string) => installedIds.includes(id);
  const nextId = round.ids.find(id => !isInstalled(id)) ?? null;
  const targetSlot = nextId ? slotForPart.get(nextId) : undefined;
  const roundDone = round.ids.every(isInstalled);
  const storyDone = STORY_PART_IDS.every(isInstalled);
  const completedRounds = ASSEMBLY_ROUNDS.filter(item => item.ids.every(isInstalled)).length;
  const activeClue = nextId ? ASSEMBLY_CLUES[nextId] : undefined;
  const currentPrompt = message || (roundDone
    ? `${round.title} complete. ${round.lesson}`
    : activeClue
      ? activeClue.question
      : `Find ${partName(nextId!)}. Drop it on yellow.`);

  const mass = computeMassAccounting(installed, crew, duration);
  const budget = computeBudgetAccounting(installed);
  const installedStoryCount = STORY_PART_IDS.filter(isInstalled).length;

  const currentIds = useMemo(() => round.ids, [round.ids]);

  useEffect(() => {
    try { localStorage.setItem('zero_to_beyond_assembly_view_v1', view); } catch { /* storage is optional */ }
  }, [view]);

  useEffect(() => {
    if (view !== '3d') return;
    let cancelled = false;
    import('./partThumbnails').then(module => module.renderPartThumbnails(
      currentIds,
      (id, url) => {
        if (!cancelled) setThumbs(current => current[id] ? current : { ...current, [id]: url });
      },
      () => cancelled
    ));
    return () => { cancelled = true; };
  }, [view, currentIds]);

  useEffect(() => () => {
    if (autoTimer.current) window.clearInterval(autoTimer.current);
  }, []);

  function choosePart(id: string) {
    if (autoBuilding) return false;
    if (isInstalled(id)) {
      onInspect(id);
      setMessage(partLesson[id] || `${partName(id)} is installed.`);
      setPicked(id);
      return false;
    }
    if (id !== nextId) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setWrongId(id);
      setMessage('Wrong part. Try the clue.');
      sound.playBoing();
      window.setTimeout(() => setWrongId(null), 550);
      if (nextMistakes % 2 === 0) setShields(value => {
        const next = Math.max(0, value - 1);
        if (next === 0) window.setTimeout(() => setCinematic({ kind: 'rescue', round: roundIndex }), 350);
        return next;
      });
      return false;
    }
    setPicked(id);
    setMessage(activeClue ? 'Good choice! Drop it on yellow.' : `Drop ${partName(id)} on yellow.`);
    onInspect(id);
    sound.playClick(760);
    return true;
  }

  function showSnap(id: string, origin?: { x: number; y: number }) {
    if (reducedMotion) return;
    const source = document.querySelector<HTMLElement>(`[data-part-id="${id}"]`)?.getBoundingClientRect();
    const destination = document.querySelector<HTMLElement>('.builder-target, .story-drop-target')?.getBoundingClientRect();
    if (!destination) return;
    const x = origin?.x ?? (source ? source.left + source.width / 2 : destination.left);
    const y = origin?.y ?? (source ? source.top + source.height / 2 : destination.top);
    setSnapFx({
      id,
      x: x - 34,
      y: y - 34,
      dx: destination.left + destination.width / 2 - x,
      dy: destination.top + destination.height / 2 - y,
      key: ++snapSequence.current
    });
  }

  function placePart(id: string, slot: SlotInterface, origin?: { x: number; y: number }) {
    if (id !== nextId || slot !== targetSlot || isInstalled(id)) {
      setMessage('Follow the clue. Drop on yellow.');
      sound.playBoing();
      return;
    }
    store.getState().installPart(slot, id);
    if (store.getState().installedParts[slot] !== id) {
      setMessage('That spot is full. Undo or use Quick Build.');
      return;
    }
    showSnap(id, origin);
    sound.playSnap();
    setPicked(null);
    setHintLevel(0);
    setMistakes(0);
    setMessage(partLesson[id] || `${partName(id)} locked in!`);
    onInspect(id);
    const finishedRound = round.ids.every(partId => partId === id || Object.values(store.getState().installedParts).includes(partId));
    if (finishedRound) window.setTimeout(() => setCinematic({ kind: 'success', round: roundIndex }), reducedMotion ? 80 : 650);
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0 || isInstalled(id)) return;
    suppressClick.current = true;
    if (!choosePart(id)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id, x: event.clientX, y: event.clientY, moved: false };
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 6) current.moved = true;
    if (!current.moved) return;
    setDragId(current.id);
    if (floating.current) floating.current.style.transform = `translate3d(${event.clientX - 42}px,${event.clientY - 42}px,0)`;
    const bay = document.querySelector<HTMLElement>(view === '3d' ? '.rocket-builder-3d' : '.assembly-bay')?.getBoundingClientRect();
    setHovered(Boolean(bay && event.clientX >= bay.left - 260 && event.clientX <= bay.right + 180 && event.clientY >= bay.top - 220 && event.clientY <= bay.bottom + 220));
  }

  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const bay = document.querySelector<HTMLElement>(view === '3d' ? '.rocket-builder-3d' : '.assembly-bay')?.getBoundingClientRect();
    const insideBay = Boolean(bay && event.clientX >= bay.left - 260 && event.clientX <= bay.right + 180 && event.clientY >= bay.top - 220 && event.clientY <= bay.bottom + 220);
    if (current?.moved && insideBay && targetSlot) placePart(current.id, targetSlot, { x: event.clientX, y: event.clientY });
    else if (current?.moved) {
      const source = document.querySelector<HTMLElement>(`[data-part-id="${current.id}"]`)?.getBoundingClientRect();
      if (source && !reducedMotion) setReturnFx({ id: current.id, x: event.clientX - 34, y: event.clientY - 34, dx: source.left + source.width / 2 - event.clientX, dy: source.top + source.height / 2 - event.clientY, key: ++snapSequence.current });
      setMessage('Try again. Drag it over the rocket bay.');
      sound.playBoing();
    }
    setDragId(null);
    setHovered(false);
  }

  function pointerCancel(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current?.moved) {
      const source = document.querySelector<HTMLElement>(`[data-part-id="${current.id}"]`)?.getBoundingClientRect();
      if (source && !reducedMotion) setReturnFx({ id: current.id, x: event.clientX - 34, y: event.clientY - 34, dx: source.left + source.width / 2 - event.clientX, dy: source.top + source.height / 2 - event.clientY, key: ++snapSequence.current });
    }
    setDragId(null);
    setHovered(false);
  }

  function changeRound(index: number) {
    if (index > completedRounds && index !== roundIndex) return;
    setRoundIndex(index);
    setPicked(null);
    setMessage('');
    setHintLevel(0);
    setMistakes(0);
  }

  function nextRound() {
    if (!roundDone) return;
    setCinematic({ kind: 'success', round: roundIndex });
  }

  function finishAutoBuild() {
    if (autoTimer.current) window.clearInterval(autoTimer.current);
    autoTimer.current = null;
    store.getState().applyStoryBuild();
    setAutoIndex(STORY_PART_IDS.length);
    setAutoBuilding(false);
    setRoundIndex(ASSEMBLY_ROUNDS.length - 1);
    setPicked(null);
    setMessage('Quick Build complete. Ready to test!');
    setCinematic({ kind: 'success', round: ASSEMBLY_ROUNDS.length - 1 });
  }

  function finishCinematic() {
    if (!cinematic) return;
    if (cinematic.kind === 'rescue') {
      setShields(3);
      setMistakes(0);
      setHintLevel(2);
      setWrongId(null);
      setMessage('The correct part is glowing. Try again!');
      setCinematic(null);
      return;
    }
    if (cinematic.kind === 'briefing' || cinematic.kind === 'guide') {
      setCinematic(null);
      return;
    }
    if (cinematic.round >= ASSEMBLY_ROUNDS.length - 1) {
      setCinematic(null);
      store.getState().setPhase('testing');
      return;
    }
    const next = cinematic.round + 1;
    changeRound(next);
    setCinematic({ kind: 'briefing', round: next });
  }

  function startAutoBuild() {
    if (autoBuilding) return;
    setAutoBuilding(true);
    setMessage('Quick Build started!');
    let index = 0;
    const stepMs = reducedMotion ? 80 : 430;
    autoTimer.current = window.setInterval(() => {
      const id = STORY_PART_IDS[index];
      if (!id) {
        finishAutoBuild();
        return;
      }
      const slot = slotForPart.get(id);
      if (slot && !Object.values(store.getState().installedParts).includes(id)) store.getState().installPart(slot, id);
      index += 1;
      setAutoIndex(index);
      if (index >= STORY_PART_IDS.length) window.setTimeout(finishAutoBuild, reducedMotion ? 50 : 450);
    }, stepMs);
  }

  const twoDTargetTop = targetSlot ? Math.min(82, Math.max(8, targetY[targetSlot] ?? 45)) : 45;

  return <div className={`chapter assembly-chapter story-assembly view-${view}`}>
    <div className="chapter-top assembly-heading mission-build-heading">
      <div className="assembly-title">
        <p className="eyebrow">MILESTONE 01 · BUILD & LAUNCH</p>
        <h1>{round.title}<span className="dot">.</span></h1>
      </div>
      <button type="button" className="assembly-brief-button" onClick={() => setCinematic({ kind: 'guide', round: roundIndex })}>
        <img src="/story/mira-talking.webp" alt="" />
        <span><small>MIRA · ENGINEER</small><strong>Mission hint</strong></span>
        <ArrowRight size={18}/>
      </button>
    </div>

    <div className="story-build-toolbar">
      <div className="build-rounds" aria-label="Rocket build rounds">
        {ASSEMBLY_ROUNDS.map((item, index) => {
          const done = item.ids.every(isInstalled);
          const available = index <= completedRounds || index === roundIndex;
          return <button
            key={item.id}
            className={`${index === roundIndex ? 'current' : ''} ${done ? 'done' : ''}`}
            disabled={!available}
            onClick={() => changeRound(index)}
            aria-current={index === roundIndex ? 'step' : undefined}
          >
            <span>{done ? <Check size={14} /> : index + 1}</span>
            <b>{item.short}</b>
          </button>;
        })}
      </div>
      <div className="build-mode-actions">
        <div className="view-tabs" role="tablist" aria-label="Workshop view">
          <button role="tab" aria-selected={view === '2d'} className={view === '2d' ? 'current' : ''} onClick={() => setView('2d')}>2D</button>
          <button role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'current' : ''} onClick={() => setView('3d')}>3D</button>
        </div>
        <button className="quick-build-button" onClick={startAutoBuild} disabled={autoBuilding || storyDone}>
          <WandSparkles size={17} />{storyDone ? 'Build complete' : 'Quick Build'}
        </button>
      </div>
    </div>

    <div className="workshop story-workshop">
      <section className="parts-shelf story-parts-shelf" aria-label={`${round.title} parts`}>
        <div className="mission-shields" aria-label={`${shields} mission shields remaining`}>
          <span>MISSION SHIELDS</span>
          <div>{[0, 1, 2].map(index => <Shield key={index} size={18} className={index < shields ? 'active' : ''} fill={index < shields ? 'currentColor' : 'none'} />)}</div>
        </div>
        <div className="round-copy">
          <span>ROUND {roundIndex + 1} OF {ASSEMBLY_ROUNDS.length}</span>
          <h2>{round.short}</h2>
          <p>{round.subtitle}</p>
        </div>
        {activeClue && !roundDone ? <div className="challenge-card">
          <span><Sparkles size={15} /> ENGINEER CHALLENGE</span>
          <p>{hintLevel ? activeClue.hint : 'Study the shapes. Pick the answer!'}</p>
          <button onClick={() => setHintLevel(level => Math.min(2, level + 1))}>
            <Lightbulb size={15} />{hintLevel === 0 ? 'Hint' : hintLevel === 1 ? 'Show the part' : 'Part is glowing'}
          </button>
        </div> : <div className="guided-card"><Hand size={18} /><span><b>Guided install</b><small>{nextId ? `Find ${partName(nextId)}.` : 'Round complete.'}</small></span></div>}

        <div className="story-parts-grid">
          {round.ids.map(id => {
            const installedHere = isInstalled(id);
            const isAnswer = id === nextId;
            return <button
              key={id}
              data-part-id={id}
              className={`story-part-card real-part-card ${picked === id ? 'picked' : ''} ${installedHere ? 'installed' : ''} ${wrongId === id ? 'wrong' : ''} ${hintLevel >= 2 && isAnswer ? 'hint-glow' : ''}`}
              aria-pressed={picked === id}
              onPointerDown={event => pointerDown(event, id)}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerCancel}
              onClick={() => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                choosePart(id);
              }}
            >
              <span className="part-status">{installedHere ? <Check size={14} /> : round.challengeIds.includes(id) ? '?' : ''}</span>
              {view === '3d' && thumbs[id]
                ? <img className="part-thumb-3d" src={thumbs[id]} alt="" draggable={false} />
                : <PartArt id={id} />}
              <strong>{partName(id)}</strong>
              <small>{installedHere ? 'INSTALLED' : PARTS[id].priceStatus === 'includedInPackage' ? 'MISSION HARDWARE' : `${PARTS[id].massKg} kg`}</small>
            </button>;
          })}
        </div>

        <div className="mission-meters story-meters">
          <div><span>Parts</span><strong>{installedStoryCount}/{STORY_PART_IDS.length}</strong></div>
          <div><span>Equipment</span><strong>{mass.sciencePayloadMassKg}/250 kg</strong></div>
          <div><span>Mission</span><strong>${(budget.totalMissionCommittedDollars / 1e9).toFixed(2)}B</strong></div>
        </div>

      </section>

      {view === '3d' ? <Suspense fallback={<div className="rocket-builder-loading">Opening the 3D workshop…</div>}>
        <RocketBuilder3D
          installed={installed}
          selectedId={picked === nextId ? picked : null}
          targetSlot={picked === nextId ? targetSlot : undefined}
          group={round.sceneGroup}
          canUndo={undoCount > 0}
          canRedo={redoCount > 0}
          dragging={Boolean(dragId)}
          dropReady={hovered}
          onPlace={placePart}
          onInspect={id => { setPicked(id); onInspect(id); setMessage(partLesson[id] || `${partName(id)} is installed.`); }}
          onUndo={() => { store.getState().undo(); setPicked(null); setMessage('One step back. Try a new idea!'); }}
          onRedo={() => { store.getState().redo(); setPicked(null); setMessage('That step is back.'); }}
          onRemove={slot => { store.getState().uninstallPart(slot); setPicked(null); setMessage('The part is back on the shelf.'); }}
        />
      </Suspense> : <section className={`assembly-bay story-2d-bay ${hovered ? 'drop-ready' : ''}`} aria-label="2D rocket assembly bay">
        <div className="bay-header">
          <span className="label-tag"><span className="live-dot" /> 2D MISSION VIEW</span>
          <div className="bay-tools">
            <button className="round-btn" aria-label="Undo last part" disabled={!undoCount} onClick={() => store.getState().undo()}><Undo2 size={18} /></button>
            <button className="round-btn" aria-label="Redo last part" disabled={!redoCount} onClick={() => store.getState().redo()}><Redo2 size={18} /></button>
          </div>
        </div>
        <div className="story-rocket-position"><RocketArt installed={installed} ghost={!installedStoryCount} /></div>
        {picked === nextId && targetSlot ? <button
          className="story-drop-target"
          style={{ top: `${twoDTargetTop}%` }}
          onClick={() => placePart(picked!, targetSlot)}
          aria-label={`Install ${partName(picked!)}`}
        ><span /></button> : null}
        <div className="story-bay-instruction"><Hand size={18} /><span>Drag to the rocket<small>Release anywhere in the bay.</small></span></div>
      </section>}
    </div>

    <MissionDock
      back={{ label: roundIndex ? 'Previous round' : 'Destination', onClick: () => roundIndex ? changeRound(roundIndex - 1) : store.getState().setPhase('destination') }}
      guide={{ label: 'Talk to Mira', person: 'mira', onClick: () => setCinematic({ kind: 'guide', round: roundIndex }) }}
      next={{ label: roundIndex === ASSEMBLY_ROUNDS.length - 1 ? 'Celebrate build' : 'Mission debrief', disabled: !roundDone, onClick: nextRound }}
    />

    {autoBuilding ? <div className="auto-build-overlay" role="status" aria-live="polite">
      <div className="auto-build-card">
        <span className="auto-build-icon"><FastForward size={25} /></span>
        <div><span>ASSISTED ASSEMBLY</span><h2>Building system {Math.min(autoIndex + 1, STORY_PART_IDS.length)} of {STORY_PART_IDS.length}</h2></div>
        <div className="auto-build-progress"><span style={{ width: `${Math.max(4, autoIndex / STORY_PART_IDS.length * 100)}%` }} /></div>
        <button className="primary" onClick={finishAutoBuild}>Finish now <Play size={16} /></button>
      </div>
    </div> : null}

    <div ref={floating} className={`drag-ghost ${dragId ? 'visible' : ''}`} aria-hidden="true">
      {dragId && (view === '3d' && thumbs[dragId] ? <img className="part-thumb-3d" src={thumbs[dragId]} alt="" /> : <PartArt id={dragId} />)}
    </div>
    {snapFx ? <div
      key={snapFx.key}
      className="snap-flight"
      style={{ left: snapFx.x, top: snapFx.y, '--snap-x': `${snapFx.dx}px`, '--snap-y': `${snapFx.dy}px` } as CSSProperties}
      onAnimationEnd={() => setSnapFx(null)}
      aria-hidden="true"
    >{view === '3d' && thumbs[snapFx.id] ? <img src={thumbs[snapFx.id]} alt="" /> : <PartArt id={snapFx.id} />}</div> : null}
    {returnFx ? <div
      key={returnFx.key}
      className="return-flight"
      style={{ left: returnFx.x, top: returnFx.y, '--return-x': `${returnFx.dx}px`, '--return-y': `${returnFx.dy}px` } as CSSProperties}
      onAnimationEnd={() => setReturnFx(null)}
      aria-hidden="true"
    >{view === '3d' && thumbs[returnFx.id] ? <img src={thumbs[returnFx.id]} alt="" /> : <PartArt id={returnFx.id} />}</div> : null}
    {cinematic ? <MissionCinematic
      key={`${cinematic.kind}-${cinematic.round}`}
      scene={cinematic.kind === 'briefing' ? {
        eyebrow: `BUILD ROUND ${cinematic.round + 1} OF ${ASSEMBLY_ROUNDS.length}`,
        title: ASSEMBLY_ROUNDS[cinematic.round].title,
        lines: ASSEMBLY_ROUNDS[cinematic.round].briefing,
        actionLabel: 'Open the workshop',
        mood: 'briefing'
      } : cinematic.kind === 'guide' ? {
        eyebrow: `MIRA · ROUND ${cinematic.round + 1}`,
        title: 'Need a hint?',
        lines: [currentPrompt, activeClue?.hint || ASSEMBLY_ROUNDS[cinematic.round].lesson],
        actionLabel: 'Back to the rocket',
        mood: wrongId ? 'warning' : 'briefing'
      } : cinematic.kind === 'success' ? {
        eyebrow: 'SYSTEM COMPLETE',
        title: ASSEMBLY_ROUNDS[cinematic.round].successTitle,
        lines: [ASSEMBLY_ROUNDS[cinematic.round].successLine],
        actionLabel: cinematic.round === ASSEMBLY_ROUNDS.length - 1 ? 'Test the spacecraft' : 'Next mission briefing',
        reward: ASSEMBLY_ROUNDS[cinematic.round].badge,
        mood: 'success'
      } : {
        eyebrow: 'ENGINEERING TEAM HUDDLE',
        title: 'Try again!',
        lines: ['Your shields are empty.', 'I restored them. Follow the glowing part.'],
        actionLabel: 'Return with a hint',
        mood: 'warning'
      }}
      onComplete={finishCinematic}
      onBack={() => setCinematic(null)}
      backLabel="Workshop"
    /> : null}
  </div>;
}
