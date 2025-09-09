"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"
import { Shuffle, Upload, Plus } from "lucide-react"

interface BracketBuilderProps {
  onCreateBracket?: (event: Partial<Event>) => void
}

interface TeamEntry {
  id: string
  name: string
  seed?: number
  players: string[]
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
              <Button variant="outline" size="sm">
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
