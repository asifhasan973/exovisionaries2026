import { lazy, Suspense, useEffect, useState } from "react";
import {
  OrientationGuard,
  LoadingScreen,
  InstallAppModal,
  useLoadingStore,
  registerPreloaderHandlers,
} from "@exo/ui";
import {
  preloadEntrySubsystems,
  preloadMissionSubsystems,
} from "./shared/services";
import { AppErrorBoundary } from "./shared/shell";
import {
  isDevelopment,
  parseDebugHash,
  DebugToolbar,
  type DebugRoute,
} from "@exo/debug";
import "./game/moon/debug";

// Register web-specific preloading logic with central loading store
registerPreloaderHandlers({
  preloadEntry: preloadEntrySubsystems,
  preloadMission: preloadMissionSubsystems,
});

const ConversationPreview = lazy(() =>
  import("./game/moon/narrative").then((m) => ({
    default: m.ConversationPreview,
  })),
);
const RoverLabPreview = lazy(() =>
  import("./game/moon/rover/RoverLabPreview").then((m) => ({
    default: m.RoverLabPreview,
  })),
);
const ExactStory = lazy(() => import("./game/moon/stages/ExactStory"));

export default function App() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const query = new URLSearchParams(window.location.search);
  const preview = query.get("module") === "3";
  const forceBlock = query.get("forcePortrait") === "true";

  const [debugRoute, setDebugRoute] = useState<DebugRoute | null>(() =>
    isDevelopment ? parseDebugHash(window.location.hash) : null,
  );

  useEffect(() => {
    if (!isDevelopment) return;
    const handleHashChange = () => {
      const nextRoute = parseDebugHash(window.location.hash);
      if (nextRoute) {
        useLoadingStore
          .getState()
          .startLoading("mission_start", `Opening ${nextRoute.id}…`);
      }
      setDebugRoute(nextRoute);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    // Trigger loading screen upon landing into the project
    useLoadingStore.getState().startLoading("landing");
  }, []);

  // Determine active view to render
  let content;
  if (isDevelopment && debugRoute) {
    if (debugRoute.type === "page") {
      if (debugRoute.id === "preview") {
        content = <ConversationPreview />;
      } else if (debugRoute.id === "archive") {
        content = <ExactStory initialArchive={true} />;
      } else if (debugRoute.id === "rover-lab") {
        content = <RoverLabPreview />;
      } else {
        content = <ExactStory initialHome={true} />;
      }
    } else if (debugRoute.type === "step") {
      content = <ExactStory debugStepId={debugRoute.id} />;
    } else {
      content = <ExactStory />;
    }
  } else {
    content = preview ? <ConversationPreview /> : <ExactStory />;
  }

  return (
    <AppErrorBoundary>
      <OrientationGuard forceBlock={forceBlock}>
        <LoadingScreen />
        <InstallAppModal />
        <div
          inert={isLoading}
          aria-hidden={isLoading || undefined}
          style={{ height: "100%", minHeight: 0 }}
        >
          <Suspense
            key={
              debugRoute
                ? `${debugRoute.type}:${debugRoute.id}`
                : `normal:${preview}`
            }
            fallback={
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "100vh",
                  background: "#0a0616",
                }}
              />
            }
          >
            {content}
          </Suspense>
          {isDevelopment && <DebugToolbar />}
        </div>
      </OrientationGuard>
    </AppErrorBoundary>
  );
}
