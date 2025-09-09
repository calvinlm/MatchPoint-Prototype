"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Game } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GameSelectorProps {
  games: Game[]
  currentGameIndex: number
  bestOf: number
  onGameSelect: (index: number) => void
  onNewGame: () => void
  disabled?: boolean
}

export function GameSelector({
  games,
  currentGameIndex,
  bestOf,
  onGameSelect,
  onNewGame,
  disabled = false,
}: GameSelectorProps) {
  const gamesNeededToWin = Math.ceil(bestOf / 2)
  const teamAWins = games.filter((game) => game.scoreA > game.scoreB).length
  const teamBWins = games.filter((game) => game.scoreB > game.scoreA).length

  const isMatchComplete = teamAWins >= gamesNeededToWin || teamBWins >= gamesNeededToWin
  const canAddGame = games.length < bestOf && !isMatchComplete

  return (
    <div className="space-y-4">
      {/* Match Progress */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Best of {bestOf} Games</h3>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{teamAWins}</div>
            <div className="text-xs text-muted-foreground">Team A</div>
          </div>
          <div className="text-muted-foreground">-</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{teamBWins}</div>
            <div className="text-xs text-muted-foreground">Team B</div>
          </div>
        </div>
        {isMatchComplete && <Badge className="mt-2 bg-primary text-primary-foreground">Match Complete</Badge>}
      </div>

      {/* Game Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {games.map((game, index) => {
          const isActive = index === currentGameIndex
          const isComplete = game.scoreA > 0 || game.scoreB > 0
          const winner = game.scoreA > game.scoreB ? "A" : game.scoreB > game.scoreA ? "B" : null

          return (
            <Button
              key={index}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onGameSelect(index)}
              disabled={disabled}
              className={cn(
                "min-w-20",
                isActive && "bg-primary text-primary-foreground",
                winner === "A" && !isActive && "border-primary/50",
                winner === "B" && !isActive && "border-accent/50",
              )}
            >
              <div className="text-center">
                <div className="text-xs">Game {index + 1}</div>
                {isComplete && (
                  <div className="text-xs font-mono">
                    {game.scoreA}-{game.scoreB}
                  </div>
                )}
              </div>
            </Button>
          )
        })}

        {/* Add New Game Button */}
        {canAddGame && (
          <Button variant="dashed" size="sm" onClick={onNewGame} disabled={disabled} className="min-w-20 border-dashed">
            <div className="text-center">
              <div className="text-xs">Game {games.length + 1}</div>
              <div className="text-xs text-muted-foreground">New</div>
            </div>
          </Button>
        )}
      </div>
    </div>
  )
}
