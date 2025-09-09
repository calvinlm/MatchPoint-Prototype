"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Court, Match } from "@/lib/types"
import { Play, Pause, Sparkles } from "lucide-react"

interface CourtCardProps {
  court: Court
  assignedMatch?: Match
  onAssignMatch?: () => void
  onViewScoreboard?: () => void
}

const statusConfig = {
  idle: {
    label: "Available",
    color: "bg-muted text-muted-foreground",
    icon: null,
  },
  playing: {
    label: "In Play",
    color: "bg-primary text-primary-foreground",
    icon: <Play className="h-3 w-3" />,
  },
  hold: {
    label: "On Hold",
    color: "bg-destructive text-destructive-foreground",
    icon: <Pause className="h-3 w-3" />,
  },
  cleaning: {
    label: "Cleaning",
    color: "bg-accent text-accent-foreground",
    icon: <Sparkles className="h-3 w-3" />,
  },
}

export function CourtCard({ court, assignedMatch, onAssignMatch, onViewScoreboard }: CourtCardProps) {
  const status = statusConfig[court.status]

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{court.name}</h3>
          <Badge className={cn("text-xs", status.color)}>
            <div className="flex items-center gap-1">
              {status.icon}
              {status.label}
            </div>
          </Badge>
        </div>

        {court.location && <p className="text-sm text-muted-foreground">{court.location}</p>}

        {assignedMatch ? (
          <div className="space-y-2">
            <div className="text-sm">
              <p className="font-medium text-foreground">Match #{assignedMatch.number}</p>
              <p className="text-muted-foreground">
                {assignedMatch.teams[0].name || `Team ${assignedMatch.teams[0].players[0]?.firstName}`} vs{" "}
                {assignedMatch.teams[1].name || `Team ${assignedMatch.teams[1].players[0]?.firstName}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onViewScoreboard} className="flex-1 bg-transparent">
                Scoreboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No match assigned</p>
            <Button size="sm" onClick={onAssignMatch} className="w-full" disabled={court.status !== "idle"}>
              Assign Match
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
