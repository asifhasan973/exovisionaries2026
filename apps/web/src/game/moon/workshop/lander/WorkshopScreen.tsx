import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BatteryCharging, Check, Coins, PackageCheck, Sparkles, Sun, WandSparkles, Weight, Zap } from 'lucide-react';
import { sound } from '@exo/audio';
import { RepairAlert } from '@/game/moon/hazards/RepairAlert';
import { repairApplied } from '@/game/moon/hazards/repairGuidance';
import '@/game/moon/hazards/repair.css';
import { useGameSettings } from '@/shared/shell';
import { CharacterStage } from '@/game/moon/narrative/components/CharacterStage';
import { StoryControls, StoryShell } from '@/shared/shell/StoryShell';
import { SCRIPT_RESOURCES } from '@/game/moon/core/design';
import { installedIds, installPart, partById, preparationTotals, stageReady, STAGE_CATEGORIES, WORKSHOP_STAGES, partsForObjective, selectedDrill } from '@/game/moon/core/preparation';
import { geologyBudget } from '@/game/moon/science/geologyBudget';
import type { ScienceFamily } from '@/game/moon/science/geology';
import '@/game/moon/readiness/preparation.css';
import { EngineerCompanion } from '@/game/moon/narrative/components/EngineerCompanion';
import type { EngineerReaction } from '@/game/moon/narrative/components/EngineerCompanion';
import type { WorkshopStage } from '@/game/moon/core/preparation';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import type { MissionEvent, WorkshopSession } from './workshopSession';
import type { DesignCategory } from '@/game/moon/core/design';
import './workshop.css';
import { Term } from '@/game/moon/core/learning/Learning';
import { signed } from '@/game/moon/core/partComparison';
import { AutoBuildStage } from '../rocket/AutoBuildStage';
import { autoBuildParts } from '../rocket/autoBuildPlan';
import { nextWorkshopAction, WORKSHOP_HEADINGS, CATEGORY_NAMES } from './workshopNavigation';
import { ManifestMeters, PartDetails, QuickBuildDialog, WorkshopInventoryDrawer } from './components';
import { useWorkshopDrag } from './useWorkshopDrag';

const WorkshopViewport = lazy(() => import('./WorkshopViewport').then(module => ({ default: module.WorkshopViewport })));
const stageNames = ['Lander', 'Rover', 'Science', 'Power', 'Survival'];
const cue = { character: 'commander', expression: 'confident', pose: 'point' } as const;

