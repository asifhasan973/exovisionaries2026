import type { ReactNode } from 'react';
import type { WorkshopSession, MissionEvent } from '@/game/moon/workshop/lander/workshopSession';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import type { PlayerGender } from '@/game/moon/core/types';
import { getStoryStep } from '@/game/moon/core/flow';
import { reduceMission } from '@/game/moon/workshop/lander/workshopSession';
import { ChoiceScreen, MissionHome, NameScreen } from '@/game/moon/crew/SelectionScreens';
import { ConversationScene } from '@/game/moon/narrative/components/ConversationScene';
import type { MilestoneId } from '@/game/moon/core/missionMilestones';
import { MilestonePage } from './milestones';
import { SimulationScreenRouter } from './SimulationScreenRouter';

export interface StoryScreenRouterProps {
  home: boolean;
  mission: WorkshopSession;
  frame: SelectionFrame;
  homeFrame: SelectionFrame;
  milestoneCard: boolean;
  overviewOpen: 'map' | 'start' | null;
  pending?: MilestoneId;
  chapterIndex: number;
  autoplay: boolean;
  autoBuilding: boolean;
  storageAvailable: boolean;
  setHome: (home: boolean) => void;
  setOverviewOpen: (open: 'map' | 'start' | null) => void;
  setAutoplay: (autoplay: boolean) => void;
  setAutoBuilding: (building: boolean) => void;
  setMission: React.Dispatch<React.SetStateAction<WorkshopSession>>;
  dispatch: (event: MissionEvent) => void;
  back: () => void;
  enterMission: () => void;
  requestRestart: () => void;
  onOpenArchive: () => void;
  demoModal?: ReactNode;
}

export function StoryScreenRouter({
  home,
  mission,
  frame,
  homeFrame,
  milestoneCard,
  overviewOpen,
  pending,
  chapterIndex,
  autoplay,
  autoBuilding,
  storageAvailable: _storageAvailable,
  setHome: _setHome,
  setOverviewOpen,
  setAutoplay,
  setAutoBuilding,
  setMission,
  dispatch,
  back,
  enterMission,
  requestRestart,
  onOpenArchive,
  demoModal: _demoModal,
}: StoryScreenRouterProps) {
  const { progress } = mission;
  const step = getStoryStep(progress.stepId, progress.selections.objective);

  if (home) {
    return (
      <MissionHome
        frame={homeFrame}
        progress={mission.progress}
        onContinue={enterMission}
        onBack={back}
        onOpenArchive={onOpenArchive}
        onRestart={requestRestart}
      />
    );
  }

  if (milestoneCard) {
    return (
      <MilestonePage
        frame={frame}
        mode={overviewOpen === 'map' ? 'map' : pending ? 'complete' : 'intro'}
        current={chapterIndex}
        completed={pending}
        onBack={back}
        onNext={() => {
          setOverviewOpen(null);
          setAutoplay(true);
          dispatch({ type: pending ? 'milestone-continue' : 'milestone-start' });
        }}
      />
    );
  }

  if (step.kind === 'conversation') {
    return (
      <ConversationScene
        key={`${step.id}:${progress.lineIndex}`}
        title={step.id}
        lines={step.lines}
        lineIndex={progress.lineIndex}
        playerName={progress.playerName}
        autoplay={autoplay}
        narrationEnabled={frame.voiceEnabled}
        onNext={() => {
          setAutoplay(true);
          dispatch({ type: 'next' });
        }}
        onBack={back}
        onHome={homeFrame.onHome}
      />
    );
  }

  if (step.kind === 'name') {
    return (
      <NameScreen
        key={step.id}
        playerName={progress.playerName}
        playerGender={progress.playerGender}
        frame={frame}
        onBack={back}
        onSubmit={(name: string, gender: PlayerGender) => {
          setAutoplay(true);
          dispatch({ type: 'set-name', name, gender });
        }}
      />
    );
  }

  if (step.kind === 'choice') {
    return (
      <ChoiceScreen
        key={step.id}
        step={step}
        progress={progress}
        frame={frame}
        onNext={() => {
          setAutoplay(true);
          dispatch({ type: 'next' });
        }}
        onBack={back}
        onSelect={choiceId => {
          setAutoplay(true);
          setMission(current => {
            if (current.progress.stepId !== step.id) return current;
            const selected = reduceMission(current, { type: 'select', choiceId });
            return step.choiceKey === 'destination' && selected.progress.selections.destination === 'moon'
              ? reduceMission(selected, { type: 'next' })
              : selected;
          });
        }}
      />
    );
  }

  return (
    <SimulationScreenRouter
      mission={mission}
      frame={frame}
      dispatch={dispatch}
      back={back}
      autoBuilding={autoBuilding}
      setAutoBuilding={setAutoBuilding}
    />
  );
}
