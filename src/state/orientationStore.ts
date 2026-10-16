import { useOrientationLifecycleStore, isEngineFrozen } from './orientationLifecycleStore';

export const useOrientationStore = useOrientationLifecycleStore;

/**
 * Synchronously returns whether the screen orientation is currently blocked by OrientationGuard.
 */
export const isOrientationBlocked = isEngineFrozen;
