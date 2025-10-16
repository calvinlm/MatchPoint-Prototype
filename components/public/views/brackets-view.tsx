"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Braces } from "lucide-react"

const BracketCanvas = dynamic(
  () => import("@/components/brackets/bracket-canvas").then((mod) => ({ default: mod.BracketCanvas })),
  { ssr: false },
)

export function BracketsView() {
  const { snapshot, loading } = useLiveTournamentContext()
  const matches = snapshot?.brackets?.matches ?? []

  const memoizedMatches = useMemo(() => matches, [matches])

  return (
    <Card className="h-[70vh]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Braces className="h-5 w-5 text-primary" />
          Bracket Viewer
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {loading ? "Syncing..." : `${matches.length} matches`}
        </Badge>
      </CardHeader>
      <CardContent className="h-full">
        {memoizedMatches.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No bracket matches available.
          </div>
        ) : (
          <BracketCanvas matches={memoizedMatches} className="h-full" />
        )}
      </CardContent>
    </Card>
  )
}
