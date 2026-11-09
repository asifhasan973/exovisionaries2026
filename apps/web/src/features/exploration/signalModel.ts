/** Educational two-body relay model in km, seconds, decimal MB and Wh. */
export type Vec = [number, number, number];
export type Orbit = "direct" | "circular" | "elliptical";
export interface Site {
  id: string;
  name: string;
  lat: number;
  lon: number;
}
export interface Geometry {
  hour: number;
  distance: number;
  lon: number;
  lat: number;
}
export const RADIUS = 1737.4,
  MU = 4902.800118,
  STEP = 30,
  DURATION = 86400;
export const SITES: Site[] = [
  { id: "shackleton", name: "Shackleton region", lat: -89.5, lon: 0 },
  { id: "cabeus", name: "Cabeus region", lat: -85.3, lon: 318.5 },
  { id: "far", name: "Far-side reference", lat: -85, lon: 180 },
];
export const PACKETS = [
  { name: "Status packet", mb: 2 },
  { name: "Ice spectrum", mb: 30 },
  { name: "Terrain mosaic", mb: 120 },
];
export const RADIOS = [
  { name: "Economy radio", rate: 0.04, watts: 8 },
  { name: "Science radio", rate: 0.2, watts: 24 },
  { name: "High-rate radio", rate: 1, watts: 70 },
];
const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: Vec) => Math.hypot(...a);
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export function unit(lat: number, lon: number): Vec {
  const p = (lat * Math.PI) / 180,
    l = (lon * Math.PI) / 180;
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
}
export function earthAt(t: number, data: Geometry[]): Vec {
  const h = Math.min(data.length - 2, Math.floor(t / 3600)),
    f = t / 3600 - h,
    a = data[h],
    b = data[h + 1];
  return scale(
    unit(a.lat + (b.lat - a.lat) * f, a.lon + (b.lon - a.lon) * f),
    a.distance + (b.distance - a.distance) * f,
  );
}
export function relayAt(t: number, orbit: Orbit): Vec {
  const a = orbit === "elliptical" ? 6000 : RADIUS + 300,
    e = orbit === "elliptical" ? 0.65 : 0;
  const m = Math.sqrt(MU / a ** 3) * t;
  let E = m;
  for (let i = 0; i < 10; i++)
    E -= (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
  // Polar plane, periapsis north / apoapsis south; node aligned with epoch body-fixed x.
  const x = a * Math.sqrt(1 - e * e) * Math.sin(E),
    z = a * (Math.cos(E) - e),
    q = (-2 * Math.PI * t) / (27.321661 * 86400);
  return [x * Math.cos(q), x * Math.sin(q), z];
}
export function visible(surface: Vec, target: Vec, mask = 5) {
  const v = sub(target, surface);
  return (
    dot(surface, v) / (norm(surface) * norm(v)) >
    Math.sin((mask * Math.PI) / 180)
  );
}
export function clearMoon(a: Vec, b: Vec) {
  const d = sub(b, a),
    k = Math.max(0, Math.min(1, -dot(a, d) / dot(d, d)));
  return norm([a[0] + k * d[0], a[1] + k * d[1], a[2] + k * d[2]]) > RADIUS;
}
export function links(t: number, site: Site, orbit: Orbit, data: Geometry[]) {
  const surface = scale(unit(site.lat, site.lon), RADIUS),
    earth = earthAt(t, data),
    relay = relayAt(t, orbit);
  return {
    surface,
    earth,
    relay,
    direct: visible(surface, earth),
    up: visible(surface, relay),
    down: clearMoon(relay, earth),
  };
}
export interface Run {
  earth: number[];
  surface: number[];
  buffer: number[];
  inflight: number;
  energy: number;
  contact: number;
  wait: number;
  completed: number;
  total: number;
}
export function simulate(
  site: Site,
  orbit: Orbit,
  radio: number,
  data: Geometry[],
  end = DURATION,
  reverse = false,
  battery = 36,
): Run {
  const remaining = PACKETS.map((p) => p.mb),
    buffer = PACKETS.map(() => 0),
    earth = PACKETS.map(() => 0),
    transit: { at: number; mb: number; i: number; relay?: boolean }[] = [];
  const order = reverse ? [2, 1, 0] : [0, 1, 2],
    r = RADIOS[radio];
  let energy = battery,
    contact = 0,
    wait = 0;
  for (let t = 0; t < end; t += STEP) {
    const dt = Math.min(STEP, end - t),
      g = links(t, site, orbit, data);
    for (let k = transit.length - 1; k >= 0; k--)
      if (transit[k].at <= t) {
        (transit[k].relay ? buffer : earth)[transit[k].i] += transit[k].mb;
        transit.splice(k, 1);
      }
    if (orbit === "direct" ? g.direct : g.up) contact += dt;
    const forwarding =
      orbit !== "direct" && g.down && buffer.some((v) => v > 1e-9);
    if (forwarding) {
      let capacity = (0.25 * dt) / 8;
      for (const i of order) {
        const n = Math.min(buffer[i], capacity);
        buffer[i] -= n;
        capacity -= n;
        if (n)
          transit.push({
            at: t + dt + norm(sub(g.earth, g.relay)) / 299792.458,
            mb: n,
            i,
          });
      }
    } else if ((orbit === "direct" ? g.direct : g.up) && energy > 0) {
      let capacity = Math.min(
        (r.rate * dt) / 8,
        (((energy * 3600) / r.watts) * r.rate) / 8,
        orbit === "direct"
          ? Infinity
          : 64 -
              buffer.reduce((a, b) => a + b, 0) -
              transit.filter((p) => p.relay).reduce((a, p) => a + p.mb, 0),
      );
      for (const i of order) {
        const n = Math.max(0, Math.min(remaining[i], capacity));
        remaining[i] -= n;
        capacity -= n;
        energy = Math.max(0, energy - (((n * 8) / r.rate) * r.watts) / 3600);
        if (orbit === "direct") {
          if (n)
            transit.push({
              at: t + dt + norm(sub(g.earth, g.surface)) / 299792.458,
              mb: n,
              i,
            });
        } else if (n)
          transit.push({
            at: t + dt + norm(sub(g.relay, g.surface)) / 299792.458,
            mb: n,
            i,
            relay: true,
          });
      }
    } else wait += dt;
  }
  for (const p of transit)
    if (p.at <= end) (p.relay ? buffer : earth)[p.i] += p.mb;
  return {
    earth,
    surface: remaining,
    buffer,
    inflight: transit.filter((p) => p.at > end).reduce((a, p) => a + p.mb, 0),
    energy,
    contact,
    wait,
    completed: earth.filter((v, i) => v >= PACKETS[i].mb - 1e-6).length,
    total: earth.reduce((a, b) => a + b, 0),
  };
}
