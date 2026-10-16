/**
 * Cache storage identifier and inactivity expiration thresholds
 */
const ASSET_CACHE_NAME = 'exovisionaries-assets-v1';
const CACHE_LAST_ACTIVE_KEY = 'exovisionaries_cache_last_active_v1';
const INACTIVITY_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/** In-memory cache holding preloaded HTMLImageElements to guarantee instant slide switching */
const memoryImageCache = new Map<string, HTMLImageElement>();

/**
 * Initializes and manages the browser Cache Storage lifecycle,
 * automatically purging cached assets if inactive for longer than 7 days.
 */
export async function maintainBrowserAssetCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const now = Date.now();
    const lastActiveStr = window.localStorage.getItem(CACHE_LAST_ACTIVE_KEY);

    if (lastActiveStr) {
      const lastActive = Number(lastActiveStr);
      if (now - lastActive > INACTIVITY_EXPIRATION_MS) {
        // Cache has been inactive for more than 7 days: purge it
        await window.caches.delete(ASSET_CACHE_NAME);
      }
    }

    // Refresh last active timestamp
    window.localStorage.setItem(CACHE_LAST_ACTIVE_KEY, String(now));
  } catch {
    // Ignore restricted storage contexts
  }
}

/**
 * Fetches an asset and caches it into the Browser Cache Storage API.
 */
export async function cacheAssetInBrowser(url: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cache = await window.caches.open(ASSET_CACHE_NAME);
    const existing = await cache.match(url);
    if (!existing) {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response.clone());
      }
    }
  } catch {
    // Fall back gracefully if offline or CORS restricted
  }
}

/**
 * Preload an image into browser memory, trigger decode(), and cache both in Cache Storage and memory.
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  const cached = memoryImageCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  // Pre-cache in browser Cache API in the background
  cacheAssetInBrowser(src).catch(() => { });

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let settled = false;
    const finalize = () => {
      if (settled) return;
      settled = true;
      memoryImageCache.set(src, img);
      // If decode is supported, warmup texture decoding
      if (typeof img.decode === 'function') {
        img.decode().catch(() => { }).finally(() => resolve(img));
      } else {
        resolve(img);
      }
    };

    img.onload = finalize;
    img.onerror = finalize;

    // Safety fallback timeout: guarantee resolution within 4s so carousel never hangs
    setTimeout(finalize, 4000);

    img.src = src;
  });
}

/**
 * Check whether an image is already cached in memory.
 */
export function isImageCached(src: string): boolean {
  const cached = memoryImageCache.get(src);
  return Boolean(cached && cached.complete && cached.naturalWidth > 0);
}

/**
 * Generic evaluation of whether the text intro splash screen ("ExoVisionaries-2k26 Presents")
 * should be shown based on session state with daily calendar fallback.
 */
export function shouldShowIntroSplash(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Session check
    const sessionSeen = window.sessionStorage.getItem('exovisionaries_splash_session');
    if (sessionSeen === 'true') {
      return false;
    }

    // 2. Calendar day check
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = window.localStorage.getItem('exovisionaries_splash_date');
    if (lastDate === today) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

/**
 * Generic registration marking the intro splash as presented for session and daily fallback.
 */
export function markIntroSplashSeen(): void {
  if (typeof window === 'undefined') return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    window.sessionStorage.setItem('exovisionaries_splash_session', 'true');
    window.localStorage.setItem('exovisionaries_splash_date', today);
  } catch {
    // Ignore restricted quota
  }
}

/**
 * Reset intro splash state for testing or restart
 */
export function resetIntroSplash(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem('exovisionaries_splash_session');
    window.localStorage.removeItem('exovisionaries_splash_date');
  } catch { }
}
