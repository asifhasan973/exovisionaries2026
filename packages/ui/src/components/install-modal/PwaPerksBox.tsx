import React from 'react';
import { Zap, ShieldCheck, Rocket } from 'lucide-react';

export const PwaPerksBox: React.FC = () => {
  return (
    <div className="pwa-perks-box">
      <div className="pwa-perk-card">
        <div className="pwa-perk-title">
          <Zap size={13} className="text-amber-400" />
          <span>Zero UI Clutter</span>
        </div>
        <div className="pwa-perk-desc">
          Full-bleed horizontal game viewport with zero browser navigation bars.
        </div>
      </div>

      <div className="pwa-perk-card">
        <div className="pwa-perk-title">
          <ShieldCheck size={13} className="text-cyan-400" />
          <span>Visuals Cached</span>
        </div>
        <div className="pwa-perk-desc">
          3D geometries, character art, and space textures stored offline.
        </div>
      </div>

      <div className="pwa-perk-card">
        <div className="pwa-perk-title">
          <Rocket size={13} className="text-purple-400" />
          <span>Instant Launch</span>
        </div>
        <div className="pwa-perk-desc">
          Immediate access directly from your desktop or phone home screen.
        </div>
      </div>
    </div>
  );
};

