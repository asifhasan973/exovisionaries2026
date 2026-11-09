export interface AtlasData {
  presets: Record<
    string,
    {
      lat: number;
      lon: number;
      elevation: number;
      temperature: number | null;
      slope: number;
    }
  >;
  metadata: {
    extentM: number;
    size: number;
    terrainSource: string;
    temperatureSource: string;
    terrainProduct: string;
    terrainPeriod: string;
    terrainResolution: string;
    thermalProduct: string;
    thermalPeriod: string;
    slopeBaselineM: number;
  };
  elevation: (number | null)[][];
  temperature: (number | null)[][];
  slope: (number | null)[][];
}
export function atlasPoint(
  lat: number,
  lon: number,
  extent: number,
  size: number,
) {
  const rho = 2 * 1737400 * Math.tan(((90 + lat) * Math.PI) / 360),
    l = (lon * Math.PI) / 180;
  return {
    x: (((rho * Math.sin(l)) / extent + 1) * size) / 2,
    y: ((1 - (rho * Math.cos(l)) / extent) * size) / 2,
  };
}
export function sampleAtlas(data: AtlasData, lat: number, lon: number) {
  const preset = Object.values(data.presets).find(
    (p) => p.lat === lat && p.lon === lon,
  );
  if (preset) return preset;
  const p = atlasPoint(lat, lon, data.metadata.extentM, data.metadata.size),
    x = Math.floor(p.x),
    y = Math.floor(p.y);
  return {
    elevation: data.elevation[y]?.[x] ?? null,
    temperature: data.temperature[y]?.[x] ?? null,
    slope: data.slope[y]?.[x] ?? null,
  };
}
