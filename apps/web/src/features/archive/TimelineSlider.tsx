import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildTimelineYears,
  type TimelineYearItem,
  NASA_MISSION_EVENTS,
} from '@exo/engine';
import { sound } from '@exo/audio';
import { useTimelineInertia } from './useTimelineInertia';
import { TimelineYearNode } from './TimelineYearNode';
import { TimelineFooterHud } from './TimelineNavHud';

interface TimelineSliderProps {
  onSelectYear: (year: number, eventId?: string) => void;
  selectedYear: number | null;
  isVisible: boolean;
}

const allEventYears = NASA_MISSION_EVENTS.map((e) => e.year);
const START_YEAR = Math.min(1958, ...allEventYears);
const CURRENT_YEAR = typeof window !== 'undefined' ? new Date().getFullYear() : 2026;
const END_YEAR = Math.max(CURRENT_YEAR + 4, ...allEventYears);

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  onSelectYear,
  selectedYear,
  isVisible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [timelineYears] = useState<TimelineYearItem[]>(() => buildTimelineYears(START_YEAR, END_YEAR));
  const [activeCenterYear, setActiveCenterYear] = useState<number>(CURRENT_YEAR);
  const activeCenterYearRef = useRef<number>(CURRENT_YEAR);
  const [isMagnetDocked, setIsMagnetDocked] = useState<boolean>(true);
  const [brokenImgMap, setBrokenImgMap] = useState<Record<string, boolean>>({});

  const lastSoundScrollLeft = useRef<number>(0);
  const lastSoundTime = useRef<number>(0);

  const milestonePlacement = useMemo(() => {
    const map = new Map<number, boolean>();
    let count = 0;
    timelineYears.forEach((item) => {
      if (item.hasEvents) {
        map.set(item.year, count % 2 === 0);
        count++;
      }
    });
    return map;
  }, [timelineYears]);

  const getColWidth = useCallback(() => {
    if (trackRef.current) {
      const node = trackRef.current.querySelector<HTMLElement>('.timeline-year-node');
      if (node && node.offsetWidth > 0) {
        return node.offsetWidth;
      }
    }
    return (typeof window !== 'undefined' && window.innerHeight <= 450) ? 76 : 104;
  }, []);

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

  const handleScroll = () => {
    updateCenterYear();

    if (!isVisible || !containerRef.current || !sound.getArchiveActive()) return;
    const currentScroll = containerRef.current.scrollLeft;
    const now = performance.now();
    const delta = Math.abs(currentScroll - lastSoundScrollLeft.current);
    const timeDelta = now - lastSoundTime.current;

    if (delta >= 14 && timeDelta >= 18) {
      const velocity = Math.min(3.0, Math.max(0.6, (delta / Math.max(1, timeDelta)) * 2.0));
      sound.playTimelineSlideTick(velocity);
      lastSoundScrollLeft.current = currentScroll;
      lastSoundTime.current = now;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(3); } catch {}
      }
    }
  };

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

  const { isDragging, hasMovedDrag, handlePointerDown, handleWheel, stopInertia } = useTimelineInertia({
    containerRef,
    snapToNearestYear,
  });

  const jumpToCurrentYear = () => {
    const currentYearIdx = Math.max(0, CURRENT_YEAR - START_YEAR);
    snapToNearestYear(currentYearIdx, true);
  };

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
      stopInertia();
    };
  }, [getColWidth, updateSpacerWidth, stopInertia]);

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

  return (
    <div
      className={`nasa-timeline-slider-wrapper ${isVisible ? 'is-visible' : 'is-slid-up'}`}
      role="region"
      aria-label="NASA Mission Archive Interactive Timeline"
    >
      {/* Side Quick Step Buttons */}
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

      <div
        ref={containerRef}
        className={`timeline-viewport ${isDragging ? 'is-dragging' : ''}`}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
      >
        <div ref={trackRef} className="timeline-track">
          <div className="timeline-spacer-lead" style={{ width: spacerWidth }} />

          {timelineYears.map((item) => (
            <TimelineYearNode
              key={item.year}
              item={item}
              selectedYear={selectedYear}
              activeCenterYear={activeCenterYear}
              isAbove={milestonePlacement.get(item.year) ?? true}
              currentYear={CURRENT_YEAR}
              brokenImgMap={brokenImgMap}
              onBubbleClick={handleBubbleClick}
              onYearClick={handleYearClick}
              onImageError={(id) => setBrokenImgMap((prev) => ({ ...prev, [id]: true }))}
            />
          ))}

          <div className="timeline-spacer-tail" style={{ width: spacerWidth }} />
        </div>
      </div>

      <div
        className={`timeline-synced-center-pointer ${isMagnetDocked ? 'is-magnet-docked' : ''}`}
        aria-hidden="true"
      >
        <div className="pointer-top-needle" />
        <div className="pointer-frame-bracket" />
        <div className="pointer-bottom-needle" />
      </div>

      <TimelineFooterHud
        activeCenterYear={activeCenterYear}
        currentYear={CURRENT_YEAR}
        milestonesCount={timelineYears.filter((y) => y.hasEvents).length}
        onJumpCurrentYear={jumpToCurrentYear}
      />
    </div>
  );
};
