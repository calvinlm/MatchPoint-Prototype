"use client"

import { useState } from "react"
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

// Mock data for demonstration
const mockPlayers: (Player & {
  email?: string
  phone?: string
  location?: string
  checkedIn?: boolean
  rating?: number
})[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    checkedIn: true,
    rating: 4.2,
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@email.com",
    phone: "(555) 987-6543",
    location: "Los Angeles, CA",
    checkedIn: false,
    rating: 3.8,
  },
  {
    id: "3",
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.j@email.com",
    phone: "(555) 456-7890",
    location: "San Diego, CA",
    checkedIn: true,
    rating: 4.5,
  },
  {
    id: "4",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.w@email.com",
    phone: "(555) 321-0987",
    location: "Sacramento, CA",
    checkedIn: true,
    rating: 4.0,
  },
]

const mockTeams: (Team & {
  eventName?: string
  seed?: number
})[] = [
  {
    id: "1",
    players: [mockPlayers[0], mockPlayers[1]],
    eventId: "1",
    eventName: "Men's Doubles",
    seed: 1,
  },
  {
    id: "2",
    players: [mockPlayers[2], mockPlayers[3]],
    eventId: "2",
    eventName: "Women's Doubles",
    seed: 2,
  },
]

export default function PlayersPage() {
  const userRoles: UserRole[] = ["director"]
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")

  const filteredPlayers = mockPlayers.filter((player) => {
    const matchesSearch =
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "checked-in" && player.checkedIn) ||
      (statusFilter === "not-checked-in" && !player.checkedIn)

    return matchesSearch && matchesStatus
  })

  const filteredTeams = mockTeams.filter((team) => {
    const matchesSearch =
      team.players.some((player) =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || team.eventName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEvent = eventFilter === "all" || team.eventId === eventFilter

    return matchesSearch && matchesEvent
  })

  const handleEditPlayer = (playerId: string) => {
    console.log(`[v0] Editing player ${playerId}`)
    // Implementation would open edit modal
  }

  const handleDeletePlayer = (playerId: string) => {
    console.log(`[v0] Deleting player ${playerId}`)
    // Implementation would confirm and delete player
  }

  const handleToggleCheckIn = (playerId: string) => {
    console.log(`[v0] Toggling check-in for player ${playerId}`)
    // Implementation would update check-in status
  }

  const handleEditTeam = (teamId: string) => {
    console.log(`[v0] Editing team ${teamId}`)
    // Implementation would open team edit modal
  }

  const handleDeleteTeam = (teamId: string) => {
    console.log(`[v0] Deleting team ${teamId}`)
    // Implementation would confirm and delete team
  }

  const handleAddPlayerToTeam = (teamId: string) => {
    console.log(`[v0] Adding player to team ${teamId}`)
    // Implementation would open player selection modal
  }

  const checkedInCount = mockPlayers.filter((p) => p.checkedIn).length
  const totalPlayers = mockPlayers.length

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
              placeholder="Search by name or email..."
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
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="1">Men's Doubles</SelectItem>
              <SelectItem value="2">Women's Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalPlayers} Total Players</Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {checkedInCount} Checked In
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {totalPlayers - checkedInCount} Pending
            </Badge>
            <Badge variant="outline">{mockTeams.length} Teams</Badge>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

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

          <TabsContent value="teams" className="space-y-4">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground">Try adjusting your search or create new teams</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
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
