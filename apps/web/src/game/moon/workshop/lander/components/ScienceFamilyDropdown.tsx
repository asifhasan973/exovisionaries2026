import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  GEOLOGY_FAMILIES,
  SCIENCE_FAMILY_NAMES,
} from "@/game/moon/science/geology";
import type { ScienceFamily } from "@/game/moon/science/geology";
import type { WorkshopPart } from "@/game/moon/core/preparation";

export interface ScienceFamilyDropdownProps {
  depthOpen: boolean;
  scienceFamily: ScienceFamily;
  parts: WorkshopPart[];
  ids: string[];
  drill: boolean;
  onSelectFamily(family: ScienceFamily): void;
  onSelectDepth(): void;
}

export function ScienceFamilyDropdown({
  depthOpen,
  scienceFamily,
  parts,
  ids,
  drill,
  onSelectFamily,
  onSelectDepth,
}: ScienceFamilyDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeLabel = depthOpen
    ? "Drill plan"
    : SCIENCE_FAMILY_NAMES[scienceFamily];
  const activeCompleted = depthOpen
    ? false
    : parts.some(
        (p) => ids.includes(p.id) && p.scienceFamily === scienceFamily,
      );

  return (
    <div className="geology-compact-family" ref={containerRef}>
      <button
        type="button"
        className={`geology-dropdown-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Science family: ${activeLabel}`}
      >
        <span className="geology-dropdown-current">
          {activeLabel}
          {activeCompleted && (
            <Check size={12} className="geology-dropdown-check" />
          )}
        </span>
        <ChevronDown size={14} className="geology-dropdown-chevron" />
      </button>

      {open && (
        <div
          className="geology-dropdown-menu"
          role="listbox"
          aria-label="Science tool families"
        >
          {GEOLOGY_FAMILIES.map((family) => {
            const isSelected = !depthOpen && scienceFamily === family;
            const isCompleted = parts.some(
              (p) => ids.includes(p.id) && p.scienceFamily === family,
            );
            return (
              <button
                key={family}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`geology-dropdown-item ${isSelected ? "is-selected" : ""}`}
                onClick={() => {
                  onSelectFamily(family);
                  setOpen(false);
                }}
              >
                <span>{SCIENCE_FAMILY_NAMES[family]}</span>
                {isCompleted && (
                  <Check size={13} className="geology-dropdown-check" />
                )}
              </button>
            );
          })}
          {drill && (
            <button
              type="button"
              role="option"
              aria-selected={depthOpen}
              className={`geology-dropdown-item ${depthOpen ? "is-selected" : ""}`}
              onClick={() => {
                onSelectDepth();
                setOpen(false);
              }}
            >
              <span>Drill plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
