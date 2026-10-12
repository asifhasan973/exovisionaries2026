import type { RepairGuide } from './repairGuidance.ts';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pointer, Package } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { StoryStepId } from './types.ts';

type Demo = { key: string; from: string; to?: string; label: string; depthCm?: number };
function lesson(step: StoryStepId, repair?: RepairGuide, replaying = false): Demo {
  if (repair && step === repair.stage) {
    const key = `fix-${repair.problem}-${repair.partId ?? repair.depthCm}`;
    if (repair.action === 'depth') return { key, from: '#drill-depth', to: '#drill-depth', label: repair.label, depthCm: repair.depthCm };
    return { key, from: `[data-part-id="${repair.partId}"] ${repair.action === 'remove' ? '.part-remove' : '.workshop-pick:not(:disabled)'}`, to: repair.action === 'install' ? '.workshop-drop-zone' : undefined, label: repair.action === 'remove' ? 'Tap Remove' : 'Drag or tap this part' };
  }
  if (step === 'player-name') return { key: 'name', from: '#commander-name-input', label: 'Your name' };
  if (['destination', 'objective', 'site'].includes(step)) return { key: 'choose', from: '.selection-card:not(:disabled)', label: 'Tap to choose' };
  if (['lander-build', 'rover-select', 'science-build', 'power-build', 'survival-build'].includes(step)) {
    if (document.querySelector('#drill-depth')) return { key: 'depth', from: '#drill-depth', to: '#drill-depth', label: 'Slide to choose' };
    if (document.querySelector('.workshop-pick:not(:disabled)')) return { key: 'install', from: '.workshop-pick:not(:disabled)', to: '.workshop-drop-zone', label: 'Drag or tap' };
    return { key: 'next', from: '.conversation-controls .conversation-next:not(:disabled)', label: 'Tap Next' };
  }
  if (step === 'crew-selection') {
    const scienceFilled = document.querySelector('[data-crew-role="scientist"]')?.closest('.crew-role')?.classList.contains('is-filled');
    const supportFilled = document.querySelector('[data-crew-role="support"]')?.closest('.crew-role')?.classList.contains('is-filled');
    if (scienceFilled && supportFilled) return { key: 'crew-save', from: '[data-primary-action]:not(:disabled)', label: 'Save your crew' };
    const scientist = document.querySelector('.crew-main')?.getAttribute('data-moon-objective') === 'lunar-geology' ? 'geologist' : 'astrobiologist';
    return !scienceFilled ? { key: 'crew-scientist', from: `[data-crew-id="${scientist}"]`, to: '[data-crew-role="scientist"]', label: 'Match a science expert' } : { key: 'crew-support', from: '[data-crew-id="robotics-specialist"]', to: '[data-crew-role="support"]', label: 'Match a support expert' };
  }
  if(step==='crew-check'){
    if(document.querySelector('.human-hatch:not(.is-sealed)'))return {key:'seal-cabin',from:'.human-hatch:not(.is-sealed)',label:'Seal the cabin'};
    if(document.querySelector('.human-supply.is-required'))return {key:'load-kits',from:'.human-supply.is-required',label:'Pack more day kits'};
  }
  if(step==='systems-check')return {key:'return-connections',from:'.human-connect:not(.is-connected)',label:'Check each return system'};
  if(step==='stress-check'&&document.querySelector('.human-stress-actions'))return document.querySelector('.human-main')?.getAttribute('data-stress-mode')==='challenge'&&!replaying?{key:'challenge-choice',from:'.human-stress-actions',label:'Pick a safe action'}:{key:'stress-choice',from:'[data-stress-hint="true"]',label:'Try this safe action'};
  if (step === 'mass-check' && document.querySelector('.readiness-connectors .is-unplugged')) return { key: 'repair', from: '.readiness-connectors .is-unplugged', label: 'Tap to fix' };
  if (step === 'power-check') return document.querySelector('.repair-fix') ? { key: 'fix-alert', from: '.repair-fix', label: 'Tap Fix' } : { key: 'trial', from: '.trial-actions button:not(:disabled)', label: 'Tap to test' };
  if(step==='rocket-pack'&&document.querySelector('.human-pack-list'))return {key:'secure-ship',from:'.human-pack-item:not(:disabled)',label:'Secure each flight item'};
  if (step === 'rocket-pack') return { key: 'pack', from: '.readiness-pack-button:not(:disabled)', to: '.readiness-bay', label: 'Drag to pack' };
  if (step === 'liftoff') {
    if (document.querySelector('.flight-window')) return document.querySelector('.flight-window.is-safe') ? { key: 'release', from: '.flight-window.is-safe .flight-action:not(:disabled)', label: 'Tap in green' } : { key: 'wait-green', from: '.flight-window-track', label: 'Wait for green' };
    if (document.querySelector('.launch-primary.is-release')) return { key: 'guided-release', from: '.launch-primary.is-release', label: 'Your turn!' };
    return document.querySelector('.launch-primary.is-start') ? { key: 'launch', from: '.launch-primary.is-start', label: 'Tap to launch' } : { key: 'flight-control', from: '.launch-primary', label: 'Pause or resume' };
  }
  return { key: 'next', from: '.conversation-controls .conversation-next:not(:disabled)', label: 'Tap Next' };
}
const seen = new Set<string>();
function hasSeen(key: string) { try { return seen.has(key) || sessionStorage.getItem(`ztb-help-v1:${key}`) === 'seen'; } catch { return seen.has(key); } }
function remember(key: string) { seen.add(key); try { sessionStorage.setItem(`ztb-help-v1:${key}`, 'seen'); } catch { /* Memory fallback for private browsers. */ } }
interface GuideFrame { from: { x: number; y: number }; to: { x: number; y: number }; key: string; label: string; image?: string; drag: boolean; part: boolean }
/** A ghost gesture only: never dispatches gameplay events or changes the user's build. */
export function GestureGuide({ step, hidden, repair }: { step: StoryStepId; hidden: boolean; repair?: RepairGuide }) {
  const [guide, setGuide] = useState<GuideFrame | null>(null);
  useEffect(() => {
    // The parent keys this component by stage/home. Input and observer callbacks
    // clear a gesture; stage changes already create a fresh null guide.
    if (hidden) return;
    let timer: ReturnType<typeof setTimeout>, finish: ReturnType<typeof setTimeout>, started = false, cancelled = false, replaying = !!repair;
    const stop = () => { cancelled = true; clearTimeout(timer); clearTimeout(finish); setGuide(null); };
    const show = () => {
      if (cancelled || started || document.querySelector('dialog[open]') || document.hidden) return;
      const demo = lesson(step, repair, replaying);
      if (!replaying && (hasSeen(demo.key) || window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      const source = document.querySelector<HTMLElement>(demo.from), target = demo.to ? document.querySelector<HTMLElement>(demo.to) : source;
      if (!source || !target) return;
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
      if (a.width < 2 || a.height < 2) return;
      started = true; remember(demo.key);
      const range = demo.key === 'depth' || demo.depthCm !== undefined;
      const rangeInput = source as HTMLInputElement;
      const fromRatio = demo.depthCm !== undefined ? (Number(rangeInput.value) - 10) / 90 : .3;
      const toRatio = demo.depthCm !== undefined ? (demo.depthCm - 10) / 90 : .7;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setGuide({ key: demo.key, label: demo.label, from: { x: a.left + a.width * (range ? fromRatio : .5), y: a.top + a.height * .5 }, to: { x: b.left + b.width * (range ? toRatio : .5), y: b.top + b.height * .5 }, drag: !!demo.to && !reducedMotion, part: !range && !!demo.to, image: source.querySelector('img')?.src });
      finish = setTimeout(() => setGuide(null), repair ? 6000 : 3000);
    };
    let currentLesson = lesson(step, repair).key;
    const schedule = () => { const nextLesson = lesson(step, repair).key; if (nextLesson !== currentLesson) { currentLesson = nextLesson; cancelled = false; started = false; clearTimeout(finish); setGuide(null); } clearTimeout(timer); timer = setTimeout(show, repair ? 100 : 700); };
    const replay = () => { clearTimeout(finish); setGuide(null); started = false; cancelled = false; replaying = true; schedule(); };
    const resize = () => { clearTimeout(finish); setGuide(null); };
    const observer = new MutationObserver(() => { if (lesson(step, repair).key !== currentLesson || !started && !cancelled) { clearTimeout(timer); timer = setTimeout(show, 50); if (lesson(step, repair).key !== currentLesson) schedule(); } });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
    schedule();
    window.addEventListener('replay-game-help', replay);
    window.addEventListener('pointerdown', stop, true);
    window.addEventListener('keydown', stop, true);
    window.addEventListener('resize', resize);
    return () => { clearTimeout(timer); clearTimeout(finish); observer.disconnect(); window.removeEventListener('replay-game-help', replay); window.removeEventListener('pointerdown', stop, true); window.removeEventListener('keydown', stop, true); window.removeEventListener('resize', resize); };
  }, [step, hidden, repair]);
  if (!guide || hidden) return null;
  const style = { '--hand-x': `${guide.from.x}px`, '--hand-y': `${guide.from.y}px`, '--hand-end-x': `${guide.to.x}px`, '--hand-end-y': `${guide.to.y}px` } as CSSProperties;
  return createPortal(<div className="gesture-demo" aria-hidden="true" style={style}>
    <span className="gesture-target" style={{ left: guide.to.x, top: guide.to.y }} />
    <div className={`gesture-hand ${guide.drag ? 'is-drag' : 'is-tap'}`} key={`${step}-${guide.key}`}>
      {guide.drag && guide.part ? <div className="gesture-part">{guide.image ? <img src={guide.image} alt="" /> : <Package size={28} />}</div> : null}
      <Pointer size={48} /><span>{guide.label}</span>
    </div>
  </div>, document.body);
}
