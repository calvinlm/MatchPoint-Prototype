"use client"

import { useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { CourtCard } from "@/components/dashboard/court-card"
import { QueuePreview } from "@/components/dashboard/queue-preview"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Match, QueueItem, UserRole } from "@/lib/types"
import { useAlerts, useCourts, useMatches, useQueue } from "@/hooks/use-tournament-data"
import { updateMatch } from "@/lib/api"
import { Trophy, Users, Play, CheckCircle, Plus, UserPlus, MoreHorizontal } from "lucide-react"

export default function DashboardPage() {
  const userRoles: UserRole[] = ["director"] // Mock user role
  const { data: courts, refresh: refreshCourts } = useCourts()
  const { data: matches, setData: setMatches } = useMatches()
  const { data: queueItems, refresh: refreshQueue } = useQueue()
  const { data: alerts, setData: setAlerts } = useAlerts()

  const queueWithMatches = useMemo<(QueueItem & { match: Match })[]>(() => {
    if (!matches.length) return []
    const matchMap = new Map(matches.map((match) => [match.id, match]))

    return queueItems
      .map((item) => ({
        ...item,
        match: item.match ?? matchMap.get(item.matchId),
      }))
      .filter((item): item is QueueItem & { match: Match } => Boolean(item.match))
  }, [matches, queueItems])

  const activeCourts = courts.filter((court) => court.status === "playing").length
  const queuedMatches = queueWithMatches.length
  const liveMatches = matches.filter((match) => match.status === "live").length
  const completedMatches = matches.filter((match) => match.status === "completed").length

  const handleAssignToFirstCourt = async (matchId: string) => {
    const availableCourt = courts.find((court) => court.status === "idle")
    if (!availableCourt) return

    const previousMatches = matches
    setMatches((prev) =>
      prev.map((match) => (match.id === matchId ? { ...match, courtId: availableCourt.id, status: "assigned" } : match)),
    )

    try {
      await updateMatch(matchId, { courtId: availableCourt.id, status: "assigned" })
      await Promise.all([refreshQueue(), refreshCourts()])
    } catch (error) {
      console.error("Failed to assign court", error)
      setMatches(previousMatches)
    }
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

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
            value={`${activeCourts}/${courts.length}`}
            change={{ value: "+1", trend: "up" }}
            icon={<Play className="h-5 w-5" />}
          />
          <KpiCard
            title="In Queue"
            value={queuedMatches.toString()}
            change={{ value: "-2", trend: "down" }}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            title="Live Matches"
            value={liveMatches.toString()}
            change={{ value: "+1", trend: "up" }}
            icon={<Trophy className="h-5 w-5" />}
          />
          <KpiCard
            title="Completed Today"
            value={completedMatches.toString()}
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
              {courts.map((court) => {
                const assignedMatch = matches.find((match) => match.courtId === court.id)
                return (
                  <CourtCard
                    key={court.id}
                    court={court}
                    assignedMatch={assignedMatch}
                    onAssignMatch={() => console.log(`Assign match to ${court.name}`)}
                    onViewScoreboard={() => console.log(`View scoreboard for ${court.name}`)}
                  />
                )
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <QueuePreview
              queueItems={queueWithMatches}
              onViewFullQueue={() => console.log("View full queue")}
              onAssignToCourt={handleAssignToFirstCourt}
            />
            <AlertsPanel alerts={alerts} onDismissAlert={handleDismissAlert} />
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
