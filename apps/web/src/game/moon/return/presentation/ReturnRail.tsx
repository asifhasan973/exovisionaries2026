import { Anchor, Check, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import type { ReturnAction, ReturnEvent } from "../return";
import {
  canDock,
  returnActive,
  returnFrameLimit,
  returnReport,
} from "../return";
import { missionReport } from "../debrief/missionReport";

export function ReturnRail({
  session,
  recovered,
  action,
  dispatch,
}: {
  session: WorkshopSession;
  recovered: boolean;
  action(value: ReturnAction): void;
  dispatch(value: ReturnEvent): void;
}) {
  const r = session.moon.returnFlight;
  const account = returnReport(session.moon, r);
  const hazards = session.moon.science.hazards;
  const evidence = missionReport(session);
  const active = returnActive(r);
  const location =
    r.crewLocation === "moon-and-orbit"
      ? "2 on the Moon · 1 in orbit"
      : r.crewLocation === "ascent-and-orbit"
        ? "2 in ascent cabin · 1 in orbit"
        : recovered
          ? "All three crew recovered"
          : r.crewLocation === "ocean"
            ? "Capsule in recovery ocean"
            : "All three in command spacecraft";
  return (
    <aside className="return-console" aria-label="Mission rail">
      <div className="return-crew">
        <Users size={20} />
        <strong>{location}</strong>
      </div>
      {r.stage === "ready" ? (
        <>
          <h2>Ready for return</h2>
          <ul className="return-checklist">
            {[
              [
                hazards.roverParked,
                "Rover secured",
                "Secure the rover before departure.",
              ],
              [
                hazards.dataArchived,
                "Data handled",
                "Archive your collected observations.",
              ],
              [
                account.fuelOK,
                "Ascent and return fuel available",
                "Insufficient ascent or service propellant.",
              ],
              [
                account.supplyOK && account.energyOK,
                "Food and cabin power available",
                !account.supplyOK
                  ? "Food reserve cannot cover the return."
                  : "Cabin energy cannot cover the return.",
              ],
            ].map(([ok, label, reason]) => (
              <li key={String(label)} className={ok ? "is-ready" : "is-warn"}>
                {ok ? <Check size={17} /> : <TriangleAlert size={17} />}
                <span>
                  {String(label)}
                  {!ok && <small>{String(reason)}</small>}
                </span>
              </li>
            ))}
          </ul>
          {!account.contingencyOK && (
            <p className="return-caution">
              Using contingency supplies. Return directly to Earth.
            </p>
          )}
        </>
      ) : r.stage === "rendezvous" ? (
        <>
          <h2>
            {r.closingMS > 0.25
              ? "Slow the approach"
              : Math.abs(r.alignment) > 0.2
                ? "Line up the cabins"
                : "Ready to dock"}
          </h2>
          <dl className="return-telemetry">
            <div>
              <dt>Closing speed</dt>
              <dd className={r.closingMS > 0.25 ? "is-warn" : ""}>
                {r.closingMS.toFixed(2)} <small>m/s</small>
              </dd>
            </div>
          </dl>
          <p className="return-target">Target ≤ 0.25 m/s</p>
          <div className="return-alignment">
            <span>
              Alignment ·{" "}
              {Math.abs(r.alignment) <= 0.2 ? "Centered" : "Off-center"}
            </span>
            <div
              className="return-aim"
              role="meter"
              aria-label="Docking alignment"
              aria-valuemin={-1}
              aria-valuemax={1}
              aria-valuenow={r.alignment}
              aria-valuetext={
                Math.abs(r.alignment) <= 0.2 ? "Centered" : "Off-center"
              }
            >
              <i />
              <b style={{ left: `${50 + r.alignment * 40}%` }} />
            </div>
          </div>
          <div className="return-dock-actions">
            <button onClick={() => action("left")} aria-label="Align left">
              ← Left
            </button>
            <button onClick={() => action("brake")} aria-label="Brake approach">
              Brake
            </button>
            <button onClick={() => action("right")} aria-label="Align right">
              Right →
            </button>
          </div>
          <p className="return-keyboard">
            ← / A · S / Space · → / D<br />
            {canDock(r) ? "E to dock" : "Brake and center before docking"}
          </p>
          <p className="return-mode">
            {r.mode === "guided"
              ? "Guided · footer suggests the next maneuver"
              : "Challenge · manual control, no automatic alignment"}
          </p>
        </>
      ) : r.stage === "docked" ? (
        <>
          <Users className="return-stage-icon" size={34} />
          <h2>All three crew together</h2>
          <p>The empty ascent cabin separates for the Earth-return burn.</p>
          <dl className="return-resource">
            <div>
              <dt>Service fuel remaining</dt>
              <dd>
                {account.resources.returnPropellantKg?.toFixed(0) ??
                  "Unavailable"}{" "}
                kg
              </dd>
            </div>
            <div>
              <dt>Burn allowance</dt>
              <dd>{account.earthBurn.toFixed(0)} kg</dd>
            </div>
          </dl>
        </>
      ) : r.stage === "entry-ready" ? (
        <>
          <h2>Choose your orientation</h2>
          <p>
            Identify the pointed nose and the broad, dark shield in the scene.
          </p>
          <div className="return-orient">
            <button onClick={() => action("nose")}>
              <span className="return-nose-icon" aria-hidden="true" />
              Nose first
            </button>
            <button onClick={() => action("shield")}>
              <ShieldCheck size={25} />
              Heat shield first
            </button>
          </div>
          <p>The service module is released before entry.</p>
        </>
      ) : r.stage === "chute-ready" ? (
        <>
          <ShieldCheck className="return-stage-icon" size={34} />
          <h2>Low and slow</h2>
          <p>
            The entry gate has passed. Deploy the parachutes to slow the final
            descent.
          </p>
        </>
      ) : recovered ? (
        <>
          <Anchor className="return-stage-icon" size={34} />
          <h2>Crew recovered</h2>
          <p>
            {evidence.objective} · {evidence.location.name}
          </p>
          <dl className="return-resource">
            <div>
              <dt>Observations delivered</dt>
              <dd>{evidence.deliveredCount}</dd>
            </div>
            <div>
              <dt>Samples returned / collected</dt>
              <dd>
                {evidence.returnedCount} / {evidence.samples.length} ·{" "}
                {evidence.returnedKg.toFixed(1)} kg returned
              </dd>
            </div>
          </dl>
          <p>
            {evidence.outcome?.reasons[1] ??
              "Review the recorded evidence in your mission report."}
          </p>
        </>
      ) : (
        <>
          <h2>
            {r.stage === "ascending"
              ? "Ascent in progress"
              : r.stage === "burning"
                ? "Earth-return burn"
                : r.stage === "coast"
                  ? "Journey to Earth"
                  : r.stage === "entry"
                    ? "Atmospheric entry"
                    : "Parachute descent"}
          </h2>
          <div className="return-progress">
            <progress
              max={returnFrameLimit(r)}
              value={r.frame}
              aria-label="Return phase progress"
            />
            <span>{Math.round((r.frame / returnFrameLimit(r)) * 100)}%</span>
          </div>
          <p>
            {r.stage === "coast"
              ? `${((r.frame / returnFrameLimit(r)) * 3).toFixed(1)} / 3 modelled travel days. Food and cabin power continue to be used.`
              : r.stage === "ascending"
                ? "The ascent cabin climbs toward lunar orbit."
                : r.stage === "burning"
                  ? "Service engine firing. This is an authored teaching maneuver."
                  : r.stage === "entry"
                    ? "The broad heat shield faces the atmosphere. Parachutes are not ready yet."
                    : "Parachutes deployed. Descending toward the ocean."}
          </p>
          <p className="return-mode">Cinematic scale · time compressed</p>
        </>
      )}
      {active && (
        <div className="return-playback">
          <span role="status">
            {r.paused ? "Mission paused" : "Flight running"}
          </span>
          {r.stage === "coast" && !r.paused && (
            <button onClick={() => dispatch({ type: "return-pause" })}>
              Pause flight
            </button>
          )}
          <div aria-label="Playback speed">
            {[1, 1.5, 2].map((speed) => (
              <button
                key={speed}
                aria-pressed={r.speed === speed}
                onClick={() => dispatch({ type: "return-speed", speed })}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
