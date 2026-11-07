import React from 'react';
import { Lightbulb, Rocket, Download, MoreVertical, ArrowRight } from 'lucide-react';

interface AndroidInstructionsProps {
  deferredPrompt: unknown;
  onDirectInstall: () => void;
}

export const AndroidInstructions: React.FC<AndroidInstructionsProps> = ({
  deferredPrompt,
  onDirectInstall,
}) => {
  return (
    <div className="pwa-steps-list">
      {/* Fullscreen Exit Notice */}
      <div className="pwa-tip-banner">
        <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Important first step:</strong> If the game is currently fullscreen, <strong>swipe down from the very top of your phone screen</strong> to exit fullscreen and reveal Chrome’s top address bar and menu!
        </div>
      </div>

      {/* Direct Install Card if prompt ready */}
      {deferredPrompt ? (
        <div className="pwa-direct-install-box">
          <div className="pwa-direct-copy">
            <h4>
              <Rocket size={15} /> Native Android Prompt Ready
            </h4>
            <p>Tap below to trigger the Android home screen installer immediately.</p>
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
        <span>Manual Installation Steps</span>
      </div>

      <div className="pwa-step-item">
        <span className="pwa-step-number">1</span>
        <div className="pwa-step-content">
          <strong>Exit Fullscreen</strong>: Swipe down from the top edge of your phone screen to reveal the browser toolbar.
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">2</span>
        <div className="pwa-step-content">
          Tap the <strong>three vertical dots</strong>
          <span className="pwa-step-badge">
            <MoreVertical size={11} /> Menu
          </span>
          in the top-right corner of Chrome or Edge.
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">3</span>
        <div className="pwa-step-content">
          Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          <span className="pwa-step-subtext">
            In <strong>Samsung Internet</strong>: Tap the bottom menu (three lines <em>≡</em>) <ArrowRight size={11} className="inline mx-1" /> <strong>Add page to</strong> <ArrowRight size={11} className="inline mx-1" /> <strong>Home screen</strong>.
          </span>
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">4</span>
        <div className="pwa-step-content">
          Tap <strong>Install</strong> on the confirmation popup. The game icon is now pinned to your phone’s Home Screen!
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">5</span>
        <div className="pwa-step-content">
          Open <strong>Zero To Beyond</strong> from your Home Screen to launch in <strong>locked landscape mode without any browser URL bars</strong>!
        </div>
      </div>
    </div>
  );
};

