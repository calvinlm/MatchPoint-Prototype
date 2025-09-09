"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Match, Team } from "@/lib/types"

interface BracketNodeProps {
  match: Match
  position: { x: number; y: number }
  isWinner?: boolean
  onClick?: () => void
  className?: string
}

export function BracketNode({ match, position, isWinner, onClick, className }: BracketNodeProps) {
  const teamA = match.teams[0]
  const teamB = match.teams[1]

  const getTeamName = (team: Team) => {
    return team.name || `${team.players[0]?.firstName} ${team.players[0]?.lastName}` || "TBD"
  }

  const getTeamScore = (teamIndex: number) => {
    if (match.games.length === 0) return ""
    const latestGame = match.games[match.games.length - 1]
    return teamIndex === 0 ? latestGame.scoreA : latestGame.scoreB
  }

  const isTeamWinner = (teamIndex: number) => {
    return match.winnerTeamId === match.teams[teamIndex]?.id
  }

  return (
    <div className="absolute" style={{ left: position.x, top: position.y }}>
      <Card
        className={cn(
          "w-48 cursor-pointer hover:shadow-md transition-all duration-200",
          isWinner && "ring-2 ring-primary",
          match.status === "live" && "ring-2 ring-chart-3",
          className,
        )}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              R{match.round} • M{match.number}
            </Badge>
            <Badge
              className={cn(
                "text-xs",
                match.status === "live" && "bg-chart-3 text-white",
                match.status === "completed" && "bg-primary text-primary-foreground",
                match.status === "queued" && "bg-muted text-muted-foreground",
              )}
            >
              {match.status}
            </Badge>
          </div>

          <div className="space-y-1">
            {/* Team A */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded text-sm",
                isTeamWinner(0) ? "bg-primary/10 font-semibold" : "bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                {teamA.seed && <span className="text-xs text-muted-foreground">#{teamA.seed}</span>}
                <span className="truncate">{getTeamName(teamA)}</span>
              </div>
              <span className="font-mono text-sm">{getTeamScore(0)}</span>
            </div>

            {/* Team B */}
            <div
              className={cn(
                "flex items-center justify-between p-2 rounded text-sm",
                isTeamWinner(1) ? "bg-primary/10 font-semibold" : "bg-muted/50",
              )}
            >
              <div className="flex items-center gap-2">
                {teamB.seed && <span className="text-xs text-muted-foreground">#{teamB.seed}</span>}
                <span className="truncate">{getTeamName(teamB)}</span>
              </div>
              <span className="font-mono text-sm">{getTeamScore(1)}</span>
            </div>
          </div>

          {match.courtId && <div className="text-xs text-muted-foreground text-center">Court {match.courtId}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
