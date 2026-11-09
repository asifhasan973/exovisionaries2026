import type { AtlasData } from "@exo/engine";
let cached: Promise<AtlasData> | undefined;
export const ATLAS_SOURCES = {
  terrain:
    "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_16.lbl",
  temperature: "https://www.diviner.ucla.edu/data",
};
export const atlasAsset = (file: string) =>
  `${import.meta.env.BASE_URL}exploration/${file}`;
/** Shared read-only cache. Failed preparation can be retried without altering a mission. */
export function loadAtlasReference() {
  return (cached ??= (async () => {
    try {
      const response = await fetch(atlasAsset("atlas.json"));
      if (!response.ok)
        throw new Error(
          `NASA reference data unavailable (${response.status}).`,
        );
      const data: AtlasData = await response.json();
      if (
        !data.metadata?.size ||
        !data.presets ||
        !Array.isArray(data.elevation) ||
        !Array.isArray(data.temperature) ||
        !Array.isArray(data.slope)
      )
        throw new Error("NASA reference grid is invalid.");
      await Promise.all(
        ["elevation", "temperature", "slope"].map(
          (layer) =>
            new Promise<void>((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = () =>
                reject(new Error("A NASA map layer could not load."));
              image.src = atlasAsset(`${layer}.webp`);
            }),
        ),
      );
      return data;
    } catch (error) {
      cached = undefined;
      throw error;
    }
  })());
}
