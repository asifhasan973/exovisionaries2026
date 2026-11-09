import React from "react";

export function renderInstrumentIcon(
  partId: string,
  size: number,
  className: string,
): React.ReactNode | null {
  switch (partId) {
    case "neutron-spectrometer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <defs>
            <linearGradient id="gold-cyl" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="40%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <rect
            x="24"
            y="24"
            width="52"
            height="36"
            rx="18"
            fill="url(#gold-cyl)"
            stroke="#713f12"
            strokeWidth="2"
          />
          <circle
            cx="38"
            cy="42"
            r="7"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <circle
            cx="62"
            cy="42"
            r="7"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <circle cx="38" cy="42" r="2.5" fill="#00f0ff" />
          <circle cx="62" cy="42" r="2.5" fill="#00f0ff" />
          <rect
            x="32"
            y="60"
            width="36"
            height="12"
            rx="3"
            fill="#334155"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <text
            x="50"
            y="78"
            fill="#00f0ff"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            HYDROGEN PROBE
          </text>
        </svg>
      );

    case "nir-spectrometer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <defs>
            <linearGradient
              id="optics-lens"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>
          <rect
            x="22"
            y="22"
            width="56"
            height="46"
            rx="8"
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="45"
            r="16"
            fill="url(#optics-lens)"
            stroke="#94a3b8"
            strokeWidth="2.5"
          />
          <circle
            cx="50"
            cy="45"
            r="20"
            stroke="#fbbf24"
            strokeWidth="2"
            fill="none"
            strokeDasharray="3 3"
          />
          <text
            x="50"
            y="78"
            fill="#fbbf24"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            VOLATILES NIR
          </text>
        </svg>
      );

    case "subsurface-drill":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <defs>
            <linearGradient id="drill-steel" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <rect
            x="36"
            y="14"
            width="28"
            height="24"
            rx="4"
            fill="#0f172a"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <circle cx="50" cy="26" r="6" fill="#eab308" />
          <path
            d="M 46 38 L 54 44 L 46 50 L 54 56 L 46 62 L 54 68 L 46 74 L 50 86 L 50 38 Z"
            fill="url(#drill-steel)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <polygon
            points="50,90 44,82 56,82"
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth="1"
          />
        </svg>
      );

    case "mass-spectrometer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <rect
            x="22"
            y="26"
            width="56"
            height="38"
            rx="6"
            fill="#0f172a"
            stroke="#ec4899"
            strokeWidth="2"
          />
          <rect
            x="46"
            y="12"
            width="8"
            height="14"
            fill="#cbd5e1"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <circle
            cx="36"
            cy="45"
            r="7"
            fill="#334155"
            stroke="#f43f5e"
            strokeWidth="2"
          />
          <circle
            cx="64"
            cy="45"
            r="7"
            fill="#334155"
            stroke="#f43f5e"
            strokeWidth="2"
          />
          <line
            x1="43"
            y1="45"
            x2="57"
            y2="45"
            stroke="#00f0ff"
            strokeWidth="2.5"
          />
          <text
            x="50"
            y="74"
            fill="#ec4899"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            MSOLO ANALYZER
          </text>
        </svg>
      );

    case "nav-context-camera":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <rect
            x="20"
            y="30"
            width="60"
            height="34"
            rx="6"
            fill="#1e293b"
            stroke="#10b981"
            strokeWidth="2"
          />
          <circle
            cx="36"
            cy="47"
            r="10"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          <circle cx="36" cy="47" r="4" fill="#0284c7" />
          <circle
            cx="64"
            cy="47"
            r="10"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          <circle cx="64" cy="47" r="4" fill="#0284c7" />
          <circle cx="50" cy="47" r="3" fill="#eab308" />
          <text
            x="50"
            y="74"
            fill="#10b981"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            STEREO HAZARD CAM
          </text>
        </svg>
      );

    case "radiation-monitor":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <rect
            x="26"
            y="24"
            width="48"
            height="48"
            rx="8"
            fill="#1e293b"
            stroke="#eab308"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="48"
            r="12"
            fill="#0f172a"
            stroke="#eab308"
            strokeWidth="2"
          />
          <circle cx="50" cy="48" r="3.5" fill="#facc15" />
          <path d="M 50 39 L 54 33 L 46 33 Z" fill="#facc15" />
          <path d="M 42 53 L 36 57 L 39 63 Z" fill="#facc15" />
          <path d="M 58 53 L 64 57 L 61 63 Z" fill="#facc15" />
        </svg>
      );

    case "aux-battery-pack":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <rect
            x="24"
            y="28"
            width="52"
            height="46"
            rx="6"
            fill="#0f172a"
            stroke="#22c55e"
            strokeWidth="2"
          />
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={i}
              x1={30 + i * 9}
              y1="36"
              x2={30 + i * 9}
              y2="66"
              stroke="#22c55e"
              strokeWidth="2"
            />
          ))}
          <path
            d="M 52 38 L 44 50 L 50 50 L 46 62 L 56 48 L 50 48 Z"
            fill="#facc15"
          />
        </svg>
      );

    case "precision-star-tracker":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
        >
          <rect
            x="28"
            y="44"
            width="44"
            height="28"
            rx="4"
            fill="#1e293b"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <polygon
            points="36,44 32,20 44,20 42,44"
            fill="#0f172a"
            stroke="#60a5fa"
            strokeWidth="1.5"
          />
          <polygon
            points="58,44 56,20 68,20 64,44"
            fill="#0f172a"
            stroke="#60a5fa"
            strokeWidth="1.5"
          />
          <polygon
            points="50,50 52,55 58,56 53,60 55,66 50,62 45,66 47,60 42,56 48,55"
            fill="#facc15"
          />
        </svg>
      );

    default:
      return null;
  }
}
