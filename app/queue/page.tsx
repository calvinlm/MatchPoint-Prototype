"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { QueueTable } from "@/components/queue/queue-table"
import { CourtsGrid } from "@/components/queue/courts-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole, Court, Match, QueueItem, Player } from "@/lib/types"
import { RefreshCw, Filter, Plus } from "lucide-react"

// Mock data
const mockCourts: Court[] = [
  { id: "1", name: "Court 1", location: "Main Hall", status: "playing" },
  { id: "2", name: "Court 2", location: "Main Hall", status: "idle" },
  { id: "3", name: "Court 3", location: "Side Courts", status: "cleaning" },
  { id: "4", name: "Court 4", location: "Side Courts", status: "idle" },
]

const createPlayer = (id: number, firstName: string, lastName: string): Player => ({
  id,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
})

const mockMatches: Match[] = [
  {
    id: "1",
    number: 101,
    eventId: "1",
    round: 1,
    courtId: "1",
    refereeId: "ref1",
    teams: [
      { id: "1", players: [createPlayer(1, "John", "Smith")], eventId: "1", seed: 1 },
      { id: "2", players: [createPlayer(2, "Jane", "Doe")], eventId: "1", seed: 8 },
    ],
    status: "live",
    games: [{ seq: 1, scoreA: 7, scoreB: 5, serving: "A", timeoutsA: 0, timeoutsB: 1 }],
  },
  {
    id: "2",
    number: 102,
    eventId: "1",
    round: 1,
    teams: [
      { id: "3", players: [createPlayer(3, "Mike", "Johnson")], eventId: "1", seed: 2 },
      { id: "4", players: [createPlayer(4, "Sarah", "Wilson")], eventId: "1", seed: 7 },
    ],
    status: "queued",
    games: [],
  },
  {
    id: "3",
    number: 103,
    eventId: "1",
    round: 1,
    refereeId: "ref2",
    teams: [
      { id: "5", players: [createPlayer(5, "Chris", "Brown")], eventId: "1", seed: 3 },
      { id: "6", players: [createPlayer(6, "Lisa", "Davis")], eventId: "1", seed: 6 },
    ],
    status: "queued",
    games: [],
  },
  {
    id: "4",
    number: 104,
    eventId: "1",
    round: 1,
    teams: [
      { id: "7", players: [createPlayer(7, "Alex", "Miller")], eventId: "1", seed: 4 },
      { id: "8", players: [createPlayer(8, "Emma", "Taylor")], eventId: "1", seed: 5 },
    ],
    status: "queued",
    games: [],
  },
]

const mockQueueItems: (QueueItem & { match: Match })[] = [
  { id: "1", matchId: "2", priority: 1, match: mockMatches[1] },
  { id: "2", matchId: "3", priority: 2, match: mockMatches[2] },
  { id: "3", matchId: "4", priority: 3, match: mockMatches[3] },
]

export default function QueuePage() {
  const userRoles: UserRole[] = ["director"]
  const [courts, setCourts] = useState(mockCourts)
  const [matches, setMatches] = useState(mockMatches)
  const [queueItems, setQueueItems] = useState(mockQueueItems)
  const [eventFilter, setEventFilter] = useState<string>("all")

  const handleAssignCourt = (matchId: string, courtId: string) => {
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, courtId } : match)))
    console.log(`Assigned match ${matchId} to court ${courtId}`)
  }

  const handleAssignReferee = (matchId: string) => {
    setMatches((prev) =>
      prev.map((match) => (match.id === matchId ? { ...match, refereeId: `ref-${Date.now()}` } : match)),
    )
    console.log(`Assigned referee to match ${matchId}`)
  }

  const handleChangeCourtStatus = (courtId: string, status: Court["status"]) => {
    setCourts((prev) => prev.map((court) => (court.id === courtId ? { ...court, status } : court)))
  }

  const handleStartMatch = (matchId: string) => {
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, status: "live" as const } : match)))
    // Remove from queue when started
    setQueueItems((prev) => prev.filter((item) => item.matchId !== matchId))
    console.log(`Started match ${matchId}`)
  }

  const handleReorderQueue = (newItems: QueueItem[]) => {
    setQueueItems(newItems as (QueueItem & { match: Match })[])
  }

  const activeMatches = matches.filter((m) => m.status === "live").length
  const queuedMatches = queueItems.length
  const availableCourts = courts.filter((c) => c.status === "idle").length

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Match Queue & Courts</h1>
            <p className="text-muted-foreground">Manage match assignments and court scheduling</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Match
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{activeMatches}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Active Matches</p>
              <p className="text-xs text-muted-foreground">Currently playing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-accent-foreground">{queuedMatches}</span>
            </div>
            <div>
              <p className="text-sm font-medium">In Queue</p>
              <p className="text-xs text-muted-foreground">Waiting to start</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-chart-1">{availableCourts}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Available Courts</p>
              <p className="text-xs text-muted-foreground">Ready for matches</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="mens-3.0">Men's Doubles 3.0</SelectItem>
              <SelectItem value="womens-3.5">Women's Doubles 3.5</SelectItem>
              <SelectItem value="mixed-4.0">Mixed Doubles 4.0</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1">
            <Filter className="h-3 w-3" />
            {eventFilter === "all" ? "All Events" : eventFilter}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Table */}
          <QueueTable
            queueItems={queueItems}
            courts={courts}
            onAssignCourt={handleAssignCourt}
            onAssignReferee={handleAssignReferee}
            onPrintScoreSheet={(matchId) => console.log(`Print score sheet for ${matchId}`)}
            onOpenScoreboard={(matchId) => console.log(`Open scoreboard for ${matchId}`)}
            onReorderQueue={handleReorderQueue}
            onStartMatch={handleStartMatch}
          />

          {/* Courts Grid */}
          <CourtsGrid
            courts={courts}
            matches={matches}
            queueItems={queueItems}
            onAssignMatch={handleAssignCourt}
            onViewScoreboard={(courtId) => console.log(`View scoreboard for court ${courtId}`)}
            onChangeCourtStatus={handleChangeCourtStatus}
          />
        </div>
      </div>
    </AppLayout>
  )
}
