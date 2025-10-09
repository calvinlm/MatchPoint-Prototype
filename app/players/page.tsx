"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PlayerCard } from "@/components/players/player-card"
import { TeamCard } from "@/components/players/team-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Player, Team } from "@/lib/types"
import { Search, UserPlus, Users, Download, Upload } from "lucide-react"

// 🔹 TEMPORARY mock teams (keep until team feature backend is ready)
const mockTeams: (Team & {
  eventName?: string
  seed?: number
})[] = [
  {
    id: "1",
    players: [
      { id: "1", name: "John Smith" } as unknown as Player,
      { id: "2", name: "Jane Doe" } as unknown as Player,
    ],
    eventId: "1",
    eventName: "Men's Doubles",
    seed: 1,
  },
  {
    id: "2",
    players: [
      { id: "3", name: "Mike Johnson" } as unknown as Player,
      { id: "4", name: "Sarah Wilson" } as unknown as Player,
    ],
    eventId: "2",
    eventName: "Women's Doubles",
    seed: 2,
  },
]

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080"

export default function PlayersPage() {
  const userRoles: UserRole[] = ["director"]
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔹 Fetch players from backend
  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch(`${API_BASE}/api/players`)
        if (!res.ok) throw new Error("Failed to fetch players.")
        const data = await res.json()
        setPlayers(data)
      } catch (err: any) {
        console.error("Error fetching players:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadPlayers()
  }, [])

  // 🔹 Filters for players
  const filteredPlayers = players.filter((player) =>
    player.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditPlayer = (id: string) => console.log(`[v1] Edit player ${id}`)
  const handleDeletePlayer = (id: string) => console.log(`[v1] Delete player ${id}`)
  const handleToggleCheckIn = (id: string) => console.log(`[v1] Toggle check-in ${id}`)
  const handleEditTeam = (id: string) => console.log(`[v1] Edit team ${id}`)
  const handleDeleteTeam = (id: string) => console.log(`[v1] Delete team ${id}`)
  const handleAddPlayerToTeam = (id: string) => console.log(`[v1] Add player to team ${id}`)

  const totalPlayers = players.length

  if (loading) {
    return (
      <AppLayout userRoles={userRoles} userName="Tournament Director">
        <div className="p-10 text-muted-foreground">Loading players...</div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout userRoles={userRoles} userName="Tournament Director">
        <div className="p-10 text-red-600">Error: {error}</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Players & Teams</h1>
            <p className="text-muted-foreground">Manage tournament participants and team assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Check-in Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="not-checked-in">Not Checked In</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">{totalPlayers} Total Players</Badge>
          <Badge variant="outline">{mockTeams.length} Teams (mock)</Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams (Mock)</TabsTrigger>
          </TabsList>

          {/* 🔹 Real Players */}
          <TabsContent value="players" className="space-y-4">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No players found</h3>
                <p className="text-muted-foreground">Try adjusting your search or add new players</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onEdit={handleEditPlayer}
                    onDelete={handleDeletePlayer}
                    onToggleCheckIn={handleToggleCheckIn}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 🔹 Mock Teams (temporary) */}
          <TabsContent value="teams" className="space-y-4">
            {mockTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground">Team feature coming soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                    onAddPlayer={handleAddPlayerToTeam}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
