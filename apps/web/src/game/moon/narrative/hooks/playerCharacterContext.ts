import React, { createContext, useContext } from "react";
import type { PlayerGender } from "@/game/moon/core/types";

export const PlayerCharacterContext = createContext<PlayerGender>("female");

export function PlayerCharacterProvider({
  value,
  children,
}: {
  value: PlayerGender;
  children?: React.ReactNode;
}) {
  return React.createElement(
    PlayerCharacterContext.Provider,
    { value },
    children,
  );
}

export function usePlayerCharacter(): PlayerGender {
  return useContext(PlayerCharacterContext);
}

export const usePlayerGender = usePlayerCharacter;
