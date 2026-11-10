import {
  SceneBoundary,
  SceneFallback,
  GameInfo,
  isEngineFrozen,
  useLoadingStore,
} from "@exo/ui";
import { GEOLOGY_LABELS } from "@/game/moon/science/geologyCopy";
import { lazy, Suspense, useEffect, useState, useEffectEvent } from "react";
import {
  Check,
  Info,
  ShieldCheck,
  Users,
  TriangleAlert,
  Anchor,
} from "lucide-react";
import type {
  WorkshopSession,
  MissionEvent,
} from "@/game/moon/workshop/lander/workshopSession";
import type { SelectionFrame } from "@/game/moon/crew/SelectionScreens";
import { StoryShell, StoryControls } from "@/shared/shell";
import { useStoryNavigation } from "@/game/moon/core/storyNavigationContext";
import { EngineerCompanion } from "@/game/moon/narrative/components/EngineerCompanion";
import { useGameSettings } from "@/shared/shell";
import { Term } from "@/game/moon/core/learning/Learning";
import { sound } from "@exo/audio";
import {
  canDock,
  returnActive,
  returnComplete,
  returnFrameLimit,
  returnReport,
} from "./return.ts";
import type { ReturnAction } from "./return.ts";
import { nextReturnAction } from "@/game/moon/shared/expedition/moonExpedition";
import { RETURN_LINES } from "./returnCopy.ts";
import {
  missionCard,
  downloadMissionCard,
} from "@/game/moon/shared/missionCard";
import "./return.css";
const MissionDebrief = lazy(() => {
  const task = import("./debrief/MissionDebrief.tsx");
  useLoadingStore.getState().registerLoaderTask(task);
  return task.then((m) => ({ default: m.MissionDebrief }));
});
const ReturnViewport = lazy(() =>
  import("./ReturnViewport.tsx").then((m) => ({ default: m.ReturnViewport })),
);
const TITLES = {
  ready: "Time to come home",
  ascending: "Lift off from the Moon",
  rendezvous: "Meet your orbit crew",
  docked: "Three crew. One cabin.",
  burning: "Next stop: Earth",
  coast: "On our way home",
  "entry-ready": "Turn the heat shield forward",
  entry: "Through Earth’s air",
  "chute-ready": "Open the parachutes",
  chutes: "Nearly home!",
  splashdown: "Welcome back, explorers!",
} as const;
export function ReturnScreen({
  session,
  dispatch,
  frame,
}: {
  session: WorkshopSession;
  dispatch(e: MissionEvent): void;
  frame: SelectionFrame;
}) {
  const r = session.moon.returnFlight,
    { effects, gentle } = useGameSettings(),
    [panel, setPanel] = useState<"notes" | "back" | "retry" | null>(null),
    geo = session.moon.objective === "lunar-geology",
    debrief = session.progress.stepId === "mission-debrief";
  const reviewing = !!useStoryNavigation()?.reviewing;
  const active = returnActive(r),
    complete = returnComplete(r, session.moon.designSignature),
    report = returnReport(session.moon, r),
    card = debrief ? missionCard(session) : null;
  const act = (e: MissionEvent) => {
      if (reviewing || isEngineFrozen()) return;
      sound.setMuted(!effects);
      sound.playClick();
      dispatch(e);
    },
    action = (a: ReturnAction) => {
      // Hint/help pauses the clock. An explicit cockpit action is also an intent
      // to continue; otherwise the highlighted Brake/Align/Shield button is inert.
      if (reviewing || isEngineFrozen()) return;
      if (r.paused) dispatch({ type: "return-resume" });
      act({ type: "return-action", action: a });
    };
  useEffect(() => {
    if (!active || r.paused || debrief || reviewing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden && !isEngineFrozen())
        dispatch({ type: "return-tick", seconds: (now - last) / 1000 });
      last = now;
    }, 100);
    return () => clearInterval(timer);
  }, [active, r.paused, debrief, reviewing, dispatch]);
  useEffect(() => {
    const pause = () => dispatch({ type: "return-pause" }),
      hide = () => {
        if (document.hidden) pause();
      },
      hint = () => {
        dispatch({ type: "return-hint" });
        pause();
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
    if (reviewing) return;
    if (complete) sound.playFanfare();
    else if (["docked", "chutes"].includes(r.stage)) sound.playStagingThud();
    else if (r.stage === "entry-ready") sound.playRadioBeep();
  }, [r.stage, complete, effects, reviewing]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (!reviewing && !r.paused && ["ascending", "burning"].includes(r.stage))
      sound.startRocketRoar();
    else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  }, [r.stage, r.paused, effects, reviewing]);
  const primary = nextReturnAction(r),
    keyboardAction = useEffectEvent(action);
  useEffect(() => {
    if (reviewing || debrief || panel) return;
    const key = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.defaultPrevented ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "input,textarea,select,[contenteditable=true],[role=dialog]",
          )) ||
        (event.key === " " && event.target instanceof HTMLButtonElement)
      )
        return;
      let choice: ReturnAction | null = null;
      if (r.stage === "burning") {
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
          event.preventDefault();
          dispatch({
            type: "return-burn-pilot",
            angle: Math.max(-90, (r.burnAngle ?? 0) - 5),
          });
          return;
        }
        if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
          event.preventDefault();
          dispatch({
            type: "return-burn-pilot",
            angle: Math.min(90, (r.burnAngle ?? 0) + 5),
          });
          return;
        }
        if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
          event.preventDefault();
          dispatch({
            type: "return-burn-pilot",
            throttle: Math.min(
              1,
              Math.round(((r.burnThrottle ?? 0.5) + 0.05) * 100) / 100,
            ),
          });
          return;
        }
        if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
          event.preventDefault();
          dispatch({
            type: "return-burn-pilot",
            throttle: Math.max(
              0,
              Math.round(((r.burnThrottle ?? 0.5) - 0.05) * 100) / 100,
            ),
          });
          return;
        }
        if (event.key === " ") {
          event.preventDefault();
          dispatch({
            type: "return-burn-pilot",
            firing: !r.burnFiring,
          });
          return;
        }
      } else if (r.stage === "rendezvous") {
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")
          choice = "left";
        else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
          choice = "right";
        else if (event.key === " " || event.key.toLowerCase() === "s")
          choice = "brake";
        else if (event.key.toLowerCase() === "e" && canDock(r)) choice = "dock";
      } else if (event.key.toLowerCase() === "e") choice = primary;
      if (choice) {
        event.preventDefault();
        keyboardAction(choice);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [r, primary, reviewing, debrief, panel, dispatch]);
  const nextLabel = debrief
    ? "Mission home"
    : r.paused
      ? "Resume"
      : complete
        ? "See our mission"
        : r.stage === "ready"
          ? "Launch ascent cabin"
          : r.stage === "rendezvous"
            ? r.closingMS > 0.25
              ? "Slow the approach"
              : Math.abs(r.alignment) > 0.2
                ? "Line up the cabins"
                : "Dock gently"
            : r.stage === "docked"
              ? "Fire Earth-return engine"
              : r.stage === "entry-ready"
                ? "Choose heat shield"
                : r.stage === "chute-ready"
                  ? "Open Earth parachutes"
                  : r.stage === "coast"
                    ? "Continue to Earth"
                    : "Pause";
  const next = () =>
    reviewing
      ? dispatch({ type: "next" })
      : debrief
        ? frame.onHome?.()
        : r.paused
          ? act({ type: "return-resume" })
          : complete
            ? act({ type: "next" })
            : primary
              ? action(primary)
              : active
                ? act({ type: "return-pause" })
                : undefined;
  const warning = ["unsafeDock", "wrongShield", "fuel", "reserve"].includes(
      r.feedback,
    ),
    stageIndex = ["ready", "ascending"].includes(r.stage)
      ? 0
      : ["rendezvous", "docked"].includes(r.stage)
        ? 1
        : ["burning", "coast"].includes(r.stage)
          ? 2
          : ["entry-ready", "entry", "chute-ready", "chutes"].includes(r.stage)
            ? 3
            : 4;
  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          onBack={() => {
            dispatch({ type: "return-pause" });
            dispatch({ type: "back" });
          }}
          onNext={next}
          nextLabel={nextLabel}
          nextDisabled={
            !reviewing &&
            !debrief &&
            !r.paused &&
            (r.stage === "entry-ready" ||
              (r.stage === "ready" && !report.feasible))
          }
          progress={
            <span>
              {debrief
                ? complete
                  ? "Moon mission · report"
                  : "Mission record · recovery incomplete"
                : "Return · " + (stageIndex + 1) + "/5"}
            </span>
          }
          nextHint={
            !debrief && r.stage === "rendezvous" && !canDock(r)
              ? "Slow down and line up"
              : undefined
          }
        />
      }
    >
      <main
        className={`workshop-main return-main ${debrief ? "is-debrief" : "return-expedition"}`}
        data-return-stage={r.stage}
        id="story-content"
        tabIndex={-1}
        aria-labelledby="return-title"
      >
        <div className="return-heading">
          <div>
            <span>{debrief ? "MISSION LOG" : "CREW RETURN"}</span>
            <h1 id="return-title">
              {debrief
                ? card?.crewRecovered === 3
                  ? "You brought everyone home."
                  : "Mission debrief"
                : (TITLES as Record<string, string>)[r.stage]}
            </h1>
          </div>
          <button
            className="game-info-trigger"
            onClick={() => {
              act({ type: "return-pause" });
              setPanel("notes");
            }}
          >
            <Info size={17} />
            {debrief ? "Full mission log" : "Flight notes"}
          </button>
        </div>
        {debrief && card ? (
          <Suspense
            fallback={
              <p role="status">Opening your recorded mission report…</p>
            }
          >
            <MissionDebrief
              session={session}
              onHome={frame.onHome}
              onRetry={() => setPanel("retry")}
              preview={
                reviewing ||
                (import.meta.env.DEV && window.location.hash.includes("debug"))
              }
            />
          </Suspense>
        ) : (
          <>
            <div className="return-layout">
              <section className="return-console" aria-label="Return controls">
                <div className="return-crew">
                  <Users size={21} />
                  <strong>
                    {r.crewLocation === "moon-and-orbit"
                      ? "2 Moon · 1 orbit"
                      : r.crewLocation === "ascent-and-orbit"
                        ? "2 ascent · 1 orbit"
                        : r.crewLocation === "ocean"
                          ? "3 crew recovered"
                          : "3 aboard command module"}
                  </strong>
                </div>
                {r.stage === "ready" ? (
                  <>
                    <h2>Our way home is ready</h2>
                    <div className="return-checklist">
                      <span>
                        <Check />
                        Rover parked
                      </span>
                      <span>
                        <Check />
                        Data relayed
                      </span>
                      <span>
                        <Check />
                        Ascent fuel protected
                      </span>
                    </div>
                    {!report.contingencyOK ? (
                      <p className="return-reserve-note">
                        Using spare day kits. Return directly to Earth.
                      </p>
                    ) : null}
                  </>
                ) : r.stage === "rendezvous" ? (
                  <>
                    <h2>Slow. Line up. Dock.</h2>
                    <div className="return-dock">
                      <div>
                        <span>Closing speed</span>
                        <strong className={r.closingMS > 0.25 ? "is-warn" : ""}>
                          {r.closingMS.toFixed(2)} m/s
                        </strong>
                        <small>Target ≤ 0.25 m/s</small>
                      </div>
                      <div>
                        <span>Alignment</span>
                        <strong
                          className={
                            Math.abs(r.alignment) > 0.2 ? "is-warn" : ""
                          }
                        >
                          {Math.abs(r.alignment) <= 0.2
                            ? "Centered"
                            : "Off-center"}
                        </strong>
                        <div className="return-aim">
                          <i />
                          <b style={{ left: `${50 + r.alignment * 40}%` }} />
                        </div>
                      </div>
                    </div>
                    <p>
                      {r.closingMS > 0.25
                        ? "First, slow the approach."
                        : Math.abs(r.alignment) > 0.2
                          ? "Now line up with the orbiting cabin."
                          : "Aligned and slow. Ready to dock."}
                    </p>
                  </>
                ) : r.stage === "docked" ? (
                  <div className="return-checkpoint">
                    <Users size={38} />
                    <h2>Crew transferred!</h2>
                    <p>Empty lander released before the Earth burn.</p>
                  </div>
                ) : r.stage === "entry-ready" ? (
                  <>
                    <h2>Which side faces Earth?</h2>
                    <div className="return-orient">
                      <button onClick={() => action("nose")}>
                        <span>△</span>Nose first
                      </button>
                      <button data-return-hint onClick={() => action("shield")}>
                        <ShieldCheck />
                        Heat shield first
                      </button>
                    </div>
                    <p>
                      Service module separates as we turn.{" "}
                      <Term term="heatshield">Heat shield</Term>
                    </p>
                  </>
                ) : r.stage === "chute-ready" ? (
                  <div className="return-checkpoint">
                    <ShieldCheck size={38} />
                    <h2>Low & slow</h2>
                    <p>
                      Heat shield did its job.{" "}
                      <Term term="parachutes">Parachutes</Term> come next.
                    </p>
                  </div>
                ) : complete ? (
                  <div className="return-checkpoint">
                    <Anchor size={38} />
                    <h2>Splashdown!</h2>
                    <p>Three crew recovered. Data ready to review.</p>
                  </div>
                ) : r.stage === "burning" ? (
                  <div className="return-burning-console">
                    <h2>Trans-Earth Injection Burn</h2>
                    <p className="return-controls-guide">
                      A/D align SPS engine · W/S throttle · hold Space to fire
                    </p>

                    {(() => {
                      const angle = Math.max(
                        -90,
                        Math.min(90, r.burnAngle ?? 0),
                      );
                      const isAligned = Math.abs(angle) <= 8;
                      const throttle = Math.max(
                        0,
                        Math.min(1, r.burnThrottle ?? 0.5),
                      );
                      const throttlePct = Math.round(throttle * 100);
                      const currentDv = Math.max(
                        0,
                        r.burnDv ?? (r.frame / returnFrameLimit(r)) * 1200,
                      );
                      const reqDv = 1200;
                      const vPct = Math.min(
                        100,
                        Math.round((currentDv / reqDv) * 100),
                      );

                      const beamWidthPct = (Math.abs(angle) / 90) * 50;
                      const beamLeftPct = angle < 0 ? 50 - beamWidthPct : 50;

                      return (
                        <>
                          <div
                            className="journey-align-hud"
                            role="group"
                            aria-label="TEI alignment HUD"
                          >
                            <div className="journey-align-header">
                              <span className="journey-hud-title">
                                Trans-Earth Alignment
                              </span>
                              <span className="journey-angle-readout">
                                {angle > 0 ? `+${angle}°` : `${angle}°`}
                              </span>
                              <span
                                className={`journey-align-badge ${isAligned ? "is-aligned" : "is-misaligned"}`}
                              >
                                {isAligned
                                  ? "ALIGNED 0° (±8°)"
                                  : angle < -8
                                    ? "STEER RIGHT → (D)"
                                    : "← STEER LEFT (A)"}
                              </span>
                            </div>

                            <div className="journey-align-scale">
                              <div className="journey-align-track">
                                <div
                                  className={`journey-align-target-zone ${isAligned ? "is-active" : ""}`}
                                />
                                <div className="journey-align-center-line" />
                                {Math.abs(angle) > 0.5 && (
                                  <div
                                    className={`journey-align-beam ${isAligned ? "is-aligned" : angle < 0 ? "is-left" : "is-right"}`}
                                    style={{
                                      left: `${beamLeftPct}%`,
                                      width: `${beamWidthPct}%`,
                                    }}
                                  >
                                    <div className="journey-align-tip" />
                                  </div>
                                )}
                              </div>

                              <input
                                type="range"
                                min="-90"
                                max="90"
                                step="1"
                                value={angle}
                                className="journey-align-slider"
                                aria-label="Spacecraft alignment angle"
                                onChange={(e) =>
                                  dispatch({
                                    type: "return-burn-pilot",
                                    angle: Number(e.target.value),
                                  })
                                }
                              />

                              <div className="journey-scale-labels">
                                <span>-90°</span>
                                <span>-45°</span>
                                <span className="is-zero">0° EARTH VECTOR</span>
                                <span>+45°</span>
                                <span>+90°</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="journey-throttle-hud"
                            role="group"
                            aria-label="TEI throttle scale"
                          >
                            <div className="journey-throttle-header">
                              <span className="journey-hud-title">
                                SPS Engine Throttle
                              </span>
                              <span className="journey-throttle-readout region-boost">
                                {throttlePct}% ·{" "}
                                {throttle <= 0.35
                                  ? "Vernier Cutoff"
                                  : throttle <= 0.7
                                    ? "Cruise Trim"
                                    : "High Boost"}
                              </span>
                            </div>
                            <div className="journey-throttle-track-wrapper">
                              <div className="journey-throttle-regions">
                                <div className="region-band band-cutoff" />
                                <div className="region-band band-precision" />
                                <div className="region-band band-cruise" />
                                <div className="region-band band-boost" />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.02"
                                value={throttle}
                                className="journey-throttle-slider"
                                aria-label="Engine throttle scale"
                                onChange={(e) =>
                                  dispatch({
                                    type: "return-burn-pilot",
                                    throttle: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div className="journey-throttle-labels">
                              <span>0%</span>
                              <span className="label-precision">
                                10–35% VERNIER
                              </span>
                              <span className="label-cruise">
                                35–70% CRUISE
                              </span>
                              <span className="label-boost">70–100% BOOST</span>
                            </div>
                          </div>

                          <div
                            className="journey-velocity-hud"
                            role="group"
                            aria-label="TEI Delta-V"
                          >
                            <div className="journey-velocity-header">
                              <span className="journey-hud-title">
                                Earth Return ΔV
                              </span>
                              <strong
                                className={`journey-velocity-number ${currentDv >= 1200 ? "is-acquired" : ""}`}
                              >
                                {Math.round(currentDv)} / 1200 m/s ({vPct}%)
                              </strong>
                            </div>
                            <div className="journey-velocity-gauge">
                              <div
                                className={`journey-velocity-fill ${currentDv >= 1200 ? "is-acquired" : ""}`}
                                style={{
                                  width: `${Math.min(100, (currentDv / reqDv) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="journey-pilot-actions">
                            <button
                              className="journey-fire"
                              aria-pressed={!!r.burnFiring}
                              disabled={r.paused}
                              onClick={() =>
                                dispatch({
                                  type: "return-burn-pilot",
                                  firing: !r.burnFiring,
                                })
                              }
                            >
                              {r.burnFiring
                                ? "Cut SPS Engine (Space)"
                                : "Fire SPS Engine (Space)"}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="return-running">
                    <h2>{(TITLES as Record<string, string>)[r.stage]}</h2>
                    <progress
                      max={returnFrameLimit(r)}
                      value={r.frame}
                      aria-label="Return phase progress"
                    />
                    <p>
                      {r.stage === "coast"
                        ? `${((r.frame / returnFrameLimit(r)) * 3).toFixed(1)} / 3 travel days`
                        : r.stage === "ascending"
                          ? "Climbing to the orbiting spacecraft"
                          : r.stage === "entry"
                            ? "Heat shield protecting the crew"
                            : "Parachutes deployed · descending to the ocean"}
                    </p>
                  </div>
                )}
                {!r.paused &&
                !active &&
                r.stage !== "rendezvous" &&
                r.stage !== "entry-ready" ? (
                  <button
                    className="return-play-action"
                    onClick={next}
                    disabled={r.stage === "ready" && !report.feasible}
                  >
                    {complete ? "Mission complete · See results" : nextLabel}
                    <span>→</span>
                  </button>
                ) : null}
                {r.paused ? (
                  <button
                    className="return-play-action"
                    onClick={() => act({ type: "return-resume" })}
                  >
                    Resume flight<span>▶</span>
                  </button>
                ) : null}
                {r.stage === "rendezvous" ? (
                  <div className="return-dock-actions">
                    <button
                      onClick={() => action("left")}
                      aria-label="Align left"
                    >
                      ← Left
                    </button>
                    <button
                      onClick={() => action("brake")}
                      aria-label="Brake approach"
                    >
                      Brake
                    </button>
                    <button
                      onClick={() => action("right")}
                      aria-label="Align right"
                    >
                      Right →
                    </button>
                    <button
                      className="return-dock-now"
                      onClick={() => action("dock")}
                      disabled={!canDock(r)}
                    >
                      Dock · E
                    </button>
                  </div>
                ) : null}
                {warning ? (
                  <div className="return-alert" role="alert">
                    <TriangleAlert size={23} />
                    <strong>
                      {(RETURN_LINES as Record<string, string>)[r.feedback]}
                    </strong>
                  </div>
                ) : null}
                <EngineerCompanion
                  voiceEnabled={frame.voiceEnabled ?? true}
                  reaction={
                    complete ? "complete" : warning ? "warning" : "intro"
                  }
                  token={r.mistakes}
                  scriptedReply={{
                    id: `return-${r.feedback}`,
                    text: (RETURN_LINES as Record<string, string>)[r.feedback],
                  }}
                />
              </section>
              <section className="return-scene">
                <SceneBoundary
                  fallback={
                    <SceneFallback
                      scene="return"
                      label="Mission view"
                      detail="Use the controls to keep playing"
                    />
                  }
                >
                  <Suspense
                    fallback={
                      <div className="return-fallback">
                        Opening return flight…
                      </div>
                    }
                  >
                    <ReturnViewport flight={r} gentle={gentle} />
                  </Suspense>
                </SceneBoundary>
                <div className="return-scene-label">
                  <span>
                    {r.stage === "splashdown"
                      ? "EARTH · RECOVERY"
                      : r.stage === "entry-ready"
                        ? "EARTH · APPROACH"
                        : ["chutes", "chute-ready", "entry"].includes(r.stage)
                          ? "EARTH · ATMOSPHERE"
                          : r.stage === "coast"
                            ? "MOON → EARTH"
                            : "MOON · CREW RETURN"}
                  </span>
                  <strong>
                    {r.stage === "coast"
                      ? "3-day return"
                      : r.stage === "rendezvous"
                        ? canDock(r)
                          ? "Docking alignment ready"
                          : "Brake and align"
                        : r.stage === "ascending"
                          ? "Ascent in progress"
                          : "Bring the crew home"}
                  </strong>
                </div>
                <div
                  className="return-stage-track"
                  aria-label={`Return journey stage ${stageIndex + 1} of 5`}
                >
                  {["LIFT OFF", "DOCK", "EARTH BURN", "RE-ENTRY", "HOME"].map(
                    (name, index) => (
                      <span
                        key={name}
                        className={
                          index === stageIndex
                            ? "is-current"
                            : index < stageIndex
                              ? "is-done"
                              : ""
                        }
                      >
                        {index < stageIndex ? "✓" : index + 1} {name}
                      </span>
                    ),
                  )}
                </div>
                <div className="return-scene-note">
                  Cinematic scale · time compressed · <Term term="gravity" />
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      {panel ? (
        <GameInfo
          title={
            panel === "retry"
              ? "Try another design?"
              : panel === "back"
                ? "Return checkpoint"
                : "Crew return · evidence & model"
          }
          onClose={() => setPanel(null)}
          pages={
            panel === "retry"
              ? [
                  <div key="retry">
                    <p>
                      Save your mission card to compare. Your crew and blueprint
                      stay; flight and science start fresh on Earth.
                    </p>
                    <button
                      className="game-info-trigger"
                      onClick={() => downloadMissionCard(session)}
                    >
                      Save this result
                    </button>
                    <button
                      className="conversation-next"
                      onClick={() => {
                        act({ type: "return-new-attempt" });
                        setPanel(null);
                      }}
                    >
                      Start new attempt
                    </button>
                  </div>,
                ]
              : panel === "back"
                ? [
                    <div key="back">
                      <p>Mission paused. Continue here, or return home.</p>
                      <button
                        className="game-info-trigger"
                        onClick={frame.onHome}
                      >
                        Mission home
                      </button>
                    </div>,
                  ]
                : [
                    <div key="account">
                      <h3>Three crew accounted for</h3>
                      <p>
                        Commander + scientist leave the Moon in the ascent
                        cabin. Their support specialist waits in the
                        command/service spacecraft. After docking, all three
                        transfer to the command module. The empty ascent cabin
                        is released, then the service engine performs Earth
                        departure.
                      </p>
                      <p>
                        Food reserve:{" "}
                        {(
                          (report.resources.supportUnitsRemaining ?? 0) / 3
                        ).toFixed(1)}{" "}
                        days for three crew. Ascent fuel:{" "}
                        {Math.round(report.resources.ascentPropellantKg ?? 0)}{" "}
                        kg. Service fuel:{" "}
                        {Math.round(report.resources.returnPropellantKg ?? 0)}{" "}
                        kg.
                      </p>
                      <p>
                        The rover and descent stage stay on the Moon.{" "}
                        {geo || session.moon.rover
                          ? `Sealed sample box contains ${report.physicalSampleKg.toFixed(1)} kg; samples were collected and stowed through real actions.`
                          : "This Ice mission measured exposed cuttings; no physical sample was stowed for return."}{" "}
                        The manifest’s 10-kg sample allowance remains
                        conservative allocated mass in the fuel equation.
                      </p>
                    </div>,
                    <div key="model">
                      <h3>Physical rule. Authored numbers.</h3>
                      <p>
                        Fuel uses the ideal rocket equation and the approved dry
                        masses. Ascent uses 2,100 m/s; rendezvous adds 20 m/s;
                        Earth departure uses 1,260 m/s. These are game
                        allowances. The earlier outward course correction is not
                        charged again.
                      </p>
                      <p>
                        Ascent: 10 virtual min. Rendezvous: 60 min. Earth burn:
                        3 min. Coast: 3 days. Entry: 10 min. Chutes: 3 min. Each
                        uses the same 600-W cabin load and three crew-days per
                        day. Pausing, replaying speech and changing speed do not
                        consume extra mission time.
                      </p>
                      <p>
                        Docking limits and re-entry/parachute gates are teaching
                        constraints, not validated trajectory, aerothermal or
                        parachute models. Cabin power is an aggregate allocation
                        including return-capsule power.
                      </p>
                      <a
                        href="https://www.nasa.gov/history/apollo-11-mission-overview/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NASA: Apollo ascent, docking and return ↗
                      </a>
                    </div>,
                    <div key="result">
                      <h3>Evidence over guesses</h3>
                      <p>
                        {session.moon.outcome?.reasons.join(" ") ??
                          "Crew recovery is credited only after splashdown."}
                      </p>
                      <p>
                        {r.mistakes} return choice corrections.{" "}
                        {r.assisted
                          ? "Assistance used."
                          : "Challenge mode without added assistance."}{" "}
                        {session.moon.science.fieldworkStopped
                          ? "Surface work stopped early."
                          : ""}
                      </p>
                      <p>
                        Scene distances, maneuvers, thermal effects and timers
                        are simplified. This is a game, not a forecast or flight
                        certification.
                      </p>
                    </div>,
                    ...(debrief
                      ? session.moon.science.records.map((obs: any) => (
                          <div key={obs.id}>
                            <h3>
                              {obs.instrumentId.toUpperCase()} ·{" "}
                              {obs.locationId}
                            </h3>
                            <p>
                              {obs.signal}.{" "}
                              {obs.classification
                                ? (GEOLOGY_LABELS as Record<string, string>)[
                                    obs.classification
                                  ]
                                : (obs.result ?? "Uninterpreted clue")}{" "}
                              · {obs.quality ?? obs.confidence} quality.{" "}
                              {obs.transmitted
                                ? "Transmitted"
                                : "Not transmitted"}
                              .
                            </p>
                            <p>
                              {obs.points} new-measurement points.{" "}
                              {obs.depthRangeCm
                                ? `Sampled ${obs.depthRangeCm[0]}–${obs.depthRangeCm[1]} cm.`
                                : "Surface scan."}
                            </p>
                          </div>
                        ))
                      : []),
                    ...(debrief
                      ? session.moon.science.hazards.log.map((log: any) => (
                          <div key={log.id}>
                            <h3>
                              {log.kind} · {log.status}
                            </h3>
                            <p>{log.reason}</p>
                            <p>
                              {log.actions
                                .map((a: any) => a.action)
                                .join(" → ")}
                            </p>
                          </div>
                        ))
                      : []),
                  ]
          }
        />
      ) : null}
    </StoryShell>
  );
}
