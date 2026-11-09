import type { WorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import type { ScienceObservation } from "@/game/moon/shared/session";
import { returnComplete, missionOutcome } from "../return";
import { expectedFinding } from "@/game/moon/science/science";
import { missionDebrief } from "./missionDebrief.ts";

export const completedMission = (s: Pick<WorkshopSession, "moon">) =>
  returnComplete(s.moon.returnFlight, s.moon.designSignature) &&
  missionOutcome(s.moon) !== null;

const REGION_NAMES = {
  "crater-rim": "Crater rim",
  "permanent-shadow": "Permanently shadowed region",
  "lunar-highlands": "Lunar highlands",
  "ancient-crater": "Ancient crater",
};

/** Current mission regions have no documented transform to the NASA Atlas coordinates. */
export function reportLocation(site: WorkshopSession["moon"]["site"]) {
  return {
    name: site
      ? (REGION_NAMES[site] ?? "Unspecified region")
      : "Unspecified region",
    atlasSite: null,
    explanation:
      "This mission uses an illustrative region, not a surveyed lunar coordinate. The reference map below is not your landing or sample point. Rover X/Y positions cannot be converted to real lunar coordinates.",
  };
}

function observationMeaning(
  record: ScienceObservation,
  delivered: ScienceObservation[],
) {
  if (!record.transmitted)
    return "Collected in the simulation; not delivered. It cannot support a finding received on Earth.";
  if (record.kind === "hydrogen-clue")
    return "A hydrogen indication is a clue. Hydrogen alone does not establish water ice.";
  if (record.kind === "water-evidence") {
    if (record.missionSeconds == null && !record.sampleId)
      return `Saved interpretation: ${record.result ?? "inconclusive"}. This older record does not retain measurement pairing, so agreeing channels cannot be reconstructed.`;
    const group = delivered.filter(
      (r) =>
        r.locationId === record.locationId &&
        (record.sampleId
          ? r.sampleId === record.sampleId
          : r.missionSeconds === record.missionSeconds),
    );
    const finding = expectedFinding(group);
    return finding === "confirmed"
      ? "Agreeing optical and gas readings support water confirmation within this simulation. This is not a discovery on the real Moon."
      : finding === "negative"
        ? "The delivered readings do not detect water in this simulated sampled material. This does not rule out water elsewhere."
        : "The delivered optical and gas evidence is incomplete, low quality or does not agree. Water remains inconclusive.";
  }
  if (record.kind === "mineral-evidence")
    return record.classification && record.classification !== "inconclusive"
      ? `The recorded ${record.instrumentId} evidence supports a simulated ${record.classification} classification. It does not describe the composition of a real lunar sample.`
      : "The recorded mineral evidence does not support a definite rock classification.";
  return "This is a recorded field observation. A sealed sample, texture or subsurface clue alone does not establish composition.";
}

/** Read-only projection of the existing mission ledger; never awards points or writes a save. */
export function missionReport(session: WorkshopSession) {
  const d = missionDebrief(session),
    m = session.moon,
    recovered = completedMission(session);
  const records = [
    ...new Map(m.science.records.map((record) => [record.id, record])).values(),
  ];
  const delivered = records.filter((record) => record.transmitted);
  const rover = m.rover;
  const samples = rover
    ? [...new Set([...rover.cargo, ...rover.deposited])].map((id) => ({
        id: `crew-sample-${id}`,
        location: id,
        massKg: 0.2,
        stowed: rover.deposited.includes(id),
      }))
    : [
        ...new Map(
          (m.science.samples ?? []).map((sample) => [sample.id, sample]),
        ).values(),
      ].map((sample) => ({
        id: sample.id,
        location: sample.locationId,
        massKg: sample.massKg,
        stowed: sample.stowed,
      }));
  const returned = recovered ? samples.filter((sample) => sample.stowed) : [];
  const done = new Set(session.progress.completedActivities);
  return {
    debrief: d,
    recovered,
    outcome: recovered ? missionOutcome(m) : null,
    objective:
      m.objective === "lunar-geology" ? "Geology Explorer" : "Ice Explorer",
    location: reportLocation(m.site),
    samples: samples.map((sample) => ({
      ...sample,
      returned: recovered && sample.stowed,
    })),
    returnedCount: returned.length,
    returnedKg: returned.reduce((total, sample) => total + sample.massKg, 0),
    observations: records.map((record) => ({
      ...record,
      meaning: observationMeaning(record, delivered),
      receivedOnEarth: recovered && record.transmitted,
    })),
    deliveredCount: delivered.length,
    journey: [
      { name: "Launch", recorded: done.has("liftoff") },
      { name: "Moon arrival", recorded: done.has("moon-transfer") },
      { name: "Landing", recorded: done.has("lunar-descent") },
      { name: "Fieldwork", recorded: m.surface.deployed || !!rover?.deployed },
      { name: "Crew home", recorded: recovered },
    ],
  };
}
export type MoonMissionReport = ReturnType<typeof missionReport>;
