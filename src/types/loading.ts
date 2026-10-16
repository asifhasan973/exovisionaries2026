export interface LoadingSlide {
  id: string;
  image: string;
  title: string;
  caption: string;
  credit?: string;
  tag?: string;
}

export type LoadingContext = 'landing' | 'mission_start' | 'custom';

export interface LoadingState {
  isLoading: boolean;
  isPaused: boolean;
  progress: number;
  currentSlideIndex: number;
  showIntroSplash: boolean;
  activeContext: LoadingContext;
  statusMessage: string;
  slides: LoadingSlide[];
  pendingTasks: Promise<unknown>[];
  startLoading: (context?: LoadingContext, initialMessage?: string) => Promise<void>;
  updateProgress: (progress: number, message?: string) => void;
  nextSlide: () => void;
  setPaused: (paused: boolean) => void;
  completeLoading: () => void;
  registerLoaderTask: (task: Promise<unknown>) => void;
  setIntroSplashShown: () => void;
}
