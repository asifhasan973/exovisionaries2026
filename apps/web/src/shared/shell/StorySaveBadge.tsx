import { Check, Loader2 } from 'lucide-react';
import { useStoryNavigation } from '@/game/moon/core/storyNavigationContext';

export interface StorySaveBadgeProps {
  storageAvailable?: boolean;
  isSaving?: boolean;
  isDebugSession?: boolean;
  className?: string;
}

export function StorySaveBadge({
  storageAvailable: propStorage,
  isSaving: propSaving,
  isDebugSession = false,
  className = '',
}: StorySaveBadgeProps) {
  const navigation = useStoryNavigation();
  const storageAvailable = propStorage ?? navigation?.storageAvailable ?? true;
  const isSaving = propSaving ?? navigation?.isSaving ?? false;

  if (isDebugSession) {
    return (
      <span
        className={`selection-save-status is-debug ${className}`}
        role="status"
        title="Ephemeral debug session: local progress preserved"
      >
        <i aria-hidden="true" />
        <span>Debug</span>
      </span>
    );
  }

  if (isSaving) {
    return (
      <span
        className={`selection-save-status is-saving ${className}`}
        role="status"
        title="Saving mission progress…"
      >
        <Loader2 size={12} className="save-spinner" />
        <span>Saving…</span>
      </span>
    );
  }

  return (
    <span
      className={`selection-save-status ${storageAvailable ? 'is-saved' : 'is-unsaved'} ${className}`}
      role="status"
      title={
        storageAvailable
          ? 'Progress saved on this device'
          : 'Saving unavailable. Keep this tab open.'
      }
    >
      {storageAvailable ? <Check size={12} className="save-check" /> : <i aria-hidden="true" />}
      <span>{storageAvailable ? 'Saved' : 'Not saved'}</span>
    </span>
  );
}

