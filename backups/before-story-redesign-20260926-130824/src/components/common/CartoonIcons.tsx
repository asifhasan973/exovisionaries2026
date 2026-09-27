// Mission Forge - Playful Cartoon SVG Icons & Astro-Bot Mascot
import React from 'react';

export const PartIcon: React.FC<{ partId: string; size?: number; className?: string }> = ({
  partId,
  size = 48,
  className = ''
}) => {
  switch (partId) {
    case 'stage-1-booster':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#3b82f6" fillOpacity="0.25" />
          <path d="M 26 12 L 38 12 L 40 44 L 24 44 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
          <rect x="25" y="24" width="14" height="6" fill="#0f172a" />
          {/* Fins */}
          <path d="M 24 36 L 16 46 L 24 46 Z" fill="#ef4444" />
          <path d="M 40 36 L 48 46 L 40 46 Z" fill="#ef4444" />
          {/* Fire plume */}
          <path d="M 27 46 Q 32 58 37 46 Q 32 52 27 46 Z" fill="#f59e0b" />
          <path d="M 29 46 Q 32 54 35 46 Z" fill="#fef08a" />
        </svg>
      );
    case 'stage-2-cryo':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#06b6d4" fillOpacity="0.25" />
          <ellipse cx="32" cy="18" rx="12" ry="6" fill="#e2e8f0" stroke="#0284c7" strokeWidth="2" />
          <rect x="20" y="18" width="24" height="24" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          <circle cx="32" cy="30" r="5" fill="#06b6d4" />
          {/* Engines */}
          <path d="M 24 42 L 21 50 L 27 50 Z" fill="#64748b" />
          <path d="M 32 42 L 29 50 L 35 50 Z" fill="#64748b" />
          <path d="M 40 42 L 37 50 L 43 50 Z" fill="#64748b" />
        </svg>
      );
    case 'stage-3-departure':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#8b5cf6" fillOpacity="0.25" />
          <rect x="22" y="18" width="20" height="20" rx="4" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
          <circle cx="32" cy="28" r="4" fill="#a78bfa" />
          <path d="M 27 38 L 24 48 L 40 48 L 37 38 Z" fill="#334155" />
          <path d="M 27 48 Q 32 58 37 48 Z" fill="#38bdf8" />
        </svg>
      );
    case 'crew-capsule-command':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#f43f5e" fillOpacity="0.25" />
          <path d="M 32 14 L 46 42 L 18 42 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="2.5" />
          {/* Windows */}
          <circle cx="32" cy="28" r="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="2" fill="#ffffff" opacity="0.6" />
          <rect x="16" y="42" width="32" height="4" rx="2" fill="#334155" />
        </svg>
      );
    case 'service-module-core':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#10b981" fillOpacity="0.25" />
          <rect x="22" y="16" width="20" height="26" fill="#cbd5e1" stroke="#059669" strokeWidth="2" />
          <rect x="24" y="20" width="16" height="8" fill="#ffffff" />
          <rect x="24" y="30" width="16" height="8" fill="#ffffff" />
          <path d="M 28 42 L 25 50 L 39 50 L 36 42 Z" fill="#334155" />
        </svg>
      );
    case 'launch-escape-tower':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#f59e0b" fillOpacity="0.25" />
          <path d="M 32 10 L 35 22 L 29 22 Z" fill="#ef4444" />
          <line x1="30" y1="22" x2="28" y2="44" stroke="#ffffff" strokeWidth="2" />
          <line x1="34" y1="22" x2="36" y2="44" stroke="#ffffff" strokeWidth="2" />
          <line x1="29" y1="30" x2="35" y2="30" stroke="#f59e0b" strokeWidth="2" />
          <line x1="28" y1="38" x2="36" y2="38" stroke="#f59e0b" strokeWidth="2" />
          <path d="M 25 44 L 39 44 L 43 52 L 21 52 Z" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
        </svg>
      );
    case 'neutron-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#00f0ff" fillOpacity="0.25" />
          {/* Gold cylinder */}
          <rect x="24" y="16" width="16" height="28" rx="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
          {/* Ice / Hydrogen atom rings */}
          <circle cx="32" cy="30" r="10" stroke="#00f0ff" strokeWidth="2" fill="none" strokeDasharray="3 3" />
          <circle cx="32" cy="30" r="3" fill="#ffffff" />
          <circle cx="22" cy="30" r="2" fill="#00f0ff" />
          <circle cx="42" cy="30" r="2" fill="#00f0ff" />
        </svg>
      );
    case 'nir-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#a855f7" fillOpacity="0.25" />
          <rect x="20" y="20" width="24" height="20" rx="5" fill="#334155" stroke="#9333ea" strokeWidth="2" />
          <circle cx="32" cy="30" r="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          {/* Rainbow reflection ray */}
          <line x1="39" y1="23" x2="48" y2="16" stroke="#f43f5e" strokeWidth="2" />
          <line x1="41" y1="26" x2="50" y2="19" stroke="#f59e0b" strokeWidth="2" />
          <line x1="43" y1="29" x2="52" y2="22" stroke="#10b981" strokeWidth="2" />
        </svg>
      );
    case 'subsurface-drill':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#f97316" fillOpacity="0.25" />
          <rect x="25" y="12" width="14" height="12" rx="3" fill="#ea580c" />
          {/* Spiral drill bit */}
          <path d="M 28 24 L 36 28 L 28 34 L 36 40 L 28 46 L 32 52 L 32 24 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
          <polygon points="32,54 28,48 36,48" fill="#f59e0b" />
        </svg>
      );
    case 'mass-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#ec4899" fillOpacity="0.25" />
          <rect x="18" y="22" width="28" height="20" rx="4" fill="#334155" stroke="#db2777" strokeWidth="2" />
          {/* Flask / gas tube */}
          <path d="M 28 14 L 36 14 L 36 22 L 28 22 Z" fill="#64748b" />
          {/* Chemical bubbles */}
          <circle cx="26" cy="32" r="3" fill="#ec4899" />
          <circle cx="34" cy="28" r="4" fill="#f43f5e" />
          <circle cx="38" cy="35" r="2.5" fill="#f59e0b" />
        </svg>
      );
    case 'nav-context-camera':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#14b8a6" fillOpacity="0.25" />
          <rect x="16" y="24" width="32" height="18" rx="5" fill="#1e293b" stroke="#0d9488" strokeWidth="2" />
          <circle cx="26" cy="33" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="38" cy="33" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="28" y="18" width="8" height="6" rx="2" fill="#f59e0b" />
        </svg>
      );
    case 'radiation-monitor':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#eab308" fillOpacity="0.25" />
          <rect x="20" y="20" width="24" height="24" rx="6" fill="#1e293b" stroke="#ca8a04" strokeWidth="2" />
          {/* Radiation Trefoil Badge */}
          <circle cx="32" cy="32" r="3" fill="#facc15" />
          <path d="M 32 25 L 35 20 L 29 20 Z" fill="#facc15" />
          <path d="M 26 36 L 21 38 L 24 43 Z" fill="#facc15" />
          <path d="M 38 36 L 43 38 L 40 43 Z" fill="#facc15" />
        </svg>
      );
    case 'aux-battery-pack':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#22c55e" fillOpacity="0.25" />
          <rect x="20" y="20" width="24" height="26" rx="5" fill="#1e293b" stroke="#16a34a" strokeWidth="2" />
          <rect x="28" y="14" width="8" height="6" rx="2" fill="#22c55e" />
          {/* Lightning bolt */}
          <path d="M 34 24 L 27 33 L 33 33 L 30 42 L 39 31 L 33 31 Z" fill="#facc15" />
        </svg>
      );
    case 'precision-star-tracker':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#3b82f6" fillOpacity="0.25" />
          <rect x="22" y="24" width="20" height="20" rx="4" fill="#1e293b" stroke="#2563eb" strokeWidth="2" />
          <path d="M 32 14 L 34 20 L 40 22 L 35 26 L 36 32 L 32 28 L 28 32 L 29 26 L 24 22 L 30 20 Z" fill="#fbbf24" />
        </svg>
      );
    case 'redundant-transceiver':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#6366f1" fillOpacity="0.25" />
          <path d="M 32 16 L 32 40" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M 22 24 Q 32 14 42 24" stroke="#818cf8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 16 18 Q 32 4 48 18" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="24" y="40" width="16" height="12" rx="3" fill="#312e81" stroke="#6366f1" strokeWidth="2" />
        </svg>
      );
    case 'modular-spare-kit':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#ea580c" fillOpacity="0.25" />
          <rect x="18" y="24" width="28" height="22" rx="4" fill="#c2410c" stroke="#f97316" strokeWidth="2" />
          <path d="M 26 24 L 26 20 Q 26 16 32 16 Q 38 16 38 20 L 38 24" stroke="#fed7aa" strokeWidth="2.5" fill="none" />
          <rect x="28" y="32" width="8" height="4" rx="1" fill="#fef08a" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
          <rect width="64" height="64" rx="16" fill="#3b82f6" fillOpacity="0.25" />
          <circle cx="32" cy="32" r="14" fill="#0284c7" />
          <text x="32" y="38" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="bold">⚙️</text>
        </svg>
      );
  }
};

