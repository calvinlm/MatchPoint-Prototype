"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Team, Game } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getPlayerDisplayName, getTeamDisplayName } from "@/lib/player"
import { Plus, Minus, Zap, Clock } from "lucide-react"

interface TeamScoreCardProps {
  team: Team
  side: "A" | "B"
  currentGame: Game
  isServing: boolean
  onScoreChange: (side: "A" | "B", delta: number) => void
  onServingChange: (side: "A" | "B") => void
  onTimeout: (side: "A" | "B") => void
  onFault: (side: "A" | "B") => void
  disabled?: boolean
  className?: string
}

export function TeamScoreCard({
  team,
  side,
  currentGame,
  isServing,
  onScoreChange,
  onServingChange,
  onTimeout,
  onFault,
  disabled = false,
  className,
}: TeamScoreCardProps) {
  const score = side === "A" ? currentGame.scoreA : currentGame.scoreB
  const timeouts = side === "A" ? currentGame.timeoutsA : currentGame.timeoutsB
  const maxTimeouts = 2 // Standard pickleball rule

  const getPlayerNames = () => {
    return team.players
      .map((player) => getPlayerDisplayName(player))
      .filter((name) => name !== "TBD")
      .join(" & ")
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isServing && "ring-2 ring-primary shadow-lg",
        disabled && "opacity-50",
        className,
      )}
    >
      <CardContent className="p-4 space-y-4">
        {/* Team Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {team.seed && (
              <Badge variant="outline" className="text-xs">
                #{team.seed}
              </Badge>
            )}
            <h3 className="font-bold text-lg">{getTeamDisplayName(team)}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{getPlayerNames()}</p>

          {/* Serving Indicator */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={isServing ? "default" : "outline"}
              size="sm"
              onClick={() => onServingChange(side)}
              disabled={disabled}
              className={cn("text-xs", isServing && "bg-primary text-primary-foreground")}
            >
              {isServing ? "SERVING" : "Receiving"}
            </Button>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-foreground mb-2">{score}</div>

          {/* Score Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onScoreChange(side, -1)}
              disabled={disabled || score === 0}
              className="w-12 h-12 rounded-full"
            >
              <Minus className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={() => onScoreChange(side, 1)}
              disabled={disabled}
              className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Timeouts */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Timeouts:</span>
          <div className="flex gap-1">
            {Array.from({ length: maxTimeouts }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full border-2",
                  i < timeouts ? "bg-accent border-accent" : "border-muted",
                )}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTimeout(side)}
            disabled={disabled || timeouts >= maxTimeouts}
            className="ml-2"
          >
            <Clock className="h-4 w-4 mr-1" />
            Timeout
          </Button>
        </div>

        {/* Fault Button */}
        <div className="flex justify-center">
          <Button variant="destructive" size="sm" onClick={() => onFault(side)} disabled={disabled} className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            Fault
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
