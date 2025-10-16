"use client"

import { useState, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TeamScoreCard } from "@/components/scoring/team-score-card"
import { GameSelector } from "@/components/scoring/game-selector"
import { MatchTimer } from "@/components/scoring/match-timer"
import { ScoringActions } from "@/components/scoring/scoring-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserRole, Match, Game } from "@/lib/types"
import { Wifi, WifiOff, AlertCircle, MapPin, Trophy, AlertTriangle } from "lucide-react" // Added AlertTriangle import

// Mock match data
const mockMatch: Match = {
  id: "1",
  number: 101,
  eventId: "1",
  round: 1,
  courtId: "1",
  refereeId: "ref1",
  teams: [
    {
      id: "1",
      players: [
        {
          id: 1,
          name: "John Smith",
          age: 30,
          gender: "MALE",
          address: "",
          contactNumber: "",
          createdAt: "2024-01-01T00:00:00Z",
          firstName: "John",
          lastName: "Smith",
        },
      ],
      eventId: "1",
      seed: 1,
      name: "Team Alpha",
    },
    {
      id: "2",
      players: [
        {
          id: 2,
          name: "Jane Doe",
          age: 28,
          gender: "FEMALE",
          address: "",
          contactNumber: "",
          createdAt: "2024-01-01T00:00:00Z",
          firstName: "Jane",
          lastName: "Doe",
        },
      ],
      eventId: "1",
      seed: 8,
      name: "Team Beta",
    },
  ],
  status: "live",
  games: [{ seq: 1, scoreA: 0, scoreB: 0, serving: "A", timeoutsA: 0, timeoutsB: 0 }],
}

interface ScoringAction {
  id: string
  timestamp: Date
  action: string
  description: string
}

export default function ScoringPage() {
  const userRoles: UserRole[] = ["referee"]
  const [match, setMatch] = useState<Match>(mockMatch)
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [notes, setNotes] = useState("")
  const [actions, setActions] = useState<ScoringAction[]>([])
  const [isOnline] = useState(true)

  const currentGame = match.games[currentGameIndex]
  const bestOf = 3 // This would come from event settings

  const addAction = useCallback((action: string, description: string) => {
    const newAction: ScoringAction = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      description,
    }
    setActions((prev) => [...prev, newAction])
  }, [])

  const handleScoreChange = (side: "A" | "B", delta: number) => {
    setMatch((prev) => {
      const newGames = [...prev.games]
      const game = { ...newGames[currentGameIndex] }

      if (side === "A") {
        game.scoreA = Math.max(0, game.scoreA + delta)
      } else {
        game.scoreB = Math.max(0, game.scoreB + delta)
      }

      newGames[currentGameIndex] = game

      const actionDesc =
        delta > 0
          ? `+${delta} point for Team ${side} (${side === "A" ? game.scoreA : game.scoreB})`
          : `Removed point from Team ${side} (${side === "A" ? game.scoreA : game.scoreB})`

      addAction("Score Change", actionDesc)

      return { ...prev, games: newGames }
    })
  }

  const handleServingChange = (side: "A" | "B") => {
    setMatch((prev) => {
      const newGames = [...prev.games]
      const game = { ...newGames[currentGameIndex] }
      game.serving = side
      newGames[currentGameIndex] = game

      addAction("Serving Change", `Team ${side} now serving`)

      return { ...prev, games: newGames }
    })
  }

  const handleTimeout = (side: "A" | "B") => {
    setMatch((prev) => {
      const newGames = [...prev.games]
      const game = { ...newGames[currentGameIndex] }

      if (side === "A") {
        game.timeoutsA = Math.min(2, game.timeoutsA + 1)
      } else {
        game.timeoutsB = Math.min(2, game.timeoutsB + 1)
      }

      newGames[currentGameIndex] = game

      addAction("Timeout", `Team ${side} called timeout`)

      return { ...prev, games: newGames }
    })
  }

  const handleFault = (side: "A" | "B") => {
    addAction("Fault", `Fault called on Team ${side}`)
  }

  const handleNewGame = () => {
    const newGame: Game = {
      seq: match.games.length + 1,
      scoreA: 0,
      scoreB: 0,
      serving: "A",
      timeoutsA: 0,
      timeoutsB: 0,
    }

    setMatch((prev) => ({
      ...prev,
      games: [...prev.games, newGame],
    }))

    setCurrentGameIndex(match.games.length)
    addAction("New Game", `Started Game ${newGame.seq}`)
  }

  const handleUndo = () => {
    if (actions.length > 0) {
      setActions((prev) => prev.slice(0, -1))
      addAction("Undo", "Last action undone")
    }
  }

  const handleReportScore = () => {
    addAction("Score Report", "Match score submitted")
    console.log("Reporting score:", match)
  }

  const handleDispute = () => {
    addAction("Dispute", "Dispute reported")
    console.log("Dispute reported for match:", match.id)
  }

  const canSubmit = currentGame.scoreA > 0 || currentGame.scoreB > 0
  const canUndo = actions.length > 0

  return (
    <AppLayout userRoles={userRoles} userName="Referee">
      <div className="space-y-4 pb-20">
        {/* Offline Banner */}
        {!isOnline && (
          <Alert className="border-destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>You&apos;re offline. Scores will sync when connection is restored.</AlertDescription>
          </Alert>
        )}

        {/* Match Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Match #{match.number}</Badge>
                  <Badge variant="outline">Round {match.round}</Badge>
                  <Badge className="bg-primary text-primary-foreground">Live</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Men&apos;s Doubles 3.0
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Court {match.courtId}
                  </span>
                  <span className="flex items-center gap-1">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-primary" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-destructive" />
                    )}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MatchTimer />
                <Button variant="outline" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Incident
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Selection */}
        <GameSelector
          games={match.games}
          currentGameIndex={currentGameIndex}
          bestOf={bestOf}
          onGameSelect={setCurrentGameIndex}
          onNewGame={handleNewGame}
        />

        {/* Team Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TeamScoreCard
            team={match.teams[0]}
            side="A"
            currentGame={currentGame}
            isServing={currentGame.serving === "A"}
            onScoreChange={handleScoreChange}
            onServingChange={handleServingChange}
            onTimeout={handleTimeout}
            onFault={handleFault}
          />

          <TeamScoreCard
            team={match.teams[1]}
            side="B"
            currentGame={currentGame}
            isServing={currentGame.serving === "B"}
            onScoreChange={handleScoreChange}
            onServingChange={handleServingChange}
            onTimeout={handleTimeout}
            onFault={handleFault}
          />
        </div>

        {/* Scoring Actions */}
        <ScoringActions
          actions={actions}
          notes={notes}
          onNotesChange={setNotes}
          onUndo={handleUndo}
          onReportScore={handleReportScore}
          onDispute={handleDispute}
          canUndo={canUndo}
          canSubmit={canSubmit}
        />

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:pl-72">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDispute} className="flex-1 bg-transparent">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Dispute
            </Button>
            <Button onClick={handleReportScore} disabled={!canSubmit} className="flex-1">
              Submit Game
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
