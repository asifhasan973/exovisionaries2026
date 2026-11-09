import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  FastForward,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { sound } from "@exo/audio";
import { useGameSettings } from "@/shared/shell/settings/gameSettingsContext";
import { useLoadingStore } from "@exo/ui";
import { isEngineFrozen, useOrientationLifecycleStore } from "@exo/ui";
import { loadSignalScenario, SIGNAL_ROOT } from "./signalScenario";
import type { SignalScenario } from "./signalScenario";
import { geometryAt, STUDY_SITES } from "./signalGeometry";
import type { ContactAnalysis, VisibilityKey } from "./signalGeometry";
import { SignalViewport } from "./SignalViewport";
import { SignalDiagram } from "./SignalDiagram";
import type { ExplanationState, LearningStep } from "./SignalDiagram";
import "./signalLab.css";

const SITE_DESCRIPTIONS: Record<string, string> = {
  shackleton: "A study point very close to the Moon’s south pole.",
  cabeus: "A study point in the south-polar Cabeus region.",
  malapert: "A study point in the south-polar Malapert region.",
  far: "A southern reference point on the side facing away from Earth.",
  near: "An equatorial reference point on the side facing Earth.",
};
const emptyExplanation = (): ExplanationState => ({
  phase: "idle",
  progress: 0,
  paused: false,
});
const durationText = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
const formatUtc = (epoch: string, seconds: number) =>
  new Date(Date.parse(epoch) + seconds * 1000).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " UTC";
const SOURCES = [
  {
    name: "Relay design",
    url: "https://ntrs.nasa.gov/citations/20250002698",
    description:
      "NASA GSFC LCRNS 3.1: five initial states and recommended dynamics. A non-final design study.",
  },
  {
    name: "Moon imagery",
    url: "https://svs.gsfc.nasa.gov/4720/",
    description:
      "NASA SVS CGI Moon Kit, LRO/LROC visual color map. Surface imagery, not terrain used for visibility.",
  },
  {
    name: "Geometry & frames",
    url: "https://naif.jpl.nasa.gov/naif/",
    description:
      "NASA/JPL NAIF: DE421 ephemerides, lunar orientation, frame transformations and time conversion.",
  },
  {
    name: "Lunar gravity",
    url: "https://ntrs.nasa.gov/citations/20160005754",
    description:
      "NASA GRAIL GRGM900C, degree/order 25 in the DE421 principal-axis frame.",
  },
];

export function SignalLab({ initialSite }: { initialSite?: string }) {
  const [data, setData] = useState<SignalScenario>(),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const sceneReady = useRef<() => void>(() => {});
  useEffect(() => {
    let active = true;
    const scene = new Promise<void>((resolve) => {
      sceneReady.current = resolve;
    });
    const task = loadSignalScenario();
    useLoadingStore.getState().registerLoaderTask(Promise.all([task, scene]));
    task.then(
      (result) => {
        if (active) setData(result);
      },
      (reason) => {
        sceneReady.current();
        if (active) setError(String(reason));
      },
    );
    return () => {
      active = false;
      sceneReady.current();
    };
  }, [attempt]);
  if (error)
    return (
      <section className="lunar-data-error" role="alert">
        <Radio />
        <h1>Reference data could not load</h1>
        <p>{error}</p>
        <button
          onClick={() => {
            setError("");
            setAttempt((n) => n + 1);
          }}
        >
          Retry NASA reference data
        </button>
        <a href={SOURCES[0].url} target="_blank" rel="noreferrer">
          Read the NASA design source
        </a>
      </section>
    );
  if (!data)
    return (
      <div className="lunar-data-error" role="status">
        Preparing the NASA lunar relay reference…
      </div>
    );
  return (
    <SignalWorkspace
      data={data}
      initialSite={initialSite}
      onReady={() => sceneReady.current()}
    />
  );
}

