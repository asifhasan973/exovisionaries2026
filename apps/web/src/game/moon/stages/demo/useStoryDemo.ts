import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerGender } from '@/game/moon/core/types';
import type { DemoChapterId } from './demoChapters';
import { createDemoChapter } from './demoChapters';
import { readBrowserDemoSession, hasBrowserDemoCheckpoint } from '@/game/moon/crew/selectionSession';
import { createWorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import type { WorkshopSession } from '@/game/moon/workshop/lander/workshopSession';
import { useLoadingStore } from '@exo/ui';

export function useStoryDemo(
  mission: WorkshopSession,
  setMission: React.Dispatch<React.SetStateAction<WorkshopSession>>,
  setAutoBuilding: (building: boolean) => void,
  setAutoplay: (autoplay: boolean) => void,
  setHome: (home: boolean) => void,
  debugDemoChapter?: string,
) {
  const [demo, setDemo] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(hasBrowserDemoCheckpoint);
  const [demoGender, setDemoGender] = useState<PlayerGender | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const demoRequest = useRef(0);
  const normalMission = useRef(mission);

  const closeDemo = () => {
    demoRequest.current++;
    setDemoGender(null);
    setDemoBusy(false);
    setDemoError(null);
  };

  const startDemo = useCallback(
    async (chapter: DemoChapterId) => {
      const request = ++demoRequest.current;
      setDemoBusy(true);
      setDemoError(null);
      try {
        useLoadingStore.getState().startLoading('mission_start', `Preparing ${chapter} demo…`);
        await new Promise(resolve => setTimeout(resolve, 0));
        const prepared = await createDemoChapter(
          chapter,
          demoGender ?? mission.progress.playerGender,
        );
        if (request !== demoRequest.current) return;
        if (!demo) normalMission.current = mission;
        setAutoBuilding(false);
        setDemo(true);
        setDemoAvailable(true);
        setMission(prepared);
        setDemoGender(null);
        setHome(false);
        setAutoplay(true);
      } catch {
        if (request === demoRequest.current) {
          setDemoError('Chapter unavailable. Try Start here. Your saved game is safe.');
        }
      } finally {
        if (request === demoRequest.current) setDemoBusy(false);
      }
    },
    [demo, demoGender, mission, setAutoBuilding, setAutoplay, setHome, setMission],
  );

  const resumeDemo = () => {
    const saved = readBrowserDemoSession();
    if (!saved) return;
    if (!demo) normalMission.current = mission;
    setAutoBuilding(false);
    setDemo(true);
    setMission(createWorkshopSession(saved.progress, saved.preparation, saved.readiness, saved.flight));
    closeDemo();
    setHome(false);
    setAutoplay(true);
  };

  const endDemo = () => {
    closeDemo();
    setDemo(false);
    setAutoBuilding(false);
    setMission(normalMission.current);
    setHome(false);
    setAutoplay(true);
  };

  useEffect(() => {
    if (debugDemoChapter) {
      const timer = setTimeout(() => {
        void startDemo(debugDemoChapter as DemoChapterId).catch(() => {});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [debugDemoChapter, startDemo]);

  return {
    demo,
    setDemo,
    demoGender,
    demoBusy,
    demoError,
    demoAvailable,
    setDemoGender,
    closeDemo,
    startDemo,
    resumeDemo,
    endDemo,
    exitDemo: endDemo,
  };
}
