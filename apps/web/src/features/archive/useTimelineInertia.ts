import { useRef, useState, useEffect } from "react";

export interface UseTimelineInertiaOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  snapToNearestYear: (targetYearIdx?: number, playAudio?: boolean) => void;
}

export function useTimelineInertia({
  containerRef,
  snapToNearestYear,
}: UseTimelineInertiaOptions) {
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const hasMovedDrag = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const scrollLeftStart = useRef<number>(0);
  const velocitySamples = useRef<{ time: number; x: number }[]>([]);
  const momentumAnimId = useRef<number | null>(null);
  const wheelDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopInertia = () => {
    if (momentumAnimId.current) {
      cancelAnimationFrame(momentumAnimId.current);
      momentumAnimId.current = null;
    }
    if (wheelDebounce.current) {
      clearTimeout(wheelDebounce.current);
      wheelDebounce.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    stopInertia();
    if (!containerRef.current) return;
    isDragging.current = true;
    setIsDraggingState(true);
    hasMovedDrag.current = false;
    startX.current = e.clientX;
    scrollLeftStart.current = containerRef.current.scrollLeft;
    velocitySamples.current = [{ time: performance.now(), x: e.clientX }];
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    containerRef.current.scrollLeft += delta;

    if (wheelDebounce.current) clearTimeout(wheelDebounce.current);
    wheelDebounce.current = setTimeout(() => {
      snapToNearestYear(undefined, false);
    }, 130);
  };

  useEffect(() => {
    const onGlobalPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 5) {
        hasMovedDrag.current = true;
      }
      containerRef.current.scrollLeft = scrollLeftStart.current - dx;

      const now = performance.now();
      velocitySamples.current.push({ time: now, x: e.clientX });
      if (velocitySamples.current.length > 5) {
        velocitySamples.current.shift();
      }
    };

    const onGlobalPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsDraggingState(false);

      const samples = velocitySamples.current;
      if (samples.length >= 2 && containerRef.current) {
        const last = samples[samples.length - 1];
        const first = samples[0];
        const dt = last.time - first.time;
        const dx = last.x - first.x;
        const vx = dt > 0 ? -(dx / dt) * 15 : 0;

        if (Math.abs(vx) > 2 && Math.abs(dx) > 8) {
          let currentVx = vx;
          const friction = 0.92;

          const stepMomentum = () => {
            if (!containerRef.current || isDragging.current) return;
            containerRef.current.scrollLeft += currentVx;
            currentVx *= friction;

            if (Math.abs(currentVx) < 1.0) {
              snapToNearestYear(undefined, true);
              return;
            }
            momentumAnimId.current = requestAnimationFrame(stepMomentum);
          };

          momentumAnimId.current = requestAnimationFrame(stepMomentum);
        } else {
          snapToNearestYear(undefined, true);
        }
      } else {
        snapToNearestYear(undefined, true);
      }
    };

    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", onGlobalPointerMove);
      window.removeEventListener("pointerup", onGlobalPointerUp);
      window.removeEventListener("pointercancel", onGlobalPointerUp);
    };
  }, [containerRef, snapToNearestYear]);

  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, []);

  return {
    isDragging: isDraggingState,
    hasMovedDrag,
    handlePointerDown,
    handleWheel,
    stopInertia,
  };
}
