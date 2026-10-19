import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Compass, RotateCcw } from 'lucide-react';
import {
  buildTimelineYears,
  TimelineYearItem,
  TimelineBubble,
  NASA_MISSION_EVENTS,
  NASA_BUBBLE_PLACEHOLDER
} from '../../data/nasaArchiveData';
import { sound } from '../../audio/soundEngine';

interface TimelineSliderProps {
  onSelectYear: (year: number, eventId?: string) => void;
  selectedYear: number | null;
  isVisible: boolean;
}

// Dynamically compute boundary years from mission data and system date
const allEventYears = NASA_MISSION_EVENTS.map((e) => e.year);
const START_YEAR = Math.min(1958, ...allEventYears);
const CURRENT_YEAR = typeof window !== 'undefined' ? new Date().getFullYear() : 2026;
const END_YEAR = Math.max(CURRENT_YEAR + 4, ...allEventYears);

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  onSelectYear,
  selectedYear,
  isVisible
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [timelineYears] = useState<TimelineYearItem[]>(() => buildTimelineYears(START_YEAR, END_YEAR));
  const [activeCenterYear, setActiveCenterYear] = useState<number>(CURRENT_YEAR);
  const activeCenterYearRef = useRef<number>(CURRENT_YEAR);
  const [isMagnetDocked, setIsMagnetDocked] = useState<boolean>(true);
  const [brokenImgMap, setBrokenImgMap] = useState<Record<string, boolean>>({});

  // Dragging and inertia physics
  const isDragging = useRef<boolean>(false);
  const hasMovedDrag = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const scrollLeftStart = useRef<number>(0);
  const velocitySamples = useRef<{ time: number; x: number }[]>([]);
  const momentumAnimId = useRef<number | null>(null);
  const wheelDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sound triggering refs
  const lastSoundScrollLeft = useRef<number>(0);
  const lastSoundTime = useRef<number>(0);

  // Memoize alternating placement map for milestones (0=above, 1=below, 2=above...)
  const milestonePlacement = useMemo(() => {
    const map = new Map<number, boolean>();
    let count = 0;
    timelineYears.forEach((item) => {
      if (item.hasEvents) {
        map.set(item.year, count % 2 === 0); // true = above, false = below
        count++;
      }
    });
    return map;
  }, [timelineYears]);

  // Measure actual rendered column width from DOM to guarantee 100% responsive accuracy
  const getColWidth = useCallback(() => {
    if (trackRef.current) {
      const node = trackRef.current.querySelector<HTMLElement>('.timeline-year-node');
      if (node && node.offsetWidth > 0) {
        return node.offsetWidth;
      }
    }
    return (typeof window !== 'undefined' && window.innerHeight <= 450) ? 76 : 104;
  }, []);

  // Compute exact spacer width so year 0 is centered when scrollLeft = 0
  const [spacerWidth, setSpacerWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 300;
    const colW = window.innerHeight <= 450 ? 76 : 104;
    return Math.max(0, (window.innerWidth / 2) - (colW / 2));
  });

  const updateSpacerWidth = useCallback(() => {
    if (!containerRef.current) return;
    const colW = getColWidth();
    const halfWidth = containerRef.current.clientWidth / 2;
    setSpacerWidth(Math.max(0, halfWidth - (colW / 2)));
  }, [getColWidth]);

  // Synchronously update active year and magnetic dock status based on scroll position
  const updateCenterYear = useCallback(() => {
    if (!containerRef.current) return;
    const colWidth = getColWidth();
    const container = containerRef.current;
    const rawIdx = Math.round(container.scrollLeft / colWidth);
    const clampedIdx = Math.max(0, Math.min(timelineYears.length - 1, rawIdx));
    const yearItem = timelineYears[clampedIdx];

    if (yearItem && yearItem.year !== activeCenterYearRef.current) {
      activeCenterYearRef.current = yearItem.year;
      setActiveCenterYear(yearItem.year);
    }

    const distToCenter = Math.abs(container.scrollLeft - clampedIdx * colWidth);
    setIsMagnetDocked(distToCenter <= 10);
  }, [getColWidth, timelineYears]);

  // Playful game-tone sound generator on timeline scroll
  const handleScroll = () => {
    updateCenterYear();

    if (!isVisible || !containerRef.current || !sound.getArchiveActive()) return;
    const currentScroll = containerRef.current.scrollLeft;
    const now = performance.now();
    const delta = Math.abs(currentScroll - lastSoundScrollLeft.current);
    const timeDelta = now - lastSoundTime.current;

    // Trigger joyful pentatonic arpeggio chime every 14px of travel
    if (delta >= 14 && timeDelta >= 18) {
      const velocity = Math.min(3.0, Math.max(0.6, (delta / Math.max(1, timeDelta)) * 2.0));
      sound.playTimelineSlideTick(velocity);
      lastSoundScrollLeft.current = currentScroll;
      lastSoundTime.current = now;

      // Subtle haptic tick on supported mobile devices
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(3); } catch {}
      }
    }
  };

  // Magnetic snap helper to pull and stick the nearest year to the needle
  const snapToNearestYear = useCallback((targetYearIdx?: number, playAudio = true) => {
    if (!containerRef.current) return;
    const colW = getColWidth();
    const idx = targetYearIdx !== undefined
      ? targetYearIdx
      : Math.max(0, Math.min(timelineYears.length - 1, Math.round(containerRef.current.scrollLeft / colW)));
    const targetScroll = idx * colW;

    containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    if (playAudio) {
      sound.playMagneticSnap();
    }
    const targetYear = timelineYears[idx]?.year;
    if (targetYear) {
      activeCenterYearRef.current = targetYear;
      setActiveCenterYear(targetYear);
    }
    setIsMagnetDocked(true);
  }, [getColWidth, timelineYears]);

  // Jump to Current Year (2026) smoothly
  const jumpToCurrentYear = () => {
    const currentYearIdx = Math.max(0, CURRENT_YEAR - START_YEAR);
    snapToNearestYear(currentYearIdx, true);
  };

  // Step button navigation: Jump to the nearest milestone year having events in that direction
  const jumpToNearestMilestone = (direction: -1 | 1) => {
    if (!containerRef.current) return;
    const colWidth = getColWidth();
    const currentIdx = Math.max(0, Math.min(timelineYears.length - 1, Math.round(containerRef.current.scrollLeft / colWidth)));

    let targetIdx: number | null = null;
    if (direction === -1) {
      for (let i = currentIdx - 1; i >= 0; i--) {
        if (timelineYears[i].hasEvents) {
          targetIdx = i;
          break;
        }
      }
    } else {
      for (let i = currentIdx + 1; i < timelineYears.length; i++) {
        if (timelineYears[i].hasEvents) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx !== null) {
      sound.playClick(720);
      snapToNearestYear(targetIdx, true);
    } else {
      sound.playClick(440);
    }
  };

  // Run ONCE on mount: center on CURRENT_YEAR (2026) without being re-triggered by sliding!
  useEffect(() => {
    updateSpacerWidth();

    const frameId = requestAnimationFrame(() => {
      updateSpacerWidth();
      if (!containerRef.current) return;
      const colW = getColWidth();
      const currentYearIdx = Math.max(0, CURRENT_YEAR - START_YEAR);
      const targetScroll = currentYearIdx * colW;

      containerRef.current.scrollLeft = targetScroll;
      activeCenterYearRef.current = CURRENT_YEAR;
      setActiveCenterYear(CURRENT_YEAR);
      lastSoundScrollLeft.current = targetScroll;
      lastSoundTime.current = performance.now();
      setIsMagnetDocked(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [getColWidth, updateSpacerWidth]);

  // Ensure momentum and debounced sounds are strictly halted on unmount
  useEffect(() => {
    return () => {
      if (momentumAnimId.current) {
        cancelAnimationFrame(momentumAnimId.current);
        momentumAnimId.current = null;
      }
      if (wheelDebounce.current) {
        clearTimeout(wheelDebounce.current);
        wheelDebounce.current = null;
      }
    };
  }, []);

  // Responsive resize handler: uses ref to preserve current position without resetting to 2026!
  useEffect(() => {
    const handleResize = () => {
      updateSpacerWidth();
      if (!containerRef.current) return;
      const colW = getColWidth();
      const currentIdx = Math.max(0, activeCenterYearRef.current - START_YEAR);
      containerRef.current.scrollLeft = currentIdx * colW;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (momentumAnimId.current) cancelAnimationFrame(momentumAnimId.current);
      if (wheelDebounce.current) clearTimeout(wheelDebounce.current);
    };
  }, [getColWidth, updateSpacerWidth]);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent) => {
    if (momentumAnimId.current) {
      cancelAnimationFrame(momentumAnimId.current);
      momentumAnimId.current = null;
    }

    if (!containerRef.current) return;
    isDragging.current = true;
    hasMovedDrag.current = false;
    startX.current = e.clientX;
    scrollLeftStart.current = containerRef.current.scrollLeft;
    velocitySamples.current = [{ time: performance.now(), x: e.clientX }];
  };

  // Window-level pointer drag movement & release with magnetic snapping
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

    const onGlobalPointerUp = (_e: PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      // Calculate release momentum or immediate magnetic snap
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
              // As momentum naturally slows down, ease and dock into nearest year
              snapToNearestYear(undefined, true);
              return;
            }
            momentumAnimId.current = requestAnimationFrame(stepMomentum);
          };

          momentumAnimId.current = requestAnimationFrame(stepMomentum);
        } else {
          // Low velocity release: immediately magnetically snap to nearest year
          snapToNearestYear(undefined, true);
        }
      } else {
        snapToNearestYear(undefined, true);
      }
    };

    window.addEventListener('pointermove', onGlobalPointerMove);
    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalPointerMove);
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, [snapToNearestYear]);

  // Mouse wheel horizontal scroll with debounced magnetic attraction
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    containerRef.current.scrollLeft += delta;

    if (wheelDebounce.current) clearTimeout(wheelDebounce.current);
    wheelDebounce.current = setTimeout(() => {
      snapToNearestYear(undefined, false);
    }, 130);
  };

  // Safe click handlers that distinguish click from drag
  const handleYearClick = (year: number) => {
    if (hasMovedDrag.current) return;
    sound.playClick(680);
    const targetIdx = Math.max(0, year - START_YEAR);
    snapToNearestYear(targetIdx, false);
    onSelectYear(year);
  };

  const handleBubbleClick = (year: number, eventId?: string) => {
    if (hasMovedDrag.current) return;
    sound.playPop();
    const targetIdx = Math.max(0, year - START_YEAR);
    snapToNearestYear(targetIdx, false);
    onSelectYear(year, eventId);
  };

  // Render a single perfectly circular bubble with placeholder fallback
  const renderBubble = (bubble: TimelineBubble, year: number) => {
    if (bubble.isMore) {
      return (
        <button
          key={bubble.id}
          type="button"
          className="timeline-bubble bubble-more group"
          onClick={(e) => {
            e.stopPropagation();
            handleBubbleClick(year);
          }}
          title={`View all events for ${year}`}
        >
          <span className="bubble-dots">•••</span>
          <span className="bubble-more-count">+{bubble.moreCount}</span>
        </button>
      );
    }

    const isBroken = brokenImgMap[bubble.id];
    const imageSrc = !isBroken && bubble.thumbnail ? bubble.thumbnail : NASA_BUBBLE_PLACEHOLDER;

    return (
      <button
        key={bubble.id}
        type="button"
        className="timeline-bubble bubble-thumb group"
        onClick={(e) => {
          e.stopPropagation();
          handleBubbleClick(year, bubble.id);
        }}
        title={bubble.title || `NASA event in ${year}`}
      >
        <img
          src={imageSrc}
          alt={bubble.title || `NASA event in ${year}`}
          className="bubble-img"
          loading="eager"
          decoding="async"
          onError={() => {
            setBrokenImgMap((prev) => ({ ...prev, [bubble.id]: true }));
          }}
        />
        <span className="bubble-glow-ring" />
      </button>
    );
  };

  // Render bubbles stacked in a triangle
  const renderTriangleCluster = (bubbles: TimelineBubble[], year: number, isAbove: boolean) => {
    if (bubbles.length === 1) {
      return (
        <div className="bubble-cluster-single">
          {renderBubble(bubbles[0], year)}
        </div>
      );
    }

    if (bubbles.length === 2) {
      return (
        <div className="bubble-cluster-double">
          {renderBubble(bubbles[0], year)}
          {renderBubble(bubbles[1], year)}
        </div>
      );
    }

    // 3 bubbles in a triangle:
    if (isAbove) {
      return (
        <div className="bubble-cluster-triangle triangle-above">
          <div className="triangle-apex-row">
            {renderBubble(bubbles[0], year)}
          </div>
          <div className="triangle-base-row">
            {renderBubble(bubbles[1], year)}
            {renderBubble(bubbles[2], year)}
          </div>
        </div>
      );
    }

    return (
      <div className="bubble-cluster-triangle triangle-below">
        <div className="triangle-base-row">
          {renderBubble(bubbles[0], year)}
          {renderBubble(bubbles[1], year)}
        </div>
        <div className="triangle-apex-row">
          {renderBubble(bubbles[2], year)}
        </div>
      </div>
    );
  };

  return (
    <div className={`nasa-timeline-slider-wrapper ${isVisible ? 'is-visible' : 'is-slid-up'}`}>
      {/* Side Quick Step Buttons: Jump to nearest milestone in that direction */}
      <button
        type="button"
        className="timeline-step-btn step-prev"
        onClick={() => jumpToNearestMilestone(-1)}
        title="Jump to previous milestone event"
        aria-label="Previous timeline milestone"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        className="timeline-step-btn step-next"
        onClick={() => jumpToNearestMilestone(1)}
        title="Jump to next milestone event"
        aria-label="Next timeline milestone"
      >
        <ChevronRight size={20} />
      </button>

      {/* Main Draggable Timeline Viewport */}
      <div
        ref={containerRef}
        className={`timeline-viewport ${isDragging.current ? 'is-dragging' : ''}`}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
      >
        <div ref={trackRef} className="timeline-track">
          {/* Dynamic Leading Spacer: Centers year 0 (1958) dead-center when scrollLeft = 0 */}
          <div className="timeline-spacer-lead" style={{ width: spacerWidth }} />

          {timelineYears.map((item) => {
            const isMilestone = item.hasEvents;
            const isSelected = selectedYear === item.year;
            const isCenter = activeCenterYear === item.year;
            const isFuture = item.year > CURRENT_YEAR;
            const isAbove = milestonePlacement.get(item.year) ?? true;

            return (
              <div
                key={item.year}
                className={`timeline-year-node ${isMilestone ? 'has-events' : 'empty-year'} ${
                  isSelected ? 'is-selected' : ''
                } ${isCenter ? 'is-center' : ''} ${isFuture ? 'is-future' : ''} ${
                  isMilestone ? (isAbove ? 'placement-above' : 'placement-below') : ''
                }`}
              >
                {/* 1. UPPER ZONE (Above Timeline) */}
                <div className="timeline-zone zone-upper">
                  {isMilestone && isAbove && (
                    <div className="zone-bubble-container">
                      {renderTriangleCluster(item.bubbles, item.year, true)}
                      <div className="bubble-stem stem-downward" />
                    </div>
                  )}
                </div>

                {/* 2. RULER AXIS ZONE (Synchronized focused pointer + year labels + geometry markings) */}
                <div className="timeline-ruler-axis-zone">
                  {/* Continuous horizontal baseline */}
                  <div className="ruler-horizontal-baseline" />

                  {/* Geometry-box scale subdivision tick markings between years */}
                  <div className="ruler-subdivision-ticks" aria-hidden="true">
                    <span className="sub-tick tick-20" />
                    <span className="sub-tick tick-40" />
                    <span className="sub-tick tick-mid tick-50" />
                    <span className="sub-tick tick-60" />
                    <span className="sub-tick tick-80" />
                  </div>

                  {/* Primary Year Major Tick Mark */}
                  <div className={`ruler-major-tick ${isMilestone ? 'is-milestone-tick' : ''}`}>
                    <span className="major-tick-dot" />
                    <span className="major-tick-line" />
                  </div>

                  {/* Year Label Button (Synchronized on the exact same line/level!) */}
                  <button
                    type="button"
                    className={`timeline-year-btn ${item.year % 5 === 0 || isMilestone ? 'is-major' : 'is-minor'} ${
                      isCenter ? 'is-active-center' : ''
                    }`}
                    onClick={() => handleYearClick(item.year)}
                  >
                    <span className="year-digits">{item.year}</span>
                    {item.year === CURRENT_YEAR && (
                      <span className="year-current-badge">NOW</span>
                    )}
                    {isFuture && item.year === 2030 && (
                      <span className="year-future-badge">GATEWAY</span>
                    )}
                  </button>
                </div>

                {/* 3. LOWER ZONE (Below Timeline) */}
                <div className="timeline-zone zone-lower">
                  {isMilestone && !isAbove && (
                    <div className="zone-bubble-container">
                      <div className="bubble-stem stem-upward" />
                      {renderTriangleCluster(item.bubbles, item.year, false)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Dynamic Trailing Spacer: Centers future year (2030) dead-center at end of track */}
          <div className="timeline-spacer-tail" style={{ width: spacerWidth }} />
        </div>
      </div>

      {/* Synchronized Precision Center Reticle Pointer with Magnetic Dock State */}
      <div
        className={`timeline-synced-center-pointer ${isMagnetDocked ? 'is-magnet-docked' : ''}`}
        aria-hidden="true"
      >
        <div className="pointer-top-needle" />
        <div className="pointer-frame-bracket" />
        <div className="pointer-bottom-needle" />
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="timeline-footer-hud">
        <div className="hud-left-group">
          <span className="hud-pill">
            <Compass size={13} className="text-cyan-400" />
            <span>DRAG / SWIPE TO EXPLORE 72+ YEARS</span>
          </span>

          {/* Jump to Current Year Button: Shown ONLY when needle is away from current year! */}
          {activeCenterYear !== CURRENT_YEAR && (
            <button
              type="button"
              className="hud-jump-now-btn can-jump"
              onClick={jumpToCurrentYear}
              title={`Slide timeline back to current year (${CURRENT_YEAR})`}
              aria-label={`Jump back to current year ${CURRENT_YEAR}`}
            >
              <RotateCcw size={12} className="jump-icon" />
              <span>RETURN TO CURRENT YEAR ({CURRENT_YEAR})</span>
            </button>
          )}
        </div>

        <span className="hud-count-tag">
          {timelineYears.filter((y) => y.hasEvents).length} ARCHIVE MILESTONES LOADED
        </span>
      </div>
    </div>
  );
};
