import {
  SceneBoundary,
  SceneFallback,
  GameInfo,
  isEngineFrozen,
  useLoadingStore,
} from "@exo/ui";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useEffectEvent,
  useRef,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Pause,
  Play,
  TriangleAlert,
} from "lucide-react";
import type {
  WorkshopSession,
  MissionEvent,
} from "@/game/moon/workshop/lander/workshopSession";
import type { SelectionFrame } from "@/game/moon/crew/SelectionScreens";
import { StoryShell } from "@/shared/shell";
import { useStoryNavigation } from "@/game/moon/core/storyNavigationContext";
import { EngineerCompanion } from "@/game/moon/narrative/components/EngineerCompanion";
import { useGameSettings } from "@/shared/shell";
import { sound } from "@exo/audio";
import { canDock, returnActive, returnComplete, returnReport } from "./return";
import type { ReturnAction } from "./return";
import { returnPresentation } from "./returnPresentation";
import { ReturnRail } from "./presentation";
import { RETURN_LINES } from "./returnCopy";
import { downloadMissionCard } from "@/game/moon/shared/missionCard";
import "./return.css";
const MissionDebrief = lazy(() => {
  const task = import("./debrief/MissionDebrief.tsx");
  useLoadingStore.getState().registerLoaderTask(task);
  return task.then((m) => ({ default: m.MissionDebrief }));
});
const ReturnViewport = lazy(() =>
  import("./ReturnViewport").then((m) => ({ default: m.ReturnViewport })),
);

