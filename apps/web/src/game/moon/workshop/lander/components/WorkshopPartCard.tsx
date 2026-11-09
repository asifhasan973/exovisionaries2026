import React from "react";
import { Info, PackageCheck, Trash2 } from "lucide-react";
import type { WorkshopPart } from "@/game/moon/core/preparation";
import { installPart } from "@/game/moon/core/preparation";
import {
  geologyBudget,
  geologyUpgradeForPart,
} from "@/game/moon/science/geologyBudget";
import {
  comparePart,
  optionBenefit,
  signed,
} from "@/game/moon/core/partComparison";
import type { EngineerReaction } from "@/game/moon/narrative/components/EngineerCompanion";
import type { MissionEvent, WorkshopSession } from "../workshopSession";

export interface WorkshopPartCardProps {
  part: WorkshopPart;
  ids: string[];
  session: WorkshopSession;
  lastInstalled: string | null;
  repair?: any;
  appliedRepair: boolean;
  multi: boolean;
  geology: boolean;
  missionBudget: any;
  thumbnails: Record<string, string>;
  meshError: boolean;
  onPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
  dragRef: React.MutableRefObject<any>;
  suppressClickRef: React.MutableRefObject<boolean>;
  install: (ids: string[]) => void;
  dispatch: (event: MissionEvent) => void;
  setMessage: (msg: string) => void;
  setReaction: (r: EngineerReaction) => void;
  setInfoId: (id: string | null) => void;
}

export function WorkshopPartCard({
  part,
  ids,
  session,
  lastInstalled,
  repair,
  appliedRepair,
  multi,
  geology,
  missionBudget,
  thumbnails,
  meshError,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  dragRef: _dragRef,
  suppressClickRef,
  install,
  dispatch,
  setMessage,
  setReaction,
  setInfoId,
}: WorkshopPartCardProps) {
  const installed = ids.includes(part.id);
  const comparison = comparePart(
    session.preparation,
    part.id,
    session.progress.selections.site === "permanent-shadow",
  );

  return (
    <article
      className={`workshop-part ${installed ? "is-installed" : ""} ${installed && lastInstalled === part.id ? "was-installed" : ""} ${repair?.partId === part.id && !appliedRepair ? `is-repair-target ${repair.action === "remove" ? "is-remove-target" : ""}` : ""}`}
      data-part-id={part.id}
    >
      <span className="part-badge">
        {repair?.partId === part.id && !appliedRepair
          ? repair.action === "remove"
            ? "Remove this"
            : "Pick this"
          : part.mandatory
            ? "Required"
            : multi
              ? "Optional"
              : "Choose one"}
      </span>
      <div className="workshop-part-top">
        {installed ? (
          <button
            type="button"
            className="workshop-part-remove-icon"
            aria-label={`Remove ${part.name}`}
            title={`Remove ${part.name}`}
            onClick={(event) => {
              event.stopPropagation();
              dispatch({ type: "remove", id: part.id });
              setMessage(`${part.name} returned to shelf`);
              setReaction("intro");
            }}
          >
            <Trash2 size={13} />
          </button>
        ) : null}
        <button
          type="button"
          className="workshop-info"
          aria-label={`Details for ${part.name}`}
          title={`Details for ${part.name}`}
          onClick={(event) => {
            event.stopPropagation();
            setInfoId(part.id);
          }}
        >
          <Info size={14} />
        </button>
      </div>
      <button
        type="button"
        className="workshop-pick"
        disabled={installed}
        aria-label={
          installed ? `${part.name} (installed)` : `Install ${part.name}`
        }
        onPointerDown={(event) => onPointerDown(event, part.id)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={(event) => {
          event.preventDefault();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (!installed) {
            install([part.id]);
          }
        }}
      >
        {thumbnails[part.id] ? (
          <img draggable={false} src={thumbnails[part.id]} alt="" />
        ) : (
          <div className="workshop-part-placeholder">
            <PackageCheck size={38} />
          </div>
        )}
        <div className="workshop-part-details">
          <strong>
            {part.id === "nss"
              ? "NSS · Ice clues"
              : part.id === "nirvss"
                ? "NIRVSS · Soil scan"
                : part.id === "trident"
                  ? "TRIDENT · Drill"
                  : part.name}
          </strong>
          <span className="workshop-part-price">
            {geology
              ? part.category === "science"
                ? `${part.credits} MC`
                : part.category === "lander"
                  ? "Landing system"
                  : `+${geologyUpgradeForPart(part.id)} MC upgrade`
              : `${part.credits} cr`}{" "}
            · {part.massKg} kg
            {part.objective === "lunar-geology"
              ? ` · ${part.nominalPowerW} W`
              : ""}
          </span>
          {part.category === "rover" ? (
            <span className="workshop-part-spec">
              {part.nominalPowerW} W · {"★".repeat(part.terrainStars ?? 0)}
            </span>
          ) : null}
          {part.outputW ? (
            <span className="workshop-part-spec">
              {part.outputW} W sunlight
            </span>
          ) : null}
          {part.capacityWh ? (
            <span className="workshop-part-spec">{part.capacityWh} Wh</span>
          ) : null}
          {part.capability ? (
            <span className="workshop-part-spec">{part.capability}</span>
          ) : null}
        </div>
        <span className="workshop-part-action">
          {installed
            ? "✓ Installed"
            : meshError
              ? "Install"
              : !multi
                ? "Click to choose"
                : "Drag to install"}
        </span>
      </button>
      {!installed && !multi && (!geology || !!comparison.replaces) ? (
        <div className="part-comparison">
          {comparison.replaces ? (
            <>
              <span title={comparison.replaces}>
                Swap {geology ? "installed tier" : comparison.replaces}
              </span>
              <strong>
                {geology
                  ? signed(
                      geologyBudget(
                        installPart(session.preparation, part.id),
                        session.moon.crew,
                        session.moon.plan,
                      ).spent - missionBudget!.spent,
                    )
                  : signed(comparison.credits)}{" "}
                {geology ? "MC" : "cr"} · {signed(comparison.massKg)} kg
              </strong>
            </>
          ) : null}
          {!geology ? (
            <span>
              {part.category === "rover" && comparison.replaces
                ? `${signed(comparison.peakW)} W peak · `
                : ""}
              {optionBenefit(part.id, comparison.shadowMinutes)}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
