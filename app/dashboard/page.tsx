"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CourtCard } from "@/components/dashboard/court-card"
import { QueuePreview } from "@/components/dashboard/queue-preview"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Court, Match } from "@/lib/types"
import { Plus, UserPlus, MoreHorizontal } from "lucide-react"
import { StandingsPanel, type Bracket, type StandingRow } from "@/components/dashboard/standings-panel"

const mockCourts: Court[] = [
  { id: "1", name: "Court 1", location: "Main Hall", status: "playing" },
  { id: "2", name: "Court 2", location: "Main Hall", status: "idle" },
  { id: "3", name: "Court 3", location: "Side Courts", status: "cleaning" },
  { id: "4", name: "Court 4", location: "Side Courts", status: "hold" },
]

const mockMatches: Match[] = [
  {
    id: "1",
    number: 101,
    eventId: "1",
    round: 1,
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
      },
    ],
    status: "live",
    games: [],
  },
  {
    id: "2",
    number: 102,
    eventId: "1",
    round: 1,
    teams: [
      {
        id: "3",
        players: [
          {
            id: 3,
            name: "Mike Johnson",
            age: 31,
            gender: "MALE",
            address: "",
            contactNumber: "",
            createdAt: "2024-01-01T00:00:00Z",
            firstName: "Mike",
            lastName: "Johnson",
          },
        ],
        eventId: "1",
      },
      {
        id: "4",
        players: [
          {
            id: 4,
            name: "Sarah Wilson",
            age: 27,
            gender: "FEMALE",
            address: "",
            contactNumber: "",
            createdAt: "2024-01-01T00:00:00Z",
            firstName: "Sarah",
            lastName: "Wilson",
          },
        ],
        eventId: "1",
      },
    ],
    status: "queued",
    games: [],
  },
]

const mockQueueItems = [
  { id: "1", matchId: "2", priority: 1, match: mockMatches[1] },
  { id: "2", matchId: "3", priority: 2, match: { ...mockMatches[1], id: "3", number: 103 } },
]

const mockAlerts = [
  {
    id: "1",
    type: "missing_ref" as const,
    title: "Referee Needed",
    message: "Court 1 match requires a referee assignment",
    timestamp: new Date(),
    actionLabel: "Assign Referee",
    onAction: () => console.log("Assign referee"),
  },
  {
    id: "2",
    type: "delay" as const,
    title: "Schedule Delay",
    message: "Match 101 running 15 minutes behind schedule",
    timestamp: new Date(Date.now() - 300000),
  },
]

// --- Standings demo data (matches your screenshot structure) ---
const bracketA: StandingRow[] = [
  { rank: 1, players: "Andrew / Jason", wins: 3, losses: 0, pa: 33, pl: 10, quotient: 3.3 },
  { rank: 2, players: "Jake / Mike",    wins: 2, losses: 1, pa: 25, pl: 25, quotient: 1.0 },
  { rank: 3, players: "Santino / Johnny", wins: 1, losses: 2, pa: 18, pl: 22, quotient: 0.82 },
  { rank: 4, players: "Joe / CJ",         wins: 0, losses: 3, pa: 11, pl: 33, quotient: 0.33 },
]

const mockBrackets: Bracket[] = [
  { id: "novice_md_a", name: "35+ Novice MD", pool: "Bracket A", standings: bracketA },
  { id: "novice_md_b", name: "35+ Novice MD", pool: "Bracket B", standings: bracketA.map(r => ({ ...r, rank: r.rank, players: r.players + " B" })) },
  { id: "novice_md_c", name: "35+ Novice MD", pool: "Bracket C", standings: bracketA.map(r => ({ ...r, rank: r.rank, players: r.players + " C" })) },
]

export default function DashboardPage() {
  const userRoles: UserRole[] = ["director"]

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spring Championship 2024</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>March 15-17, 2024</span>
              <span>•</span>
              <span>Riverside Sports Complex</span>
              <Badge variant="outline" className="ml-2">Day 2 of 3</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Open Check-in
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Standings (replaces KPI grid) */}
        <StandingsPanel brackets={mockBrackets} defaultBracketId="novice_md_a" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Courts Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockCourts.map((court) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  assignedMatch={court.status === "playing" ? mockMatches[0] : undefined}
                  onAssignMatch={() => console.log(`Assign match to ${court.name}`)}
                  onViewScoreboard={() => console.log(`View scoreboard for ${court.name}`)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <QueuePreview
              queueItems={mockQueueItems}
              onViewFullQueue={() => console.log("View full queue")}
              onAssignToCourt={(matchId) => console.log(`Assign match ${matchId} to court`)}
            />
            <AlertsPanel alerts={mockAlerts} onDismissAlert={(id) => console.log(`Dismiss alert ${id}`)} />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" size="lg">View Full Queue</Button>
        </div>
      </div>
    </AppLayout>
  )
}
