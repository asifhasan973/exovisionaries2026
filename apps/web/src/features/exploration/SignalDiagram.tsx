import { Earth, MapPin, Satellite } from "lucide-react";
import type { geometryAt } from "./signalGeometry";

export type LearningStep = 1 | 2 | 3;
export interface ExplanationState {
  phase: "idle" | "running" | "complete";
  progress: number;
  paused: boolean;
}

/** A teaching diagram; positions and message speed are deliberately not physical scales. */
export function SignalDiagram({
  step,
  relay,
  geometry,
  explanation,
  compact = false,
}: {
  step: LearningStep;
  relay: number;
  geometry: ReturnType<typeof geometryAt>;
  explanation: ExplanationState;
  compact?: boolean;
}) {
  const via = step !== 1;
  const links = via ? [geometry.up, geometry.down] : [geometry.direct];
  const shown = explanation.phase !== "idle";
  const summary = !shown
    ? "Check the path to find out if the Moon blocks it."
    : !via
      ? geometry.direct
        ? "The direct path is clear."
        : "The Moon blocks the direct path."
      : !geometry.up
        ? "The Moon blocks the path to the satellite."
        : !geometry.down
          ? "The Moon blocks the satellite’s path toward Earth."
          : "Both paths are clear in this model.";
  return (
    <figure
      className={`signal-diagram ${compact ? "is-compact" : ""}`}
      aria-label="Message path diagram"
    >
      <figcaption>
        {compact ? "Current instant · " : ""}Diagram — not to scale
      </figcaption>
      <div className="signal-diagram-nodes">
        <span>
          <MapPin aria-hidden="true" />
          <strong>Moon site</strong>
        </span>
        {via && (
          <span>
            <Satellite aria-hidden="true" />
            <strong>Satellite {relay + 1}</strong>
          </span>
        )}
        <span>
          <Earth aria-hidden="true" />
          <strong>Earth</strong>
        </span>
      </div>
      <svg viewBox="0 0 480 52" aria-hidden="true">
        {links.map((clear, i) => {
          const a = via ? 40 + i * 200 : 40,
            b = via ? a + 200 : 440;
          const reached =
            shown &&
            (i === 0 ||
              (geometry.up &&
                (explanation.phase === "complete" ||
                  explanation.progress >= 1)));
          const active =
            explanation.phase === "running" &&
            Math.floor(Math.min(explanation.progress, 1.999)) === i;
          const progress = Math.max(0, Math.min(1, explanation.progress - i));
          const end = clear ? b : (a + b) / 2;
          return (
            <g
              key={i}
              data-link={via ? (i === 0 ? "up" : "down") : "direct"}
              data-status={
                reached ? (clear ? "clear" : "blocked") : "unchecked"
              }
            >
              <line
                x1={a}
                y1="22"
                x2={b}
                y2="22"
                stroke={reached ? (clear ? "#8ce2c2" : "#efa1ac") : "#776487"}
                strokeWidth="3"
                strokeDasharray={reached && !clear ? "7 6" : undefined}
              />
              <path
                d={`M ${b - 8} 16 L ${b} 22 L ${b - 8} 28`}
                fill="none"
                stroke={reached && clear ? "#8ce2c2" : "#a697b3"}
                strokeWidth="2"
              />
              {reached && !clear && (
                <g>
                  <circle cx={end} cy="22" r="12" fill="#422231" />
                  <path
                    d={`M ${end - 5} 17 l 10 10 m 0 -10 l -10 10`}
                    stroke="#ffb4be"
                    strokeWidth="2.5"
                  />
                  <text
                    x={end}
                    y="49"
                    textAnchor="middle"
                    fill="#ffb4be"
                    fontSize="12"
                  >
                    Moon blocks path
                  </text>
                </g>
              )}
              {active && (
                <circle
                  data-message
                  cx={a + (end - a) * progress}
                  cy="22"
                  r="6"
                  fill="#ffdf89"
                />
              )}
            </g>
          );
        })}
      </svg>
      <p className="signal-diagram-summary">{summary}</p>
    </figure>
  );
}
