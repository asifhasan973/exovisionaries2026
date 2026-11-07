import React from 'react';
import { ChevronLeft, ChevronRight, Compass, RotateCcw } from 'lucide-react';

export interface TimelineHeaderHudProps {
  activeCenterYear: number;
  onJumpMilestone: (direction: -1 | 1) => void;
}

export const TimelineHeaderHud: React.FC<TimelineHeaderHudProps> = ({
  activeCenterYear,
  onJumpMilestone,
}) => {
  return (
    <div className="timeline-header-hud">
      <div className="hud-badge-center">
        <span className="hud-year-title">
          <span className="year-glitch">{activeCenterYear}</span>
          <span className="year-subtext">HISTORICAL TIMELINE AXIS</span>
        </span>
      </div>

      <div className="hud-nav-buttons">
        <button
          type="button"
          className="hud-step-btn"
          onClick={() => onJumpMilestone(-1)}
          aria-label="Previous NASA Milestone"
          title="Step backwards to prior mission milestone"
        >
          <ChevronLeft size={16} />
          <span>PREV MILESTONE</span>
        </button>
        <button
          type="button"
          className="hud-step-btn"
          onClick={() => onJumpMilestone(1)}
          aria-label="Next NASA Milestone"
          title="Step forward to next mission milestone"
        >
          <span>NEXT MILESTONE</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export interface TimelineFooterHudProps {
  activeCenterYear: number;
  currentYear: number;
  milestonesCount: number;
  onJumpCurrentYear: () => void;
}

export const TimelineFooterHud: React.FC<TimelineFooterHudProps> = ({
  activeCenterYear,
  currentYear,
  milestonesCount,
  onJumpCurrentYear,
}) => {
  return (
    <div className="timeline-footer-hud">
      <div className="hud-left-group">
        <span className="hud-pill">
          <Compass size={13} className="text-cyan-400" />
          <span>DRAG / SWIPE TO EXPLORE 72+ YEARS</span>
        </span>

        {activeCenterYear !== currentYear && (
          <button
            type="button"
            className="hud-jump-now-btn can-jump"
            onClick={onJumpCurrentYear}
            title={`Slide timeline back to current year (${currentYear})`}
            aria-label={`Jump back to current year ${currentYear}`}
          >
            <RotateCcw size={12} className="jump-icon" />
            <span>RETURN TO CURRENT YEAR ({currentYear})</span>
          </button>
        )}
      </div>

      <span className="hud-count-tag">
        {milestonesCount} ARCHIVE MILESTONES LOADED
      </span>
    </div>
  );
};

