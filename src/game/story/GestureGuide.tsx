import type { RepairGuide } from './repairGuidance.ts';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pointer, Package } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { StoryStepId } from './types.ts';
import { useGameSettings } from './gameSettingsContext.ts';
import './moon/scenePolish.css';

type Demo = { key: string; from: string; to?: string; label: string; depthCm?: number };
function lesson(step: StoryStepId, repair?: RepairGuide, replaying = false): Demo {
  if (repair && step === repair.stage) {
    const key = `fix-${repair.problem}-${repair.partId ?? repair.depthCm}`;
    if (repair.action === 'depth') return { key, from: '#drill-depth', to: '#drill-depth', label: repair.label, depthCm: repair.depthCm };
    return { key, from: `[data-part-id="${repair.partId}"] ${repair.action === 'remove' ? '.part-remove' : '.workshop-pick:not(:disabled)'}`, to: repair.action === 'install' ? '.workshop-drop-zone' : undefined, label: repair.action === 'remove' ? 'Tap Remove' : 'Drag or tap this part' };
  }
  if (step === 'player-name') return { key: 'name', from: '#commander-name-input', label: 'Your name' };
  if (['destination', 'objective', 'site'].includes(step)) return { key: `${step}-choose`, from: '.selection-card:not(:disabled)', label: 'Tap to choose' };
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
  if (step === 'power-check') {
    if (document.querySelector('.repair-fix')) return { key: 'fix-alert', from: '.repair-fix', label: 'Tap Fix' };
    return document.querySelector('.trial-actions button:not(:disabled)')
      ? { key: 'trial', from: '.trial-actions button:not(:disabled)', label: 'Tap to test' }
      : { key: 'trial-next', from: '.conversation-next:not(:disabled)', label: 'Next check' };
  }
  if(step==='rocket-pack'&&document.querySelector('.human-pack-list'))return {key:'secure-ship',from:'.human-pack-item:not(:disabled)',label:'Secure each flight item'};
  if (step === 'rocket-pack') return { key: 'pack', from: '.readiness-pack-button:not(:disabled)', to: '.readiness-bay', label: 'Drag to pack' };
  if(['ice-science','surface-recovery'].includes(step)&&document.querySelector('.incident-panel'))return {key:'incident-choice',from:'[data-incident-recommended=true]:not(:disabled)',label:'Choose a safe plan'};
  if(step==='crew-return'){const stage=document.querySelector('.return-main')?.getAttribute('data-return-stage');return {key:`return-${stage}`,from:document.querySelector('[data-return-hint]:not(:disabled)')?'[data-return-hint]:not(:disabled)':'.conversation-next:not(:disabled)',label:stage==='rendezvous'?'Slow down. Line up. Dock.':stage==='entry-ready'?'Turn the heat shield to Earth':'Bring the crew home'};}
  if(step==='surface-recovery')return {key:'surface-secure',from:'[data-recovery-action]:not(:disabled)',label:'Secure the surface'};
  if(step==='ice-science'){
    if(document.querySelector('.geo-sensor-choice'))return {key:'geo-sensor',from:'[data-geo-sensor=ground]:not(:disabled)',label:'Place on quiet ground'};
    if(document.querySelector('.science-claims'))return {key:'read-evidence',from:'.science-evidence',label:'Match the clues, then choose'};
    if(document.querySelector('.science-targets'))return {key:'science-site',from:'.science-targets button[aria-pressed=true]',label:'Pick a site. Then Start expedition.'};
    if(document.querySelector('.science-running'))return {key:'science-running',from:'.conversation-next:not(:disabled)',label:'Pause or resume here'};
    return {key:'science-next',from:'.conversation-next:not(:disabled)',label:'Continue your science trip'};
  }
  if(step==='lunar-surface')return {key:'deploy-rover',from:'.conversation-next:not(:disabled)',label:'Deploy your rover'};
  if(step==='surface-explore'){
    if(document.querySelector('.surface-drive-hold'))return {key:'drive-held',from:'.surface-drive-hold',label:'Hold to drive'};
    if(document.querySelector('.conversation-controls .conversation-next')?.textContent?.trim().startsWith('Resume'))return {key:'surface-resume',from:'.conversation-next:not(:disabled)',label:'Resume your rover'};
    if(document.querySelector('.surface-routes button[aria-pressed=true]:not(.is-blocked)'))return {key:'surface-go',from:'.conversation-next:not(:disabled)',label:'Start your selected route'};
    return {key:'surface-path',from:'.surface-routes button:not(.is-blocked)',label:'Choose a safe path'};
  }
  if(step==='lunar-descent'){
    if(document.querySelector('.landing-pads'))return {key:'clear-landing',from:'.landing-pads button[data-safe="true"]',label:'Choose a clear patch'};
    if(document.querySelector('.conversation-controls .conversation-next')?.textContent?.trim().startsWith('Resume'))return {key:'landing-resume',from:'.conversation-next:not(:disabled)',label:'Resume, then adjust thrust'};
    if(document.querySelector('.landing-throttle input:not(:disabled)'))return {key:'landing-throttle',from:'.landing-throttle input:not(:disabled)',to:'.landing-throttle input:not(:disabled)',label:'Slide thrust to slow down'};
    return {key:'landing-start',from:'.conversation-next:not(:disabled)',label:'Start your landing'};
  }
  if(step==='earth-orbit')return document.querySelector('.journey-routes button[aria-pressed=true]:not(.is-unavailable)')?{key:'moon-route-start',from:'.conversation-next:not(:disabled)',label:'Start this Moon route'}:{key:'moon-route',from:'.journey-routes button:not(.is-unavailable)',label:'Pick a Moon route'};
  if(step==='moon-transfer'){
    const correct=document.querySelector('.journey-main')?.getAttribute('data-burn-direction');
    if(correct&&replaying)return {key:`moon-burn-${correct}`,from:`button[data-burn-direction="${correct}"]`,label:'Point this way, then fire in green'};
    if(document.querySelector('.journey-directions'))return {key:'moon-direction',from:'.journey-directions',label:'Choose direction, then fire'};
  }
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
interface GuideFrame { from: { x: number; y: number }; to: { x: number; y: number }; key: string; label: string; image?: string; drag: boolean; part: boolean; showing: boolean; gentle: boolean }
/** A ghost gesture only: never dispatches gameplay events or changes the user's build. */
export function GestureGuide({ step, hidden, repair }: { step: StoryStepId; hidden: boolean; repair?: RepairGuide }) {
  const { gentle } = useGameSettings();
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
      if (!replaying && hasSeen(demo.key)) return;
      const source = document.querySelector<HTMLElement>(demo.from), target = demo.to ? document.querySelector<HTMLElement>(demo.to) : source;
      if (!source || !target) return;
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect();
      if (a.width < 2 || a.height < 2) return;
      started = true; remember(demo.key);
      const range = source instanceof HTMLInputElement && source.type === 'range';
      const rangeInput = source as HTMLInputElement;
      const min = Number(rangeInput.min || 0), max = Number(rangeInput.max || 100), span = Math.max(1, max - min);
      const fromRatio = demo.depthCm !== undefined ? (Number(rangeInput.value) - min) / span : .3;
      const toRatio = demo.depthCm !== undefined ? (demo.depthCm - min) / span : .7;
      const reducedMotion = gentle || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setGuide({ key: demo.key, label: demo.label, from: { x: a.left + a.width * (range ? Math.max(0, Math.min(1, fromRatio)) : .5), y: a.top + a.height * .5 }, to: { x: b.left + b.width * (range ? Math.max(0, Math.min(1, toRatio)) : .5), y: b.top + b.height * .5 }, drag: !!demo.to && !reducedMotion, part: !range && !!demo.to && source !== target && source.classList.contains('workshop-pick'), image: source.querySelector('img')?.src, showing: !replaying, gentle: reducedMotion });
      finish = setTimeout(() => setGuide(null), repair ? 6000 : 3000);
    };
    let currentLesson = lesson(step, repair).key;
    const schedule = () => { const nextLesson = lesson(step, repair).key; if (nextLesson !== currentLesson) { currentLesson = nextLesson; cancelled = false; started = false; clearTimeout(finish); setGuide(null); } clearTimeout(timer); timer = setTimeout(show, repair ? 100 : 700); };
    const replay = () => { clearTimeout(finish); setGuide(null); started = false; cancelled = false; replaying = true; schedule(); };
    const resize = () => { clearTimeout(finish); setGuide(null); };
    const observer = new MutationObserver(() => { if (lesson(step, repair).key !== currentLesson || !started && !cancelled) { clearTimeout(timer); timer = setTimeout(show, 50); if (lesson(step, repair).key !== currentLesson) schedule(); } });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class', 'aria-pressed', 'data-tutorial-state', 'data-return-stage', 'data-burn-direction'] });
    schedule();
    window.addEventListener('replay-game-help', replay);
    window.addEventListener('pointerdown', stop, true);
    window.addEventListener('keydown', stop, true);
    window.addEventListener('resize', resize);
    return () => { clearTimeout(timer); clearTimeout(finish); observer.disconnect(); window.removeEventListener('replay-game-help', replay); window.removeEventListener('pointerdown', stop, true); window.removeEventListener('keydown', stop, true); window.removeEventListener('resize', resize); };
  }, [step, hidden, repair, gentle]);
  if (!guide || hidden) return null;
  const labelShift = Math.max(115, Math.min(window.innerWidth - 115, guide.from.x)) - guide.from.x;
  const style = { '--hand-x': `${guide.from.x}px`, '--hand-y': `${guide.from.y}px`, '--hand-end-x': `${guide.to.x}px`, '--hand-end-y': `${guide.to.y}px`, '--hand-label-shift': `${labelShift}px` } as CSSProperties;
  return createPortal(<div className="gesture-demo" aria-hidden="true" style={style}>
    <span className="gesture-target" style={{ left: guide.to.x, top: guide.to.y }} />
    <div className={`gesture-hand ${guide.drag ? 'is-drag' : 'is-tap'} ${guide.gentle ? 'is-gentle' : ''} ${Math.max(guide.from.y,guide.to.y)>window.innerHeight-130?'is-near-bottom':''}`} key={`${step}-${guide.key}`}>
      {guide.drag && guide.part ? <div className="gesture-part">{guide.image ? <img src={guide.image} alt="" /> : <Package size={28} />}</div> : null}
      <Pointer size={48} /><span>{guide.showing ? <small>DEMO · YOUR TURN NEXT</small> : null}{guide.label}</span>
    </div>
  </div>, document.body);
}
