import { lazy, Suspense, useEffect, useState } from 'react';
import {
  Check,
  Gauge,
  Radio,
  ShieldCheck,
  Wind
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { useMissionStore } from '../state/missionStore';
import { Guide, MissionDock } from './shared';
import { MissionCinematic } from './MissionCinematic';
import './milestone1.css';

const EngineTest3D = lazy(() => import('./EngineTest3D').then(module => ({ default: module.EngineTest3D })));

export function SystemTests() {
  const savedPassed = useMissionStore(s => s.systemTestsPassed);
  const [test, setTest] = useState<0 | 1>(savedPassed ? 1 : 0);
  const [throttle, setThrottle] = useState(35);
  const [firing, setFiring] = useState(false);
  const [fireProgress, setFireProgress] = useState(savedPassed ? 100 : 0);
  const [sealedLeaks, setSealedLeaks] = useState<number[]>(savedPassed ? [0, 2] : []);
  const [cinematic, setCinematic] = useState<'intro' | 'engine' | 'complete' | null>(savedPassed ? null : 'intro');
  const staticPassed = fireProgress >= 100;
  const pressurePassed = sealedLeaks.length === 2;
  const reducedMotion = useMissionStore(s => s.audioSettings.reducedMotion);
  const allPassed = staticPassed && pressurePassed;

  useEffect(() => {
    if (!firing || staticPassed) return;
    const timer = window.setInterval(() => {
      if (throttle >= 48 && throttle <= 62) {
        setFireProgress(value => {
          const next = Math.min(100, value + 4);
          if (next === 100) window.setTimeout(() => {
            setFiring(false);
            sound.playRadioBeep(true);
            setCinematic('engine');
          }, 350);
          return next;
        });
      } else {
        setFireProgress(value => Math.max(0, value - 5));
      }
    }, 90);
    return () => window.clearInterval(timer);
  }, [firing, throttle, staticPassed]);

  useEffect(() => {
    if (firing && !staticPassed) {
      sound.startRocketRoar();
      sound.updateRocketIntensity(Math.max(.35, throttle / 100), 0);
    } else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  }, [firing, throttle, staticPassed]);

  function sealLeak(index: 0 | 2) {
    if (sealedLeaks.includes(index)) {
      sound.playClick(520);
      return;
    }
    const nextSealedLeaks = [...sealedLeaks, index];
    setSealedLeaks(nextSealedLeaks);
    sound.playSnap();
    if (staticPassed && nextSealedLeaks.length === 2 && !savedPassed) {
      useMissionStore.getState().completeSystemTests();
      setCinematic('complete');
    }
  }

  const guideText = allPassed
    ? 'Engine and cabin passed. Meet your crew!'
    : test === 0
      ? 'Move into green. Then run the engine.'
      : 'Tap the two flashing red leaks.';

  return <div className="chapter system-tests-chapter">
    <div className="chapter-top test-heading">
      <div><p className="eyebrow">MILESTONE 01 · SYSTEM CHECK</p><h1>Prove it can fly<span className="dot">.</span></h1></div>
      <div className="test-passport"><span className={staticPassed ? 'passed' : ''}>{staticPassed ? <Check size={15} /> : '01'} Engine</span><span className={pressurePassed ? 'passed' : ''}>{pressurePassed ? <Check size={15} /> : '02'} Cabin</span></div>
    </div>

    <div className="test-lab">
      <aside className="test-guide-panel">
        <div className={`test-character ${firing ? 'reacting' : ''}`}>
          <img src={allPassed ? '/story/mira-success.webp' : firing || test === 1 ? '/story/mira-warning.webp' : '/story/mira-neutral-new.webp'} alt="Mira reacting to the current spacecraft test" />
          <span className="test-radio-wave"><Radio size={18} /></span>
        </div>
        <Guide person="mira" text={guideText} />
        <div className="test-science-note">
          <ShieldCheck size={20} />
          <span><b>Test before launch</b><small>Find problems safely on Earth.</small></span>
        </div>
      </aside>

      <section className="test-console" aria-live="polite">
        <div className="test-tabs">
          <button className={`${test === 0 ? 'current' : ''} ${staticPassed ? 'passed' : ''}`} onClick={() => setTest(0)}><Gauge size={19} /><span><b>Static fire</b><small>Thrust & stability</small></span>{staticPassed ? <Check size={18} /> : null}</button>
          <button className={`${test === 1 ? 'current' : ''} ${pressurePassed ? 'passed' : ''}`} disabled={!staticPassed} onClick={() => setTest(1)}><Wind size={19} /><span><b>Cabin pressure</b><small>Air & seals</small></span>{pressurePassed ? <Check size={18} /> : null}</button>
        </div>

        {test === 0 ? <div className="static-fire-game">
          <div className={`engine-stand ${firing ? 'firing' : ''} ${staticPassed ? 'passed' : ''}`}>
            <Suspense fallback={<div className="engine-test-loading">Preparing the engine stand…</div>}><EngineTest3D firing={firing} throttle={throttle} passed={staticPassed} reducedMotion={reducedMotion} /></Suspense>
            <strong>{staticPassed ? 'TEST PASSED' : firing ? 'ENGINES FIRING' : 'STANDBY'}</strong>
          </div>
          <div className="throttle-console">
            <div className="console-readout"><span>THROTTLE</span><strong>{throttle}%</strong><small>{throttle < 48 ? 'Too low' : throttle > 62 ? 'Too much vibration' : 'Stable thrust'}</small></div>
            <div className="throttle-track"><span className="green-zone" /><input type="range" min="0" max="100" value={throttle} onChange={event => setThrottle(Number(event.target.value))} aria-label="Static fire throttle" aria-valuetext={`${throttle} percent`} /></div>
            <div className="test-progress"><span style={{ width: `${fireProgress}%` }} /></div>
            <button className="primary" disabled={staticPassed} onClick={() => setFiring(value => !value)}>{staticPassed ? <><Check size={18} /> Engine passed</> : firing ? 'Hold test' : 'Run static fire'}</button>
          </div>
        </div> : <div className="pressure-game">
          <div className="capsule-cutaway">
            <span className="cabin-pressure-label">CABIN PRESSURE <b>{pressurePassed ? 'SEALED' : `${76 + sealedLeaks.length * 12}%`}</b></span>
            <div className="capsule-shell"><span className="crew-seat-mini" /><span className="crew-seat-mini second" />
              {[0, 1, 2].map(index => {
                const leakNumber = index === 0 ? 1 : 2;
                const sealed = index === 1 || sealedLeaks.includes(index);
                return <button
                  key={index}
                  type="button"
                  className={`leak-valve leak-${index} ${sealed ? 'sealed' : ''} ${index !== 1 && !sealed ? 'leaking' : ''}`}
                  disabled={sealed}
                  onClick={() => index !== 1 && sealLeak(index as 0 | 2)}
                  aria-label={index === 1 ? 'Stable cabin valve' : sealed ? `Leak ${leakNumber} sealed` : `Seal leak ${leakNumber}`}
                >{sealed ? <Check size={22} /> : leakNumber}</button>;
              })}
            </div>
            <div className="pressure-rings"><span /><span /><span /></div>
          </div>
          <div className="pressure-instructions">
            <Wind size={31} />
            <h2>{pressurePassed ? 'Cabin sealed!' : 'Find two leaks'}</h2>
            <p>{pressurePassed ? 'Cabin pressure is safe.' : 'Tap both red valves.'}</p>
            <div className="leak-counter">
              {([0, 2] as const).map((leakId, index) => {
                const sealed = sealedLeaks.includes(leakId);
                return <button key={leakId} type="button" className={sealed ? 'done' : ''} disabled={sealed} onClick={() => sealLeak(leakId)} aria-label={sealed ? `Leak ${index + 1} sealed` : `Seal leak ${index + 1}`}>
                  <span>{sealed ? <Check size={18} /> : index + 1}</span>
                  <b>{sealed ? 'Sealed' : `Seal leak ${index + 1}`}</b>
                </button>;
              })}
            </div>
          </div>
        </div>}
      </section>
    </div>

    <MissionDock
      back={{label:'Workshop',onClick:()=>useMissionStore.getState().setPhase('assembly')}}
      guide={{label:'Talk to Mira',onClick:()=>setCinematic(allPassed?'complete':test===0?'intro':'engine')}}
      next={{label:'Meet the crew',disabled:!allPassed,onClick:()=>useMissionStore.getState().setPhase('crew')}}
    />
    {cinematic ? <MissionCinematic key={cinematic} scene={cinematic === 'intro' ? {
      eyebrow: 'ENGINEERING CHECKPOINT',
      title: 'Test before launch.',
      lines: [
        'Keep the throttle inside the green band.',
        'Then find and seal two cabin leaks.'
      ],
      actionLabel: 'Enter the test lab',
      mood: 'briefing'
    } : cinematic === 'engine' ? {
      eyebrow: 'TEST 01 PASSED',
      title: 'That roar was steady!',
      lines: ['Engine passed! Now seal the two red leaks.'],
      actionLabel: 'Inspect the cabin',
      reward: 'ENGINE TEST PASSED',
      mood: 'success'
    } : {
      eyebrow: 'SPACECRAFT CERTIFIED',
      title: 'Safe for a crew!',
      lines: ['Both tests passed. Choose your crew!'],
      actionLabel: 'Meet the crew',
      reward: 'FLIGHT SAFETY BADGE',
      mood: 'success'
    }} onComplete={() => {
      if (cinematic === 'engine') { setTest(1); setCinematic(null); }
      else if (cinematic === 'complete') useMissionStore.getState().setPhase('crew');
      else setCinematic(null);
    }} /> : null}
  </div>;
}
