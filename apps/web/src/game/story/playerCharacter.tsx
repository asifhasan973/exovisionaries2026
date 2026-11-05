import React from 'react';
import type { PlayerGender } from './types.ts';
import { PlayerCharacterContext } from './playerCharacterContext.ts';

export function PlayerCharacterProvider({ value, children }: { value: PlayerGender; children?: React.ReactNode }) {
  return <PlayerCharacterContext.Provider value={value}>{children}</PlayerCharacterContext.Provider>;
}
