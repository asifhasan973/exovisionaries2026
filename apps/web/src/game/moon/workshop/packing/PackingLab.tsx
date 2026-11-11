import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode, SVGProps } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Package,
  RotateCcw,
} from "lucide-react";
import type { MissionEvent } from "@/game/moon/workshop/lander/workshopSession";
import type { HumanPack } from "@/game/moon/shared/validation";
import {
  CAPSULE_SOCKET,
  LANDER_LOWER_SECONDS,
  SUPPLY_ITEMS,
  SUPPLY_SOCKETS,
  SUPPLY_ORDERS,
  shuffledSupplyLayout,
  landerAligned,
  PACK_GAME_NAMES,
} from "./packingGame";
import type {
  PackingGameAction,
  PackingGameState,
  SupplyItem,
} from "./packingGame";
import { sound } from "@exo/audio";
import { isEngineFrozen, useOrientationLifecycleStore } from "@exo/ui";
import type { PreparationSelection } from "@/game/moon/core/design";
import "./packingLab.css";

type Dispatch = (event: MissionEvent) => void;
const instructions = {
  capsule: "Fit the capsule. Close both clamps.",
  lander: "Line up the gold marks. Hold to lower.",
  supplies: "Match each case to its locker.",
} as const;
const success = {
  capsule: "Capsule locked!",
  lander: "Lander secured!",
  supplies: "Supplies packed!",
} as const;
const supplyColors = {
  food: "#f0b270",
  water: "#7fcde9",
  oxygen: "#b7a6f2",
} as const;
const starts = {
  capsule: { x: 205, y: 205 },
  food: { x: 190, y: 150 },
  water: { x: 440, y: 150 },
  oxygen: { x: 690, y: 150 },
};
type CargoItem = keyof typeof starts;

