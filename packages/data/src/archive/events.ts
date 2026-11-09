import type { NasaMissionEvent } from "./types";
import { EARLY_DECADE_EVENTS } from "./earlyDecades";
import { APOLLO_ERA_EVENTS } from "./apolloEra";
import { SHUTTLE_ERA_EVENTS } from "./shuttleEra";
import { MODERN_ERA_EVENTS } from "./modernEra";
import { ARTEMIS_ERA_EVENTS } from "./artemisEra";

export const NASA_MISSION_EVENTS: NasaMissionEvent[] = [
  ...EARLY_DECADE_EVENTS,
  ...APOLLO_ERA_EVENTS,
  ...SHUTTLE_ERA_EVENTS,
  ...MODERN_ERA_EVENTS,
  ...ARTEMIS_ERA_EVENTS,
];
