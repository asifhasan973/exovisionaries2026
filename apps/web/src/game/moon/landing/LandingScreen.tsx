import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Crosshair, Fuel, Info, Pause, Play, RotateCcw, ShieldAlert } from 'lucide-react';
import { SceneBoundary, SceneFallback, GameInfo, isEngineFrozen } from '@exo/ui';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { StoryShell, StoryControls } from '@/shared/shell';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import { useGameSettings } from '@/shared/shell';
import { useStoryNavigation } from '@/game/moon/core/storyNavigationContext';
import { sound } from '@exo/audio';
import { LANDING_PADS, LANDING_MODEL, abortReport, descentEntryFuel } from './landing.ts';
import { LANDING_LINES } from './landingCopy.ts';
import './landing.css';

const LandingViewport = lazy(() => import('./LandingViewport.tsx').then(m => ({ default: m.LandingViewport })));
const movingStages = ['separating', 'braking', 'descending', 'aborting'];
export function LandingScreen({ session, dispatch, frame }: { session: WorkshopSession; dispatch(e: MissionEvent): void; frame: SelectionFrame }) {
  const { moon, preparation } = session, l = moon.landing, { effects, gentle } = useGameSettings();
  const navigation = useStoryNavigation();
  const [notes, setNotes] = useState(false), [hint, setHint] = useState(false);
  const latest = useRef(l), held = useRef(new Set<string>());
  useEffect(() => { latest.current = l; }, [l]);
  const moving = movingStages.includes(l.stage), flying = l.stage === 'descending';
  const terminal = ['landed', 'failed', 'aborted'].includes(l.stage);
  const playable = flying && l.hazardSeen && !l.paused && !l.decisionPending && !navigation?.reviewing;
  const pad = LANDING_PADS.find(p => p.id === l.target)!;
  const distance = pad.x - l.x, aligned = pad.safe && Math.abs(distance) <= LANDING_MODEL.padRadius;
  const downSpeed = Math.max(0, -l.vy), speedSafe = downSpeed <= LANDING_MODEL.verticalLimit;
  const danger = flying && !l.decisionPending && l.height < 25 && (!speedSafe || !aligned);
  const fuelPercent = Math.max(0, Math.min(100, l.fuelKg / descentEntryFuel(moon, preparation) * 100));
  const abort = abortReport(l, moon, preparation);
  const act = useCallback((event: MissionEvent) => {
    if (isEngineFrozen()) return;
    sound.setMuted(!effects); sound.playClick(); dispatch(event);
  }, [dispatch, effects]);
  const controls = useCallback(() => {
    const current = latest.current;
    if (current.stage !== 'descending' || !current.hazardSeen || current.paused || isEngineFrozen()) return;
    const left = held.current.has('left') || held.current.has('pointer-left');
    const right = held.current.has('right') || held.current.has('pointer-right');
    const brake = held.current.has('brake') || held.current.has('pointer-brake');
    const steer = Number(right) - Number(left);
    if (current.mode === 'medium') dispatch({ type: 'landing-control', steer, brake });
    else if (current.mode === 'challenge') dispatch({ type: 'landing-control', steer, throttle: brake ? .7 : .3 });
  }, [dispatch]);
  const release = useCallback(() => { held.current.clear(); controls(); }, [controls]);
  useEffect(() => {
    if (!moving || l.paused || navigation?.reviewing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(), elapsed = (now - last) / 1000; last = now;
      if (!document.hidden && !isEngineFrozen()) dispatch({ type: 'landing-tick', seconds: elapsed });
    }, 50);
    return () => clearInterval(timer);
  }, [moving, l.paused, l.stage, dispatch, navigation?.reviewing]);
  // The approach is one short cinematic; manual control begins after the terrain scan.
  useEffect(() => { if (l.stage === 'separated' && !navigation?.reviewing) dispatch({ type: 'landing-brake' }); }, [l.stage, dispatch, navigation?.reviewing]);
  useEffect(() => {
    const pause = () => { release(); dispatch({ type: 'landing-pause' }); };
    const hide = () => { if (document.hidden) pause(); };
    const showHint = () => { pause(); dispatch({ type: 'landing-hint' }); setHint(true); };
    const keyFor = (key: string) => ['a', 'arrowleft'].includes(key) ? 'left' : ['d', 'arrowright'].includes(key) ? 'right' : [' ', 'w', 'arrowup'].includes(key) ? 'brake' : null;
    const down = (event: KeyboardEvent) => {
      if (event.defaultPrevented || notes || hint || navigation?.reviewing || document.querySelector('dialog[open]') || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable=true]'))) return;
      const key = event.key.toLowerCase(), input = keyFor(key), current = latest.current;
      if (key === 'p' && movingStages.includes(current.stage)) { event.preventDefault(); release(); dispatch({ type: current.paused ? 'landing-resume' : 'landing-pause' }); return; }
      if (!input || current.stage !== 'descending' || !current.hazardSeen || current.paused || current.decisionPending || isEngineFrozen()) return;
      event.preventDefault(); if (held.current.has(input)) return;
      if (input === 'left' || input === 'right') { held.current.delete('pointer-left'); held.current.delete('pointer-right'); }
      held.current.add(input); controls();
    };
    const up = (event: KeyboardEvent) => { const input = keyFor(event.key.toLowerCase()); if (input) { held.current.delete(input); controls(); } };
    const heldSet = held.current;
    const freeze = () => { heldSet.clear(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', hide);
    window.addEventListener('game-help-open', pause); window.addEventListener('replay-game-help', showHint);
    window.addEventListener('game-orientation-pause', freeze); window.addEventListener('game-orientation-resume', release);
    return () => { heldSet.clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hide); window.removeEventListener('game-help-open', pause); window.removeEventListener('replay-game-help', showHint); window.removeEventListener('game-orientation-pause', freeze); window.removeEventListener('game-orientation-resume', release); };
  }, [controls, release, dispatch, notes, hint, navigation?.reviewing]);
  useEffect(() => { if (!playable) held.current.clear(); }, [playable]);
  const engines = moving && !l.paused && !navigation?.reviewing && (l.stage === 'braking' || l.stage === 'aborting' || flying && l.throttle > .01);
  useEffect(() => { sound.setMuted(!effects); if (engines) sound.startRocketRoar(); else sound.stopRocketRoar(); return () => sound.stopRocketRoar(); }, [engines, effects]);
  useEffect(() => { if (engines) sound.updateRocketIntensity(l.throttle, 1); }, [engines, l.throttle]);
  useEffect(() => { sound.setMuted(!effects); if (navigation?.reviewing) return; if (l.stage === 'landed') sound.playFanfare(); else if (l.stage === 'failed') sound.playStagingThud(); else if (l.decisionPending || danger) sound.playRadioBeep(); }, [l.stage, l.decisionPending, danger, effects, navigation?.reviewing]);
  const togglePilot = (input: 'left' | 'right' | 'brake' | 'stop') => {
    if (!playable || isEngineFrozen()) return;
    sound.setMuted(!effects); sound.playClick();
    if (input === 'stop') { ['left', 'right', 'pointer-left', 'pointer-right'].forEach(key => held.current.delete(key)); }
    else {
      const key = `pointer-${input}`, wasHeld = held.current.has(key);
      if (input !== 'brake') { held.current.delete('pointer-left'); held.current.delete('pointer-right'); }
      if (wasHeld) held.current.delete(key); else held.current.add(key);
    }
    controls();
  };
  const next = () => {
    release(); setHint(false); document.getElementById('story-content')?.focus({ preventScroll: true });
    if (l.stage === 'ready') { if (l.mode !== 'medium') dispatch({ type: 'landing-mode', mode: 'medium' }); act({ type: 'landing-separate' }); }
    else if (l.stage === 'landed') act({ type: 'next' });
    else if (l.stage === 'failed' || l.stage === 'aborted') act({ type: 'landing-restart' });
    else if (l.decisionPending) act({ type: 'landing-continue' });
    else act({ type: l.paused ? 'landing-resume' : 'landing-pause' });
  };
  const nextLabel = l.stage === 'ready' ? 'Begin landing' : l.stage === 'landed' ? 'Explore the Moon' : terminal ? 'Retry landing' : l.decisionPending ? 'Fly to this spot' : l.paused ? 'Resume' : 'Pause';
  const status = l.stage === 'ready' ? 'LUNAR APPROACH' : l.stage === 'separating' ? 'LANDER SEPARATION' : l.stage === 'braking' || l.stage === 'separated' ? 'BRAKING BURN' : l.decisionPending ? 'TERRAIN SCAN' : l.stage === 'landed' ? 'CONTACT LIGHT' : l.stage === 'failed' ? 'LANDING INTERRUPTED' : l.stage === 'aborting' || l.stage === 'aborted' ? 'ORBIT RECOVERY' : l.paused ? 'PAUSED' : !l.hazardSeen ? 'SCANNING TERRAIN' : 'YOU HAVE CONTROL';
  const advice = l.stage === 'landed' ? 'landed' : l.stage === 'failed' ? l.feedback ?? 'fast' : l.decisionPending ? 'hazard' : l.stage === 'ready' ? 'ready' : l.stage === 'separating' || l.stage === 'separated' ? 'separating' : l.stage === 'braking' ? 'braking' : l.stage === 'aborting' ? 'aborting' : l.stage === 'aborted' ? 'aborted' : !l.hazardSeen ? 'scanning' : 'flying';
  const contextualHint = l.stage === 'ready' ? 'Begin landing, then choose A or B after the scan. Hold A / D to steer and Space to slow down.' : !flying || !l.hazardSeen ? 'The engine is bringing us into position. Wait for the terrain scan.' : l.decisionPending ? 'Pick A or B. The middle is rocky.' : !aligned ? `Hold ${distance < 0 ? 'A / ←' : 'D / →'} toward ${pad.id === 'left' ? 'A' : 'B'}. Hold Space too, so you have time to move.` : Math.abs(l.vx) > 1.5 ? 'Stop moving sideways. Keep holding Space, or switch the brake on.' : 'Hold Space to slow down. Stay above the green circle.';
  return <StoryShell {...frame} controls={<StoryControls onBack={() => dispatch({ type: 'back' })} onNext={next} nextLabel={nextLabel} nextDisabled={moving && !flying && !l.paused || l.decisionPending && !pad.safe} progress={<span>Moon landing</span>} hintDisabled={terminal} />}>
    <main className="workshop-main landing-main" id="story-content" tabIndex={-1} aria-labelledby="landing-title">
      <div className="landing-heading"><h1 id="landing-title">Bring it down softly</h1><button className="landing-notes" aria-label="Landing help" onClick={() => { release(); act({ type: 'landing-pause' }); setNotes(true); }}><Info size={20}/></button></div>
      <section className={`landing-arena ${danger ? 'is-danger' : ''} ${l.stage === 'landed' ? 'is-landed' : ''}`} aria-label="Lunar landing game" data-landing-stage={l.stage}>
        <SceneBoundary fallback={<SceneFallback scene="landing" label="Moon landing" detail="Use the flight controls below"/>}><Suspense fallback={<div className="landing-fallback">Opening the landing view…</div>}><LandingViewport landing={l} shadow={moon.site === 'permanent-shadow'} gentle={gentle}/></Suspense></SceneBoundary>
        <div className="landing-flight-tag"><i/>{status}</div>
        <div className="landing-telemetry" aria-label="Flight instruments">
          <div className="landing-height"><span>HEIGHT</span><strong>{flying || terminal ? Math.max(0, l.height).toFixed(0) : '—'}<small>m</small></strong><div className="landing-altimeter"><i style={{ height: `${Math.min(100, l.height / 130 * 100)}%` }}/></div></div>
          <div className={`landing-speed ${speedSafe ? 'is-safe' : danger ? 'is-fast' : ''}`}><span><ArrowDown size={14}/>DOWN SPEED</span><strong>{flying || terminal ? downSpeed.toFixed(1) : '—'}<small>m/s</small></strong><div className="landing-speed-track"><i style={{ left: `${Math.min(97, downSpeed / 9 * 100)}%` }}/></div><small>{speedSafe ? 'Soft landing speed' : 'Hold Space to slow'}</small></div>
          <div className="landing-fuel"><Fuel size={15}/><span>FUEL</span><div><i style={{ width: `${fuelPercent}%` }}/></div><strong>{Math.round(fuelPercent)}%</strong></div>
        </div>
        {flying && l.hazardSeen && !l.decisionPending && !hint ? <div className={`landing-aim ${aligned ? 'is-aligned' : ''}`}><Crosshair size={19}/><strong>{aligned ? 'Above the landing zone' : `${Math.abs(distance).toFixed(0)} m ${distance < 0 ? '←' : '→'}`}</strong><span>{aligned ? Math.abs(l.vx) > 1.5 ? 'Stop sideways movement' : 'Hold Space · settle softly' : `Landing zone ${pad.id === 'left' ? 'A' : 'B'}`}</span></div> : null}
        {l.decisionPending ? <div className="landing-site-picker"><div><ShieldAlert size={18}/><strong>Rocks ahead. Pick a clear spot.</strong></div><div className="landing-sites">{LANDING_PADS.filter(p => p.safe).map(p => <button key={p.id} aria-pressed={l.target === p.id} onClick={() => act({ type: 'landing-target', id: p.id })}><Crosshair/><strong>{p.id === 'left' ? 'A' : 'B'}</strong>{l.target === p.id ? <Check/> : <span>Clear ground</span>}</button>)}</div></div> : null}
        {l.stage === 'ready' ? <div className="landing-intro landing-card"><span>YOUR TURN TO FLY</span><h2>A soft touch.<br/>A giant moment.</h2><p>Reach a clear patch. Slow down before your feet touch the Moon.</p><div><kbd>A</kbd><kbd>D</kbd><span>Move</span><kbd>Space</kbd><span>Slow down</span></div><button className="landing-primary" onClick={next}><Play size={18} fill="currentColor"/>Begin landing</button></div> : null}
        {hint && !terminal ? <div className="landing-hint-card landing-card" role="status"><Crosshair/><h2>Your next move</h2><p>{contextualHint}</p><button className="landing-primary" onClick={() => { setHint(false); if (!l.decisionPending) act({ type: 'landing-resume' }); }}>{l.decisionPending ? 'Choose a spot' : flying ? 'Got it · fly' : 'Got it'}</button></div> : null}
        {terminal ? <div className={`landing-result landing-card ${l.stage === 'landed' ? 'is-success' : ''}`} role="status"><div className="landing-result-icon">{l.stage === 'landed' ? <Check/> : <RotateCcw/>}</div><span>{l.stage === 'landed' ? 'THE MOON IS YOURS' : 'ONE MORE TRY'}</span><h2>{l.stage === 'landed' ? 'Touchdown!' : l.stage === 'aborted' ? 'Back in orbit' : 'Almost, Commander.'}</h2><p>{l.stage === 'landed' ? 'Two explorers. One new world.' : l.feedback === 'terrain' ? 'Outside the clear circle. Move over A or B before touching down.' : (LANDING_LINES as Record<string, string>)[l.feedback ?? 'aborted']}</p>{l.stage === 'landed' ? <div className="landing-result-stats"><span><strong>{downSpeed.toFixed(1)}</strong>m/s down</span><span><strong>{Math.abs(l.vx).toFixed(1)}</strong>m/s drift</span></div> : null}<button className="landing-primary" onClick={next}>{l.stage === 'landed' ? 'Explore the Moon' : 'Retry landing'}<ArrowRight size={19}/></button></div> : null}
        {l.paused && !l.decisionPending && !hint && !terminal ? <button className="landing-pause-overlay" onClick={next}><Play fill="currentColor"/>Resume landing</button> : null}
        {flying && l.hazardSeen && !l.decisionPending && !terminal ? <div className="landing-pilot-controls"><div className="landing-direction-controls"><button onClick={() => togglePilot('left')} disabled={!playable} aria-label="Move left" aria-pressed={l.direction < 0}><ArrowLeft/><kbd>A</kbd></button><button className="landing-stop" onClick={() => togglePilot('stop')} disabled={!playable} aria-label="Stop sideways movement"><Crosshair size={19}/></button><button onClick={() => togglePilot('right')} disabled={!playable} aria-label="Move right" aria-pressed={l.direction > 0}><ArrowRight/><kbd>D</kbd></button></div><button className="landing-brake" onClick={() => togglePilot('brake')} disabled={!playable} aria-label="Toggle descent brake" aria-pressed={l.brake}><ArrowDown/><strong>{l.brake ? 'Brake on' : 'Slow descent'}</strong><kbd>Space</kbd></button><button className="landing-pause" aria-label={l.paused ? 'Resume landing' : 'Pause landing'} onClick={next}>{l.paused ? <Play/> : <Pause/>}</button></div> : null}
        {moving && !flying ? <div className="landing-cinematic"><span>{l.stage === 'separating' ? 'Leaving our orbiting spacecraft' : l.stage === 'aborting' ? 'Climbing away safely' : 'Slowing for final approach'}</span><progress max={l.stage === 'separating' ? (l.version === 2 ? 2 : 4) : l.stage === 'braking' ? (l.version === 2 ? 4 : 10) : 12} value={l.phaseSteps * LANDING_MODEL.step}/></div> : null}
        {danger ? <div className="landing-danger" role="status"><ShieldAlert size={18}/>{!aligned ? 'Move over clear ground' : 'Too fast · hold Space'}</div> : null}
        {flying && l.hazardSeen && !l.decisionPending ? <button className="landing-abort" disabled={!abort.allowed} title={abort.allowed ? 'Cancel landing and climb to orbit' : 'Abort needs more height, less speed and enough ascent fuel'} onClick={() => { release(); act({ type: 'landing-abort' }); }}><ShieldAlert size={15}/>Abort</button> : null}
        <div className="landing-comms"><EngineerCompanion voiceEnabled={frame.voiceEnabled ?? true} reaction={l.stage === 'landed' ? 'complete' : l.stage === 'failed' || l.stage === 'aborted' || danger ? 'warning' : 'intro'} token={l.attempts} scriptedReply={{ id: `landing-${l.stage === 'ready' ? 'controls' : advice}`, text: (LANDING_LINES as Record<string, string>)[l.stage === 'ready' ? 'controls' : advice] }}/></div>
      </section>
    </main>
    {notes ? <GameInfo title="Your Moon landing" onClose={() => setNotes(false)} pages={[
      <div key="controls"><p>Hold A / D to steer; release to stop drifting. Hold Space or W to slow your fall. P pauses. With a mouse, click an arrow to move and the crosshair to stop. Click the brake button to switch slowing on or off.</p><p>Choose a green navigation circle, move above it, and keep holding Space as you touch down. A safe landing needs down speed under 2.5 m/s and drift under 1.5 m/s.</p></div>,
      <div key="model"><p>This medium game stabilizes the lander, but you choose where it goes and when to slow down. Thrust still uses fuel. Hovering too long can empty the tank.</p><p>It is a simplified learning model using lunar gravity, a 45 kN engine and variable vehicle mass. The approach is compressed; the final approach runs at screen time. Green circles are your navigation display, not pads built on the Moon. Ascent and return fuel stay separate.</p></div>,
      <div key="safety"><p>Abort cancels landing and uses the ascent stage to reach an illustrative recovery orbit. It is only available with sufficient height, manageable speed and enough ascent fuel.</p><p>Retry restores the pre-descent checkpoint and records assistance. Back uses the shared mission review: it pauses this flight and preserves your resources.</p></div>,
    ]}/> : null}
  </StoryShell>;
}
