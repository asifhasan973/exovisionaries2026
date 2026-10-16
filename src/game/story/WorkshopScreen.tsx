import { RepairAlert } from './RepairAlert.tsx';
import { repairApplied } from './repairGuidance.ts';
import './repair.css';
import { useGameSettings } from './gameSettingsContext.ts';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BatteryCharging, ChevronLeft, ChevronRight, Check, CheckCheck, Coins, Info, PackageCheck, Plus, Sparkles, Sun, WandSparkles, Weight, Zap, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { sound } from '../../audio/soundEngine.ts';
import { CharacterStage } from './CharacterStage.tsx';
import { StoryControls, StoryShell } from './StoryShell.tsx';
import { SCRIPT_RESOURCES } from './design.ts';
import { drillPotential, installedIds, installPart, partById, preparationTotals, stageReady, STAGE_CATEGORIES, WORKSHOP_STAGES, partsForObjective, selectedDrill } from './preparation.ts';
import { GEOLOGY_FAMILIES, SCIENCE_FAMILY_NAMES } from './moon/geology.ts';
import type { ScienceFamily } from './moon/geology.ts';
import './moon/preparation.css';
import { EngineerCompanion } from './EngineerCompanion.tsx';
import type { EngineerReaction } from './EngineerCompanion.tsx';
import type { WorkshopPart, WorkshopStage } from './preparation.ts';
import type { SelectionFrame } from './SelectionScreens.tsx';
import type { MissionEvent, WorkshopSession } from './workshopSession.ts';
import type { DesignCategory } from './design.ts';
import './workshop.css';
import { GameInfo } from './GameInfo.tsx';
import { Term } from './Learning.tsx';
import { GLOSSARY, PART_TERMS } from './glossary.ts';
import type { LearningTerm } from './glossary.ts';
import { comparePart, optionBenefit, signed } from './partComparison.ts';
import { AutoBuildStage } from './AutoBuildStage.tsx';
import { autoBuildParts } from './autoBuildPlan.ts';
import { nextWorkshopAction } from './workshopNavigation.ts';

const WorkshopViewport = lazy(() => import('./WorkshopViewport.tsx').then(module => ({ default: module.WorkshopViewport })));
const headings: Record<WorkshopStage, string> = { 'lander-build': 'Build your lander', 'rover-select': 'Choose your rover', 'science-build': 'Pack your science tools', 'power-build': 'Power your explorer', 'survival-build': 'Protect your explorer' };
const instructions: Record<WorkshopStage, string> = { 'lander-build': 'Install all six lander parts.', 'rover-select': 'Pick one rover. Try different options!', 'science-build': 'Install the three required tools. Choose a drill depth.', 'power-build': 'Choose one solar array and one battery.', 'survival-build': 'Choose cameras, thermal protection and a radio.' };
const categoryNames: Record<DesignCategory, string> = { lander: 'Lander parts', rover: 'Rover', science: 'Science tools', navigation: 'Navigation', solar: 'Solar array', battery: 'Battery', thermal: 'Thermal protection', communication: 'Communication' };
const stageNames = ['Lander', 'Rover', 'Science', 'Power', 'Survival'];
const cue = { character: 'commander', expression: 'confident', pose: 'point' } as const;

