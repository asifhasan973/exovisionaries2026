import { create } from "zustand";
import type {
  LoadingSlide,
  LoadingState,
  LoadingContext,
} from "../types/loading";
import rawSlides from "../config/loadingSlides.json";
import { shouldShowIntroSplash, markIntroSplashSeen } from "@exo/engine";

export interface PreloaderHandlers {
  preloadEntry?: (
    onProgress: (percent: number, msg: string) => void,
  ) => Promise<void>;
  preloadMission?: (
    onProgress: (percent: number, msg: string) => void,
  ) => Promise<void>;
}

let activePreloaderHandlers: PreloaderHandlers = {};

export function registerPreloaderHandlers(handlers: PreloaderHandlers) {
  activePreloaderHandlers = { ...activePreloaderHandlers, ...handlers };
}

const slidesData: LoadingSlide[] = rawSlides as LoadingSlide[];

const initialShowSplash =
  typeof window !== "undefined" ? shouldShowIntroSplash() : false;
let loadingGeneration = 0;

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: true,
  isPaused: false,
  progress: 0,
  currentSlideIndex: 0,
  showIntroSplash: initialShowSplash,
  activeContext: "landing",
  statusMessage: initialShowSplash
    ? "Synchronizing mission control…"
    : "Initializing flight systems…",
  slides: slidesData,
  pendingTasks: [],

  startLoading: async (
    context: LoadingContext = "landing",
    initialMessage?: string,
  ) => {
    const generation = ++loadingGeneration;
    const isLanding = context === "landing";
    const showSplash = isLanding && shouldShowIntroSplash();

    set({
      isLoading: true,
      progress: 0,
      currentSlideIndex: 0,
      showIntroSplash: showSplash,
      activeContext: context,
      statusMessage:
        initialMessage ??
        (showSplash
          ? "Synchronizing mission control…"
          : "Loading mission assets…"),
      pendingTasks: [],
    });

    const onProgress = (percent: number, msg: string) => {
      if (generation === loadingGeneration) get().updateProgress(percent, msg);
    };

    try {
      if (isLanding) {
        if (activePreloaderHandlers.preloadEntry) {
          await activePreloaderHandlers.preloadEntry(onProgress);
        } else {
          onProgress(50, "Loading core assets…");
          onProgress(100, "Subsystems ready");
        }
      } else {
        if (activePreloaderHandlers.preloadMission) {
          await activePreloaderHandlers.preloadMission(onProgress);
        } else {
          onProgress(50, "Initializing mission simulation…");
          onProgress(100, "Simulation ready");
        }
      }

      const extraTasks = get().pendingTasks;
      if (extraTasks.length > 0) {
        onProgress(98, "Finalizing mission parameters…");
        await Promise.allSettled(extraTasks);
      }

      onProgress(100, "All systems nominal · Ready for flight");
    } catch (err) {
      console.warn("Subsystem preloader exception:", err);
      onProgress(100, "Some assets unavailable · Continue with fallback views");
    }
  },

  updateProgress: (progress: number, message?: string) => {
    set((state) => ({
      progress: Math.min(100, Math.max(0, Math.round(progress))),
      statusMessage: message ?? state.statusMessage,
    }));
  },

  nextSlide: () => {
    set((state) => {
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
    set((state) => ({
      pendingTasks: [...state.pendingTasks, task],
    }));
  },

  setIntroSplashShown: () => {
    markIntroSplashSeen();
    set({ showIntroSplash: false });
  },
}));
