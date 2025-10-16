"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { MatchCard, type PlayerMatch } from "@/components/player/match-card"
import { TeamCard } from "@/components/player/team-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserRole } from "@/lib/types"
import { createMockPlayer } from "@/lib/mock-data"
import { Trophy, Calendar, Users, Search, Plus } from "lucide-react"

// Mock data for player
const mockUpcomingMatches: PlayerMatch[] = [
  {
    id: "1",
    number: 105,
    eventId: "1",
    round: 2,
    courtId: "2",
    teams: [
      { id: "1", players: [{ id: "1", firstName: "You", lastName: "" }], eventId: "1" },
      { id: "2", players: [{ id: "2", firstName: "Opponent", lastName: "Team" }], eventId: "1" },
    ],
    status: "assigned" as const,
    games: [],
    eventName: "Men's Doubles 3.0",
    estimatedTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    opponent: {
      name: "Team Beta",
      players: ["Mike Johnson", "Sarah Wilson"],
      seed: 3,
    },
  },
  {
    id: "2",
    number: 108,
    eventId: "2",
    round: 1,
    teams: [
      { id: "3", players: [{ id: "1", firstName: "You", lastName: "" }], eventId: "2" },
      { id: "4", players: [{ id: "4", firstName: "Another", lastName: "Team" }], eventId: "2" },
    ],
    status: "queued" as const,
    games: [],
    eventName: "Mixed Doubles 3.5",
    opponent: {
      name: "Team Gamma",
      players: ["Chris Brown", "Lisa Davis"],
      seed: 2,
    },
  },
]

const mockCompletedMatches: PlayerMatch[] = [
  {
    id: "3",
    number: 102,
    eventId: "1",
    round: 1,
    courtId: "1",
    teams: [
      { id: "1", players: [{ id: "1", firstName: "You", lastName: "" }], eventId: "1" },
      { id: "5", players: [{ id: "5", firstName: "Previous", lastName: "Opponent" }], eventId: "1" },
    ],
    status: "completed" as const,
    games: [
      { seq: 1, scoreA: 11, scoreB: 7, serving: "A", timeoutsA: 1, timeoutsB: 0 },
      { seq: 2, scoreA: 11, scoreB: 9, serving: "B", timeoutsA: 0, timeoutsB: 2 },
    ],
    winnerTeamId: "1",
    endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    eventName: "Men's Doubles 3.0",
    opponent: {
      name: "Team Alpha",
      players: ["John Smith", "Jane Doe"],
      seed: 1,
    },
  },
]

const mockTeams = [
  {
    id: "1",
    players: [
      createMockPlayer({ id: 1, firstName: "You", lastName: "Player" }),
      createMockPlayer({ id: 2, firstName: "Your", lastName: "Partner" }),
    ],
    eventId: "1",
    name: "Dynamic Duo",
    seed: 4,
    eventName: "Men's Doubles 3.0",
    record: { wins: 2, losses: 1 },
    lastMatch: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    players: [
      createMockPlayer({ id: 1, firstName: "You", lastName: "Player" }),
      createMockPlayer({ id: 3, firstName: "Another", lastName: "Partner" }),
    ],
    eventId: "2",
    name: "Mixed Masters",
    seed: 6,
    eventName: "Mixed Doubles 3.5",
    record: { wins: 1, losses: 0 },
    lastMatch: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]

export default function PlayerPage() {
  const userRoles: UserRole[] = ["player"]
  const [activeTab, setActiveTab] = useState("upcoming")

  const handleCheckIn = (matchId: string) => {
    console.log(`Checked in for match ${matchId}`)
    // Handle check-in logic
  }

  const handleViewResult = (matchId: string) => {
    console.log(`View result for match ${matchId}`)
    // Handle view result logic
  }

  return (
    <AppLayout userRoles={userRoles} userName="Player">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Matches</h1>
            <p className="text-muted-foreground">Track your tournament progress and upcoming games</p>
          </div>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Browse Brackets
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Upcoming</p>
              <p className="text-2xl font-bold">{mockUpcomingMatches.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-sm font-medium">Wins</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Teams</p>
              <p className="text-2xl font-bold">{mockTeams.length}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({mockUpcomingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Results ({mockCompletedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams ({mockTeams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {mockUpcomingMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming matches</h3>
                <p className="text-muted-foreground mb-4">You don&apos;t have any matches scheduled at the moment.</p>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Brackets
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockUpcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} type="upcoming" onCheckIn={() => handleCheckIn(match.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {mockCompletedMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No match results</h3>
                <p className="text-muted-foreground">Your completed matches will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockCompletedMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    type="completed"
                    onViewResult={() => handleViewResult(match.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            {mockTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No teams</h3>
                <p className="text-muted-foreground mb-4">You haven&apos;t joined any teams yet.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onViewMatches={() => console.log(`View matches for team ${team.id}`)}
                    onManageTeam={() => console.log(`Manage team ${team.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