function Meter({ label, value, limit, unit, icon: Icon, term }: { term?: LearningTerm; label: string; value: number; limit: number; unit: string; icon: typeof Coins }) {
  const over = value > limit;
  return <div className={`workshop-meter ${over ? 'is-over' : ''}`}>
    <span><Icon size={17} />{term ? <Term term={term}>{label}</Term> : label}</span><strong>{value}<small> / {limit} {unit}</small></strong>
    <progress value={Math.min(value, limit)} max={limit} aria-label={`${label}: ${value} of ${limit} ${unit}`} />
    {over ? <small role="status">{value - limit} {unit} over · swap a part</small> : null}
  </div>;
}
function ManifestMeters({ session }: { session: WorkshopSession }) {
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  return <div className="workshop-meters">
    <Meter term="budget" label="Budget" value={totals.credits} limit={SCRIPT_RESOURCES.budgetCredits} unit="cr" icon={Coins} />
    <Meter term="mass" label="Mass" value={totals.massKg} limit={SCRIPT_RESOURCES.payloadMassLimitKg} unit="kg" icon={Weight} />
    {session.progress.stepId === 'science-build' && selectedDrill(session.preparation) ? <div className="workshop-meter drill-energy-meter" role="status">
      <span><BatteryCharging size={17}/><Term term="wh">Drill energy</Term></span><strong>{totals.drillEnergyWh}<small> Wh</small></strong>
      <small>{totals.drillMinutes} min · {totals.peakW} W</small>
    </div> : <Meter term="peak" label="Peak" value={totals.peakW} limit={SCRIPT_RESOURCES.peakPowerLimitW} unit="W" icon={Zap} />}
  </div>;
}
export function WorkshopScreen({ session, dispatch, frame, onBack, autoBuilding, onAutoBuild, onStopAutoBuild }: {
  session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame; onBack(): void; autoBuilding: boolean; onAutoBuild(): void; onStopAutoBuild(): void;
}) {
  const { effects } = useGameSettings();
  const objective = session.progress.selections.objective ?? 'lunar-ice';
  const geology = objective === 'lunar-geology';
  const ready = (id: WorkshopStage, preparation = session.preparation) => stageReady(id, preparation, objective);
  const drill = selectedDrill(session.preparation);
  const autoIds = autoBuildParts(session.progress.selections.site === 'permanent-shadow',objective);
  const stage = WORKSHOP_STAGES.find(id => id === session.progress.stepId);
  const stageIndex = stage ? WORKSHOP_STAGES.indexOf(stage) : -1;
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [lastInstalled, setLastInstalled] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);
  const [autoPart, setAutoPart] = useState<string | null>(null);
  const [quickConfirm, setQuickConfirm] = useState(false);
  const [meshError, setMeshError] = useState(false);
  const [reaction, setReaction] = useState<EngineerReaction>(() => stage && ready(stage) ? 'complete' : 'intro');
  const [reactionToken, setReactionToken] = useState(0);
  const drag = useRef<{ id: string; x: number; y: number; pointerId: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const dropZone = useRef<HTMLDivElement>(null);
  const repair = session.repair?.stage === stage ? session.repair : undefined;
  const appliedRepair = !!repair && repairApplied(repair, session.preparation, session.moon.crew);
  const retestReady = appliedRepair && WORKSHOP_STAGES.every(id => ready(id));
  const [scienceFamily,setScienceFamily] = useState<ScienceFamily>('camera');
  const [shelfTab, setShelfTab] = useState<DesignCategory | 'depth' | null>(() => repair?.category ?? null);
  const [shelfPage, setShelfPage] = useState(0);
  const [shortScreen, setShortScreen] = useState(() => window.matchMedia('(max-height: 760px), (max-width: 700px)').matches);
  const [shelfOpen, setShelfOpen] = useState(true);
  const [stageMaximized, setStageMaximized] = useState(false);
  const toggleMaximize = () => {
    setStageMaximized(prev => {
      const next = !prev;
      if (next) setShelfOpen(false);
      else setShelfOpen(true);
      return next;
    });
  };
  const toggleShelf = () => {
    setShelfOpen(prev => {
      const next = !prev;
      if (next && stageMaximized) setStageMaximized(false);
      return next;
    });
  };
  const ids = installedIds(session.preparation);
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  const categories = stage ? STAGE_CATEGORIES[stage] : [];
  const parts = partsForObjective(objective).filter(part => categories.includes(part.category));
  const missing = parts.filter(part => !ids.includes(part.id));
  const multi = stage === 'lander-build' || stage === 'science-build' && !geology;
  useEffect(() => {
    const query = window.matchMedia('(max-height: 760px), (max-width: 700px)');
    const update = () => setShortScreen(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const activeCategory = shelfTab && shelfTab !== 'depth' && categories.includes(shelfTab) ? shelfTab : categories[0];
  const depthOpen = shelfTab === 'depth' && stage === 'science-build';
  const pageSize = shortScreen ? 1 : 2;
  useEffect(() => {
    if (!repair) return;
    const focusRepair = () => {
      setShelfTab(repair.category);
      const repairPart = partById(repair.partId);
      if (repairPart?.scienceFamily) setScienceFamily(repairPart.scienceFamily);
      const options = partsForObjective(objective).filter(part => part.category === repair.category && (!geology || repair.category !== 'science' || part.scienceFamily === repairPart?.scienceFamily));
      setShelfPage(repair.partId ? Math.floor(Math.max(0, options.findIndex(part => part.id === repair.partId)) / pageSize) : 0);
    };
    focusRepair();
    window.addEventListener('replay-game-help', focusRepair);
    return () => window.removeEventListener('replay-game-help', focusRepair);
  }, [repair, pageSize, objective, geology]);
  const categoryParts = parts.filter(part => part.category === activeCategory && (!geology || stage !== 'science-build' || part.scienceFamily === scienceFamily));
  const pageCount = Math.ceil(categoryParts.length / pageSize);
  const currentPage = Math.min(shelfPage, Math.max(0, pageCount - 1));
  const visibleParts = categoryParts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const nextAction = stage ? nextWorkshopAction(stage, session.preparation, activeCategory, currentPage, pageSize, depthOpen,objective,scienceFamily) : null;
  const nextDisabled = nextAction?.kind === 'install' || (nextAction?.kind === 'advance' && !!stage && !ready(stage));
  useEffect(() => {
    const cancel = () => { drag.current = null; setDragging(null); };
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); };
  }, []);
  const install = (selected: string[]) => {
    if (autoBuilding || !selected.length) return;
    dispatch({ type: 'install', ids: selected }); setLastInstalled(selected.at(-1)!); setMarked([]);
    sound.setMuted(!effects); sound.playSnap();
    const before = preparationTotals(session.preparation), after = preparationTotals(selected.reduce(installPart, session.preparation));
    setMessage(`${signed(after.credits - before.credits)} cr · ${signed(after.massKg - before.massKg)} kg · ${selected.length === 1 ? partById(selected[0])?.name : `${selected.length} parts`} installed!`);
    const updated = selected.reduce(installPart, session.preparation);
    const overBudget = preparationTotals(updated).credits > SCRIPT_RESOURCES.budgetCredits;
    const category = partById(selected.at(-1))?.category;
    const response: EngineerReaction = overBudget ? 'warning' : stage && ready(stage, updated) && !ready(stage) ? 'complete'
      : category === 'lander' ? 'lander' : category === 'rover' ? 'rover' : category === 'science' ? 'science'
      : category === 'solar' || category === 'battery' ? 'power' : 'survival';
    setReaction(response); setReactionToken(value => value + 1);
  };
  const next = () => {
    if (nextAction?.kind === 'shelf') { setShelfTab(nextAction.category); setShelfPage(nextAction.page); if(nextAction.family) setScienceFamily(nextAction.family); setMessage('Pick the next part!'); }
    else if (nextAction?.kind === 'depth') { setShelfTab('depth'); setShelfPage(0); setMessage('Choose a drill depth, then Next.'); }
    else if (nextAction?.kind === 'advance') { sound.setMuted(!effects); sound.playFanfare(); dispatch({ type: 'next' }); }
  };
  const back = () => {
    if (depthOpen) { setShelfTab(categories[0]); setShelfPage(Math.max(0, pageCount - 1)); }
    else if (currentPage > 0) setShelfPage(currentPage - 1);
    else if (categories.indexOf(activeCategory) > 0) { setShelfTab(categories[categories.indexOf(activeCategory) - 1]); setShelfPage(0); }
    else onBack();
  };
  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;
    drag.current = { id, x: event.clientX, y: event.clientY, pointerId: event.pointerId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true;
    if (active.moved) { suppressClick.current = true; setDragging({ id: active.id, x: event.clientX, y: event.clientY }); }
  };
  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const bounds = dropZone.current?.getBoundingClientRect();
    if (active.moved && bounds) {
      // Whole bay plus a forgiving outer margin: tiny hardware needs no precision hit.
      const inside = event.clientX >= bounds.left - 45 && event.clientX <= bounds.right + 65 && event.clientY >= bounds.top - 65 && event.clientY <= bounds.bottom + 65;
      if (inside) install([active.id]); else setMessage('Back on the shelf. Try again!');
    }
    drag.current = null; setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onPointerCancel = () => { suppressClick.current = true; drag.current = null; setDragging(null); };
  const scene = <div className={`workshop-drop-zone ${dragging || autoBuilding && autoPart ? 'is-dragging' : ''} ${stageMaximized ? 'is-maximized' : ''}`} ref={dropZone} data-testid="workshop-drop-zone">
    <div className="workshop-telemetry-pill-wrapper">
      <ManifestMeters session={session} />
    </div>
    {!shelfOpen ? (
      <button
        className="workshop-drawer-toggle"
        onClick={toggleShelf}
        aria-label="Open parts shelf"
        title="Open parts shelf"
      >
        <PanelLeftOpen size={18} />
        <span>Parts ({ids.length}/{parts.length})</span>
      </button>
    ) : null}
    <Suspense fallback={<div className="workshop-render-fallback">Opening the workshop…</div>}>
      <WorkshopViewport preparation={session.preparation} draggingId={dragging?.id ?? (autoBuilding ? autoPart : null)} lastInstalled={lastInstalled}
        canUndo={!autoBuilding && !!stage && !!session.past.length} canRedo={!autoBuilding && !!stage && !!session.future.length} onUndo={() => dispatch({ type: 'undo' })} onRedo={() => dispatch({ type: 'redo' })}
        onThumbnails={setThumbnails} onMeshError={() => setMeshError(true)}
        isMaximized={stageMaximized} onToggleMaximize={toggleMaximize} />
    </Suspense>
  </div>;
  if (session.progress.stepId === 'resource-limits') return <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={() => dispatch({ type: 'next' })} nextLabel="Build" progress={<span>WORKSHOP</span>} />}>
    <main className="conversation-main workshop-resource-main" id="story-content" tabIndex={-1}>
      <div className="conversation-stage"><CharacterStage cue={cue} active speaking={false} label="Commander" /></div>
      <section className="conversation-panel workshop-resources"><h1>Your mission kit</h1>
        <p>Build a lander. Pack a rover. Stay within your limits.</p>
        <div className="workshop-resource-cards"><div><Coins /><strong>1,000</strong><span><Term term="credits">credits</Term></span></div><div><Weight /><strong>350 kg</strong><span><Term term="payload">Payload</Term></span></div><div><Zap /><strong>450 W</strong><span><Term term="peak">Peak power</Term></span></div></div>

      </section>
    </main>
  </StoryShell>;
  if (!stage) return <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Checks soon" nextDisabled progress={<span>BUILT</span>} />}>
    <main className="workshop-main" id="story-content" tabIndex={-1}>
      <div className="workshop-heading"><div><span className="selection-eyebrow">WORKSHOP COMPLETE</span><h1>Built by you!</h1><p>Your design is saved. Mission checks come next.</p></div><PackageCheck size={48} /></div>
      <div className="workshop-layout workshop-summary-layout"><section className="workshop-shelf workshop-handoff"><ManifestMeters session={session} />
        <h2>Your explorer</h2><p>{ids.length} parts · {session.preparation.drillDepthCm} cm drill plan</p>
        <div className="workshop-edit-stages">{WORKSHOP_STAGES.map((id, index) => <button key={id} onClick={() => dispatch({ type: 'visit-stage', stage: id })}><Check size={18} />{stageNames[index]}<span>Edit</span></button>)}</div>
        <small>Mission checks and rocket packing are coming soon.</small>
      </section>{scene}</div>
    </main>
  </StoryShell>;
  return <StoryShell {...frame} controls={<StoryControls onBack={autoBuilding ? onStopAutoBuild : repair ? onBack : back} onNext={retestReady ? () => dispatch({ type: 'repair-recheck' }) : next} hintDisabled={autoBuilding} nextDisabled={autoBuilding || !!repair && !appliedRepair || !retestReady && nextDisabled}
    nextHint={autoBuilding ? `${ids.length}/${autoIds.length} parts` : nextAction?.kind === 'install' ? `Install ${nextAction.remaining} ${nextAction.remaining === 1 ? 'part' : 'parts'}` : undefined} nextLabel={repair ? 'Retest mission' : autoBuilding ? 'Auto-building…' : nextAction?.kind === 'install' ? 'Next' : nextAction?.kind === 'shelf' ? `Next: ${nextAction.category === activeCategory ? 'parts' : categoryNames[nextAction.category]}` : nextAction?.kind === 'depth' ? 'Next: drill plan' : stage === 'survival-build' ? 'Choose crew' : 'Next stage'} progress={<span>Build · {stageIndex + 1}/5</span>} />}>
    <main className={`workshop-main ${geology && stage === 'science-build' ? 'is-geology' : ''} ${autoBuilding ? 'is-auto-building' : ''} ${repair && !appliedRepair ? 'is-repairing' : ''}`} id="story-content" tabIndex={-1} aria-labelledby="workshop-title" aria-busy={autoBuilding}>
      <div className="workshop-top-row"><div className="workshop-heading"><div><span className="selection-eyebrow">MISSION WORKSHOP</span><h1 id="workshop-title">{headings[stage]}</h1><p>{stage === 'science-build' && geology ? 'Pick a camera, rock scanner and sample tool.' : instructions[stage]}</p></div>
        <button className="workshop-quick" onClick={() => autoBuilding ? onStopAutoBuild() : setQuickConfirm(true)}><WandSparkles size={18} />{autoBuilding ? 'Stop auto build' : 'Auto build'}</button>
      </div><EngineerCompanion scriptedReply={repair && !appliedRepair ? { id: repair.voiceId, text: repair.text } : undefined} statusText={autoBuilding ? `Watch your ${stageNames[stageIndex].toLowerCase()} system come together!` : undefined} reaction={repair && !appliedRepair ? 'warning' : autoBuilding || reaction === 'complete' && !ready(stage) ? 'intro' : reaction} token={reactionToken} voiceEnabled={!autoBuilding && (frame.voiceEnabled ?? true)} /></div>
      <nav className="workshop-stage-tabs" inert={autoBuilding} aria-label="Build stages">{WORKSHOP_STAGES.map((id, index) => <button key={id} aria-current={id === stage ? 'step' : undefined} disabled={index > stageIndex}
        onClick={() => dispatch({ type: 'visit-stage', stage: id })}><span>{ready(id) ? <Check size={14} /> : index + 1}</span>{stageNames[index]}</button>)}</nav>
      <div className={`workshop-layout ${stageMaximized ? 'is-stage-maximized' : ''} ${!shelfOpen ? 'is-shelf-collapsed' : ''}`} inert={autoBuilding}><section className={`workshop-shelf ${!shelfOpen ? 'is-collapsed' : ''}`} aria-label="Parts shelf">
        <div className="workshop-shelf-header">
          <span className="workshop-shelf-title">PARTS INVENTORY</span>
          <button className="workshop-shelf-close" onClick={toggleShelf} aria-label="Collapse parts shelf" title="Collapse parts shelf">
            <PanelLeftClose size={18} />
          </button>
        </div>
        {geology && stage === 'science-build' ? <label className="geology-compact-family"><span className="visually-hidden">Science tool family</span><select aria-label="Science tool family" value={depthOpen ? 'depth' : scienceFamily} onChange={event => { if(event.target.value === 'depth') setShelfTab('depth'); else { setScienceFamily(event.target.value as ScienceFamily); setShelfTab('science'); } setShelfPage(0); }}>{GEOLOGY_FAMILIES.map(family => <option value={family} key={family}>{SCIENCE_FAMILY_NAMES[family]}{parts.some(part => ids.includes(part.id) && part.scienceFamily === family) ? ' ✓' : ''}</option>)}{drill ? <option value="depth">Drill plan</option> : null}</select></label> : null}
        {geology && stage === 'science-build' ? <nav className="geology-families" aria-label="Geology tool families">{GEOLOGY_FAMILIES.map(family => <button key={family} aria-pressed={scienceFamily === family && !depthOpen} onClick={() => { setScienceFamily(family); setShelfTab('science'); setShelfPage(0); }}>{SCIENCE_FAMILY_NAMES[family]}{ids.some(id => partById(id)?.scienceFamily === family) ? <Check size={12}/> : null}</button>)}</nav> : null}
        <nav className="workshop-category-tabs" aria-label="Equipment categories">{categories.map(category => <button key={category} aria-pressed={!depthOpen && activeCategory === category} onClick={() => { setShelfTab(category); setShelfPage(0); }}>{categoryNames[category]}</button>)}{stage === 'science-build' && (!geology || !!drill) ? <button aria-pressed={depthOpen} onClick={() => { setShelfTab('depth'); setShelfPage(0); }}>Drill plan</button> : null}</nav>
        <div className={`workshop-shelf-pages ${depthOpen ? 'is-depth-page' : ''}`}>
          {repair?.action === 'depth' && !appliedRepair ? <p className="repair-shelf-note">{repair.label}</p> : null}
          {multi && !depthOpen ? <div className="workshop-bulk"><label><input type="checkbox" aria-label="Select all shelf parts" checked={!!missing.length && missing.every(p => marked.includes(p.id))}
            onChange={event => setMarked(event.target.checked ? missing.map(p => p.id) : [])} disabled={!missing.length} />Select all</label>
            <button disabled={!marked.length} onClick={() => install(marked)}><CheckCheck size={17} />Add {marked.length || 'selected'}</button></div> : null}
          {!depthOpen ? <section className="workshop-category" aria-label={categoryNames[activeCategory]}>
            <div className="workshop-part-grid">{visibleParts.map(part => {
              const installed = ids.includes(part.id);
              const comparison = comparePart(session.preparation, part.id, session.progress.selections.site === 'permanent-shadow');
              return <article key={part.id} className={`workshop-part ${installed ? 'is-installed' : ''} ${installed && lastInstalled === part.id ? 'was-installed' : ''} ${repair?.partId === part.id && !appliedRepair ? `is-repair-target ${repair.action === 'remove' ? 'is-remove-target' : ''}` : ''}`} data-part-id={part.id}>
                <span className="part-badge">{repair?.partId === part.id && !appliedRepair ? repair.action === 'remove' ? 'Remove this' : 'Pick this' : part.mandatory ? "Required" : multi ? "Optional" : "Choose one"}</span>
                <div className="workshop-part-top">{multi && !installed ? <input type="checkbox" aria-label={`Mark ${part.name}`} checked={marked.includes(part.id)}
                  onChange={event => setMarked(current => event.target.checked ? [...current, part.id] : current.filter(id => id !== part.id))} /> : <span>{installed ? <Check size={16} /> : <Plus size={16} />}</span>}
                  <button className="workshop-info" aria-label={`Details for ${part.name}`} onClick={() => setInfoId(part.id)}><Info size={17} /></button></div>
                <button className="workshop-pick" disabled={installed} aria-label={`${comparison.replaces ? "Replace with" : "Install"} ${part.name}`} onPointerDown={event => onPointerDown(event, part.id)} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel} onLostPointerCapture={() => { if (drag.current?.id === part.id) onPointerCancel(); }}
                  onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } install([part.id]); }}>
                  {thumbnails[part.id] ? <img draggable={false} src={thumbnails[part.id]} alt="" /> : <div className="workshop-part-placeholder"><PackageCheck size={38} /></div>}
                  <strong>{part.id === 'nss' ? 'NSS · Ice clues' : part.id === 'nirvss' ? 'NIRVSS · Soil scan' : part.id === 'trident' ? 'TRIDENT · Drill' : part.name}</strong><span className="workshop-part-price">{part.credits} cr · {part.massKg} kg{part.objective === 'lunar-geology' ? ` · ${part.nominalPowerW} W` : ''}</span>
                  {part.category === 'rover' ? <span className="workshop-part-spec">{part.nominalPowerW} W · {'★'.repeat(part.terrainStars ?? 0)}</span> : null}
                  {part.outputW ? <span className="workshop-part-spec">{part.outputW} W sunlight</span> : null}
                  {part.capacityWh ? <span className="workshop-part-spec">{part.capacityWh} Wh</span> : null}{part.capability ? <span className="workshop-part-spec">{part.capability}</span> : null}
                  <span className="workshop-part-action">{installed ? '✓ Installed' : comparison.replaces ? 'Replace' : 'Install'}</span>
                </button>
                {!installed && !multi && (!geology || !!comparison.replaces) ? <div className="part-comparison">{comparison.replaces ? <><span title={comparison.replaces}>Swap {geology ? 'installed tier' : comparison.replaces}</span><strong>{signed(comparison.credits)} cr · {signed(comparison.massKg)} kg</strong></> : null}{!geology ? <span>{part.category === 'rover' && comparison.replaces ? `${signed(comparison.peakW)} W peak · ` : ''}{optionBenefit(part.id, comparison.shadowMinutes)}</span> : null}</div> : null}
                {installed ? <button className="part-remove" aria-label={`Remove ${part.name}`} onClick={() => { dispatch({ type: 'remove', id: part.id }); setMessage(`${part.name} returned to shelf`); setReaction('intro'); }}><Trash2 size={16}/>Remove</button> : null}
              </article>;
            })}</div></section> : null}
          {!depthOpen ? <nav className="workshop-part-pages" aria-label="Parts pages"><button className="conversation-icon" aria-label="Previous parts page" disabled={currentPage === 0} onClick={() => setShelfPage(currentPage - 1)}><ChevronLeft size={20} /></button><span>{currentPage + 1} / {pageCount}</span><button className="conversation-icon" aria-label="Next parts page" disabled={currentPage === pageCount - 1} onClick={() => setShelfPage(currentPage + 1)}><ChevronRight size={20} /></button></nav> : null}
          {depthOpen && !!drill ? <div className={`workshop-depth ${repair?.action === 'depth' && !appliedRepair ? 'is-repair-target' : ''}`}>
            <label htmlFor="drill-depth"><Term term="drill">Drill depth</Term> <strong>{session.preparation.drillDepthCm} cm</strong></label>
            <input id="drill-depth" type="range" min={10} max={drill?.maxDepthCm ?? 100} step={10} value={session.preparation.drillDepthCm ?? 20} onChange={event => dispatch({ type: 'depth', cm: Number(event.target.value) })}
              onPointerUp={() => { setReaction('depth'); setReactionToken(value => value + 1); }} onKeyUp={event => { if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') { setReaction('depth'); setReactionToken(value => value + 1); } }} />
            <div><span>10 cm</span><span>{drill?.maxDepthCm ?? 100} cm</span></div><p>{geology ? `Limit ${drill.maxDepthCm} cm` : `Potential +${drillPotential(session.preparation.drillDepthCm)}`} · {totals.drillRisk.toLowerCase()} risk</p><p role="status"><strong>{totals.drillEnergyWh} <Term term="wh">Wh</Term> needed</strong> · {totals.drillMinutes} min</p>
          </div> : depthOpen ? <p className="workshop-depth-empty">Install a drill first, then choose your drill depth.</p> : null}
        </div>
        <div className="workshop-feedback" role="status" aria-live="polite">{repair ? appliedRepair ? 'Part changed! Retest mission.' : repair.action === 'depth' ? repair.label : repair.action === 'remove' ? 'Remove the yellow part.' : 'Pick the yellow part.' : nextAction?.kind === 'install' ? `Install ${nextAction.remaining === 1 ? 'a part' : `${nextAction.remaining} parts`}, then Next.` : nextAction?.kind === 'depth' ? 'Tools ready! Next: drill depth.' : nextAction?.kind === 'shelf' && !multi && !categoryParts.some(part => ids.includes(part.id)) ? 'Pick a part, or Next for more.' : message || 'Ready! Choose Next.'}</div>
      </section><section className="workshop-view-column" aria-label="Spacecraft assembly">
        {scene}
        {!autoBuilding && !repair && (totals.credits > 1000 || totals.massKg > 350 || totals.peakW > 450) ? <RepairAlert session={session} dispatch={dispatch} problem={totals.massKg > 350 ? 'mass' : totals.peakW > 450 ? 'peak' : 'budget'}/> : null}
        {autoBuilding ? <div className="auto-build-status" role="status"><WandSparkles size={19}/>Auto build <strong>{ids.length}/{autoIds.length}</strong><progress max={autoIds.length} value={ids.length}/></div> : null}
        <div className="workshop-live-strip"><span><Check size={17} />{ids.length} installed</span><span><Sparkles size={17} />Potential +{totals.potentialScience}</span></div>
        {geology && stage === 'science-build' ? <div className={`geology-science-mass ${totals.scienceMassKg > 100 ? 'is-over' : ''}`} role="status">Science kit: <strong>{totals.scienceMassKg} / 100 kg</strong><span>Part of your 350 kg allowance</span></div> : null}
        {(stage === 'power-build' || stage === 'survival-build') ? <div className="workshop-power-strip"><span><Sun size={20} />{totals.solarW} W solar</span><span><BatteryCharging size={20} />{totals.batteryWh} <Term term="wh">Wh</Term></span><span>{totals.peakW} <Term term="peak">W peak</Term></span>

        </div> : null}
        {meshError ? <small className="workshop-model-note">3D could not start. Every part still has a working Install button.</small> : null}
      </section></div>
      {dragging ? <div className="workshop-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">{thumbnails[dragging.id] ? <img src={thumbnails[dragging.id]} alt="" /> : <PackageCheck />}</div> : null}
      <span className="visually-hidden" role="status">{message}</span>
    </main>
    {autoBuilding && stage ? <AutoBuildStage stage={stage} preparation={session.preparation} shadow={session.progress.selections.site === 'permanent-shadow'} objective={objective} thumbnails={thumbnails} dispatch={dispatch}
      onFocus={id => { setAutoPart(id); const part = partById(id)!; setShelfTab(part.category); if(part.scienceFamily) setScienceFamily(part.scienceFamily); setShelfPage(Math.floor(partsForObjective(objective).filter(p => p.category === part.category && (!geology || part.category !== 'science' || p.scienceFamily === part.scienceFamily)).findIndex(p => p.id === id) / pageSize)); }}
      onDepthPreview={() => { setAutoPart(null); setShelfTab('depth'); }} onInstalled={id => { setAutoPart(null); setLastInstalled(id); setMessage(`${partById(id)?.name} installed!`); }} onDone={onStopAutoBuild}/> : null}
    {infoId ? <PartDetails part={partById(infoId)!} installed={ids.includes(infoId)} onClose={() => setInfoId(null)} onRemove={() => { dispatch({ type: 'remove', id: infoId }); setInfoId(null); setMessage('Part returned to the shelf.'); }} /> : null}
    {quickConfirm ? <QuickBuildDialog onClose={() => setQuickConfirm(false)} onConfirm={() => { sound.setMuted(!effects); sound.playClick(); setQuickConfirm(false); onAutoBuild(); }} /> : null}
  </StoryShell>;
}
function PartDetails({ part, installed, onClose, onRemove }: { part: WorkshopPart; installed: boolean; onClose(): void; onRemove(): void }) {
  return <GameInfo title={part.name} onClose={onClose} pages={[
    <div key="overview"><div className="learning-part-intro"><span aria-hidden="true">{PART_TERMS[part.id] ? GLOSSARY[PART_TERMS[part.id]].icon : '🔬'}</span><p>{PART_TERMS[part.id] ? GLOSSARY[PART_TERMS[part.id]].text : part.description}</p>{PART_TERMS[part.id] ? <p className="learning-example">{GLOSSARY[PART_TERMS[part.id]].example}</p> : <p className="learning-example">{part.capability}. Successful use earns science; buying it does not.</p>}</div></div>,
    <div key="specs"><dl><div><dt>Cost</dt><dd>{part.credits} credits</dd></div><div><dt><Term term="mass">Mass</Term></dt><dd>{part.massKg} kg</dd></div><div><dt><Term term="power">Power</Term></dt><dd>{part.nominalPowerW} W{part.peakPowerW ? ` / ${part.peakPowerW} W peak` : ''}</dd></div>
      {part.outputW ? <div><dt>Sunlight output</dt><dd>{part.outputW} W · 0 W in shadow</dd></div> : null}{part.capacityWh ? <div><dt><Term term="energy">Stored energy</Term></dt><dd>{part.capacityWh} Wh</dd></div> : null}</dl>
      {installed ? <button className="workshop-remove" onClick={onRemove}>Remove part</button> : null}</div>,
    <div key="notes"><p>{part.description}</p><p>These prices and numbers are game values.</p>{part.safetyBonus ? <p>Game safety bonus: +{part.safetyBonus}</p> : null}{part.assumption ? <p>{part.assumption}</p> : null}{part.source ? <a href={part.source} target="_blank" rel="noreferrer">NASA: learn about the real system ↗</a> : null}</div>
  ]} />;
}
function QuickBuildDialog({ onClose, onConfirm }: { onClose(): void; onConfirm(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const target = dialog.current; target?.showModal(); return () => target?.close(); }, []);
  return <dialog className="workshop-dialog" ref={dialog} onCancel={onClose} onClose={event => { if (!event.currentTarget.open) onClose(); }} aria-labelledby="quick-build-title">
    <span className="selection-eyebrow">QUICK PREVIEW</span><h2 id="quick-build-title">Auto-build this explorer?</h2><p>Watch all five stages in about 12 seconds. Replaces your parts; you can edit afterward.</p>
    <div className="workshop-dialog-actions"><button onClick={onClose} autoFocus>Keep building</button><button className="conversation-next" onClick={onConfirm}>Auto-build</button></div>
  </dialog>;
}
