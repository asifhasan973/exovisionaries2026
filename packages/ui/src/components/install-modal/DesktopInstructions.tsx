import React from "react";
import {
  Lightbulb,
  Rocket,
  Download,
  MoreVertical,
  ArrowRight,
} from "lucide-react";

interface DesktopInstructionsProps {
  deferredPrompt: unknown;
  onDirectInstall: () => void;
}

export const DesktopInstructions: React.FC<DesktopInstructionsProps> = ({
  deferredPrompt,
  onDirectInstall,
}) => {
  return (
    <div className="pwa-steps-list">
      {/* Fullscreen Tip */}
      <div className="pwa-tip-banner">
        <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Fullscreen tip:</strong> If your browser is in fullscreen
          mode, press <strong>F11</strong> or <strong>Esc</strong> to reveal the
          browser address bar and menu.
        </div>
      </div>

      {/* One-Click Direct Install Card if browser prompt is ready */}
      {deferredPrompt ? (
        <div className="pwa-direct-install-box">
          <div className="pwa-direct-copy">
            <h4>
              <Rocket size={15} /> One-Click Install Ready
            </h4>
            <p>
              Your browser supports direct installation without navigating
              menus.
            </p>
          </div>
          <button
            type="button"
            className="pwa-direct-install-btn"
            onClick={onDirectInstall}
          >
            <Download size={14} />
            <span>Install Now</span>
          </button>
        </div>
      ) : null}

      <div className="pwa-method-divider">
        <span>Method 1: Address Bar (Quickest)</span>
      </div>

      <div className="pwa-step-item">
        <span className="pwa-step-number">1</span>
        <div className="pwa-step-content">
          In Chrome, Edge, or Brave, look at the right side of the address bar
          for the
          <span className="pwa-step-badge">
            <Download size={11} /> Install App
          </span>
          icon (next to the bookmark star).
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">2</span>
        <div className="pwa-step-content">
          Click the icon and select <strong>Install</strong> to add{" "}
          <strong>Zero To Beyond</strong> directly to your desktop and Start
          Menu.
        </div>
      </div>

      <div className="pwa-method-divider">
        <span>Method 2: Browser Menu (3 Dots)</span>
      </div>

      <div className="pwa-step-item">
        <span className="pwa-step-number">1</span>
        <div className="pwa-step-content">
          Click the <strong>three dots menu</strong>
          <span className="pwa-step-badge">
            <MoreVertical size={11} /> Menu
          </span>
          in the top-right corner of your browser.
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">2</span>
        <div className="pwa-step-content">
          In <strong>Chrome / Brave</strong>: Click{" "}
          <strong>Save and share</strong> (or <em>More tools</em>){" "}
          <ArrowRight size={11} className="inline mx-1" /> select{" "}
          <strong>Install Zero To Beyond...</strong> (or{" "}
          <em>Save page as app</em>).
          <span className="pwa-step-subtext">
            In <strong>Microsoft Edge</strong>: Click <strong>Apps</strong>{" "}
            <ArrowRight size={11} className="inline mx-1" />{" "}
            <strong>Install Zero To Beyond</strong>.
          </span>
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">3</span>
        <div className="pwa-step-content">
          Click <strong>Install</strong>. A dedicated, distraction-free app
          window launches with 60FPS fullscreen performance!
        </div>
      </div>
    </div>
  );
};
