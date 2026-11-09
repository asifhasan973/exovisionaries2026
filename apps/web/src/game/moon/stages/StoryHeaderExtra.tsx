import React from "react";
import { StorySaveBadge } from "@/shared/shell/StorySaveBadge";

export interface StoryHeaderExtraProps {
  isDebugSession: boolean;
  debugStepId?: string;
  debugDemoChapter?: string;
  demo?: boolean;
  judgePreview?: boolean;
  storageAvailable: boolean;
  isSaving?: boolean;
  skipError: string | null;
  onHome: () => void;
  showSaveStatus?: boolean;
}

export function StoryHeaderExtra({
  storageAvailable,
  isSaving,
  skipError,
  showSaveStatus = true,
}: StoryHeaderExtraProps) {
  return (
    <>
      {showSaveStatus ? (
        <StorySaveBadge
          storageAvailable={storageAvailable}
          isSaving={isSaving}
        />
      ) : null}
      {skipError ? (
        <span role="alert" className="story-skip-error">
          {skipError}
        </span>
      ) : null}
    </>
  );
}
