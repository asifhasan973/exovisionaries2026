import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BatteryCharging, Check, Info, ShieldAlert } from 'lucide-react';
import { SceneBoundary, SceneFallback, GameInfo } from '@exo/ui';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { StoryShell, StoryControls, useGameSettings } from '@/shared/shell';
import { useStoryNavigation } from '@/game/moon/core/storyNavigationContext';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import { sound } from '@exo/audio';
import { isEngineFrozen } from '@exo/ui';
import { SURFACE_MODEL, surfacePosition, surfaceNode, surfaceNodeName, surfaceLight, surfacePower, routeReport, returnPlan, surfaceReady } from './surface';
import type { SurfaceEdgeId } from './surface';
import { SURFACE_LINES } from './surfaceCopy';
import './surface.css';

const SurfaceViewport = lazy(() => import('./SurfaceViewport.tsx').then(m => ({ default: m.SurfaceViewport })));
export function SurfaceScreen({ session, dispatch, frame }: { session: WorkshopSession; dispatch(e: MissionEvent): void; frame: SelectionFrame }) {
  const { moon, preparation } = session, s = moon.surface, { effects, gentle } = useGameSettings();
  const navigation = useStoryNavigation(), reviewing = !!navigation?.reviewing;
  const [notes, setNotes] = useState(false), latest = useRef(s);
  useEffect(() => { latest.current = s; }, [s]);
  const deployment = session.progress.stepId === 'lunar-surface', endpoint = session.progress.stepId === 'surface-ready';
  const idle = s.stage === 'idle', driving = s.stage === 'driving', moving = ['deploying', 'driving', 'charging'].includes(s.stage);
  const geo = moon.objective === 'lunar-geology', ready = surfaceReady(s, moon, preparation);
  const lookoutReached = s.visited.includes('lookout') || !geo && s.visited.includes('ridge');
  // Offer the next useful waypoint; retained saves may resume on any original route.
  const routeIds: SurfaceEdgeId[] = s.location === 'base' ? ['base-lookout'] : s.location === 'lookout' ? geo ? ['base-lookout'] : ['lookout-edge'] : s.location === 'ridge' ? ['ridge-edge', 'base-ridge'] : s.location === 'edge' ? ['lookout-edge', 'ridge-edge'] : ['edge-target'];
  const routes = routeIds.map(id => ({ id, report: routeReport(s, id, moon, preparation) })).filter(r => r.report !== null);
  const selected = s.selected ? routeReport(s, s.selected, moon, preparation) : null;
  const destination = driving ? s.legs[0]?.to : !ready && !endpoint ? selected?.to ?? routes[0]?.report?.to : undefined;
  const point = surfacePosition(s), light = surfaceLight(point.x, point.z, moon), capacity = moon.resources.capacityWh;
  const percent = Math.max(0, Math.min(100, capacity ? s.batteryWh / capacity * 100 : 0));
  const home = returnPlan(s.location, moon, preparation, s.pace);
  const reservePercent = capacity ? Math.min(100, ((driving ? returnPlan(s.legs[0]?.to ?? s.location, moon, preparation, s.pace)?.wh ?? capacity : home?.wh ?? capacity) / capacity + SURFACE_MODEL.baseReserve) * 100) : 100;
  const charging = surfacePower(moon, preparation, 'charging', light);
  const canCharge = idle && light > 0 && charging.surplusW > 0 && s.batteryWh < capacity - .01;
  const distance = destination ? Math.round(Math.hypot(surfaceNode(destination).x - point.x, surfaceNode(destination).z - point.z) * SURFACE_MODEL.worldDistanceScale) : 0;
  useEffect(() => {
    if (!moving || s.paused || reviewing) return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); if (!document.hidden && !isEngineFrozen()) dispatch({ type: 'surface-tick', seconds: (now - last) / 1000 }); last = now; }, 100);
    return () => clearInterval(timer);
  }, [moving, s.paused, s.stage, dispatch, reviewing]);
  useEffect(() => {
    const release = () => dispatch({ type: 'surface-held', held: false });
    const pause = () => { release(); dispatch({ type: 'surface-pause' }); };
    const hide = () => { if (document.hidden) pause(); };
    const hint = () => { dispatch({ type: 'surface-hint' }); pause(); setNotes(true); };
    const down = (e: KeyboardEvent) => {
      if (e.repeat || notes || reviewing || isEngineFrozen() || document.querySelector('dialog[open]') || e.defaultPrevented || (e.target instanceof HTMLElement && e.target.closest('input,textarea,select,[contenteditable=true]'))) return;
      if (latest.current.stage === 'driving' && !latest.current.autonomous && ['w', 'W', 'ArrowUp'].includes(e.key)) { e.preventDefault(); dispatch({ type: 'surface-held', held: true }); }
    };
    const up = (e: KeyboardEvent) => { if (['w', 'W', 'ArrowUp'].includes(e.key)) release(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', pause);
    window.addEventListener('game-help-open', pause); window.addEventListener('replay-game-help', hint);
    window.addEventListener('game-orientation-pause', pause); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', pause); window.removeEventListener('game-help-open', pause); window.removeEventListener('replay-game-help', hint); window.removeEventListener('game-orientation-pause', pause); document.removeEventListener('visibilitychange', hide); };
  }, [dispatch, notes, reviewing]);
  useEffect(() => { sound.setMuted(!effects); if (driving && !s.paused && !reviewing) sound.startRoverSound('drive'); else sound.stopRoverSound(); return () => sound.stopRoverSound(); }, [driving, s.paused, effects, reviewing]);
  const act = (event: MissionEvent) => { if (isEngineFrozen() || reviewing) return; sound.setMuted(!effects); sound.playClick(); dispatch(event); };
  const choose = (edge: SurfaceEdgeId) => { act({ type: 'surface-mode', mode: 'hold' }); act({ type: 'surface-pace', pace: 'eco' }); act({ type: 'surface-select', edge }); };
  const next = () => {
    if (reviewing) { dispatch({ type: 'next' }); return; }
    if (endpoint || !deployment && idle && ready) {
      if (!endpoint) act({ type: 'next' });
      act({ type: 'next' });
      // Configure the new expedition through replayable commands, never saved success flags.
      act({ type: 'science-target', target: !geo && s.visited.includes('edge') ? 'edge' : 'lookout' });
      act({ type: 'science-program', program: 'sample' });
    }
    else if (deployment && s.deployed) act({ type: 'next' });
    else if (s.stage === 'stowed') act({ type: 'surface-deploy' });
    else if (s.stage === 'failed') act({ type: 'surface-restart' });
    else if (idle) { if (!selected && routes[0]) choose(routes[0].id); else if (selected?.reason === 'autonomy') act({ type: 'surface-arm' }); else act({ type: 'surface-start' }); }
    else act({ type: s.paused ? 'surface-resume' : 'surface-pause' });
  };
  const nextLabel = endpoint ? 'Start discovery' : s.stage === 'stowed' ? 'Deploy rover' : s.stage === 'failed' ? 'Retry expedition' : deployment && s.deployed ? 'Begin exploring' : idle && ready ? 'Start discovery' : idle ? !selected ? 'Choose destination' : selected.reason === 'autonomy' ? 'Save return route' : `Travel to ${surfaceNodeName(selected.to, moon)}` : driving && s.mode === 'hold' && !s.autonomous ? 'Hold W or ↑ to drive' : s.paused ? 'Resume' : 'Pause';
  const disabled = !reviewing && (moving && !s.paused && s.stage === 'deploying' || driving && s.mode === 'hold' && !s.autonomous || idle && !ready && !!selected?.reason && selected.reason !== 'autonomy');
  const objective = endpoint || ready ? 'Route explored. Now investigate the ground.' : deployment ? 'Get your rover onto the Moon.' : !lookoutReached ? 'Reach the lookout to see what lies ahead.' : geo ? 'Bring the rover back to base. Your rock expedition is next.' : 'Reach the shadow edge. Look for a place to investigate.';
  const advice = s.feedback ? (SURFACE_LINES as Record<string, string>)[s.feedback] : driving ? s.autonomous ? 'The saved route brings the rover back to radio range.' : s.paused ? 'Hold W, ↑ or Drive. Release to stop.' : light === 0 ? 'No solar charging in the shade. Watch the battery.' : 'Follow the trail. Release Drive whenever you want to stop.' : ready ? 'We know the route. Next, use your instruments to collect evidence.' : objective;
  return <StoryShell {...frame} controls={<StoryControls onBack={() => { dispatch({ type: 'surface-pause' }); dispatch({ type: 'back' }); }} onNext={next} nextLabel={nextLabel} nextDisabled={disabled} progress={<span>Moon expedition</span>} />}>
    <main className="workshop-main surface-main expedition-main" id="story-content" tabIndex={-1} aria-labelledby="surface-title">
      <div className="surface-heading"><h1 id="surface-title">{deployment ? 'Your first tracks on the Moon' : endpoint ? 'A place to discover' : 'Beyond the landing site'}</h1><button className="game-info-trigger" aria-label="Expedition details" onClick={() => { dispatch({ type: 'surface-pause' }); setNotes(true); }}><Info size={20}/></button></div>
      <section className="surface-scene expedition-world" aria-label="Moon expedition">
        <SceneBoundary fallback={<SceneFallback scene="surface" label="Moon expedition" detail="Choose a destination below"/>}><Suspense fallback={<div className="surface-fallback">Preparing the lunar landscape…</div>}><SurfaceViewport surface={s} preparation={preparation} moon={moon} gentle={gentle} destination={destination}/></Suspense></SceneBoundary>
        <div className="expedition-objective"><span>YOUR EXPEDITION</span><h2>{objective}</h2><ol aria-label="Expedition progress"><li className={lookoutReached ? 'is-done' : 'is-current'}>{lookoutReached ? <Check size={13}/> : '1'} Lookout</li><li className={ready || endpoint ? 'is-done' : lookoutReached ? 'is-current' : ''}>2 {geo ? 'Base' : 'Shadow edge'}</li><li>3 Discover</li></ol></div>
        <div className={`surface-battery expedition-battery ${percent < reservePercent ? 'is-low' : ''}`}><div><span>Battery</span><strong>{Math.round(percent)}%</strong></div><div className="surface-energy-track" role="meter" aria-label="Rover battery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><i style={{ width: `${percent}%` }}/><b style={{ left: `${Math.min(98, reservePercent)}%` }}/></div><small>{percent < reservePercent ? 'Protect your return energy' : light === 0 ? 'In shadow · running on battery' : 'Return reserve protected'}</small></div>
        {s.feedback && s.feedback !== 'autonomy' ? <div className="surface-alert expedition-alert" role="alert"><ShieldAlert size={18}/>{(SURFACE_LINES as Record<string, string>)[s.feedback]}</div> : null}
        {!deployment && !endpoint && idle && !ready && !reviewing ? <div className="expedition-destinations" aria-label="Next destination">{routes.map(({ id, report }) => report && <button key={id} data-surface-route={id} aria-pressed={s.selected === id} onClick={() => choose(id)}><span>{report.to === 'edge' ? 'DARK GROUND · NO SOLAR' : report.to === 'base' ? 'HOME' : 'SUNLIT GROUND'}</span><strong>{surfaceNodeName(report.to, moon)} <span>→</span></strong><small>{report.reason ? report.reason === 'autonomy' ? 'Save a return route before departure' : (SURFACE_LINES as Record<string, string>)[report.reason] : report.to === 'lookout' ? 'Climb the ridge. Reveal the landscape.' : report.to === 'edge' ? 'Scout the boundary before using your instruments.' : 'Follow the trail back.'}</small></button>)}</div> : null}
        {driving && !reviewing ? <div className="expedition-drive"><div><strong>{surfaceNodeName(destination ?? s.location, moon)}</strong><span>{distance} m away</span></div><progress aria-label="Journey progress" max={SURFACE_MODEL.legFrames} value={s.legFrame}/>{s.mode === 'hold' && !s.autonomous ? <button className="surface-drive-hold" disabled={notes} onPointerDown={e => { if (isEngineFrozen()) return; e.currentTarget.setPointerCapture(e.pointerId); dispatch({ type: 'surface-held', held: true }); }} onPointerUp={() => dispatch({ type: 'surface-held', held: false })} onPointerCancel={() => dispatch({ type: 'surface-held', held: false })} onLostPointerCapture={() => dispatch({ type: 'surface-held', held: false })} onKeyDown={e => { if ([' ', 'Enter'].includes(e.key) && !isEngineFrozen()) { e.preventDefault(); dispatch({ type: 'surface-held', held: true }); } }} onKeyUp={() => dispatch({ type: 'surface-held', held: false })}>Hold to drive ↑ <small>Release to stop · W / ↑</small></button> : <span>Following saved route</span>}</div> : null}
        {s.stage === 'deploying' || s.stage === 'charging' ? <div className="expedition-drive"><strong>{s.stage === 'deploying' ? 'Rover leaving the lander' : 'Charging in sunlight'}</strong><progress aria-label={s.stage} max={s.stage === 'deploying' ? SURFACE_MODEL.deployFrames : SURFACE_MODEL.chargeFrames} value={s.phaseFrame}/></div> : null}
        {canCharge && (percent < 65 || selected?.reason === 'reserve' || s.feedback === 'reserve') && !endpoint && !reviewing ? <button className="expedition-charge" onClick={() => act({ type: 'surface-charge' })}><BatteryCharging size={18}/>Charge in sunlight</button> : null}
        <div className="expedition-advice"><EngineerCompanion voiceEnabled={frame.voiceEnabled ?? true} reaction={ready ? 'complete' : s.feedback ? 'warning' : 'intro'} token={s.attempts} scriptedReply={{ id: `expedition-${s.stage}-${s.location}-${s.paused}-${s.feedback ?? 'guide'}`, text: advice }}/></div>
      </section>
    </main>
    {notes ? <GameInfo title="Your Moon expedition" onClose={() => setNotes(false)} pages={[
      <div key="drive"><p>Choose the highlighted destination, then travel. Hold W, ↑ or the Drive button to move along the trail. Release to stop. Reach the lookout first, then scout the next site. Discovery and sample collection follow in the instrument stage.</p><p>The battery marker protects the estimated trip home plus a 20% reserve. A safe route is checked before departure. Sunlight only charges the battery when generation exceeds power use.</p></div>,
      <div key="details"><p>Battery: {s.batteryWh.toFixed(1)} / {capacity} Wh. Solar: {charging.solarW.toFixed(0)} W. Charging load: {charging.loadW.toFixed(0)} W.</p><p>{Math.round(s.elapsedSeconds / 60)} simulated surface minutes. Crew {s.crewSheltered ? 'sheltered inside' : 'deploying the rover'}. Hardware, cold exposure and crew supplies still limit each trip.</p><p>This is authored terrain and compressed travel time. Scouting reveals a route; only instruments produce scientific evidence. Your installed rover and equipment are preserved.</p></div>,
    ]}/> : null}
  </StoryShell>;
}
