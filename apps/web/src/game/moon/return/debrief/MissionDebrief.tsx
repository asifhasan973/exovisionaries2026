import { lazy, Suspense, useRef, useState } from "react";
import { isEngineFrozen } from "@exo/ui";
import { sound } from "@exo/audio";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import { CharacterStage } from "@/game/moon/narrative/components/CharacterStage";
import { engineerCue } from "@/game/moon/narrative/components/engineer";
import { PlayerCharacterProvider } from "@/game/moon/narrative/hooks/playerCharacterContext";
import { SettingsContext } from "@/shared/shell/settings";
import { missionReport } from "./missionReport";
import { ReportComparison } from "./ReportComparison";
import "./missionReport.css";
const AtlasReference = lazy(() =>
  import("@/features/exploration/reference").then((m) => ({
    default: m.AtlasReference,
  })),
);
const sections = [
  ["overview", "Overview"],
  ["findings", "What we found"],
  ["meaning", "What it means"],
  ["location", "Explore the location"],
  ["engineering", "Engineering lessons"],
  ["next", "Next investigation"],
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
  const show = sections.find(([id]) => id === section)![1];
  return (
    <section className="moon-report" aria-labelledby="moon-report-title">
      <header className="moon-report-heading">
        <div>
          <h2 id="moon-report-title">Your Moon Mission Report</h2>
          <p>
            {report.objective} · {report.location.name} · Your simulated mission
            results
          </p>
        </div>
        <strong className="report-state">
          {preview
            ? "Preview / review record"
            : report.recovered
              ? "Crew recovered"
              : "Recovery not established"}
        </strong>
      </header>
      {preview && (
        <p className="report-preview-note">
          This is a preview or review snapshot, not a newly completed saved
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
                <div>
                  <h4>
                    {report.recovered
                      ? "Your crew is back on Earth."
                      : "This record does not establish crew recovery."}
                  </h4>
                  <p>
                    {report.outcome?.reasons[1] ??
                      "The mission is incomplete. Findings and return status below reflect only the recorded evidence."}
                  </p>
                  <dl className="report-key-results">
                    <div>
                      <dt>Crew recovered</dt>
                      <dd>{report.recovered ? "3 / 3" : "Not established"}</dd>
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
                    <div>
                      <dt>Delivered scientific evidence</dt>
                      <dd>
                        {report.deliveredCount} observations
                        <small>
                          {d.card.deliveredSciencePoints} existing science
                          points (SP)
                        </small>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="report-companion">
                  <PlayerCharacterProvider
                    value={session.progress.playerGender}
                  >
                    <SettingsContext.Provider
                      value={{ effects: false, gentle: true }}
                    >
                      <CharacterStage
                        cue={engineerCue(
                          report.recovered ? "complete" : "intro",
                        )}
                        active={false}
                        speaking={false}
                        label={session.progress.playerName || "Commander"}
                      />
                    </SettingsContext.Provider>
                  </PlayerCharacterProvider>
                </div>
              </div>
              <h4>Your recorded journey</h4>
              <ol className="report-journey">
                {report.journey.map((item) => (
                  <li key={item.name}>
                    <strong>{item.name}</strong>
                    <span>{item.recorded ? "Recorded" : "Not recorded"}</span>
                  </li>
                ))}
              </ol>
              <p>
                Collection, delivery and recovery are separate achievements.
                Opening this report does not award science points.
              </p>
              <button onClick={() => choose("findings")}>
                See the recorded evidence
              </button>
            </>
          )}
          {section === "findings" && (
            <>
              <h4>Instrument observations</h4>
              {!report.observations.length ? (
                <p>
                  No instrument readings were recorded. Samples alone do not
                  establish composition.
                </p>
              ) : (
                <div className="report-observations">
                  {report.observations.map((record) => (
                    <article key={record.id}>
                      <h4>
                        {record.instrumentId.toUpperCase()} ·{" "}
                        {record.locationId}
                      </h4>
                      <p>
                        <strong>
                          {record.signal ??
                            record.classification ??
                            record.result ??
                            "Result not recorded"}
                        </strong>
                      </p>
                      <dl>
                        <div>
                          <dt>Observation ID</dt>
                          <dd>{record.id}</dd>
                        </div>
                        <div>
                          <dt>Recorded quality / confidence</dt>
                          <dd>
                            {record.quality ?? "Unavailable"} /{" "}
                            {record.confidence ?? "Unavailable"}
                          </dd>
                        </div>
                        <div>
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
                    </article>
                  ))}
                </div>
              )}
              <h4>Physical samples</h4>
              {!report.samples.length ? (
                <p>No physical samples are recorded.</p>
              ) : (
                <div className="report-table-scroll">
                  <table>
                    <caption>
                      Samples on the Moon and samples recovered on Earth
                    </caption>
                    <thead>
                      <tr>
                        <th>Sample / location</th>
                        <th>Mass</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.samples.map((sample) => (
                        <tr key={sample.id}>
                          <th scope="row">
                            {sample.id} · {sample.location}
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
              <p>
                These are interpretations of game evidence. NASA reference maps
                in the location section are separate observations of the real
                Moon.
              </p>
              {report.observations.length ? (
                report.observations.map((record) => (
                  <article className="report-interpretation" key={record.id}>
                    <h4>
                      {record.instrumentId.toUpperCase()} · {record.id}
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
                <p>No analytical evidence is available to interpret.</p>
              )}
            </>
          )}
          {section === "location" && (
            <Suspense
              fallback={<p role="status">Opening NASA reference data…</p>}
            >
              <AtlasReference context={report.location.explanation} />
            </Suspense>
          )}
          {section === "engineering" && (
            <>
              <h4>Battery and electrical capability</h4>
              {d.battery ? (
                <p>
                  Calculated landing battery: {d.battery.startWh.toFixed(1)} Wh.
                  Final surface record: {d.battery.endWh.toFixed(1)} Wh /{" "}
                  {d.battery.capacityWh.toFixed(0)} Wh capacity. This is a net
                  balance after charging, not cumulative energy consumption.
                  Calculated full-sun generation: {d.battery.solarW.toFixed(0)}{" "}
                  W; dark traverse load: {d.battery.loadW.toFixed(0)} W.
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
                    {d.resources.cabinUsedKWh?.toFixed(1) ?? "Unavailable"} kWh
                  </dd>
                </div>
                <div>
                  <dt>Descent propellant used</dt>
                  <dd>
                    {d.resources.descentUsedKg?.toFixed(0) ?? "Unavailable"} kg
                  </dd>
                </div>
                <div>
                  <dt>Ascent / docking propellant used</dt>
                  <dd>{d.resources.ascentUsedKg.toFixed(0)} kg</dd>
                </div>
                <div>
                  <dt>Service maneuvers propellant used</dt>
                  <dd>
                    {d.resources.serviceUsedKg?.toFixed(0) ?? "Unavailable"} kg
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
            </>
          )}
          {section === "next" && (
            <>
              <h4>Investigate differently next time</h4>
              <ol className="report-recommendations">
                {d.recommendations.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
              <ReportComparison session={session} preview={preview} />
              {onRetry && (
                <button
                  onClick={() => {
                    if (!isEngineFrozen()) onRetry();
                  }}
                >
                  Plan another mission
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <footer className="moon-report-footer">
        <span>
          Mission results: simulation · Location layers: NASA reference data
        </span>
        {section !== "overview" && (
          <button onClick={() => choose("overview")}>Back to overview</button>
        )}
        {onHome && (
          <button
            onClick={() => {
              if (!isEngineFrozen()) onHome();
            }}
          >
            Mission home
          </button>
        )}
      </footer>
    </section>
  );
}
