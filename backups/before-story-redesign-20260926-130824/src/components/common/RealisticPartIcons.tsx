// Mission Forge - Photorealistic & Authentic Aerospace Part Icons
import React from 'react';

interface IconProps {
  partId: string;
  size?: number;
  className?: string;
}

export const RealisticPartIcon: React.FC<IconProps> = ({ partId, size = 64, className = '' }) => {
  switch (partId) {
    case 'stage-1-booster':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="metal-tank-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d1d5db" />
              <stop offset="25%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
            <linearGradient id="dark-band-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="nozzle-copper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Main S-IC Booster Tank */}
          <rect x="30" y="10" width="40" height="60" rx="3" fill="url(#metal-tank-grad)" stroke="#475569" strokeWidth="1.5" />
          {/* Apollo Black & White Roll Pattern Bands */}
          <rect x="30" y="24" width="20" height="18" fill="url(#dark-band-grad)" />
          <rect x="50" y="42" width="20" height="16" fill="url(#dark-band-grad)" />
          {/* LOX Feedline Fairing */}
          <rect x="65" y="14" width="3" height="52" fill="#94a3b8" />
          {/* Base Aero Fins */}
          <path d="M 30 55 L 14 74 L 30 74 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 70 55 L 86 74 L 70 74 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          {/* F-1 Engine Nozzle Bells */}
          <path d="M 34 70 L 26 88 L 44 88 L 38 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 45 70 L 41 88 L 59 88 L 55 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 62 70 L 56 88 L 74 88 L 66 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
          {/* USA Text marking */}
          <text x="50" y="20" fill="#dc2626" fontSize="5" fontWeight="900" textAnchor="middle" letterSpacing="1">USA</text>
        </svg>
      );

    case 'interstage-1-2':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="interstage-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="30%" stopColor="#475569" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect x="25" y="32" width="50" height="36" rx="2" fill="url(#interstage-grad)" stroke="#64748b" strokeWidth="2" />
          {/* Corrugation ribs */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={29 + i * 5} y1="34" x2={29 + i * 5} y2="66" stroke="#94a3b8" strokeWidth="1.5" />
          ))}
          {/* Retro-rocket separation motors */}
          <rect x="21" y="44" width="5" height="12" rx="1.5" fill="#f8fafc" stroke="#dc2626" strokeWidth="1" />
          <rect x="74" y="44" width="5" height="12" rx="1.5" fill="#f8fafc" stroke="#dc2626" strokeWidth="1" />
        </svg>
      );

    case 'stage-2-cryo':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="cryo-hull" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="dome-silver" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          {/* Top Cryo Dome */}
          <path d="M 28 28 Q 50 14 72 28 Z" fill="url(#dome-silver)" stroke="#64748b" strokeWidth="1.5" />
          {/* S-II Main LH2/LOX Cylinder */}
          <rect x="28" y="28" width="44" height="42" fill="url(#cryo-hull)" stroke="#64748b" strokeWidth="1.5" />
          <rect x="30" y="32" width="40" height="6" fill="#1e293b" />
          <text x="50" y="37" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">S-II HYDROLOX</text>
          {/* 5x J-2 Engine Nozzles */}
          <path d="M 33 70 L 28 85 L 40 85 L 36 70 Z" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <path d="M 45 70 L 40 85 L 52 85 L 48 70 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
          <path d="M 57 70 L 52 85 L 64 85 L 60 70 Z" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    case 'interstage-2-3':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="cone-interstage" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <polygon points="34,28 66,28 74,72 26,72" fill="url(#cone-interstage)" stroke="#0f172a" strokeWidth="2" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      );

    case 'stage-3-departure':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="s4b-white" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="60%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          {/* S-IVB Moon Departure Stage */}
          <rect x="32" y="20" width="36" height="48" rx="2" fill="url(#s4b-white)" stroke="#64748b" strokeWidth="1.5" />
          {/* Auxiliary Propulsion Pods */}
          <rect x="29" y="36" width="4" height="14" rx="1.5" fill="#334155" />
          <rect x="67" y="36" width="4" height="14" rx="1.5" fill="#334155" />
          <text x="50" y="32" fill="#0284c7" fontSize="5" fontWeight="bold" textAnchor="middle">S-IVB</text>
          {/* Single J-2 Engine Bell */}
          <path d="M 44 68 L 36 88 L 64 88 L 56 68 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'instrument-unit-ring':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="28" y="36" width="44" height="28" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          {/* Digital Computer modules & Avionics */}
          <rect x="32" y="42" width="8" height="16" fill="#38bdf8" opacity="0.9" />
          <rect x="44" y="42" width="12" height="16" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <rect x="60" y="42" width="8" height="16" fill="#fbbf24" opacity="0.9" />
          <circle cx="50" cy="50" r="2.5" fill="#10b981" />
        </svg>
      );

    case 'stowed-lunar-payload':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="sla-fairing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="gold-foil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Outer Protective Fairing Cone */}
          <polygon points="36,18 64,18 72,82 28,82" fill="url(#sla-fairing)" stroke="#64748b" strokeWidth="1.5" />
          {/* Cutaway Window revealing Gold Foil Lander inside */}
          <rect x="38" y="36" width="24" height="30" rx="3" fill="url(#gold-foil)" stroke="#854d0e" strokeWidth="1.5" />
          <text x="50" y="53" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">LANDER</text>
        </svg>
      );

    case 'service-module-core':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="sm-silver" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="40%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          {/* Service Module Aluminum Body */}
          <rect x="32" y="24" width="36" height="42" fill="url(#sm-silver)" stroke="#64748b" strokeWidth="1.5" />
          {/* White Radiator panels */}
          <rect x="35" y="28" width="13" height="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="52" y="28" width="13" height="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          {/* RCS Attitude Thruster quads */}
          <rect x="29" y="38" width="4" height="6" fill="#0f172a" />
          <rect x="67" y="38" width="4" height="6" fill="#0f172a" />
          {/* Aerojet SPS Propulsion Nozzle Bell */}
          <path d="M 44 66 L 38 86 L 62 86 L 56 66 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
        </svg>
      );

    case 'crew-capsule-command':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="cm-white-cone" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="cm-window" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Apollo Command Module Cone */}
          <polygon points="44,20 56,20 74,68 26,68" fill="url(#cm-white-cone)" stroke="#64748b" strokeWidth="2" />
          {/* Dark Ablative Heat Shield base */}
          <rect x="24" y="68" width="52" height="6" rx="2" fill="#1e293b" />
          {/* Docking Probe Apex */}
          <rect x="46" y="14" width="8" height="6" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          {/* Pilot & Commander Windows */}
          <polygon points="40,38 48,36 47,44 39,44" fill="url(#cm-window)" stroke="#0f172a" strokeWidth="1" />
          <polygon points="60,38 52,36 53,44 61,44" fill="url(#cm-window)" stroke="#0f172a" strokeWidth="1" />
          {/* Ingress/Egress Hatch */}
          <rect x="45" y="47" width="10" height="14" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      );

    case 'launch-escape-tower':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          {/* Protective Cap over Command Module apex */}
          <polygon points="42,70 58,70 66,88 34,88" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          {/* Titanium Lattice Truss */}
          <line x1="44" y1="70" x2="46" y2="34" stroke="#94a3b8" strokeWidth="2" />
          <line x1="56" y1="70" x2="54" y2="34" stroke="#94a3b8" strokeWidth="2" />
          <line x1="44" y1="62" x2="55" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="56" y1="62" x2="45" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="45" y1="46" x2="55" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="55" y1="46" x2="45" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Solid Rocket Motor */}
          <rect x="45" y="16" width="10" height="18" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
          {/* 4 Canted Escape Nozzles */}
          <path d="M 45 28 L 38 32 L 40 34 L 46 30 Z" fill="#1e293b" />
          <path d="M 55 28 L 62 32 L 60 34 L 54 30 Z" fill="#1e293b" />
          {/* Aerodynamic Nose Cone & Canards */}
          <polygon points="50,6 45,16 55,16" fill="#1e293b" />
        </svg>
      );

    case 'neutron-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="gold-cyl" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="40%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <rect x="24" y="24" width="52" height="36" rx="18" fill="url(#gold-cyl)" stroke="#713f12" strokeWidth="2" />
          {/* Dual Helium-3 Sensor Tubes */}
          <circle cx="38" cy="42" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="62" cy="42" r="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="38" cy="42" r="2.5" fill="#00f0ff" />
          <circle cx="62" cy="42" r="2.5" fill="#00f0ff" />
          {/* Mounting bracket */}
          <rect x="32" y="60" width="36" height="12" rx="3" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
          <text x="50" y="78" fill="#00f0ff" fontSize="6" fontWeight="bold" textAnchor="middle">HYDROGEN PROBE</text>
        </svg>
      );

    case 'nir-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="optics-lens" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>
          {/* Anodized Aluminum Housing */}
          <rect x="22" y="22" width="56" height="46" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          {/* Quartz Infrared Optical Lens */}
          <circle cx="50" cy="45" r="16" fill="url(#optics-lens)" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Active LED Illuminator Ring around lens */}
          <circle cx="50" cy="45" r="20" stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="3 3" />
          <text x="50" y="78" fill="#fbbf24" fontSize="6" fontWeight="bold" textAnchor="middle">VOLATILES NIR</text>
        </svg>
      );

    case 'subsurface-drill':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="drill-steel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          {/* Drill Rotary Gearbox Housing */}
          <rect x="36" y="14" width="28" height="24" rx="4" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
          <circle cx="50" cy="26" r="6" fill="#eab308" />
          {/* 1.5m Spiral Carbide Auger Mast */}
          <path d="M 46 38 L 54 44 L 46 50 L 54 56 L 46 62 L 54 68 L 46 74 L 50 86 L 50 38 Z" fill="url(#drill-steel)" stroke="#334155" strokeWidth="1.5" />
          {/* Diamond Penetration Chisel Head */}
          <polygon points="50,90 44,82 56,82" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
        </svg>
      );

    case 'mass-spectrometer':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          {/* Quadrupole Vacuum Chamber */}
          <rect x="22" y="26" width="56" height="38" rx="6" fill="#0f172a" stroke="#ec4899" strokeWidth="2" />
          {/* Stainless steel inlet gas tube */}
          <rect x="46" y="12" width="8" height="14" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          {/* Ion analyzer chamber coils */}
          <circle cx="36" cy="45" r="7" fill="#334155" stroke="#f43f5e" strokeWidth="2" />
          <circle cx="64" cy="45" r="7" fill="#334155" stroke="#f43f5e" strokeWidth="2" />
          <line x1="43" y1="45" x2="57" y2="45" stroke="#00f0ff" strokeWidth="2.5" />
          <text x="50" y="74" fill="#ec4899" fontSize="6" fontWeight="bold" textAnchor="middle">MSOLO ANALYZER</text>
        </svg>
      );

    case 'nav-context-camera':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="20" y="30" width="60" height="34" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
          {/* Dual Stereo Lenses */}
          <circle cx="36" cy="47" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="36" cy="47" r="4" fill="#0284c7" />
          <circle cx="64" cy="47" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="64" cy="47" r="4" fill="#0284c7" />
          {/* Multi-spectral filter wheel */}
          <circle cx="50" cy="47" r="3" fill="#eab308" />
          <text x="50" y="74" fill="#10b981" fontSize="6" fontWeight="bold" textAnchor="middle">STEREO HAZARD CAM</text>
        </svg>
      );

    case 'radiation-monitor':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="26" y="24" width="48" height="48" rx="8" fill="#1e293b" stroke="#eab308" strokeWidth="2" />
          <circle cx="50" cy="48" r="12" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
          {/* Radiation Trefoil icon */}
          <circle cx="50" cy="48" r="3.5" fill="#facc15" />
          <path d="M 50 39 L 54 33 L 46 33 Z" fill="#facc15" />
          <path d="M 42 53 L 36 57 L 39 63 Z" fill="#facc15" />
          <path d="M 58 53 L 64 57 L 61 63 Z" fill="#facc15" />
        </svg>
      );

    case 'aux-battery-pack':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="24" y="28" width="52" height="46" rx="6" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
          {/* Lithium Cell Cooling Fins */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1={30 + i * 9} y1="36" x2={30 + i * 9} y2="66" stroke="#22c55e" strokeWidth="2" />
          ))}
          <path d="M 52 38 L 44 50 L 50 50 L 46 62 L 56 48 L 50 48 Z" fill="#facc15" />
        </svg>
      );

    case 'precision-star-tracker':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="28" y="44" width="44" height="28" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          {/* Optical Baffling Hoods */}
          <polygon points="36,44 32,20 44,20 42,44" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
          <polygon points="58,44 56,20 68,20 64,44" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
          <polygon points="50,50 52,55 58,56 53,60 55,66 50,62 45,66 47,60 42,56 48,55" fill="#facc15" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="25" y="25" width="50" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="50" cy="50" r="14" fill="#0284c7" />
          <text x="50" y="55" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">🚀</text>
        </svg>
      );
  }
};
