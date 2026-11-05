import React from 'react';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { StoryHeaderExtra } from './StoryHeaderExtra';

export interface UseStoryFramesOptions {
  onHome: () => void;
  voiceEnabled: boolean;
  toggleAudioMute: () => void;
  isDebugSession: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo: boolean;
  judgePreview: boolean;
  storageAvailable: boolean;
  skipError: string | null;
}

export function useStoryFrames({
  onHome,
  voiceEnabled,
  toggleAudioMute,
  isDebugSession,
  debugStepId,
  debugDemoChapter,
  demo,
  judgePreview,
  storageAvailable,
  skipError,
}: UseStoryFramesOptions): { frame: SelectionFrame; homeFrame: SelectionFrame } {
  const frame: SelectionFrame = {
    onHome,
    voiceEnabled,
    onToggleVoice: toggleAudioMute,
    voiceAvailable: typeof Audio !== 'undefined',
    headerExtra: (
      <StoryHeaderExtra
        isDebugSession={isDebugSession}
        debugStepId={debugStepId}
        debugDemoChapter={debugDemoChapter}
        demo={demo}
        judgePreview={judgePreview}
        storageAvailable={storageAvailable}
        skipError={skipError}
        onHome={onHome}
        showSaveStatus={true}
      />
    ),
  };

  const homeFrame: SelectionFrame = {
    ...frame,
    headerExtra: (
      <StoryHeaderExtra
        isDebugSession={isDebugSession}
        debugStepId={debugStepId}
        debugDemoChapter={debugDemoChapter}
        demo={demo}
        judgePreview={judgePreview}
        storageAvailable={storageAvailable}
        skipError={skipError}
        onHome={onHome}
        showSaveStatus={false}
      />
    ),
  };

  return { frame, homeFrame };
}

