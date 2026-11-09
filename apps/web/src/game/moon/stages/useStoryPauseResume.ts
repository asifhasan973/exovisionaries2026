import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import { isEngineFrozen } from "@exo/ui";
import { roverActive } from "@/game/moon/rover/rover";
import { trialActive } from "@/game/moon/hazards/trial";
import type { MissionEvent } from "@/game/moon/workshop/lander/workshopSession";
import type { StoryPersistenceState } from "./useStoryPersistence.ts";

export function useStoryPauseResume(
  dispatch: (event: MissionEvent) => void,
  latestRef: MutableRefObject<StoryPersistenceState>,
) {
  const pausedFromMenu = useRef({
    flight: false,
    trial: false,
    journey: false,
    landing: false,
    surface: false,
    science: false,
    returning: false,
    rover: false,
  });

  const pauseGame = useCallback(() => {
    const current = latestRef.current;
    const shouldPause = {
      flight: current.flight.status === "running",
      trial:
        trialActive(current.readiness.trial) && !current.readiness.trial.paused,
      returning:
        current.progress.stepId === "crew-return" &&
        !current.moon.returnFlight.paused,
      science:
        ["ice-science", "surface-recovery"].includes(current.progress.stepId) &&
        !current.moon.science.paused,
      surface:
        ["lunar-surface", "surface-explore"].includes(
          current.progress.stepId,
        ) && !current.moon.surface.paused,
      rover:
        !!current.moon.rover &&
        roverActive(current.moon.rover) &&
        !current.moon.rover.paused,
      landing:
        current.progress.stepId === "lunar-descent" &&
        !current.moon.landing.paused,
      journey:
        ["moon-transfer"].includes(current.progress.stepId) &&
        !current.moon.journey.paused &&
        current.moon.journey.stage !== "complete",
    };

    if (shouldPause.rover) pausedFromMenu.current.rover = true;
    if (shouldPause.flight) pausedFromMenu.current.flight = true;
    if (shouldPause.trial) pausedFromMenu.current.trial = true;
    if (shouldPause.returning) pausedFromMenu.current.returning = true;
    if (shouldPause.science) pausedFromMenu.current.science = true;
    if (shouldPause.surface) pausedFromMenu.current.surface = true;
    if (shouldPause.landing) pausedFromMenu.current.landing = true;
    if (shouldPause.journey) pausedFromMenu.current.journey = true;

    if (shouldPause.rover) dispatch({ type: "rover-pause" });
    if (shouldPause.flight) dispatch({ type: "flight-pause" });
    if (shouldPause.trial) dispatch({ type: "trial-pause" });
    if (shouldPause.returning) dispatch({ type: "return-pause" });
    if (shouldPause.science) dispatch({ type: "science-pause" });
    if (shouldPause.surface) dispatch({ type: "surface-pause" });
    if (shouldPause.landing) dispatch({ type: "landing-pause" });
    if (shouldPause.journey) dispatch({ type: "journey-pause" });

    window.dispatchEvent(new Event("game-help-open"));
  }, [dispatch, latestRef]);

  const resumeGame = useCallback(() => {
    if (isEngineFrozen()) return;
    if (pausedFromMenu.current.rover) dispatch({ type: "rover-resume" });
    if (pausedFromMenu.current.flight) dispatch({ type: "flight-resume" });
    if (pausedFromMenu.current.returning) dispatch({ type: "return-resume" });
    if (pausedFromMenu.current.science) dispatch({ type: "science-resume" });
    if (pausedFromMenu.current.surface) dispatch({ type: "surface-resume" });
    if (pausedFromMenu.current.landing) dispatch({ type: "landing-resume" });
    if (pausedFromMenu.current.journey) dispatch({ type: "journey-resume" });
    if (pausedFromMenu.current.trial) dispatch({ type: "trial-resume" });
    pausedFromMenu.current = {
      flight: false,
      trial: false,
      journey: false,
      landing: false,
      surface: false,
      science: false,
      returning: false,
      rover: false,
    };
  }, [dispatch]);

  return { pauseGame, resumeGame };
}
