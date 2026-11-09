import React, { useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, RotateCcw, ArrowUpRight } from "lucide-react";
import { NASA_MISSION_EVENTS, NASA_BUBBLE_PLACEHOLDER } from "@exo/engine";
import { sound } from "@exo/audio";
import { useOrientationLifecycleStore } from "@exo/ui";

interface TimelineSliderProps {
  onSelectYear: (year: number, eventId?: string) => void;
  selectedYear: number | null;
  isVisible: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const archiveYears = [
  ...new Set([...NASA_MISSION_EVENTS.map((event) => event.year), CURRENT_YEAR]),
].sort((a, b) => a - b);

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  onSelectYear,
  isVisible,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<number, HTMLElement>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const scrollPosition = useRef(0);
  const activeYearRef = useRef(CURRENT_YEAR);
  const lastTickAt = useRef(0);
  const [activeYear, setActiveYear] = useState(CURRENT_YEAR);
  const isFrozen = useOrientationLifecycleStore((state) => state.isFrozen);

  const goToYear = (year: number) => {
    const viewport = viewportRef.current;
    const row = rowRefs.current.get(year);
    if (!viewport || !row) return;
    viewport.scrollTop =
      row.offsetTop + row.offsetHeight / 2 - viewport.clientHeight / 2;
    scrollPosition.current = viewport.scrollTop;
  };

  useLayoutEffect(() => {
    goToYear(CURRENT_YEAR);
    const observer = new ResizeObserver(() => goToYear(activeYearRef.current));
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (isVisible && !isFrozen)
      returnFocusRef.current?.focus({ preventScroll: true });
  }, [isVisible, isFrozen]);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (useOrientationLifecycleStore.getState().isFrozen || !isVisible) {
      viewport.scrollTop = scrollPosition.current;
      return;
    }
    scrollPosition.current = viewport.scrollTop;
    const center = viewport.scrollTop + viewport.clientHeight / 2;
    let nearest = CURRENT_YEAR;
    let distance = Infinity;
    rowRefs.current.forEach((row, year) => {
      const delta = Math.abs(row.offsetTop + row.offsetHeight / 2 - center);
      if (delta < distance) {
        nearest = year;
        distance = delta;
      }
    });
    if (nearest !== activeYearRef.current) {
      activeYearRef.current = nearest;
      setActiveYear(nearest);
      const now = performance.now();
      if (sound.getArchiveActive() && now - lastTickAt.current > 100) {
        sound.playTimelineSlideTick(0.6);
        lastTickAt.current = now;
      }
    }
  };

  const selectMission = (year: number, eventId?: string) => {
    if (useOrientationLifecycleStore.getState().isFrozen) return;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    sound.playPop();
    navigator.vibrate?.(8);
    onSelectYear(year, eventId);
  };

  return (
    <div
      className={`nasa-timeline-slider-wrapper ${isVisible ? "is-visible" : "is-slid-up"} ${isFrozen ? "is-suspended" : ""}`}
      inert={!isVisible || isFrozen}
    >
      <div className="archive-scroll-guide">
        <ArrowUp size={15} /> Scroll up to travel back in time
      </div>
      <div
        ref={viewportRef}
        className={`archive-timeline-viewport ${isFrozen ? "is-frozen" : ""}`}
        tabIndex={0}
        role="region"
        aria-label="Mission timeline. Scroll up for older missions, down for newer missions."
        onScroll={handleScroll}
      >
        <div className="archive-timeline-track">
          {archiveYears.map((year) => {
            const events = NASA_MISSION_EVENTS.filter(
              (event) => event.year === year,
            );
            return (
              <section
                key={year}
                ref={(node) => {
                  if (node) rowRefs.current.set(year, node);
                  else rowRefs.current.delete(year);
                }}
                className={`archive-year-row ${activeYear === year ? "is-current-focus" : ""}`}
                aria-label={`${year} missions`}
              >
                {[0, 1].map((side) => (
                  <div
                    key={side}
                    className={`archive-mission-side ${side === 0 ? "side-left" : "side-right"}`}
                  >
                    {events
                      .filter((_, index) => index % 2 === side)
                      .map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          className="archive-mission-image"
                          onClick={() => selectMission(year, event.id)}
                          aria-label={`View ${event.title}`}
                        >
                          <img
                            src={event.thumbnail || NASA_BUBBLE_PLACEHOLDER}
                            alt=""
                            draggable={false}
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = NASA_BUBBLE_PLACEHOLDER;
                            }}
                          />
                          <span className="archive-image-caption">
                            <small>{event.category}</small>
                            <strong>{event.title}</strong>
                            <span>
                              Explore mission <ArrowUpRight size={15} />
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                ))}
                <button
                  type="button"
                  className="archive-year-marker"
                  onClick={() => selectMission(year)}
                >
                  <span>{year}</span>
                  {year === CURRENT_YEAR && <small>NOW</small>}
                  {year > CURRENT_YEAR && <small>UPCOMING</small>}
                </button>
              </section>
            );
          })}
        </div>
      </div>
      <nav
        className="archive-timeline-controls"
        aria-label="Timeline navigation"
      >
        <button
          type="button"
          onClick={() =>
            goToYear(
              archiveYears[Math.max(0, archiveYears.indexOf(activeYear) - 1)],
            )
          }
          aria-label="Older missions"
        >
          <ArrowUp size={18} />
        </button>
        <span aria-live="polite">{activeYear}</span>
        <button
          type="button"
          onClick={() =>
            goToYear(
              archiveYears[
                Math.min(
                  archiveYears.length - 1,
                  archiveYears.indexOf(activeYear) + 1,
                )
              ],
            )
          }
          aria-label="Newer missions"
        >
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          className="archive-return-now"
          onClick={() => goToYear(CURRENT_YEAR)}
        >
          <RotateCcw size={15} /> Back to {CURRENT_YEAR}
        </button>
      </nav>
    </div>
  );
};
