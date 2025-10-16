"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Team } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getPlayerDisplayName, getTeamDisplayName } from "@/lib/player"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StandingsEntry extends Team {
  position: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  lastResult?: "win" | "loss"
  streak: number
  streakType: "win" | "loss"
}

interface StandingsTableProps {
  entries: StandingsEntry[]
  eventName: string
  className?: string
}

export function StandingsTable({ entries, eventName, className }: StandingsTableProps) {
  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-500 text-yellow-50">1st</Badge>
    if (position === 2) return <Badge className="bg-gray-400 text-gray-50">2nd</Badge>
    if (position === 3) return <Badge className="bg-amber-600 text-amber-50">3rd</Badge>
    return <Badge variant="outline">{position}</Badge>
  }

  const getStreakIcon = (streakType: "win" | "loss") => {
    if (streakType === "win") return <TrendingUp className="h-3 w-3 text-primary" />
    if (streakType === "loss") return <TrendingDown className="h-3 w-3 text-destructive" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  const getTeamInitials = (team: StandingsEntry) => {
    if (team.name) {
      return team.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    const initials = team.players
      .map((player) => {
        const name = getPlayerDisplayName(player)
        return name === "TBD" ? "" : name[0]?.toUpperCase() ?? ""
      })
      .filter(Boolean)
      .join("")

    return initials || "TM"
  }

  const getWinPercentage = (wins: number, losses: number) => {
    const total = wins + losses
    if (total === 0) return 0
    return Math.round((wins / total) * 100)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {eventName}
          </CardTitle>
          <Badge variant="outline">{entries.length} Teams</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-medium">Rank</th>
                <th className="p-3 font-medium">Team</th>
                <th className="p-3 font-medium text-center">W-L</th>
                <th className="p-3 font-medium text-center">Win %</th>
                <th className="p-3 font-medium text-center">PF</th>
                <th className="p-3 font-medium text-center">PA</th>
                <th className="p-3 font-medium text-center">Diff</th>
                <th className="p-3 font-medium text-center">Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn("border-b hover:bg-muted/50 transition-colors", index < 3 && "bg-primary/5")}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">{getPositionBadge(entry.position)}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getTeamInitials(entry)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{getTeamDisplayName(entry)}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.players
                            .map((player) => getPlayerDisplayName(player))
                            .filter((name) => name !== "TBD")
                            .join(" & ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm">
                      {entry.wins}-{entry.losses}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm">{getWinPercentage(entry.wins, entry.losses)}%</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm">{entry.pointsFor}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-sm">{entry.pointsAgainst}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={cn(
                        "font-mono text-sm",
                        entry.pointDifferential > 0
                          ? "text-primary"
                          : entry.pointDifferential < 0
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {entry.pointDifferential > 0 ? "+" : ""}
                      {entry.pointDifferential}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStreakIcon(entry.streakType)}
                      <span className="font-mono text-sm">{entry.streak}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
