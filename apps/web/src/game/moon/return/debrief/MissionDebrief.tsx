import { lazy, Suspense, useRef, useState } from "react";
import { isEngineFrozen } from "@exo/ui";
import { sound } from "@exo/audio";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import {
  downloadMissionCard,
  downloadMissionLog,
} from "@/game/moon/shared/missionCard";
import { missionReport } from "./missionReport";
import { ReportComparison } from "./ReportComparison";
import { ReportMissionLog } from "./ReportMissionLog";
import "./missionReport.css";

const AtlasReference = lazy(() =>
  import("@/features/exploration/reference").then((m) => ({
    default: m.AtlasReference,
  })),
);
const sections = [
  ["overview", "Overview"],
  ["findings", "Findings"],
  ["meaning", "Meaning"],
  ["location", "Location"],
  ["engineering", "Engineering"],
  ["next", "Next mission"],
] as const;
type Section = (typeof sections)[number][0];

export function MissionDebrief({
  session,
  onHome,
  onRetry,
  preview = false,
}: {
  session: WorkshopSession;
  onHome?: () => void;
  onRetry?: () => void;
  preview?: boolean;
}) {
  const report = missionReport(session),
    d = report.debrief;
  const [section, setSection] = useState<Section>("overview");
  const heading = useRef<HTMLHeadingElement>(null);
  const choose = (id: Section) => {
    if (isEngineFrozen()) return;
    sound.playClick();
    setSection(id);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const act = (action: () => void) => {
    if (isEngineFrozen()) return;
    sound.playClick();
    action();
  };
  const show = sections.find(([id]) => id === section)![1];
  const conclusion =
    report.outcome?.reasons[1] ?? "This mission’s outcome is still incomplete.";

  return (
    <section className="moon-report" aria-labelledby="moon-report-title">
      <header className="moon-report-heading">
        <div>
          <h2 id="moon-report-title">Your Moon mission report</h2>
          <p>
            {report.objective} · {report.location.name}
          </p>
        </div>
        <div className="report-record-context">
          <span>Simulated mission results</span>
          <strong className="report-state">
            {preview
              ? "Preview / review record"
              : report.recovered
                ? "Crew recovered"
                : "Recovery not established"}
          </strong>
        </div>
      </header>
      {preview && (
        <p className="report-preview-note">
          Preview / review snapshot · This is not a newly completed saved
          mission.
        </p>
      )}
      <div className="moon-report-layout">
        <nav className="moon-report-sections" aria-label="Report sections">
          {sections.map(([id, label]) => (
            <button
              key={id}
              aria-current={section === id ? "page" : undefined}
              aria-controls="moon-report-section"
              onClick={() => choose(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div
          className="moon-report-content"
          id="moon-report-section"
          data-section={section}
          key={section}
        >
          <h3 ref={heading} tabIndex={-1}>
            {show}
          </h3>
          {section === "overview" && (
            <>
              <div className="report-overview">
                <h4>{conclusion}</h4>
                <p>
                  {report.recovered
                    ? "Your crew is back on Earth. Here is what your expedition brought home, and what the evidence can tell us."
                    : "Crew recovery is not established. These findings reflect only the progress and evidence recorded so far."}
                </p>
                <dl className="report-key-results">
                  <div>
                    <dt>Crew recovered</dt>
                    <dd>
                      {report.recovered
                        ? `${d.card.crewRecovered} / 3`
                        : "Not established"}
                      <small>
                        {report.recovered
                          ? "Safely home on Earth"
                          : "Return remains incomplete"}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Observations delivered</dt>
                    <dd>
                      {report.deliveredCount}
                      <small>
                        {d.card.deliveredSciencePoints} science points (SP)
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Samples collected / returned</dt>
                    <dd>
                      {report.samples.length} / {report.returnedCount}
                      <small>
                        {report.returnedKg.toFixed(1)} kg physically returned
                      </small>
                    </dd>
                  </div>
                </dl>
              </div>
              <h4>Your journey</h4>
              <ol
                className="report-journey"
                aria-label="Recorded mission journey"
              >
                {report.journey.map((item) => (
                  <li key={item.name} data-recorded={item.recorded}>
                    <strong>{item.name}</strong>
                    <span>{item.recorded ? "Recorded" : "Not recorded"}</span>
                  </li>
                ))}
              </ol>
              <div className="report-overview-next">
                <p>
                  Collection, delivery and recovery are separate achievements.
                  Opening this report does not award science points.
                </p>
                <button onClick={() => choose("findings")}>
                  Explore your findings
                </button>
              </div>
              <details>
                <summary>Complete mission outcome</summary>
                {report.outcome ? (
                  <ul>
                    {report.outcome.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    The mission is incomplete; no final outcome is established.
                  </p>
                )}
              </details>
            </>
          )}
          {section === "findings" && (
            <>
              <h4 className="report-section-lead">
                What your instruments recorded
              </h4>
              <p>
                Readings and physical samples are tracked separately. A
                collected reading is only received on Earth when transmission
                and crew recovery are established.
              </p>
              {!report.observations.length ? (
                <p className="report-empty">
                  No instrument readings were recorded. Samples alone do not
                  establish composition.
                </p>
              ) : (
                <div className="report-observations">
                  {report.observations.map((record) => (
                    <article key={record.id}>
                      <div className="report-observation-heading">
                        <h4>{record.instrumentName}</h4>
                        <span
                          className="report-delivery-status"
                          data-delivered={record.transmitted}
                        >
                          {record.receivedOnEarth
                            ? "Received on Earth"
                            : record.transmitted
                              ? "Transmitted"
                              : "Not delivered"}
                        </span>
                      </div>
                      <p className="report-observation-result">
                        {record.signal ??
                          record.classification ??
                          record.result ??
                          "Result not recorded"}
                      </p>
                      <dl>
                        <div>
                          <dt>Field location</dt>
                          <dd>{record.locationName}</dd>
                        </div>
                        <div>
                          <dt>Quality / confidence</dt>
                          <dd>
                            {record.quality ?? "Unavailable"} /{" "}
                            {record.confidence ?? "Unavailable"}
                          </dd>
                        </div>
                        <div className="report-observation-delivery">
                          <dt>Collection / delivery</dt>
                          <dd>
                            Collected ·{" "}
                            {record.transmitted
                              ? "Transmitted"
                              : "Not transmitted"}{" "}
                            ·{" "}
                            {record.receivedOnEarth
                              ? "Received on Earth"
                              : "Earth receipt not established"}
                          </dd>
                        </div>
                      </dl>
                      <details>
                        <summary>Observation details</summary>
                        <dl>
                          <div>
                            <dt>Observation ID</dt>
                            <dd>
                              <code>{record.id}</code>
                            </dd>
                          </div>
                          <div>
                            <dt>Instrument / location IDs</dt>
                            <dd>
                              <code>
                                {record.instrumentId} / {record.locationId}
                              </code>
                            </dd>
                          </div>
                          <div>
                            <dt>Measurement depth</dt>
                            <dd>
                              {record.depthCm == null
                                ? "Not recorded"
                                : `${record.depthCm} cm`}
                            </dd>
                          </div>
                          <div>
                            <dt>Sampled depth range</dt>
                            <dd>
                              {record.depthRangeCm
                                ? `${record.depthRangeCm[0]}–${record.depthRangeCm[1]} cm`
                                : "Surface scan / no range recorded"}
                            </dd>
                          </div>
                          <div>
                            <dt>New-measurement points</dt>
                            <dd>{record.points} SP</dd>
                          </div>
                        </dl>
                      </details>
                    </article>
                  ))}
                </div>
              )}
              <h4>Physical samples</h4>
              <p>
                Drilling or analysing material does not by itself establish that
                a sealed sample returned to Earth.
              </p>
              {!report.samples.length ? (
                <p className="report-empty">
                  No physical samples are recorded.
                </p>
              ) : (
                <div className="report-table-scroll">
                  <table>
                    <caption>
                      Samples on the Moon and samples recovered on Earth
                    </caption>
                    <thead>
                      <tr>
                        <th>Sample / field location</th>
                        <th>Mass</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.samples.map((sample, index) => (
                        <tr key={sample.id}>
                          <th scope="row">
                            Sample {index + 1} · {sample.locationName}
                            <details>
                              <summary>Sample details</summary>
                              <code>
                                {sample.id} · {sample.location}
                              </code>
                            </details>
                          </th>
                          <td>{sample.massKg.toFixed(1)} kg</td>
                          <td>
                            {sample.returned
                              ? "Physically returned"
                              : sample.stowed
                                ? "Stowed; Earth return not established"
                                : "Collected; remains on the Moon"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {section === "meaning" && (
            <>
              <h4 className="report-section-lead">
                What the evidence can tell us
              </h4>
              <p>
                These are interpretations of game evidence. NASA reference maps
                in Location are separate observations of the real Moon.
              </p>
              {report.observations.length ? (
                report.observations.map((record) => (
                  <article className="report-interpretation" key={record.id}>
                    <h4>
                      {record.instrumentName} · {record.locationName}
                    </h4>
                    <p>{record.meaning}</p>
                    {record.result && (
                      <p>
                        Recorded interpretation: {record.result}.{" "}
                        {record.transmitted
                          ? "Delivered in the simulation."
                          : "Not delivered."}
                      </p>
                    )}
                  </article>
                ))
              ) : (
                <p className="report-empty">
                  No analytical evidence is available to interpret.
                </p>
              )}
              <h4>What remains uncertain</h4>
              <p>
                Hydrogen is a clue, not automatic proof of water ice. A sample
                or surface texture alone does not establish composition.
                Low-quality or incomplete evidence remains inconclusive.
              </p>
              <h4>What would help next</h4>
              <p>{d.recommendations[0]}</p>
            </>
          )}
          {section === "location" && (
            <>
              <p className="report-location-context">
                Illustrative mission region:{" "}
                <strong>{report.location.name}</strong>. The selected NASA
                reference coordinate below is a separate real-world location.
              </p>
              <Suspense
                fallback={<p role="status">Opening NASA reference data…</p>}
              >
                <AtlasReference context={report.location.explanation} />
              </Suspense>
            </>
          )}
          {section === "engineering" && (
            <>
              <h4 className="report-section-lead">How your design performed</h4>
              <dl className="report-engineering-takeaways">
                <div>
                  <dt>Journey duration</dt>
                  <dd>
                    {d.resources.elapsedDays.toFixed(2)} days{" "}
                    <small>
                      Elapsed model time; the flight is time compressed.
                    </small>
                  </dd>
                </div>
                <div>
                  <dt>Cabin energy used</dt>
                  <dd>
                    {d.resources.cabinUsedKWh == null
                      ? "Unavailable"
                      : `${d.resources.cabinUsedKWh.toFixed(1)} kWh`}
                    <small>A separate account from the rover battery.</small>
                  </dd>
                </div>
                {d.battery && (
                  <div>
                    <dt>
                      {session.moon.rover ? "Rover" : "Surface"} battery at
                      fieldwork end
                    </dt>
                    <dd>
                      {d.battery.endWh.toFixed(1)} /{" "}
                      {d.battery.capacityWh.toFixed(0)} Wh
                      <small>
                        Net balance after charging; not total consumption.
                      </small>
                    </dd>
                  </div>
                )}
              </dl>
              {d.battery && (
                <p>
                  Your panels can generate {d.battery.solarW.toFixed(0)} W in
                  full game sunlight; the dark traverse load is{" "}
                  {d.battery.loadW.toFixed(0)} W. These are calculated equipment
                  capabilities.
                </p>
              )}
              {d.decisions.length > 0 && (
                <p className="report-tradeoff">{d.decisions[0]}</p>
              )}
              {session.moon.journey.route && d.decisions[1] && (
                <>
                  <h4>The route trade-off</h4>
                  <p className="report-tradeoff">{d.decisions[1]}</p>
                </>
              )}
              <details className="report-accounting">
                <summary>
                  Complete resource accounting & design trade-offs
                </summary>
                <h4>Battery and electrical capability</h4>
                {d.battery ? (
                  <p>
                    Calculated landing battery: {d.battery.startWh.toFixed(1)}{" "}
                    Wh. Final surface record: {d.battery.endWh.toFixed(1)} Wh /{" "}
                    {d.battery.capacityWh.toFixed(0)} Wh capacity. This is a net
                    balance after charging, not cumulative energy consumption.
                    Calculated full-sun generation:{" "}
                    {d.battery.solarW.toFixed(0)} W; dark traverse load:{" "}
                    {d.battery.loadW.toFixed(0)} W.
                  </p>
                ) : (
                  <p>Battery accounting is unavailable in this record.</p>
                )}
                <h4>Separate mission resource accounts</h4>
                <dl className="report-resource-list">
                  <div>
                    <dt>Elapsed model time</dt>
                    <dd>{d.resources.elapsedDays.toFixed(2)} days</dd>
                  </div>
                  <div>
                    <dt>Supplies used</dt>
                    <dd>
                      {d.resources.crewDaysUsed?.toFixed(2) ?? "Unavailable"}{" "}
                      crew-days
                    </dd>
                  </div>
                  <div>
                    <dt>Cabin energy used</dt>
                    <dd>
                      {d.resources.cabinUsedKWh?.toFixed(1) ?? "Unavailable"}{" "}
                      kWh
                    </dd>
                  </div>
                  <div>
                    <dt>Descent propellant used</dt>
                    <dd>
                      {d.resources.descentUsedKg?.toFixed(0) ?? "Unavailable"}{" "}
                      kg
                    </dd>
                  </div>
                  <div>
                    <dt>Ascent / docking propellant used</dt>
                    <dd>{d.resources.ascentUsedKg.toFixed(0)} kg</dd>
                  </div>
                  <div>
                    <dt>Service maneuvers propellant used</dt>
                    <dd>
                      {d.resources.serviceUsedKg?.toFixed(0) ?? "Unavailable"}{" "}
                      kg
                    </dd>
                  </div>
                </dl>
                <p>
                  Upper-stage TLI is a separate supplied account. Equipment
                  performance and alternative routes below are calculated
                  comparisons, not replayed mission outcomes.
                </p>
                <ul>
                  {d.decisions.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </details>
            </>
          )}
          {section === "engineering" && <ReportMissionLog session={session} />}
          {section === "next" && (
            <>
              <h4 className="report-section-lead">
                Give your next expedition a sharper question
              </h4>
              <p>
                Use this mission’s evidence and resource limits to choose what
                to investigate next.
              </p>
              <ol className="report-recommendations">
                {d.recommendations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
              <ReportComparison session={session} preview={preview} />
              <p>
                Your crew and blueprint stay when you plan another mission.
                Flight and science progress start again after confirmation.
              </p>
            </>
          )}
        </div>
      </div>
      <footer className="moon-report-footer">
        <span>
          Mission results: simulation · Location layers: NASA reference data
        </span>
        <div className="report-export-actions">
          <button
            className="report-quiet-action"
            disabled={!report.recovered}
            onClick={() => act(() => downloadMissionCard(session))}
          >
            Save result
          </button>
          <button
            className="report-quiet-action"
            disabled={!report.recovered}
            onClick={() => act(() => downloadMissionLog(session))}
          >
            Export log
          </button>
        </div>
        {onRetry && (
          <button className="report-retry-action" onClick={() => act(onRetry)}>
            Plan another mission
          </button>
        )}
        {onHome && (
          <button className="report-home-action" onClick={() => act(onHome)}>
            Back to Home
          </button>
        )}
      </footer>
    </section>
  );
}
