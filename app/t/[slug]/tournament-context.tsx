'use client';

import { createContext, useContext, type ReactNode } from "react";
import type { PublicTournament } from "@matchpoint/types/public";

export type PublicTournamentContext = Pick<
  PublicTournament,
  "id" | "slug" | "name" | "startDate" | "endDate" | "venue"
>;

const TournamentContext = createContext<PublicTournamentContext | null>(null);

type ProviderProps = {
  value: PublicTournamentContext;
  children: ReactNode;
};

export function TournamentProvider({ value, children }: ProviderProps) {
  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return ctx;
}
