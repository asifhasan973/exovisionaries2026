import { readFile, writeFile } from "node:fs/promises";
const atlas = JSON.parse(
  await readFile("apps/web/public/exploration/atlas.json", "utf8"),
);
const geometry = JSON.parse(
  await readFile("apps/web/public/exploration/geometry.json", "utf8"),
);
const end = new Date(),
  start = new Date(end.getTime() - 6 * 86400000);
const date = (d) => d.toISOString().slice(0, 10);
const weather = await Promise.all(
  ["FLR", "CME", "SEP"].map(async (type) => {
    const url = `https://ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?startDate=${date(start)}&endDate=${date(end)}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Expected event array");
      return {
        type,
        url,
        available: true,
        events: rows
          .map((v) => ({
            id: v.flrID ?? v.activityID ?? v.sepID,
            time: v.beginTime ?? v.startTime ?? v.eventTime,
            classType: v.classType ?? null,
            link: v.link ?? null,
          }))
          .filter((v) => v.id && v.time),
      };
    } catch (error) {
      return { type, url, available: false, events: [], error: error.message };
    }
  }),
);
await writeFile(
  "apps/web/src/features/engineering/nasaReference.json",
  JSON.stringify(
    {
      sites: atlas.presets,
      terrain: {
        product: atlas.metadata.terrainProduct,
        period: atlas.metadata.terrainPeriod,
        resolution: atlas.metadata.terrainResolution,
        source: atlas.metadata.terrainSource,
        slopeBaselineM: atlas.metadata.slopeBaselineM,
      },
      thermal: {
        product: atlas.metadata.thermalProduct,
        period: atlas.metadata.thermalPeriod,
        source: atlas.metadata.temperatureSource,
        reference: atlas.metadata.thermalReference,
      },
      geometry: {
        epoch: "2026-11-08T00:00:00Z",
        source: "https://svs.gsfc.nasa.gov/5587/",
        raw: "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json",
        rows: geometry,
      },
      weather: {
        fetchedAt: new Date().toISOString(),
        startDate: date(start),
        endDate: date(end),
        channels: weather,
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Prepared NASA engineering references:",
  weather
    .map((v) => `${v.type}: ${v.available ? v.events.length : "unavailable"}`)
    .join(", "),
);
