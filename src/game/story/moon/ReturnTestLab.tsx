import { useEffect, useId, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Flame, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import type { MissionEvent } from '../workshopSession.ts';
import type { ReturnConnection } from './validation.ts';
import { chuteWindow, testProgress, testRunning, thrustInBand } from './returnTests.ts';
import type { ReturnTestAction, ReturnTestState } from './returnTests.ts';
import { sound } from '../../../audio/soundEngine.ts';
import { isEngineFrozen, useOrientationLifecycleStore } from '../../../state/orientationLifecycleStore.ts';
import './returnTestLab.css';

export const RETURN_TEST_NAMES = { ascent: 'Ascent engine', service: 'Service engine', shield: 'Heat shield', parachutes: 'Parachutes' } as const;
const instructions = { ascent: 'Keep thrust in green. Hold to lift off.', service: 'Aim through the ring. Fire the engine.', shield: 'Turn the shield toward the heat.', parachutes: 'Open the parachutes in green.' } as const;
const successes = { ascent: 'Liftoff!', service: 'On target!', shield: 'Cabin protected!', parachutes: 'Soft landing!' } as const;
type Dispatch = (event: MissionEvent) => void;

export function ReturnTestControls({ test, dispatch, effects, onPass, onFail }: { test: ReturnTestState; dispatch: Dispatch; effects: boolean; onPass(id: ReturnConnection): void; onFail(): void }) {
  const running = testRunning(test), previous = useRef(test.phase);
  const engine = running && (test.id === 'ascent' || test.id === 'service');
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(), seconds = Math.min(.1, (now - last) / 1000); last = now;
      if (!document.hidden && !isEngineFrozen() && !document.querySelector('dialog[open]')) dispatch({ type: 'return-test-tick', seconds });
    }, 50);
    return () => window.clearInterval(timer);
  }, [running, dispatch]);
  useEffect(() => {
    sound.setMuted(!effects);
    const update = () => { if (engine && effects && !document.hidden) { sound.startRocketRoar(); sound.updateRocketIntensity(.16, .8); } else sound.stopRocketRoar(); };
    update(); document.addEventListener('visibilitychange', update);
    return () => { document.removeEventListener('visibilitychange', update); sound.stopRocketRoar(); };
  }, [engine, effects]);
  useEffect(() => {
    const release = () => dispatch({ type: 'return-test-hold', held: false });
    window.addEventListener('blur', release);
    return () => { window.removeEventListener('blur', release); };
  }, [dispatch]);
  useEffect(() => {
    if (test.phase !== previous.current) {
      if (test.phase === 'passed') { if (test.id === 'parachutes') sound.playReturnTestEffect('splash'); onPass(test.id); }
      if (test.phase === 'failed') onFail();
    }
    previous.current = test.phase;
  }, [test.phase, test.id, onPass, onFail]);
  const act = (event: ReturnTestAction) => { if (isEngineFrozen()) return; sound.setMuted(!effects); dispatch(event); };
  const hold = (held: boolean) => act({ type: 'return-test-hold', held });
  const finished = test.phase === 'passed' || test.phase === 'failed';
  const turn = (direction: -1 | 1) => { act({ type: 'return-test-turn', direction }); sound.playClick(450); };
  return <div className="return-lab-controls" data-return-test={test.id} data-test-angle={test.angle}>
    <p className="return-lab-instruction">{test.phase === 'passed' ? successes[test.id] : test.phase === 'failed' ? test.id === 'parachutes' ? 'Missed it? Try again!' : 'Adjust it and try again!' : instructions[test.id]}</p>
    {test.id === 'ascent' && test.phase !== 'passed' ? <>
      <label className="return-throttle"><span>Thrust <strong>{Math.round(test.throttle)}%</strong></span><span className="return-throttle-rail"><i/><input aria-label="Engine thrust" type="range" min="0" max="100" value={test.throttle} onChange={event => act({ type: 'return-test-throttle', value: Number(event.target.value) })}/></span></label>
      <button className={`return-lab-action is-hold ${test.held ? 'is-held' : ''}`} data-return-test-action onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); hold(true); }} onPointerUp={() => hold(false)} onPointerCancel={() => hold(false)} onLostPointerCapture={() => hold(false)} onKeyDown={event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) hold(true); } }} onKeyUp={event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); hold(false); } }} onBlur={() => hold(false)}><Flame/>{test.held ? 'Engine firing' : 'Hold to fire'}</button>
    </> : null}
    {['service', 'shield'].includes(test.id) && test.phase !== 'passed' ? <>
      <div className="return-aim-controls"><button aria-label="Turn left" disabled={test.phase === 'running'} onClick={() => turn(-1)}><ArrowLeft/></button><span>{test.id === 'shield' ? <ShieldCheck/> : <span className={`return-aim-dot ${Math.abs(test.angle) <= 6 ? 'is-aligned' : ''}`}/>}</span><button aria-label="Turn right" disabled={test.phase === 'running'} onClick={() => turn(1)}><ArrowRight/></button></div>
      <button className="return-lab-action" data-return-test-action disabled={test.phase === 'running' && !test.paused} onClick={() => { act({ type: 'return-test-start' }); sound.playClick(); }}><Play/>{test.paused ? 'Resume' : test.phase === 'running' ? test.id === 'shield' ? 'Heating…' : 'Burning…' : test.id === 'shield' ? 'Start heat test' : 'Fire engine'}</button>
    </> : null}
    {test.id === 'parachutes' && !finished ? <button className={`return-lab-action ${chuteWindow(test) ? 'is-deploy' : ''}`} data-return-test-action disabled={test.phase === 'running' && !test.paused && !chuteWindow(test)} onClick={() => { if (test.phase === 'ready' || test.paused) act({ type: 'return-test-start' }); else if (chuteWindow(test)) { act({ type: 'return-test-deploy' }); sound.playReturnTestEffect('canopy'); } }}><Play/>{test.paused ? 'Resume' : test.phase === 'ready' ? 'Drop capsule' : test.deployedAt !== null ? 'Floating down…' : chuteWindow(test) ? 'Open parachutes!' : 'Wait for green'}</button> : null}
    {test.phase === 'running' && test.id !== 'parachutes' ? <progress max="1" value={testProgress(test)} aria-label="Rehearsal progress"/> : null}
    {finished ? <button className="return-lab-replay" onClick={() => act({ type: 'return-test-reset' })}><RotateCcw size={16}/>{test.phase === 'passed' ? 'Play again' : 'Retry'}</button> : null}
  </div>;
}