export function PackingLabControls({
  game,
  dispatch,
  effects,
  onPass,
}: {
  game: PackingGameState;
  dispatch: Dispatch;
  effects: boolean;
  onPass(id: HumanPack): void;
}) {
  const previous = useRef(game.phase);
  const running = game.id === "lander" && game.held && game.phase !== "passed";
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        seconds = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (
        !document.hidden &&
        !isEngineFrozen() &&
        !document.querySelector("dialog[open]")
      )
        dispatch({ type: "packing-game-tick", seconds });
    }, 50);
    return () => window.clearInterval(timer);
  }, [running, dispatch]);
  useEffect(() => {
    const release = () => dispatch({ type: "packing-game-pause" });
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    window.addEventListener("game-orientation-pause", release);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
      window.removeEventListener("game-orientation-pause", release);
    };
  }, [dispatch]);
  useEffect(() => {
    if (game.phase === "passed" && previous.current !== "passed")
      onPass(game.id);
    previous.current = game.phase;
  }, [game.phase, game.id, onPass]);
  const act = (event: PackingGameAction) => {
    if (!isEngineFrozen()) {
      sound.setMuted(!effects);
      dispatch(event);
    }
  };
  const hold = (held: boolean) => {
    if (isEngineFrozen()) return;
    act({ type: "packing-game-hold", held });
    if (held) sound.playClick(220);
  };
  const blocked =
    game.id === "lander" && !landerAligned(game) && game.elapsed >= 0.45;
  return (
    <div
      className="packing-lab-controls"
      data-packing-game={game.id}
      data-packing-seated={game.seated}
      data-packing-angle={game.angle}
    >
      <p className="packing-lab-instruction" role="status">
        {game.phase === "passed"
          ? success[game.id]
          : blocked
            ? "Not lined up! Turn, then lower."
            : game.id === "capsule" && game.seated
              ? "Close the two glowing clamps."
              : instructions[game.id]}
      </p>
      {game.id === "lander" && game.phase !== "passed" ? (
        <>
          <div className="packing-turn-controls">
            <button
              aria-label="Turn lander left"
              disabled={game.held}
              onClick={() => {
                act({ type: "packing-game-turn", direction: -1 });
                sound.playClick(410);
              }}
            >
              <ArrowLeft />
            </button>
            <span className={landerAligned(game) ? "is-aligned" : ""}>
              <span className="packing-alignment-mark" />{" "}
              <span
                className="packing-alignment-mark"
                style={{ transform: `rotate(${game.angle}deg)` }}
              />
            </span>
            <button
              aria-label="Turn lander right"
              disabled={game.held}
              onClick={() => {
                act({ type: "packing-game-turn", direction: 1 });
                sound.playClick(510);
              }}
            >
              <ArrowRight />
            </button>
          </div>
          <button
            className={`packing-lower ${game.held ? "is-held" : ""}`}
            data-packing-lower
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              hold(true);
            }}
            onPointerUp={() => hold(false)}
            onPointerCancel={() => hold(false)}
            onLostPointerCapture={() => hold(false)}
            onKeyDown={(event) => {
              if ([" ", "Enter"].includes(event.key)) {
                event.preventDefault();
                if (!event.repeat) hold(true);
              }
            }}
            onKeyUp={(event) => {
              if ([" ", "Enter"].includes(event.key)) {
                event.preventDefault();
                hold(false);
              }
            }}
            onBlur={() => hold(false)}
          >
            <Package />
            {game.held
              ? blocked
                ? "Release & align"
                : "Lowering…"
              : "Hold to lower"}
          </button>
          <progress
            value={game.elapsed}
            max={LANDER_LOWER_SECONDS}
            aria-label="Lander lowering progress"
          />
        </>
      ) : null}
      {game.phase === "passed" ? (
        <button
          className="packing-replay"
          onClick={() =>
            act({
              type: "packing-game-reset",
              layout: shuffledSupplyLayout(game.supplyLayout),
            })
          }
        >
          <RotateCcw size={17} />
          Play again
        </button>
      ) : null}
      <div
        className="packing-task-dots"
        aria-label={
          game.id === "capsule"
            ? `${game.locks.length} of 2 clamps locked`
            : game.id === "supplies"
              ? `${game.stowed.length} of 3 cases packed`
              : game.seated
                ? "Lander secured"
                : "Lander not yet secured"
        }
      >
        {(game.id === "capsule"
          ? [0, 1]
          : game.id === "supplies"
            ? [0, 1, 2]
            : [0]
        ).map((index) => (
          <span
            key={index}
            className={
              (
                game.id === "capsule"
                  ? game.locks.includes(index)
                  : game.id === "supplies"
                    ? game.stowed.includes(SUPPLY_ITEMS[index])
                    : game.seated
              )
                ? "is-done"
                : ""
            }
          >
            <Check size={14} />
          </span>
        ))}
      </div>
    </div>
  );
}

function SupplyGlyph({ item }: { item: SupplyItem }) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {item === "food" ? (
        <>
          <path d="M-20-18v17m7-17v17m-14-17v17m7 0v22M16-18q-12 14 0 22v17m0-39v22" />
          <path d="M-27-3q7 11 14 0" />
        </>
      ) : item === "water" ? (
        <path d="M0-27C-9-12-22 0-20 11q2 19 20 19t20-19C22 0 9-12 0-27Z" />
      ) : (
        <>
          <rect x="-14" y="-19" width="28" height="47" rx="11" />
          <path d="M-7-19v-8H7v8m-22 30h30M0-27v-6m-8 0H8" />
        </>
      )}
    </g>
  );
}