export function ReturnScreen({
  session,
  dispatch,
  frame,
}: {
  session: WorkshopSession;
  dispatch(e: MissionEvent): void;
  frame: SelectionFrame;
}) {
  const r = session.moon.returnFlight;
  const { effects, gentle } = useGameSettings();
  const [panel, setPanel] = useState<"notes" | "back" | "retry" | null>(null);
  const geo = session.moon.objective === "lunar-geology";
  const debrief = session.progress.stepId === "mission-debrief";
  const reviewing = !!useStoryNavigation()?.reviewing;
  const active = returnActive(r);
  const complete = returnComplete(r, session.moon.designSignature);
  const report = returnReport(session.moon, r);
  const presentation = returnPresentation(r, complete);
  const celebrated = useRef(complete);
  const act = (event: MissionEvent) => {
    if (reviewing || isEngineFrozen()) return;
    sound.setMuted(!effects);
    sound.playClick();
    dispatch(event);
  };
  const action = (value: ReturnAction) => {
    if (reviewing || isEngineFrozen()) return;
    if (r.paused) dispatch({ type: "return-resume" });
    act({ type: "return-action", action: value });
  };
  useEffect(() => {
    if (!active || r.paused || debrief || reviewing || panel) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden && !isEngineFrozen())
        dispatch({ type: "return-tick", seconds: (now - last) / 1000 });
      last = now;
    }, 100);
    return () => clearInterval(timer);
  }, [active, r.paused, debrief, reviewing, panel, dispatch]);
  useEffect(() => {
    const pause = () => dispatch({ type: "return-pause" });
    const hide = () => {
      if (document.hidden) pause();
    };
    const hint = () => {
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
    if (complete && !celebrated.current && !reviewing && !isEngineFrozen())
      sound.playFanfare();
    celebrated.current = complete;
  }, [complete, effects, reviewing]);
  useEffect(() => {
    sound.setMuted(!effects);
    if (
      !reviewing &&
      !r.paused &&
      !panel &&
      ["ascending", "burning"].includes(r.stage)
    )
      sound.startRocketRoar();
    else sound.stopRocketRoar();
    return () => sound.stopRocketRoar();
  }, [r.stage, r.paused, effects, reviewing, panel]);
  const keyboardAction = useEffectEvent(action);
  useEffect(() => {
    if (reviewing || debrief || panel) return;
    const key = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "input,textarea,select,a,[contenteditable=true],[role=dialog]",
          )) ||
        (event.key === " " && event.target instanceof HTMLButtonElement)
      )
        return;
      let choice: ReturnAction | null = null;
      if (r.stage === "rendezvous") {
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")
          choice = "left";
        else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
          choice = "right";
        else if (event.key === " " || event.key.toLowerCase() === "s")
          choice = "brake";
        else if (event.key.toLowerCase() === "e" && canDock(r)) choice = "dock";
      }
      if (choice) {
        event.preventDefault();
        keyboardAction(choice);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [r, reviewing, debrief, panel]);
  const next = () => {
    if (reviewing || isEngineFrozen()) return;
    if (complete) act({ type: "next" });
    else if (r.paused) act({ type: "return-resume" });
    else if (presentation.primaryAction && !presentation.primaryDisabled)
      action(presentation.primaryAction);
    else if (active) act({ type: "return-pause" });
  };
  const warning = ["unsafeDock", "wrongShield", "fuel", "reserve"].includes(
    r.feedback,
  );
  const goBack = () => {
    if (isEngineFrozen()) return;
    dispatch({ type: "return-pause" });
    dispatch({ type: "back" });
  };
  return (
    <StoryShell
      {...frame}
      controls={
        debrief ? (
          false
        ) : (
          <footer className="conversation-controls return-footer">
            <button className="conversation-back" onClick={goBack}>
              <ArrowLeft size={20} />
              Back
            </button>
            <span className="return-footer-status" role="status">
              {complete ? (
                "Recovery complete"
              ) : r.paused ? (
                <>
                  <Pause size={14} />
                  Mission paused
                </>
              ) : active ? (
                <>
                  <Play size={14} />
                  Flight running
                </>
              ) : (
                `Return · ${presentation.stepIndex + 1}/5`
              )}
            </span>
            <div className="next-control">
              {complete && (
                <button className="return-home-link" onClick={frame.onHome}>
                  Back to Home
                </button>
              )}
              {presentation.awaitingChoice ? (
                <span className="return-choice-prompt">
                  Choose an orientation above
                </span>
              ) : (
                <button
                  data-primary-action
                  className="conversation-next"
                  onClick={next}
                  disabled={
                    presentation.primaryDisabled ||
                    (r.stage === "ready" && !report.feasible)
                  }
                >
                  {presentation.primaryLabel}
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </footer>
        )
      }
    >
      <main
        className={`workshop-main return-main ${debrief ? "is-debrief" : "return-expedition"}`}
        data-return-stage={r.stage}
        id="story-content"
        tabIndex={-1}
        aria-labelledby={debrief ? "moon-report-title" : "return-title"}
      >
        {debrief ? (
          <Suspense
            fallback={<p role="status">Opening your mission report…</p>}
          >
            <MissionDebrief
              session={session}
              onHome={frame.onHome}
              onRetry={() => setPanel("retry")}
              preview={reviewing || frame.isDebugSession}
            />
          </Suspense>
        ) : (
          <>
            <div className="return-heading">
              <div>
                <h1 id="return-title">{presentation.title}</h1>
                <p>{presentation.instruction}</p>
              </div>
              <button
                className="game-info-trigger"
                aria-label="Flight notes"
                title="Flight notes"
                onClick={() => {
                  act({ type: "return-pause" });
                  setPanel("notes");
                }}
              >
                <Info size={17} />
                <span>Flight notes</span>
              </button>
            </div>
            <ol
              className="return-stage-track"
              aria-label={`Crew return · stage ${presentation.stepIndex + 1} of 5`}
            >
              {["Lift off", "Dock", "Earth burn", "Re-entry", "Home"].map(
                (name, index) => (
                  <li
                    key={name}
                    aria-current={
                      index === presentation.stepIndex ? "step" : undefined
                    }
                    className={
                      index < presentation.stepIndex || complete
                        ? "is-done"
                        : index === presentation.stepIndex
                          ? "is-current"
                          : ""
                    }
                  >
                    <span>
                      {index < presentation.stepIndex || complete ? (
                        <Check size={14} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {name}
                  </li>
                ),
              )}
            </ol>
            <div className="return-layout">
              <section
                className="return-scene-column"
                aria-label="Return flight scene and briefing"
              >
                <div className="return-scene">
                  <SceneBoundary
                    fallback={
                      <SceneFallback
                        scene="return"
                        label="Mission view"
                        detail="Status and flight controls remain available"
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
                    {r.stage === "splashdown"
                      ? "Earth · recovery ocean"
                      : [
                            "entry-ready",
                            "entry",
                            "chute-ready",
                            "chutes",
                          ].includes(r.stage)
                        ? "Earth · atmosphere"
                        : ["coast", "burning"].includes(r.stage)
                          ? "Moon → Earth"
                          : ["rendezvous", "docked"].includes(r.stage)
                            ? "Lunar orbit · rendezvous"
                            : "Moon · departure"}
                  </div>
                  {r.stage === "rendezvous" && (
                    <div className="return-docking-guide">
                      <span>Command spacecraft</span>
                      <span>← Docking direction</span>
                      <span>Ascent cabin</span>
                    </div>
                  )}
                  {r.stage === "entry-ready" && (
                    <div
                      className={`return-capsule-key ${r.feedback === "wrongShield" ? "is-nose-first" : ""}`}
                    >
                      <span>Pointed nose</span>
                      <span>Broad dark heat shield</span>
                    </div>
                  )}
                  <span className="return-scene-note">
                    Cinematic scale · time compressed
                  </span>
                  {r.paused && !complete && (
                    <span className="return-paused-badge">
                      <Pause size={14} />
                      Paused
                    </span>
                  )}
                </div>
                <div className="return-briefing">
                  <EngineerCompanion
                    voiceEnabled={frame.voiceEnabled ?? true}
                    reaction={
                      complete ? "complete" : warning ? "warning" : "intro"
                    }
                    token={r.mistakes}
                    scriptedReply={{
                      // Revised lines use speech synthesis instead of an outdated recording.
                      id:
                        r.feedback === "ready" || r.feedback === "entry-ready"
                          ? `return-briefing-${r.feedback}`
                          : `return-${r.feedback}`,
                      text: RETURN_LINES[r.feedback],
                    }}
                  />
                </div>
              </section>
              <div className="return-rail-column">
                <ReturnRail
                  session={session}
                  recovered={complete}
                  action={action}
                  dispatch={act}
                />
                {warning && (
                  <div className="return-alert" role="alert">
                    <TriangleAlert size={19} />
                    <p>
                      {r.feedback === "unsafeDock"
                        ? `${r.closingMS > 0.25 ? "Brake to 0.25 m/s or slower. " : ""}${Math.abs(r.alignment) > 0.2 ? "Center the cabins before docking." : ""}`
                        : RETURN_LINES[r.feedback]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      {panel ? (
        <GameInfo
          title={
            panel === "retry"
              ? "Plan another mission"
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
                      Your crew and blueprint stay. Flight and science progress
                      will start again.
                    </p>
                    <button
                      className="game-info-trigger"
                      onClick={() => downloadMissionCard(session)}
                    >
                      Export current result
                    </button>
                    <button
                      className="game-info-trigger"
                      onClick={() => setPanel(null)}
                    >
                      Cancel
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
                        Back to Home
                      </button>
                      <button
                        className="game-info-trigger"
                        onClick={() => setPanel(null)}
                      >
                        Continue here
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
                  ]
          }
        />
      ) : null}
    </StoryShell>
  );
}
