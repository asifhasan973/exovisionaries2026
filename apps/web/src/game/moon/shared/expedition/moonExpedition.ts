import type { PreparationSelection } from "@/game/moon/core/design";
import type { MoonSession } from "@/game/moon/shared/session";
import type { ScienceState, ScienceTarget } from "@/game/moon/science/science";
import { sciencePlan } from "@/game/moon/science/science";
import { geoCollector } from "@/game/moon/science/geologyScience";
import type { ReturnState, ReturnAction } from "@/game/moon/return/return";

/** Preview valid sample trips without changing equipment, receipts or scientific results. */
export function expeditionSites(
  science: ScienceState,
  moon: MoonSession,
  preparation: PreparationSelection,
) {
  const scoop =
    moon.objective === "lunar-geology" &&
    geoCollector(preparation)?.id === "geo-scoop-basic";
  const maximum =
    moon.objective === "lunar-geology"
      ? (geoCollector(preparation)?.maxDepthCm ?? 20)
      : 100;
  const depths = scoop
    ? [0]
    : [
        ...new Set([
          Math.max(10, Math.min(maximum, science.depthCm)),
          Math.min(20, maximum),
          10,
        ]),
      ];
  const targets: ScienceTarget[] = ["lookout", "edge"];
  if (science.target === "target") targets.push("target");
  return targets.map((target) => {
    const alternatives = depths.flatMap((depthCm) =>
      [science.useGas, false]
        .filter((value, i, all) => all.indexOf(value) === i)
        .map((useGas) => {
          const state: ScienceState = {
            ...science,
            target,
            depthCm,
            useGas,
            program: "sample",
            sensorPlan: "ground",
          };
          return {
            target,
            depthCm,
            useGas,
            plan: sciencePlan(state, moon, preparation),
          };
        }),
    );
    return (
      alternatives.find((option) => option.plan.feasible) ?? alternatives[0]
    );
  });
}

export function recommendedSite(
  science: ScienceState,
  moon: MoonSession,
  preparation: PreparationSelection,
) {
  const sites = expeditionSites(science, moon, preparation);
  return (
    sites.find(
      (site) => site.target === science.target && site.plan.feasible,
    ) ??
    sites.find((site) => site.plan.feasible) ??
    sites[0]
  );
}

export function nextSurfaceTask(
  moon: MoonSession,
): "rover" | "data" | "samples" | "crew" | null {
  const { science } = moon,
    hazards = science.hazards;
  if (!hazards.roverParked) return "rover";
  if (
    !hazards.dataArchived ||
    science.records.some((record: any) => !record.transmitted)
  )
    return "data";
  if (
    moon.objective === "lunar-geology" &&
    science.samples.some((sample: any) => !sample.stowed)
  )
    return "samples";
  if (!hazards.crewChecked) return "crew";
  return null;
}

/** One contextual maneuver at a time; each still passes the return reducer. */
export function nextReturnAction(flight: ReturnState): ReturnAction | null {
  if (flight.stage === "ready") return "launch";
  if (flight.stage === "rendezvous")
    return flight.closingMS > 0.25
      ? "brake"
      : Math.abs(flight.alignment) > 0.2
        ? flight.alignment > 0
          ? "left"
          : "right"
        : "dock";
  if (flight.stage === "docked") return "depart";
  if (flight.stage === "coast") return "skip-coast";
  if (flight.stage === "chute-ready") return "chutes";
  return null;
}
