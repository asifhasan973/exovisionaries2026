import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Award, X, Compass, CheckCircle2, FastForward } from "lucide-react";
import { sound } from "@exo/audio";

export function JudgeInstructionsDialog({
  open = true,
  onClose,
}: {
  open?: boolean;
  onClose(): void;
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
      if (dialog?.open) {
        try {
          dialog.close();
        } catch {}
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={ref}
      className="judge-instructions-dialog"
      aria-labelledby="judge-instructions-title"
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
      <header className="judge-instructions-header">
        <div className="judge-instructions-badge">
          <Award size={15} />
          <span>EVALUATION PROTOCOL</span>
        </div>
        <button
          type="button"
          className="judge-instructions-close"
          onClick={() => {
            sound.playClick(520);
            onClose();
          }}
          aria-label="Close instructions"
        >
          <X size={16} />
        </button>
      </header>

      <h2 id="judge-instructions-title">Zero To Beyond · Evaluator Guide</h2>
      <p className="judge-instructions-intro">
        Design and command an authentic lunar expedition from mission objectives
        to splashdown debrief.
      </p>

      <div className="judge-instructions-sections">
        <article className="judge-instructions-card">
          <span className="judge-instructions-card-icon" aria-hidden="true">
            <Compass size={16} />
          </span>
          <div className="judge-instructions-card-body">
            <h3>Mission Architecture & Systems</h3>
            <p>
              Choose between <strong>Lunar South Pole Ice Explorer</strong>{" "}
              (Permanently Shadowed Region ice coring) or{" "}
              <strong>Lunar Geology Explorer</strong> (crust spectrometry).
              Hardware realistically constrains mass, power Wh, delta-v margins,
              and crew return viability.
            </p>
          </div>
        </article>

        <article className="judge-instructions-card">
          <span className="judge-instructions-card-icon" aria-hidden="true">
            <FastForward size={16} />
          </span>
          <div className="judge-instructions-card-body">
            <h3>Rapid Evaluation via Stage Skip</h3>
            <p>
              Use the bottom-bar <strong>Skip</strong> button on any stage to
              instantly advance through dialogues, hardware bay, and pre-flight
              telemetry checks. The unified seeder populates valid flight
              manifests so you can inspect any phase seamlessly.
            </p>
          </div>
        </article>

        <article className="judge-instructions-card">
          <span className="judge-instructions-card-icon" aria-hidden="true">
            <CheckCircle2 size={16} />
          </span>
          <div className="judge-instructions-card-body">
            <h3>Complete Mission Lifecycle</h3>
            <p>
              Experience the full simulation: spacecraft & rover assembly,
              astronaut crew selection, multi-stage liftoff, trans-lunar
              injection, powered descent & touchdown, surface rover exploration,
              and Earth re-entry.
            </p>
          </div>
        </article>
      </div>

      <footer className="judge-instructions-footer">
        <button
          type="button"
          className="conversation-next"
          autoFocus
          onClick={() => {
            sound.playClick(880);
            onClose();
          }}
        >
          Got It · Begin Tour
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}
