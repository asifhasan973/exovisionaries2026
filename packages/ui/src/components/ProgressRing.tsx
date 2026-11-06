import type { MouseEvent } from 'react';
import { sound } from '@exo/audio';

export interface ProgressRingProps {
  percent: number;
  current: number;
  total: number;
  label?: string;
  title?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function ProgressRing({
  percent,
  current,
  total,
  label,
  title,
  onClick,
  className = 'mission-progress-ring',
}: ProgressRingProps) {
  const ariaLabel = label ?? `Milestone ${current} of ${total}, ${percent}% complete.`;
  const ringTitle = title ?? `Milestone ${current}/${total} · ${percent}% (Open mission map)`;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    sound.playClick(720);
    onClick?.(event);
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ringTitle}
    >
      <div className="ring-svg-container">
        <svg viewBox="0 0 52 52" aria-hidden="true">
          <circle className="ring-track" cx="26" cy="26" r="21" />
          <circle
            className="mission-progress-arc"
            cx="26"
            cy="26"
            r="21"
            pathLength="100"
            strokeDasharray={`${percent} 100`}
            transform="rotate(-90 26 26)"
          />
        </svg>
      </div>
      <div className="ring-content">
        <strong>{percent}%</strong>
        <small>{current}/{total}</small>
      </div>
    </button>
  );
}
