import type { MouseEvent } from 'react';

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
  className = 'mission-progress-ring'
}: ProgressRingProps) {
  const ariaLabel = label ?? `Milestone ${current} of ${total}, ${percent}% complete.`;
  const ringTitle = title ?? `${current}/${total} · ${percent}%`;

  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ringTitle}
    >
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="23" />
        <circle
          className="mission-progress-arc"
          cx="26"
          cy="26"
          r="23"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
        />
      </svg>
      <span>
        <strong>{percent}%</strong>
        <small>{current}/{total}</small>
      </span>
    </button>
  );
}

