import { useEffect, useRef, useState } from 'react';
import { sound } from '@exo/audio';

export interface WorkshopDragState {
  id: string;
  x: number;
  y: number;
}

interface DragMetadata {
  id: string;
  startX: number;
  startY: number;
  pointerId: number;
  isDragging: boolean;
  targetElement: HTMLElement | null;
}

export function useWorkshopDrag({
  effects,
  onInstall,
  onMiss,
}: {
  effects: boolean;
  onInstall: (id: string) => void;
  onMiss: () => void;
}) {
  const [dragging, setDragging] = useState<WorkshopDragState | null>(null);
  const drag = useRef<DragMetadata | null>(null);
  const suppressClick = useRef(false);
  const touchMoved = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const dropZone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cancel = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      drag.current = null;
      setDragging(null);
    };
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('blur', cancel);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;
    touchMoved.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const targetElement = event.currentTarget;

    drag.current = {
      id,
      startX,
      startY,
      pointerId,
      isDragging: false,
      targetElement,
    };

    if (event.pointerType === 'touch') {
      longPressTimer.current = window.setTimeout(() => {
        if (drag.current && drag.current.pointerId === pointerId && !touchMoved.current) {
          drag.current.isDragging = true;
          suppressClick.current = true;
          if (navigator.vibrate) {
            try { navigator.vibrate(40); } catch { /* ignore */ }
          }
          sound.setMuted(!effects);
          sound.playSnap();
          setDragging({ id, x: startX, y: startY });
          try {
            targetElement.setPointerCapture(pointerId);
          } catch { /* ignore */ }
        }
      }, 200);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    const dist = Math.hypot(dx, dy);

    if (!active.isDragging) {
      if (event.pointerType === 'mouse') {
        if (dist > 5) {
          active.isDragging = true;
          suppressClick.current = true;
          try {
            active.targetElement?.setPointerCapture(event.pointerId);
          } catch { /* ignore */ }
          setDragging({ id: active.id, x: event.clientX, y: event.clientY });
        }
      } else {
        if (dist > 8) {
          touchMoved.current = true;
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
      }
      return;
    }

    suppressClick.current = true;
    setDragging({ id: active.id, x: event.clientX, y: event.clientY });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    if (active.isDragging) {
      suppressClick.current = true;
      const bounds = dropZone.current?.getBoundingClientRect();
      if (bounds) {
        const inside = event.clientX >= bounds.left - 45 &&
                       event.clientX <= bounds.right + 65 &&
                       event.clientY >= bounds.top - 65 &&
                       event.clientY <= bounds.bottom + 65;
        if (inside) {
          onInstall(active.id);
        } else {
          onMiss();
        }
      }
    }

    drag.current = null;
    setDragging(null);
    if (active.targetElement && active.targetElement.hasPointerCapture(event.pointerId)) {
      try {
        active.targetElement.releasePointerCapture(event.pointerId);
      } catch { /* ignore */ }
    }
  };

  const onPointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    suppressClick.current = true;
    drag.current = null;
    setDragging(null);
  };

  return {
    dropZone,
    dragging,
    drag,
    suppressClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}

