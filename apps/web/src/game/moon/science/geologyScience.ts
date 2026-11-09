import type { ScienceState, ScienceTarget } from "./science";
import type {
  MoonSession,
  ScienceObservation,
} from "@/game/moon/shared/session";
import type { PreparationSelection } from "@/game/moon/core/design";
import { geologyPart } from "./geology";
import { incidentEffects } from "@/game/moon/hazards/incidents";
import { surfaceResources } from "@/game/moon/surface/surface";
import { drillDurationSeconds } from "@/game/moon/shared/resources";
export const GEOLOGY_MODEL = {
  id: "geology-evidence-v1",
  sampleKg: 0.2,
  scoopSeconds: 60,
  deploySeconds: 60,
  listenSeconds: 600,
  listenFrames: 50,
} as const;
export type GeoFinding = "anorthosite" | "basalt" | "breccia" | "inconclusive";
export interface GeoSample {
  id: string;
  locationId: ScienceTarget;
  depthCm: number;
  massKg: number;
  stowed: boolean;
}
export const GEOLOGY_TARGETS = [
  { id: "lookout", name: "Light-rock patch", hint: "Close · sunlight" },
  { id: "edge", name: "Lava fragments", hint: "Shade · longer trip" },
  { id: "target", name: "Crater ejecta", hint: "Far · rough and cold" },
] as const;
export function geoTools(prep: PreparationSelection) {
  return prep.sciencePartIds
    .map(geologyPart)
    .filter((p: any): p is NonNullable<typeof p> => !!p);
}
export function geoCollector(prep: PreparationSelection) {
  return geoTools(prep).find((p: any) => p.scienceFamily === "sample");
}
export function geoTask(
  s: ScienceState,
  prep: PreparationSelection,
  phase = s.phase,
) {
  const parts = geoTools(prep),
    collector = geoCollector(prep);
  return phase === "survey"
    ? {
        mode: "analysis" as const,
        ids: parts
          .filter(
            (p: any) =>
              p.scienceFamily === "camera" || p.scienceFamily === "gpr",
          )
          .map((p: any) => p.id),
        seconds: 120,
      }
    : phase === "drilling"
      ? {
          mode: "drilling" as const,
          ids: collector ? [collector.id] : [],
          seconds:
            collector?.id === "geo-scoop-basic"
              ? GEOLOGY_MODEL.scoopSeconds
              : drillDurationSeconds(s.depthCm),
        }
      : phase === "analysis"
        ? {
            mode: "analysis" as const,
            ids: parts
              .filter((p: any) =>
                ["ir", "xrf", "xrd"].includes(p.scienceFamily),
              )
              .map((p: any) => p.id),
            seconds: 180,
          }
        : phase === "listening"
          ? {
              mode: "analysis" as const,
              ids: parts
                .filter((p: any) => p.scienceFamily === "seismometer")
                .map((p: any) => p.id),
              seconds: GEOLOGY_MODEL.listenSeconds,
            }
          : { mode: "standby" as const, ids: [], seconds: 60 };
}
function rock(
  moon: MoonSession,
  target: ScienceTarget,
): Exclude<GeoFinding, "inconclusive"> {
  return target === "edge"
    ? "basalt"
    : target === "target"
      ? "breccia"
      : moon.site === "ancient-crater"
        ? "breccia"
        : "anorthosite";
}
export function geoKey(s: ScienceState) {
  return `${s.target}:${s.depthCm}`;
}
export function geoSampleId(s: ScienceState, prep: PreparationSelection) {
  return `rock:${s.target}:${geoCollector(prep)?.id === "geo-scoop-basic" ? 0 : s.depthCm}`;
}
export function geoMeasurementId(s: ScienceState, id: string) {
  const family = geologyPart(id)?.scienceFamily,
    depth = ["camera", "gpr", "seismometer"].includes(family ?? "")
      ? "survey"
      : s.depthCm,
    dust =
      ["ir", "camera"].includes(family ?? "") && s.hazards.dust > 0.3
        ? s.hazards.sensorCalibrated
          ? ":calibrated"
          : ":dusty"
        : "";
  return `geo:${s.target}:${id}:${depth}${dust}`;
}
function signals(family: string, finding: GeoFinding, detail: number) {
  if (family === "camera")
    return finding === "anorthosite"
      ? "Pale, coarse-grained rock"
      : finding === "basalt"
        ? "Dark, fine-grained rock"
        : "Angular pieces joined in one rock";
  if (family === "ir")
    return finding === "anorthosite"
      ? "Plagioclase light signature"
      : finding === "basalt"
        ? "Pyroxene + olivine signatures"
        : "Mixed mineral light signatures";
  if (family === "xrf")
    return finding === "anorthosite"
      ? "Calcium + aluminium rich"
      : finding === "basalt"
        ? "Iron + magnesium rich"
        : "Elements vary across fragments";
  if (family === "xrd")
    return finding === "anorthosite"
      ? "Plagioclase-dominated crystals"
      : finding === "basalt"
        ? "Pyroxene + olivine crystals"
        : "Several mineral crystal patterns";
  if (family === "gpr")
    return detail > 1
      ? "Two echo boundaries beneath this scan"
      : "Subsurface echo boundary";
  return detail > 1
    ? "Quiet trace + calibration pulse"
    : "Faint calibration pulse recorded";
}
function addRecord(
  s: ScienceState,
  moon: MoonSession,
  prep: PreparationSelection,
  id: string,
): ScienceState {
  const tool = geologyPart(id);
  if (!tool) return s;
  const family = tool.scienceFamily,
    key = geoMeasurementId(s, id),
    existing = s.records.find((r) => r.id === key);
  if (existing)
    return { ...s, currentIds: [...new Set([...s.currentIds, key])] };
  const sample = s.samples.find((r) => r.id === geoSampleId(s, prep));
  if (tool.needsSample && !sample) return s;
  const detail =
      tool.detailLevel + (moon.crew.scientist === "geologist" ? 1 : 0),
    optical = ["ir", "camera"].includes(family)
      ? incidentEffects({ ...moon, science: s }).opticalQuality
      : null;
  const quality =
    optical === "low"
      ? "low"
      : optical === "medium"
        ? "medium"
        : detail >= 3
          ? "high"
          : "medium";
  const finding = rock(moon, s.target),
    duplicates = s.records.some(
      (r) =>
        r.locationId === s.target &&
        geologyPart(r.instrumentId)?.scienceFamily === family,
    );
  // Tiers improve detail/quality. Purchasing a tier and collecting alone never grant points.
  const points = duplicates
    ? 0
    : family === "camera"
      ? 2
      : family === "gpr"
        ? 5
        : family === "seismometer"
          ? 6
          : family === "xrd"
            ? 8
            : 6;
  const observation: ScienceObservation = {
    id: key,
    objective: "lunar-geology",
    locationId: s.target,
    instrumentId: id,
    depthCm: ["camera", "gpr", "seismometer"].includes(family)
      ? null
      : (sample?.depthCm ?? null),
    kind:
      family === "camera"
        ? "texture"
        : family === "gpr"
          ? "subsurface"
          : family === "seismometer"
            ? "seismic"
            : "mineral-evidence",
    quality,
    confidence: quality,
    signal: signals(family, finding, detail),
    points,
    transmitted: false,
    missionSeconds: surfaceResources(moon, moon.surface).elapsedMissionSeconds,
    sampleId:
      ["ir", "xrf", "xrd"].includes(family) && sample ? sample.id : null,
    depthRangeCm:
      ["ir", "xrf", "xrd"].includes(family) && sample && sample.depthCm > 0
        ? [Math.max(0, sample.depthCm - 10), sample.depthCm]
        : null,
  };
  return {
    ...s,
    records: [...s.records, observation],
    currentIds: [...new Set([...s.currentIds, key])],
  };
}
export function geoSurvey(
  s: ScienceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  for (const p of geoTools(prep).filter((p: any) =>
    ["camera", "gpr"].includes(p.scienceFamily),
  ))
    s = addRecord(s, moon, prep, p.id);
  return s;
}
export function geoCollect(
  s: ScienceState,
  prep: PreparationSelection,
): ScienceState {
  const collector = geoCollector(prep);
  if (!collector) return s;
  const id = geoSampleId(s, prep);
  if (s.samples.some((sample: any) => sample.id === id)) return s;
  if (
    s.samples.reduce((sum: number, p: any) => sum + p.massKg, 0) +
      GEOLOGY_MODEL.sampleKg >
    10
  )
    return { ...s, feedback: "sampleLimit" };
  return {
    ...s,
    samples: [
      ...s.samples,
      {
        id,
        locationId: s.target,
        depthCm: collector.id === "geo-scoop-basic" ? 0 : s.depthCm,
        massKg: GEOLOGY_MODEL.sampleKg,
        stowed: false,
      },
    ],
  };
}
export function geoAnalyze(
  s: ScienceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  for (const p of geoTools(prep).filter((p: any) =>
    ["ir", "xrf", "xrd"].includes(p.scienceFamily),
  ))
    s = addRecord(s, moon, prep, p.id);
  return s;
}
export function geoListen(
  s: ScienceState,
  moon: MoonSession,
  prep: PreparationSelection,
) {
  for (const p of geoTools(prep).filter(
    (p: any) => p.scienceFamily === "seismometer",
  ))
    s = addRecord(s, moon, prep, p.id);
  return s;
}
/** Rock classification needs mutually supporting mineral/element clues. Radar/shakes cannot name a rock. */
export function geologyFinding(
  records: readonly ScienceObservation[],
): GeoFinding {
  const analytical = records.filter(
    (r: any) => r.kind === "mineral-evidence" && r.quality !== "low",
  );
  const vote = (candidate: GeoFinding) =>
    new Set(
      analytical
        .filter((r: any) =>
          candidate === "anorthosite"
            ? /Plagioclase|Calcium \+ aluminium/.test(r.signal ?? "")
            : candidate === "basalt"
              ? /Pyroxene|Iron \+ magnesium/.test(r.signal ?? "")
              : /Mixed mineral|vary across fragments|Several mineral/.test(
                  r.signal ?? "",
                ),
        )
        .map((r: any) => geologyPart(r.instrumentId)?.scienceFamily),
    ).size;
  if (vote("anorthosite") >= 2) return "anorthosite";
  if (vote("basalt") >= 2) return "basalt";
  if (
    vote("breccia") >= 2 &&
    records.some(
      (r: any) =>
        r.kind === "texture" &&
        r.quality !== "low" &&
        r.signal?.startsWith("Angular"),
    )
  )
    return "breccia";
  return "inconclusive";
}
export function geoAnalytical(records: readonly ScienceObservation[]) {
  return records.some((r: any) => r.kind === "mineral-evidence");
}
export function returnedSampleKg(moon: MoonSession) {
  if (moon.rover) return moon.rover.deposited.length * 0.2;
  return moon.objective === "lunar-geology"
    ? moon.science.samples
        .filter((s: any) => s.stowed)
        .reduce((a: number, s: any) => a + s.massKg, 0)
    : 0;
}
