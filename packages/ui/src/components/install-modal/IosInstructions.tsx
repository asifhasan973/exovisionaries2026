import React from 'react';
import { Lightbulb, Share2, PlusSquare } from 'lucide-react';

export const IosInstructions: React.FC = () => {
  return (
    <div className="pwa-steps-list">
      {/* Safari Notice */}
      <div className="pwa-tip-banner">
        <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Apple Safari required:</strong> On iPhone and iPad, web apps must be installed through <strong>Safari</strong>. If opened inside social apps (Twitter, Discord), tap the compass icon to open in Safari first.
        </div>
      </div>

      <div className="pwa-method-divider">
        <span>Safari Home Screen Steps</span>
      </div>

      <div className="pwa-step-item">
        <span className="pwa-step-number">1</span>
        <div className="pwa-step-content">
          <strong>Reveal toolbar</strong>: If Safari’s bottom toolbar is hidden, tap the bottom or top of your screen to make the navigation bar appear.
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">2</span>
        <div className="pwa-step-content">
          Tap the Safari <strong>Share button</strong>
          <span className="pwa-step-badge">
            <Share2 size={11} /> Share
          </span>
          (the square with an arrow pointing upward) at the bottom of your iPhone screen (or top-right on iPad).
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">3</span>
        <div className="pwa-step-content">
          In the Share Sheet, scroll down past your contacts and tap
          <span className="pwa-step-badge">
            <PlusSquare size={11} /> Add to Home Screen
          </span>
          .
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">4</span>
        <div className="pwa-step-content">
          Tap <strong>Add</strong> in the top-right corner of the confirmation screen.
        </div>
      </div>
      <div className="pwa-step-item">
        <span className="pwa-step-number">5</span>
        <div className="pwa-step-content">
          Launch the game directly from your iPhone or iPad Home Screen. It opens in <strong>true fullscreen horizontal view without Safari’s top URL bar or bottom navigation bar</strong>!
        </div>
      </div>
    </div>
  );
};

