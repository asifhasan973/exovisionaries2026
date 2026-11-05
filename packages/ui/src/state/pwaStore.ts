import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PwaPlatform = 'ios' | 'android' | 'desktop';

export interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  isModalOpen: boolean;
  platform: PwaPlatform;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setInstalled: (installed: boolean) => void;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  promptInstall: () => Promise<void>;
}

function detectPlatform(): PwaPlatform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent;
  // iOS / iPadOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  // Android detection
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function checkIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isAndroidApp = document.referrer?.startsWith('android-app://') || false;
  return isStandalone || isIOSStandalone || isAndroidApp;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: typeof window !== 'undefined' ? checkIsInstalled() : false,
  canInstall: typeof window !== 'undefined' ? !checkIsInstalled() : true,
  isModalOpen: false,
  platform: detectPlatform(),

  setDeferredPrompt: (prompt) => {
    set({ deferredPrompt: prompt, canInstall: !get().isInstalled });
  },

  setInstalled: (installed) => {
    set({ isInstalled: installed, canInstall: !installed, deferredPrompt: null, isModalOpen: false });
  },

  openInstallModal: () => {
    if (get().isInstalled) return;
    set({ isModalOpen: true });
  },

  closeInstallModal: () => {
    set({ isModalOpen: false });
  },

  promptInstall: async () => {
    const { isInstalled, deferredPrompt } = get();
    // Event-based guard: Never prompt if already installed
    if (isInstalled) return;

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          set({
            isInstalled: true,
            canInstall: false,
            deferredPrompt: null,
            isModalOpen: false,
          });
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
        set({ isModalOpen: true });
      }
    } else {
      // Smart Fallback: Open step-by-step guidance modal (especially for iOS Safari or desktop)
      set({ isModalOpen: true });
    }
  },
}));

// Initialize event listeners once at runtime
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    usePwaStore.getState().setDeferredPrompt(e as BeforeInstallPromptEvent);
  });

  window.addEventListener('appinstalled', () => {
    usePwaStore.getState().setInstalled(true);
  });

  try {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        usePwaStore.getState().setInstalled(true);
      }
    });
  } catch {
    // Ignore unsupported matchMedia listeners
  }
}
