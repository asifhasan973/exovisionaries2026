import { navigatePage } from "./siteNavigation";
import { lazy, Suspense, useState } from "react";
import { GameSettingsProvider } from "@/shared/shell/settings";
import { readBrowserSelectionSession } from "@/game/moon/crew/selectionSession";
import { SiteNavbar } from "./SiteNavbar";
import type { SitePage as Page } from "./SiteNavbar";

const Exploration = lazy(() => import("@/features/exploration/Exploration"));
const AtlasCompatibility = lazy(() =>
  import("@/features/exploration/reference/AtlasCompatibility").then((m) => ({
    default: m.AtlasCompatibility,
  })),
);
const EngineeringLab = lazy(
  () => import("@/features/engineering/EngineeringLab"),
);
const Archive = lazy(() =>
  import("@/features/archive/NasaMissionArchive").then((m) => ({
    default: m.NasaMissionArchive,
  })),
);
export default function SitePage({
  page: initialPage,
}: {
  page: Exclude<Page, "home" | "mission">;
}) {
  const [page, setPage] = useState(initialPage);
  const [preparation] = useState(
    () => readBrowserSelectionSession().preparation,
  );
  return (
    <GameSettingsProvider
      onRestart={() => window.location.assign("/?restart=1")}
    >
      <div className="site-page-frame">
        <SiteNavbar activePage={page} onNavigate={navigatePage} />
        <div className="site-page-content">
          <Suspense fallback={<p role="status">Opening NASA exploration…</p>}>
            {page === "atlas" ? (
              <AtlasCompatibility />
            ) : page === "archive" ? (
              <Archive />
            ) : page === "engineering" ? (
              <EngineeringLab preparation={preparation} />
            ) : (
              <Exploration
                initialPage={page}
                onPageChange={(next) => {
                  history.replaceState(null, "", `/?explore=${next}`);
                  setPage(next);
                }}
              />
            )}
          </Suspense>
        </div>
      </div>
    </GameSettingsProvider>
  );
}
