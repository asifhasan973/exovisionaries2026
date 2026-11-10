import { reduceRover } from "@/game/moon/rover/rover";
import { STORY_FLOW, getStoryStep } from "./flow";
import { reduceStoryProgress } from "./progress";
import type { ChoiceId, StoryProgress } from "./types";
import type { MoonObjective } from "../shared/catalog";
import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import { createDebugSession, registerSkipResolver } from "@exo/debug";

export type StoryCursor = Pick<StoryProgress, "stepId" | "lineIndex">;
export interface MissionReview {
  anchor: StoryProgress;
  forward: StoryCursor[];
}
export function savedMissionProgress(s: WorkshopSession) {
  return s.review?.anchor ?? s.progress;
}

export function pauseMission(s: WorkshopSession): WorkshopSession {
  const { moon, readiness } = s;
  const isActive = (stage: string, stages: readonly string[]) =>
    stages.includes(stage);
  return {
    ...s,
    flight: {
      ...s.flight,
      status: s.flight.status === "running" ? "paused" : s.flight.status,
    },
    readiness: {
      ...readiness,
      trial: {
        ...readiness.trial,
        paused:
          readiness.trial.paused ||
          isActive(readiness.trial.phase, [
            "outbound",
            "drilling",
            "returning",
          ]),
      },
    },
    moon: {
      ...moon,
      ...(moon.rover
        ? { rover: reduceRover(moon.rover, { type: "rover-pause" }, moon) }
        : {}),
      journey: {
        ...moon.journey,
        paused:
          moon.journey.paused ||
          !isActive(moon.journey.stage, ["route", "complete"]),
      },
      landing: {
        ...moon.landing,
        paused:
          moon.landing.paused ||
          isActive(moon.landing.stage, [
            "separating",
            "braking",
            "descending",
            "aborting",
          ]),
      },
      surface: {
        ...moon.surface,
        paused:
          moon.surface.paused ||
          isActive(moon.surface.stage, ["deploying", "driving", "charging"]),
        held: false,
      },
      science: {
        ...moon.science,
        paused:
          moon.science.paused ||
          isActive(moon.science.phase, [
            "outbound",
            "survey",
            "drilling",
            "analysis",
            "listening",
            "returning",
            "recovering",
            "transmitting",
          ]),
      },
      returnFlight: {
        ...moon.returnFlight,
        paused:
          moon.returnFlight.paused ||
          isActive(moon.returnFlight.stage, [
            "ascending",
            "burning",
            "coast",
            "entry",
            "chutes",
          ]),
      },
      human: {
        ...moon.human,
        returnTest: {
          ...moon.human.returnTest,
          paused:
            moon.human.returnTest.paused ||
            moon.human.returnTest.phase === "running",
          held: false,
        },
        packingGame: { ...moon.human.packingGame, held: false },
      },
    },
  };
}

/** A backwards visit never spends resources, clears receipts or restarts physics. */
export function navigateBack(s: WorkshopSession): WorkshopSession {
  const isDebug =
    typeof window !== "undefined" &&
    (window.location.hash.includes("debug") ||
      window.location.search.includes("debug"));
  const paused = isDebug ? s : pauseMission(s),
    current = s.progress,
    step = getStoryStep(current.stepId, current.selections.objective);
  let progress: StoryProgress;
  if (step.kind === "conversation" && current.lineIndex > 0)
    progress = reduceStoryProgress(current, { type: "back" });
  else {
    const history = [...current.history];
    while (history.at(-1)?.stepId === current.stepId) history.pop();
    const previous =
      history.pop() ??
      STORY_FLOW[
        STORY_FLOW.findIndex((item) => item.id === current.stepId) - 1
      ];
    if (!previous) return paused;
    const target = getStoryStep(
      "stepId" in previous ? previous.stepId : previous.id,
      current.selections.objective,
    );
    progress = {
      ...current,
      stepId: target.id,
      lineIndex:
        "lineIndex" in previous
          ? previous.lineIndex
          : target.kind === "conversation"
            ? target.lines.length - 1
            : 0,
      history,
    };
  }
  const locked =
    !isDebug &&
    (!!s.review ||
      s.flight.t > 0 ||
      !["prepare", "validate"].includes(s.moon.phase));
  return {
    ...paused,
    flight:
      isDebug && s.flight.status === "paused"
        ? { ...s.flight, status: "ready" }
        : paused.flight,
    progress: {
      ...progress,
      milestones: progress.milestones
        ? { ...progress.milestones, pending: undefined }
        : undefined,
    },
    ...(locked
      ? {
          review: {
            anchor: s.review?.anchor ?? current,
            forward: [
              ...(s.review?.forward ?? []),
              { stepId: current.stepId, lineIndex: current.lineIndex },
            ],
          },
        }
      : { review: undefined }),
  };
}
export function navigateForward(s: WorkshopSession): WorkshopSession {
  if (!s.review) return s;
  const forward = [...s.review.forward],
    target = forward.pop();
  if (!target || !forward.length) {
    const { review, ...rest } = s;
    return { ...rest, progress: review!.anchor };
  }
  return {
    ...s,
    review: { ...s.review, forward },
    progress: {
      ...s.progress,
      ...target,
      history: [
        ...s.progress.history,
        { stepId: s.progress.stepId, lineIndex: s.progress.lineIndex },
      ],
    },
  };
}

