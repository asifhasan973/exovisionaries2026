import React, { useState, useEffect } from "react";
import { ArrowLeft, Volume2, VolumeX, Radio } from "lucide-react";
import { TimelineSlider } from "./TimelineSlider";
import { MissionEventTree } from "./MissionEventTree";
import { sound, useAudioStore } from "@exo/audio";
import "./nasaArchive.css";

interface NasaMissionArchiveProps {
  onBack?: () => void;
}

export const NasaMissionArchive: React.FC<NasaMissionArchiveProps> = ({
  onBack,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isMuted = useAudioStore((s) => s.isMuted);
  const effectsEnabled = useAudioStore((s) => s.effectsEnabled);
  const setEffectsEnabled = useAudioStore((s) => s.setEffectsEnabled);
  const sfxActive = !isMuted && effectsEnabled;

  const toggleSfx = () => {
    setEffectsEnabled(!sfxActive);
  };

  // Activate archive sound containment on mount; stop and deactivate on unmount
  useEffect(() => {
    sound.setArchiveActive(true);
    return () => {
      sound.setArchiveActive(false);
      sound.stopAll();
    };
  }, []);

  const handleSelectYear = (year: number, eventId?: string) => {
    setSelectedYear(year);
    setSelectedEventId(eventId || null);
  };

  const handleCloseTree = () => {
    setSelectedYear(null);
    setSelectedEventId(null);
  };

  return (
    <div className="nasa-archive-container">
      {/* Deep Space Ambient Glow & Starfield */}
      <div className="nasa-archive-ambient-glow" aria-hidden="true">
        <div className="glow-sphere sphere-cyan" />
        <div className="glow-sphere sphere-purple" />
        <div className="archive-starfield-grid" />
      </div>

      {/* Top Aerospace Navbar (shown when onBack is passed as modal or in-game navigation) */}
      {onBack && (
        <header className="nasa-archive-navbar">
          <div className="navbar-left">
            <button
              type="button"
              className="navbar-exit-btn group"
              onClick={() => {
                sound.playClick(600);
                sound.setArchiveActive(false);
                sound.stopAll();
                onBack();
              }}
              title="Return to mission"
            >
              <ArrowLeft
                size={17}
                className="transform group-hover:-translate-x-1 transition-transform"
              />
              <span>Back</span>
            </button>
          </div>

          <div className="navbar-center">
            <div className="archive-brand-badge font-mono">
              <Radio size={13} className="text-purple-300 animate-pulse" />
              <span>NASA MISSION ARCHIVE</span>
              <span className="badge-divider">•</span>
              <span className="badge-span">1958 — 2030+</span>
            </div>
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className="navbar-sound-toggle"
              onClick={toggleSfx}
              title={sfxActive ? "Mute sound effects" : "Enable sound effects"}
              aria-label={
                sfxActive ? "Mute sound effects" : "Enable sound effects"
              }
            >
              {sfxActive ? (
                <Volume2 size={18} className="text-purple-300" />
              ) : (
                <VolumeX size={18} />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Viewport Stage */}
      <main className="nasa-archive-stage">
        {/* Layer 1: Horizontal Sliding Year Timeline */}
        <TimelineSlider
          onSelectYear={handleSelectYear}
          selectedYear={selectedYear}
          isVisible={selectedYear === null}
        />

        {/* Layer 2: On-Demand Historical Event Tree for Selected Year */}
        <MissionEventTree
          year={selectedYear}
          selectedEventId={selectedEventId}
          onClose={handleCloseTree}
          isVisible={selectedYear !== null}
        />
      </main>
    </div>
  );
};
