"use client"

import { useMemo } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users } from "lucide-react"
import { formatPlayerName } from "@/lib/team-display"

export function PlayersView() {
  const { snapshot } = useLiveTournamentContext()
  const players = snapshot?.players ?? []

  const groupedPlayers = useMemo(() => {
    const grouped: Record<string, typeof players> = {}
    players.forEach((player) => {
      const groupKey = player.division ?? "All Players"
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(player)
    })
    return grouped
  }, [players])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Player Directory
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {players.length} players
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[70vh]">
          <div className="divide-y divide-border/60">
            {Object.entries(groupedPlayers).map(([division, divisionPlayers]) => (
              <div key={division} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {division}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {divisionPlayers.length}
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {divisionPlayers.map((player) => {
                    const displayName = formatPlayerName(player)
                    const initials = displayName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "?"
                    return (
                      <div key={player.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 p-3 shadow-sm">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.skill ? `${player.skill} • ` : ""}
                            {player.gender?.toLowerCase()}
                            {player.age ? ` • ${player.age}` : ""}
                          </p>
                          {player.hometown && (
                            <p className="text-xs text-muted-foreground">{player.hometown}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
