"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Team } from "@/lib/types"
import { Users, Trophy, Calendar, MoreHorizontal } from "lucide-react"

interface TeamCardProps {
  team: Team & {
    eventName?: string
    record?: { wins: number; losses: number }
    lastMatch?: Date
  }
  onViewMatches?: () => void
  onManageTeam?: () => void
}

export function TeamCard({ team, onViewMatches, onManageTeam }: TeamCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{team.name || "My Team"}</CardTitle>
            <p className="text-sm text-muted-foreground">{team.eventName}</p>
          </div>
          {team.seed && <Badge variant="outline">Seed #{team.seed}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Players */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Players
          </h4>
          <div className="space-y-2">
            {team.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(`${player.firstName} ${player.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {player.firstName} {player.lastName}
                  </p>
                  {player.rating && <p className="text-xs text-muted-foreground">Rating: {player.rating}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record */}
        {team.record && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Record
            </h4>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-primary font-medium">{team.record.wins}W</span>
              <span className="text-destructive font-medium">{team.record.losses}L</span>
              <span className="text-muted-foreground">{team.record.wins + team.record.losses} total</span>
            </div>
          </div>
        )}

        {/* Last Match */}
        {team.lastMatch && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last match: {team.lastMatch.toLocaleDateString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onViewMatches} className="flex-1 bg-transparent">
            View Matches
          </Button>
          <Button variant="outline" size="sm" onClick={onManageTeam}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
