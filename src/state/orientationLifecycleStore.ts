import { create } from 'zustand';
import { sound } from '../audio/soundEngine';
import { useLoadingStore } from './loadingStore';

export interface OrientationLifecycleState {
  isFrozen: boolean;
  frozenAt: number | null;
  totalPausedDurationMs: number;
  isOrientationBlocked: boolean;
  isLoadingBlocked: boolean;
  setOrientationBlocked: (blocked: boolean) => void;
  setLoadingBlocked: (blocked: boolean) => void;
  freezeAll: () => void;
  resumeAll: () => void;
}

export const useOrientationLifecycleStore = create<OrientationLifecycleState>((set, get) => {
  const evaluate = (isOrientationBlocked: boolean, isLoadingBlocked: boolean) => {
    const shouldFreeze = isOrientationBlocked || isLoadingBlocked;
    const currentState = get();

    if (shouldFreeze && !currentState.isFrozen) {
      // ENTER FROZEN STATE
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      set({
        isFrozen: true,
        frozenAt: now,
      });

      // 1. Notify loading store to pause visual progression ONLY if orientation is blocked
      if (isOrientationBlocked) {
        useLoadingStore.getState().setPaused(true);
      }

      // 2. Halt Web Audio hardware process in-place
      sound.pauseAll();

      // Notify audio elements and simulations through the shared lifecycle event.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-orientation-pause', { detail: { frozenAt: now } }));
      }
    } else if (!shouldFreeze && currentState.isFrozen) {
      // EXIT FROZEN STATE
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const pauseDelta = currentState.frozenAt !== null ? Math.max(0, now - currentState.frozenAt) : 0;

      set({
        isFrozen: false,
        frozenAt: null,
        totalPausedDurationMs: currentState.totalPausedDurationMs + pauseDelta,
      });

      // 1. Notify loading store to resume visual progression
      useLoadingStore.getState().setPaused(false);

      // 2. Resume Web Audio hardware process
      sound.resumeAll();

      // Subscribers replay narration and resume simulations after all blocks clear.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-orientation-resume', { detail: { resumedAt: now, pauseDelta } }));
      }
    } else if (currentState.isFrozen) {
      // If already frozen, update loading store pause status if orientation block changed
      if (isOrientationBlocked) {
        useLoadingStore.getState().setPaused(true);
      } else {
        useLoadingStore.getState().setPaused(false);
      }
    }
  };

  return {
    isFrozen: false,
    frozenAt: null,
    totalPausedDurationMs: 0,
    isOrientationBlocked: false,
    isLoadingBlocked: false,

    setOrientationBlocked: (blocked: boolean) => {
      set({ isOrientationBlocked: blocked });
      evaluate(blocked, get().isLoadingBlocked);
    },

    setLoadingBlocked: (blocked: boolean) => {
      set({ isLoadingBlocked: blocked });
      evaluate(get().isOrientationBlocked, blocked);
    },

    freezeAll: () => {
      get().setOrientationBlocked(true);
    },

    resumeAll: () => {
      get().setOrientationBlocked(false);
    },
  };
});

// Synchronize automatically with useLoadingStore
if (typeof window !== 'undefined') {
  // Sync on startup: if app starts in loading state, freeze the engine
  const initialLoading = useLoadingStore.getState().isLoading;
  if (initialLoading) {
    useOrientationLifecycleStore.getState().setLoadingBlocked(true);
  }

  // Subscribe to subsequent loading state changes
  useLoadingStore.subscribe((state, prevState) => {
    if (state.isLoading !== prevState.isLoading) {
      useOrientationLifecycleStore.getState().setLoadingBlocked(state.isLoading);
    }
  });
}

/**
 * Synchronous query to check if the game engine is currently frozen by the orientation lock.
 * Useful in non-React animation loops, event handlers, and audio triggers.
 */
export function isEngineFrozen(): boolean {
  return useOrientationLifecycleStore.getState().isFrozen;
}

/**
 * Helper to obtain the timestamp at which the last freeze occurred.
 */
export function getFrozenTimestamp(): number | null {
  return useOrientationLifecycleStore.getState().frozenAt;
}