// Astro-Bot Mascot Guide
export const AstroBot: React.FC<{ expression?: 'happy' | 'ready' | 'thinking' | 'cheer'; size?: number }> = ({
  expression = 'happy',
  size = 56
}) => {
  return (
    <div className="relative inline-flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,240,255,0.4)]">
      <svg width={size} height={size} viewBox="0 0 64 64">
        {/* Antenna */}
        <line x1="32" y1="14" x2="32" y2="6" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="5" r="4" fill="#ffb800" />
        <circle cx="32" cy="5" r="2" fill="#ffffff" />

        {/* Head Pod */}
        <rect x="14" y="14" width="36" height="30" rx="12" fill="#ffffff" stroke="#00f0ff" strokeWidth="3" />

        {/* Visor Screen */}
        <rect x="18" y="19" width="28" height="18" rx="7" fill="#0f172a" />

        {/* Eyes based on expression */}
        {expression === 'happy' && (
          <>
            <path d="M 23 27 Q 26 23 29 27" stroke="#00ff9d" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 35 27 Q 38 23 41 27" stroke="#00ff9d" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
        {expression === 'ready' && (
          <>
            <circle cx="26" cy="27" r="3" fill="#00f0ff" />
            <circle cx="38" cy="27" r="3" fill="#00f0ff" />
            <circle cx="27" cy="26" r="1" fill="#ffffff" />
            <circle cx="39" cy="26" r="1" fill="#ffffff" />
          </>
        )}
        {expression === 'thinking' && (
          <>
            <circle cx="26" cy="27" r="3" fill="#ffb800" />
            <line x1="35" y1="27" x2="41" y2="27" stroke="#ffb800" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {expression === 'cheer' && (
          <>
            <text x="26" y="32" fill="#ff2a85" fontSize="12" fontWeight="bold">★</text>
            <text x="38" y="32" fill="#ff2a85" fontSize="12" fontWeight="bold">★</text>
          </>
        )}

        {/* Little Bot Body */}
        <path d="M 22 44 L 42 44 L 38 56 L 26 56 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
        <circle cx="32" cy="50" r="3" fill="#ffb800" />
      </svg>
    </div>
  );
};
