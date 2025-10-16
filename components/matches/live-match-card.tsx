"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MapPin, Clock, User, Eye, Gamepad2, AlertCircle } from "lucide-react"

interface LiveMatchCardProps {
  match: Match & {
    eventName?: string
    refereeName?: string
    duration?: string
  }
  onViewScoreboard?: () => void
  onTakeControl?: () => void
  onReportIssue?: () => void
  className?: string
}

export function LiveMatchCard({
  match,
  onViewScoreboard,
  onTakeControl,
  onReportIssue,
  className,
}: LiveMatchCardProps) {
  const currentGame = match.games[match.games.length - 1]
  const gameNumber = match.games.length
  const bestOf = 3 // This would come from event settings

  const getTeamName = (teamIndex: number) => {
    const team = match.teams[teamIndex]
    return team?.name || `${team?.players[0]?.firstName} ${team?.players[0]?.lastName}` || `Team ${teamIndex + 1}`
  }

  const getMatchProgress = () => {
    return `Game ${gameNumber} of ${bestOf}`
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Match Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Match #{match.number}
              </Badge>
              <Badge className="bg-chart-3 text-white animate-pulse">LIVE</Badge>
            </div>
            <h3 className="font-semibold text-sm">{match.eventName || "Tournament Match"}</h3>
            <p className="text-xs text-muted-foreground">{getMatchProgress()}</p>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Court {match.courtId}
            </div>
            {match.duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {match.duration}
              </div>
            )}
          </div>
        </div>

        {/* Score Display */}
        <div className="space-y-3">
          {/* Team A */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  currentGame?.serving === "A" ? "bg-primary animate-pulse" : "bg-muted",
                )}
              />
              <div>
                <p className="font-medium text-sm">{getTeamName(0)}</p>
                <p className="text-xs text-muted-foreground">
                  {match.teams[0]?.players.map((p) => `${p.firstName} ${p.lastName}`).join(" & ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentGame?.scoreA || 0}</div>
              <div className="text-xs text-muted-foreground">Timeouts: {currentGame?.timeoutsA || 0}/2</div>
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  currentGame?.serving === "B" ? "bg-primary animate-pulse" : "bg-muted",
                )}
              />
              <div>
                <p className="font-medium text-sm">{getTeamName(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {match.teams[1]?.players.map((p) => `${p.firstName} ${p.lastName}`).join(" & ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentGame?.scoreB || 0}</div>
              <div className="text-xs text-muted-foreground">Timeouts: {currentGame?.timeoutsB || 0}/2</div>
            </div>
          </div>
        </div>

        {/* Referee Info */}
        {match.refereeName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            Referee: {match.refereeName}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewScoreboard} className="flex-1 bg-transparent">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onTakeControl} className="flex-1 bg-transparent">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Score
          </Button>
          <Button variant="outline" size="sm" onClick={onReportIssue}>
            <AlertCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
