import { createContext, useContext } from 'react';
import type { PlayerGender } from './types.ts';

export const PlayerCharacterContext = createContext<PlayerGender>('female');

export function usePlayerGender(): PlayerGender {
  return useContext(PlayerCharacterContext);
}

