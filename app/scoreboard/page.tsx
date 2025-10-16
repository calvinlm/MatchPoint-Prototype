"use client"

import { useState } from "react"
import { CourtScoreboard } from "@/components/scoreboard/court-scoreboard"
import type { Match } from "@/lib/types"

// Mock live match data
const mockMatch: Match = {
  id: "1",
  number: 101,
  eventId: "1",
  round: 2,
  courtId: "1",
  refereeId: "ref1",
  teams: [
    {
      id: "1",
      players: [
        {
          id: 1,
          name: "John Smith",
          age: 30,
          gender: "MALE",
          address: "",
          contactNumber: "",
          createdAt: "2024-01-01T00:00:00Z",
          firstName: "John",
          lastName: "Smith",
        },
      ],
      eventId: "1",
      seed: 1,
      name: "Team Alpha",
    },
    {
      id: "2",
      players: [
        {
          id: 2,
          name: "Jane Doe",
          age: 28,
          gender: "FEMALE",
          address: "",
          contactNumber: "",
          createdAt: "2024-01-01T00:00:00Z",
          firstName: "Jane",
          lastName: "Doe",
        },
      ],
      eventId: "1",
      seed: 4,
      name: "Team Beta",
    },
  ],
  status: "live",
  games: [
    { seq: 1, scoreA: 11, scoreB: 7, serving: "A", timeoutsA: 1, timeoutsB: 0 },
    { seq: 2, scoreA: 9, scoreB: 11, serving: "B", timeoutsA: 0, timeoutsB: 1 },
    { seq: 3, scoreA: 8, scoreB: 5, serving: "A", timeoutsA: 0, timeoutsB: 0 },
  ],
}

export default function ScoreboardPage() {
  const [showQR, setShowQR] = useState(false)

  return (
    <div className="w-full h-screen overflow-hidden">
      <CourtScoreboard
        match={mockMatch}
        courtName="Court 1"
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