function Capsule({ metal, shield = false }: { metal: string; shield?: boolean }) {
  return <g><path d="M-44 8-27-30Q0-46 27-30L44 8Z" fill={metal} stroke="#e8f3ff" strokeWidth="2"/><path d="m15-21 8 17-16-3Z" fill="#1d4d6d" stroke="#81cbe8"/><path d="M-45 7Q0 22 45 7L42 19Q0 33-42 19Z" fill={shield ? '#b57848' : '#263347'} stroke="#b1bdcc" strokeWidth="2"/><path d="M-25-4h15m-8-6v12" stroke="#758aa3" strokeWidth="3"/></g>;
}
function AscentCabin({metal}:{metal:string}) {
  return <g><path d="m-58-25 25-34h58l29 34-8 57h-88Z" fill={metal} stroke="#ccddeb" strokeWidth="2"/><path d="m25-59 29 34-8 57H25Z" fill="#526879" stroke="#8ea5b4"/><path d="m-13-42 27 8-23 18Z" fill="#153e5a" stroke="#75bad3" strokeWidth="2"/><path d="M-43-5h28v33h-28Z" fill="#d0dbe0" stroke="#bca068" strokeWidth="4"/><path d="M-22 5v12" stroke="#536879" strokeWidth="3"/><path d="M29-5h19v26H29Z" fill="#273f52" stroke="#a3b6bd"/><path d="m-58-17-12 8v29h17" fill="#b79a59" stroke="#dfc786" strokeWidth="2"/><path d="M-45 31h90l-13 9h-64Z" fill="#566b7d"/><path d="M-19 39h38l9 17h-56Z" fill="#293348" stroke="#8196a9"/><path d="m-34-53-15-29" stroke="#c3dae4" strokeWidth="3"/><ellipse cx="-53" cy="-86" rx="14" ry="7" fill="#dee8e6" transform="rotate(-30 -53 -86)"/></g>;
}

