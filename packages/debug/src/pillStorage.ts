export interface PillPosition {
  x: number;
  y: number;
  dockSide?: "left" | "right" | "top" | "bottom";
}

export const PILL_POS_STORAGE_KEY = "zero_to_beyond_debug_pill_pos";
export const PILL_COMPACT_STORAGE_KEY = "zero_to_beyond_debug_pill_compact";

export function getDefaultPosition(): PillPosition {
  if (typeof window === "undefined") return { x: 20, y: 10 };
  const pillApproxWidth = 160;
  return {
    x: Math.max(10, Math.round((window.innerWidth - pillApproxWidth) / 2)),
    y: 10,
    dockSide: "top",
  };
}

export function loadSavedPosition(): PillPosition {
  if (typeof window === "undefined") return getDefaultPosition();
  try {
    const raw = localStorage.getItem(PILL_POS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        const padding = 10;
        const pillWidth = 175;
        const pillHeight = 36;
        const maxX = Math.max(padding, window.innerWidth - pillWidth - padding);
        const maxY = Math.max(
          padding,
          window.innerHeight - pillHeight - padding,
        );
        return {
          x: Math.max(padding, Math.min(maxX, parsed.x)),
          y: Math.max(padding, Math.min(maxY, parsed.y)),
          dockSide: parsed.dockSide,
        };
      }
    }
  } catch {}
  return getDefaultPosition();
}
