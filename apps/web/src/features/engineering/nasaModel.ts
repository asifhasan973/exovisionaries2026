export const SOLAR_REFERENCE = {
  irradianceWm2: 1361,
  source:
    "https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science",
};
export const CREW_REFERENCE = {
  oxygenKgDay: 0.82,
  co2KgDay: 1.04,
  heatKjDay: 12000,
  source:
    "https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf",
};
export interface SolarBasis {
  source: string;
  irradianceWm2: number;
  areaM2: number;
  efficiencyPercent: number;
  incidenceDegrees: number;
}
export function solarOutput(
  areaM2: number,
  efficiencyPercent: number,
  incidenceDegrees: number,
) {
  if (
    !Number.isFinite(areaM2) ||
    areaM2 < 0 ||
    areaM2 > 100 ||
    !Number.isFinite(efficiencyPercent) ||
    efficiencyPercent < 0 ||
    efficiencyPercent > 100 ||
    !Number.isFinite(incidenceDegrees) ||
    incidenceDegrees < 0 ||
    incidenceDegrees > 90
  )
    return null;
  return (
    ((SOLAR_REFERENCE.irradianceWm2 * areaM2 * efficiencyPercent) / 100) *
    Math.max(0, Math.cos((incidenceDegrees * Math.PI) / 180))
  );
}
export function crewBudget(crew: number, days: number) {
  if (
    !Number.isInteger(crew) ||
    crew < 1 ||
    crew > 50 ||
    !Number.isFinite(days) ||
    days <= 0 ||
    days > 30
  )
    return null;
  return {
    oxygenKg: crew * days * CREW_REFERENCE.oxygenKgDay,
    co2Kg: crew * days * CREW_REFERENCE.co2KgDay,
    metabolicHeatW: (crew * CREW_REFERENCE.heatKjDay * 1000) / 86400,
  };
}
export interface WeatherEvent {
  id: string;
  time: string;
  classType: string | null;
  link: string | null;
}
export interface WeatherChannel {
  type: string;
  url: string;
  available: boolean;
  events: WeatherEvent[];
  error?: string;
}
export interface WeatherReport {
  fetchedAt: string;
  startDate: string;
  endDate: string;
  channels: WeatherChannel[];
}
export function parseEvents(raw: unknown): WeatherEvent[] {
  if (!Array.isArray(raw))
    throw new Error("NASA returned an unexpected response.");
  return raw.flatMap((v) => {
    if (!v || typeof v !== "object") return [];
    const id = v.flrID ?? v.activityID ?? v.sepID,
      time = v.beginTime ?? v.startTime ?? v.eventTime;
    if (
      typeof id !== "string" ||
      typeof time !== "string" ||
      !Number.isFinite(Date.parse(time))
    )
      return [];
    const link =
      typeof v.link === "string" &&
      v.link.startsWith("https://ccmc.gsfc.nasa.gov/")
        ? v.link
        : null;
    return [
      {
        id,
        time,
        classType: typeof v.classType === "string" ? v.classType : null,
        link,
      },
    ];
  });
}
/** Each channel retains its own availability; failed requests never mean zero events. */
export async function fetchWeather(now = new Date()): Promise<WeatherReport> {
  const endDate = now.toISOString().slice(0, 10),
    startDate = new Date(now.getTime() - 6 * 86400000)
      .toISOString()
      .slice(0, 10);
  const channels = await Promise.all(
    ["FLR", "CME", "SEP"].map(async (type) => {
      const url = `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?startDate=${startDate}&endDate=${endDate}`;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok)
          throw new Error(`NASA request failed (${response.status}).`);
        return {
          type,
          url,
          available: true,
          events: parseEvents(await response.json()),
        };
      } catch (error) {
        return {
          type,
          url,
          available: false,
          events: [],
          error:
            error instanceof Error ? error.message : "Request unavailable.",
        };
      }
    }),
  );
  return { fetchedAt: new Date().toISOString(), startDate, endDate, channels };
}
