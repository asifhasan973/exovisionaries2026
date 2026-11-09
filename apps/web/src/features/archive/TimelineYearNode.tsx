import React from "react";
import type { TimelineYearItem } from "@exo/engine";
import { TimelineBubbleCluster } from "./TimelineBubbleCluster";

export interface TimelineYearNodeProps {
  item: TimelineYearItem;
  selectedYear: number | null;
  activeCenterYear: number;
  isAbove: boolean;
  currentYear: number;
  brokenImgMap: Record<string, boolean>;
  onBubbleClick: (year: number, eventId?: string) => void;
  onYearClick: (year: number) => void;
  onImageError: (id: string) => void;
}

export const TimelineYearNode: React.FC<TimelineYearNodeProps> = ({
  item,
  selectedYear,
  activeCenterYear,
  isAbove,
  currentYear,
  brokenImgMap,
  onBubbleClick,
  onYearClick,
  onImageError,
}) => {
  const isMilestone = item.hasEvents;
  const isSelected = selectedYear === item.year;
  const isCenter = activeCenterYear === item.year;
  const isFuture = item.year > currentYear;

  return (
    <div
      key={item.year}
      data-year={item.year}
      className={`timeline-year-node ${isMilestone ? "has-events" : "empty-year"} ${
        isSelected ? "is-selected" : ""
      } ${isCenter ? "is-center" : ""} ${isFuture ? "is-future" : ""} ${
        isMilestone ? (isAbove ? "placement-above" : "placement-below") : ""
      }`}
    >
      <div className="timeline-zone zone-upper">
        {isMilestone && isAbove && (
          <div className="zone-bubble-container">
            <TimelineBubbleCluster
              bubbles={item.bubbles}
              year={item.year}
              isAbove={true}
              onBubbleClick={onBubbleClick}
              brokenImgMap={brokenImgMap}
              onImageError={onImageError}
            />
            <div className="bubble-stem stem-downward" />
          </div>
        )}
      </div>

      <div className="timeline-ruler-axis-zone">
        <div className="ruler-horizontal-baseline" />

        <div className="ruler-subdivision-ticks" aria-hidden="true">
          <span className="sub-tick tick-20" />
          <span className="sub-tick tick-40" />
          <span className="sub-tick tick-mid tick-50" />
          <span className="sub-tick tick-60" />
          <span className="sub-tick tick-80" />
        </div>

        <div
          className={`ruler-major-tick ${isMilestone ? "is-milestone-tick" : ""}`}
        >
          <span className="major-tick-dot" />
          <span className="major-tick-line" />
        </div>

        <button
          type="button"
          className={`timeline-year-btn ${item.year % 5 === 0 || isMilestone ? "is-major" : "is-minor"} ${
            isCenter ? "is-active-center" : ""
          }`}
          onClick={() => onYearClick(item.year)}
        >
          <span className="year-digits">{item.year}</span>
          {item.year === currentYear && (
            <span className="year-current-badge">NOW</span>
          )}
          {isFuture && item.year === 2030 && (
            <span className="year-future-badge">GATEWAY</span>
          )}
        </button>
      </div>

      <div className="timeline-zone zone-lower">
        {isMilestone && !isAbove && (
          <div className="zone-bubble-container">
            <div className="bubble-stem stem-upward" />
            <TimelineBubbleCluster
              bubbles={item.bubbles}
              year={item.year}
              isAbove={false}
              onBubbleClick={onBubbleClick}
              brokenImgMap={brokenImgMap}
              onImageError={onImageError}
            />
          </div>
        )}
      </div>
    </div>
  );
};
