import { useOrientationLifecycleStore, isEngineFrozen } from './orientationLifecycleStore';

export const useOrientationStore = useOrientationLifecycleStore;

/**
 * Synchronously returns whether the screen orientation is currently blocked by OrientationGuard.
 */
export const isOrientationBlocked = isEngineFrozen;

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
