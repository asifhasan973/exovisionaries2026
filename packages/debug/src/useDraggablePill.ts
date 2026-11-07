import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '@exo/audio';
import {
  type PillPosition,
  getDefaultPosition,
  loadSavedPosition,
  PILL_POS_STORAGE_KEY,
  PILL_COMPACT_STORAGE_KEY,
} from './pillStorage';

export type { PillPosition };
export { getDefaultPosition, loadSavedPosition };

export function useDraggablePill(onOpen: () => void) {
  const [position, setPosition] = useState<PillPosition>(loadSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PILL_COMPACT_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Keep pill clamped within screen bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const pillWidth = pillRef.current?.offsetWidth || 175;
        const pillHeight = pillRef.current?.offsetHeight || 36;
        const padding = 10;
        const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
        const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);
        return {
          ...prev,
          x: Math.max(padding, Math.min(maxX, prev.x)),
          y: Math.max(padding, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isLongPressRef.current = false;

    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      // Long press without movement: toggle width mode
      isLongPressRef.current = true;
      try {
        navigator.vibrate?.(25);
      } catch {}
      try {
        sound.playClick(620);
      } catch {}
      setIsCompact(prev => {
        const next = !prev;
        try {
          localStorage.setItem(PILL_COMPACT_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }, 350);
  }, [position.x, position.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session) return;

    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;

    // Movement past small drag threshold: drag immediately without long-press
    if (!session.moved) {
      if (Math.hypot(dx, dy) > 5) {
        session.moved = true;
        setIsDragging(true);
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      } else {
        return;
      }
    }

    const pillWidth = pillRef.current?.offsetWidth || 175;
    const pillHeight = pillRef.current?.offsetHeight || 36;
    const padding = 8;
    const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
    const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);

    const nextX = Math.max(padding, Math.min(maxX, session.initialX + dx));
    const nextY = Math.max(padding, Math.min(maxY, session.initialY + dy));
    setPosition({ x: nextX, y: nextY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const session = dragSessionRef.current;
    if (!session) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (session.moved) {
      // Drag completed: snap to nearest screen edge
      const pillWidth = pillRef.current?.offsetWidth || 175;
      const pillHeight = pillRef.current?.offsetHeight || 36;
      const padding = 12;
      const snapThreshold = 45;

      let finalX = position.x;
      let finalY = position.y;
      let dockSide: PillPosition['dockSide'];

      if (finalX < snapThreshold + padding) {
        finalX = padding;
        dockSide = 'left';
      } else if (finalX > window.innerWidth - pillWidth - padding - snapThreshold) {
        finalX = window.innerWidth - pillWidth - padding;
        dockSide = 'right';
      }

      if (finalY < snapThreshold + padding) {
        finalY = padding;
        if (!dockSide) dockSide = 'top';
      } else if (finalY > window.innerHeight - pillHeight - padding - snapThreshold) {
        finalY = window.innerHeight - pillHeight - padding;
        if (!dockSide) dockSide = 'bottom';
      }

      const updatedPos: PillPosition = { x: finalX, y: finalY, dockSide };
      setPosition(updatedPos);
      try {
        localStorage.setItem(PILL_POS_STORAGE_KEY, JSON.stringify(updatedPos));
      } catch {}
      try {
        navigator.vibrate?.(10);
      } catch {}
    } else if (!isLongPressRef.current) {
      // Clean single tap: open debug modal immediately
      try {
        sound.playClick(880);
      } catch {}
      onOpen();
    }

    dragSessionRef.current = null;
    isLongPressRef.current = false;
    setIsDragging(false);
  }, [position.x, position.y, onOpen]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    dragSessionRef.current = null;
    isLongPressRef.current = false;
    setIsDragging(false);
  }, []);

  const resetPillPosition = useCallback(() => {
    try {
      sound.playClick();
    } catch {}
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    try {
      localStorage.setItem(PILL_POS_STORAGE_KEY, JSON.stringify(defaultPos));
    } catch {}
  }, []);

  return {
    position,
    isDragging,
    isCompact,
    pillRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetPillPosition,
  };
}

