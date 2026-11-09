import React, { useState, useEffect } from "react";
import { TimelineSlider } from "./TimelineSlider";
import { MissionEventTree } from "./MissionEventTree";
import { sound } from "@exo/audio";
import "./nasaArchive.css";

export const NasaMissionArchive: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Activate archive sound containment on mount; stop and deactivate on unmount
  useEffect(() => {
    sound.setArchiveActive(true);
    return () => {
      sound.setArchiveActive(false);
      sound.stopAll();
    };
  }, []);

  // Listen to orientation freeze events
  useEffect(() => {
    const handleFreeze = () => {
      // Audio is already suspended by orientationLifecycleStore
    };
    const handleResume = () => {
      // Continuation
    };

    window.addEventListener("game-orientation-pause", handleFreeze);
    window.addEventListener("game-orientation-resume", handleResume);

    return () => {
      window.removeEventListener("game-orientation-pause", handleFreeze);
      window.removeEventListener("game-orientation-resume", handleResume);
    };
  }, []);

  const handleSelectYear = (year: number, eventId?: string) => {
    setSelectedYear(year);
    setSelectedEventId(eventId || null);
  };

  const handleCloseDetail = () => {
    setSelectedYear(null);
    setSelectedEventId(null);
  };

  return (
    <div className="nasa-archive-container">
      {onBack && <button onClick={onBack}>Back</button>}
      {/* Deep Space Ambient Glow & Starfield */}
      <div className="nasa-archive-ambient-glow" aria-hidden="true">
        <div className="glow-sphere sphere-cyan" />
        <div className="glow-sphere sphere-purple" />
        <div className="archive-starfield-grid" />
      </div>

      {/* Main Viewport Stage */}
      <main className="nasa-archive-stage">
        {/* Layer 1: Scrollable Year Timeline */}
        <TimelineSlider
          onSelectYear={handleSelectYear}
          selectedYear={selectedYear}
          isVisible={!selectedYear}
        />

        {/* Layer 2: Vertical Event Tree Structure */}
        <MissionEventTree
          year={selectedYear}
          selectedEventId={selectedEventId}
          onClose={handleCloseDetail}
          isVisible={!!selectedYear}
        />
      </main>
    </div>
  );
};
