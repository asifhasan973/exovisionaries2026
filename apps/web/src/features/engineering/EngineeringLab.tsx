import { useMemo, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  FlaskConical,
  RotateCcw,
  Save,
  Download,
  Check,
  AlertTriangle,
} from "lucide-react";
import { evaluatePower, REFERENCE, validateExperiment } from "./powerModel";
import type { Experiment, PowerDesign } from "./powerModel";
import { installedIds, partById } from "@/game/moon/core/preparation";
import { operatingPower } from "@/game/moon/shared/resources";
import type { PreparationSelection } from "@/game/moon/core/design";
import { sound } from "@exo/audio";
import NasaData from "./NasaData";
import nasaReference from "./nasaReference.json";
import "./engineering.css";

const TABS = ["Mission", "Design", "Test", "Compare", "NASA Data"];
const KEY = "zero_to_beyond_engineering_power_v1";
const copy = (value: Experiment): Experiment => structuredClone(value);
function readDraft(): Experiment {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw?.version === 1 && !validateExperiment(raw.experiment).length)
      return raw.experiment;
  } catch {
    /* Use the documented reference configuration. */
  }
  return copy(REFERENCE);
}
const number = (v: number) =>
  v.toLocaleString("en", { maximumFractionDigits: 1 });
export default function EngineeringLab({
  preparation,
}: {
  preparation: PreparationSelection;
}) {
  const [experiment, setExperiment] = useState<Experiment>(readDraft),
    [tab, setTab] = useState(0),
    [message, setMessage] = useState(""),
    [baseline, setBaseline] = useState<Experiment | null>(null);
  const errors = validateExperiment(experiment),
    result = useMemo(
      () => (errors.length ? null : evaluatePower(experiment)),
      [experiment, errors.length],
    );
  const previous = useMemo(
    () => (baseline ? evaluatePower(baseline) : null),
    [baseline],
  );
  const equipment = installedIds(preparation)
    .map(partById)
    .filter((p): p is NonNullable<typeof p> => !!p);
  const update = (
    key: Exclude<keyof PowerDesign, "solarBasis">,
    value: number,
  ) =>
    setExperiment((e) => ({
      ...e,
      design: {
        ...e.design,
        [key]: value,
        ...(key === "solarW" ? { solarBasis: undefined } : {}),
      },
    }));
  const importKit = () => {
    const battery = equipment.find((p) => p.category === "battery"),
      panels = equipment.find((p) => p.category === "solar");
    if (!battery?.capacityWh) {
      setMessage(
        "Choose a battery in the mission workshop before importing a kit.",
      );
      return;
    }
    const traverse = operatingPower(equipment, "traverse"),
      science = operatingPower(
        equipment,
        "analysis",
        0,
        preparation.sciencePartIds,
      );
    setExperiment((e) => ({
      ...e,
      name: "Workshop kit power study",
      design: {
        ...e.design,
        capacityWh: battery.capacityWh!,
        solarW: panels?.outputW ?? 0,
        solarBasis: undefined,
        dischargeW: battery.dischargeLimitW ?? 450,
      },
      phases: e.phases.map((p) => ({
        ...p,
        loadW: p.id === "science" ? science.loadW : traverse.loadW,
      })),
    }));
    setMessage(
      "Imported the current workshop kit. Duration, sunlight, starting charge and efficiencies remain lab assumptions.",
    );
  };
  const save = () => {
    if (errors.length) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, experiment }));
      setMessage("Lab design saved on this browser.");
    } catch {
      setMessage("Browser storage unavailable; use Export instead.");
    }
  };
  const exportRun = () => {
    if (!result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            model: "constant-phase-energy-v1",
            provenance:
              "Solar provenance is recorded in design.solarBasis when applied; other electrical inputs are educational assumptions, not measured hardware performance.",
            nasaReference,
            experiment,
            result,
            baseline,
            baselineResult: previous,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "engineering-power-study.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const field = (
    label: string,
    key: Exclude<keyof PowerDesign, "solarBasis">,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={
          Number.isFinite(experiment.design[key]) ? experiment.design[key] : ""
        }
        onChange={(e) => update(key, e.target.valueAsNumber)}
      />
    </label>
  );
  const changes = baseline
    ? [
        ...Object.keys(experiment.design)
          .filter((k) => k !== "solarBasis")
          .filter(
            (k) =>
              experiment.design[k as keyof PowerDesign] !==
              baseline.design[k as keyof PowerDesign],
          )
          .map((k) => k),
        ...experiment.phases.flatMap((p, i) =>
          (["minutes", "loadW", "light"] as const)
            .filter((k) => p[k] !== baseline.phases[i][k])
            .map((k) => `${p.name}: ${k}`),
        ),
      ]
    : [];
  return (
    <div className="engineering-lab">
      <main id="engineering-content">
        <section className="eng-intro">
          <div>
            <span className="eng-eyebrow">
              DESIGN IT. TEST IT. UNDERSTAND IT.
            </span>
            <h1>Every watt has a consequence.</h1>
            <p>
              Build a lunar rover power profile. See what limits it, change one
              decision and test again.
            </p>
          </div>
          <div className="eng-intro-note">
            <BatteryCharging size={24} />
            <span>
              Trace every number.
              <small>
                NASA observations & references · explicit design assumptions
              </small>
            </span>
          </div>
        </section>
        <nav className="eng-steps" aria-label="Engineering workflow">
          {TABS.map((name, i) => (
            <button
              key={name}
              aria-current={tab === i ? "step" : undefined}
              onClick={() => {
                sound.playClick(650);
                setTab(i);
              }}
            >
              <span>0{i + 1}</span>
              {name}
              <ArrowRight size={14} />
            </button>
          ))}
        </nav>
        <div className="eng-workspace">
          <section
            className="eng-workbench"
            aria-label={`${TABS[tab]} workspace`}
          >
            {tab === 0 && (
              <>
                <span className="eng-eyebrow">01 / DEFINE THE QUESTION</span>
                <h2>Can your rover complete the return?</h2>
                <p>
                  Three phases share one battery: outbound traverse, science in
                  shadow, and return to base. Success means every load is served
                  and charge stays above your reserve throughout the profile.
                </p>
                <label>
                  Study name
                  <input
                    maxLength={100}
                    value={experiment.name}
                    onChange={(e) =>
                      setExperiment((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </label>
                <div className="eng-mission-cards">
                  <article>
                    <b>01</b>
                    <h3>Traverse</h3>
                    <p>
                      Travel to the target with mobility, navigation and support
                      loads.
                    </p>
                  </article>
                  <article>
                    <b>02</b>
                    <h3>Investigate</h3>
                    <p>
                      Run scientific instruments with the light you specify.
                    </p>
                  </article>
                  <article>
                    <b>03</b>
                    <h3>Return</h3>
                    <p>
                      Reach the base while retaining the selected energy
                      reserve.
                    </p>
                  </article>
                </div>
                <div className="eng-notice">
                  <strong>What this test establishes</strong>
                  <p>
                    A constant-load electrical budget. It does not establish
                    landing safety, thermal survival, radiation protection or
                    complete mission feasibility.
                  </p>
                </div>
                <div className="eng-actions">
                  <button onClick={() => setTab(4)}>Explore NASA data</button>
                  <button className="eng-primary" onClick={() => setTab(1)}>
                    Configure the design <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {tab === 1 && (
              <>
                <span className="eng-eyebrow">02 / CONFIGURE THE SYSTEM</span>
                <h2>Make the assumptions visible.</h2>
                <div className="eng-input-grid">
                  {field("Battery capacity · Wh", "capacityWh", 1, 100000)}
                  {field("Starting charge · %", "startPercent", 0, 100)}
                  {field("Minimum reserve · %", "reservePercent", 0, 100)}
                  {field("Solar array output · W", "solarW", 0, 100000)}
                  {field("Battery output limit · W", "dischargeW", 0, 100000)}
                  {field("Charging efficiency · %", "chargeEfficiency", 1, 100)}
                  {field(
                    "Discharging efficiency · %",
                    "dischargeEfficiency",
                    1,
                    100,
                  )}
                </div>
                <p className="eng-muted">
                  {experiment.design.solarBasis
                    ? `Solar output derived from NASA SORCE 1,361 W/m², ${experiment.design.solarBasis.areaM2} m² area, ${experiment.design.solarBasis.efficiencyPercent}% efficiency and ${experiment.design.solarBasis.incidenceDegrees}° incidence. Editing solar W or importing a kit removes this derivation.`
                    : "Solar output is an editable assumption. Use NASA Data to derive it from irradiance, panel area and efficiency."}
                </p>
                <h3>Operating timeline</h3>
                <div className="eng-phase-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Phase</th>
                        <th>Duration · min</th>
                        <th>Load · W</th>
                        <th>Usable sunlight · 0–1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {experiment.phases.map((p, i) => (
                        <tr key={p.id}>
                          <th>{p.name}</th>
                          {(["minutes", "loadW", "light"] as const).map((k) => (
                            <td key={k}>
                              <input
                                aria-label={`${p.name} ${k}`}
                                type="number"
                                min="0"
                                max={
                                  k === "light"
                                    ? 1
                                    : k === "minutes"
                                      ? 1440
                                      : 100000
                                }
                                step={k === "light" ? 0.05 : 1}
                                value={Number.isFinite(p[k]) ? p[k] : ""}
                                onChange={(e) =>
                                  setExperiment((v) => ({
                                    ...v,
                                    phases: v.phases.map((phase, j) =>
                                      j === i
                                        ? {
                                            ...phase,
                                            [k]: e.target.valueAsNumber,
                                          }
                                        : phase,
                                    ),
                                  }))
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="eng-muted">
                  Sunlight is your assumed usable fraction, not a measured
                  forecast. Permanent shadow requires 0. Inputs are teaching
                  values or your own study assumptions.
                </p>
                <div className="eng-actions">
                  <button onClick={importKit}>
                    Import workshop kit{" "}
                    {equipment.length ? `(${equipment.length} parts)` : ""}
                  </button>
                  <button
                    className="eng-primary"
                    disabled={!!errors.length}
                    onClick={() => setTab(2)}
                  >
                    Run power test <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            {tab === 2 && (
              <>
                <span className="eng-eyebrow">03 / INSPECT THE RESULT</span>
                <h2>Follow the energy.</h2>
                {result && (
                  <>
                    <EnergyChart result={result} />
                    <div className="eng-phase-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Phase</th>
                            <th>Load / solar W</th>
                            <th>Battery Wh</th>
                            <th>Unserved Wh</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.phases.map((p) => (
                            <tr key={p.id}>
                              <th>{p.name}</th>
                              <td>
                                {number(p.loadW)} / {number(p.solarW)}
                              </td>
                              <td>
                                {number(p.startWh)} → {number(p.endWh)}
                              </td>
                              <td>
                                {number(p.unmetWh)}
                                {!p.peakOK && " · output limit"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p>
                      The reserve applies throughout the profile, including the
                      starting state. Recharging later does not erase an earlier
                      shortfall.
                    </p>
                    <div className="eng-actions">
                      <button
                        onClick={() => {
                          setBaseline(copy(experiment));
                          setMessage(
                            "Baseline captured. Change one input to isolate its effect.",
                          );
                        }}
                      >
                        Capture baseline
                      </button>
                      <button onClick={() => setTab(1)}>Revise design</button>
                      <button className="eng-primary" onClick={() => setTab(3)}>
                        Compare <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 3 && (
              <>
                <span className="eng-eyebrow">04 / CHANGE ONE THING</span>
                <h2>What made the difference?</h2>
                {previous && result ? (
                  <>
                    <p>
                      Baseline: <strong>{baseline!.name}</strong>. Same
                      three-phase study; {changes.length} numeric inputs
                      changed.
                    </p>
                    {changes.length !== 1 && (
                      <div className="eng-notice">
                        Change exactly one input to isolate its effect.{" "}
                        {changes.length === 0
                          ? "The two configurations currently match."
                          : "Several changes can confound the comparison."}
                      </div>
                    )}
                    <table>
                      <thead>
                        <tr>
                          <th>Measure</th>
                          <th>Baseline</th>
                          <th>Current</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Outcome", previous.status, result.status],
                          [
                            "Lowest battery · Wh",
                            number(previous.minimumWh),
                            number(result.minimumWh),
                          ],
                          [
                            "Reserve margin · Wh",
                            number(previous.marginWh),
                            number(result.marginWh),
                          ],
                          [
                            "Unserved demand · Wh",
                            number(previous.unmetWh),
                            number(result.unmetWh),
                          ],
                          [
                            "Conversion loss · Wh",
                            number(previous.lossWh),
                            number(result.lossWh),
                          ],
                          [
                            "Study duration · min",
                            number(previous.durationMinutes),
                            number(result.durationMinutes),
                          ],
                        ].map(([k, a, b]) => (
                          <tr key={k}>
                            <th>{k}</th>
                            <td>{a}</td>
                            <td>{b}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p>Changed: {changes.join(", ") || "none"}.</p>
                    <div className="eng-actions">
                      <button onClick={() => setTab(1)}>Change an input</button>
                      <button onClick={() => setExperiment(copy(baseline!))}>
                        Restore baseline
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="eng-empty">
                    <FlaskConical size={36} />
                    <h3>Start with a reference run.</h3>
                    <p>
                      Capture the current design as your baseline, then change
                      one input.
                    </p>
                    <button
                      className="eng-primary"
                      disabled={!result}
                      onClick={() => {
                        setBaseline(copy(experiment));
                        setTab(1);
                      }}
                    >
                      Capture baseline & edit
                    </button>
                  </div>
                )}
              </>
            )}
            <div hidden={tab !== 4}>
              <NasaData
                onApplySolar={(watts, basis) => {
                  setExperiment((e) => ({
                    ...e,
                    design: { ...e.design, solarW: watts, solarBasis: basis },
                  }));
                  setMessage(
                    "NASA-referenced solar estimate applied. Phase sunlight factors remain your assumptions.",
                  );
                }}
              />
            </div>
            {!!errors.length && (
              <div role="alert" className="eng-errors">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
          </section>
          <aside className="eng-results" aria-label="Live power result">
            <span className="eng-eyebrow">LIVE MODEL OUTPUT</span>
            <div
              className={`eng-result-title ${result?.served && result.reserveOK ? "good" : "warn"}`}
            >
              {result?.served && result.reserveOK ? (
                <Check />
              ) : (
                <AlertTriangle />
              )}
              <h2>{result?.status ?? "Check your inputs"}</h2>
            </div>
            <p className="eng-muted">
              Calculated immediately from the current design. This is a
              power-test result, not a whole-mission approval.
            </p>
            {result && (
              <>
                <div className="eng-metrics">
                  <div>
                    <b>
                      {number(result.minimumWh)}
                      <small> Wh</small>
                    </b>
                    <span>lowest stored energy</span>
                  </div>
                  <div>
                    <b>
                      {number(result.marginWh)}
                      <small> Wh</small>
                    </b>
                    <span>margin above reserve</span>
                  </div>
                  <div>
                    <b>
                      {number(result.unmetWh)}
                      <small> Wh</small>
                    </b>
                    <span>unserved demand</span>
                  </div>
                  <div>
                    <b>
                      {number(result.durationMinutes)}
                      <small> min</small>
                    </b>
                    <span>operating profile</span>
                  </div>
                </div>
                <p className="eng-diagnosis">
                  {!result.peakOK
                    ? "The battery output limit cannot cover one or more phase loads. Capacity alone will not repair this power bottleneck."
                    : !result.served
                      ? "Available battery energy runs out before the profile ends. Reduce load or duration, improve usable generation, or increase starting energy."
                      : !result.reserveOK
                        ? "Loads are supplied, but the selected energy reserve is breached. Compare a shorter shadow phase or a larger battery."
                        : "This configuration supplies the defined loads while retaining the selected reserve. Other mission constraints still need their own checks."}
                </p>
              </>
            )}
            <div className="eng-actions">
              <button disabled={!result} onClick={save}>
                <Save size={14} /> Save design
              </button>
              <button disabled={!result} onClick={exportRun}>
                <Download size={14} /> Export study
              </button>
              <button
                onClick={() => {
                  setExperiment(copy(REFERENCE));
                  setMessage("Reference inputs restored.");
                }}
              >
                <RotateCcw size={14} /> Reset inputs
              </button>
            </div>
            <p role="status" className="eng-status">
              {message}
            </p>
          </aside>
        </div>
        <details className="eng-method">
          <summary>Equations, source boundaries & assumptions</summary>
          <div className="eng-method-grid">
            <article>
              <h3>Trace the calculation</h3>
              <p>Energy [Wh] = power [W] × time [s] / 3600.</p>
              <p>Solar output = rated array W × usable sunlight fraction.</p>
              <p>
                Battery draw = (load − solar) / discharge efficiency, bounded by
                stored energy and output limit.
              </p>
              <p>
                Charging = surplus solar × charge efficiency, bounded by battery
                capacity.
              </p>
              <p>
                Reserve = capacity × reserve percentage. Check the minimum
                energy across every phase.
              </p>
            </article>
            <article>
              <h3>Know what the numbers mean</h3>
              <p>
                Uses the game's shared energyWh unit conversion. Constant phase
                loads and ideal fixed efficiencies are model assumptions. Panel
                output can be derived in NASA Data using NASA SORCE irradiance
                and editable design assumptions; its basis is retained in
                saved/exported inputs. Other electrical reference values are
                authored educational allocations.
              </p>
              <p>
                No cell voltage, temperature dependence, ageing, charging power
                ceiling or conversion transient is modeled. Workshop import
                reuses equipment allocations and operatingPower logic; all
                selected analysis instruments are assumed active together. Crew
                life support belongs to the game's separate platform account.
              </p>
              <a
                href="https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems/"
                target="_blank"
                rel="noreferrer"
              >
                NASA educational power reference
              </a>
              <p>
                NASA reference material explains concepts; it does not certify
                these hardware inputs. The NASA Data tab distinguishes LRO
                measurements, SVS predictions, engineering baseline values and
                dated DONKI events; none certifies this rover design.
              </p>
            </article>
          </div>
        </details>
      </main>
    </div>
  );
}
function EnergyChart({ result }: { result: ReturnType<typeof evaluatePower> }) {
  const max =
    Math.max(
      result.initialWh,
      result.reserveWh,
      ...result.points.map((p) => p.wh),
      1,
    ) * 1.1;
  const x = (t: number) => 55 + (t / result.durationMinutes) * 610,
    y = (wh: number) => 220 - (wh / max) * 175;
  return (
    <figure className="eng-chart">
      <svg
        viewBox="0 0 700 260"
        role="img"
        aria-label={`Battery energy over ${number(result.durationMinutes)} minutes; minimum ${number(result.minimumWh)} Wh, reserve ${number(result.reserveWh)} Wh.`}
      >
        <defs>
          <linearGradient id="energy-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#8ce2c2" stopOpacity=".25" />
            <stop offset="1" stopColor="#8ce2c2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="55"
              y1={y(max * f)}
              x2="665"
              y2={y(max * f)}
              stroke="#ffffff15"
            />
            <text x="2" y={y(max * f) + 4} fill="#cbb6da" fontSize="11">
              {number(max * f)}
            </text>
          </g>
        ))}
        <path
          d={`M55,220 ${result.points.map((p) => `L${x(p.minute)},${y(p.wh)}`).join(" ")} L665,220 Z`}
          fill="url(#energy-area)"
        />
        <path
          d={result.points
            .map((p, i) => `${i ? "L" : "M"}${x(p.minute)},${y(p.wh)}`)
            .join(" ")}
          stroke="#8ce2c2"
          strokeWidth="3"
          fill="none"
        />
        <line
          x1="55"
          x2="665"
          y1={y(result.reserveWh)}
          y2={y(result.reserveWh)}
          stroke="#ffcf88"
          strokeDasharray="5 5"
        />
        <text x="470" y={y(result.reserveWh) - 7} fill="#ffcf88" fontSize="11">
          Reserve {number(result.reserveWh)} Wh
        </text>
        {result.points.map((p, i) => (
          <circle key={i} cx={x(p.minute)} cy={y(p.wh)} r="3" fill="#8ce2c2" />
        ))}
        <text x="55" y="247" fill="#cbb6da" fontSize="11">
          0 min
        </text>
        <text x="600" y="247" fill="#cbb6da" fontSize="11">
          {number(result.durationMinutes)} min
        </text>
        <text x="5" y="17" fill="#cbb6da" fontSize="11">
          Stored Wh
        </text>
      </svg>
      <figcaption>
        Mint: stored battery energy · amber: minimum reserve. Detailed phase
        values are in the table below.
      </figcaption>
    </figure>
  );
}
