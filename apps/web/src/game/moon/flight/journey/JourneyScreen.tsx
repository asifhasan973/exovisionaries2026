import {
  TRANSFER_DATES,
  captureOrbit,
  formatDepartureDate,
  LUNAR_ORBIT_TIERS,
} from "./transferModel.ts";
import {
  isEngineFrozen,
  useOrientationLifecycleStore,
  SceneBoundary,
  SceneFallback,
  GameInfo,
} from "@exo/ui";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Info,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Rocket,
  TriangleAlert,
} from "lucide-react";
import type {
  WorkshopSession,
  MissionEvent,
} from "@/game/moon/workshop/lander/workshopSession";
import type { SelectionFrame } from "@/game/moon/crew/SelectionScreens";
import { StoryShell, StoryControls } from "@/shared/shell";
import { EngineerCompanion } from "@/game/moon/narrative/components/EngineerCompanion";
import { useGameSettings } from "@/shared/shell";
import { sound } from "@exo/audio";
import {
  ROUTES,
  routeReport,
  burnSafe,
  coastFraction,
  TRANSFER_MODEL,
  getLoiRequiredDv,
} from "./journey.ts";
import { JOURNEY_LINES } from "./journeyCopy.ts";
import "./journey.css";
import { JourneyViewport } from "./JourneyViewport";
export function JourneyScreen({
  session,
  dispatch,
  onBack,
  frame,
}: {
  session: WorkshopSession;
  dispatch(event: MissionEvent): void;
  onBack?: () => void;
  frame: SelectionFrame;
}) {
  const { moon, progress, preparation } = session,
    j = moon.journey,
    { effects, gentle } = useGameSettings();
  const [panel, setPanel] = useState<"model" | "back" | null>(null);
  const selection = progress.stepId === "earth-orbit",
    endpoint = progress.stepId === "lunar-orbit",
    windowStage = j.stage.endsWith("window"),
    burning = j.stage.endsWith("burn"),
    complete = j.stage === "complete";
  const route = j.route ? routeReport(moon, j.route) : null;
  const activeTier =
    LUNAR_ORBIT_TIERS[j.orbitTier ?? "low"] ?? LUNAR_ORBIT_TIERS.low;
  const frozen = useOrientationLifecycleStore((state) => state.isFrozen);
  const pilot = j.version === 2,
    pilotBurn = pilot && burning;
  const isDebugMode = Boolean(
    frame.isDebugSession ||
    (typeof window !== "undefined" &&
      (window.location.hash.includes("debug") ||
        window.location.search.includes("debug"))),
  );
  const latest = useRef(j);
  const held = useRef(new Set<string>());
  useEffect(() => {
    latest.current = j;
  }, [j]);
  const required = route
    ? j.stage.startsWith("loi")
      ? getLoiRequiredDv(j, route.loiMS)
      : route.tliMS
    : 0;
  const orbit = route?.solution
    ? captureOrbit(route.solution.arrivalSpeedKmS, j.dv ?? 0, j.radialDv ?? 0)
    : null;
  useEffect(() => {
    if (!frozen && selection && !j.route && !j.date)
      dispatch({ type: "journey-date", date: TRANSFER_DATES[0] });
  }, [frozen, selection, j.route, j.date, dispatch]);
  const safe = windowStage && burnSafe(j) && !j.paused,
    correct = j.stage === "loi-window" ? "retrograde" : "prograde";
  const adviceId = complete
    ? "arrived"
    : j.feedback
      ? (Object.entries(JOURNEY_LINES).find(
          ([, line]) => line === j.feedback,
        )?.[0] ?? "early")
      : j.paused
        ? "paused"
        : selection
          ? "route"
          : j.stage === "coast"
            ? "coast"
            : burning
              ? "burn"
              : j.stage === "loi-window"
                ? "loi"
                : "tli";
  const advice = pilotBurn
    ? j.stage === "loi-burn"
      ? "Rotate craft with A/D so backward thrust points opposite the Moon. Hold Space to brake into lunar orbit."
      : "Align with the marker. Hold Space to fire. Cut the engine at the target delta-v."
    : JOURNEY_LINES[adviceId as keyof typeof JOURNEY_LINES];
  const best = pilot
    ? TRANSFER_DATES.flatMap((date) =>
        ROUTES.map((r) => ({
          date,
          report: routeReport({ ...moon, journey: { ...j, date } }, r.id),
        })),
      )
        .filter((r) => r.report.feasible)
        .sort(
          (a, b) =>
            a.report.tliFuelKg +
            a.report.loiFuelKg -
            (b.report.tliFuelKg + b.report.loiFuelKg),
        )[0]
    : undefined;
  useEffect(() => {
    if (
      selection ||
      complete ||
      j.paused ||
      (windowStage && (j.mode === "guided" || pilot))
    )
      return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (document.hidden || isEngineFrozen()) return;

      const current = latest.current;
      if (!current.paused && pilotBurn) {
        let newAngle = current.angle ?? 0;
        let newThrottle = current.throttle ?? 0.5;
        let changed = false;

        if (held.current.has("left")) {
          newAngle = Math.max(-180, newAngle - 75 * dt);
          changed = true;
        }
        if (held.current.has("right")) {
          newAngle = Math.min(180, newAngle + 75 * dt);
          changed = true;
        }
        if (held.current.has("up")) {
          newThrottle = Math.min(1, newThrottle + 0.6 * dt);
          changed = true;
        }
        if (held.current.has("down")) {
          newThrottle = Math.max(0, newThrottle - 0.6 * dt);
          changed = true;
        }
        if (changed) {
          dispatch({
            type: "journey-pilot",
            angle: Math.round(newAngle),
            throttle: Math.round(newThrottle * 100) / 100,
          });
        }
      }

      dispatch({ type: "journey-tick", seconds: dt });
    }, 50);
    return () => clearInterval(timer);
  }, [
    selection,
    complete,
    j.paused,
    j.stage,
    j.mode,
    windowStage,
    pilot,
    pilotBurn,
    dispatch,
  ]);
  useEffect(() => {
    const pause = () => dispatch({ type: "journey-pause" });
    const hide = () => {
      if (document.hidden) pause();
    };
    const hint = () => {
      dispatch({ type: "journey-hint" });
      dispatch({ type: "journey-pause" });
    };
    window.addEventListener("game-help-open", pause);
    window.addEventListener("replay-game-help", hint);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("game-help-open", pause);
      window.removeEventListener("replay-game-help", hint);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [dispatch]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (burning && !j.paused && (!pilot || j.firing)) sound.startRocketRoar();
    else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  }, [effects, burning, j.paused, pilot, j.firing]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (complete) sound.playOrbitHarmony();
  }, [complete, effects]);
  useEffect(() => {
    if (!pilotBurn) return;
    const down = (e: KeyboardEvent) => {
      if (isEngineFrozen()) return;
      const target = e.target as HTMLElement;
      if (
        target.closest('input,select,textarea,[role="dialog"]') ||
        target.isContentEditable
      )
        return;
      if (e.code === "Space" && target.closest("button")) return;
      if (
        [
          "KeyA",
          "KeyD",
          "KeyW",
          "KeyS",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Space",
          "Enter",
          "KeyP",
        ].includes(e.code)
      ) {
        e.preventDefault();
      } else {
        return;
      }
      if (e.code === "KeyP") {
        held.current.clear();
        dispatch({
          type: latest.current.paused ? "journey-resume" : "journey-pause",
        });
        return;
      }
      if (latest.current.paused) return;

      if (e.code === "Enter") {
        held.current.clear();
        dispatch({ type: "journey-finish-burn" });
        return;
      }

      const keyAction =
        e.code === "KeyA" || e.code === "ArrowLeft"
          ? "left"
          : e.code === "KeyD" || e.code === "ArrowRight"
            ? "right"
            : e.code === "KeyW" || e.code === "ArrowUp"
              ? "up"
              : e.code === "KeyS" || e.code === "ArrowDown"
                ? "down"
                : e.code === "Space"
                  ? "fire"
                  : null;

      if (!keyAction) return;

      const wasAlreadyHeld = held.current.has(keyAction);
      held.current.add(keyAction);

      // Instant single-tap response on first keydown
      if (!wasAlreadyHeld) {
        const cur = latest.current;
        if (keyAction === "left") {
          dispatch({
            type: "journey-pilot",
            angle: Math.max(-180, (cur.angle ?? 0) - 2),
          });
        } else if (keyAction === "right") {
          dispatch({
            type: "journey-pilot",
            angle: Math.min(180, (cur.angle ?? 0) + 2),
          });
        } else if (keyAction === "up") {
          dispatch({
            type: "journey-pilot",
            throttle: Math.min(1, (cur.throttle ?? 0.5) + 0.05),
          });
        } else if (keyAction === "down") {
          dispatch({
            type: "journey-pilot",
            throttle: Math.max(0, (cur.throttle ?? 0.5) - 0.05),
          });
        } else if (keyAction === "fire") {
          dispatch({ type: "journey-pilot", firing: true });
        }
      }
    };

    const up = (e: KeyboardEvent) => {
      const keyAction =
        e.code === "KeyA" || e.code === "ArrowLeft"
          ? "left"
          : e.code === "KeyD" || e.code === "ArrowRight"
            ? "right"
            : e.code === "KeyW" || e.code === "ArrowUp"
              ? "up"
              : e.code === "KeyS" || e.code === "ArrowDown"
                ? "down"
                : e.code === "Space"
                  ? "fire"
                  : null;

      if (keyAction) {
        held.current.delete(keyAction);
        if (keyAction === "fire") {
          dispatch({ type: "journey-pilot", firing: false });
        }
      }
    };

    const stop = () => {
      held.current.clear();
      if (latest.current.firing) {
        dispatch({ type: "journey-pilot", firing: false });
      }
    };

    const heldSet = held.current;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", stop);
    window.addEventListener("game-orientation-pause", stop);
    return () => {
      heldSet.clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", stop);
      window.removeEventListener("game-orientation-pause", stop);
    };
  }, [pilotBurn, dispatch]);
  const act = (event: MissionEvent) => {
    sound.setMuted(!effects);
    sound.playRadioBeep();
    dispatch(event);
  };
  const next = () =>
    pilotBurn && !j.paused
      ? act({ type: "journey-finish-burn" })
      : selection
        ? act({ type: "journey-confirm-route" })
        : complete
          ? act({ type: "next" })
          : j.paused
            ? act({ type: j.feedback ? "journey-retry" : "journey-resume" })
            : act({ type: "journey-burn" });
  const nextLabel = endpoint
    ? "Prepare to land"
    : selection
      ? "Confirm route"
      : complete
        ? "View lunar orbit"
        : j.paused
          ? j.feedback
            ? "Retry burn"
            : "Resume flight"
          : windowStage
            ? pilot
              ? "Take engine control"
              : "Fire engine"
            : pilotBurn
              ? j.stage === "loi-burn" && (j.dv ?? 0) >= required * 0.94
                ? "Enter lunar orbit →"
                : "Check trajectory"
              : burning
                ? "Engine firing…"
                : "Coasting…";
  const supplies = moon.resources.supportUnitsRemaining ?? 0,
    energy = (moon.resources.platformEnergyWh ?? 0) / 1000;
  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          onBack={() => {
            if (isDebugMode) {
              if (onBack) onBack();
              return;
            }
            act({ type: "journey-pause" });
            setPanel("back");
          }}
          onNext={next}
          nextLabel={nextLabel}
          nextDisabled={
            (selection && !route?.feasible) ||
            (!selection && !complete && !windowStage && !j.paused && !pilotBurn)
          }
          progress={
            <span>
              Journey ·{" "}
              {selection
                ? "Earth orbit"
                : complete
                  ? "Lunar orbit"
                  : "Moon transfer"}
            </span>
          }
          nextHint={
            selection && route && !route.feasible
              ? "Pick another route"
              : windowStage && !j.paused
                ? j.mode === "guided"
                  ? "Choose engine direction"
                  : "Fire while green"
                : undefined
          }
        />
      }
    >
      <main
        data-burn-direction={windowStage ? correct : undefined}
        className={`workshop-main journey-main ${windowStage ? "is-window" : ""} ${pilot ? "is-pilot" : ""}`}
        id="story-content"
        tabIndex={-1}
        aria-labelledby="journey-title"
      >
        <div className="journey-heading">
          <h1 id="journey-title">
            {selection
              ? "Choose your Moon route"
              : complete
                ? "Hello, lunar orbit!"
                : j.stage === "coast"
                  ? "Next stop: the Moon"
                  : j.stage.startsWith("loi")
                    ? "Slow down at the Moon"
                    : "Leave Earth orbit"}
          </h1>
          <button
            className="game-info-trigger"
            onClick={() => {
              act({ type: "journey-pause" });
              setPanel("model");
            }}
          >
            <Info size={16} />
            Flight model
          </button>
        </div>
        <div className="journey-layout">
          <section className="journey-console" aria-label="Journey controls">
            {selection ? (
              <>
                <label className="journey-date">
                  Departure date · TDB
                  <select
                    value={j.date ?? ""}
                    onChange={(e) =>
                      act({ type: "journey-date", date: e.target.value })
                    }
                  >
                    {!pilot ? (
                      <option value="">Legacy game profiles</option>
                    ) : null}
                    {TRANSFER_DATES.map((date) => (
                      <option key={date} value={date}>
                        {formatDepartureDate(date)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="journey-date-note">
                  Aim where the Moon will be.{" "}
                  {best
                    ? `Lowest burn fuel in this dataset: ${formatDepartureDate(best.date)}, ${best.report.days} days.`
                    : "Compare time, fuel and crew supplies."}
                </p>
                <div className="journey-mode">
                  {(["guided", "challenge"] as const).map((mode) => (
                    <button
                      key={mode}
                      aria-pressed={j.mode === mode}
                      onClick={() => act({ type: "journey-mode", mode })}
                    >
                      {mode === "guided" ? "Guided" : "Challenge"}
                    </button>
                  ))}
                </div>
                <div className="journey-routes">
                  {ROUTES.map((r) => {
                    const report = routeReport(moon, r.id);
                    return (
                      <button
                        key={r.id}
                        className={!report.feasible ? "is-unavailable" : ""}
                        aria-pressed={j.route === r.id}
                        onClick={() => act({ type: "journey-route", id: r.id })}
                      >
                        <span>
                          <strong>
                            {pilot
                              ? r.id === "fast"
                                ? "Short transfer"
                                : r.id === "balanced"
                                  ? "Medium transfer"
                                  : "Long transfer"
                              : r.name}
                          </strong>
                          <b>{report.days} days</b>
                        </span>
                        {pilot ? (
                          <small>
                            {report.solution
                              ? "NASA ephemeris · computed transfer"
                              : "No converged candidate for this date"}
                          </small>
                        ) : null}
                        <small>
                          Fuel: {Math.round(report.tliFuelKg / 1000)} t
                          departure · {Math.round(report.loiFuelKg / 1000)} t
                          arrival
                        </small>
                        {!report.feasible ? (
                          <em>
                            {!report.solution && pilot
                              ? "Choose another date or route"
                              : !report.fuelOK
                                ? "Fuel / return reserve insufficient"
                                : !report.powerOK
                                  ? "Cabin energy insufficient"
                                  : `Needs ${report.neededDays}+ mission days & supplies`}
                          </em>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : pilotBurn ? (
              <div className="journey-pilot-controls">
                <h2>
                  {j.stage === "loi-burn"
                    ? "Capture lunar orbit"
                    : "Fly your departure burn"}
                </h2>
                <p>
                  A/D align · W/S throttle · hold Space to fire · Enter checks
                  trajectory
                </p>
                <label className="journey-align-field">
                  <span className="journey-align-label">
                    <span>Alignment: {j.angle ?? 0}°</span>
                    <span
                      className={`journey-align-badge ${Math.abs(j.angle ?? 0) <= 8 ? "is-aligned" : "is-misaligned"}`}
                    >
                      {Math.abs(j.angle ?? 0) <= 8
                        ? "ALIGNED ✓"
                        : j.stage === "loi-burn"
                          ? "ROTATE THRUST OPPOSITE MOON (±8°)"
                          : "ALIGN TO 0° (±8°)"}
                    </span>
                  </span>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={j.angle ?? 0}
                    onChange={(e) =>
                      act({
                        type: "journey-pilot",
                        angle: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Throttle: {Math.round((j.throttle ?? 0.5) * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={j.throttle ?? 0.5}
                    onChange={(e) =>
                      act({
                        type: "journey-pilot",
                        throttle: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <strong>
                  {Math.round(j.dv ?? 0)} / {Math.round(required)} m/s
                </strong>
                <progress
                  value={Math.max(0, j.dv ?? 0)}
                  max={required}
                  aria-label="Delivered delta-v"
                />
                <button
                  className="journey-fire"
                  aria-pressed={!!j.firing}
                  disabled={j.paused}
                  onClick={() =>
                    act({ type: "journey-pilot", firing: !j.firing })
                  }
                >
                  {j.firing ? "Cut engine" : "Fire engine"}
                </button>
                {j.stage === "loi-burn" && orbit ? (
                  <p role="status">
                    {orbit.bound ? "Captured" : "Flyby"} · closest orbit
                    altitude {Math.round(orbit.periapsisKm)} km · highest{" "}
                    {Number.isFinite(orbit.apoapsisKm)
                      ? `${Math.round(orbit.apoapsisKm)} km`
                      : "escape"}
                  </p>
                ) : null}
                <small>
                  Burn time ×20 · engine thrust is an authored spacecraft input.
                </small>
              </div>
            ) : windowStage ? (
              <>
                <h2>
                  {j.stage === "tli-window"
                    ? "Speed up toward the Moon"
                    : "Slow down for lunar orbit"}
                </h2>
                {j.stage === "loi-window" ? (
                  <div className="journey-orbit-selection">
                    <p>
                      Select target orbit altitude before initiating arrival
                      burn:
                    </p>
                    <div
                      className="journey-orbit-tiers"
                      role="radiogroup"
                      aria-label="Target lunar orbit level"
                    >
                      {Object.values(LUNAR_ORBIT_TIERS).map((tier) => {
                        const isSelected = (j.orbitTier ?? "low") === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className="journey-tier-card"
                            onClick={() =>
                              act({
                                type: "journey-select-orbit",
                                tier: tier.id,
                              })
                            }
                          >
                            <div className="journey-tier-head">
                              <strong>{tier.name}</strong>
                              <span className="journey-tier-tag">
                                {tier.altitudeKm} km
                              </span>
                            </div>
                            <div className="journey-tier-metrics">
                              <span>LOI: {tier.loiDvMS} m/s</span>
                              <span>
                                Descent:{" "}
                                {tier.descentDvImpactMS < 0
                                  ? `${tier.descentDvImpactMS} m/s`
                                  : tier.descentDvImpactMS > 0
                                    ? `+${tier.descentDvImpactMS} m/s`
                                    : "Balanced"}
                              </span>
                            </div>
                            <div className="journey-tier-note">
                              {tier.tradeoffNote}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {!pilot ? (
                  <div className="journey-directions">
                    {(["prograde", "retrograde"] as const).map((direction) => (
                      <button
                        data-burn-direction={direction}
                        key={direction}
                        className={
                          j.mode === "guided" && correct === direction
                            ? "is-hinted"
                            : ""
                        }
                        aria-pressed={j.direction === direction}
                        onClick={() =>
                          act({ type: "journey-direction", direction })
                        }
                      >
                        <Rocket size={20} />
                        <strong>
                          {direction === "prograde"
                            ? "Point forward →"
                            : "← Point backward"}
                        </strong>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>
                    Your navigation computer provides the burn direction. Take
                    control, then adjust alignment and throttle.
                  </p>
                )}
                {j.mode === "challenge" && !pilot ? (
                  <div
                    className={`journey-window ${safe ? "is-safe" : ""}`}
                    aria-label={
                      safe ? "Safe burn window" : "Wait for safe burn window"
                    }
                  >
                    <span
                      style={{
                        left: `${Math.min(100, (j.elapsed / 4) * 100)}%`,
                      }}
                    />
                    <i />
                    <b>{safe ? "FIRE NOW" : "WAIT FOR GREEN"}</b>
                  </div>
                ) : (
                  <p>Prepare your maneuver, then fire the engine.</p>
                )}
              </>
            ) : complete ? (
              <div className="journey-arrived">
                <Check size={45} />
                <h2>Three crew. Safe in {activeTier.name}.</h2>
                <p>
                  Captured at {activeTier.altitudeKm} km altitude (
                  {activeTier.scanResolution}). Ready for lunar descent and
                  surface operations.
                </p>
              </div>
            ) : (
              <>
                <h2>
                  {burning
                    ? "Engine burn in progress"
                    : "Coasting through space"}
                </h2>
                <progress
                  max={
                    burning
                      ? TRANSFER_MODEL.burnScreenSeconds
                      : TRANSFER_MODEL.coastScreenSeconds
                  }
                  value={j.elapsed}
                  aria-label="Journey phase progress"
                />
                <p>
                  {burning
                    ? "Fuel follows engine use."
                    : `${((route?.days ?? 0) * coastFraction(j)).toFixed(1)} / ${route?.days ?? 0} travel days`}
                </p>
              </>
            )}
            {j.feedback ? (
              <div className="journey-alert" role="alert">
                <TriangleAlert />
                <span>{j.feedback}</span>
              </div>
            ) : null}
            <div className="journey-stats">
              <div>
                <span>Crew supplies</span>
                <strong>{supplies.toFixed(1)} day kits</strong>
              </div>
              <div>
                <span>Cabin energy</span>
                <strong>{energy.toFixed(1)} kWh</strong>
              </div>
              <div>
                <span>
                  {j.stage.startsWith("tli")
                    ? "Upper-stage fuel"
                    : "Service fuel"}
                </span>
                <strong>
                  {(
                    (j.stage.startsWith("tli")
                      ? (moon.resources.upperStagePropellantKg ?? 0)
                      : (moon.resources.returnPropellantKg ?? 0)) / 1000
                  ).toFixed(1)}{" "}
                  t
                </strong>
              </div>
              <div>
                <span>Earth-return reserve</span>
                <strong>
                  {route ? (route.returnReserveKg / 1000).toFixed(1) : "—"} t
                </strong>
              </div>
            </div>
            {!selection && !complete ? (
              <>
                <div className="journey-speed" aria-label="Journey speed">
                  {[1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      aria-pressed={j.speed === speed}
                      onClick={() => act({ type: "journey-speed", speed })}
                    >
                      {speed}×
                    </button>
                  ))}
                  <button
                    aria-label={j.paused ? "Resume journey" : "Pause journey"}
                    onClick={() =>
                      act({
                        type: j.paused ? "journey-resume" : "journey-pause",
                      })
                    }
                  >
                    {j.paused ? <Play size={17} /> : <Pause size={17} />}
                  </button>
                  <button
                    aria-label="Preview arrival · assisted"
                    title="Preview arrival · assisted"
                    onClick={() => act({ type: "journey-skip" })}
                  >
                    <SkipForward size={17} />
                  </button>
                </div>
              </>
            ) : null}
            <EngineerCompanion
              voiceEnabled={frame.voiceEnabled ?? true}
              reaction={
                complete ? "complete" : j.feedback ? "warning" : "intro"
              }
              token={j.attempts}
              scriptedReply={{
                id: pilotBurn ? "journey-pilot-burn" : `journey-${adviceId}`,
                text: advice,
              }}
            />
          </section>
          <section
            className="journey-scene"
            tabIndex={0}
            aria-label="Earth to Moon scene. Focus here for flight keyboard controls."
          >
            <SceneBoundary
              fallback={
                <SceneFallback
                  scene="journey"
                  label="Mission view"
                  detail="Use the controls to keep playing"
                />
              }
            >
              <JourneyViewport
                journey={j}
                preparation={preparation}
                gentle={gentle}
              />
            </SceneBoundary>
            <div className="journey-scene-heading">
              <span>
                {complete
                  ? `LUNAR ORBIT · ${activeTier.altitudeKm} KM`
                  : j.stage.startsWith("loi")
                    ? `LUNAR APPROACH · ${activeTier.altitudeKm} KM TARGET`
                    : selection
                      ? "EARTH PARKING ORBIT · 200 KM"
                      : "EARTH → MOON"}
              </span>
              <strong>
                {complete || j.stage.startsWith("loi")
                  ? `≈${activeTier.speedKmS.toFixed(2)} km/s orbital speed`
                  : selection
                    ? "≈7.79 km/s orbital speed"
                    : "Three crew · capsule + lunar lander"}
              </strong>
            </div>
            <div className="journey-scene-footer">
              <span>Body sizes adjusted in map · time compressed</span>
              <span>
                {(moon.resources.elapsedMissionSeconds / 86400).toFixed(2)}{" "}
                mission days elapsed
              </span>
            </div>
          </section>
        </div>
      </main>
      {panel ? (
        <GameInfo
          title={
            panel === "back" ? "Mission checkpoints" : "How this flight works"
          }
          onClose={() => setPanel(null)}
          pages={
            panel === "back"
              ? [
                  <div key="checkpoint">
                    <p>Your spacecraft stays at its current position.</p>
                    <button
                      className="game-info-trigger"
                      onClick={() => {
                        act({ type: "journey-restart" });
                        setPanel(null);
                      }}
                    >
                      <RotateCcw size={17} />
                      Retry from Earth orbit
                    </button>
                    <button
                      className="game-info-trigger"
                      onClick={frame.onHome}
                    >
                      Mission home
                    </button>
                    <p>
                      Retry restores the orbit checkpoint and records
                      assistance.
                    </p>
                  </div>,
                ]
              : [
                  <div key="sequence">
                    <p>
                      Earth orbit → upper-stage departure burn → coast →
                      service-engine braking burn → lunar orbit. There is no ISS
                      stop.
                    </p>
                    <p>Forward makes us faster. Backward slows us down.</p>
                    <a
                      href="https://www.nasa.gov/missions/apollo/apollo-10-mission-details/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NASA: Apollo departure and Moon arrival ↗
                    </a>
                  </div>,
                  <div key="accounts">
                    <p>
                      Date routes use NASA/JPL Horizons vectors and numerically
                      integrated Earth–Moon–Sun trajectories. Legacy saves
                      retain authored route profiles. Spacecraft masses, thrust,
                      safety thresholds and engine Isp remain authored
                      educational inputs. Fuel uses the ideal rocket equation
                      with a departure/arrival margin.
                    </p>
                    <p>
                      Moon arrival carries the full fueled lander. Earth-return
                      fuel is reserved for the lighter spacecraft after the
                      lander is left behind. Solar charging of the rover is not
                      applied to cabin power.
                    </p>
                    <a
                      href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NASA: ideal rocket equation ↗
                    </a>
                  </div>,
                  <div key="data">
                    <p>
                      Data: 1–7 November 2026 departure dates, Earth-centred
                      ICRF, TDB time. Seven-day educational dataset; these are
                      not launch-site windows or NASA-certified flights.
                    </p>
                    <a
                      href="https://ssd.jpl.nasa.gov/horizons/manual.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NASA/JPL Horizons data and frames ↗
                    </a>
                  </div>,
                  <p key="limits">
                    Speed changes screen time only. Stage disposal and lander
                    retrieval are compressed at departure. Sounds are cabin/game
                    effects. Radiation, entry heating and full orbital dynamics
                    are not simulated.
                  </p>,
                ]
          }
        />
      ) : null}
    </StoryShell>
  );
}
