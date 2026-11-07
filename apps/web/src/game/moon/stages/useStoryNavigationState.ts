import { useState, useCallback, useEffect } from 'react';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import { createWorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import { createStoryProgress } from '@/game/moon/core/progress';
import { pauseMission } from '@/game/moon/core/missionNavigation';
import { executeSkip } from '@exo/debug';
import { milestoneProgress } from '@/game/moon/core/missionMilestones';
import { useLoadingStore, isEngineFrozen } from '@exo/ui';

export interface UseStoryNavigationStateOptions {
  mission: WorkshopSession;
  setMission: React.Dispatch<React.SetStateAction<WorkshopSession>>;
  dispatch: (event: MissionEvent) => void;
  isDebugSession?: boolean;
  initialHome?: boolean;
  initialArchive?: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
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
    setRestart(false);
    setHome(false);
    setOverviewOpen(null);
  }, [setMission]);

  const goHome = useCallback(() => {
    setAutoBuilding(false);
    setOverviewOpen(null);
    setMission(current => {
      const paused = pauseMission(current);
      if (!paused.review) return paused;
      const { review, ...live } = paused;
      return { ...live, progress: review.anchor };
    });
    setHome(true);
  }, [setMission]);

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
  const introduction = !progress.milestones?.introduced && progress.stepId === 'appointment';
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
    void useLoadingStore.getState().startLoading('mission_start', 'Advancing to next stage…');
    try {
      const advanced = executeSkip(paused);
      setMission(advanced);
      setAutoplay(true);
      setOverviewOpen(null);
    } catch {
      setSkipError('Skip unavailable. Try Next or return home.');
    } finally {
      setSkipBusy(false);
    }
  }, [dispatch, milestoneCard, mission, pending, setMission, skipBusy]);

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