function CargoCapsule({ metal }: { metal: string }) {
  return (
    <g>
      <path
        d="M-60 34-37-50Q0-74 37-50L60 34Z"
        fill={metal}
        stroke="#d9e4ec"
        strokeWidth="2"
      />
      <path d="m16-37 10 20-24-5Z" fill="#16445f" stroke="#83b7cf" />
      <path
        d="M-59 34q59 21 118 0l-5 14q-54 21-108 0Z"
        fill="#263448"
        stroke="#c0ccd5"
        strokeWidth="2"
      />
      <path d="M-17-64h34l-4-16h-26Z" fill="#263244" />
      <rect
        x="-31"
        y="-4"
        width="25"
        height="28"
        rx="3"
        fill="#bbc9ce"
        stroke="#738697"
      />
      <path d="M-19 4v10" stroke="#51606e" strokeWidth="3" />
      <path d="M-56 29H56" stroke="#f0cf86" strokeWidth="4" />
    </g>
  );
}

function CargoLander({ metal, gold }: { metal: string; gold: string }) {
  return (
    <g>
      <path
        d="m-71 5 22-27H49L71 5 65 55H-65Z"
        fill={gold}
        stroke="#cba66b"
        strokeWidth="2"
      />
      <path
        d="M-39-60 0-82l43 25 8 58h-98Z"
        fill={metal}
        stroke="#a4b9c9"
        strokeWidth="2"
      />
      <path d="m-25-48 25 8-23 15Z" fill="#174361" stroke="#8fc3d9" />
      <path
        d="M-21-12H4v35h-25Z"
        fill="#b5c2c7"
        stroke="#bd9f65"
        strokeWidth="3"
      />
      <path d="M-62 41-97 76m159-35 35 35" stroke="#d1dce2" strokeWidth="6" />
      <ellipse cx="-98" cy="77" rx="21" ry="6" fill="#b4bec5" />
      <ellipse cx="98" cy="77" rx="21" ry="6" fill="#b4bec5" />
      <path d="M45 8h25v26H45Z" fill="#756540" />
      <path d="M-34-59-53-94" stroke="#c4d6df" strokeWidth="3" />
      <ellipse
        cx="-55"
        cy="-98"
        rx="13"
        ry="7"
        fill="#d7e5e7"
        transform="rotate(-25 -55 -98)"
      />
      <path d="M-8 57h16v15H-8Z" fill="#ffdf86" />
    </g>
  );
}

function SvgButton({
  label,
  onPress,
  children,
  disabled = false,
  ...rest
}: {
  label: string;
  onPress(): void;
  children: ReactNode;
  disabled?: boolean;
} & Omit<SVGProps<SVGGElement>, "onClick">) {
  return (
    <g
      {...rest}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onPress();
      }}
      onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled) onPress();
        }
      }}
    >
      {children}
    </g>
  );
}

