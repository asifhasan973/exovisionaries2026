import { useState } from "react";
import { readBrowserSelectionSession } from "@/game/moon/crew/selectionSession";
import { createWorkshopSession } from "@/game/moon/workshop/lander/workshopSession";
import { GameSettingsProvider } from "@/shared/shell/settings";
import { SiteNavbar } from "@/shared/site/SiteNavbar";
import { navigatePage } from "@/shared/site/siteNavigation";
import { MissionDebrief } from "./MissionDebrief.tsx";
import { completedMission } from "./missionReport";
export default function SavedMissionReport() {
  const [saved] = useState(readBrowserSelectionSession);
  const [session] = useState(() =>
    createWorkshopSession(
      saved.progress,
      saved.preparation,
      saved.readiness,
      saved.flight,
      saved.moon,
      saved.repair,
    ),
  );
  return (
    <GameSettingsProvider onRestart={() => navigatePage("mission")}>
      <div className="site-page-frame">
        <SiteNavbar activePage="mission" onNavigate={navigatePage} />
        <main className="site-page-content saved-report-page">
          {completedMission(session) ? (
            <MissionDebrief
              session={session}
              onHome={() => navigatePage("home")}
            />
          ) : (
            <section>
              <h1>No completed mission report is available</h1>
              <p>
                Your saved mission does not yet establish crew recovery. You can
                continue it from mission home.
              </p>
              <button onClick={() => navigatePage("home")}>Mission home</button>
            </section>
          )}
        </main>
      </div>
    </GameSettingsProvider>
  );
}
