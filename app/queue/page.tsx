"use client"

import { useEffect, useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { QueueTable } from "@/components/queue/queue-table"
import { CourtsGrid } from "@/components/queue/courts-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Court, Match, QueueItem, UserRole } from "@/lib/types"
import { useCourts, useMatches, useQueue } from "@/hooks/use-tournament-data"
import { reorderQueue as persistQueueOrder, startMatch as startMatchApi, updateCourt, updateMatch } from "@/lib/api"
import { useSocket } from "@/hooks/use-socket"
import { RefreshCw, Filter, Plus } from "lucide-react"

export default function QueuePage() {
  const userRoles: UserRole[] = ["director"]
  const { data: courts, setData: setCourts, refresh: refreshCourts } = useCourts()
  const { data: matches, setData: setMatches, refresh: refreshMatches } = useMatches()
  const { data: queueItems, setData: setQueueItems, refresh: refreshQueue } = useQueue()
  const [eventFilter, setEventFilter] = useState<string>("all")
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleQueueUpdated = (payload: unknown) => {
      if (Array.isArray(payload)) {
        setQueueItems(payload as (QueueItem & { match?: Match })[])
      }
    }

    const handleMatchUpdated = (payload: unknown) => {
      const match = payload as Match
      if (!match?.id) return
      setMatches((prev) => {
        const index = prev.findIndex((item) => item.id === match.id)
        if (index === -1) return prev
        const next = [...prev]
        next[index] = { ...next[index], ...match }
        return next
      })
    }

    socket.on("queue_updated", handleQueueUpdated)
    socket.on("match_update", handleMatchUpdated)

    return () => {
      socket.off("queue_updated", handleQueueUpdated)
      socket.off("match_update", handleMatchUpdated)
    }
  }, [socket, setMatches, setQueueItems])

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

  const handleAssignCourt = (matchId: string, courtId: string) => {
    const previousMatches = matches
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, courtId, status: "assigned" } : match)))

    void updateMatch(matchId, { courtId, status: "assigned" })
      .then(() => Promise.all([refreshCourts(), refreshQueue()]))
      .catch((error) => {
        console.error("Failed to assign court", error)
        setMatches(previousMatches)
      })
  }

  const handleAssignReferee = (matchId: string) => {
    const newRefereeId = `ref-${Date.now()}`
    const previousMatches = matches
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, refereeId: newRefereeId } : match)))

    void updateMatch(matchId, { refereeId: newRefereeId })
      .then(() => refreshQueue())
      .catch((error) => {
        console.error("Failed to assign referee", error)
        setMatches(previousMatches)
      })
  }

  const handleChangeCourtStatus = (courtId: string, status: Court["status"]) => {
    const previousCourts = courts
    setCourts((prev) => prev.map((court) => (court.id === courtId ? { ...court, status } : court)))

    void updateCourt(courtId, { status })
      .then(() => refreshCourts())
      .catch((error) => {
        console.error("Failed to update court status", error)
        setCourts(previousCourts)
      })
  }

  const handleStartMatch = (matchId: string) => {
    const previousMatches = matches
    const previousQueueItems = queueItems
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, status: "live" as const } : match)))
    setQueueItems((prev) => prev.filter((item) => item.matchId !== matchId))

    void startMatchApi(matchId)
      .then(() => Promise.all([refreshMatches(), refreshQueue(), refreshCourts()]))
      .catch((error) => {
        console.error("Failed to start match", error)
        setMatches(previousMatches)
        setQueueItems(previousQueueItems)
      })
  }

  const handleReorderQueue = (newItems: QueueItem[]) => {
    const previousQueueItems = queueItems
    const normalized = newItems.map((item, index) => ({ ...item, priority: index + 1 }))
    setQueueItems(normalized as (QueueItem & { match?: Match })[])

    void persistQueueOrder(normalized.map((item) => ({ id: item.id, priority: item.priority })))
      .then(() => refreshQueue())
      .catch((error) => {
        console.error("Failed to reorder queue", error)
        setQueueItems(previousQueueItems)
      })
  }

  const activeMatches = matches.filter((m) => m.status === "live").length
  const queuedMatches = queueWithMatches.length
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void Promise.all([refreshCourts(), refreshMatches(), refreshQueue()])
              }}
            >
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
            queueItems={queueWithMatches}
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
            queueItems={queueWithMatches}
            onAssignMatch={handleAssignCourt}
            onViewScoreboard={(courtId) => console.log(`View scoreboard for court ${courtId}`)}
            onChangeCourtStatus={handleChangeCourtStatus}
          />
        </div>
      </div>
    </AppLayout>
  )
}
