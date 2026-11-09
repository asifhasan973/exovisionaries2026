import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { sound } from "@exo/audio";

export function RestartStoryDialog({
  open = true,
  onClose,
  onConfirm,
}: {
  open?: boolean;
  onClose(): void;
  onConfirm(): void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute("open", "");
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog.open) {
        try {
          dialog.close();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [open]);

  return createPortal(
    <dialog
      ref={ref}
      className="selection-reset-dialog"
      aria-labelledby="restart-story-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            onClose();
          }
        }
      }}
    >
      <h2 id="restart-story-title">Start a new mission?</h2>
      <p>This clears your name, design, checks and flight.</p>
      <div>
        <button
          type="button"
          className="conversation-back"
          autoFocus
          onClick={() => {
            sound.playClick(520);
            onClose();
          }}
        >
          Keep playing
        </button>
        <button
          type="button"
          className="conversation-next"
          onClick={() => {
            sound.playClick(880);
            onConfirm();
          }}
        >
          Start fresh
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
