import { create } from 'zustand';
import type { LoadingSlide, LoadingState, LoadingContext } from '../types/loading';
import rawSlides from '../data/loadingSlides.json';
import { shouldShowIntroSplash, markIntroSplashSeen } from '../engine/loadingEngine.ts';
import { preloadEntrySubsystems, preloadMissionSubsystems } from '../engine/assetPreloader.ts';

const slidesData: LoadingSlide[] = rawSlides as LoadingSlide[];

// Determine intro splash status synchronously at module initialization
const initialShowSplash = typeof window !== 'undefined' ? shouldShowIntroSplash() : false;
let loadingGeneration = 0;

export const useLoadingStore = create<LoadingState>((set, get) => ({
  // Initialize to true on boot to prevent any 1-frame background screen flash
  isLoading: true,
  isPaused: false,
  progress: 0,
  currentSlideIndex: 0,
  showIntroSplash: initialShowSplash,
  activeContext: 'landing',
  statusMessage: initialShowSplash ? 'Synchronizing mission control…' : 'Initializing flight systems…',
  slides: slidesData,
  pendingTasks: [],

  startLoading: async (context: LoadingContext = 'landing', initialMessage?: string) => {
    const generation = ++loadingGeneration;
    const isLanding = context === 'landing';
    const showSplash = isLanding && shouldShowIntroSplash();

    set({
      isLoading: true,
      progress: 0,
      currentSlideIndex: 0,
      showIntroSplash: showSplash,
      activeContext: context,
      statusMessage: initialMessage ?? (showSplash ? 'Synchronizing mission control…' : 'Loading mission assets…'),
      pendingTasks: [],
    });

    const onProgress = (percent: number, msg: string) => {
      // Background engineered preloading continues spinning unhindered during orientation block
      if (generation === loadingGeneration) get().updateProgress(percent, msg);
    };

    try {
      if (isLanding) {
        await preloadEntrySubsystems(onProgress);
      } else {
        await preloadMissionSubsystems(onProgress);
      }

      // Also await any externally registered background tasks
      const extraTasks = get().pendingTasks;
      if (extraTasks.length > 0) {
        onProgress(98, 'Finalizing mission parameters…');
        await Promise.allSettled(extraTasks);
      }

      onProgress(100, 'All systems nominal · Ready for flight');
    } catch (err) {
      console.warn('Subsystem preloader exception:', err);
      onProgress(100, 'Some assets unavailable · Continue with fallback views');
    }
  },

  updateProgress: (progress: number, message?: string) => {
    set(state => ({
      progress: Math.min(100, Math.max(0, Math.round(progress))),
      statusMessage: message ?? state.statusMessage,
    }));
  },

  nextSlide: () => {
    set(state => {
      const nextIndex = (state.currentSlideIndex + 1) % state.slides.length;
      return { currentSlideIndex: nextIndex };
    });
  },

  setPaused: (paused: boolean) => {
    set({ isPaused: paused });
  },

  completeLoading: () => {
    set({
      isLoading: false,
      progress: 100,
      showIntroSplash: false,
      pendingTasks: [],
    });
  },

  registerLoaderTask: (task: Promise<unknown>) => {
    set(state => ({
      pendingTasks: [...state.pendingTasks, task],
    }));
  },

  setIntroSplashShown: () => {
    markIntroSplashSeen();
    set({ showIntroSplash: false });
  },
}));
