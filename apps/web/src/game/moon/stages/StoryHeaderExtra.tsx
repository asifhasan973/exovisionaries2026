import React from 'react';

export interface StoryHeaderExtraProps {
  isDebugSession: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo: boolean;
  judgePreview: boolean;
  storageAvailable: boolean;
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
        <span
          className={`selection-save-status ${storageAvailable && !isDebugSession ? '' : 'is-unsaved'}`}
          role="status"
          title={
            isDebugSession
              ? 'Ephemeral debug session: local progress preserved'
              : storageAvailable
              ? 'Progress saved on this device'
              : 'Saving unavailable. Keep this tab open.'
          }
        >
          <i aria-hidden="true" />
          <span>{isDebugSession ? 'Debug Mode' : storageAvailable ? 'Saved' : 'Not saved'}</span>
        </span>
      ) : null}
      {skipError ? <span role="alert" className="story-skip-error">{skipError}</span> : null}
    </>
  );
}

