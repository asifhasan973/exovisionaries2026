import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '@exo/audio';

const PILL_POS_STORAGE_KEY = 'zero_to_beyond_debug_pill_pos';

export interface PillPosition {
  x: number;
  y: number;
  dockSide?: 'left' | 'right' | 'top' | 'bottom';
}

export function getDefaultPosition(): PillPosition {
  if (typeof window === 'undefined') return { x: 20, y: 10 };
  const pillApproxWidth = 160;
  return {
    x: Math.max(10, Math.round((window.innerWidth - pillApproxWidth) / 2)),
    y: 10,
    dockSide: 'top',
  };
}

export function loadSavedPosition(): PillPosition {
  if (typeof window === 'undefined') return getDefaultPosition();
  try {
    const raw = localStorage.getItem(PILL_POS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const padding = 10;
        const pillWidth = 175;
        const pillHeight = 36;
        const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
        const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);
        return {
          x: Math.max(padding, Math.min(maxX, parsed.x)),
          y: Math.max(padding, Math.min(maxY, parsed.y)),
          dockSide: parsed.dockSide,
        };
      }
    }
  } catch {}
  return getDefaultPosition();
}

export function useDraggablePill(onOpen: () => void) {
  const [position, setPosition] = useState<PillPosition>(loadSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);

  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);

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
    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };
  }, [position.x, position.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session) return;

    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;

    if (!session.moved && Math.hypot(dx, dy) > 5) {
      session.moved = true;
      setIsDragging(true);
    }

    if (session.moved) {
      const pillWidth = pillRef.current?.offsetWidth || 175;
      const pillHeight = pillRef.current?.offsetHeight || 36;
      const padding = 8;
      const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
      const maxY = Math.max(padding, window.innerHeight - pillHeight - padding);

      const nextX = Math.max(padding, Math.min(maxX, session.initialX + dx));
      const nextY = Math.max(padding, Math.min(maxY, session.initialY + dy));
      setPosition({ x: nextX, y: nextY });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const session = dragSessionRef.current;
    if (!session) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (session.moved) {
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
    } else {
      try {
        sound.playClick();
      } catch {}
      onOpen();
    }

    dragSessionRef.current = null;
    setIsDragging(false);
  }, [position.x, position.y, onOpen]);

  const handlePointerCancel = useCallback(() => {
    dragSessionRef.current = null;
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
    pillRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetPillPosition,
  };
}