/** The playfield supports dragging and a keyboard-friendly select-then-socket path. */
export function PackingLabScene({
  game,
  dispatch,
  effects,
  preparation: _preparation,
}: {
  game: PackingGameState;
  dispatch: Dispatch;
  effects: boolean;
  preparation: PreparationSelection;
}) {
  const uid = useId().replace(/:/g, ""),
    svg = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<CargoItem | null>(null);
  const [drag, setDrag] = useState<{
    item: CargoItem;
    x: number;
    y: number;
    dx: number;
    dy: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const frozen = useOrientationLifecycleStore((state) => state.isFrozen);
  const locked = frozen || game.phase === "passed";
  const point = (event: PointerEvent<SVGElement>) => {
    const rect = svg.current!.getBoundingClientRect(),
      scale = Math.min(rect.width / 900, rect.height / 540);
    return {
      x: (event.clientX - rect.left - (rect.width - 900 * scale) / 2) / scale,
      y: (event.clientY - rect.top - (rect.height - 540 * scale) / 2) / scale,
    };
  };
  useEffect(() => {
    const cancel = () => {
      setDrag(null);
      setSelected(null);
    };
    window.addEventListener("game-orientation-pause", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("game-orientation-pause", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, []);
  const act = (event: PackingGameAction) => {
    if (!isEngineFrozen()) {
      sound.setMuted(!effects);
      dispatch(event);
    }
  };
  const place = (item: CargoItem, x: number, y: number) => {
    if (locked || isEngineFrozen()) return;
    act({ type: "packing-game-drop", item, x, y });
    setSelected(null);
    const target = item === "capsule" ? CAPSULE_SOCKET : SUPPLY_SOCKETS[item];
    if (
      item === "capsule"
        ? Math.hypot(x - target.x, y - target.y) <= 62
        : Math.abs(x - target.x) <= 65 && Math.abs(y - target.y) <= 55
    )
      sound.playSnap();
    else sound.playBoing();
  };
  const grab = (event: PointerEvent<SVGGElement>, item: CargoItem) => {
    if (locked || isEngineFrozen() || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event),
      origin = originFor(item);
    setSelected(item);
    setDrag({
      item,
      ...origin,
      dx: p.x - origin.x,
      dy: p.y - origin.y,
      originX: p.x,
      originY: p.y,
      moved: false,
    });
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag || frozen) return;
    const p = point(event);
    setDrag({
      ...drag,
      x: Math.max(70, Math.min(830, p.x - drag.dx)),
      y: Math.max(90, Math.min(440, p.y - drag.dy)),
      moved:
        drag.moved || Math.hypot(p.x - drag.originX, p.y - drag.originY) > 10,
    });
  };
  const release = () => {
    if (drag?.moved) place(drag.item, drag.x, drag.y);
    setDrag(null);
  };
  const metal = `url(#${uid}-metal)`,
    gold = `url(#${uid}-gold)`;
  const progress = game.elapsed / LANDER_LOWER_SECONDS;
  const originFor = (item: CargoItem) =>
    item === "capsule"
      ? starts.capsule
      : {
          x:
            190 +
            (SUPPLY_ORDERS[game.supplyLayout ?? 0] ?? SUPPLY_ITEMS).indexOf(
              item,
            ) *
              250,
          y: 150,
        };
  const position = (item: CargoItem) =>
    drag?.item === item ? drag : originFor(item);
  const source = (item: CargoItem, art: ReactNode) => (
    <g
      key={item}
      style={{
        transform: `translate(${position(item).x}px, ${position(item).y}px)`,
      }}
      className={`packing-cargo-source ${selected === item ? "is-selected" : ""} ${drag?.item === item ? "is-dragging" : ""}`}
      role="button"
      aria-label={`Pick up ${item === "capsule" ? "crew capsule" : `${item} case`}`}
      tabIndex={locked ? -1 : 0}
      onPointerDown={(event) => grab(event, item)}
      onPointerCancel={() => setDrag(null)}
      onLostPointerCapture={() => setDrag(null)}
      onKeyDown={(event) => {
        if (["Enter", " "].includes(event.key) && !locked) {
          event.preventDefault();
          event.stopPropagation();
          setSelected(item);
        }
      }}
    >
      <ellipse
        cy={item === "capsule" ? 60 : 45}
        rx={item === "capsule" ? 77 : 65}
        ry="13"
        fill="#040b1b"
        opacity=".45"
      />
      <circle
        r={item === "capsule" ? 89 : 66}
        fill={selected === item ? "#f6d67e12" : "#fff0"}
        stroke={selected === item ? "#ffe18f" : "#9382bc"}
        strokeWidth="2"
        strokeDasharray="5 8"
      />
      {art}
    </g>
  );
  const crate = (item: SupplyItem) => (
    <g>
      <path
        d="m-49-32 13-12h76l12 12v65l-12 11h-76l-13-11Z"
        fill={metal}
        stroke="#d2e1e7"
        strokeWidth="2"
      />
      <path
        d="m-49-32 13 12h76l12-12M40-20v64"
        fill="none"
        stroke="#53647c"
        strokeWidth="3"
      />
      <rect
        x="-38"
        y="-23"
        width="68"
        height="57"
        rx="7"
        fill={supplyColors[item]}
        stroke="#1e2a40"
        strokeWidth="3"
      />
      <g transform="translate(-4 5) scale(.64)" color="#23334b">
        <SupplyGlyph item={item} />
      </g>
      <path d="M-15-42v-8h26v8" fill="none" stroke="#aabccb" strokeWidth="6" />
    </g>
  );
  return (
    <div
      className={`packing-lab-scene ${frozen ? "is-frozen" : ""} ${game.phase === "passed" ? "is-complete" : ""}`}
      data-packing-scene={game.id}
    >
      <span className="packing-scene-tag">
        {game.id === "supplies" ? "CREW LOCKERS" : "PAYLOAD HANGAR"}
      </span>
      <svg
        ref={svg}
        viewBox="0 0 900 540"
        aria-label={`${PACK_GAME_NAMES[game.id]} packing game`}
        onPointerMove={move}
        onPointerUp={release}
        onPointerCancel={() => setDrag(null)}
      >
        <defs>
          <linearGradient id={`${uid}-wall`} x2="0" y2="1">
            <stop stopColor="#14172d" />
            <stop offset="1" stopColor="#35304d" />
          </linearGradient>
          <linearGradient id={`${uid}-metal`}>
            <stop stopColor="#71869e" />
            <stop offset=".3" stopColor="#e5eff2" />
            <stop offset=".6" stopColor="#fafbf5" />
            <stop offset="1" stopColor="#63788f" />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x2="1" y2="1">
            <stop stopColor="#f7daa0" />
            <stop offset=".55" stopColor="#9e7539" />
            <stop offset="1" stopColor="#d4ba7b" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop stopColor="#8ee6e4" stopOpacity=".2" />
            <stop offset="1" stopColor="#8ee6e4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="900" height="540" fill={`url(#${uid}-wall)`} />
        <path d="M0 400 450 300 900 400v140H0Z" fill="#23273b" />
        {[120, 330, 570, 780].map((x) => (
          <path
            key={x}
            d={`M${x} 0v340m-9-180h18m-18-80h18`}
            stroke="#716580"
            strokeWidth="3"
            opacity=".25"
          />
        ))}
        <path
          d="M90 60h160m400 0h160"
          stroke="#d3c2ed"
          strokeWidth="5"
          opacity=".6"
        />
        <ellipse
          cx="510"
          cy="340"
          rx="300"
          ry="200"
          fill={`url(#${uid}-glow)`}
        />
        {game.id === "capsule" ? (
          <>
            <g transform="translate(510 355)">
              <ellipse cy="89" rx="190" ry="27" fill="#0d1124" />
              <path
                d="M-115-43h230v108q-115 45-230 0Z"
                fill={metal}
                stroke="#8f9caf"
                strokeWidth="2"
              />
              <path
                d="M-111-15h222m-222 45h222"
                stroke="#77869c"
                strokeWidth="6"
              />
              <path
                d="M-77-37v106m51-100v113m51-113v113m52-113v106"
                stroke="#55667d"
                strokeWidth="4"
              />
              <ellipse
                cy="-43"
                rx="115"
                ry="32"
                fill="#24354b"
                stroke="#b8c3cc"
                strokeWidth="7"
              />
              <ellipse
                cy="-48"
                rx="82"
                ry="21"
                fill="#101e31"
                stroke={game.seated ? "#8eefc5" : "#f9d780"}
                strokeWidth="5"
                className={!game.seated ? "packing-target-pulse" : ""}
              />
            </g>
            <SvgButton
              label="Capsule mounting ring"
              onPress={() => {
                if (selected === "capsule")
                  place("capsule", CAPSULE_SOCKET.x, CAPSULE_SOCKET.y);
              }}
              disabled={locked || game.seated}
              data-packing-target="capsule"
              className="packing-socket-hit"
            >
              <ellipse
                cx="510"
                cy="310"
                rx="112"
                ry="45"
                fill="#fff0"
                stroke={selected === "capsule" ? "#ffe18f" : "transparent"}
                strokeWidth="3"
              />
            </SvgButton>
            {game.seated ? (
              <g
                className="packing-seated-capsule"
                transform="translate(510 260)"
              >
                <CargoCapsule metal={metal} />
              </g>
            ) : (
              source("capsule", <CargoCapsule metal={metal} />)
            )}
            {game.seated
              ? [0, 1].map((latch) => (
                  <SvgButton
                    key={latch}
                    label={`${latch === 0 ? "Left" : "Right"} capsule clamp${game.locks.includes(latch) ? ", locked" : ""}`}
                    disabled={locked || game.locks.includes(latch)}
                    onPress={() => {
                      act({ type: "packing-game-lock", latch });
                      sound.playHatchSeal();
                    }}
                    data-packing-clamp={latch}
                    className={`packing-clamp ${game.locks.includes(latch) ? "is-locked" : ""}`}
                    transform={`translate(${latch === 0 ? 405 : 615} 304)`}
                  >
                    <circle
                      r="32"
                      fill={game.locks.includes(latch) ? "#174b40" : "#463a43"}
                      stroke={
                        game.locks.includes(latch) ? "#a2f4ce" : "#ffe18c"
                      }
                      strokeWidth="3"
                    />
                    <path
                      className="packing-clamp-arm"
                      d={
                        latch === 0 ? "M-12 10V-10h48v25" : "M12 10V-10h-48v25"
                      }
                      fill="none"
                      stroke={
                        game.locks.includes(latch) ? "#afffd9" : "#f3cb73"
                      }
                      strokeWidth="9"
                      strokeLinejoin="round"
                    />
                  </SvgButton>
                ))
              : null}
            {!game.seated ? (
              <path
                d="M285 224q90-50 145 20m-22-2 22 2-6-22"
                fill="none"
                stroke="#f4cf83"
                strokeWidth="3"
                strokeDasharray="8 9"
                opacity=".65"
              />
            ) : null}
          </>
        ) : null}
        {game.id === "lander" ? (
          <>
            <path
              d="M160 65h580m-510 0v435m440-435v435"
              stroke="#69788a"
              strokeWidth="12"
            />
            <path d="M160 65h580" stroke="#c8d6de" strokeWidth="4" />
            <g transform="translate(510 397)">
              <ellipse cy="51" rx="175" ry="26" fill="#0d1124" />
              <path
                d="m-160-21 160-50 160 50V18L0 68-160 18Z"
                fill="#38465b"
                stroke="#8c9cae"
                strokeWidth="3"
              />
              <path
                d="M-160-21 0 29 160-21M0 29v39"
                fill="none"
                stroke="#94a7b7"
                strokeWidth="3"
              />
              <ellipse
                cy="-7"
                rx="126"
                ry="34"
                fill="none"
                stroke={landerAligned(game) ? "#92ebc1" : "#e8bf72"}
                strokeWidth="3"
                strokeDasharray="8 9"
              />
              {[-1, 1].map((side) => (
                <g key={side} transform={`translate(${side * 100} 0)`}>
                  <path
                    d="m-18-8 18-10 18 10v20l-18 10-18-10Z"
                    fill={game.seated ? "#83dcb5" : "#d5b571"}
                    stroke="#ffe6a2"
                    strokeWidth="2"
                  />
                  <circle r="5" fill="#314650" />
                </g>
              ))}
            </g>
            <path
              d={`M510 70v${10 + progress * 122}`}
              stroke="#b4a2d1"
              strokeWidth="4"
            />
            <g
              className="packing-crane-cargo"
              style={{
                transform: `translate(510px,${190 + progress * 122}px) rotate(${game.angle}deg)`,
              }}
            >
              <path
                d="M0-110-60-35M0-110 60-35"
                stroke="#acbbce"
                strokeWidth="3"
              />
              <CargoLander metal={metal} gold={gold} />
            </g>
            <path
              d="M510 418v-44m-11 11 11-11 11 11"
              stroke="#ffe189"
              strokeWidth="5"
            />
            {!landerAligned(game) && game.elapsed >= 0.45 ? (
              <g transform="translate(700 230)">
                <circle
                  r="27"
                  fill="#6a3348"
                  stroke="#ffbba1"
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  y="12"
                  fill="#ffe5d2"
                  fontSize="36"
                  fontWeight="900"
                >
                  !
                </text>
              </g>
            ) : null}
            {game.seated ? (
              <path
                className="packing-lock-sweep"
                d="M368 390q142 89 284 0"
                fill="none"
                stroke="#9df5c6"
                strokeWidth="7"
              />
            ) : null}
          </>
        ) : null}
        {game.id === "supplies" ? (
          <>
            <path
              d="M215 239 796 239 828 427 185 427Z"
              fill="#132335"
              stroke="#8d9daf"
              strokeWidth="4"
            />
            {SUPPLY_ITEMS.map((item) => {
              const socket = SUPPLY_SOCKETS[item],
                stowed = game.stowed.includes(item);
              return (
                <g key={item}>
                  <SvgButton
                    label={`${item} locker${stowed ? ", packed" : ""}`}
                    onPress={() => {
                      if (selected && selected !== "capsule")
                        place(selected, socket.x, socket.y);
                    }}
                    disabled={locked || stowed}
                    data-packing-target={item}
                    className={`packing-locker ${stowed ? "is-stowed" : ""}`}
                    transform={`translate(${socket.x} ${socket.y})`}
                  >
                    <rect
                      x="-83"
                      y="-65"
                      width="166"
                      height="130"
                      rx="12"
                      fill="#101c2c"
                      stroke={stowed ? "#9bf0c4" : supplyColors[item]}
                      strokeWidth="4"
                    />
                    <path
                      d="M-76-54h152v109h-152Z"
                      fill="#28394b"
                      stroke="#57718c"
                      strokeWidth="2"
                    />
                    <g color={supplyColors[item]} opacity={stowed ? 0.15 : 0.8}>
                      <SupplyGlyph item={item} />
                    </g>
                    {stowed ? (
                      <>
                        <g transform="scale(.82)">{crate(item)}</g>
                        <path
                          d="M-82-28h164m-164 55h164"
                          stroke="#9bd8c6"
                          strokeWidth="8"
                        />
                        <rect
                          x="-17"
                          y="-15"
                          width="34"
                          height="31"
                          rx="6"
                          fill="#29584f"
                          stroke="#b9f0d4"
                          strokeWidth="2"
                        />
                        <path
                          d="m-8 0 6 6 11-13"
                          stroke="#bdffe4"
                          strokeWidth="3"
                          fill="none"
                        />
                      </>
                    ) : null}
                  </SvgButton>
                  <text
                    x={socket.x}
                    y="425"
                    textAnchor="middle"
                    fill={supplyColors[item]}
                    fontSize="14"
                    fontWeight="800"
                    letterSpacing="1"
                  >
                    {item.toUpperCase()}
                  </text>
                </g>
              );
            })}
            {SUPPLY_ITEMS.filter((item) => !game.stowed.includes(item)).map(
              (item) => source(item, crate(item)),
            )}
          </>
        ) : null}
        {game.phase === "passed" ? (
          <g className="packing-complete-check" transform="translate(780 80)">
            <circle r="28" fill="#1a5143" stroke="#b1f9d6" strokeWidth="2" />
            <path
              d="m-13 0 9 9 18-20"
              stroke="#c5ffe1"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : null}
      </svg>
      {game.misses > 0 && game.phase !== "passed" ? (
        <span className="packing-miss" key={game.misses} role="status">
          {game.id === "supplies"
            ? "Match the symbol!"
            : "Aim for the glowing ring!"}
        </span>
      ) : null}
      {game.phase === "passed" ? (
        <div className="packing-scene-success" role="status">
          <LockKeyhole size={23} />
          {success[game.id]}
        </div>
      ) : null}
    </div>
  );
}
