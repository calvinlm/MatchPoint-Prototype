"use client"

import { useMemo } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, MapPin } from "lucide-react"
import { formatTeamName } from "@/lib/team-display"

export function QueueView() {
  const { snapshot } = useLiveTournamentContext()
  const queueItems = snapshot?.queue?.items ?? []
  const courts = snapshot?.queue?.courts ?? snapshot?.courts ?? []

  const queueWithCourts = useMemo(() => {
    if (queueItems.length === 0) return []
    return queueItems.map((item) => {
      const assignedCourt = item.match.courtId
        ? courts.find((court) => court.id === item.match.courtId)
        : undefined
      return { ...item, assignedCourt }
    })
  }, [queueItems, courts])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Live Queue
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {queueItems.length} matches waiting
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <div className="divide-y divide-border/60">
              {queueWithCourts.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Queue is currently empty.
                </div>
              ) : (
                queueWithCourts.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <Badge variant="outline">Match #{item.match.number}</Badge>
                        <span>Round {item.match.round}</span>
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {formatTeamName(item.match.teams[0])}
                        <span className="text-muted-foreground"> vs </span>
                        {formatTeamName(item.match.teams[1])}
                      </div>
                      {item.assignedCourt ? (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          Assigned to {item.assignedCourt.name}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-destructive">Awaiting court assignment</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Court Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {(courts ?? []).map((court) => (
            <div
              key={court.id}
              className="rounded-lg border border-border/70 bg-background/70 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{court.name}</p>
                  {court.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {court.location}
                    </p>
                  )}
                </div>
                <Badge
                  className="text-xs"
                  variant={
                    court.status === "playing"
                      ? "default"
                      : court.status === "idle"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {court.status === "playing"
                    ? "In Play"
                    : court.status === "idle"
                      ? "Available"
                      : court.status === "hold"
                        ? "On Hold"
                        : "Cleaning"}
                </Badge>
              </div>
              {court.currentMatch && (
                <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs">
                  <p className="font-medium text-muted-foreground">
                    Match #{court.currentMatch.number} • Round {court.currentMatch.round}
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatTeamName(court.currentMatch.teams[0])}
                    <span className="text-muted-foreground"> vs </span>
                    {formatTeamName(court.currentMatch.teams[1])}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
