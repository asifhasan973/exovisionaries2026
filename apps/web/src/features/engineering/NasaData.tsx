import { useRef, useState } from "react";
import reference from "./nasaReference.json";
import {
  CREW_REFERENCE,
  SOLAR_REFERENCE,
  crewBudget,
  fetchWeather,
  solarOutput,
} from "./nasaModel";
import type { SolarBasis, WeatherReport } from "./nasaModel";

const fmt = (v: number, digits = 1) =>
  v.toLocaleString("en", { maximumFractionDigits: digits });
const sourceLink = (url: string, label: string) => (
  <a href={url} target="_blank" rel="noreferrer">
    {label} ↗
  </a>
);
export default function NasaData({
  onApplySolar,
}: {
  onApplySolar: (watts: number, basis: SolarBasis) => void;
}) {
  const [siteId, setSiteId] =
    useState<keyof typeof reference.sites>("shackleton");
  const [hour, setHour] = useState(0),
    [area, setArea] = useState(0.5),
    [efficiency, setEfficiency] = useState(30),
    [angle, setAngle] = useState(0);
  const [crew, setCrew] = useState(4),
    [days, setDays] = useState(7),
    [weather, setWeather] = useState<WeatherReport>(reference.weather);
  const [loading, setLoading] = useState(false),
    [weatherMessage, setWeatherMessage] = useState(
      "Bundled NASA snapshot; refresh to query the latest seven UTC dates.",
    ),
    [applied, setApplied] = useState("");
  const refreshInFlight = useRef(false);
  const site = reference.sites[siteId],
    geometry = reference.geometry.rows[hour],
    watts = solarOutput(area, efficiency, angle),
    life = crewBudget(crew, days);
  const refresh = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setLoading(true);
    try {
      const latest = await fetchWeather();
      if (latest.channels.some((c) => c.available)) {
        setWeather(latest);
        setWeatherMessage(
          latest.channels.every((c) => c.available)
            ? "Fresh NASA response. This event catalogue is not a lunar radiation forecast."
            : "Partial NASA response. Unavailable channels are not counted as zero.",
        );
      } else
        setWeatherMessage(
          "NASA refresh unavailable. Retaining the dated snapshot below; no new observations received.",
        );
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  };
  const events = weather.channels
    .flatMap((c) => c.events.map((e) => ({ ...e, type: c.type })))
    .sort((a, b) => b.time.localeCompare(a.time));
  return (
    <div className="eng-nasa">
      <span className="eng-eyebrow">
        NASA DATA / FROM EVIDENCE TO DECISIONS
      </span>
      <h2>Give the design a real reference.</h2>
      <p>
        Explore measured lunar products, a predicted communication geometry,
        engineering reference values and dated solar events. Each has a
        different purpose.
      </p>
      <article className="eng-data-card">
        <div className="eng-data-heading">
          <h3>01 / Where will you operate?</h3>
          <span>OBSERVATIONS + DERIVED TERRAIN</span>
        </div>
        <label>
          Lunar reference site
          <select
            value={siteId}
            onChange={(e) =>
              setSiteId(e.target.value as keyof typeof reference.sites)
            }
          >
            <option value="shackleton">Shackleton reference point</option>
            <option value="cabeus">Cabeus reference point</option>
            <option value="malapert">Malapert reference point</option>
          </select>
        </label>
        <p className="eng-muted">
          {site.lat}° latitude · {site.lon}° E longitude. These are reference
          samples, not selected safe landing locations.
        </p>
        <div className="eng-data-values">
          <div>
            <b>{fmt(site.elevation)} m</b>
            <small>LOLA elevation</small>
          </div>
          <div>
            <b>{fmt(site.slope)}°</b>
            <small>derived regional slope</small>
          </div>
          <div>
            <b>{fmt(site.temperature)} K</b>
            <small>Diviner summer maximum</small>
          </div>
        </div>
        <p>
          A colder reference point changes the thermal design question; it does
          not tell us today's temperature or available sunlight. Regional slope
          cannot resolve rover-scale rocks or hazards.
        </p>
        <details>
          <summary>Product provenance & resolution</summary>
          <p>
            {reference.terrain.product} · {reference.terrain.period}.{" "}
            {reference.terrain.resolution}. Slope uses a ~
            {fmt(reference.terrain.slopeBaselineM)} m baseline.
          </p>
          <p>
            {reference.thermal.product} · {reference.thermal.period}. Summer
            maximum bolometric brightness temperature, not a forecast or
            hardware temperature.
          </p>
          {sourceLink(reference.terrain.source, "NASA PDS / LOLA product")} ·{" "}
          {sourceLink(reference.thermal.source, "LRO Diviner data product")} ·{" "}
          {sourceLink(reference.thermal.reference, "Diviner publication")}
        </details>
        <a href="/?explore=atlas">Open the Moon Atlas maps ↗</a>
      </article>
      <article className="eng-data-card">
        <div className="eng-data-heading">
          <h3>02 / How long does a signal take?</h3>
          <span>NASA SVS PREDICTION</span>
        </div>
        <label>
          Reference hour · 8 November 2026 UTC (24 = 9 Nov 00:00)
          <input
            type="range"
            min="0"
            max="24"
            step="1"
            value={hour}
            onChange={(e) => setHour(e.target.valueAsNumber)}
          />
        </label>
        <div className="eng-data-values">
          <div>
            <b>{hour}:00 UTC</b>
            <small>fixed historical/planning epoch</small>
          </div>
          <div>
            <b>{fmt(geometry.distance, 0)} km</b>
            <small>Earth–Moon centre distance</small>
          </div>
          <div>
            <b>{fmt(geometry.distance / 299792.458, 3)} s</b>
            <small>one-way vacuum light time</small>
          </div>
        </div>
        <p>
          Minimum round-trip propagation:{" "}
          {fmt((2 * geometry.distance) / 299792.458, 3)} s. Processing,
          bandwidth, line of sight and network scheduling add further delays;
          this is not a complete link budget.
        </p>
        {sourceLink(
          reference.geometry.source,
          "NASA SVS geometry & hourly JSON",
        )}{" "}
        · <a href="/?explore=signal">Test contact, storage & transmission ↗</a>
      </article>
      <article className="eng-data-card">
        <div className="eng-data-heading">
          <h3>03 / Size the solar array.</h3>
          <span>NASA REFERENCE + YOUR DESIGN</span>
        </div>
        <p>
          Solar irradiance reference: <strong>1,361 W/m² at 1 AU</strong>{" "}
          (SORCE). Assume the Moon is near 1 AU. Panel area, efficiency and
          incidence are your inputs.
        </p>
        <div className="eng-input-grid">
          <label>
            Panel area · m²
            <input
              type="number"
              min="0"
              max="100"
              step=".1"
              value={Number.isFinite(area) ? area : ""}
              onChange={(e) => {
                setArea(e.target.valueAsNumber);
                setApplied("");
              }}
            />
          </label>
          <label>
            Conversion efficiency · %
            <input
              type="number"
              min="0"
              max="100"
              value={Number.isFinite(efficiency) ? efficiency : ""}
              onChange={(e) => {
                setEfficiency(e.target.valueAsNumber);
                setApplied("");
              }}
            />
          </label>
          <label>
            Sun angle from panel normal · °
            <input
              type="number"
              min="0"
              max="90"
              value={Number.isFinite(angle) ? angle : ""}
              onChange={(e) => {
                setAngle(e.target.valueAsNumber);
                setApplied("");
              }}
            />
          </label>
        </div>
        <div className="eng-notice">
          {watts === null ? (
            "Enter valid panel inputs to calculate output."
          ) : (
            <>
              <strong>{fmt(watts)} W</strong> estimated output before phase
              sunlight factors.
              <br />P = 1,361 × area × efficiency × cos(angle).
            </>
          )}
        </div>
        <p>
          No temperature, dust, ageing or wiring losses. The existing phase
          sunlight fractions still represent shading/availability; do not apply
          the same incidence loss twice.
        </p>
        <button
          className="eng-primary"
          disabled={watts === null || watts > 100000}
          onClick={() => {
            if (watts !== null) {
              onApplySolar(watts, {
                ...SOLAR_REFERENCE,
                areaM2: area,
                efficiencyPercent: efficiency,
                incidenceDegrees: angle,
              });
              setApplied(
                `Applied ${fmt(watts)} W to the power design. Inspect Test or Compare to see its effect.`,
              );
            }
          }}
        >
          Apply to power design
        </button>
        <p role="status">{applied}</p>
        {sourceLink(SOLAR_REFERENCE.source, "NASA Goddard / SORCE reference")}
      </article>
      <article className="eng-data-card">
        <div className="eng-data-heading">
          <h3>04 / What must the crew system handle?</h3>
          <span>NASA BVAD / TABLE 3-22</span>
        </div>
        <div className="eng-input-grid">
          <label>
            Crew members
            <input
              type="number"
              min="1"
              max="50"
              step="1"
              value={Number.isFinite(crew) ? crew : ""}
              onChange={(e) => setCrew(e.target.valueAsNumber)}
            />
          </label>
          <label>
            Short mission duration · days
            <input
              type="number"
              min=".1"
              max="30"
              step=".5"
              value={Number.isFinite(days) ? days : ""}
              onChange={(e) => setDays(e.target.valueAsNumber)}
            />
          </label>
        </div>
        {life ? (
          <div className="eng-data-values">
            <div>
              <b>{fmt(life.oxygenKg, 2)} kg</b>
              <small>gross oxygen consumption</small>
            </div>
            <div>
              <b>{fmt(life.co2Kg, 2)} kg</b>
              <small>CO₂ to remove over mission</small>
            </div>
            <div>
              <b>{fmt(life.metabolicHeatW)} W</b>
              <small>average crew metabolic heat</small>
            </div>
          </div>
        ) : (
          <p role="alert">
            Use 1–50 whole crew members and a duration above 0, up to 30 days.
          </p>
        )}
        <p>
          NASA's 2018 short-duration reference: 0.82 kg oxygen, 1.04 kg CO₂ and
          12,000 kJ metabolic heat per person per day. Based on a specified 82
          kg crew profile with sleep, exercise and recovery. Multiplication by
          crew-days is a planning approximation; 30 days is this tool's input
          cap.
        </p>
        <p>
          These are gross metabolic loads before recycling, reserves, leakage or
          EVA. Heat is thermal output, not electrical consumption; it is not
          added to rover battery demand.
        </p>
        {sourceLink(
          CREW_REFERENCE.source,
          "NASA BVAD Rev. 1 / printed page 45",
        )}
      </article>
      <article className="eng-data-card">
        <div className="eng-data-heading">
          <h3>05 / Review solar activity.</h3>
          <span>NASA CCMC / DONKI</span>
        </div>
        <button disabled={loading} onClick={refresh}>
          {loading ? "Querying NASA…" : "Refresh NASA events"}
        </button>
        <p role="status">{weatherMessage}</p>
        <p className="eng-muted">
          UTC event dates: {weather.startDate}–{weather.endDate} · retrieved{" "}
          {weather.fetchedAt}. This window is independent of the fixed SVS
          geometry date.
        </p>
        <div className="eng-data-values">
          {weather.channels.map((c) => (
            <div key={c.type}>
              <b>{c.available ? c.events.length : "Unavailable"}</b>
              <small>
                {c.type === "FLR"
                  ? "solar flares"
                  : c.type === "CME"
                    ? "coronal mass ejections"
                    : "solar energetic particle events"}
              </small>
            </div>
          ))}
        </div>
        {weather.channels
          .filter((c) => !c.available)
          .map((c) => (
            <p key={c.type} className="eng-muted">
              {c.type}: {c.error}
            </p>
          ))}
        <div className="eng-phase-table">
          <table>
            <thead>
              <tr>
                <th>Event UTC</th>
                <th>Type / class</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((e) => (
                <tr key={`${e.type}-${e.id}`}>
                  <td>{e.time}</td>
                  <td>
                    {e.type} {e.classType}
                  </td>
                  <td>{e.link ? sourceLink(e.link, "NASA record") : e.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!events.length && (
          <p>
            No events in the available channel responses for this window.
            Missing channels remain unknown.
          </p>
        )}
        <p>
          Design question: can the crew shelter and pause outside work? Event
          counts do not establish lunar arrival, local exposure, radiation dose
          or a safe/unsafe verdict.
        </p>
        {sourceLink(
          "https://ccmc.gsfc.nasa.gov/tools/DONKI/",
          "DONKI source, API & research limits",
        )}
      </article>
    </div>
  );
}
