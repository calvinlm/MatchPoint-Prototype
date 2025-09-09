"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ScoreSheetCard } from "@/components/score-sheets/score-sheet-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Match } from "@/lib/types"
import { Search, FileText, Download, Printer } from "lucide-react"

// Mock data for demonstration
const mockMatches: Match[] = [
  {
    id: "1",
    number: 101,
    eventId: "1",
    round: 1,
    teams: [
      { id: "1", players: [{ id: "1", firstName: "John", lastName: "Smith" }], eventId: "1" },
      { id: "2", players: [{ id: "2", firstName: "Jane", lastName: "Doe" }], eventId: "1" },
    ],
    status: "completed",
    games: [
      { id: "1", matchId: "1", gameNumber: 1, team1Score: 11, team2Score: 8, isComplete: true },
      { id: "2", matchId: "1", gameNumber: 2, team1Score: 9, team2Score: 11, isComplete: true },
      { id: "3", matchId: "1", gameNumber: 3, team1Score: 11, team2Score: 6, isComplete: true },
    ],
  },
  {
    id: "2",
    number: 102,
    eventId: "1",
    round: 1,
    teams: [
      { id: "3", players: [{ id: "3", firstName: "Mike", lastName: "Johnson" }], eventId: "1" },
      { id: "4", players: [{ id: "4", firstName: "Sarah", lastName: "Wilson" }], eventId: "1" },
    ],
    status: "live",
    games: [{ id: "4", matchId: "2", gameNumber: 1, team1Score: 8, team2Score: 6, isComplete: false }],
  },
  {
    id: "3",
    number: 103,
    eventId: "2",
    round: 1,
    teams: [
      { id: "5", players: [{ id: "5", firstName: "Alex", lastName: "Brown" }], eventId: "2" },
      { id: "6", players: [{ id: "6", firstName: "Emma", lastName: "Davis" }], eventId: "2" },
    ],
    status: "queued",
    games: [],
  },
]

export default function ScoreSheetsPage() {
  const userRoles: UserRole[] = ["director"]
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")

  const filteredMatches = mockMatches.filter((match) => {
    const matchesSearch =
      match.number.toString().includes(searchTerm) ||
      match.teams.some((team) =>
        team.players.some((player) =>
          `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )

    const matchesStatus = statusFilter === "all" || match.status === statusFilter
    const matchesEvent = eventFilter === "all" || match.eventId === eventFilter

    return matchesSearch && matchesStatus && matchesEvent
  })

  const handlePrint = (matchId: string) => {
    console.log(`[v0] Printing score sheet for match ${matchId}`)
    // Implementation would generate and print score sheet
  }

  const handleDownload = (matchId: string) => {
    console.log(`[v0] Downloading PDF for match ${matchId}`)
    // Implementation would generate and download PDF
  }

  const handlePreview = (matchId: string) => {
    console.log(`[v0] Previewing score sheet for match ${matchId}`)
    // Implementation would show preview modal
  }

  const handleBulkPrint = () => {
    console.log(`[v0] Bulk printing all filtered matches`)
    // Implementation would print all visible matches
  }

  const completedMatches = filteredMatches.filter((m) => m.status === "completed")
  const activeMatches = filteredMatches.filter((m) => m.status === "live" || m.status === "queued")

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Score Sheets</h1>
            <p className="text-muted-foreground">Generate and manage match score sheets</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBulkPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Bulk Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by match number or player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="1">Men's Singles</SelectItem>
              <SelectItem value="2">Women's Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredMatches.length} Total</Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {completedMatches.length} Completed
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {activeMatches.length} Active
            </Badge>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Matches</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No matches found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((match) => (
                  <ScoreSheetCard
                    key={match.id}
                    match={match}
                    onPrint={handlePrint}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMatches.map((match) => (
                <ScoreSheetCard
                  key={match.id}
                  match={match}
                  onPrint={handlePrint}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMatches.map((match) => (
                <ScoreSheetCard
                  key={match.id}
                  match={match}
                  onPrint={handlePrint}
                  onDownload={handleDownload}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
