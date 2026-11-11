import { useState } from "react";
import {
  readBrowserSelectionSession,
  writeBrowserSelectionSession,
} from "@/game/moon/crew/selectionSession";
import {
  createWorkshopSession,
  reduceMission,
} from "@/game/moon/workshop/lander/workshopSession";
import { GameInfo, isEngineFrozen } from "@exo/ui";
import { GameSettingsProvider } from "@/shared/shell/settings";
import { SiteNavbar } from "@/shared/site/SiteNavbar";
import { navigatePage } from "@/shared/site/siteNavigation";
import { MissionDebrief } from "./MissionDebrief.tsx";
import { completedMission } from "./missionReport";
export default function SavedMissionReport() {
  const [retry, setRetry] = useState(false);
  const [saveError, setSaveError] = useState("");
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
  const startAttempt = () => {
    if (isEngineFrozen()) return;
    const next = reduceMission(session, { type: "return-new-attempt" });
    if (next === session) return;
    const stored = writeBrowserSelectionSession(
      next.progress,
      saved.voiceEnabled,
      next.preparation,
      next.readiness,
      next.flight,
      next.moon,
      next.repair,
    );
    if (!stored) {
      setSaveError(
        "The new attempt could not be saved. Your current result is still open; export it before trying again.",
      );
      return;
    }
    navigatePage("mission");
  };
  return (
    <GameSettingsProvider onRestart={() => navigatePage("mission")}>
      <div className="site-page-frame">
        <SiteNavbar activePage="mission" onNavigate={navigatePage} />
        <main className="site-page-content saved-report-page">
          {completedMission(session) ? (
            <MissionDebrief
              session={session}
              onHome={() => navigatePage("home")}
              onRetry={() => setRetry(true)}
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
      {retry && (
        <GameInfo
          title="Plan another mission"
          onClose={() => setRetry(false)}
          pages={[
            <div key="retry">
              <p>
                Your crew and blueprint stay. Flight and science progress will
                start again.
              </p>
              {saveError && <p role="alert">{saveError}</p>}
              <button
                className="game-info-trigger"
                onClick={() => setRetry(false)}
              >
                Cancel
              </button>
              <button className="conversation-next" onClick={startAttempt}>
                Start new attempt
              </button>
            </div>,
          ]}
        />
      )}
    </GameSettingsProvider>
  );
}
