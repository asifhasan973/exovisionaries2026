import type { RepairGuide } from '@/game/moon/hazards/repairGuidance';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pointer, Package } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { StoryStepId } from '@/game/moon/core/types';
import { useGameSettings } from './settings';
import '@/game/moon/shared/expedition/scenePolish.css';
import { isEngineFrozen } from '@exo/ui';
import { ROCKET_ORDER } from '@/game/moon/workshop/rocket/rocketAssembly';

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
    if(document.querySelector('.human-hatch:not(.is-sealed)'))return {key:'seal-cabin',from:'.human-hatch:not(.is-sealed)',label:'Close the crew hatch'};
    if(document.querySelector('.human-supply.is-required'))return {key:'load-kits',from:'.human-supply.is-required',label:'Pack more day kits'};
  }
  if(step==='systems-check'){
    const lab=document.querySelector('.return-lab-controls'),id=lab?.getAttribute('data-return-test'),angle=Number(lab?.getAttribute('data-test-angle'));
    const throttle=document.querySelector<HTMLInputElement>('.return-throttle input');
    if(throttle&&(Number(throttle.value)<55||Number(throttle.value)>75))return {key:'test-thrust',from:'.return-throttle input',to:'.return-throttle input',label:'Slide into green'};
    if((id==='service'||id==='shield')&&angle!==0&&document.querySelector('.return-aim-controls button:not(:disabled)'))return {key:`test-aim-${id}`,from:`.return-aim-controls button[aria-label="Turn ${angle<0?'right':'left'}"]`,label:id==='shield'?'Turn the shield toward the heat':'Aim at the ring'};
    if(document.querySelector('[data-return-test-action]:not(:disabled)'))return {key:`run-test-${id}`,from:'[data-return-test-action]:not(:disabled)',label:id==='ascent'?'Hold to fire':id==='parachutes'?'Drop, then open in green':'Run the test'};
    return {key:'test-next',from:'.conversation-next:not(:disabled)',label:'Next test'};
  }
  if(step==='stress-check'&&document.querySelector('.human-stress-actions'))return {key:'quiz-choice',from:'.human-stress-actions',label:'Pick an answer'};
  if(step==='rocket-assembly'){
    const page=document.querySelector('.rocket-assembly-main');
    if(page?.getAttribute('data-rocket-ready')!=='true')return {key:'rocket-loading',from:'.rocket-guide-wait',label:''};
    const count=Number(page.getAttribute('data-rocket-count'));
    if(!replaying&&count>0)return {key:'rocket-manual',from:'.rocket-guide-wait',label:''};
    if(replaying&&page.getAttribute('data-rocket-blocked')==='true')return {key:'rocket-open-first',from:'[data-rocket-open-cover]',label:'Remove cover. Load the cargo first.'};
    const selected=page.getAttribute('data-rocket-selected');
    const id=replaying&&selected&&document.querySelector(`[data-rocket-part="${selected}"]:not(:disabled)`)?selected:ROCKET_ORDER.find((id: string)=>document.querySelector(`[data-rocket-part="${id}"]:not(:disabled)`));
    return id?{key:replaying?`rocket-hint-${id}`:'rocket-first-part',from:`[data-rocket-part="${id}"]`,to:`[data-rocket-socket="${id}"]`,label:'Match the part to this outline'}:{key:'rocket-ready',from:'.conversation-next:not(:disabled)',label:'Your rocket is ready!'};
  }
  if (step === 'mass-check' && document.querySelector('.readiness-connectors .is-unplugged')) return { key: 'repair', from: '.readiness-connectors .is-unplugged', label: 'Tap to fix' };
  if (step === 'power-check') {
    if (document.querySelector('.repair-fix')) return { key: 'fix-alert', from: '.repair-fix', label: 'Tap Fix' };
    return document.querySelector('.trial-actions button:not(:disabled)')
      ? { key: 'trial', from: '.trial-actions button:not(:disabled)', label: 'Tap to test' }
      : { key: 'trial-next', from: '.conversation-next:not(:disabled)', label: 'Next check' };
  }
  if(step==='rocket-pack'&&document.querySelector('.packing-lab-controls')){
    const lab=document.querySelector('.packing-lab-controls'),id=lab?.getAttribute('data-packing-game');
    if(id==='capsule'){
      if(lab?.getAttribute('data-packing-seated')!=='true')return {key:'pack-capsule-fit',from:'.packing-cargo-source',to:'[data-packing-target="capsule"]',label:'Fit the capsule on the ring'};
      if(document.querySelector('[data-packing-clamp][aria-disabled="false"]'))return {key:'pack-capsule-lock',from:'[data-packing-clamp][aria-disabled="false"]',label:'Close both clamps'};
    }
    if(id==='lander'&&document.querySelector('[data-packing-lower]')){
      const angle=Number(lab?.getAttribute('data-packing-angle'));
      return Math.abs(angle)>5?{key:'pack-lander-align',from:`button[aria-label="Turn lander ${angle<0?'right':'left'}"]`,label:'Line up the gold marks'}:{key:'pack-lander-lower',from:'[data-packing-lower]',label:'Hold to lower the lander'};
    }
    if(id==='supplies'&&document.querySelector('.packing-cargo-source')){
      const source=document.querySelector('.packing-cargo-source'),name=source?.getAttribute('aria-label')?.split(' ')[2];
      return {key:'pack-supplies-match',from:'.packing-cargo-source',to:`[data-packing-target="${name}"]`,label:'Match the case to its symbol'};
    }
    return {key:'pack-next-game',from:'.conversation-next:not(:disabled)',label:'Next game'};
  }
  if (step === 'rocket-pack') return { key: 'pack', from: '.readiness-pack-button:not(:disabled)', to: '.readiness-bay', label: 'Drag to pack' };
  if(['ice-science','surface-recovery'].includes(step)&&document.querySelector('.incident-panel'))return {key:'incident-choice',from:'[data-incident-recommended=true]:not(:disabled)',label:'Choose a safe plan'};
  if(step==='crew-return'){const stage=document.querySelector('.return-main')?.getAttribute('data-return-stage');return {key:`return-${stage}`,from:document.querySelector('[data-return-hint]:not(:disabled)')?'[data-return-hint]:not(:disabled)':'.conversation-next:not(:disabled)',label:stage==='rendezvous'?'Slow down. Line up. Dock.':stage==='entry-ready'?'Turn the heat shield to Earth':'Bring the crew home'};}
  if(step==='surface-recovery')return {key:'surface-secure',from:'.conversation-next:not(:disabled)',label:'Complete this step, then continue'};
  if(step==='ice-science'){
    if(document.querySelector('.moon-findings'))return {key:'moon-evidence',from:'.moon-evidence',label:'Read the clues, then choose a finding'};
    if(document.querySelector('.geo-sensor-choice'))return {key:'geo-sensor',from:'[data-geo-sensor=ground]:not(:disabled)',label:'Place on quiet ground'};
    if(document.querySelector('.science-claims'))return {key:'read-evidence',from:'.science-evidence',label:'Match the clues, then choose'};
    if(document.querySelector('.science-targets'))return {key:'science-site',from:'.science-targets button[aria-pressed=true]',label:'Pick a site. Then Start expedition.'};
    if(document.querySelector('.science-running'))return {key:'science-running',from:'.conversation-next:not(:disabled)',label:'Pause or resume here'};
    return {key:'science-next',from:'.conversation-next:not(:disabled)',label:'Continue your science trip'};
  }
  if(step==='lunar-surface')return {key:'deploy-rover',from:'.conversation-next:not(:disabled)',label:'Deploy your rover'};
  if(step==='surface-explore'){
    if(document.querySelector('.free-rover-world'))return {key:'free-drive',from:'.rover-dpad',label:'Drive freely. Bring any two samples home.'};
    if(document.querySelector('.surface-drive-hold'))return {key:'drive-held',from:'.surface-drive-hold',label:'Hold to drive'};
    if(document.querySelector('.conversation-controls .conversation-next')?.textContent?.trim().startsWith('Resume'))return {key:'surface-resume',from:'.conversation-next:not(:disabled)',label:'Resume your rover'};
    if(document.querySelector('.surface-routes button[aria-pressed=true]:not(.is-blocked)'))return {key:'surface-go',from:'.conversation-next:not(:disabled)',label:'Start your selected route'};
    return {key:'surface-path',from:'.surface-routes button:not(.is-blocked)',label:'Choose a safe path'};
  }
  if(step==='lunar-descent'){
    if(document.querySelector('.landing-sites'))return {key:'clear-landing',from:'.landing-sites button',label:'Choose a clear landing spot'};
    if(document.querySelector('.landing-brake:not(:disabled)'))return {key:'landing-brake',from:'.landing-brake',label:'Brake here, or hold Space. A / D steers.'};
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
export function GestureGuide({
  step = 'player-name',
  hidden = false,
  repair,
}: {
  step?: StoryStepId;
  hidden?: boolean;
  repair?: RepairGuide;
} = {}) {
  const { gentle } = useGameSettings();
  const [guide, setGuide] = useState<GuideFrame | null>(null);
  useEffect(() => {
    // The parent keys this component by stage/home. Input and observer callbacks
    // clear a gesture; stage changes already create a fresh null guide.
    if (hidden) return;
    let timer: ReturnType<typeof setTimeout>, finish: ReturnType<typeof setTimeout>, started = false, cancelled = false, replaying = !!repair;
    const stop = () => { cancelled = true; if(step==='rocket-assembly')replaying=false; clearTimeout(timer); clearTimeout(finish); setGuide(null); };
    const show = () => {
      if (cancelled || started || isEngineFrozen() || document.querySelector('dialog[open]') || document.hidden) return;
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
      setGuide({ key: demo.key, label: demo.label, from: { x: a.left + a.width * (range ? Math.max(0, Math.min(1, fromRatio)) : .5), y: a.top + a.height * .5 }, to: { x: b.left + b.width * (range ? Math.max(0, Math.min(1, toRatio)) : .5), y: b.top + b.height * .5 }, drag: !!demo.to && !reducedMotion, part: !range && !!demo.to && source !== target && (source.classList.contains('workshop-pick')||source.classList.contains('rocket-part-pick')), image: source.querySelector('img')?.src, showing: !replaying, gentle: reducedMotion });
      finish = setTimeout(() => setGuide(null), repair ? 6000 : 3000);
    };
    let currentLesson = lesson(step, repair).key;
    const schedule = () => { const nextLesson = lesson(step, repair).key; if (nextLesson !== currentLesson) { currentLesson = nextLesson; cancelled = false; started = false; clearTimeout(finish); setGuide(null); } clearTimeout(timer); timer = setTimeout(show, repair ? 100 : 700); };
    const replay = () => { clearTimeout(finish); setGuide(null); started = false; cancelled = false; replaying = true; schedule(); };
    const resize = () => { clearTimeout(finish); setGuide(null); };
    const observer = new MutationObserver(() => { if (lesson(step, repair).key !== currentLesson || !started && !cancelled) { clearTimeout(timer); timer = setTimeout(show, 50); if (lesson(step, repair).key !== currentLesson) schedule(); } });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class', 'aria-pressed', 'data-tutorial-state', 'data-return-stage', 'data-burn-direction', 'data-rocket-ready', 'data-rocket-count'] });
    schedule();
    window.addEventListener('replay-game-help', replay);
    window.addEventListener('game-orientation-resume',schedule);
    window.addEventListener('pointerdown', stop, true);
    window.addEventListener('keydown', stop, true);
    window.addEventListener('resize', resize);
    return () => { clearTimeout(timer); clearTimeout(finish); observer.disconnect(); window.removeEventListener('replay-game-help', replay); window.removeEventListener('game-orientation-resume',schedule); window.removeEventListener('pointerdown', stop, true); window.removeEventListener('keydown', stop, true); window.removeEventListener('resize', resize); };
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
