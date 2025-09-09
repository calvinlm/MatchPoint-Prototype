"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Court, Match, QueueItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MapPin, Play, Pause, Sparkles, Clock, Monitor, UserCheck, AlertCircle } from "lucide-react"

interface CourtsGridProps {
  courts: Court[]
  matches: Match[]
  queueItems: (QueueItem & { match: Match })[]
  onAssignMatch?: (courtId: string, matchId: string) => void
  onViewScoreboard?: (courtId: string) => void
  onChangeCourtStatus?: (courtId: string, status: Court["status"]) => void
}

const statusConfig = {
  idle: {
    label: "Available",
    color: "bg-muted text-muted-foreground",
    icon: <Clock className="h-4 w-4" />,
  },
  playing: {
    label: "In Play",
    color: "bg-primary text-primary-foreground",
    icon: <Play className="h-4 w-4" />,
  },
  hold: {
    label: "On Hold",
    color: "bg-destructive text-destructive-foreground",
    icon: <Pause className="h-4 w-4" />,
  },
  cleaning: {
    label: "Cleaning",
    color: "bg-accent text-accent-foreground",
    icon: <Sparkles className="h-4 w-4" />,
  },
}

export function CourtsGrid({
  courts,
  matches,
  queueItems,
  onAssignMatch,
  onViewScoreboard,
  onChangeCourtStatus,
}: CourtsGridProps) {
  const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null)

  const getAssignedMatch = (courtId: string) => {
    return matches.find((match) => match.courtId === courtId)
  }

  const getTeamName = (team: any) => {
    return team.name || `${team.players[0]?.firstName} ${team.players[0]?.lastName}` || "TBD"
  }

  const availableMatches = queueItems.filter((item) => !item.match.courtId)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, courtId: string) => {
    e.preventDefault()
    if (draggedMatchId) {
      onAssignMatch?.(courtId, draggedMatchId)
      setDraggedMatchId(null)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Courts ({courts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Courts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courts.map((court) => {
            const assignedMatch = getAssignedMatch(court.id)
            const status = statusConfig[court.status]
            const canAcceptDrop = court.status === "idle" && !assignedMatch

            return (
              <div
                key={court.id}
                onDragOver={canAcceptDrop ? handleDragOver : undefined}
                onDrop={canAcceptDrop ? (e) => handleDrop(e, court.id) : undefined}
                className={cn(
                  "border-2 border-dashed border-transparent rounded-lg transition-colors",
                  canAcceptDrop && draggedMatchId && "border-primary bg-primary/5",
                )}
              >
                <Card className="h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* Court Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{court.name}</h3>
                        {court.location && <p className="text-sm text-muted-foreground">{court.location}</p>}
                      </div>
                      <Select
                        value={court.status}
                        onValueChange={(status) => onChangeCourtStatus?.(court.id, status as Court["status"])}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={cn("text-xs", status.color)}>
                            <div className="flex items-center gap-1">
                              {status.icon}
                              {status.label}
                            </div>
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idle">Available</SelectItem>
                          <SelectItem value="playing">In Play</SelectItem>
                          <SelectItem value="hold">On Hold</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Match Assignment */}
                    {assignedMatch ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Match #{assignedMatch.number}
                            </Badge>
                            <span className="text-xs text-muted-foreground">Round {assignedMatch.round}</span>
                          </div>
                          <p className="font-medium text-sm">
                            {getTeamName(assignedMatch.teams[0])} vs {getTeamName(assignedMatch.teams[1])}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {assignedMatch.refereeId ? (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Referee Assigned
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                No Referee
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewScoreboard?.(court.id)}
                            className="flex-1"
                          >
                            <Monitor className="h-4 w-4 mr-2" />
                            Scoreboard
                          </Button>
                          {court.status === "playing" && (
                            <Button size="sm" variant="outline" onClick={() => onChangeCourtStatus?.(court.id, "hold")}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {court.status === "idle" ? "No match assigned" : "Court unavailable"}
                          </p>
                          {court.status === "idle" && (
                            <p className="text-xs text-muted-foreground mt-1">Drag a match here or use assign button</p>
                          )}
                        </div>

                        {court.status === "idle" && availableMatches.length > 0 && (
                          <Select onValueChange={(matchId) => onAssignMatch?.(court.id, matchId)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign match..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableMatches.slice(0, 5).map((item) => (
                                <SelectItem key={item.match.id} value={item.match.id}>
                                  Match #{item.match.number} - {getTeamName(item.match.teams[0])} vs{" "}
                                  {getTeamName(item.match.teams[1])}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Available Matches for Drag & Drop */}
        {availableMatches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Available Matches</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableMatches.slice(0, 3).map((item) => (
                <div
                  key={item.match.id}
                  draggable
                  onDragStart={() => setDraggedMatchId(item.match.id)}
                  onDragEnd={() => setDraggedMatchId(null)}
                  className={cn(
                    "flex items-center gap-3 p-2 bg-muted/50 rounded cursor-move hover:bg-muted transition-colors",
                    draggedMatchId === item.match.id && "opacity-50",
                  )}
                >
                  <Badge variant="outline" className="text-xs">
                    #{item.match.number}
                  </Badge>
                  <span className="text-sm flex-1 truncate">
                    {getTeamName(item.match.teams[0])} vs {getTeamName(item.match.teams[1])}
                  </span>
                  <span className="text-xs text-muted-foreground">Priority {item.priority}</span>
                </div>
              ))}
              {availableMatches.length > 3 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{availableMatches.length - 3} more matches in queue
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
