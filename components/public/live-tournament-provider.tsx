"use client"

import { createContext, useContext } from "react"
import type { ReactNode } from "react"
import { useLiveTournamentSnapshot } from "@/hooks/use-live-tournament-snapshot"

interface LiveTournamentProviderProps {
  slug: string
  children: ReactNode
}

const LiveTournamentContext = createContext<ReturnType<typeof useLiveTournamentSnapshot> | null>(null)

export function LiveTournamentProvider({ slug, children }: LiveTournamentProviderProps) {
  const value = useLiveTournamentSnapshot(slug)
  return <LiveTournamentContext.Provider value={value}>{children}</LiveTournamentContext.Provider>
}

export function useLiveTournamentContext() {
  const context = useContext(LiveTournamentContext)

  if (!context) {
    throw new Error("useLiveTournamentContext must be used within a LiveTournamentProvider")
  }

  return context
}
