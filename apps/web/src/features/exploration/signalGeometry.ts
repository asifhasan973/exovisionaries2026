import { bodyAt } from "./signalScenario";
import type { SignalScenario, Vec3 } from "./signalScenario";
export interface StudySite {
  id: string;
  name: string;
  lat: number;
  lon: number;
}
export const STUDY_SITES: StudySite[] = [
  { id: "shackleton", name: "Shackleton region", lat: -89.5, lon: 0 },
  { id: "cabeus", name: "Cabeus region", lat: -85.3, lon: 318.5 },
  { id: "malapert", name: "Malapert region", lat: -85.99, lon: 2.83 },
  { id: "far", name: "Far-side reference", lat: -85, lon: 180 },
  { id: "near", name: "Near-side reference", lat: 0, lon: 0 },
];
export const magnitude = (v: Vec3) => Math.hypot(...v);
export const subtract = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const scale = (v: Vec3, n: number): Vec3 => [
  v[0] * n,
  v[1] * n,
  v[2] * n,
];
export function sitePosition(site: StudySite, radius: number): Vec3 {
  const lat = (site.lat * Math.PI) / 180,
    lon = (site.lon * Math.PI) / 180;
  return [
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
  ];
}
export function elevation(surface: Vec3, target: Vec3): number {
  return (
    (Math.asin(
      Math.max(
        -1,
        Math.min(
          1,
          dot(surface, subtract(target, surface)) /
            (magnitude(surface) * magnitude(subtract(target, surface))),
        ),
      ),
    ) *
      180) /
    Math.PI
  );
}
/** Tangency is blocked. Surface links use elevation to avoid endpoint self-intersection. */
export function segmentClear(a: Vec3, b: Vec3, radius: number): boolean {
  const d = subtract(b, a),
    denominator = dot(d, d);
  if (!denominator) return magnitude(a) > radius;
  const f = Math.max(0, Math.min(1, -dot(a, d) / denominator));
  return (
    magnitude([a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f]) >
    radius + 1e-7
  );
}
/** First interior sphere intersection, used only to terminate the visual ray. */
export function blockedEndpoint(a: Vec3, b: Vec3, radius: number): Vec3 {
  const d = subtract(b, a),
    aa = dot(d, d),
    bb = 2 * dot(a, d),
    cc = dot(a, a) - radius * radius;
  const discriminant = bb * bb - 4 * aa * cc;
  if (!aa || discriminant < 0) return b;
  const roots = [
    (-bb - Math.sqrt(discriminant)) / (2 * aa),
    (-bb + Math.sqrt(discriminant)) / (2 * aa),
  ].filter((t) => t >= -1e-9 && t <= 1);
  if (!roots.length) return b;
  const t = Math.max(0, Math.min(...roots));
  return [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t];
}
export function geometryAt(
  data: SignalScenario,
  time: number,
  site: StudySite,
  relayIndex: number,
) {
  const surface = sitePosition(site, data.manifest.radius),
    earth = bodyAt(data, time, 5),
    sun = bodyAt(data, time, 6),
    relay = bodyAt(data, time, relayIndex);
  const directElevation = elevation(surface, earth),
    relayElevation = elevation(surface, relay);
  const direct = directElevation > 0,
    up = relayElevation > 0,
    down = segmentClear(relay, earth, data.manifest.radius);
  const distance = magnitude(subtract(relay, surface));
  return {
    surface,
    earth,
    sun,
    relay,
    direct,
    up,
    down,
    route: up && down,
    directElevation,
    relayElevation,
    distance,
    delay:
      (distance + magnitude(subtract(earth, relay))) / data.manifest.lightSpeed,
    directDelay: magnitude(subtract(earth, surface)) / data.manifest.lightSpeed,
  };
}
export type VisibilityKey = "direct" | "selected" | "any";
export interface VisibilityInterval {
  start: number;
  end: number;
}
export interface VisibilitySeries {
  intervals: VisibilityInterval[];
  total: number;
  longestGap: number;
}
export type LinkKind = "direct" | "up" | "down";
export interface VisibilityChange {
  time: number;
  kind: LinkKind;
  visible: boolean;
}
export interface ContactAnalysis {
  direct: VisibilitySeries;
  selected: VisibilitySeries;
  any: VisibilitySeries;
  events: number[];
  changes: VisibilityChange[];
}
function flagsAt(
  data: SignalScenario,
  time: number,
  site: StudySite,
  selected: number,
) {
  const s = sitePosition(site, data.manifest.radius),
    earth = bodyAt(data, time, 5);
  let up = false,
    down = false;
  const relays = Array.from({ length: 5 }, (_, i) => {
    const r = bodyAt(data, time, i);
    const above = elevation(s, r) > 0,
      clear = segmentClear(r, earth, data.manifest.radius);
    if (i === selected) {
      up = above;
      down = clear;
    }
    return above && clear;
  });
  return {
    direct: elevation(s, earth) > 0,
    selected: relays[selected],
    any: relays.some(Boolean),
    up,
    down,
  };
}
/** One-second bracketing resolves short opportunities; roots are bisected to <0.1 s. */
export function analyzeContacts(
  data: SignalScenario,
  site: StudySite,
  selected: number,
): ContactAnalysis {
  const keys: VisibilityKey[] = ["direct", "selected", "any"],
    duration = data.manifest.duration;
  const intervals: Record<VisibilityKey, VisibilityInterval[]> = {
    direct: [],
    selected: [],
    any: [],
  };
  const open: Record<VisibilityKey, number | null> = {
    direct: null,
    selected: null,
    any: null,
  };
  let previous = flagsAt(data, 0, site, selected);
  for (const key of keys) if (previous[key]) open[key] = 0;
  const events: number[] = [];
  const changes: VisibilityChange[] = [];
  for (let t = 1; t <= duration; t++) {
    const current = flagsAt(data, t, site, selected);
    for (const key of keys)
      if (current[key] !== previous[key]) {
        let lo = t - 1,
          hi = t;
        while (hi - lo > 0.0625) {
          const mid = (lo + hi) / 2;
          if (flagsAt(data, mid, site, selected)[key] === previous[key])
            lo = mid;
          else hi = mid;
        }
        const boundary = (lo + hi) / 2;
        if (current[key]) open[key] = boundary;
        else {
          intervals[key].push({ start: open[key] ?? 0, end: boundary });
          open[key] = null;
        }
        if (key === "selected" || key === "direct") events.push(boundary);
      }
    for (const kind of ["direct", "up", "down"] as const)
      if (current[kind] !== previous[kind]) {
        let lo = t - 1,
          hi = t;
        while (hi - lo > 0.0625) {
          const mid = (lo + hi) / 2;
          if (flagsAt(data, mid, site, selected)[kind] === previous[kind])
            lo = mid;
          else hi = mid;
        }
        changes.push({ time: (lo + hi) / 2, kind, visible: current[kind] });
      }
    previous = current;
  }
  const summarize = (key: VisibilityKey): VisibilitySeries => {
    if (open[key] !== null)
      intervals[key].push({ start: open[key]!, end: duration });
    let last = 0,
      longestGap = 0,
      total = 0;
    for (const interval of intervals[key]) {
      longestGap = Math.max(longestGap, interval.start - last);
      total += interval.end - interval.start;
      last = interval.end;
    }
    return {
      intervals: intervals[key],
      total,
      longestGap: Math.max(longestGap, duration - last),
    };
  };
  return {
    direct: summarize("direct"),
    selected: summarize("selected"),
    any: summarize("any"),
    events: [...new Set(events)].sort((a, b) => a - b),
    changes: changes.sort((a, b) => a.time - b.time),
  };
}
