import { completedMission } from "./missionReport";
import { useState } from "react";
import { isEngineFrozen } from "@exo/ui";
import { sound } from "@exo/audio";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import {
  comparisonRecord,
  readComparison,
  COMPARISON_KEY,
} from "./missionDebrief.ts";
export function ReportComparison({
  session,
  preview = false,
}: {
  session: WorkshopSession;
  preview?: boolean;
}) {
  const current = comparisonRecord(session),
    [previous, setPrevious] = useState(() => {
      try {
        return readComparison(localStorage.getItem(COMPARISON_KEY));
      } catch {
        return null;
      }
    }),
    [status, setStatus] = useState("");
  const comparable = previous?.objective === current.objective;
  const sameRecord =
    previous !== null && JSON.stringify(previous) === JSON.stringify(current);
  const outcomeName = (value: string) =>
    value === "safe-return"
      ? "Safe return"
      : value === "partial"
        ? "Partial finding"
        : value === "success"
          ? "Objective supported"
          : "Incomplete";
  const save = () => {
    if (isEngineFrozen() || !completedMission(session) || preview) return;
    sound.playClick();
    try {
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(current));
      setPrevious(current);
      setStatus(
        "This attempt is saved on this browser. Complete a new attempt to compare another flight.",
      );
    } catch {
      setStatus(
        "Comparison could not be saved. Your mission record is unchanged.",
      );
    }
  };
  return (
    <details className="report-comparison">
      <summary>Compare with a saved attempt</summary>
      <p>
        Same objective, different choices. Seed and assistance can also affect
        results; differences alone do not prove a cause.
      </p>
      {previous ? (
        <>
          <p>
            {comparable
              ? sameRecord
                ? "Saved record matches this attempt"
                : "Saved comparison record"
              : "Different objective — compare separately"}{" "}
            · seed {previous.seed} ·{" "}
            {previous.assisted ? "assisted" : "unassisted"} ·{" "}
            {previous.route ?? "Route not recorded"}
          </p>
          <p>
            {sameRecord
              ? "The saved and current records match. This is not evidence of a different historical flight."
              : "Compare these saved totals with the current result. The saved record may be this same attempt; matching choices or totals do not establish another flight."}
          </p>
          <div className="report-table-scroll" hidden={!comparable}>
            <table>
              <caption>
                {sameRecord
                  ? "Matching saved and current totals"
                  : "Recorded totals, not predicted discoveries"}
              </caption>
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Saved</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Outcome",
                    outcomeName(previous.outcome),
                    outcomeName(current.outcome),
                  ],
                  [
                    "Route",
                    previous.route?.replaceAll("-", " ") ?? "Not recorded",
                    current.route?.replaceAll("-", " ") ?? "Not recorded",
                  ],
                  [
                    "Service propellant used (kg)",
                    previous.fuelKg?.toFixed(0) ?? null,
                    current.fuelKg?.toFixed(0) ?? null,
                  ],
                  ["Equipment mass (kg)", previous.massKg, current.massKg],
                  [
                    "Credits (objective ledger)",
                    previous.credits,
                    current.credits,
                  ],
                  [
                    "Battery capacity (Wh)",
                    previous.batteryWh,
                    current.batteryWh,
                  ],
                  ["Full-sun generation (W)", previous.solarW, current.solarW],
                  ["Science points", previous.points, current.points],
                  ["Samples returned", previous.samples, current.samples],
                  [
                    "Elapsed time (days)",
                    previous.days.toFixed(2),
                    current.days.toFixed(2),
                  ],
                ].map(([label, a, b]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{a ?? "—"}</td>
                    <td>{b ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>No attempt saved for comparison yet.</p>
      )}
      <button disabled={!completedMission(session) || preview} onClick={save}>
        Save this attempt for comparison
      </button>
      <p role="status" aria-live="polite">
        {status}
      </p>
    </details>
  );
}
