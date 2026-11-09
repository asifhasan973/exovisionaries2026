import { lazy, Suspense } from "react";
import type {
  WorkshopSession,
  MissionEvent,
} from "@/game/moon/workshop/lander/workshopSession";
import type { SelectionFrame } from "@/game/moon/crew/SelectionScreens";
import { FlightScreen } from "@/game/moon/flight/launch/FlightScreen";
import { ReadinessScreen } from "@/game/moon/readiness/ReadinessScreen";
import { WorkshopScreen } from "@/game/moon/workshop/lander/WorkshopScreen";

const ReturnScreen = lazy(() =>
  import("@/game/moon/return/ReturnScreen").then((m) => ({
    default: m.ReturnScreen,
  })),
);
const RoverScreen = lazy(() =>
  import("@/game/moon/rover/components/RoverScreen").then((m) => ({
    default: m.RoverScreen,
  })),
);
const LandingScreen = lazy(() =>
  import("@/game/moon/landing/LandingScreen").then((m) => ({
    default: m.LandingScreen,
  })),
);
const JourneyScreen = lazy(() =>
  import("@/game/moon/flight/journey/JourneyScreen").then((m) => ({
    default: m.JourneyScreen,
  })),
);
const RocketAssemblyScreen = lazy(() =>
  import("@/game/moon/workshop/rocket/RocketAssemblyScreen").then((m) => ({
    default: m.RocketAssemblyScreen,
  })),
);
const HumanReadinessScreen = lazy(() =>
  import("@/game/moon/readiness/HumanReadinessScreen").then((module) => ({
    default: module.HumanReadinessScreen,
  })),
);
const CrewScreen = lazy(() =>
  import("@/game/moon/crew/CrewScreen").then((module) => ({
    default: module.CrewScreen,
  })),
);

export interface SimulationScreenRouterProps {
  mission: WorkshopSession;
  frame: SelectionFrame;
  dispatch: (event: MissionEvent) => void;
  back: () => void;
  autoBuilding: boolean;
  setAutoBuilding: (building: boolean) => void;
}

export function SimulationScreenRouter({
  mission,
  frame,
  dispatch,
  back,
  autoBuilding,
  setAutoBuilding,
}: SimulationScreenRouterProps) {
  const { progress } = mission;
  const stepId = progress.stepId;
  const moduleNum = mission.progress.stepId ? getStepModule(stepId) : 5;

  if (moduleNum === 8) {
    return (
      <Suspense
        fallback={
          <div className="crew-loading" role="status">
            Opening crew selection…
          </div>
        }
      >
        <CrewScreen
          key={progress.stepId}
          session={mission}
          dispatch={dispatch}
          onBack={back}
          frame={frame}
        />
      </Suspense>
    );
  }

  if (moduleNum === 14) {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening crew return…</div>}
      >
        <ReturnScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  if ([11, 12, 13].includes(moduleNum)) {
    return (
      <Suspense
        fallback={
          <div className="crew-loading">Opening your rover expedition…</div>
        }
      >
        <RoverScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  if (moduleNum === 10) {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening Moon landing…</div>}
      >
        <LandingScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  if (moduleNum === 9) {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening Moon journey…</div>}
      >
        <JourneyScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  if (moduleNum === 7) {
    return (
      <FlightScreen
        session={mission}
        dispatch={dispatch}
        onBack={back}
        frame={frame}
      />
    );
  }

  if (stepId === "rocket-assembly") {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening rocket hangar…</div>}
      >
        <RocketAssemblyScreen
          session={mission}
          dispatch={dispatch}
          onBack={back}
          frame={frame}
        />
      </Suspense>
    );
  }

  if (
    [
      "crew-check",
      "systems-check",
      "stress-check",
      "rocket-pack",
      "launch-ready",
    ].includes(stepId)
  ) {
    return (
      <Suspense
        fallback={
          <div className="crew-loading" role="status">
            Opening mission checks…
          </div>
        }
      >
        <HumanReadinessScreen
          key={stepId}
          session={mission}
          dispatch={dispatch}
          onBack={back}
          frame={frame}
        />
      </Suspense>
    );
  }

  if (moduleNum === 6) {
    return (
      <ReadinessScreen
        key={progress.stepId}
        session={mission}
        dispatch={dispatch}
        onBack={back}
        frame={frame}
      />
    );
  }

  return (
    <WorkshopScreen
      key={progress.stepId}
      session={mission}
      dispatch={dispatch}
      onBack={back}
      frame={frame}
      autoBuilding={autoBuilding}
      onStopAutoBuild={() => setAutoBuilding(false)}
      onAutoBuild={() => {
        dispatch({ type: "begin-auto-build" });
        setAutoBuilding(true);
      }}
    />
  );
}

function getStepModule(stepId: string): number {
  if (["crew-selection", "crew-plan", "crew-briefing"].includes(stepId))
    return 8;
  if (["crew-return", "mission-debrief"].includes(stepId)) return 14;
  if (
    [
      "surface-deploy",
      "rover-traverse",
      "lunar-surface",
      "science-drill",
      "incident-recovery",
    ].includes(stepId)
  )
    return 11;
  if (["lunar-descent", "landing-site"].includes(stepId)) return 10;
  if (["earth-orbit", "moon-transfer", "lunar-orbit"].includes(stepId))
    return 9;
  if (["liftoff", "ascent-stage"].includes(stepId)) return 7;
  if (
    [
      "crew-check",
      "mass-check",
      "power-check",
      "budget-check",
      "systems-check",
      "stress-check",
      "rocket-pack",
      "rocket-assembly",
      "launch-ready",
    ].includes(stepId)
  )
    return 6;
  return 5;
}
