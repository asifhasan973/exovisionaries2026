export const ROCKET_PARTS = [
  { id: "engines", name: "Engine cluster", color: "#a7d7fa" },
  { id: "core", name: "Main tank", color: "#e3e6f2" },
  { id: "interstage", name: "Stage connector", color: "#c4a7ea" },
  { id: "upper", name: "Upper stage", color: "#acdfe0" },
  { id: "adapter", name: "Payload mount", color: "#e2c27e" },
  { id: "lander", name: "Lunar lander", color: "#e5bd73" },
  { id: "rover", name: "Your rover", color: "#9ce8c8" },
  { id: "capsule", name: "Crew capsule", color: "#b3cdeb" },
  { id: "cover-left", name: "Left cover", color: "#d6cde7" },
  { id: "cover-right", name: "Right cover", color: "#e8d9ed" },
  { id: "tower", name: "Escape tower", color: "#bfcada" },
] as const;
export type RocketPartId = (typeof ROCKET_PARTS)[number]["id"];
export const ROCKET_ORDER: readonly RocketPartId[] = ROCKET_PARTS.map(
  (part) => part.id,
);
export const ROCKET_SHELVES: readonly (readonly RocketPartId[])[] = [
  ["core", "rover", "cover-left", "engines", "tower", "adapter"],
  ["lander", "interstage", "capsule", "upper", "cover-right"],
];
export const PAYLOAD_PARTS: readonly RocketPartId[] = [
  "lander",
  "rover",
  "capsule",
];
export const COVERS: readonly RocketPartId[] = ["cover-left", "cover-right"];
export interface RocketAssemblyState {
  version: 1;
  installed: RocketPartId[];
  fault: "wrong-slot" | "cover-blocks" | null;
  last: RocketPartId | null;
  assisted: boolean;
}
export type RocketAssemblyEvent =
  | {
      type: "rocket-build-place";
      part: RocketPartId;
      target: RocketPartId | null;
    }
  | { type: "rocket-build-remove"; part: RocketPartId }
  | { type: "rocket-build-open-cover" }
  | { type: "rocket-build-assist" };
export const emptyRocketAssembly = (): RocketAssemblyState => ({
  version: 1,
  installed: [],
  fault: null,
  last: null,
  assisted: false,
});
export const rocketComplete = (state: RocketAssemblyState) =>
  ROCKET_ORDER.every((id) => state.installed.includes(id));
export const rocketHasCover = (state: RocketAssemblyState) =>
  COVERS.some((id) => state.installed.includes(id));
export const nextRocketPart = (state: RocketAssemblyState) =>
  ROCKET_ORDER.find((id) => !state.installed.includes(id));
export const needsOpenCover = (state: RocketAssemblyState) =>
  rocketHasCover(state) &&
  PAYLOAD_PARTS.some((id) => !state.installed.includes(id));
export function reduceRocketAssembly(
  state: RocketAssemblyState,
  event: RocketAssemblyEvent,
): RocketAssemblyState {
  if (event.type === "rocket-build-assist") return { ...state, assisted: true };
  if (event.type === "rocket-build-open-cover")
    return {
      ...state,
      installed: state.installed.filter((id) => !COVERS.includes(id)),
      fault: null,
      last: null,
    };
  if (event.type === "rocket-build-remove")
    return ROCKET_ORDER.includes(event.part)
      ? {
          ...state,
          installed: state.installed.filter((id) => id !== event.part),
          fault: null,
          last: null,
        }
      : state;
  if (
    event.type !== "rocket-build-place" ||
    !ROCKET_ORDER.includes(event.part) ||
    state.installed.includes(event.part)
  )
    return state;
  if (PAYLOAD_PARTS.includes(event.part) && rocketHasCover(state))
    return { ...state, fault: "cover-blocks", last: event.part };
  if (event.target !== event.part)
    return { ...state, fault: "wrong-slot", last: event.part };
  return {
    ...state,
    installed: [...state.installed, event.part],
    fault: null,
    last: event.part,
  };
}
export function restoreRocketAssembly(
  raw: unknown,
  legacyInFlight = false,
): RocketAssemblyState {
  const clean = emptyRocketAssembly();
  if (
    legacyInFlight &&
    (!raw ||
      typeof raw !== "object" ||
      (raw as RocketAssemblyState).version !== 1)
  )
    return { ...clean, installed: [...ROCKET_ORDER] };
  if (!raw || typeof raw !== "object") return clean;
  const saved = raw as RocketAssemblyState;
  if (saved.version !== 1) return clean;
  return {
    ...clean,
    installed: ROCKET_ORDER.filter(
      (id) => Array.isArray(saved.installed) && saved.installed.includes(id),
    ),
    assisted: saved.assisted === true,
  };
}
