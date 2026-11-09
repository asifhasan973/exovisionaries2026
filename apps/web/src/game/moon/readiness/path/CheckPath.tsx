import { Check } from "lucide-react";
import type { StoryStepId } from "@/game/moon/core/types";
import { CHECK_PATH } from "./checkPathData";

export function CheckPath({
  step,
  human = false,
}: {
  step: StoryStepId;
  human?: boolean;
}) {
  const path = human
    ? CHECK_PATH
    : CHECK_PATH.filter(([id]) =>
        [
          "mass-check",
          "power-check",
          "budget-check",
          "rocket-pack",
          "launch-ready",
        ].includes(id),
      );
  const active = path.findIndex(([id]) => id === step);
  return (
    <ol
      className="readiness-path human-check-path"
      aria-label="Readiness stages"
    >
      {path.map(([id, label], index) => (
        <li
          key={id}
          aria-current={index === active ? "step" : undefined}
          className={`${index < active ? "done" : ""} ${index > active + 1 ? "is-distant" : ""}`}
        >
          <span>{index < active ? <Check size={14} /> : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
