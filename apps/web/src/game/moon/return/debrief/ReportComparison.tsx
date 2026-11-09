import { completedMission } from "./missionReport";
import { useState } from "react";
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
  const save = () => {
    if (!completedMission(session) || preview) return;
    try {
      localStorage.setItem(COMPARISON_KEY, JSON.stringify(current));
      setPrevious(current);
      setStatus("Saved on this browser. Finish another attempt to compare.");
    } catch {
      setStatus(
        "Comparison could not be saved. Your mission record is unchanged.",
      );
    }
  };
  return (
    <details>
      <summary>Compare with a saved attempt</summary>
      <p>
        Same objective, different choices. Seed and assistance can also affect
        results; differences alone do not prove a cause.
      </p>
      {previous ? (
        <>
          <p>
            {comparable
              ? "Saved previous run"
              : "Different objective — compare separately"}{" "}
            · seed {previous.seed} ·{" "}
            {previous.assisted ? "assisted" : "unassisted"} · {previous.route}
          </p>
          <div className="mission-comparison-scroll" hidden={!comparable}>
            <table>
              <caption>Recorded attempts, not predicted discoveries</caption>
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Saved</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Outcome", previous.outcome, current.outcome],
                  ["Route", previous.route, current.route],
                  [
                    "Service fuel kg",
                    previous.fuelKg?.toFixed(0) ?? null,
                    current.fuelKg?.toFixed(0) ?? null,
                  ],
                  ["Equipment kg", previous.massKg, current.massKg],
                  [
                    "Credits (objective ledger)",
                    previous.credits,
                    current.credits,
                  ],
                  ["Battery Wh", previous.batteryWh, current.batteryWh],
                  ["Solar W", previous.solarW, current.solarW],
                  ["Science points", previous.points, current.points],
                  ["Samples returned", previous.samples, current.samples],
                  ["Days", previous.days.toFixed(2), current.days.toFixed(2)],
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
      <p role="status">{status}</p>
    </details>
  );
}
