"use client"

import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableProperties } from "lucide-react"
import { formatTeamName } from "@/lib/team-display"

const statusVariants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  playing: { label: "In Play", variant: "default" },
  idle: { label: "Available", variant: "secondary" },
  hold: { label: "On Hold", variant: "destructive" },
  cleaning: { label: "Cleaning", variant: "outline" },
}

export function CourtBoardView() {
  const { snapshot } = useLiveTournamentContext()
  const tables = snapshot?.tables ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-primary" />
          Courts & Tables
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {tables.length} surfaces
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.length === 0 ? (
            <div className="col-span-full flex h-48 items-center justify-center rounded-lg border border-dashed border-border/60 text-muted-foreground">
              No table assignments available.
            </div>
          ) : (
            tables.map((table) => {
              const status = statusVariants[table.status] ?? statusVariants.idle
              return (
                <div key={table.id} className="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide">{table.label}</p>
                    </div>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  {table.currentMatch ? (
                    <div className="rounded-md bg-muted/40 p-3 text-xs">
                      <p className="font-medium text-muted-foreground">
                        Match #{table.currentMatch.number} • Round {table.currentMatch.round}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatTeamName(table.currentMatch.teams[0])}
                        <span className="text-muted-foreground"> vs </span>
                        {formatTeamName(table.currentMatch.teams[1])}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                      No match assigned
                    </div>
                  )}
                  {table.nextMatch && (
                    <div className="rounded-md bg-muted/20 p-3 text-xs">
                      <p className="font-medium text-muted-foreground">Next Up</p>
                      <p className="mt-1 font-semibold">
                        {formatTeamName(table.nextMatch.teams[0])}
                        <span className="text-muted-foreground"> vs </span>
                        {formatTeamName(table.nextMatch.teams[1])}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
