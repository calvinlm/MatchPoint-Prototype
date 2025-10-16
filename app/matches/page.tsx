"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { LiveMatchCard } from "@/components/matches/live-match-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { UserRole, Match, Player } from "@/lib/types"
import { getPlayerDisplayName } from "@/lib/player"
import { Play, Search, RefreshCw, Filter, Grid, List } from "lucide-react"

// Mock live matches data
const createPlayer = (id: number, firstName: string, lastName: string): Player => ({
  id,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
})

const mockLiveMatches: (Match & { eventName: string; refereeName?: string; duration: string })[] = [
  {
    id: "1",
    number: 105,
    eventId: "1",
    round: 2,
    courtId: "1",
    refereeId: "ref1",
    teams: [
      {
        id: "1",
        players: [createPlayer(1, "John", "Smith")],
        eventId: "1",
        name: "Dynamic Duo",
        seed: 1,
      },
      {
        id: "2",
        players: [createPlayer(2, "Mike", "Johnson")],
        eventId: "1",
        name: "Power Players",
        seed: 4,
      },
    ],
    status: "live",
    games: [
      { seq: 1, scoreA: 11, scoreB: 7, serving: "A", timeoutsA: 1, timeoutsB: 0 },
      { seq: 2, scoreA: 8, scoreB: 11, serving: "B", timeoutsA: 0, timeoutsB: 2 },
      { seq: 3, scoreA: 6, scoreB: 4, serving: "A", timeoutsA: 0, timeoutsB: 1 },
    ],
    eventName: "Men's Doubles 3.0",
    refereeName: "Sarah Wilson",
    duration: "32:15",
  },
  {
    id: "2",
    number: 108,
    eventId: "2",
    round: 1,
    courtId: "2",
    refereeId: "ref2",
    teams: [
      {
        id: "3",
        players: [createPlayer(3, "Emma", "White")],
        eventId: "2",
        name: "Mixed Masters",
        seed: 2,
      },
      {
        id: "4",
        players: [createPlayer(4, "Chris", "Davis")],
        eventId: "2",
        name: "Court Crushers",
        seed: 3,
      },
    ],
    status: "live",
    games: [
      { seq: 1, scoreA: 9, scoreB: 11, serving: "B", timeoutsA: 2, timeoutsB: 1 },
      { seq: 2, scoreA: 7, scoreB: 3, serving: "A", timeoutsA: 0, timeoutsB: 0 },
    ],
    eventName: "Mixed Doubles 3.5",
    refereeName: "Tom Brown",
    duration: "18:42",
  },
  {
    id: "3",
    number: 112,
    eventId: "1",
    round: 1,
    courtId: "3",
    teams: [
      {
        id: "5",
        players: [createPlayer(5, "Lisa", "Garcia")],
        eventId: "1",
        name: "Net Ninjas",
        seed: 6,
      },
      {
        id: "6",
        players: [createPlayer(6, "Ryan", "Taylor")],
        eventId: "1",
        name: "Court Kings",
        seed: 7,
      },
    ],
    status: "live",
    games: [{ seq: 1, scoreA: 4, scoreB: 2, serving: "A", timeoutsA: 0, timeoutsB: 0 }],
    eventName: "Men's Doubles 3.0",
    duration: "8:23",
  },
]

export default function LiveMatchesPage() {
  const userRoles: UserRole[] = ["referee", "director"]
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourt, setSelectedCourt] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const courts = ["1", "2", "3", "4", "5"]
  const events = [
    { id: "1", name: "Men's Doubles 3.0" },
    { id: "2", name: "Mixed Doubles 3.5" },
  ]

  const filteredMatches = mockLiveMatches.filter((match) => {
    const matchesSearch =
      searchTerm === "" ||
      match.number.toString().includes(searchTerm) ||
      match.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.teams.some(
        (team) =>
          team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.players
            .map((player) => getPlayerDisplayName(player).toLowerCase())
            .some((name) => name.includes(searchTerm.toLowerCase())),
      )

    const matchesCourt = selectedCourt === "all" || match.courtId === selectedCourt
    const matchesEvent = selectedEvent === "all" || match.eventId === selectedEvent

    return matchesSearch && matchesCourt && matchesEvent
  })

  const handleViewScoreboard = (matchId: string) => {
    console.log(`View scoreboard for match ${matchId}`)
    // Navigate to scoreboard
  }

  const handleTakeControl = (matchId: string) => {
    console.log(`Take control of match ${matchId}`)
    // Navigate to scoring interface
  }

  const handleReportIssue = (matchId: string) => {
    console.log(`Report issue for match ${matchId}`)
    // Open issue reporting modal
  }

  return (
    <AppLayout userRoles={userRoles} userName="Referee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Matches</h1>
            <p className="text-muted-foreground">Monitor all active matches across courts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center">
              <Play className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-sm font-medium">Live Matches</p>
              <p className="text-2xl font-bold">{mockLiveMatches.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Grid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Active Courts</p>
              <p className="text-2xl font-bold">{new Set(mockLiveMatches.map((m) => m.courtId)).size}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Filter className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
              <Search className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-sm font-medium">Filtered</p>
              <p className="text-2xl font-bold">{filteredMatches.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search matches, teams, or players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCourt} onValueChange={setSelectedCourt}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Court" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courts</SelectItem>
              {courts.map((court) => (
                <SelectItem key={court} value={court}>
                  Court {court}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Event" />
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
        </div>

        {/* Matches Grid/List */}
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No live matches</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCourt !== "all" || selectedEvent !== "all"
                ? "No matches match your current filters."
                : "There are no matches currently in progress."}
            </p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
            {filteredMatches.map((match) => (
              <LiveMatchCard
                key={match.id}
                match={match}
                onViewScoreboard={() => handleViewScoreboard(match.id)}
                onTakeControl={() => handleTakeControl(match.id)}
                onReportIssue={() => handleReportIssue(match.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
