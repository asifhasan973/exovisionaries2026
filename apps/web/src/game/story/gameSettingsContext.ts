import { createContext, useContext } from 'react';
export const SettingsContext = createContext({ effects: true, gentle: false });
export const useGameSettings = () => useContext(SettingsContext);
