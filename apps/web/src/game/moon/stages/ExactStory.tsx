import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { StoryStepId } from '@/game/moon/core/types';
import { PlayerCharacterProvider } from '@/game/moon/narrative/hooks/playerCharacterContext';
import { GameSettingsProvider } from '@/shared/shell';
import { RestartStoryDialog } from '@/game/moon/crew/SelectionScreens';
import { getStoryStep } from '@/game/moon/core/flow';
import { readBrowserSelectionSession } from '@/game/moon/crew/selectionSession';
import { createWorkshopSession, reduceMission } from '@/game/moon/workshop/lander/workshopSession';
import { DemoMenu } from './demo';
import { MissionBoundary } from '@/shared/shell/MissionBoundary';
import type { MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import '@/game/moon/narrative/components/conversation.css';
import '@/game/moon/crew/selection.css';
import '@/shared/shell/playability.css';
import { LearningProvider } from '@/game/moon/core/learning/Learning';
import { GestureGuide } from '@/shared/shell/GestureGuide';
import { MobileGameProvider } from '@/shared/shell';
import { isEngineFrozen } from '@exo/ui';
import { createDebugSession } from '@/game/moon/debug/debugSessionSeeder';
import { trackMilestoneTransition } from '@/game/moon/core/missionMilestones';
import { pauseMission, savedMissionProgress } from '@/game/moon/core/missionNavigation';
import { StoryNavigationContext } from '@/game/moon/core/storyNavigationContext';
import { useStoryPersistence, type StoryPersistenceState } from './useStoryPersistence';
import { useStoryPauseResume } from './useStoryPauseResume';
import { StoryScreenRouter } from './StoryScreenRouter';
import { useStoryDemo } from './demo';
import { useStoryNavigationState } from './useStoryNavigationState';
import { useStoryFrames } from './useStoryFrames';
import { useStoryAudioControls } from './useStoryAudioControls';

const NasaMissionArchive = lazy(() =>
  import('@/features/archive/NasaMissionArchive').then(module => ({
    default: module.NasaMissionArchive,
  })),
);

export interface ExactStoryProps {
  debugStepId?: string;
  debugDemoChapter?: string;
  initialHome?: boolean;
  initialArchive?: boolean;
}

/** Exact dialogue and a real preparation manifest share one saved mission. */
export default function ExactStory({
  debugStepId,
  debugDemoChapter,
  initialHome,
  initialArchive,
}: ExactStoryProps = {}) {
  const isDebugSession = Boolean(debugStepId || debugDemoChapter);
  const [archiveOpen, setArchiveOpen] = useState(() => Boolean(initialArchive));
  const [session] = useState(readBrowserSelectionSession);
  const [mission, setMission] = useState(() => {
    if (debugStepId) {
      return createDebugSession(debugStepId as StoryStepId);
    }
    return createWorkshopSession(
      session.progress,
      session.preparation,
      session.readiness,
      session.flight,
      session.moon,
      session.repair,
    );
  });
  const { progress, preparation, readiness, flight, moon } = mission;

  const { voiceEnabled, voicesEnabled, soundActive, toggleAudioMute } =
    useStoryAudioControls(session.voiceEnabled);

  const [storageAvailable, setStorageAvailable] = useState(session.storageAvailable);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useCallback((event: MissionEvent) => {
    setMission(current =>
      isEngineFrozen() && !event.type.endsWith('-pause')
        ? current
        : trackMilestoneTransition(current, reduceMission(current, event)),
    );
  }, []);

  const demoState = useStoryDemo(mission, setMission, () => {}, () => {}, () => {}, debugDemoChapter);

  const nav = useStoryNavigationState({
    mission,
    setMission,
    dispatch,
    isDebugSession,
    initialHome,
    initialArchive,
    debugStepId,
    debugDemoChapter,
    demo: demoState.demo,
    setDemo: demoState.setDemo,
    exitDemo: demoState.exitDemo,
  });

  const latest = useRef<StoryPersistenceState>({
    progress: savedMissionProgress(mission),
    voiceEnabled: voicesEnabled,
    preparation,
    readiness,
    flight,
    moon,
    demo: demoState.demo,
    repair: mission.repair,
  });

  useEffect(() => {
    latest.current = {
      progress: savedMissionProgress(mission),
      voiceEnabled: voicesEnabled,
      preparation,
      readiness,
      flight,
      moon,
      demo: demoState.demo,
      repair: mission.repair,
    };
  }, [mission, progress, voicesEnabled, preparation, readiness, flight, moon, demoState.demo]);

  useStoryPersistence(mission, latest, isDebugSession, voiceEnabled, voicesEnabled, demoState.demo, setStorageAvailable, setIsSaving);
  useStoryPauseResume(dispatch, latest);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [progress.stepId, nav.home]);

  const step = getStoryStep(progress.stepId, progress.selections.objective);

  const { frame, homeFrame } = useStoryFrames({
    onHome: nav.goHome,
    voiceEnabled,
    soundActive,
    toggleAudioMute,
    isDebugSession,
    debugStepId,
    debugDemoChapter,
    demo: demoState.demo,
    judgePreview: Boolean(progress.assistance?.includes('judge-demo')),
    storageAvailable,
    isSaving,
    skipError: nav.skipError,
  });

  if (archiveOpen) {
    return (
      <Suspense fallback={<div className="fixed inset-0 w-screen h-screen bg-[#030712] flex items-center justify-center text-cyan-400 font-mono text-sm z-50">Opening NASA Mission Archive…</div>}>
        <NasaMissionArchive onBack={() => setArchiveOpen(false)} />
      </Suspense>
    );
  }

  return (
    <PlayerCharacterProvider value={progress.playerGender}>
      <GameSettingsProvider voiceEnabled={voiceEnabled} onToggleVoice={toggleAudioMute} onRestart={nav.requestRestart}>
        <LearningProvider>
          <StoryNavigationContext.Provider
            value={
              nav.home
                ? null
                : {
                    progress: nav.chapter,
                    reviewing: Boolean(mission.review),
                    autoplay: nav.autoplay && !mission.review,
                    card: nav.milestoneCard,
                    back: nav.back,
                    skip: step.kind === 'endpoint' && !nav.milestoneCard ? undefined : nav.skipPage,
                    skipping: nav.skipBusy,
                    forward: () => dispatch({ type: 'next' }),
                    overview: () => {
                      nav.setAutoBuilding(false);
                      nav.setAutoplay(false);
                      setMission(current => pauseMission(current));
                      nav.setOverviewOpen('map');
                    },
                    overviewOpen: nav.overviewOpen,
                    storageAvailable,
                    isSaving,
                  }
            }
          >
            <GestureGuide step={nav.home ? 'player-name' : mission.progress.stepId} hidden={nav.overviewOpen !== null} repair={mission.repair} />
            <MobileGameProvider
              active={!nav.home}
              voiceEnabled={voiceEnabled}
              onToggleVoice={toggleAudioMute}
              onHome={nav.goHome}
            >
              <div className={`story-viewport-root ${nav.milestoneCard ? 'is-milestone-overview' : ''}`}>
                <MissionBoundary frame={frame} onReload={nav.reset}>
                  <StoryScreenRouter
                    home={nav.home}
                    mission={mission}
                    frame={frame}
                    homeFrame={homeFrame}
                    milestoneCard={nav.milestoneCard}
                    overviewOpen={nav.overviewOpen}
                    pending={nav.pending}
                    chapterIndex={nav.chapter.index}
                    autoplay={nav.autoplay}
                    autoBuilding={nav.autoBuilding}
                    storageAvailable={storageAvailable}
                    setHome={nav.setHome}
                    setOverviewOpen={nav.setOverviewOpen}
                    setAutoplay={nav.setAutoplay}
                    setAutoBuilding={nav.setAutoBuilding}
                    setMission={setMission}
                    dispatch={dispatch}
                    back={nav.back}
                    enterMission={nav.enterMission}
                    requestRestart={nav.requestRestart}
                    onOpenArchive={() => setArchiveOpen(true)}
                    demoModal={
                      demoState.demoAvailable && demoState.demo ? (
                        <DemoMenu
                          onClose={demoState.closeDemo}
                          onChoose={demoState.startDemo}
                          onResume={demoState.resumeDemo}
                          resumeAvailable={Boolean(demoState.resumeDemo)}
                          busy={demoState.demoBusy}
                          error={demoState.demoError}
                        />
                      ) : null
                    }
                  />
                </MissionBoundary>
              </div>
              {nav.restart ? <RestartStoryDialog open={nav.restart} onConfirm={nav.reset} onClose={() => nav.setRestart(false)} /> : null}
            </MobileGameProvider>
          </StoryNavigationContext.Provider>
        </LearningProvider>
      </GameSettingsProvider>
    </PlayerCharacterProvider>
    );
  }
