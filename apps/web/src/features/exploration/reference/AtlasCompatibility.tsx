import { useState } from "react";
import { readBrowserSelectionSession } from "@/game/moon/crew/selectionSession";
import {
  completedMission,
  reportLocation,
} from "@/game/moon/return/debrief/missionReport";
import { AtlasReference } from "./AtlasReference";
import "@/game/moon/return/debrief/missionReport.css";
export function AtlasCompatibility() {
  const [saved] = useState(readBrowserSelectionSession);
  return (
    <div className="atlas-compatibility">
      <header>
        <h1>Explore a lunar reference region</h1>
        <p>
          Mission-linked context is available in Your Moon Mission Report after
          a Moon mission. This preview is NASA reference data, separate from
          your simulated results.
        </p>
        {completedMission(saved) && (
          <button
            onClick={() =>
              window.location.assign(`${import.meta.env.BASE_URL}?report=1`)
            }
          >
            Open your completed mission report
          </button>
        )}
      </header>
      <AtlasReference context={reportLocation(saved.moon.site).explanation} />
    </div>
  );
}
