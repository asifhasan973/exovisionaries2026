import type { HumanPack } from "@/game/moon/shared/validation";

export const PACK_GAME_NAMES = {
  capsule: "Capsule",
  lander: "Lander",
  supplies: "Supplies",
} as const;
export const SUPPLY_ITEMS = ["food", "water", "oxygen"] as const;
export type SupplyItem = (typeof SUPPLY_ITEMS)[number];
export const SUPPLY_SOCKETS: Record<SupplyItem, { x: number; y: number }> = {
  food: { x: 330, y: 330 },
  water: { x: 525, y: 330 },
  oxygen: { x: 720, y: 330 },
};
export const CAPSULE_SOCKET = { x: 510, y: 292 };
export interface PackingGameState {
  version: 1;
  id: HumanPack;
  phase: "ready" | "passed";
  seated: boolean;
  locks: number[];
  angle: number;
  elapsed: number;
  held: boolean;
  stowed: SupplyItem[];
  misses: number;
  supplyLayout?: number;
}
export type PackingGameAction =
  | { type: "packing-game-select"; id: HumanPack; layout?: number }
  | {
      type: "packing-game-drop";
      item: "capsule" | SupplyItem;
      x: number;
      y: number;
    }
  | { type: "packing-game-lock"; latch: number }
  | { type: "packing-game-turn"; direction: -1 | 1 }
  | { type: "packing-game-hold"; held: boolean }
  | { type: "packing-game-tick"; seconds: number }
  | { type: "packing-game-pause" }
  | { type: "packing-game-reset"; layout?: number };

export const LANDER_LOWER_SECONDS = 1.8;
export const landerAligned = (game: PackingGameState) =>
  Math.abs(game.angle) <= 5;
export const SUPPLY_ORDERS: readonly (readonly SupplyItem[])[] = [
  SUPPLY_ITEMS,
  ["water", "oxygen", "food"],
  ["oxygen", "food", "water"],
  ["water", "food", "oxygen"],
  ["food", "oxygen", "water"],
  ["oxygen", "water", "food"],
];
export function shuffledSupplyLayout(previous = 0, random = Math.random) {
  const choices = [1, 2, 3, 4, 5].filter((layout) => layout !== previous);
  return choices[
    Math.min(
      choices.length - 1,
      Math.max(0, Math.floor(random() * choices.length)),
    )
  ];
}
export const emptyPackingGame = (
  id: HumanPack = "capsule",
  supplyLayout = 0,
): PackingGameState => ({
  version: 1,
  id,
  phase: "ready",
  seated: false,
  locks: [],
  angle: -30,
  elapsed: 0,
  held: false,
  stowed: [],
  misses: 0,
  supplyLayout,
});

/** Cargo receipts require a seated, latched or correctly stowed payload. */
export function reducePackingGame(
  game: PackingGameState,
  action: PackingGameAction,
): PackingGameState {
  if (action.type === "packing-game-select")
    return emptyPackingGame(
      action.id,
      action.layout ?? ((game.supplyLayout ?? 0) % 5) + 1,
    );
  if (action.type === "packing-game-reset")
    return emptyPackingGame(
      game.id,
      action.layout ?? ((game.supplyLayout ?? 0) % 5) + 1,
    );
  if (action.type === "packing-game-pause")
    return game.held ? { ...game, held: false } : game;
  if (game.phase === "passed") return game;
  if (action.type === "packing-game-drop") {
    if (!Number.isFinite(action.x) || !Number.isFinite(action.y)) return game;
    if (game.id === "capsule" && action.item === "capsule" && !game.seated) {
      return Math.hypot(
        action.x - CAPSULE_SOCKET.x,
        action.y - CAPSULE_SOCKET.y,
      ) <= 62
        ? { ...game, seated: true }
        : { ...game, misses: game.misses + 1 };
    }
    if (
      game.id !== "supplies" ||
      !SUPPLY_ITEMS.includes(action.item as SupplyItem)
    )
      return game;
    const item = action.item as SupplyItem;
    if (game.stowed.includes(item)) return game;
    const target = SUPPLY_SOCKETS[item];
    if (
      Math.abs(action.x - target.x) > 65 ||
      Math.abs(action.y - target.y) > 55
    )
      return { ...game, misses: game.misses + 1 };
    const stowed = [...game.stowed, item];
    return { ...game, stowed, phase: stowed.length === 3 ? "passed" : "ready" };
  }
  if (action.type === "packing-game-lock") {
    if (
      game.id !== "capsule" ||
      !game.seated ||
      ![0, 1].includes(action.latch) ||
      game.locks.includes(action.latch)
    )
      return game;
    const locks = [...game.locks, action.latch];
    return { ...game, locks, phase: locks.length === 2 ? "passed" : "ready" };
  }
  if (action.type === "packing-game-turn") {
    if (
      game.id !== "lander" ||
      game.held ||
      ![-1, 1].includes(action.direction)
    )
      return game;
    return {
      ...game,
      angle: Math.max(-50, Math.min(50, game.angle + action.direction * 10)),
      elapsed: 0,
    };
  }
  if (action.type === "packing-game-hold")
    return game.id === "lander" ? { ...game, held: action.held } : game;
  if (
    action.type !== "packing-game-tick" ||
    game.id !== "lander" ||
    !game.held ||
    !Number.isFinite(action.seconds) ||
    action.seconds <= 0
  )
    return game;
  const elapsed = Math.min(
    landerAligned(game) ? LANDER_LOWER_SECONDS : 0.45,
    game.elapsed + Math.min(0.1, action.seconds),
  );
  const seated = landerAligned(game) && elapsed >= LANDER_LOWER_SECONDS;
  return {
    ...game,
    elapsed,
    seated,
    held: !seated,
    phase: seated ? "passed" : "ready",
  };
}

/** Transient pointer coordinates are intentionally excluded from saved progress. */
export function restorePackingGame(raw: unknown): PackingGameState {
  if (!raw || typeof raw !== "object") return emptyPackingGame();
  const saved = raw as PackingGameState;
  if (
    saved.version !== 1 ||
    !["capsule", "lander", "supplies"].includes(saved.id)
  )
    return emptyPackingGame();
  const clean = emptyPackingGame(
    saved.id,
    Number.isInteger(saved.supplyLayout) &&
      saved.supplyLayout! >= 0 &&
      saved.supplyLayout! < SUPPLY_ORDERS.length
      ? saved.supplyLayout
      : 0,
  );
  clean.seated = saved.seated === true;
  clean.locks = [0, 1].filter(
    (id) => Array.isArray(saved.locks) && saved.locks.includes(id),
  );
  clean.stowed = SUPPLY_ITEMS.filter(
    (id) => Array.isArray(saved.stowed) && saved.stowed.includes(id),
  );
  clean.angle = Number.isFinite(saved.angle)
    ? Math.max(-50, Math.min(50, saved.angle))
    : -30;
  clean.elapsed = Number.isFinite(saved.elapsed)
    ? Math.max(0, Math.min(LANDER_LOWER_SECONDS, saved.elapsed))
    : 0;
  const completed =
    clean.id === "capsule"
      ? clean.seated && clean.locks.length === 2
      : clean.id === "lander"
        ? clean.seated &&
          landerAligned(clean) &&
          clean.elapsed >= LANDER_LOWER_SECONDS
        : clean.stowed.length === 3;
  clean.phase = completed ? "passed" : "ready";
  return clean;
}
