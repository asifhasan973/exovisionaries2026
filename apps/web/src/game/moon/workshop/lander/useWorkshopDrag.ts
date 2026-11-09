import { useEffect, useRef, useState } from "react";
import { sound } from "@exo/audio";

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
  const dropZone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cancel = () => {
      drag.current = null;
      setDragging(null);
    };
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);

  const onPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;

    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const targetElement = event.currentTarget;

    try {
      targetElement.setPointerCapture(pointerId);
    } catch {
      // Ignore if pointer capture fails
    }

    drag.current = {
      id,
      startX,
      startY,
      pointerId,
      isDragging: false,
      targetElement,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    const dist = Math.hypot(dx, dy);

    if (!active.isDragging) {
      if (dist > 4) {
        active.isDragging = true;
        suppressClick.current = true;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {
            /* ignore */
          }
        }
        sound.setMuted(!effects);
        sound.playSnap();
        setDragging({ id: active.id, x: event.clientX, y: event.clientY });
      }
      return;
    }

    suppressClick.current = true;
    setDragging({ id: active.id, x: event.clientX, y: event.clientY });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    if (active.isDragging) {
      suppressClick.current = true;
      const bounds = dropZone.current?.getBoundingClientRect();
      if (bounds) {
        const inside =
          event.clientX >= bounds.left - 50 &&
          event.clientX <= bounds.right + 70 &&
          event.clientY >= bounds.top - 60 &&
          event.clientY <= bounds.bottom + 60;
        if (inside) {
          onInstall(active.id);
        } else {
          onMiss();
        }
      }
    }

    if (
      active.targetElement &&
      active.targetElement.hasPointerCapture(event.pointerId)
    ) {
      try {
        active.targetElement.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    drag.current = null;
    setDragging(null);
  };

  const onPointerCancel = () => {
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