export function WorkshopScreen({
  session, dispatch, frame, onBack, autoBuilding, onAutoBuild, onStopAutoBuild,
}: {
  session: WorkshopSession; dispatch(event: MissionEvent): void; frame: SelectionFrame;
  onBack(): void; autoBuilding: boolean; onAutoBuild(): void; onStopAutoBuild(): void;
}) {
  const { effects } = useGameSettings();
  const objective = session.progress.selections.objective ?? 'lunar-ice';
  const geology = objective === 'lunar-geology';
  const ready = (id: WorkshopStage, preparation = session.preparation) => stageReady(id, preparation, objective);
  const drill = selectedDrill(session.preparation);
  const autoIds = autoBuildParts(session.progress.selections.site === 'permanent-shadow', objective);
  const stage = WORKSHOP_STAGES.find(id => id === session.progress.stepId);
  const stageIndex = stage ? WORKSHOP_STAGES.indexOf(stage) : -1;
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [infoId, setInfoId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [lastInstalled, setLastInstalled] = useState<string | null>(null);
  const [autoPart, setAutoPart] = useState<string | null>(null);
  const [quickConfirm, setQuickConfirm] = useState(false);
  const [meshError, setMeshError] = useState(false);
  const [reaction, setReaction] = useState<EngineerReaction>(() => stage && ready(stage) ? 'complete' : 'intro');
  const [reactionToken, setReactionToken] = useState(0);
  const drawerRef = useRef<HTMLElement>(null);
  const repair = session.repair?.stage === stage ? session.repair : undefined;
  const appliedRepair = !!repair && repairApplied(repair, session.preparation, session.moon.crew, objective, session.moon.plan);
  const retestReady = appliedRepair && WORKSHOP_STAGES.every(id => ready(id));
  const [scienceFamily, setScienceFamily] = useState<ScienceFamily>('camera');
  const [shelfTab, setShelfTab] = useState<DesignCategory | 'depth' | null>(() => repair?.category ?? null);
  const [shelfPage, setShelfPage] = useState(0);
  const [shelfOpen, setShelfOpen] = useState(true);
  const toggleShelf = () => setShelfOpen(prev => !prev);
  const ids = installedIds(session.preparation);
  const totals = preparationTotals(session.preparation, session.progress.selections.site === 'permanent-shadow');
  const missionBudget = geology ? geologyBudget(session.preparation, session.moon.crew, session.moon.plan) : null;
  const budgetSpent = missionBudget?.spent ?? totals.credits;
  const budgetLimit = missionBudget?.cap ?? SCRIPT_RESOURCES.budgetCredits;
  const categories = stage ? STAGE_CATEGORIES[stage] : [];
  const parts = partsForObjective(objective).filter(part => categories.includes(part.category));
  const multi = stage === 'lander-build' || stage === 'science-build' && !geology;
  const activeCategory = shelfTab && shelfTab !== 'depth' && categories.includes(shelfTab) ? shelfTab : categories[0];
  const depthOpen = shelfTab === 'depth' && stage === 'science-build';
  const pageSize = Math.max(1, parts.filter(part => part.category === activeCategory && (!geology || stage !== 'science-build' || part.scienceFamily === scienceFamily)).length);

  const install = (selected: string[]) => {
    if (autoBuilding || !selected.length) return;
    dispatch({ type: 'install', ids: selected }); setLastInstalled(selected.at(-1)!);
    sound.setMuted(!effects); sound.playSnap();
    const before = preparationTotals(session.preparation), after = preparationTotals(selected.reduce(installPart, session.preparation));
    const creditChange = geology ? geologyBudget(selected.reduce(installPart, session.preparation), session.moon.crew, session.moon.plan).spent - geologyBudget(session.preparation, session.moon.crew, session.moon.plan).spent : after.credits - before.credits;
    setMessage(`${signed(creditChange)} ${geology ? 'MC' : 'cr'} · ${signed(after.massKg - before.massKg)} kg · ${selected.length === 1 ? partById(selected[0])?.name : `${selected.length} parts`} installed!`);
    const updated = selected.reduce(installPart, session.preparation);
    const overBudget = geology ? geologyBudget(updated, session.moon.crew, session.moon.plan).remaining < 0 : preparationTotals(updated).credits > SCRIPT_RESOURCES.budgetCredits;
    const category = partById(selected.at(-1))?.category;
    const response: EngineerReaction = overBudget ? 'warning' : stage && ready(stage, updated) && !ready(stage) ? 'complete'
      : category === 'lander' ? 'lander' : category === 'rover' ? 'rover' : category === 'science' ? 'science'
      : category === 'solar' || category === 'battery' ? 'power' : 'survival';
    setReaction(response); setReactionToken(value => value + 1);
  };

  const {
    dropZone, dragging, drag, suppressClick,
    onPointerDown, onPointerMove, onPointerUp, onPointerCancel,
  } = useWorkshopDrag({
    effects,
    onInstall: id => install([id]),
    onMiss: () => setMessage('Back on the shelf. Try again!'),
  });

  useEffect(() => {
    if (!repair) return;
    const focusRepair = () => {
      setShelfOpen(true);
      setShelfTab(repair.action === 'depth' ? 'depth' : repair.category);
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
  const nextAction = stage ? nextWorkshopAction(stage, session.preparation, activeCategory, currentPage, pageSize, depthOpen, objective, scienceFamily) : null;
  const nextDisabled = nextAction?.kind === 'install' || (nextAction?.kind === 'advance' && !!stage && !ready(stage));

  useEffect(() => {
    if (!shelfOpen || !repair || appliedRepair) return;
    const animFrame = requestAnimationFrame(() => {
      drawerRef.current?.querySelector('.is-repair-target')?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(animFrame);
  }, [shelfOpen, repair, appliedRepair, shelfTab, scienceFamily]);

  const next = () => {
    if (nextAction?.kind === 'shelf') { setShelfTab(nextAction.category); setShelfPage(nextAction.page); if (nextAction.family) setScienceFamily(nextAction.family); setMessage('Pick the next part!'); }
    else if (nextAction?.kind === 'depth') { setShelfTab('depth'); setShelfPage(0); setMessage('Choose a drill depth, then Next.'); }
    else if (nextAction?.kind === 'advance') { sound.setMuted(!effects); sound.playFanfare(); dispatch({ type: 'next' }); }
  };

  const back = () => {
    if (depthOpen) { setShelfTab(categories[0]); setShelfPage(Math.max(0, pageCount - 1)); }
    else if (currentPage > 0) setShelfPage(currentPage - 1);
    else if (categories.indexOf(activeCategory) > 0) { setShelfTab(categories[categories.indexOf(activeCategory) - 1]); setShelfPage(0); }
    else onBack();
  };

  const scene = (
    <div className={`workshop-drop-zone ${dragging || autoBuilding && autoPart ? 'is-dragging' : ''}`} ref={dropZone} data-testid="workshop-drop-zone">
      <Suspense fallback={<div className="workshop-render-fallback">Opening the workshop…</div>}>
        <WorkshopViewport preparation={session.preparation} draggingId={dragging?.id ?? (autoBuilding ? autoPart : null)} lastInstalled={lastInstalled}
          canUndo={!autoBuilding && !!stage && !!session.past.length} canRedo={!autoBuilding && !!stage && !!session.future.length} onUndo={() => dispatch({ type: 'undo' })} onRedo={() => dispatch({ type: 'redo' })}
          onThumbnails={setThumbnails} onMeshError={() => setMeshError(true)} />
      </Suspense>
    </div>
  );

  if (session.progress.stepId === 'resource-limits') {
    return (
      <StoryShell {...frame} controls={<StoryControls onBack={onBack} onNext={() => dispatch({ type: 'next' })} nextLabel="Build" progress={<span>WORKSHOP</span>} />}>
        <main className="conversation-main workshop-resource-main" id="story-content" tabIndex={-1}>
          <div className="conversation-stage"><CharacterStage cue={cue} active speaking={false} label="Commander" /></div>
          <section className="conversation-panel workshop-resources">
            <h1>Your mission kit</h1>
            <p>Build a lander. Pack a rover. Stay within your limits.</p>
            <div className="workshop-resource-cards">
              <div><Coins /><strong>{geology ? '10,000 MC' : '1,000'}</strong><span>{geology ? 'Whole mission' : 'Equipment credits'}</span></div>
              <div><Weight /><strong>350 kg</strong><span><Term term="payload">Payload</Term></span></div>
              <div><Zap /><strong>450 W</strong><span><Term term="peak">Peak power</Term></span></div>
            </div>
          </section>
        </main>
      </StoryShell>
    );
  }

  if (!stage) {
    return (
      <StoryShell {...frame} controls={<StoryControls onBack={onBack} nextLabel="Checks soon" nextDisabled progress={<span>BUILT</span>} />}>
        <main className="workshop-main" id="story-content" tabIndex={-1}>
          <div className="workshop-heading"><div><span className="selection-eyebrow">WORKSHOP COMPLETE</span><h1>Built by you!</h1><p>Your design is saved. Mission checks come next.</p></div><PackageCheck size={48} /></div>
          <div className="workshop-layout workshop-summary-layout">
            <section className="workshop-shelf workshop-handoff"><ManifestMeters session={session} />
              <h2>Your explorer</h2><p>{ids.length} parts · {session.preparation.drillDepthCm} cm drill plan</p>
              <div className="workshop-edit-stages">{WORKSHOP_STAGES.map((id, index) => <button key={id} onClick={() => dispatch({ type: 'visit-stage', stage: id })}><Check size={18} />{stageNames[index]}<span>Edit</span></button>)}</div>
              <small>Mission checks and rocket packing are coming soon.</small>
            </section>
            {scene}
          </div>
        </main>
      </StoryShell>
    );
  }

  const nextLabel = repair ? 'Retest mission' : autoBuilding ? 'Auto-building…' : nextAction?.kind === 'install' ? 'Next' : nextAction?.kind === 'shelf' ? `Next: ${nextAction.category === activeCategory ? 'parts' : (CATEGORY_NAMES as Record<string, string>)[nextAction.category]}` : nextAction?.kind === 'depth' ? 'Next: drill plan' : stage === 'survival-build' ? 'Choose crew' : 'Next stage';

  return (
    <StoryShell {...frame} controls={<StoryControls keepProgress onBack={autoBuilding ? onStopAutoBuild : repair ? onBack : back} onNext={retestReady ? () => dispatch({ type: 'repair-recheck' }) : next} hintDisabled={autoBuilding} nextDisabled={autoBuilding || !!repair && !appliedRepair || !retestReady && nextDisabled}
      nextHint={autoBuilding ? `${ids.length}/${autoIds.length} parts` : nextAction?.kind === 'install' ? `Install ${nextAction.remaining} ${nextAction.remaining === 1 ? 'part' : 'parts'}` : undefined} nextLabel={nextLabel}
      progress={<div className="workshop-footer-communicator"><EngineerCompanion scriptedReply={repair && !appliedRepair ? { id: repair.voiceId, text: repair.text } : undefined} statusText={autoBuilding ? `Watch your ${stageNames[stageIndex].toLowerCase()} system come together!` : undefined} reaction={repair && !appliedRepair ? 'warning' : autoBuilding || reaction === 'complete' && !ready(stage) ? 'intro' : reaction} token={reactionToken} voiceEnabled={!autoBuilding && (frame.voiceEnabled ?? true)} /></div>} />}>
      <main className={`workshop-main ${geology && stage === 'science-build' ? 'is-geology' : ''} ${autoBuilding ? 'is-auto-building' : ''} ${repair && !appliedRepair ? 'is-repairing' : ''}`} id="story-content" tabIndex={-1} aria-labelledby="workshop-title" aria-busy={autoBuilding}>
        <header className="workshop-header-area">
          <div className="workshop-top-header"><h1 id="workshop-title">{WORKSHOP_HEADINGS[stage]}</h1><button className="workshop-quick" onClick={() => autoBuilding ? onStopAutoBuild() : setQuickConfirm(true)}><WandSparkles size={16} />{autoBuilding ? 'Stop' : 'Auto build'}</button></div>
          <div className="workshop-stage-row">
            <button className={`workshop-drawer-toggle ${shelfOpen ? 'is-open' : ''}`} onClick={toggleShelf} aria-label={shelfOpen ? 'Close inventory drawer' : 'Open inventory drawer'} title={shelfOpen ? 'Close inventory drawer' : 'Open inventory drawer'}>
              <span>Inventory ({parts.filter(part => ids.includes(part.id)).length}/{parts.length})</span>
            </button>
            <div className="workshop-top-meters"><ManifestMeters session={session} /></div>
          </div>
        </header>

        <div className={`workshop-layout ${!shelfOpen ? 'is-shelf-collapsed' : ''}`} inert={autoBuilding ? true : undefined}>
          <WorkshopInventoryDrawer
            drawerRef={drawerRef} shelfOpen={shelfOpen} toggleShelf={toggleShelf} dragging={Boolean(dragging)}
            geology={geology} stage={stage} depthOpen={depthOpen} scienceFamily={scienceFamily} setScienceFamily={setScienceFamily}
            setShelfTab={setShelfTab} setShelfPage={setShelfPage} drill={drill ?? null} parts={parts} ids={ids} categories={categories}
            activeCategory={activeCategory} repair={repair} appliedRepair={appliedRepair} categoryParts={categoryParts} session={session}
            lastInstalled={lastInstalled} multi={multi} thumbnails={thumbnails} meshError={meshError} onPointerDown={onPointerDown}
            onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} dragRef={drag} suppressClickRef={suppressClick}
            install={install} dispatch={dispatch} setMessage={setMessage} setReaction={setReaction} setReactionToken={setReactionToken}
            setInfoId={setInfoId} missionBudget={missionBudget} totals={totals} nextAction={nextAction} message={message}
          />
          <section className="workshop-view-column" aria-label="Spacecraft assembly">
            {scene}
            {!autoBuilding && !repair && (budgetSpent > budgetLimit || totals.massKg > 350 || totals.peakW > 450) ? (
              <RepairAlert session={session} dispatch={dispatch} problem={totals.massKg > 350 ? 'mass' : totals.peakW > 450 ? 'peak' : 'budget'} />
            ) : null}
            {autoBuilding ? <div className="auto-build-status" role="status"><WandSparkles size={19} />Auto build <strong>{ids.length}/{autoIds.length}</strong><progress max={autoIds.length} value={ids.length} /></div> : null}
            <div className="workshop-live-strip"><span><Check size={17} />{ids.length} installed</span><span><Sparkles size={17} />Potential +{totals.potentialScience}</span></div>
            {geology && stage === 'science-build' ? <div className={`geology-science-mass ${totals.scienceMassKg > 100 ? 'is-over' : ''}`} role="status">Science kit: <strong>{totals.scienceMassKg} / 100 kg</strong><span>Part of the Moon payload</span></div> : null}
            {(stage === 'power-build' || stage === 'survival-build') ? <div className="workshop-power-strip"><span><Sun size={20} />{totals.solarW} W solar</span><span><BatteryCharging size={20} />{totals.batteryWh} <Term term="wh">Wh</Term></span><span>{totals.peakW} <Term term="peak">W peak</Term></span></div> : null}
            {meshError ? <small className="workshop-model-note">3D could not start. Every part still has a working Install button.</small> : null}
          </section>
        </div>
        {dragging ? <div className="workshop-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true">{thumbnails[dragging.id] ? <img src={thumbnails[dragging.id]} alt="" /> : <PackageCheck />}</div> : null}
        <span className="visually-hidden" role="status">{message}</span>
      </main>
      {autoBuilding && stage ? <AutoBuildStage stage={stage} preparation={session.preparation} shadow={session.progress.selections.site === 'permanent-shadow'} objective={objective} thumbnails={thumbnails} dispatch={dispatch}
        onFocus={id => { setAutoPart(id); const part = partById(id)!; setShelfTab(part.category); if (part.scienceFamily) setScienceFamily(part.scienceFamily); setShelfPage(Math.floor(partsForObjective(objective).filter(p => p.category === part.category && (!geology || part.category !== 'science' || p.scienceFamily === part.scienceFamily)).findIndex(p => p.id === id) / pageSize)); }}
        onDepthPreview={() => { setAutoPart(null); setShelfTab('depth'); }} onInstalled={id => { setAutoPart(null); setLastInstalled(id); setMessage(`${partById(id)?.name} installed!`); }} onDone={onStopAutoBuild} /> : null}
      {infoId ? <PartDetails part={partById(infoId)!} installed={ids.includes(infoId)} onClose={() => setInfoId(null)} onRemove={() => { dispatch({ type: 'remove', id: infoId }); setInfoId(null); setMessage('Part returned to the shelf.'); }} /> : null}
      {quickConfirm ? <QuickBuildDialog onClose={() => setQuickConfirm(false)} onConfirm={() => { sound.setMuted(!effects); sound.playClick(); setQuickConfirm(false); onAutoBuild(); }} /> : null}
    </StoryShell>
  );
}
