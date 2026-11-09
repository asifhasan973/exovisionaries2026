import { useEffect, useState } from "react";
import { useLoadingStore, isEngineFrozen } from "@exo/ui";
import { atlasPoint } from "@exo/engine";
import type { AtlasData } from "@exo/engine";
import { loadAtlasReference, atlasAsset, ATLAS_SOURCES } from "./atlasResource";
const REGIONS = [
  { id: "shackleton", name: "Shackleton region" },
  { id: "cabeus", name: "Cabeus region" },
  { id: "malapert", name: "Malapert region" },
];
type Layer = "elevation" | "temperature" | "slope";
const LAYERS: { id: Layer; name: string; legend: string }[] = [
  {
    id: "elevation",
    name: "Elevation",
    legend: "Color range: −7,000 to +3,000 m (saturated outside range).",
  },
  {
    id: "temperature",
    name: "Historical temperature",
    legend:
      "Color range: 40–340 K. Dark missing cells contain no temperature data.",
  },
  {
    id: "slope",
    name: "Overview slope",
    legend:
      "Color range: 0–25°. Calculated coarse slope; not a safety assessment.",
  },
];
const value = (n: number | null | undefined, unit: string) =>
  n == null ? "No data" : `${n.toFixed(1)} ${unit}`;
export function AtlasReference({ context }: { context: string }) {
  const [data, setData] = useState<AtlasData>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [region, setRegion] = useState("shackleton"),
    [layer, setLayer] = useState<Layer>("elevation"),
    [zoom, setZoom] = useState(1),
    [celsius, setCelsius] = useState(false);
  useEffect(() => {
    let active = true;
    const task = loadAtlasReference();
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
  }, [attempt]);
  const choose = (action: () => void) => {
    if (!isEngineFrozen()) action();
  };
  const sources = (
    <nav
      className="report-reference-sources"
      aria-label="NASA reference sources"
    >
      <a href={ATLAS_SOURCES.terrain} target="_blank" rel="noreferrer">
        NASA LOLA source
      </a>
      <a href={ATLAS_SOURCES.temperature} target="_blank" rel="noreferrer">
        Diviner data & credits
      </a>
    </nav>
  );
  if (!data)
    return (
      <section className="report-atlas">
        <h3>NASA reference data</h3>
        <p>{context}</p>
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <button
              onClick={() =>
                choose(() => {
                  setError("");
                  setAttempt((n) => n + 1);
                })
              }
            >
              Retry reference data
            </button>
          </div>
        ) : (
          <p role="status">Preparing the reference map and numeric layers…</p>
        )}
        {sources}
      </section>
    );
  const preset = data.presets[region];
  if (!preset)
    return (
      <section className="report-atlas">
        <h3>NASA reference data unavailable for this region</h3>
        <p>
          The study coordinate is missing from the reference dataset. Your
          mission summary remains available.
        </p>
        {sources}
      </section>
    );
  const n = data.metadata.size,
    p = atlasPoint(preset.lat, preset.lon, data.metadata.extentM, n),
    width = n / zoom;
  const view = [
    Math.max(0, Math.min(n - width, p.x - width / 2)),
    Math.max(0, Math.min(n - width, p.y - width / 2)),
    width,
    width,
  ].join(" ");
  return (
    <section className="report-atlas">
      <h3>NASA reference data: explore a region</h3>
      <p>{context}</p>
      <div className="report-atlas-layout">
        <div>
          <div
            className="report-layer-buttons"
            aria-label="Reference map layer"
          >
            {LAYERS.map((l) => (
              <button
                key={l.id}
                aria-pressed={layer === l.id}
                onClick={() => choose(() => setLayer(l.id))}
              >
                {l.name}
              </button>
            ))}
          </div>
          <svg
            className="report-reference-map"
            viewBox={view}
            role="img"
            aria-label={`${REGIONS.find((r) => r.id === region)?.name}, ${layer} overview. Reference coordinate, not your landing point.`}
          >
            <image href={atlasAsset(`${layer}.webp`)} width={n} height={n} />
            <circle
              cx={p.x}
              cy={p.y}
              r={6 / zoom}
              fill="#ffdf89"
              stroke="#20122f"
              strokeWidth={2 / zoom}
            />
          </svg>
          <p>
            {LAYERS.find((l) => l.id === layer)?.legend} Marker = selected
            reference coordinate. Longitude 0° is at the top.
          </p>
          <div className="report-map-controls">
            <button
              disabled={zoom === 1}
              onClick={() => choose(() => setZoom((z) => Math.max(1, z / 2)))}
            >
              Zoom out
            </button>
            <button
              disabled={zoom === 4}
              onClick={() => choose(() => setZoom((z) => Math.min(4, z * 2)))}
            >
              Zoom to region
            </button>
          </div>
        </div>
        <div>
          <label>
            Reference region
            <select
              value={region}
              onChange={(e) =>
                choose(() => {
                  setRegion(e.target.value);
                  setZoom(1);
                })
              }
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <dl className="report-reference-values">
            <div>
              <dt>Study coordinate</dt>
              <dd>
                {Math.abs(preset.lat).toFixed(2)}° S, {preset.lon.toFixed(2)}° E
              </dd>
            </div>
            <div>
              <dt>Elevation above 1,737.4 km sphere</dt>
              <dd>{value(preset.elevation, "m")}</dd>
            </div>
            <div>
              <dt>Historical summer maximum</dt>
              <dd>
                {value(
                  preset.temperature == null
                    ? null
                    : celsius
                      ? preset.temperature - 273.15
                      : preset.temperature,
                  celsius ? "°C" : "K",
                )}
              </dd>
            </div>
            <div>
              <dt>Calculated overview slope</dt>
              <dd>{value(preset.slope, "°")}</dd>
            </div>
          </dl>
          <button
            aria-pressed={celsius}
            onClick={() => choose(() => setCelsius((v) => !v))}
          >
            Temperature in {celsius ? "Kelvin" : "Celsius"}
          </button>
          <p>
            Cold temperature alone does not establish ice. Coarse slope cannot
            certify landing or rover safety. These layers do not establish
            communications coverage.
          </p>
        </div>
      </div>
      <details>
        <summary>Dataset dates, resolution & limitations</summary>
        <p>
          Terrain: {data.metadata.terrainProduct}; {data.metadata.terrainPeriod}
          ; {data.metadata.terrainResolution}. Slope is a central-difference
          overview using a {data.metadata.slopeBaselineM} m baseline with
          spherical stereographic scale correction.
        </p>
        <p>
          Temperature: {data.metadata.thermalProduct};{" "}
          {data.metadata.thermalPeriod}; approximately 240 m/pixel,
          nearest-neighbour source sampling. Missing cells remain missing.
          Preset numeric samples use native source grids, not the overview
          image. This is a historical seasonal statistic, not current weather.
        </p>
        {sources}
        <a href={atlasAsset("atlas.json")} target="_blank" rel="noreferrer">
          Numeric grid & full provenance
        </a>
      </details>
    </section>
  );
}
