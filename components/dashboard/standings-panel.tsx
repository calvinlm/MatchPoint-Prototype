"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type StandingRow = {
  rank: number
  players: string
  wins: number
  losses: number
  pa: number
  pl: number
  quotient: number | string
}

export type Bracket = {
  id: string
  name: string
  pool?: string // e.g., "Bracket A"
  standings: StandingRow[]
}

type StandingsPanelProps = {
  brackets: Bracket[]
  defaultBracketId?: string
}

function RankBadge({ rank }: { rank: number }) {
  const label =
    rank === 1 ? "1st" :
    rank === 2 ? "2nd" :
    rank === 3 ? "3rd" : `${rank}th`

  const color =
    rank === 1 ? "bg-emerald-500 text-white" :
    rank === 2 ? "bg-orange-500 text-white" :
    rank === 3 ? "bg-neutral-900 text-white dark:bg-neutral-800" :
    "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50"

  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold",
      color
    )}>
      {label}
    </span>
  )
}

export function StandingsPanel({ brackets, defaultBracketId }: StandingsPanelProps) {
  const initialId = React.useMemo(() => {
    if (defaultBracketId && brackets.some(b => b.id === defaultBracketId)) return defaultBracketId
    return brackets[0]?.id
  }, [defaultBracketId, brackets])

  const [selectedId, setSelectedId] = React.useState<string | undefined>(initialId)
  const selected = React.useMemo(
    () => brackets.find(b => b.id === selectedId) ?? brackets[0],
    [brackets, selectedId]
  )

  if (!selected) {
    return (
      <div className="space-y-3">
        <Select disabled>
          <SelectTrigger className="w-[220px] h-8" />
          <SelectContent />
        </Select>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No brackets available.</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Top-left dropdown */}
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-[220px] h-8">
          <SelectValue placeholder="Select bracket" />
        </SelectTrigger>
        <SelectContent>
          {brackets.map(b => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}{b.pool ? ` — ${b.pool}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Styled card like screenshot: rounded, purple accent, inner pill title */}
      <div className="rounded-3xl p-[3px] bg-gradient-to-r from-indigo-600 to-violet-600">
        <Card className="rounded-[22px]">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4">
              <div className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold text-white bg-indigo-700/90 shadow">
                {selected.name}{selected.pool ? ` ${selected.pool}` : ""}
              </div>
            </div>

            <div className="rounded-2xl border p-2 sm:p-3">
              <ScrollArea className="max-h-[440px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[72px]">Rank</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead className="w-[80px] text-center">Wins</TableHead>
                      <TableHead className="w-[80px] text-center">Losses</TableHead>
                      <TableHead className="w-[80px] text-center">PA</TableHead>
                      <TableHead className="w-[80px] text-center">PL</TableHead>
                      <TableHead className="w-[100px] text-center">Quotient</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.standings.map((row) => (
                      <TableRow key={row.rank}>
                        <TableCell><RankBadge rank={row.rank} /></TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            row.rank === 1 ? "text-emerald-500" :
                            row.rank === 2 ? "text-orange-500" :
                            "text-foreground"
                          )}>
                            {row.players}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-emerald-600">{row.wins}</TableCell>
                        <TableCell className="text-center text-orange-500">{row.losses}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.pa}</TableCell>
                        <TableCell className="text-center text-orange-500">{row.pl}</TableCell>
                        <TableCell className="text-center text-emerald-600">
                          {typeof row.quotient === "number" ? row.quotient.toFixed(2).replace(/\.00$/, "") : row.quotient}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}