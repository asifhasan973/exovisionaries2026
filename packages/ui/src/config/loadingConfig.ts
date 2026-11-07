/**
 * Configuration for loading screen pacing, intro splash duration, and test delays.
 * Values are retrieved from Vite environment variables (VITE_*) with zero-cost defaults.
 */

function parseEnvNumber(val: unknown, fallback: number): number {
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return fallback;
}

export const LOADING_CONFIG = {
  /**
   * Multiplier mechanism to simulate weak network conditions by slowing down
   * progress bar loading X times (default: 1).
   * E.g. set to 2 to make progress bar loading 2x slower, 3 for 3x slower.
   */
  progressMultiplier: (() => {
    const directMultiplier = parseEnvNumber(
      import.meta.env.VITE_LOADING_PROGRESS_MULTIPLIER ?? import.meta.env.VITE_PROGRESS_MULTIPLIER,
      0
    );
    if (directMultiplier > 0) return directMultiplier;

    return 1;
  })(),

  /** Minimum duration in milliseconds each carousel slide remains active (default: 2800) */
  slideDisplayMinMs: parseEnvNumber(import.meta.env.VITE_SLIDE_DISPLAY_MIN_MS, 2800),

  /** Display duration in milliseconds for the pitch-black intro splash text (default: 2800) */
  introSplashDisplayMs: parseEnvNumber(import.meta.env.VITE_INTRO_SPLASH_DISPLAY_MS, 2800),
};
