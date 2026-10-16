import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { RotateCw, Sparkles, Expand, Compass } from 'lucide-react';
import './orientationGuard.css';

interface OrientationGuardProps {
  children?: ReactNode;
  /** Optional flag to force testing the blocker in desktop devtools */
  forceBlock?: boolean;
}

/**
 * Accurately determines if the current device/viewport is in landscape orientation.
 */
export function checkIsLandscape(): boolean {
  if (typeof window === 'undefined') return true;

  // 1. Direct viewport aspect ratio check (reliable across all browsers and window resizes)
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  const isViewportLandscape = width > height;

  // 2. CSS Media query check
  const mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: landscape)') : null;
  const isMediaLandscape = mediaQuery ? mediaQuery.matches : isViewportLandscape;

  // 3. Screen orientation API check (present on mobile devices and tablets)
  const screenType = window.screen?.orientation?.type;
  if (screenType) {
    const isScreenLandscape = screenType.startsWith('landscape');
    // For a game requiring landscape cockpit view, both screen and viewport must be landscape
    return isScreenLandscape && isViewportLandscape;
  }

  return isMediaLandscape && isViewportLandscape;
}

/**
 * OrientationGuard:
 * Blocks interaction and displays an aesthetic space-mission instruction screen
 * if the user is in portrait orientation.
 * 
 * Uses dynamic eventListeners on matchMedia, screen.orientation, resize, and orientationchange
 * to immediately detect mode changes without requiring page reload.
 */
export function OrientationGuard({ children, forceBlock = false }: OrientationGuardProps) {
  const [isLandscape, setIsLandscape] = useState(() => (forceBlock ? false : checkIsLandscape()));
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const updateOrientation = useCallback(() => {
    if (forceBlock) {
      setIsLandscape(false);
      return;
    }
    const current = checkIsLandscape();
    setIsLandscape(current);
  }, [forceBlock]);

  useEffect(() => {
    // Initial check
    updateOrientation();

    // Event listener 1: Media query change listener
    const mql = typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: landscape)') : null;
    const handleMqlChange = () => {
      updateOrientation();
      // Micro-check for mobile browsers that update dimensions slightly after the event
      requestAnimationFrame(updateOrientation);
      setTimeout(updateOrientation, 150);
    };

    if (mql) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleMqlChange);
      } else if (typeof (mql as unknown as { addListener: (cb: () => void) => void }).addListener === 'function') {
        (mql as unknown as { addListener: (cb: () => void) => void }).addListener(handleMqlChange);
      }
    }

    // Event listener 2: Screen Orientation API change
    const screenOrientation = window.screen?.orientation;
    const handleScreenChange = () => {
      updateOrientation();
      requestAnimationFrame(updateOrientation);
      setTimeout(updateOrientation, 150);
    };

    if (screenOrientation && typeof screenOrientation.addEventListener === 'function') {
      screenOrientation.addEventListener('change', handleScreenChange);
    }

    // Event listener 3: Window resize (desktop window resizing, mobile layout adjustments)
    const handleResize = () => {
      updateOrientation();
    };
    window.addEventListener('resize', handleResize);

    // Event listener 4: Window orientationchange (mobile devices tilt)
    const handleOrientationChange = () => {
      updateOrientation();
      requestAnimationFrame(updateOrientation);
      setTimeout(updateOrientation, 150);
      setTimeout(updateOrientation, 300);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (mql) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', handleMqlChange);
        } else if (typeof (mql as unknown as { removeListener: (cb: () => void) => void }).removeListener === 'function') {
          (mql as unknown as { removeListener: (cb: () => void) => void }).removeListener(handleMqlChange);
        }
      }

      if (screenOrientation && typeof screenOrientation.removeEventListener === 'function') {
        screenOrientation.removeEventListener('change', handleScreenChange);
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateOrientation]);

  // Request fullscreen and attempt programmatic orientation lock where supported
  const handleRequestLandscape = async () => {
    setFullscreenError(null);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      // Try orientation lock if supported
      const orientation = window.screen?.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
      }
    } catch {
      // In mobile Safari or unsupported contexts, orientation lock may throw; user rotating device handles it
      setFullscreenError('Please rotate your device manually or check screen rotation lock.');
    }
  };

  const isBlocked = !isLandscape;

  return (
    <>
      {/* Underlying game children: disabled and made inert while blocked to preserve state */}
      <div
        className={`orientation-guard-wrapper ${isBlocked ? 'is-blocked' : ''}`}
        inert={isBlocked ? true : undefined}
        aria-hidden={isBlocked}
      >
        {children}
      </div>

      {/* Fullscreen blocker overlay */}
      {isBlocked ? (
        <aside
          className="orientation-blocker-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="orientation-title"
          aria-describedby="orientation-desc"
        >
          {/* Cosmic background stars */}
          <div className="cosmic-starfield" aria-hidden="true">
            <span className="cosmic-star" />
            <span className="cosmic-star" />
            <span className="cosmic-star" />
            <span className="cosmic-star" />
            <span className="cosmic-star" />
            <span className="cosmic-star" />
          </div>

          <div className="orientation-card">
            {/* Top Mission Pill */}
            <div className="orientation-badge">
              <Compass size={14} />
              <span>Mission Flight Protocol</span>
            </div>

            {/* Visual Animated Device */}
            <div className="orientation-animation-stage" aria-hidden="true">
              <div className="pulse-radar-wave" />
              <div className="orbit-glow-ring" />
              <div className="rotating-device-wrapper">
                <div className="device-frame">
                  <div className="device-camera-notch" />
                  <div className="device-screen-preview">
                    <span className="device-rocket-icon">🚀</span>
                  </div>
                  <div className="device-home-pill" />
                </div>
              </div>
              <div className="turn-arrow-indicator">
                <RotateCw size={18} />
              </div>
            </div>

            {/* Instruction Heading and Message */}
            <h2 id="orientation-title">Rotate to Landscape Mode</h2>
            <p id="orientation-desc" className="orientation-instruction">
              Commander, the spacecraft flight deck and navigation systems require <strong>Landscape Orientation</strong>.
              Please turn your device sideways to continue your mission.
            </p>

            {/* Status indicator */}
            <div className="orientation-status-box" role="status">
              <span className="status-beacon" />
              <span>Portrait Mode Detected &bull; Game Paused</span>
            </div>

            {/* Action buttons */}
            <div className="orientation-actions">
              <button
                type="button"
                className="orientation-primary-btn"
                onClick={handleRequestLandscape}
                aria-label="Rotate and Switch to Fullscreen Landscape"
              >
                <Expand size={18} />
                <span>Enter Landscape Fullscreen</span>
              </button>

              {fullscreenError ? (
                <p className="orientation-hint" style={{ color: '#fca5a5' }}>
                  {fullscreenError}
                </p>
              ) : (
                <p className="orientation-hint">
                  <Sparkles size={12} color="#f5cf77" />
                  <span>If auto-rotate is disabled, unlock screen rotation in your control center.</span>
                </p>
              )}
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export default OrientationGuard;
