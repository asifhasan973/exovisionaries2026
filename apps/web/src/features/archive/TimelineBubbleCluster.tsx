import React from 'react';
import type { TimelineBubble } from '@exo/engine';
import { NASA_BUBBLE_PLACEHOLDER } from '@exo/engine';

export interface TimelineBubbleClusterProps {
  bubbles: TimelineBubble[];
  year: number;
  isAbove: boolean;
  onBubbleClick: (year: number, eventId?: string) => void;
  brokenImgMap: Record<string, boolean>;
  onImageError: (id: string) => void;
}

export const TimelineBubbleCluster: React.FC<TimelineBubbleClusterProps> = ({
  bubbles,
  year,
  isAbove,
  onBubbleClick,
  brokenImgMap,
  onImageError
}) => {
  const renderBubble = (bubble: TimelineBubble) => {
    if (bubble.isMore) {
      return (
        <button
          key={bubble.id}
          type="button"
          className="timeline-bubble bubble-more group"
          onClick={(e) => {
            e.stopPropagation();
            onBubbleClick(year);
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
          onBubbleClick(year, bubble.id);
        }}
        title={bubble.title || `NASA event in ${year}`}
      >
        <img
          src={imageSrc}
          alt={bubble.title || `NASA event in ${year}`}
          className="bubble-img"
          loading="eager"
          decoding="async"
          onError={() => onImageError(bubble.id)}
        />
        <span className="bubble-glow-ring" />
      </button>
    );
  };

  if (bubbles.length === 1) {
    return (
      <div className="bubble-cluster-single">
        {renderBubble(bubbles[0])}
      </div>
    );
  }

  if (bubbles.length === 2) {
    return (
      <div className="bubble-cluster-double">
        {renderBubble(bubbles[0])}
        {renderBubble(bubbles[1])}
      </div>
    );
  }

  if (bubbles.length >= 3) {
    return (
      <div className={`bubble-cluster-triangle ${isAbove ? 'triangle-above' : 'triangle-below'}`}>
        {isAbove ? (
          <>
            <div className="triangle-row triangle-apex-row triangle-row-top">
              {renderBubble(bubbles[0])}
            </div>
            <div className="triangle-row triangle-base-row triangle-row-bottom">
              {renderBubble(bubbles[1])}
              {renderBubble(bubbles[2])}
            </div>
          </>
        ) : (
          <>
            <div className="triangle-row triangle-base-row triangle-row-top">
              {renderBubble(bubbles[1])}
              {renderBubble(bubbles[2])}
            </div>
            <div className="triangle-row triangle-apex-row triangle-row-bottom">
              {renderBubble(bubbles[0])}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};
