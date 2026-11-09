export type Vec3 = [number, number, number];
export interface SignalManifest {
  id: string;
  title: string;
  epoch: string;
  duration: number;
  step: number;
  count: number;
  radius: number;
  earthRadius: number;
  lightSpeed: number;
  frame: string;
  credits: string;
  model: Record<string, unknown>;
  limits: string[];
  validation: {
    crossIntegratorMaxKm: number;
    hermiteProbeMaxKm: number;
    crossCheck: string;
  };
  sources: { id: string; url: string; sha256: string; retrieved: string }[];
  artifacts: Record<string, string>;
}
export interface SignalScenario {
  manifest: SignalManifest;
  states: Float64Array;
}
export const SIGNAL_ROOT = `${import.meta.env.BASE_URL}exploration/signal/`;
let cached: Promise<SignalScenario> | undefined;

/** Bounded, checked scientific data. No runtime upstream NASA dependency. */
export function loadSignalScenario(): Promise<SignalScenario> {
  return (cached ??= (async () => {
    try {
      const responses = await Promise.all(
        ["manifest.json", "states.bin"].map((file) =>
          fetch(SIGNAL_ROOT + file),
        ),
      );
      for (const response of responses)
        if (!response.ok)
          throw new Error(
            `NASA reference scenario unavailable (${response.status})`,
          );
      const manifest: SignalManifest = await responses[0].json();
      const buffer = await responses[1].arrayBuffer();
      if (
        manifest.id !== "lcrns-3.1-2027-03-01-v1" ||
        manifest.frame !== "MOON_ME_DE421" ||
        manifest.count < 2 ||
        manifest.step <= 0 ||
        (manifest.count - 1) * manifest.step !== manifest.duration ||
        buffer.byteLength !== manifest.count * 42 * 8
      )
        throw new Error("Reference scenario structure is invalid.");
      const hash = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
      ]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
      if (hash !== manifest.artifacts["states.bin"])
        throw new Error(
          "Reference scenario checksum does not match. Please reload.",
        );
      const states = new Float64Array(buffer);
      if (states.some((v) => !Number.isFinite(v)))
        throw new Error("Reference scenario contains invalid coordinates.");
      return { manifest, states };
    } catch (error) {
      cached = undefined;
      throw error;
    }
  })());
}

/** Cubic Hermite positions in Moon mean-Earth frame; velocities include frame rotation. */
export function bodyAt(
  scenario: SignalScenario,
  time: number,
  body: number,
): Vec3 {
  const { manifest: m, states } = scenario;
  if (
    !Number.isFinite(time) ||
    time < 0 ||
    time > m.duration ||
    !Number.isInteger(body) ||
    body < 0 ||
    body > 6
  )
    throw new RangeError("Outside reference data coverage");
  const i = Math.min(m.count - 2, Math.floor(time / m.step)),
    f = (time - i * m.step) / m.step;
  const a = i * 42 + body * 6,
    b = a + 42;
  const h0 = 2 * f ** 3 - 3 * f * f + 1,
    h1 = f ** 3 - 2 * f * f + f,
    h2 = -2 * f ** 3 + 3 * f * f,
    h3 = f ** 3 - f * f;
  return [0, 1, 2].map(
    (k) =>
      h0 * states[a + k] +
      h1 * m.step * states[a + k + 3] +
      h2 * states[b + k] +
      h3 * m.step * states[b + k + 3],
  ) as Vec3;
}
