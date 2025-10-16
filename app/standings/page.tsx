"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { StandingsTable } from "@/components/standings/standings-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole, Player } from "@/lib/types"
import { Trophy, Download, RefreshCw } from "lucide-react"

// Mock standings data
const createPlayer = (id: number, firstName: string, lastName: string): Player => ({
  id,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
})

const mockStandings = {
  "mens-doubles-30": [
    {
      id: "1",
      name: "Dynamic Duo",
      players: [createPlayer(1, "John", "Smith"), createPlayer(2, "Mike", "Johnson")],
      eventId: "1",
      seed: 1,
      position: 1,
      wins: 4,
      losses: 0,
      pointsFor: 88,
      pointsAgainst: 52,
      pointDifferential: 36,
      streak: 4,
      streakType: "win" as const,
    },
    {
      id: "2",
      name: "Power Players",
      players: [createPlayer(3, "Sarah", "Wilson"), createPlayer(4, "Tom", "Brown")],
      eventId: "1",
      seed: 2,
      position: 2,
      wins: 3,
      losses: 1,
      pointsFor: 79,
      pointsAgainst: 61,
      pointDifferential: 18,
      streak: 2,
      streakType: "win" as const,
    },
    {
      id: "3",
      name: "Court Kings",
      players: [createPlayer(5, "Chris", "Davis"), createPlayer(6, "Alex", "Miller")],
      eventId: "1",
      seed: 3,
      position: 3,
      wins: 2,
      losses: 2,
      pointsFor: 71,
      pointsAgainst: 73,
      pointDifferential: -2,
      streak: 1,
      streakType: "loss" as const,
    },
    {
      id: "4",
      name: "Net Ninjas",
      players: [createPlayer(7, "Lisa", "Garcia"), createPlayer(8, "Ryan", "Taylor")],
      eventId: "1",
      seed: 4,
      position: 4,
      wins: 1,
      losses: 3,
      pointsFor: 58,
      pointsAgainst: 77,
      pointDifferential: -19,
      streak: 2,
      streakType: "loss" as const,
    },
  ],
  "mixed-doubles-35": [
    {
      id: "5",
      name: "Mixed Masters",
      players: [createPlayer(9, "Emma", "White"), createPlayer(10, "Jake", "Anderson")],
      eventId: "2",
      seed: 1,
      position: 1,
      wins: 3,
      losses: 0,
      pointsFor: 66,
      pointsAgainst: 41,
      pointDifferential: 25,
      streak: 3,
      streakType: "win" as const,
    },
    {
      id: "6",
      name: "Court Crushers",
      players: [createPlayer(11, "Maya", "Patel"), createPlayer(12, "David", "Lee")],
      eventId: "2",
      seed: 2,
      position: 2,
      wins: 2,
      losses: 1,
      pointsFor: 55,
      pointsAgainst: 48,
      pointDifferential: 7,
      streak: 1,
      streakType: "win" as const,
    },
  ],
}

export default function StandingsPage() {
  const userRoles: UserRole[] = ["player"]
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [sortBy, setSortBy] = useState("position")

  const events = [
    { id: "mens-doubles-30", name: "Men's Doubles 3.0" },
    { id: "mixed-doubles-35", name: "Mixed Doubles 3.5" },
  ]

  const getAllStandings = () => {
    return Object.entries(mockStandings).flatMap(([eventKey, standings]) =>
      standings.map((entry) => ({
        ...entry,
        eventName: events.find((e) => e.id === eventKey)?.name || eventKey,
      })),
    )
  }

  const getFilteredStandings = () => {
    if (selectedEvent === "all") {
      return getAllStandings()
    }
    return mockStandings[selectedEvent as keyof typeof mockStandings] || []
  }

  return (
    <AppLayout userRoles={userRoles} userName="Player">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tournament Standings</h1>
            <p className="text-muted-foreground">Current rankings and team performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="position">Position</SelectItem>
              <SelectItem value="wins">Wins</SelectItem>
              <SelectItem value="winPercentage">Win %</SelectItem>
              <SelectItem value="pointDifferential">Point Diff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Standings Tables */}
        {selectedEvent === "all" ? (
          <div className="space-y-6">
            {events.map((event) => {
              const standings = mockStandings[event.id as keyof typeof mockStandings] || []
              return <StandingsTable key={event.id} entries={standings} eventName={event.name} />
            })}
          </div>
        ) : (
          <StandingsTable
            entries={getFilteredStandings()}
            eventName={events.find((e) => e.id === selectedEvent)?.name || "Tournament"}
          />
        )}

        {/* Empty State */}
        {getFilteredStandings().length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No standings available</h3>
            <p className="text-muted-foreground">Standings will appear once matches are completed.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
