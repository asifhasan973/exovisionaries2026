import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Apple,
  Download,
  X,
  CheckCircle2,
  Share2,
  PlusSquare,
  MoreVertical,
  Zap,
  ShieldCheck,
  Rocket,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { usePwaStore } from '../../state/pwaStore';
import type { PwaPlatform } from '../../state/pwaStore';
import { sound } from '../../audio/soundEngine';
import './installAppModal.css';

export const InstallAppModal: React.FC = () => {
  const { isModalOpen, closeInstallModal, promptInstall, deferredPrompt, platform, isInstalled } = usePwaStore();
  const [activeTab, setActiveTab] = useState<PwaPlatform>(platform);

  useEffect(() => {
    setActiveTab(platform);
  }, [platform]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playClick();
        closeInstallModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeInstallModal]);

  if (!isModalOpen || isInstalled) return null;

  const handleTabChange = (tab: PwaPlatform) => {
    sound.playPop();
    setActiveTab(tab);
  };

  const handleClose = () => {
    sound.playClick();
    closeInstallModal();
  };

  const handleDirectInstall = () => {
    sound.playClick();
    promptInstall();
  };

  return (
    <div
      className="pwa-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="pwa-modal-container">
        {/* Modal Header */}
        <div className="pwa-modal-header">
          <div className="pwa-modal-title-group">
            <div className="pwa-modal-icon-badge">
              <Download size={20} />
            </div>
            <div>
              <h2 id="pwa-modal-title" className="pwa-modal-title">
                Install Zero To Beyond
              </h2>
              <div className="pwa-modal-subtitle">
                Progressive Web App · Landscape Simulation
              </div>
            </div>
          </div>
          <button
            type="button"
            className="pwa-modal-close"
            onClick={handleClose}
            aria-label="Close installation guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="pwa-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'desktop'}
            className={`pwa-tab-btn ${activeTab === 'desktop' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('desktop')}
          >
            <Monitor size={15} />
            <span>PC & Mac</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'android'}
            className={`pwa-tab-btn ${activeTab === 'android' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('android')}
          >
            <Smartphone size={15} />
            <span>Android</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ios'}
            className={`pwa-tab-btn ${activeTab === 'ios' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('ios')}
          >
            <Apple size={15} />
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="pwa-modal-body">
          {/* ========================================================== */}
          {/* DESKTOP (PC & MAC) INSTRUCTIONS                            */}
          {/* ========================================================== */}
          {activeTab === 'desktop' && (
            <div className="pwa-steps-list">
              {/* Fullscreen Tip */}
              <div className="pwa-tip-banner">
                <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Fullscreen tip:</strong> If your browser is in fullscreen mode, press <strong>F11</strong> or <strong>Esc</strong> to reveal the browser address bar and menu.
                </div>
              </div>

              {/* One-Click Direct Install Card if browser prompt is ready */}
              {deferredPrompt && (
                <div className="pwa-direct-install-box">
                  <div className="pwa-direct-copy">
                    <h4>
                      <Rocket size={15} /> One-Click Install Ready
                    </h4>
                    <p>Your browser supports direct installation without navigating menus.</p>
                  </div>
                  <button
                    type="button"
                    className="pwa-direct-install-btn"
                    onClick={handleDirectInstall}
                  >
                    <Download size={14} />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              <div className="pwa-method-divider">
                <span>Method 1: Address Bar (Quickest)</span>
              </div>

              <div className="pwa-step-item">
                <span className="pwa-step-number">1</span>
                <div className="pwa-step-content">
                  In Chrome, Edge, or Brave, look at the right side of the address bar for the
                  <span className="pwa-step-badge">
                    <Download size={11} /> Install App
                  </span>
                  icon (next to the bookmark star).
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-number">2</span>
                <div className="pwa-step-content">
                  Click the icon and select <strong>Install</strong> to add <strong>Zero To Beyond</strong> directly to your desktop and Start Menu.
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
                  In <strong>Chrome / Brave</strong>: Click <strong>Save and share</strong> (or <em>More tools</em>) <ArrowRight size={11} className="inline mx-1" /> select <strong>Install Zero To Beyond...</strong> (or <em>Save page as app</em>).
                  <span className="pwa-step-subtext">
                    In <strong>Microsoft Edge</strong>: Click <strong>Apps</strong> <ArrowRight size={11} className="inline mx-1" /> <strong>Install Zero To Beyond</strong>.
                  </span>
                </div>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-number">3</span>
                <div className="pwa-step-content">
                  Click <strong>Install</strong>. A dedicated, distraction-free app window launches with 60FPS fullscreen performance!
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* ANDROID INSTRUCTIONS                                      */}
          {/* ========================================================== */}
          {activeTab === 'android' && (
            <div className="pwa-steps-list">
              {/* Fullscreen Exit Notice */}
              <div className="pwa-tip-banner">
                <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Important first step:</strong> If the game is currently fullscreen, <strong>swipe down from the very top of your phone screen</strong> to exit fullscreen and reveal Chrome’s top address bar and menu!
                </div>
              </div>

              {/* Direct Install Card if prompt ready */}
              {deferredPrompt && (
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
                    onClick={handleDirectInstall}
                  >
                    <Download size={14} />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

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
          )}

          {/* ========================================================== */}
          {/* APPLE IOS & IPADOS (SAFARI) INSTRUCTIONS                   */}
          {/* ========================================================== */}
          {activeTab === 'ios' && (
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
          )}

          {/* Aerospace Advantages Box */}
          <div className="pwa-perks-box">
            <div className="pwa-perk-card">
              <div className="pwa-perk-title">
                <Zap size={13} className="text-amber-400" />
                <span>Zero UI Clutter</span>
              </div>
              <div className="pwa-perk-desc">
                Full-bleed horizontal game viewport with zero browser navigation bars.
              </div>
            </div>

            <div className="pwa-perk-card">
              <div className="pwa-perk-title">
                <ShieldCheck size={13} className="text-cyan-400" />
                <span>Visuals Cached</span>
              </div>
              <div className="pwa-perk-desc">
                3D geometries, character art, and space textures stored offline.
              </div>
            </div>

            <div className="pwa-perk-card">
              <div className="pwa-perk-title">
                <Rocket size={13} className="text-purple-400" />
                <span>Instant Launch</span>
              </div>
              <div className="pwa-perk-desc">
                Immediate access directly from your desktop or phone home screen.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pwa-modal-footer">
          {deferredPrompt && (
            <button
              type="button"
              className="pwa-direct-install-btn"
              onClick={handleDirectInstall}
            >
              <Download size={15} />
              <span>Install Directly</span>
            </button>
          )}

          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleClose}
          >
            <CheckCircle2 size={14} className="inline mr-1 text-emerald-400" />
            <span>Got It</span>
          </button>
        </div>
      </div>
    </div>
  );
};
