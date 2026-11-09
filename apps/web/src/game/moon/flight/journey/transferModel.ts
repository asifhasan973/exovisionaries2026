import data from "./transferData.json" with { type: "json" };
export const TRANSFER_DATES = data.records.map((r) => r.date);
export interface TransferSolution {
  days: number;
  tliMS: number;
  loiMS: number;
  arrivalSpeedKmS: number;
  errorKm: number;
  path: number[][];
  moonPath: number[][];
  sunDirection: number[];
}
export function transferSolution(
  date: string | undefined,
  id: string,
): TransferSolution | undefined {
  return (
    data.records.find((r) => r.date === date)?.routes as
      Record<string, TransferSolution> | undefined
  )?.[id];
}
/** Osculating two-body orbit at the targeted 100 km lunar perilune. */
export function captureOrbit(
  speed: number,
  tangentialBurn: number,
  radialBurn: number,
) {
  const mu = 4902.800118,
    r = 1837.4,
    vt = speed - tangentialBurn / 1000,
    vr = radialBurn / 1000;
  const energy = (vt * vt + vr * vr) / 2 - mu / r,
    h = r * vt,
    e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (mu * mu)));
  return {
    bound: energy < 0,
    periapsisKm: (h * h) / (mu * (1 + e)) - 1737.4,
    apoapsisKm: energy < 0 ? (-mu / (2 * energy)) * (1 + e) - 1737.4 : Infinity,
  };
}
/** Local two-body preview in km, s. Stops before a surface intersection. */
export function orbitPreview(
  position: number[],
  velocity: number[],
  seconds = 7200,
) {
  let r = [...position],
    v = [...velocity];
  const points = [r];
  const acceleration = (p: number[]) => {
    const norm = Math.hypot(...p);
    return p.map((x) => (-4902.800118 * x) / norm ** 3);
  };
  const dt = 10;
  for (let t = 0; t < seconds; t += dt) {
    const a = acceleration(r),
      half = v.map((x, i) => x + (a[i] * dt) / 2);
    r = r.map((x, i) => x + half[i] * dt);
    const b = acceleration(r);
    v = half.map((x, i) => x + (b[i] * dt) / 2);
    points.push(r);
    if (Math.hypot(...r) < 1737.4) break;
  }
  return points;
}
