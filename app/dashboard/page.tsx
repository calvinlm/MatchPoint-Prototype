"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { CourtCard } from "@/components/dashboard/court-card"
import { QueuePreview } from "@/components/dashboard/queue-preview"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Court, Match } from "@/lib/types"
import { Trophy, Users, Play, CheckCircle, Plus, UserPlus, MoreHorizontal } from "lucide-react"

// Mock data for demonstration
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
      { id: "1", players: [{ id: "1", firstName: "John", lastName: "Smith" }], eventId: "1" },
      { id: "2", players: [{ id: "2", firstName: "Jane", lastName: "Doe" }], eventId: "1" },
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
      { id: "3", players: [{ id: "3", firstName: "Mike", lastName: "Johnson" }], eventId: "1" },
      { id: "4", players: [{ id: "4", firstName: "Sarah", lastName: "Wilson" }], eventId: "1" },
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

export default function DashboardPage() {
  const userRoles: UserRole[] = ["director"] // Mock user role

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
              <Badge variant="outline" className="ml-2">
                Day 2 of 3
              </Badge>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Courts Active"
            value="3/4"
            change={{ value: "+1", trend: "up" }}
            icon={<Play className="h-5 w-5" />}
          />
          <KpiCard
            title="In Queue"
            value="12"
            change={{ value: "-2", trend: "down" }}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            title="Live Matches"
            value="3"
            change={{ value: "+1", trend: "up" }}
            icon={<Trophy className="h-5 w-5" />}
          />
          <KpiCard
            title="Completed Today"
            value="47"
            change={{ value: "+15", trend: "up" }}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courts Grid */}
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            <QueuePreview
              queueItems={mockQueueItems}
              onViewFullQueue={() => console.log("View full queue")}
              onAssignToCourt={(matchId) => console.log(`Assign match ${matchId} to court`)}
            />
            <AlertsPanel alerts={mockAlerts} onDismissAlert={(id) => console.log(`Dismiss alert ${id}`)} />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" size="lg">
            View Full Queue
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
