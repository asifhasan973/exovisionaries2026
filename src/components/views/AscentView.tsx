// Mission Forge - Ascent Flight View Container
import React from 'react';
import { AscentScene } from '../../scene/AscentScene';

export const AscentView: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      <AscentScene />
    </div>
  );
};
