import React from 'react';

export function renderRocketStageIcon(
  partId: string,
  size: number,
  className: string,
): React.ReactNode | null {
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
          <rect x="30" y="10" width="40" height="60" rx="3" fill="url(#metal-tank-grad)" stroke="#475569" strokeWidth="1.5" />
          <rect x="30" y="24" width="20" height="18" fill="url(#dark-band-grad)" />
          <rect x="50" y="42" width="20" height="16" fill="url(#dark-band-grad)" />
          <rect x="65" y="14" width="3" height="52" fill="#94a3b8" />
          <path d="M 30 55 L 14 74 L 30 74 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 70 55 L 86 74 L 70 74 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 34 70 L 26 88 L 44 88 L 38 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 45 70 L 41 88 L 59 88 L 55 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 62 70 L 56 88 L 74 88 L 66 70 Z" fill="url(#nozzle-copper)" stroke="#0f172a" strokeWidth="1.5" />
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
          <rect x="32" y="28" width="36" height="44" rx="2" fill="url(#interstage-grad)" stroke="#0f172a" strokeWidth="1.5" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="32" y1={34 + i * 6} x2="68" y2={34 + i * 6} stroke="#64748b" strokeWidth="1" />
          ))}
          <rect x="38" y="20" width="24" height="8" rx="2" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
          <circle cx="44" cy="50" r="3" fill="#ef4444" />
          <circle cx="56" cy="50" r="3" fill="#ef4444" />
        </svg>
      );

    case 'stage-2-cryo':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="s2-foam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect x="33" y="16" width="34" height="48" rx="3" fill="url(#s2-foam)" stroke="#475569" strokeWidth="1.5" />
          <line x1="33" y1="36" x2="67" y2="36" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 40 64 L 35 84 L 47 84 L 43 64 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
          <path d="M 60 64 L 53 84 L 65 84 L 57 64 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
          <text x="50" y="32" fill="#0284c7" fontSize="4.5" fontWeight="900" textAnchor="middle">LH2 / LOX</text>
        </svg>
      );

    case 'interstage-2-3':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <polygon points="34,70 38,30 62,30 66,70" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="38" y1="30" x2="66" y2="70" stroke="#64748b" strokeWidth="1.5" />
          <line x1="62" y1="30" x2="34" y2="70" stroke="#64748b" strokeWidth="1.5" />
          <line x1="36" y1="50" x2="64" y2="50" stroke="#64748b" strokeWidth="1.5" />
        </svg>
      );

    case 'stage-3-departure':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="s4b-white" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="40%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect x="35" y="20" width="30" height="42" rx="2" fill="url(#s4b-white)" stroke="#475569" strokeWidth="1.5" />
          <rect x="35" y="30" width="15" height="12" fill="#0f172a" />
          <rect x="50" y="42" width="15" height="12" fill="#0f172a" />
          <path d="M 50 62 L 42 84 L 58 84 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <text x="50" y="27" fill="#dc2626" fontSize="4.5" fontWeight="bold" textAnchor="middle">TLI STAGE</text>
        </svg>
      );

    case 'instrument-unit-ring':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <rect x="33" y="36" width="34" height="28" rx="4" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
          <circle cx="50" cy="50" r="8" fill="#1e293b" stroke="#00f0ff" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="3" fill="#22c55e" />
          <line x1="33" y1="50" x2="42" y2="50" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="1 1" />
          <line x1="58" y1="50" x2="67" y2="50" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="1 1" />
          <text x="50" y="74" fill="#00f0ff" fontSize="5" fontWeight="bold" textAnchor="middle">SATURN IU</text>
        </svg>
      );

    case 'stowed-lunar-payload':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <polygon points="32,75 40,25 60,25 68,75" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />
          <rect x="42" y="44" width="16" height="18" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <line x1="42" y1="62" x2="36" y2="72" stroke="#475569" strokeWidth="1.5" />
          <line x1="58" y1="62" x2="64" y2="72" stroke="#475569" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="4" fill="#1e293b" />
          <text x="50" y="84" fill="#ca8a04" fontSize="4.5" fontWeight="bold" textAnchor="middle">SLA / LANDER</text>
        </svg>
      );

    case 'service-module-core':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="sm-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect x="36" y="24" width="28" height="42" rx="1" fill="url(#sm-metal)" stroke="#475569" strokeWidth="1.5" />
          <line x1="43" y1="24" x2="43" y2="66" stroke="#94a3b8" strokeWidth="1" />
          <line x1="57" y1="24" x2="57" y2="66" stroke="#94a3b8" strokeWidth="1" />
          <rect x="31" y="38" width="5" height="4" fill="#0f172a" />
          <rect x="64" y="38" width="5" height="4" fill="#0f172a" />
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
          <polygon points="44,20 56,20 74,68 26,68" fill="url(#cm-white-cone)" stroke="#64748b" strokeWidth="2" />
          <rect x="24" y="68" width="52" height="6" rx="2" fill="#1e293b" />
          <rect x="46" y="14" width="8" height="6" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <polygon points="40,38 48,36 47,44 39,44" fill="url(#cm-window)" stroke="#0f172a" strokeWidth="1" />
          <polygon points="60,38 52,36 53,44 61,44" fill="url(#cm-window)" stroke="#0f172a" strokeWidth="1" />
          <rect x="45" y="47" width="10" height="14" rx="2" fill="none" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      );

    case 'launch-escape-tower':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
          <polygon points="42,70 58,70 66,88 34,88" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
          <line x1="44" y1="70" x2="46" y2="34" stroke="#94a3b8" strokeWidth="2" />
          <line x1="56" y1="70" x2="54" y2="34" stroke="#94a3b8" strokeWidth="2" />
          <line x1="44" y1="62" x2="55" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="56" y1="62" x2="45" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="45" y1="46" x2="55" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="55" y1="46" x2="45" y2="38" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="45" y="16" width="10" height="18" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
          <path d="M 45 28 L 38 32 L 40 34 L 46 30 Z" fill="#1e293b" />
          <path d="M 55 28 L 62 32 L 60 34 L 54 30 Z" fill="#1e293b" />
          <polygon points="50,6 45,16 55,16" fill="#1e293b" />
        </svg>
      );

    default:
      return null;
  }
}

