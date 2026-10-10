import { createContext, useContext } from 'react';
import type { PlayerGender } from './types.ts';

// Logical script roles stay unchanged; this selects the player's art and voice.
const PlayerCharacterContext = createContext<PlayerGender>('female');
export const PlayerCharacterProvider = PlayerCharacterContext.Provider;
export function usePlayerGender() { return useContext(PlayerCharacterContext); }