export function ReturnTestScene({ test }: { test: ReturnTestState }) {
  const uid = useId().replace(/:/g, ''), progress = testProgress(test), pass = test.phase === 'passed';
  const frozen=useOrientationLifecycleStore(state=>state.isFrozen);
  const active = test.phase === 'running' && !test.paused && !frozen;
  const canopyOpen=test.deployedAt===null?0:Math.min(1,(test.elapsed-test.deployedAt)/.65);
  const height = test.id === 'parachutes' ? test.phase === 'ready' ? 160 : test.deployedAt === null ? 160 + Math.min(1, test.elapsed / 4.2) * 180 : 160 + test.deployedAt / 4.2 * 180 + progress * (425 - (160 + test.deployedAt / 4.2 * 180)) : 0;
  const metal=`url(#${uid}-metal)`;
  return <div className={`return-lab-scene return-lab-${test.id} ${active ? 'is-running' : ''} ${pass ? 'is-passed' : ''} ${frozen?'is-frozen':''}`}>
    <div className="return-lab-scene-tag">{test.id === 'parachutes' ? 'EARTH DROP TEST' : 'FLIGHT REHEARSAL'}</div>
    <svg viewBox="0 0 900 540" role="img" aria-label={`${RETURN_TEST_NAMES[test.id]} interactive rehearsal: ${test.phase}`}>
      <defs><linearGradient id={`${uid}-metal`} x1="0" x2="1"><stop stopColor="#71869e"/><stop offset=".3" stopColor="#e2edf3"/><stop offset=".6" stopColor="#fafcf7"/><stop offset="1" stopColor="#6c829c"/></linearGradient><linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe4a0"/><stop offset=".55" stopColor="#a77936"/><stop offset="1" stopColor="#e4c581"/></linearGradient><linearGradient id={`${uid}-flame`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#e6ffff"/><stop offset=".3" stopColor="#7ae4ff"/><stop offset=".65" stopColor="#eda4ff"/><stop offset="1" stopColor="#ffb24c" stopOpacity="0"/></linearGradient><linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22294d"/><stop offset="1" stopColor="#586d91"/></linearGradient></defs>
      <rect width="900" height="540" fill={test.id === 'parachutes' ? `url(#${uid}-sky)` : '#101327'}/>
      {test.id !== 'parachutes' ? Array.from({ length: 42 }, (_, i) => <circle key={i} cx={(i * 139 + 39) % 900} cy={(i * 83 + 28) % 420} r={i % 4 === 0 ? 1.7 : .8} fill="#e4e0ff" opacity={i % 3 ? .35 : .7}/>) : null}
      {test.id === 'ascent' ? <>
        <path d="M0 422Q200 392 420 420T900 421V540H0Z" fill="#57566b"/><path d="M0 468q280-47 520 0t380-12v84H0Z" fill="#424256"/>
        <ellipse cx="450" cy="444" rx="115" ry="13" fill="#202336" opacity=".7"/>
        <g transform="translate(450 350) scale(1.3)"><path d="M-72-17H72l18 53H-90Z" fill={`url(#${uid}-gold)`} stroke="#dcb85e" strokeWidth="3"/><path d="m-62 25-48 43m172-43 48 43" stroke="#b8c5d6" strokeWidth="7"/><path d="M-125 72h31m188 0h31" stroke="#e7e9eb" strokeWidth="8" strokeLinecap="round"/><path d="M-51-7v33m27-33v33m44-33v33m28-33v33" stroke="#805c30" strokeWidth="4"/></g>
        <g className="return-test-moving" style={{ transform: `translate(450px, ${300 - progress * 170}px) scale(1.3)` }}>
          {active && test.held || pass ? <path className="return-test-flame" d={`M-15 53Q-32 96 0 ${90 + test.throttle * .55}Q32 96 15 53Z`} fill={`url(#${uid}-flame)`}/> : null}
          <AscentCabin metal={metal}/>
        </g>
        <path d="M650 390V140m-9 11 9-13 9 13" stroke="#8bf4cd" strokeWidth="2" strokeDasharray="6 8" opacity=".5"/>
        <circle cx="650" cy={390 - progress * 245} r="9" fill={thrustInBand(test.throttle) ? '#9affd4' : '#ffd47a'}/>
      </> : null}
      {test.id === 'service' ? <>
        <circle cx="540" cy="805" r="450" fill="#293657"/><circle cx="540" cy="805" r="450" fill="none" stroke="#79b9d8" strokeWidth="13" opacity=".22"/>
        <path d="M150 365Q440 160 750 270" stroke="#8fd4cd" strokeWidth="2" fill="none" strokeDasharray="9 10" opacity=".5"/>
        <ellipse cx="723" cy="255" rx="31" ry="44" transform="rotate(-20 723 255)" stroke="#91f2c4" strokeWidth="6" fill="#83edc71a"/>
        <g className="return-test-moving" style={{ transform: `translate(${300 + progress * 400}px, ${300 + Math.sin(test.angle * Math.PI / 180) * progress * 250 - progress * 45}px) rotate(${90 + test.angle}deg)` }}>
          <path d="M-33 0h66v94h-66Z" fill={`url(#${uid}-metal)`} stroke="#c0cdd7" strokeWidth="2"/><path d="M-33 19h66m-66 51h66" stroke="#6b7993" strokeWidth="5"/><path d="M-20 94h40l10 18h-60Z" fill="#202b40" stroke="#a5b4bf"/>
          {active || pass ? <path className="return-test-flame" d="M-19 113Q-27 150 0 211Q27 150 19 113Z" fill={`url(#${uid}-flame)`}/> : null}
          <Capsule metal={metal}/>
        </g>
        {!active && !pass ? <path d={`M380 300l${150 * Math.cos(test.angle * Math.PI / 180)} ${150 * Math.sin(test.angle * Math.PI / 180)}`} stroke={Math.abs(test.angle) <= 6 ? '#94f6c9' : '#ffdc80'} strokeWidth="4" strokeDasharray="8 6"/> : null}
      </> : null}
      {test.id === 'shield' ? <>
        <ellipse cx="785" cy="285" rx="285" ry="430" fill="#39415f" opacity=".45"/>
        {Array.from({ length: 14 }, (_, i) => <path key={i} className="return-heat-streak" d={`M${60 + i % 3 * 27} ${140 + i * 19}h${100 + i % 4 * 24}`} stroke={i % 2 ? '#f9ad75' : '#ffda89'} strokeWidth={i % 3 + 2} opacity={active ? .9 : .2} style={{ animationDelay: `${i * .07}s` }}/>) }
        <g className="return-shield-capsule" style={{transform:`translate(490px,290px) rotate(${90+test.angle}deg) scale(2.7)`}}><Capsule metal={metal} shield/>{active ? <path d="M-49 19Q0 48 49 19" fill="none" stroke={Math.abs(test.angle) <= 15 ? '#ffb866' : '#f46e87'} strokeWidth="8" className="return-shield-heat"/> : null}</g>
        <path d="M290 286h70m-13-10 13 10-13 10" stroke="#ffda89" strokeWidth="4"/>
        <g transform="translate(685 135)"><rect width="18" height="238" rx="9" fill="#312643" stroke="#75627f"/><rect x="4" y={230 - progress * (Math.abs(test.angle) <= 15 ? 55 : 220)} width="10" height={progress * (Math.abs(test.angle) <= 15 ? 55 : 220)} rx="5" fill={Math.abs(test.angle) <= 15 ? '#94e9c7' : '#ff7786'}/></g>
      </> : null}
      {test.id === 'parachutes' ? <>
        <g opacity=".15" fill="#eef5ff"><ellipse cx="195" cy="161" rx="130" ry="19"/><ellipse cx="695" cy="95" rx="165" ry="24"/><ellipse cx="90" cy="330" rx="100" ry="22"/></g>
        <path d="M0 446q150-18 300 0t300 0 300 0v94H0Z" fill="#203951"/><path d="M0 456q150-18 300 0t300 0 300 0" fill="none" stroke="#7caac4" strokeWidth="3" opacity=".7"/>
        {test.deployedAt !== null ? <g className="return-test-canopy" transform={`translate(450 ${height})`}><g transform={`scale(${Math.max(.03,canopyOpen)})`}>
          <path d="M-150-103Q-119-232 0-234T150-103Q113-123 75-103Q36-126 0-103Q-37-126-75-103Q-112-124-150-103Z" fill="#f5e0c6" stroke="#eaf4fa" strokeWidth="3"/>
          <path d="M-75-103Q-62-217 0-234Q64-217 75-103L40-109Q27-197 0-232Q-27-197-40-109Z" fill="#e87972"/><path d="M-150-103-29 0M150-103 29 0M-75-103-13 0M75-103 13 0M0-103V-3" stroke="#dfe9e8" strokeWidth="2"/>
        </g></g> : null}
        <g className="return-test-moving" style={{ transform: `translate(450px, ${height}px) scale(.85)` }}><Capsule metal={metal}/></g>
        {pass ? <><ellipse className="return-test-splash" cx="450" cy="447" rx="85" ry="14" stroke="#c2eafb" strokeWidth="4" fill="#8bcfe03a"/><path d="m410 442-15-22m81 22 13-25m-38 18-1-20" stroke="#b5e7ed" strokeWidth="4"/></> : null}
        <g transform="translate(720 110)"><rect width="20" height="270" rx="10" fill="#2d2644" stroke="#8b7b9e"/><rect x="2" y="83" width="16" height="167" rx="8" fill="#7bd9b4" opacity=".7"/><path d={`M-8 ${test.phase === 'ready' ? 8 : test.deployedAt !== null ? 160 : Math.min(262, test.elapsed / 4.2 * 250)}h36`} stroke="#fff3ba" strokeWidth="5"/></g>
      </> : null}
      {pass ? <g className="return-test-success" transform="translate(770 65)"><circle r="25" fill="#174d41" stroke="#a9ffd3" strokeWidth="2"/><path d="m-12 0 8 8 16-17" fill="none" stroke="#bdffdd" strokeWidth="4" strokeLinecap="round"/></g> : null}
    </svg>
    {test.id === 'parachutes' && test.deployedAt !== null ? <span className="return-lab-speed">SLOW ↓</span> : null}
    <span className={`return-lab-result ${pass ? 'is-pass' : test.phase === 'failed' ? 'is-fail' : ''}`} role="status">{pass ? <><Check size={22}/>{successes[test.id]}</> : test.phase === 'failed' ? 'Try again ↺' : test.paused ? 'Paused' : test.id === 'parachutes' && chuteWindow(test) ? 'OPEN NOW' : ''}</span>
  </div>;
}
