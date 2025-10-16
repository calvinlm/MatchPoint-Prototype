"use client"

import { useMemo, type JSX } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Clock,
  MapPin,
  Play,
  Trophy,
  Users,
} from "lucide-react"
import { formatTeamName } from "@/lib/team-display"

const metricIcons: Record<string, JSX.Element> = {
  courts: <Play className="h-5 w-5" />,
  queue: <Clock className="h-5 w-5" />,
  live: <Activity className="h-5 w-5" />,
  completed: <CheckCircle className="h-5 w-5" />,
  players: <Users className="h-5 w-5" />,
  feature: <Trophy className="h-5 w-5" />,
}

const COURT_STATUS: Record<
  string,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  playing: { label: "In Play", variant: "default" },
  idle: { label: "Available", variant: "secondary" },
  hold: { label: "On Hold", variant: "destructive" },
  cleaning: { label: "Cleaning", variant: "outline" },
}

const COURT_STATUS_ORDER = ["playing", "idle", "hold", "cleaning"]

const MS_IN_DAY = 1000 * 60 * 60 * 24

export function OverviewView() {
  const { snapshot, loading } = useLiveTournamentContext()

  const metrics = snapshot?.overview?.metrics ?? []
  const featureMatches = snapshot?.overview?.featureMatches ?? []
  const upcomingMatches = snapshot?.overview?.upcomingMatches ?? []
  const announcements = snapshot?.overview?.announcements ?? []
  const courts = snapshot?.courts ?? snapshot?.queue?.courts ?? []
  const queueItems = snapshot?.queue?.items ?? []

  const metricsWithFallback = useMemo(() => {
    if (metrics.length > 0) {
      return metrics
    }

    return [
      { id: "courts", title: "Courts Active", value: loading ? "—" : "--" },
      { id: "queue", title: "Matches in Queue", value: loading ? "—" : "--" },
      { id: "live", title: "Live Matches", value: loading ? "—" : "--" },
      { id: "completed", title: "Completed Today", value: loading ? "—" : "--" },
    ]
  }, [metrics, loading])

  const eventDateDisplay = useMemo(() => {
    const startDate = snapshot?.event?.startDate ? new Date(snapshot.event.startDate) : null
    const endDate = snapshot?.event?.endDate ? new Date(snapshot.event.endDate) : null

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return undefined
    }

    if (!endDate || Number.isNaN(endDate.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(startDate)
    }

    const sameDay = startDate.toDateString() === endDate.toDateString()
    if (sameDay) {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(startDate)
    }

    if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
      const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long" })
      return `${monthFormatter.format(startDate)} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
  }, [snapshot?.event?.startDate, snapshot?.event?.endDate])

  const dayBadge = useMemo(() => {
    const startDate = snapshot?.event?.startDate ? new Date(snapshot.event.startDate) : null
    const endDate = snapshot?.event?.endDate ? new Date(snapshot.event.endDate) : null

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return undefined
    }

    const today = new Date()
    const normalize = (date: Date) => {
      const copy = new Date(date)
      copy.setHours(0, 0, 0, 0)
      return copy
    }

    const startDay = normalize(startDate)
    const todayDay = normalize(today)
    const totalDays = endDate && !Number.isNaN(endDate.getTime())
      ? Math.max(1, Math.round((normalize(endDate).getTime() - startDay.getTime()) / MS_IN_DAY) + 1)
      : null

    const progress = Math.floor((todayDay.getTime() - startDay.getTime()) / MS_IN_DAY) + 1

    if (progress < 1) {
      return "Tournament Upcoming"
    }

    if (totalDays) {
      if (progress > totalDays) {
        return `Completed • ${totalDays} Day${totalDays === 1 ? "" : "s"}`
      }
      return `Day ${Math.min(progress, totalDays)} of ${totalDays}`
    }

    return `Day ${progress}`
  }, [snapshot?.event?.startDate, snapshot?.event?.endDate])

  const courtLookup = useMemo(() => {
    return courts.reduce<Record<string, string>>((acc, court) => {
      acc[court.id] = court.name
      return acc
    }, {})
  }, [courts])

  const sortedCourts = useMemo(() => {
    const order = COURT_STATUS_ORDER.reduce<Record<string, number>>((acc, key, index) => {
      acc[key] = index
      return acc
    }, {})

    return [...courts].sort((a, b) => {
      const aOrder = order[a.status] ?? order.idle ?? 1
      const bOrder = order[b.status] ?? order.idle ?? 1
      return aOrder - bOrder
    })
  }, [courts])

  const topQueueItems = useMemo(() => queueItems.slice(0, 6), [queueItems])

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {snapshot?.event?.name ?? "Tournament Overview"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {snapshot?.event?.location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {snapshot.event.location}
              </span>
            )}
            {eventDateDisplay && (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {eventDateDisplay}
              </span>
            )}
          </div>
        </div>
        {dayBadge && (
          <Badge variant="outline" className="w-fit text-xs uppercase tracking-wide">
            {dayBadge}
          </Badge>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricsWithFallback.map((metric) => {
          const iconKey = metric.icon ?? metric.id
          const icon = iconKey ? metricIcons[String(iconKey).toLowerCase()] ?? null : null

          return (
            <KpiCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={icon ?? undefined}
            />
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Courts Overview
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {courts.length} courts
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {sortedCourts.length === 0 ? (
                  <div className="col-span-full flex h-48 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
                    No courts configured for this event.
                  </div>
                ) : (
                  sortedCourts.map((court) => {
                    const status = COURT_STATUS[court.status] ?? COURT_STATUS.idle
                    return (
                      <div
                        key={court.id}
                        className="space-y-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{court.name}</p>
                            {court.location && (
                              <p className="text-xs text-muted-foreground">{court.location}</p>
                            )}
                          </div>
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </div>

                        {court.currentMatch ? (
                          <div className="rounded-md bg-muted/40 p-3 text-xs">
                            <p className="font-medium text-muted-foreground">
                              Match #{court.currentMatch.number} • Round {court.currentMatch.round}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatTeamName(court.currentMatch.teams[0])}
                              <span className="text-muted-foreground"> vs </span>
                              {formatTeamName(court.currentMatch.teams[1])}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                            Waiting for assignment
                          </div>
                        )}

                        {court.nextMatch && (
                          <div className="rounded-md bg-muted/20 p-3 text-xs">
                            <p className="font-medium text-muted-foreground">Next up</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatTeamName(court.nextMatch.teams[0])}
                              <span className="text-muted-foreground"> vs </span>
                              {formatTeamName(court.nextMatch.teams[1])}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {featureMatches.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Feature Matches
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {featureMatches.length}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {featureMatches.map((match) => {
                  const lastGame =
                    Array.isArray(match.games) && match.games.length > 0
                      ? match.games[match.games.length - 1]
                      : undefined

                  return (
                    <div
                      key={match.id}
                      className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                        <span>Match #{match.number}</span>
                        <Badge variant="outline">Round {match.round}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatTeamName(match.teams[0])}
                        <span className="text-muted-foreground"> vs </span>
                        {formatTeamName(match.teams[1])}
                      </p>
                      {match.status === "live" && lastGame && (
                        <p className="font-mono text-xs text-primary">
                          Live • {lastGame.scoreA} - {lastGame.scoreB}
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {upcomingMatches.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Upcoming Matches
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Next {Math.min(upcomingMatches.length, 6)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMatches.slice(0, 6).map((match) => (
                  <div key={match.id} className="space-y-1 rounded-lg border border-border/60 bg-card/70 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Match #{match.number}</span>
                      <Badge variant="outline">Round {match.round}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatTeamName(match.teams[0])}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vs {formatTeamName(match.teams[1])}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Match Queue
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {queueItems.length} waiting
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {topQueueItems.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
                  Queue is currently empty.
                </div>
              ) : (
                topQueueItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border border-border/60 bg-card/70 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <Badge variant="outline">Match #{item.match.number}</Badge>
                        <span>Round {item.match.round}</span>
                        {item.match.status === "live" && <Badge className="bg-primary text-primary-foreground">Live</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatTeamName(item.match.teams[0])}
                        <span className="text-muted-foreground"> vs </span>
                        {formatTeamName(item.match.teams[1])}
                      </p>
                      {item.match.courtId ? (
                        <p className="text-xs text-muted-foreground">
                          Assigned to {courtLookup[item.match.courtId] ?? `court ${item.match.courtId}`}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">Awaiting court assignment</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {announcements.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Announcements
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {announcements.length}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcements.map((announcement, index) => (
                  <div
                    key={`${announcement}-${index}`}
                    className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                  >
                    {announcement}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
