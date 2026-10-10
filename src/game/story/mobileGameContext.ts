import { createContext, useContext } from 'react';

export const MOBILE_GAME_QUERY = '(max-width: 700px), (max-width: 1100px) and (max-height: 600px), (any-pointer: coarse) and (max-width: 1100px)';
export const MobileGameContext = createContext({ mobile: false, active: false, start: () => {}, openMenu: () => {} });
export function useMobileGame() { return useContext(MobileGameContext); }
