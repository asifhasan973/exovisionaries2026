import { useEffect, useRef } from 'react';

export function RestartStoryDialog({ open, onClose, onConfirm }: { open: boolean; onClose(): void; onConfirm(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="selection-reset-dialog"
      aria-labelledby="restart-story-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <h2 id="restart-story-title">Start a new mission?</h2>
      <p>This clears your name, design, checks and flight.</p>
      <div>
        <button className="conversation-back" autoFocus onClick={onClose}>
          Keep playing
        </button>
        <button className="conversation-next" onClick={onConfirm}>
          Start fresh
        </button>
      </div>
    </dialog>
  );
}
