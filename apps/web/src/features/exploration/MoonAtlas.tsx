import { useState } from "react";
import { SITES } from "./signalModel";
import { atlasPoint, sampleAtlas } from "@exo/engine";
import type { AtlasData } from "@exo/engine";
export type { AtlasData } from "@exo/engine";
type Layer = "elevation" | "temperature" | "slope";
const PRESETS = [
  SITES[0],
  SITES[1],
  { id: "malapert", name: "Malapert region", lat: -85.99, lon: 2.83 },
];
export function MoonAtlas({
  data,
  onLab,
}: {
  data: AtlasData;
  onLab: (site: string) => void;
}) {
  const [initial] = useState(() => {
    try {
      const v = JSON.parse(
        localStorage.getItem("zero_to_beyond_atlas_note_v1") ?? "null",
      );
      return v && typeof v.note === "string" ? v : null;
    } catch {
      return null;
    }
  });
  const [a, setA] = useState(
      PRESETS.some((p) => p.id === initial?.a) ? initial.a : "shackleton",
    ),
    [b, setB] = useState(
      PRESETS.some((p) => p.id === initial?.b) ? initial.b : "cabeus",
    ),
    [layer, setLayer] = useState<Layer>("elevation"),
    [zoom, setZoom] = useState(1),
    [celsius, setCelsius] = useState(false),
    [status, setStatus] = useState("");
  const [note, setNote] = useState<string>(
    (initial?.note ?? "").slice(0, 1500),
  );
  const first = PRESETS.find((p) => p.id === a)!,
    second = PRESETS.find((p) => p.id === b)!,
    values = [first, second].map((s) => sampleAtlas(data, s.lat, s.lon));
  const n = data.metadata.size,
    center = atlasPoint(first.lat, first.lon, data.metadata.extentM, n),
    width = n / zoom,
    view = [
      Math.max(0, Math.min(n - width, center.x - width / 2)),
      Math.max(0, Math.min(n - width, center.y - width / 2)),
      width,
      width,
    ].join(" ");
  const format = (v: number | null, unit: string) =>
    v === null ? "No coverage" : `${v.toFixed(unit === "m" ? 0 : 1)} ${unit}`;
  const temperature = (v: number | null) =>
    format(v === null ? null : celsius ? v - 273.15 : v, celsius ? "°C" : "K");
  return (
    <>
      <div className="explore-heading">
        <span className="explore-kicker">MISSION ATLAS / 01</span>
        <h1>Where would you explore?</h1>
        <p>
          Compare a base and a science target using real lunar terrain and
          temperature records.
        </p>
      </div>
      <div className="atlas-grid">
        <section className="explore-panel atlas-map-panel">
          <div className="explore-tabs" role="tablist" aria-label="Map layer">
            {(["elevation", "temperature", "slope"] as Layer[]).map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={layer === l}
                onClick={() => setLayer(l)}
              >
                {l === "elevation"
                  ? "Elevation"
                  : l === "temperature"
                    ? "Summer maximum"
                    : "Terrain slope"}
              </button>
            ))}
          </div>
          <svg
            className="atlas-map"
            viewBox={view}
            role="img"
            aria-label="South polar map, zero degrees longitude at top; A and B mark selected study points"
          >
            <image href={`/exploration/${layer}.webp`} width={n} height={n} />
            <circle
              cx={n / 2}
              cy={n / 2}
              r={n * 0.485}
              stroke="#fff5"
              fill="none"
              strokeDasharray="2 4"
            />
            {[first, second].map((s, i) => {
              const p = atlasPoint(s.lat, s.lon, data.metadata.extentM, n);
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={7 / zoom}
                    fill={i ? "#ffdf89" : "#8ce2c2"}
                    stroke="#161022"
                    strokeWidth={1 / zoom}
                  />
                  <text
                    x={p.x + 10 / zoom}
                    y={p.y + 4 / zoom}
                    fontSize={14 / zoom}
                    fill="white"
                  >
                    {i ? "B" : "A"}
                  </text>
                </g>
              );
            })}
            <text x={n / 2 + 3} y={n / 2 - 3} fill="#fff" fontSize={9 / zoom}>
              90° S
            </text>
          </svg>
          <div className="atlas-map-tools">
            <button
              disabled={zoom === 1}
              onClick={() => setZoom((z) => Math.max(1, z / 2))}
            >
              − Zoom
            </button>
            <button
              disabled={zoom === 4}
              onClick={() => setZoom((z) => Math.min(4, z * 2))}
            >
              + Zoom to A
            </button>
            <label>
              <input
                type="checkbox"
                checked={celsius}
                onChange={(e) => setCelsius(e.target.checked)}
              />{" "}
              Celsius
            </label>
          </div>
          <div className={`atlas-legend ${layer}`}>
            <span>
              {layer === "elevation"
                ? "−7,000 m"
                : layer === "slope"
                  ? "0°"
                  : celsius
                    ? "−233 °C"
                    : "40 K"}
            </span>
            <i />
            <span>
              {layer === "elevation"
                ? "+3,000 m+"
                : layer === "slope"
                  ? "25°+"
                  : celsius
                    ? "67 °C+"
                    : "340 K+"}
            </span>
          </div>
          <p className="explore-caption">
            620 km wide overview · 0° E up, 90° E right · map bounds ±310 km
            from the south pole. Terrain is interpolated from a coarse grid.
            Zoom enlarges the same data.
          </p>
        </section>
        <aside className="explore-panel">
          <span className="explore-kicker">PLAN WITH EVIDENCE</span>
          <h2>Your two study points</h2>
          <label>
            A · Candidate base
            <select value={a} onChange={(e) => setA(e.target.value)}>
              {PRESETS.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            B · Science target
            <select value={b} onChange={(e) => setB(e.target.value)}>
              {PRESETS.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <table className="atlas-table">
            <caption>Native source-grid samples at study coordinates</caption>
            <thead>
              <tr>
                <th>Measure</th>
                <th>A</th>
                <th>B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Latitude °N</th>
                <td>{first.lat}</td>
                <td>{second.lat}</td>
              </tr>
              <tr>
                <th>Longitude °E</th>
                <td>{first.lon}</td>
                <td>{second.lon}</td>
              </tr>
              <tr>
                <th>Height*</th>
                {values.map((v, i) => (
                  <td key={i}>{format(v.elevation, "m")}</td>
                ))}
              </tr>
              <tr>
                <th>Slope estimate</th>
                {values.map((v, i) => (
                  <td key={i}>{format(v.slope, "°")}</td>
                ))}
              </tr>
              <tr>
                <th>Summer maximum</th>
                {values.map((v, i) => (
                  <td key={i}>{temperature(v.temperature)}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p>
            {a === b
              ? "Select different points to compare."
              : values.every((v) => v.temperature !== null)
                ? `${values[0].temperature! < values[1].temperature! ? "A" : "B"} has the lower mapped summer maximum. Cold terrain alone is not evidence of ice.`
                : "Temperature coverage is incomplete at a selected point."}
          </p>
          <p className="explore-caption">
            *Height above the 1,737.4 km reference sphere. These region points
            are not surveyed or certified landing sites. Coarse slope cannot
            establish rover or landing safety.
          </p>
          <label>
            My field note
            <textarea
              maxLength={1500}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why would you choose this base and science target?"
            />
          </label>
          <div className="signal-time">
            <button
              onClick={() => {
                try {
                  localStorage.setItem(
                    "zero_to_beyond_atlas_note_v1",
                    JSON.stringify({ a, b, note }),
                  );
                  setStatus("Field note saved on this browser.");
                } catch {
                  setStatus("Browser storage unavailable.");
                }
              }}
            >
              Save note
            </button>
            <button onClick={() => onLab(a === "malapert" ? "shackleton" : a)}>
              Open Signal Lab
            </button>
          </div>
          {a === "malapert" && (
            <small>
              Signal Lab opens its nearby Shackleton reference scenario.
            </small>
          )}
          <p role="status">{status}</p>
        </aside>
      </div>
      <details className="explore-sources">
        <summary>NASA products, resolution & limitations</summary>
        <p>
          Terrain: {data.metadata.terrainProduct} ·{" "}
          {data.metadata.terrainPeriod}. {data.metadata.terrainResolution}.
          Slope is a calculated overview using a {data.metadata.slopeBaselineM}{" "}
          m central-difference map baseline, corrected for spherical
          stereographic scale; source resolution remains coarser than display
          pixels.
        </p>
        <p>
          Temperature: {data.metadata.thermalProduct} ·{" "}
          {data.metadata.thermalPeriod}. Published polar grid at approximately
          240 m/pixel, nearest-neighbour sampling; blank source cells remain
          missing. The layer shows a historical seasonal statistic, not today's
          conditions. No ice, illumination schedule or communications coverage
          is inferred from these layers.
        </p>
        <a href={data.metadata.terrainSource} target="_blank" rel="noreferrer">
          LOLA product label
        </a>{" "}
        ·{" "}
        <a
          href="https://www.diviner.ucla.edu/data"
          target="_blank"
          rel="noreferrer"
        >
          Diviner data and credits
        </a>{" "}
        ·{" "}
        <a href="/exploration/atlas.json" target="_blank" rel="noreferrer">
          Local numeric grid & provenance
        </a>
      </details>
    </>
  );
}
