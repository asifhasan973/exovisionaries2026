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
const RoverScreen = lazy(() =>
  import("@/game/moon/rover/components/RoverScreen").then((module) => ({
    default: module.RoverScreen,
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

  // Module 03: Astronaut Crew Selection & Mission Plan
  if (["crew-selection", "crew-plan"].includes(stepId)) {
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

  // Module 04: Flight Readiness - Rocket Assembly Hangar
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

  // Module 04: Flight Readiness - Human Mission Checks & Rocket Packing
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

  // Module 04: Flight Readiness - Telemetry Checks (Mass, Power, Budget)
  if (["mass-check", "power-check", "budget-check"].includes(stepId)) {
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

  // Module 05: Liftoff & Earth Orbit Ascent
  if (stepId === "liftoff") {
    return (
      <FlightScreen
        session={mission}
        dispatch={dispatch}
        onBack={back}
        frame={frame}
      />
    );
  }

  // Module 06: Orbit & Trans-Lunar Injection
  if (["earth-orbit", "moon-transfer", "lunar-orbit"].includes(stepId)) {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening Moon journey…</div>}
      >
        <JourneyScreen
          session={mission}
          dispatch={dispatch}
          onBack={back}
          frame={frame}
        />
      </Suspense>
    );
  }

  // Module 07: Lunar Descent & Touchdown
  if (stepId === "lunar-descent") {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening Moon landing…</div>}
      >
        <LandingScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  // The free-driving expedition owns deployment, science and rover recovery.
  if (
    [
      "lunar-surface",
      "surface-explore",
      "surface-ready",
      "ice-science",
      "science-ready",
      "surface-recovery",
      "surface-secured",
    ].includes(stepId)
  ) {
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

  // Module 11: Crew Return & Mission Debrief
  if (["crew-return", "mission-debrief"].includes(stepId)) {
    return (
      <Suspense
        fallback={<div className="crew-loading">Opening crew return…</div>}
      >
        <ReturnScreen session={mission} dispatch={dispatch} frame={frame} />
      </Suspense>
    );
  }

  // Module 02: Spacecraft & Rover Workshop (Fallback)
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
