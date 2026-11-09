// Mission Forge - Photorealistic & Authentic Aerospace Part Icons
import React from "react";
import { renderRocketStageIcon } from "./icons/parts/RocketStageIcons";
import { renderInstrumentIcon } from "./icons/parts/InstrumentIcons";

export interface IconProps {
  partId: string;
  size?: number;
  className?: string;
}

export const RealisticPartIcon: React.FC<IconProps> = ({
  partId,
  size = 64,
  className = "",
}) => {
  const rocketIcon = renderRocketStageIcon(partId, size, className);
  if (rocketIcon) return rocketIcon;

  const instrumentIcon = renderInstrumentIcon(partId, size, className);
  if (instrumentIcon) return instrumentIcon;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect
        x="25"
        y="25"
        width="50"
        height="50"
        rx="8"
        fill="#1e293b"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="14" fill="#0284c7" />
      <text
        x="50"
        y="55"
        fill="#ffffff"
        fontSize="16"
        fontWeight="bold"
        textAnchor="middle"
      >
        🚀
      </text>
    </svg>
  );
};
