"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CourtScoreboard } from "@/components/scoreboard/court-scoreboard"
import { useCourts, useMatch } from "@/hooks/use-tournament-data"
import { useSocket } from "@/hooks/use-socket"
import type { Match } from "@/lib/types"

export default function ScoreboardPage() {
  const [showQR, setShowQR] = useState(false)
  const searchParams = useSearchParams()
  const matchId = searchParams.get("matchId")
  const { match, setMatch, isLoading, error } = useMatch(matchId)
  const { data: courts } = useCourts()
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !matchId) return

    const handleScoreUpdate = (payload: Match) => {
      if (!payload?.id || payload.id !== matchId) return
      setMatch((previous) => ({ ...(previous ?? payload), ...payload }))
    }

    socket.emit("join_match", matchId)
    socket.on("score_update", handleScoreUpdate)

    return () => {
      socket.emit("leave_match", matchId)
      socket.off("score_update", handleScoreUpdate)
    }
  }, [matchId, setMatch, socket])

  const courtName = useMemo(() => {
    if (!match?.courtId) return undefined
    return courts.find((court) => court.id === match.courtId)?.name
  }, [courts, match])

  if (!matchId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg font-medium">Select a match to view its scoreboard.</p>
      </div>
    )
  }

  if (isLoading || !match) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg font-medium">{error ? "Unable to load match." : "Loading match details..."}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <CourtScoreboard
        match={match}
        courtName={courtName ?? "Court"}
        onToggleContrast={() => console.log("Toggle contrast")}
        onShowQR={() => setShowQR(!showQR)}
      />

      {/* QR Code Modal (placeholder) */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-4">Follow This Match</h3>
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
              <span className="text-muted-foreground">QR Code</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Scan to follow live updates on your phone</p>
            <button onClick={() => setShowQR(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