/** Unified in-session stage advancement using the seeder engine directly on active session. */
export function advanceMissionSkip(source: WorkshopSession): WorkshopSession {
  const currentStep = getStoryStep(
    source.progress.stepId,
    source.progress.selections.objective,
  );
  if (currentStep.kind === "endpoint") return source;

  const currentIndex = STORY_FLOW.findIndex(
    (item) => item.id === currentStep.id,
  );
  const targetStep = STORY_FLOW[currentIndex + 1];
  if (!targetStep) return source;

  const seeded = createDebugSession<WorkshopSession>(targetStep.id, {
    objective:
      (source.progress.selections.objective as MoonObjective) || "lunar-ice",
    gender: source.progress.playerGender,
    playerName: source.progress.playerName,
    site: source.progress.selections.site as ChoiceId | undefined,
  });
  if (!seeded) return source;

  // Build merged selections preserving player decisions
  const selections = {
    ...seeded.progress.selections,
    ...source.progress.selections,
  };
  if (currentStep.kind === "choice" && !selections[currentStep.choiceKey]) {
    const defaultOption = currentStep.options.find((o) => o.available)?.id;
    if (defaultOption) {
      selections[currentStep.choiceKey] = defaultOption;
    }
  }

  // Ensure current step's activity is marked complete if applicable
  const completed = new Set(seeded.progress.completedActivities ?? []);
  for (const act of source.progress.completedActivities ?? []) {
    completed.add(act);
  }
  if (currentStep.kind === "activity" && currentStep.activity) {
    completed.add(currentStep.activity);
  }
  if (currentStep.id === "crew-selection") {
    completed.add("crew-selection");
    completed.add("crew-plan");
  }

  const effectiveObjective =
    source.moon?.objective ||
    (source.progress.selections.objective as MoonObjective) ||
    "lunar-ice";
  const defaultScientist =
    effectiveObjective === "lunar-ice" ? "astrobiologist" : "geologist";
  const defaultSupport = "robotics-specialist";
  const mergedCrew = {
    ...seeded.moon.crew,
    scientist:
      source.moon?.crew?.scientist ||
      seeded.moon?.crew?.scientist ||
      defaultScientist,
    support:
      source.moon?.crew?.support ||
      seeded.moon?.crew?.support ||
      defaultSupport,
  };

  return {
    ...seeded,
    moon:
      targetStep.module >= 3 && targetStep.id !== "crew-selection"
        ? { ...seeded.moon, crew: mergedCrew }
        : seeded.moon,
    progress: {
      ...seeded.progress,
      playerName: source.progress.playerName || seeded.progress.playerName,
      playerGender:
        source.progress.playerGender ?? seeded.progress.playerGender,
      selections,
      history: [
        ...source.progress.history,
        {
          stepId: source.progress.stepId,
          lineIndex: source.progress.lineIndex,
        },
      ],
      completedActivities: [...completed],
      milestones: {
        ...seeded.progress.milestones,
        introduced: true,
        celebrated: [
          ...new Set([
            ...(source.progress.milestones?.celebrated ?? []),
            ...(seeded.progress.milestones?.celebrated ?? []),
          ]),
        ],
      },
    },
  };
}

// Register authoritative skip execution handler with @exo/debug package
registerSkipResolver(advanceMissionSkip);
