"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Contrast, QrCode, Settings } from "lucide-react"

interface CourtScoreboardProps {
  match: Match
  courtName?: string
  onToggleContrast?: () => void
  onShowQR?: () => void
  className?: string
}

export function CourtScoreboard({
  match,
  courtName = "Court 1",
  onToggleContrast,
  onShowQR,
  className,
}: CourtScoreboardProps) {
  const [highContrast, setHighContrast] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const currentGame = match.games[match.games.length - 1] || {
    seq: 1,
    scoreA: 0,
    scoreB: 0,
    serving: "A" as const,
    timeoutsA: 0,
    timeoutsB: 0,
  }

  const teamAWins = match.games.filter((game) => game.scoreA > game.scoreB).length
  const teamBWins = match.games.filter((game) => game.scoreB > game.scoreA).length

  const getTeamName = (team: any) => {
    return team.name || `${team.players[0]?.firstName} ${team.players[0]?.lastName}` || "Team"
  }

  // Auto-hide controls after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 5000)
    return () => clearTimeout(timer)
  }, [showControls])

  const handleToggleContrast = () => {
    setHighContrast(!highContrast)
    onToggleContrast?.()
  }

  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col relative",
        highContrast ? "bg-black text-white" : "bg-gradient-to-br from-primary/5 to-accent/5",
        className,
      )}
      onClick={() => setShowControls(true)}
    >
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant={highContrast ? "secondary" : "outline"} size="sm" onClick={handleToggleContrast}>
            <Contrast className="h-4 w-4" />
          </Button>
          <Button variant={highContrast ? "secondary" : "outline"} size="sm" onClick={onShowQR}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant={highContrast ? "secondary" : "outline"} size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="text-center py-8">
        <h1 className={cn("text-4xl md:text-6xl font-bold mb-2", highContrast ? "text-white" : "text-foreground")}>
          {courtName}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <Badge variant={highContrast ? "secondary" : "outline"} className="text-lg px-4 py-2">
            Match #{match.number}
          </Badge>
          <Badge variant={highContrast ? "secondary" : "outline"} className="text-lg px-4 py-2">
            Round {match.round}
          </Badge>
          {match.status === "live" && (
            <Badge className="text-lg px-4 py-2 bg-red-500 text-white animate-pulse">LIVE</Badge>
          )}
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="flex-1 flex flex-col justify-center px-8">
        {/* Game Progress */}
        <div className="text-center mb-8">
          <div
            className={cn("text-2xl md:text-4xl font-semibold mb-4", highContrast ? "text-white" : "text-foreground")}
          >
            Game {currentGame.seq}
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className={cn("text-4xl md:text-6xl font-bold", highContrast ? "text-white" : "text-foreground")}>
                {teamAWins}
              </div>
              <div className={cn("text-lg md:text-2xl", highContrast ? "text-gray-300" : "text-muted-foreground")}>
                Games Won
              </div>
            </div>
            <div
              className={cn(
                "text-3xl md:text-5xl font-light",
                highContrast ? "text-gray-400" : "text-muted-foreground",
              )}
            >
              -
            </div>
            <div className="text-center">
              <div className={cn("text-4xl md:text-6xl font-bold", highContrast ? "text-white" : "text-foreground")}>
                {teamBWins}
              </div>
              <div className={cn("text-lg md:text-2xl", highContrast ? "text-gray-300" : "text-muted-foreground")}>
                Games Won
              </div>
            </div>
          </div>
        </div>

        {/* Teams and Current Game Score */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Team A */}
          <div
            className={cn(
              "text-center p-8 rounded-2xl transition-all duration-300",
              currentGame.serving === "A"
                ? highContrast
                  ? "bg-white text-black"
                  : "bg-primary text-primary-foreground shadow-2xl scale-105"
                : highContrast
                  ? "bg-gray-800 text-white"
                  : "bg-card text-card-foreground",
            )}
          >
            <div className="space-y-4">
              {match.teams[0].seed && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xl px-4 py-2",
                    currentGame.serving === "A" && !highContrast && "border-primary-foreground text-primary-foreground",
                  )}
                >
                  #{match.teams[0].seed}
                </Badge>
              )}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {getTeamName(match.teams[0])}
              </h2>
              <div className="text-6xl md:text-8xl lg:text-9xl font-bold font-mono">{currentGame.scoreA}</div>
              {currentGame.serving === "A" && (
                <div
                  className={cn(
                    "text-xl md:text-2xl font-semibold",
                    highContrast ? "text-black" : "text-primary-foreground",
                  )}
                >
                  SERVING
                </div>
              )}
              {/* Timeouts */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-4 h-4 md:w-6 md:h-6 rounded-full border-2",
                      i < currentGame.timeoutsA
                        ? currentGame.serving === "A"
                          ? highContrast
                            ? "bg-black border-black"
                            : "bg-primary-foreground border-primary-foreground"
                          : highContrast
                            ? "bg-white border-white"
                            : "bg-primary border-primary"
                        : currentGame.serving === "A"
                          ? highContrast
                            ? "border-black"
                            : "border-primary-foreground"
                          : highContrast
                            ? "border-gray-400"
                            : "border-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Team B */}
          <div
            className={cn(
              "text-center p-8 rounded-2xl transition-all duration-300",
              currentGame.serving === "B"
                ? highContrast
                  ? "bg-white text-black"
                  : "bg-primary text-primary-foreground shadow-2xl scale-105"
                : highContrast
                  ? "bg-gray-800 text-white"
                  : "bg-card text-card-foreground",
            )}
          >
            <div className="space-y-4">
              {match.teams[1].seed && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xl px-4 py-2",
                    currentGame.serving === "B" && !highContrast && "border-primary-foreground text-primary-foreground",
                  )}
                >
                  #{match.teams[1].seed}
                </Badge>
              )}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {getTeamName(match.teams[1])}
              </h2>
              <div className="text-6xl md:text-8xl lg:text-9xl font-bold font-mono">{currentGame.scoreB}</div>
              {currentGame.serving === "B" && (
                <div
                  className={cn(
                    "text-xl md:text-2xl font-semibold",
                    highContrast ? "text-black" : "text-primary-foreground",
                  )}
                >
                  SERVING
                </div>
              )}
              {/* Timeouts */}
              <div className="flex justify-center gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-4 h-4 md:w-6 md:h-6 rounded-full border-2",
                      i < currentGame.timeoutsB
                        ? currentGame.serving === "B"
                          ? highContrast
                            ? "bg-black border-black"
                            : "bg-primary-foreground border-primary-foreground"
                          : highContrast
                            ? "bg-white border-white"
                            : "bg-primary border-primary"
                        : currentGame.serving === "B"
                          ? highContrast
                            ? "border-black"
                            : "border-primary-foreground"
                          : highContrast
                            ? "border-gray-400"
                            : "border-muted",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <div className={cn("text-lg md:text-2xl", highContrast ? "text-gray-300" : "text-muted-foreground")}>
          Spring Championship 2024
        </div>
      </div>
    </div>
  )
}
