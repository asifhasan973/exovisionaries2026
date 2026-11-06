import { useState, useCallback, useEffect } from 'react';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import { createWorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import { createStoryProgress } from '@/game/moon/core/progress';
import { pauseMission } from '@/game/moon/core/missionNavigation';
import { milestoneProgress } from '@/game/moon/core/missionMilestones';
import { useLoadingStore, isEngineFrozen } from '@exo/ui';

export interface UseStoryNavigationStateOptions {
  mission: WorkshopSession;
  setMission: React.Dispatch<React.SetStateAction<WorkshopSession>>;
  dispatch: (event: MissionEvent) => void;
  isDebugSession: boolean;
  initialHome?: boolean;
  initialArchive?: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo: boolean;
  setDemo: (demo: boolean) => void;
  exitDemo: () => void;
}

export function useStoryNavigationState({
  mission,
  setMission,
  dispatch,
  isDebugSession: _isDebugSession,
  initialHome,
  initialArchive,
  debugStepId,
  debugDemoChapter,
  demo,
  setDemo,
  exitDemo,
}: UseStoryNavigationStateOptions) {
  const { progress } = mission;

  const [home, setHome] = useState(() => {
    if (initialHome) return true;
    if (debugStepId || debugDemoChapter || initialArchive) return false;
    return true;
  });
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState<'map' | 'start' | null>(null);
  const [restart, setRestart] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  const enterMission = useCallback(() => {
    useLoadingStore.getState().startLoading('mission_start');
    setAutoplay(true);
    setHome(false);
    if (progress.stepId !== 'player-name') {
      setOverviewOpen('map');
    } else {
      setOverviewOpen(null);
    }
  }, [progress.stepId]);

  const reset = useCallback(() => {
    useLoadingStore.getState().startLoading('mission_start', 'Preparing fresh mission…');
    setAutoBuilding(false);
    setAutoplay(true);
    setMission(createWorkshopSession(createStoryProgress()));
    setDemo(false);
    setRestart(false);
    setHome(false);
    setOverviewOpen(null);
  }, [setMission, setDemo]);

  const goHome = useCallback(() => {
    setAutoBuilding(false);
    setOverviewOpen(null);
    setMission(current => {
      const paused = pauseMission(current);
      if (!paused.review) return paused;
      const { review, ...live } = paused;
      return { ...live, progress: review.anchor };
    });
    exitDemo();
    setHome(true);
  }, [exitDemo, setMission]);

  const requestRestart = useCallback(() => {
    setRestart(true);
  }, []);

  const back = useCallback(() => {
    setAutoBuilding(false);
    setAutoplay(false);
    if (overviewOpen) {
      setOverviewOpen(null);
      if (progress.stepId === 'appointment') {
        dispatch({ type: 'back' });
      }
      return;
    }
    if (progress.stepId === 'player-name') setHome(true);
    else dispatch({ type: 'back' });
  }, [dispatch, overviewOpen, progress.stepId]);

  const chapter = milestoneProgress(mission);
  const pending = mission.review ? undefined : progress.milestones?.pending;
  const introduction = !demo && !progress.milestones?.introduced && progress.stepId === 'appointment';
  const milestoneCard = !home && (Boolean(overviewOpen) || Boolean(pending) || introduction);

  const skipPage = useCallback(async () => {
    if (skipBusy || isEngineFrozen()) return;
    if (milestoneCard) {
      if (pending) {
        dispatch({ type: 'milestone-continue' });
        setOverviewOpen('map');
      } else {
        setOverviewOpen(null);
        dispatch({ type: 'milestone-start' });
      }
      setAutoplay(true);
      return;
    }
    if (mission.review) {
      setAutoplay(true);
      dispatch({ type: 'next' });
      return;
    }
    setAutoBuilding(false);
    setSkipBusy(true);
    setSkipError(null);
    const paused = pauseMission(mission);
    setMission(paused);
    void useLoadingStore.getState().startLoading('mission_start', 'Opening the next judge preview…');
    const task = import('./demo/judgeTour').then(module => module.skipJudgePage(paused));
    useLoadingStore.getState().registerLoaderTask(task.then(() => {}, () => {}));
    try {
      const prepared = await task;
      setDemo(true);
      setMission(prepared);
      setAutoplay(true);
      setOverviewOpen(null);
    } catch {
      setSkipError('Preview unavailable. Your mission is safe; try Next or return home.');
    } finally {
      setSkipBusy(false);
    }
  }, [dispatch, milestoneCard, mission, pending, setDemo, setMission, skipBusy]);

  useEffect(() => {
    const stop = () => setAutoBuilding(false);
    window.addEventListener('game-help-open', stop);
    return () => window.removeEventListener('game-help-open', stop);
  }, []);

  return {
    home,
    setHome,
    autoBuilding,
    setAutoBuilding,
    autoplay,
    setAutoplay,
    overviewOpen,
    setOverviewOpen,
    restart,
    setRestart,
    skipBusy,
    skipError,
    enterMission,
    reset,
    goHome,
    requestRestart,
    back,
    skipPage,
    chapter,
    pending,
    milestoneCard,
  };
}

