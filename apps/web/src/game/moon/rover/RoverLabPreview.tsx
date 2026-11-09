import { useState } from "react";
import { RoverScreen } from "./components/RoverScreen";
import { createDebugSession } from "../debug/debugSessionSeeder";
import type {
  WorkshopSession,
  MissionEvent,
} from "../workshop/lander/workshopSession";
import { reduceMission } from "../workshop/lander/workshopSession";
import type { SelectionFrame } from "../crew/SelectionScreens";

export function RoverLabPreview() {
  const [session, setSession] = useState<WorkshopSession>(() =>
    createDebugSession("lunar-surface"),
  );

  const dispatch = (event: MissionEvent) => {
    setSession((curr) => reduceMission(curr, event));
  };

  const frame: SelectionFrame = {
    onHome: () => {
      window.location.assign("#");
    },
    voiceEnabled: true,
  };

  return <RoverScreen session={session} dispatch={dispatch} frame={frame} />;
}
