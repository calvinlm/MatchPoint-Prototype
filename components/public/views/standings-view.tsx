"use client"

import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { StandingsTable } from "@/components/standings/standings-table"
import type { StandingsEntry } from "@/lib/public-data"

export function StandingsView() {
  const { snapshot } = useLiveTournamentContext()
  const entries = (snapshot?.standings?.entries as StandingsEntry[]) ?? []

  return (
    <div className="space-y-6">
      <StandingsTable entries={entries} eventName={snapshot?.standings?.eventName ?? snapshot?.event?.name ?? "Standings"} />
    </div>
  )
}
