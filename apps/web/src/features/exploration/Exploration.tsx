import { useEffect, useState } from "react";
import { MoonAtlas } from "./MoonAtlas";
import { SignalLab } from "./SignalLab";
import { useLoadingStore } from "@exo/ui";
import "./exploration.css";
export type ExplorerPage = "atlas" | "signal";
import { loadAtlasReference } from "./reference/atlasResource";
const load = () => loadAtlasReference().then((atlas) => ({ atlas }));
export default function Exploration({
  initialPage,
  onPageChange,
}: {
  initialPage: ExplorerPage;
  onPageChange: (page: ExplorerPage) => void;
}) {
  const page = initialPage;
  const [site, setSite] = useState<string>(),
    [data, setData] = useState<Awaited<ReturnType<typeof load>>>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (page !== "atlas") return;
    let active = true;
    const task = load();
    useLoadingStore.getState().registerLoaderTask(task);
    task.then(
      (d) => {
        if (active) setData(d);
      },
      (e) => {
        if (active) setError(String(e));
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, page]);
  return (
    <div
      className={`exploration ${page === "signal" ? "exploration-signal" : ""}`}
    >
      <main id="explorer-content">
        {page === "signal" ? (
          <SignalLab key={site ?? "default"} initialSite={site} />
        ) : error ? (
          <section role="alert">
            <h1>Reference data could not load</h1>
            <p>{error}</p>
            <button
              onClick={() => {
                setError("");
                setAttempt((a) => a + 1);
              }}
            >
              Retry
            </button>
          </section>
        ) : !data ? (
          <p role="status">Preparing NASA reference layers…</p>
        ) : (
          <MoonAtlas
            data={data.atlas}
            onLab={(id) => {
              setSite(id);
              onPageChange("signal");
            }}
          />
        )}
      </main>
      {page === "atlas" && (
        <footer className="explore-footer">
          NASA observations · calculated geometry · clearly labelled teaching
          models. Exploration does not spend your mission resources.
        </footer>
      )}
    </div>
  );
}