function SignalWorkspace({
  data,
  initialSite,
  onReady,
}: {
  data: SignalScenario;
  initialSite?: string;
  onReady(): void;
}) {
  const [siteId, setSiteId] = useState(
    STUDY_SITES.some((s) => s.id === initialSite) ? initialSite! : "shackleton",
  );
  const [step, setStep] = useState<LearningStep>(1),
    [relay, setRelay] = useState(1),
    [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(600),
    [watch, setWatch] = useState(false),
    [all, setAll] = useState(false);
  const [explanation, setExplanation] =
    useState<ExplanationState>(emptyExplanation);
  const [analysisState, setAnalysisState] = useState<{
      key: string;
      result?: ContactAnalysis;
      error?: string;
    }>(),
    [analysisAttempt, setAnalysisAttempt] = useState(0);
  const [nextNotice, setNextNotice] = useState(""),
    [baseline, setBaseline] = useState<{
      site: string;
      total: number;
      gap: number;
    } | null>(null),
    [engineeringOpen, setEngineeringOpen] = useState(false),
    [pickerOpen, setPickerOpen] = useState(false),
    [methodsOpen, setMethodsOpen] = useState(false);
  const frozen = useOrientationLifecycleStore((state) => state.isFrozen);
  const { gentle: gentleSetting } = useGameSettings();
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const gentle = gentleSetting || reducedMotion,
    site = STUDY_SITES.find((s) => s.id === siteId)!;
  const g = geometryAt(data, time, site, relay),
    dialog = useRef<HTMLDialogElement>(null),
    sitePicker = useRef<HTMLDialogElement>(null),
    engineering = useRef<HTMLElement>(null),
    engineeringButton = useRef<HTMLButtonElement>(null),
    lessonButton = useRef<HTMLButtonElement>(null),
    timeRef = useRef(time);
  const analysisKey = `${siteId}:${relay}`,
    analysis =
      analysisState?.key === analysisKey ? analysisState.result : undefined,
    analysisError =
      analysisState?.key === analysisKey ? analysisState.error : undefined;
  const choose = (action: () => void) => {
    if (isEngineFrozen()) return;
    sound.playClick();
    action();
  };
  const resetExplanation = () => {
    setPlaying(false);
    setExplanation(emptyExplanation());
    setNextNotice("");
  };
  const goTo = (next: LearningStep) => {
    resetExplanation();
    setStep(next);
    setWatch(false);
    setEngineeringOpen(false);
  };
  const changeSite = (id: string) => {
    resetExplanation();
    setSiteId(id);
  };
  const changeRelay = (index: number) => {
    resetExplanation();
    setRelay(index);
  };
  const changeTime = (value: number) => {
    setPlaying(false);
    timeRef.current = value;
    setTime(value);
    setNextNotice("");
    setExplanation({ phase: "complete", progress: 2, paused: false });
  };
  useEffect(() => {
    timeRef.current = time;
  }, [time]);
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const id = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.2, (now - previous) / 1000);
      previous = now;
      if (!isEngineFrozen()) {
        const next = Math.min(
          data.manifest.duration,
          timeRef.current + dt * speed,
        );
        timeRef.current = next;
        setTime(next);
        if (next >= data.manifest.duration) setPlaying(false);
      }
    }, 80);
    return () => clearInterval(id);
  }, [playing, speed, data]);
  useEffect(() => {
    if (
      explanation.phase !== "running" ||
      explanation.paused ||
      engineeringOpen ||
      pickerOpen ||
      methodsOpen
    )
      return;
    let previous = performance.now();
    const end = step === 1 || !g.up ? 1 : 2;
    const id = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      if (isEngineFrozen()) return;
      setExplanation((value) => {
        const progress = Math.min(
          end,
          gentle ? end : value.progress + dt / 1.1,
        );
        return {
          ...value,
          progress,
          phase: progress >= end ? "complete" : "running",
        };
      });
    }, 40);
    return () => clearInterval(id);
  }, [
    explanation.phase,
    explanation.paused,
    step,
    g.up,
    gentle,
    engineeringOpen,
    pickerOpen,
    methodsOpen,
  ]);
  useEffect(() => {
    let active = true;
    const worker = new Worker(
      new URL("./signalAnalysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event) => {
      if (!active) return;
      setAnalysisState({
        key: analysisKey,
        result: event.data.result,
        error: event.data.error,
      });
      worker.terminate();
    };
    worker.onerror = () => {
      if (!active) return;
      setAnalysisState({
        key: analysisKey,
        error: "The 3-day calculation could not finish.",
      });
      worker.terminate();
    };
    worker.postMessage({ data, site, selected: relay });
    return () => {
      active = false;
      worker.terminate();
    };
  }, [data, site, relay, analysisKey, analysisAttempt]);
  const closeEngineering = () => {
    setPlaying(false);
    setEngineeringOpen(false);
    engineeringButton.current?.focus();
  };
  const openEngineering = () => {
    setPlaying(false);
    setExplanation((value) =>
      value.phase === "running" ? { ...value, paused: true } : value,
    );
    setPickerOpen(false);
    setMethodsOpen(false);
    setEngineeringOpen(true);
  };
  const openPicker = () => {
    setPlaying(false);
    setEngineeringOpen(false);
    setMethodsOpen(false);
    setPickerOpen(true);
  };
  const openMethods = () => {
    setPlaying(false);
    setEngineeringOpen(false);
    setPickerOpen(false);
    setMethodsOpen(true);
  };
  useEffect(() => {
    if (!engineeringOpen) return;
    engineering.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPlaying(false);
        setEngineeringOpen(false);
        engineeringButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [engineeringOpen]);
  useEffect(() => {
    if (pickerOpen) sitePicker.current?.showModal();
    else sitePicker.current?.close();
  }, [pickerOpen]);
  useEffect(() => {
    if (methodsOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [methodsOpen]);
  const applyLocation = (id: string) => {
    changeSite(id);
    setWatch(false);
    setStep(1);
    setPickerOpen(false);
  };
  useEffect(() => {
    if (
      !pickerOpen &&
      step === 1 &&
      sitePicker.current?.returnValue === "selected"
    ) {
      sitePicker.current.returnValue = "";
      lessonButton.current?.focus();
    }
  }, [pickerOpen, step]);
  const next = analysis?.changes.find((change) => change.time > time + 0.04);
  const changeLabel = (change: NonNullable<typeof next>) =>
    `${change.kind === "direct" ? "Moon site → Earth" : change.kind === "up" ? `Moon site → Satellite ${relay + 1}` : `Satellite ${relay + 1} → Earth`}: ${change.visible ? "path is clear" : "Moon blocks path"}.`;
  const checkPath = () => {
    setPlaying(false);
    setWatch(false);
    setNextNotice("");
    setExplanation({
      phase: gentle ? "complete" : "running",
      progress: gentle ? 2 : 0,
      paused: false,
    });
  };
  const checked = explanation.phase !== "idle";
  const verdict =
    step === 1
      ? g.direct
        ? "The direct path toward Earth is clear in this model."
        : "The Moon blocks the direct path from this location."
      : !g.up
        ? "The Moon blocks the path from the site to this satellite."
        : !g.down
          ? "The site can see the satellite, but the Moon blocks the satellite’s path toward Earth."
          : "Both paths are clear in this model.";
  const rows: { key: VisibilityKey; label: string }[] = [
    { key: "direct", label: "Direct to Earth" },
    { key: "selected", label: `Through Satellite ${relay + 1}` },
    { key: "any", label: "Through any of the 5 satellites" },
  ];
  const analysisStatus = (
    <div className="signal-analysis-status" role="status">
      {analysisError ? (
        <>
          <p>{analysisError}</p>
          <button
            onClick={() =>
              choose(() => {
                setAnalysisState({ key: analysisKey });
                setAnalysisAttempt((n) => n + 1);
              })
            }
          >
            Retry calculation
          </button>
        </>
      ) : (
        <p>Calculating 3 days for {site.name}…</p>
      )}
    </div>
  );
  const selectors = (
    <div className="signal-selectors">
      <label>
        Moon location
        <select
          aria-label="Moon location"
          value={siteId}
          onChange={(e) => choose(() => changeSite(e.target.value))}
        >
          {STUDY_SITES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Satellite
        <select
          aria-label="Reference satellite"
          value={relay}
          onChange={(e) => choose(() => changeRelay(+e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={i}>
              Satellite {i + 1} (SV-{i + 1})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
  const playback = (
    <div className="signal-playback-controls">
      <button
        disabled={time >= data.manifest.duration}
        aria-label={playing ? "Pause playback" : "Play playback"}
        onClick={() =>
          choose(() => {
            setExplanation({ phase: "complete", progress: 2, paused: false });
            setPlaying((v) => !v);
            setNextNotice("");
          })
        }
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
        {playing ? "Pause" : "Play"}
      </button>
      <button
        disabled={!next}
        onClick={() =>
          choose(() => {
            if (next) {
              changeTime(
                Math.min(data.manifest.duration, Math.ceil(next.time + 0.04)),
              );
              setNextNotice(changeLabel(next));
            }
          })
        }
      >
        <FastForward size={15} />
        Jump to next path change
      </button>
      <label className="signal-scrubber">
        Study time
        <input
          type="range"
          aria-label="Scenario time in seconds from 1 March 2027 UTC"
          aria-valuetext={formatUtc(data.manifest.epoch, time)}
          min={0}
          max={data.manifest.duration}
          step={1}
          value={time}
          onChange={(e) => choose(() => changeTime(+e.target.value))}
        />
      </label>
      <label className="signal-speed">
        Speed
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => choose(() => setSpeed(+e.target.value))}
        >
          <option value={60}>60×</option>
          <option value={600}>600×</option>
          <option value={3600}>3600×</option>
        </select>
      </label>
    </div>
  );
  const timeline = (
    <div className="signal-engineering-timeline">
      <p>
        Same 72 hours: 01 March 2027 00:00 → 04 March 2027 00:00 UTC. Filled =
        clear geometry; gaps = blocked.
      </p>
      {rows.map(({ key, label }) => (
        <div className={`lunar-timeline-row ${key}`} key={key}>
          <span>{label}</span>
          <div>
            {analysis?.[key].intervals.map((interval, i) => (
              <i
                key={i}
                style={{
                  left: `${(interval.start / data.manifest.duration) * 100}%`,
                  width: `${((interval.end - interval.start) / data.manifest.duration) * 100}%`,
                }}
              />
            ))}
            <b style={{ left: `${(time / data.manifest.duration) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div
      className="lunar-workspace"
      data-step={step}
      data-engineering={engineeringOpen}
      data-gentle-motion={gentle}
      data-frozen={frozen}
    >
      <header className="signal-heading">
        <div>
          <span className="lunar-eyebrow">ORBIT & SIGNAL LAB</span>
          <h1>How does a message leave the Moon?</h1>
        </div>
        <button
          onClick={() =>
            choose(() => {
              goTo(1);
              setSiteId("shackleton");
              setRelay(1);
              timeRef.current = 0;
              setTime(0);
              setAll(false);
              setSpeed(600);
              setBaseline(null);
              setPickerOpen(false);
              setMethodsOpen(false);
            })
          }
        >
          <RotateCcw size={15} />
          Start over
        </button>
      </header>
      <p className="signal-reference">
        <ShieldCheck size={14} />
        <span>
          Simulation based on a proposed NASA design — not live satellites.
        </span>
      </p>
      <div className="signal-navigation">
        <nav className="signal-steps" aria-label="Learning steps">
          {(["The problem", "Try a satellite", "Compare 3 days"] as const).map(
            (name, i) => (
              <button
                key={name}
                aria-current={step === i + 1 ? "step" : undefined}
                onClick={() => choose(() => goTo((i + 1) as LearningStep))}
              >
                <b>{i + 1}</b>
                {name}
              </button>
            ),
          )}
        </nav>
        <button
          className="signal-engineering-button"
          aria-label="Engineering details"
          aria-expanded={engineeringOpen}
          aria-controls="signal-engineering"
          ref={engineeringButton}
          onClick={() => choose(openEngineering)}
        >
          <Settings2 size={16} />
          <span>Engineering details</span>
        </button>
      </div>
      <div className="signal-learning-content">
        <div
          className="signal-scene-layout"
          hidden={step === 3 && !engineeringOpen}
        >
          <SignalViewport
            data={data}
            site={site}
            relay={relay}
            time={time}
            presentation={
              engineeringOpen ? "engineering" : step === 1 ? "direct" : "relay"
            }
            explanation={explanation}
            gentle={gentle}
            all={all}
            onReady={onReady}
            onToggleAll={() => choose(() => setAll((v) => !v))}
            onSelectRelay={(index) => choose(() => changeRelay(index))}
          />
          <section
            className="signal-lesson"
            hidden={engineeringOpen}
            aria-labelledby="signal-question"
          >
            <div className="signal-instruction">
              <span className="lunar-eyebrow">
                STEP {step} OF 3 · {site.name}
              </span>
              <h2 id="signal-question">
                {step === 1
                  ? "Can this Moon site send a message directly toward Earth?"
                  : "Can a satellite pass the message toward Earth?"}
              </h2>
              <p>
                {step === 1
                  ? "Moon site = the place on the Moon we are studying."
                  : "A relay satellite passes messages between places."}
              </p>
            </div>
            <SignalDiagram
              step={step}
              relay={relay}
              geometry={g}
              explanation={explanation}
            />
            <div
              className={`signal-verdict ${checked ? ((step === 1 ? g.direct : g.route) ? "is-clear" : "is-blocked") : ""}`}
              role="status"
            >
              <strong>
                {checked
                  ? verdict
                  : step === 1
                    ? "Will the Moon block the path?"
                    : "Will both parts of the route be clear?"}
              </strong>
              <span>
                {checked
                  ? "Clear geometry shows an opportunity, not a guaranteed radio service."
                  : "Press the button below to check."}
              </span>
            </div>
            <div className="signal-lesson-actions">
              <button
                className="signal-primary"
                ref={lessonButton}
                aria-label={
                  step === 1 ? "Check direct path" : "Check satellite route"
                }
                onClick={() => choose(checkPath)}
              >
                <span className="signal-full-label">
                  {step === 1 ? "Check direct path" : "Check satellite route"}
                </span>
                <span className="signal-short-label" aria-hidden="true">
                  {step === 1 ? "Check path" : "Check route"}
                </span>
                <ArrowRight size={16} />
              </button>
              {explanation.phase === "running" && (
                <button
                  aria-label={
                    explanation.paused
                      ? "Resume illustration"
                      : "Pause illustration"
                  }
                  onClick={() =>
                    choose(() =>
                      setExplanation((value) => ({
                        ...value,
                        paused: !value.paused,
                      })),
                    )
                  }
                >
                  {explanation.paused ? (
                    <Play size={15} />
                  ) : (
                    <Pause size={15} />
                  )}
                </button>
              )}
              {explanation.phase === "complete" && (
                <button
                  className="signal-next"
                  onClick={() => choose(() => goTo(step === 1 ? 2 : 3))}
                >
                  Next: {step === 1 ? "Try a satellite" : "Compare 3 days"}
                  <ArrowRight size={15} />
                </button>
              )}
              {step === 2 && explanation.phase === "complete" && (
                <button
                  onClick={() =>
                    choose(() => {
                      setExplanation({
                        phase: "complete",
                        progress: 2,
                        paused: false,
                      });
                      setWatch((v) => !v);
                      setPlaying(false);
                    })
                  }
                  aria-expanded={watch}
                  aria-label="Watch paths change"
                  aria-controls="signal-watch"
                >
                  <span className="signal-full-label">Watch paths change</span>
                  <span className="signal-short-label" aria-hidden="true">
                    Watch
                  </span>
                </button>
              )}
            </div>
            <div className="signal-lesson-foot">
              <span>Illustration — not real transmission speed.</span>
            </div>
          </section>
          {engineeringOpen && (
            <aside
              className="signal-engineering-panel"
              id="signal-engineering"
              aria-labelledby="engineering-title"
              ref={engineering}
            >
              <header>
                <div>
                  <h2 id="engineering-title">Engineering details</h2>
                  <p>Changes appear immediately</p>
                </div>
                <button
                  aria-label="Close engineering details"
                  onClick={() => choose(closeEngineering)}
                >
                  <X size={20} />
                </button>
              </header>
              <div className="signal-engineering-content">
                {selectors}
                <div
                  className="signal-path-status"
                  aria-label="Current path status"
                >
                  <p>
                    Direct to Earth:{" "}
                    <strong>{g.direct ? "Clear" : "Moon blocks path"}</strong>
                  </p>
                  <p>
                    Site → Satellite {relay + 1}:{" "}
                    <strong>{g.up ? "Clear" : "Moon blocks path"}</strong>
                  </p>
                  <p>
                    Satellite {relay + 1} → Earth:{" "}
                    <strong>{g.down ? "Clear" : "Moon blocks path"}</strong>
                  </p>
                </div>
                <p>
                  Moon site: {site.lat.toFixed(2)}° planetocentric latitude,{" "}
                  {site.lon.toFixed(2)}° east longitude. Selected study
                  coordinate, not a landing location. Satellite {relay + 1} is
                  reference vehicle SV-{relay + 1}.
                </p>
                <dl className="signal-engineering-metrics">
                  <div>
                    <dt>Site → satellite distance</dt>
                    <dd>{g.distance.toFixed(1)} km</dd>
                  </div>
                  <div>
                    <dt>Satellite elevation above spherical horizon</dt>
                    <dd>{g.relayElevation.toFixed(2)}°</dd>
                  </div>
                  <div>
                    <dt>Earth elevation above spherical horizon</dt>
                    <dd>{g.directElevation.toFixed(2)}°</dd>
                  </div>
                  <div>
                    <dt>Two-leg instantaneous vacuum delay</dt>
                    <dd>
                      {g.route
                        ? `${g.delay.toFixed(3)} s`
                        : "Unavailable — route blocked"}
                    </dd>
                  </div>
                </dl>
                <p>
                  Elevation is the angle above the horizon; above 0° is
                  geometrically clear. Delay = instantaneous path length ÷ light
                  speed, excluding hardware, processing and moving-endpoint
                  corrections.
                </p>
                <h3>Scenario time</h3>
                <p>
                  <Clock3 size={12} /> {formatUtc(data.manifest.epoch, time)} ·
                  Epoch: {data.manifest.epoch} · Frame: {data.manifest.frame} ·
                  spherical Moon radius {data.manifest.radius} km.
                </p>
                {playback}
                <p role="status">{nextNotice}</p>
                <h3>Visibility timeline</h3>
                {analysis ? timeline : analysisStatus}
                {analysis && (
                  <>
                    <button
                      onClick={() =>
                        choose(() =>
                          setBaseline({
                            site: site.id,
                            total: analysis.any.total,
                            gap: analysis.any.longestGap,
                          }),
                        )
                      }
                    >
                      Pin this site as a baseline
                    </button>
                    {baseline && (
                      <div className="signal-baseline">
                        <strong>
                          Baseline:{" "}
                          {
                            STUDY_SITES.find((s) => s.id === baseline.site)
                              ?.name
                          }
                        </strong>
                        <p>
                          Through any satellite: {durationText(baseline.total)}{" "}
                          clear; longest gap {durationText(baseline.gap)}.
                        </p>
                        <p>
                          {baseline.site === site.id
                            ? "Same location, model and 72-hour interval."
                            : `Only location changed. Current clear time differs by ${((analysis.any.total - baseline.total) / 3600).toFixed(2)} hours.`}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <h3>Model limits</h3>
                <ul>
                  {data.manifest.limits.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
                <p>
                  Orbit curves show 72-hour tracks in the rotating Moon
                  mean-Earth frame. Object markers are enlarged. The diagram
                  uses the same visibility calculation as the 3D scene, with
                  positions rearranged to explain the route.
                </p>
              </div>
              <footer>
                <button
                  className="signal-primary"
                  onClick={() => choose(closeEngineering)}
                >
                  Done
                </button>
              </footer>
            </aside>
          )}
        </div>
        {step === 3 && !engineeringOpen && (
          <section
            className="signal-comparison"
            aria-labelledby="comparison-title"
          >
            <div className="signal-comparison-intro">
              <div>
                <span className="lunar-eyebrow">STEP 3 OF 3 · {site.name}</span>
                <h2 id="comparison-title">
                  What difference do satellites make in 3 days?
                </h2>
                {analysis && (
                  <p className="signal-conclusion" role="status">
                    At this location, the direct path is clear for{" "}
                    {durationText(analysis.direct.total)}. Through Satellite{" "}
                    {relay + 1}: {durationText(analysis.selected.total)}. Using
                    any of the five: {durationText(analysis.any.total)}.
                  </p>
                )}
              </div>
              <SignalDiagram
                step={3}
                relay={relay}
                geometry={g}
                explanation={{ phase: "complete", progress: 2, paused: false }}
                compact
              />
            </div>
            {analysis ? (
              <div className="signal-comparison-cards">
                {rows.map(({ key, label }, i) => (
                  <article key={key} data-route={key}>
                    <span className="signal-card-number">0{i + 1}</span>
                    <h3>{label}</h3>
                    <div className="signal-comparison-bar">
                      <i
                        style={{
                          width: `${(analysis[key].total / data.manifest.duration) * 100}%`,
                        }}
                      />
                    </div>
                    <dl>
                      <div>
                        <dt>Time with a clear path</dt>
                        <dd>{durationText(analysis[key].total)}</dd>
                      </div>
                      <div>
                        <dt>Longest time without a clear path</dt>
                        <dd>{durationText(analysis[key].longestGap)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              analysisStatus
            )}
            <div className="signal-comparison-footer">
              <p>
                {analysis &&
                Math.abs(analysis.any.total - data.manifest.duration) < 0.001
                  ? "Clear geometry throughout these 72 hours; this does not guarantee radio service."
                  : "This compares clear paths in one 72-hour model, not measured radio service."}
              </p>
              <button
                className="signal-primary"
                onClick={() => choose(openPicker)}
                aria-haspopup="dialog"
                aria-controls="signal-location-picker"
              >
                Try another Moon location
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        )}
      </div>
      {watch && step === 2 && !engineeringOpen && (
        <section
          className="signal-watch"
          id="signal-watch"
          aria-label="Watch paths change"
        >
          {playback}
          <output role="status">
            {nextNotice || formatUtc(data.manifest.epoch, time)}
          </output>
        </section>
      )}
      <footer className="lunar-sources-strip">
        <span>
          <ShieldCheck size={14} />
          NASA sources
        </span>
        <nav aria-label="NASA sources">
          {SOURCES.slice(0, 3).map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.name}
              <ArrowUpRight size={12} />
            </a>
          ))}
        </nav>
        <button onClick={() => choose(openMethods)}>
          Methods & credits
          <ExternalLink size={12} />
        </button>
      </footer>
      <dialog
        className="signal-location-picker"
        id="signal-location-picker"
        aria-labelledby="signal-location-title"
        aria-describedby="signal-location-description"
        ref={sitePicker}
        onClose={() => {
          setPlaying(false);
          setPickerOpen(false);
        }}
      >
        <header>
          <div>
            <span className="lunar-eyebrow">SELECTED STUDY COORDINATES</span>
            <h2 id="signal-location-title">Choose a Moon location</h2>
            <p id="signal-location-description">
              Choose a study point to begin Step 1. These coordinates are not
              landing recommendations.
            </p>
          </div>
          <button
            aria-label="Close location picker"
            onClick={() => choose(() => setPickerOpen(false))}
          >
            <X size={20} />
          </button>
        </header>
        <div className="signal-location-grid">
          {STUDY_SITES.map((s) => (
            <button
              className="signal-location-card"
              key={s.id}
              onClick={() =>
                choose(() => {
                  sitePicker.current!.returnValue = "selected";
                  applyLocation(s.id);
                })
              }
              aria-current={s.id === siteId ? "location" : undefined}
            >
              <span className="signal-location-name">{s.name}</span>
              <span className="signal-location-coordinates">
                {s.lat.toFixed(2)}° latitude · {s.lon.toFixed(2)}° E
              </span>
              <span>{SITE_DESCRIPTIONS[s.id]}</span>
              {s.id === siteId && <strong>Current location</strong>}
            </button>
          ))}
        </div>
        <footer>
          <button onClick={() => choose(() => setPickerOpen(false))}>
            Cancel
          </button>
        </footer>
      </dialog>
      <dialog
        className="lunar-sources-dialog"
        aria-labelledby="lunar-source-title"
        ref={dialog}
        onClose={() => {
          setPlaying(false);
          setMethodsOpen(false);
        }}
      >
        <header>
          <div>
            <span className="lunar-eyebrow">DATA YOU CAN TRACE</span>
            <h2 id="lunar-source-title">NASA sources & methods</h2>
          </div>
          <button
            aria-label="Close sources"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        <div className="lunar-sources-content">
          <p>
            This lesson calculates trajectories from NASA's published, non-final
            LCRNS 3.1 reference states. It shows a design study, not live
            satellites or measured radio service.
          </p>
          {SOURCES.map((source) => (
            <article key={source.name}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
                <ArrowUpRight size={15} />
              </a>
              <p>{source.description}</p>
            </article>
          ))}
          <h3>How the calculations were made</h3>
          <p>
            Epoch: {data.manifest.epoch}. Duration: 72 hours. Coordinates:{" "}
            {data.manifest.frame}, planetocentric latitude / east-positive
            longitude. Sphere radius: {data.manifest.radius} km. Gravity is
            calculated in the lunar principal-axis frame.
          </p>
          <p>
            DE421 geometry, GRGM900C 25×25 gravity, third-body gravity and
            spherical solar radiation pressure are propagated offline. Mass
            constants use gm_de431.tpc; lunar shadow uses a binary spherical
            approximation. These interpretations are documented rather than
            claimed as an exact reproduction of the original NASA design
            environment.
          </p>
          <h3>Numerical checks</h3>
          <p>
            DOP853 versus RK45: maximum position difference{" "}
            {(data.manifest.validation.crossIntegratorMaxKm * 1000).toFixed(2)}{" "}
            m. Withheld playback interpolation probes: maximum{" "}
            {(data.manifest.validation.hermiteProbeMaxKm * 1000).toFixed(4)} m.
            These check numerical consistency under the same force model; they
            do not establish flight accuracy.
          </p>
          <h3>What this model leaves out</h3>
          <ul>
            {data.manifest.limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
          <p>
            {data.manifest.credits} The Moon color map includes visually filled
            polar regions and is used only as illustration. Ambient fill aids
            visibility; it is not a solar-power estimate.
          </p>
          <a
            className="lunar-manifest-link"
            href={SIGNAL_ROOT + "manifest.json"}
            download
          >
            Download source manifest, exact file URLs & checksums{" "}
            <ExternalLink size={14} />
          </a>
          <details>
            <summary>Exact NASA inputs</summary>
            {data.manifest.sources.map((source) => (
              <article key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.id}
                  <ArrowUpRight size={12} />
                </a>
                <p>
                  Retrieved {source.retrieved} · SHA-256{" "}
                  <code>{source.sha256}</code>
                </p>
              </article>
            ))}
          </details>
        </div>
      </dialog>
    </div>
  );
}
