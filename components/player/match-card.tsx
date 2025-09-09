"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Clock, MapPin, Trophy, CheckCircle, Calendar, Users } from "lucide-react"

interface MatchCardProps {
  match: Match & {
    eventName?: string
    estimatedTime?: Date
    opponent?: {
      name: string
      players: string[]
      seed?: number
    }
  }
  type: "upcoming" | "completed"
  onCheckIn?: () => void
  onViewResult?: () => void
  className?: string
}

export function MatchCard({ match, type, onCheckIn, onViewResult, className }: MatchCardProps) {
  const isUpcoming = type === "upcoming"
  const hasResult = match.winnerTeamId !== undefined

  const getMatchResult = () => {
    if (!hasResult) return null
    const isWinner = match.winnerTeamId === match.teams[0].id // Assuming current player is team 0
    return isWinner ? "Won" : "Lost"
  }

  const getScoreDisplay = () => {
    if (match.games.length === 0) return "TBD"
    return match.games.map((game) => `${game.scoreA}-${game.scoreB}`).join(", ")
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Match Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Match #{match.number}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Round {match.round}
              </Badge>
              {hasResult && (
                <Badge
                  className={cn(
                    "text-xs",
                    getMatchResult() === "Won"
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-destructive-foreground",
                  )}
                >
                  {getMatchResult()}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-foreground">{match.eventName || "Tournament Match"}</h3>
          </div>

          {match.status === "live" && <Badge className="bg-chart-3 text-white animate-pulse">LIVE</Badge>}
        </div>

        {/* Opponent Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">vs {match.opponent?.name || "TBD"}</span>
            {match.opponent?.seed && (
              <Badge variant="outline" className="text-xs">
                #{match.opponent.seed}
              </Badge>
            )}
          </div>
          {match.opponent?.players && (
            <p className="text-sm text-muted-foreground ml-6">{match.opponent.players.join(" & ")}</p>
          )}
        </div>

        {/* Match Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {isUpcoming ? (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {match.estimatedTime
                    ? `Est. ${match.estimatedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Time TBD"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{match.courtId ? `Court ${match.courtId}` : "Court TBD"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span>Score: {getScoreDisplay()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{match.endedAt?.toLocaleDateString() || "Recently"}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isUpcoming ? (
            <>
              {match.status === "assigned" && (
                <Button size="sm" onClick={onCheckIn} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I'm Here
                </Button>
              )}
              {match.status === "queued" && (
                <Button variant="outline" size="sm" disabled className="flex-1 bg-transparent">
                  <Clock className="h-4 w-4 mr-2" />
                  In Queue
                </Button>
              )}
              {match.status === "live" && (
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Trophy className="h-4 w-4 mr-2" />
                  Watch Live
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onViewResult} className="flex-1 bg-transparent">
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
