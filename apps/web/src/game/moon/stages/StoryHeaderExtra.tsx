import React from 'react';
import { StorySaveBadge } from '@/shared/shell/StorySaveBadge';

export interface StoryHeaderExtraProps {
  isDebugSession: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo: boolean;
  judgePreview: boolean;
  storageAvailable: boolean;
  isSaving?: boolean;
  skipError: string | null;
  onHome: () => void;
  showSaveStatus?: boolean;
}

export function StoryHeaderExtra({
  isDebugSession,
  debugStepId,
  debugDemoChapter,
  demo,
  judgePreview,
  storageAvailable,
  isSaving,
  skipError,
  onHome,
  showSaveStatus = true,
}: StoryHeaderExtraProps) {
  return (
    <>
      {isDebugSession ? (
        <button
          className="story-debug-exit"
          onClick={() => {
            window.location.hash = '';
            onHome();
          }}
          title="Exit debug session and return to normal user progress"
        >
          Debug · {debugStepId ?? debugDemoChapter} · Exit
        </button>
      ) : demo ? (
        <button className="story-demo-exit" onClick={onHome}>
          {judgePreview ? 'Judge preview' : 'Demo'} · Exit
        </button>
      ) : null}
      {showSaveStatus ? (
        <StorySaveBadge
          storageAvailable={storageAvailable}
          isSaving={isSaving}
          isDebugSession={isDebugSession}
        />
      ) : null}
      {skipError ? <span role="alert" className="story-skip-error">{skipError}</span> : null}
    </>
  );
}

