import { useState } from "react";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import {
  missionDebrief,
  comparisonRecord,
  readComparison,
  COMPARISON_KEY,
} from "./missionDebrief.ts";
export function MissionDebrief({ session }: { session: WorkshopSession }) {
  const d = missionDebrief(session),
    current = comparisonRecord(session),
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
    if (d.card.crewRecovered !== 3) return;
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
    <div className="mission-debrief-details">
      <h3>
        {current.objective === "lunar-geology"
          ? "Geology Explorer"
          : "Ice Explorer"}{" "}
        · {d.card.outcome?.status.replaceAll("-", " ") ?? "in progress"}
      </h3>
      <p>
        {d.operational} · {d.collected} samples collected · {d.returned}{" "}
        returned ({d.card.physicalSampleReturnedKg.toFixed(1)} kg) ·{" "}
        {d.card.deliveredSciencePoints} science points.
      </p>
      <p>
        <b>Scientific findings:</b>{" "}
        {d.findings.length
          ? (d.findings as string[])
              .map((f: string) =>
                f === "confirmed"
                  ? "water confirmed"
                  : f === "negative"
                    ? "no water detected in sampled material"
                    : f === "inconclusive"
                      ? "inconclusive"
                      : f,
              )
              .join(", ")
          : "No interpreted scientific finding."}{" "}
        These are simulated instrument results.{" "}
        {d.card.assisted ? "Assistance was used." : "No recorded assistance."}
      </p>
      <details open>
        <summary>Engineering and resource report</summary>
        {d.battery ? (
          <p>
            Battery: {d.battery.startWh.toFixed(1)} Wh at landing →{" "}
            {d.battery.endWh.toFixed(1)} Wh at departure /{" "}
            {d.battery.capacityWh} Wh capacity. Solar: {d.battery.solarW} W;
            dark traverse load: {d.battery.loadW.toFixed(0)} W. This is a net
            battery balance after charging, not cumulative energy consumption.
          </p>
        ) : null}
        <p>
          Mission: {d.resources.elapsedDays.toFixed(2)} days. Supplies used:{" "}
          {d.resources.crewDaysUsed?.toFixed(2) ?? "unavailable"} crew-days.
          Cabin energy used:{" "}
          {d.resources.cabinUsedKWh?.toFixed(1) ?? "unavailable"} kWh.
        </p>
        <p>
          Propellant used: descent {d.resources.descentUsedKg.toFixed(0)} kg;
          ascent/docking {d.resources.ascentUsedKg.toFixed(0)} kg; service
          maneuvers {d.resources.serviceUsedKg?.toFixed(0) ?? "unavailable"} kg.
          Upper-stage TLI is a separate supplied account.
        </p>
        <ul>
          {d.decisions.map((text: string) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Next attempt: three things to try</summary>
        <ol>
          {d.recommendations.map((text: string) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      </details>
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
                ? "Previous attempt"
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
        <button disabled={d.card.crewRecovered !== 3} onClick={save}>
          Save this attempt for comparison
        </button>
        <p role="status">{status}</p>
      </details>
    </div>
  );
}
