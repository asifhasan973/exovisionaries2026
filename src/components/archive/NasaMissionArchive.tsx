import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { TimelineSlider } from './TimelineSlider';
import { MissionEventTree } from './MissionEventTree';
import { sound } from '../../audio/soundEngine';
import './nasaArchive.css';

interface NasaMissionArchiveProps {
  onBack: () => void;
}

export const NasaMissionArchive: React.FC<NasaMissionArchiveProps> = ({ onBack }) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Unmute audio for archive experience on mount
  useEffect(() => {
    sound.setMuted(false);
  }, []);

  // Listen to orientation freeze events
  useEffect(() => {
    const handleFreeze = () => {
      // Audio is already suspended by orientationLifecycleStore
    };
    const handleResume = () => {
      // Continuation
    };

    window.addEventListener('game-orientation-pause', handleFreeze);
    window.addEventListener('game-orientation-resume', handleResume);

    return () => {
      window.removeEventListener('game-orientation-pause', handleFreeze);
      window.removeEventListener('game-orientation-resume', handleResume);
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

  const toggleSound = () => {
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  return (
    <div className="nasa-archive-container">
      {/* Deep Space Ambient Glow & Starfield */}
      <div className="nasa-archive-ambient-glow" aria-hidden="true">
        <div className="glow-sphere sphere-cyan" />
        <div className="glow-sphere sphere-purple" />
        <div className="archive-starfield-grid" />
      </div>

      {/* Top Aerospace Navbar */}
      <header className="nasa-archive-navbar">
        {/* Back to Starting Page Navigation Button */}
        <div className="navbar-left">
          <button
            type="button"
            className="navbar-exit-btn group"
            onClick={() => {
              sound.playClick(600);
              onBack();
            }}
            title="Return to starting page"
          >
            <ArrowLeft size={17} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
        </div>

        {/* Center Title Badge */}
        <div className="navbar-center">
          <div className="archive-brand-badge font-mono">
            <Radio size={13} className="text-cyan-400 animate-pulse" />
            <span>NASA MISSION ARCHIVE</span>
            <span className="badge-divider">•</span>
            <span className="badge-span text-amber-300">1958 — 2030+</span>
          </div>
        </div>

        {/* Right Tools: Sound */}
        <div className="navbar-right">
          {/* Sound Mute Toggle */}
          <button
            type="button"
            className="navbar-sound-toggle"
            onClick={toggleSound}
            title={isMuted ? 'Unmute archive sounds' : 'Mute archive sounds'}
            aria-label={isMuted ? 'Unmute archive audio' : 'Mute archive audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Main Viewport Stage */}
      <main className="nasa-archive-stage">
        {/* Layer 1: Horizontal Sliding Year Timeline */}
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
