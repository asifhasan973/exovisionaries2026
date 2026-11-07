import React from 'react';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { StoryHeaderExtra } from './StoryHeaderExtra';

export interface UseStoryFramesOptions {
  onHome: () => void;
  voiceEnabled: boolean;
  soundActive?: boolean;
  toggleAudioMute: () => void;
  isDebugSession: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo?: boolean;
  judgePreview?: boolean;
  storageAvailable: boolean;
  isSaving?: boolean;
  skipError: string | null;
}

export function useStoryFrames({
  onHome,
  voiceEnabled,
  soundActive,
  toggleAudioMute,
  isDebugSession,
  debugStepId,
  debugDemoChapter,
  storageAvailable,
  isSaving,
  skipError,
}: UseStoryFramesOptions): { frame: SelectionFrame; homeFrame: SelectionFrame } {
  const frame: SelectionFrame = {
    onHome,
    voiceEnabled,
    soundActive,
    onToggleVoice: toggleAudioMute,
    voiceAvailable: typeof Audio !== 'undefined',
    headerExtra: (
      <StoryHeaderExtra
        isDebugSession={isDebugSession}
        debugStepId={debugStepId}
        debugDemoChapter={debugDemoChapter}
        storageAvailable={storageAvailable}
        isSaving={isSaving}
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
        storageAvailable={storageAvailable}
        isSaving={isSaving}
        skipError={skipError}
        onHome={onHome}
        showSaveStatus={false}
      />
    ),
  };

  return { frame, homeFrame };
}

