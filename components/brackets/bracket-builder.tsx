"use client"

import { useCallback, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"
import { Shuffle, Upload, Plus } from "lucide-react"
import { useCsvImport } from "@/hooks/use-csv-import"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://matchpoint-prototype.onrender.com"

interface BracketBuilderProps {
  onCreateBracket?: (event: Partial<Event>) => void
}

interface TeamEntry {
  id: string
  name: string
  seed?: number
  players: string[]
}

type TeamImportFieldKey = "teamName" | "players" | "seed"
type TeamImportRow = {
  teamName: string
  players: string[]
  seed?: number
}

export function BracketBuilder({ onCreateBracket }: BracketBuilderProps) {
  const [eventData, setEventData] = useState<Partial<Event>>({
    format: "singleElim",
    bestOf: 3,
    gameTo: 11,
    winBy: 2,
  })

  const [teams, setTeams] = useState<TeamEntry[]>([
    { id: "1", name: "Team Alpha", players: ["John Smith", "Jane Doe"], seed: 1 },
    { id: "2", name: "Team Beta", players: ["Mike Johnson", "Sarah Wilson"], seed: 2 },
    { id: "3", name: "Team Gamma", players: ["Chris Brown", "Lisa Davis"], seed: 3 },
    { id: "4", name: "Team Delta", players: ["Alex Miller", "Emma Taylor"], seed: 4 },
  ])

  const teamImportFields = useMemo(
    () => [
      {
        key: "teamName" as const,
        label: "Team name",
        description: "Required. The name that will appear on the bracket.",
        required: true,
      },
      {
        key: "players" as const,
        label: "Players",
        description:
          "Required. Separate multiple player names with commas, slashes, or ampersands (e.g. \"Jane Doe & John Doe\").",
        required: true,
      },
      {
        key: "seed" as const,
        label: "Seed",
        description: "Optional numeric seed used when ordering teams in the bracket.",
      },
    ],
    []
  )

  const teamTemplateDescription = useMemo(
    () => (
      <div className="space-y-2">
        <p>
          Recommended headers include{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Team Name</code>,{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Players</code>, and{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Seed</code>.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Team Name</strong> should be unique within the event.</li>
          <li>
            <strong>Players</strong> accepts one or more names. Use separators like commas, slashes, or ampersands to
            keep partners together.
          </li>
          <li>
            <strong>Seed</strong> is optional; if omitted we will maintain the upload order.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          The column mapping you choose is stored locally so repeat imports go faster.
        </p>
      </div>
    ),
    []
  )

  const transformTeamRow = useCallback(
    ({ row, mapping }: { row: Record<string, string>; mapping: Record<TeamImportFieldKey, string | null> }) => {
      const readValue = (field: TeamImportFieldKey) => {
        const column = mapping[field]
        if (!column) return ""
        const value = row[column]
        if (value == null) return ""
        return String(value).trim()
      }

      const errors: string[] = []
      const teamName = readValue("teamName")
      const playersValue = readValue("players")
      const seedValue = readValue("seed")

      if (!teamName) {
        errors.push("Team name is required.")
      }

      const players = playersValue
        ? playersValue
            .split(/[,&/;]+/)
            .map((name) => name.trim())
            .filter(Boolean)
        : []

      if (!players.length) {
        errors.push("List at least one player name for each team.")
      }

      let seedNumber: number | undefined
      if (seedValue) {
        const numericSeed = Number(seedValue)
        if (!Number.isFinite(numericSeed)) {
          errors.push(`Seed must be numeric (received "${seedValue}").`)
        } else {
          seedNumber = numericSeed
        }
      }

      const data: TeamImportRow = {
        teamName,
        players,
      }

      if (seedNumber !== undefined) {
        data.seed = seedNumber
      }

      return {
        data: errors.length ? undefined : data,
        errors,
      }
    },
    []
  )

  const handleTeamImportSubmit = useCallback(
    async (rows: TeamImportRow[]) => {
      const res = await fetch(`${API_BASE}/api/teams/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teams: rows }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || "Failed to import teams.")
      }

      let updatedFromResponse = false
      const timestamp = Date.now()

      try {
        const json = await res.json()
        const adaptResponse = (source: any, index: number): TeamEntry => {
          const playerList = Array.isArray(source?.players)
            ? source.players
                .map((player: any) =>
                  typeof player === "string" ? player.trim() : (player?.name ?? "")
                )
                .filter(Boolean)
            : []
          const fallbackPlayers = rows[index]?.players ?? []
          return {
            id: String(source?.id ?? source?.teamId ?? `${timestamp}-${index}`),
            name: String(source?.name ?? source?.teamName ?? rows[index]?.teamName ?? `Team ${index + 1}`),
            players: playerList.length ? playerList : fallbackPlayers,
            seed:
              typeof source?.seed === "number"
                ? source.seed
                : rows[index]?.seed ?? index + 1,
          }
        }

        if (Array.isArray(json)) {
          setTeams(json.map((item, index) => adaptResponse(item, index)))
          updatedFromResponse = true
        } else if (json && Array.isArray(json.teams)) {
          setTeams(json.teams.map((item: any, index: number) => adaptResponse(item, index)))
          updatedFromResponse = true
        }
      } catch (err) {
        console.warn("Bulk team import did not return JSON", err)
      }

      if (!updatedFromResponse) {
        setTeams(
          rows.map((row, index) => ({
            id: `${timestamp}-${index}`,
            name: row.teamName,
            players: row.players,
            seed: row.seed ?? index + 1,
          }))
        )
      }

      const count = rows.length
      return {
        message: `Imported ${count} team${count === 1 ? "" : "s"}.`,
      }
    },
    [setTeams]
  )

  const {
    triggerImport: triggerTeamImport,
    FileInput: teamFileInput,
    ImportDialog: teamImportDialog,
  } = useCsvImport<TeamImportFieldKey, TeamImportRow>({
    contextKey: "teams",
    fields: teamImportFields,
    transformRow: ({ row, mapping }) => transformTeamRow({ row, mapping }),
    onSubmit: handleTeamImportSubmit,
    templateDescription: teamTemplateDescription,
    title: "Import teams",
    description: "Review team assignments before bulk importing them into the event.",
  })

  const teamImportElements = (
    <>
      {teamFileInput}
      {teamImportDialog}
    </>
  )

  const handleShuffle = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5)
    shuffled.forEach((team, index) => {
      team.seed = index + 1
    })
    setTeams(shuffled)
  }

  const handleAddTeam = () => {
    const newTeam: TeamEntry = {
      id: Date.now().toString(),
      name: `Team ${teams.length + 1}`,
      players: ["Player 1", "Player 2"],
      seed: teams.length + 1,
    }
    setTeams([...teams, newTeam])
  }

  return (
    <div className="space-y-6">
      {teamImportElements}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={eventData.format}
                onValueChange={(value) => setEventData({ ...eventData, format: value as Event["format"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singleElim">Single Elimination</SelectItem>
                  <SelectItem value="doubleElim">Double Elimination</SelectItem>
                  <SelectItem value="roundRobin">Round Robin</SelectItem>
                  <SelectItem value="poolPlay">Pool Play</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bestOf">Best Of</Label>
              <Select
                value={eventData.bestOf?.toString()}
                onValueChange={(value) => setEventData({ ...eventData, bestOf: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Best of 1</SelectItem>
                  <SelectItem value="3">Best of 3</SelectItem>
                  <SelectItem value="5">Best of 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameTo">Game To</Label>
              <Select
                value={eventData.gameTo?.toString()}
                onValueChange={(value) => setEventData({ ...eventData, gameTo: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">11 Points</SelectItem>
                  <SelectItem value="15">15 Points</SelectItem>
                  <SelectItem value="21">21 Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="winBy">Win By</Label>
              <Select
                value={eventData.winBy?.toString()}
                onValueChange={(value) => setEventData({ ...eventData, winBy: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Win by 1</SelectItem>
                  <SelectItem value="2">Win by 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Teams & Seeding ({teams.length} teams)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShuffle}>
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
              <Button variant="outline" size="sm" onClick={triggerTeamImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="seeding" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seeding">Seeding</TabsTrigger>
              <TabsTrigger value="pools">Pool Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="seeding" className="space-y-3">
              <div className="grid gap-3">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="w-12 justify-center">
                      #{team.seed}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.players.join(" & ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => {
                          const newTeams = [...teams]
                          ;[newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]]
                          newTeams.forEach((t, i) => (t.seed = i + 1))
                          setTeams(newTeams)
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === teams.length - 1}
                        onClick={() => {
                          const newTeams = [...teams]
                          ;[newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]]
                          newTeams.forEach((t, i) => (t.seed = i + 1))
                          setTeams(newTeams)
                        }}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pools" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>Pool balancing will be available for Pool Play format</p>
                <p className="text-sm">Switch to Pool Play format to configure pools</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {eventData.format === "singleElim" &&
            `${Math.ceil(Math.log2(teams.length))} rounds, ${teams.length - 1} matches`}
          {eventData.format === "doubleElim" &&
            `${Math.ceil(Math.log2(teams.length)) + 1} rounds, ${(teams.length - 1) * 2} matches`}
          {eventData.format === "roundRobin" &&
            `${teams.length - 1} rounds, ${(teams.length * (teams.length - 1)) / 2} matches`}
        </div>
        <Button size="lg" onClick={() => onCreateBracket?.(eventData)}>
          Create Bracket
        </Button>
      </div>
    </div>
  )
}
