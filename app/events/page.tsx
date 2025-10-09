"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { EventCard } from "@/components/brackets/event-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/lib/types"
import { Plus, Search, Filter } from "lucide-react"

// Mock events data
const mockEvents = [
  {
    id: "1",
    name: "Men's Doubles 3.0",
    format: "doubleElim" as const,
    division: "Men's Doubles",
    skill: "3.0",
    bestOf: 3,
    gameTo: 11,
    winBy: 2,
    entries: 16,
    status: "active" as const,
    startDate: new Date("2024-03-15"),
  },
  {
    id: "2",
    name: "Women's Doubles 3.5",
    format: "singleElim" as const,
    division: "Women's Doubles",
    skill: "3.5",
    bestOf: 3,
    gameTo: 11,
    winBy: 2,
    entries: 12,
    status: "seeded" as const,
    startDate: new Date("2024-03-16"),
  },
  {
    id: "3",
    name: "Mixed Doubles 4.0",
    format: "roundRobin" as const,
    division: "Mixed Doubles",
    skill: "4.0",
    bestOf: 3,
    gameTo: 11,
    winBy: 2,
    entries: 8,
    status: "draft" as const,
  },
  {
    id: "4",
    name: "Men's Singles 3.5",
    format: "singleElim" as const,
    division: "Men's Singles",
    skill: "3.5",
    bestOf: 5,
    gameTo: 11,
    winBy: 2,
    entries: 24,
    status: "completed" as const,
    startDate: new Date("2024-03-14"),
  },
]
export default function EventsPage() {
  const userRoles: UserRole[] = ["director"]
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formatFilter, setFormatFilter] = useState<string>("all")


  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.skill.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    const matchesFormat = formatFilter === "all" || event.format === formatFilter

    return matchesSearch && matchesStatus && matchesFormat
  })

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events & Brackets</h1>
            <p className="text-muted-foreground">Manage tournament events and bracket structures</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, divisions, or skill levels..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="seeded">Seeded</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="singleElim">Single Elimination</SelectItem>
              <SelectItem value="doubleElim">Double Elimination</SelectItem>
              <SelectItem value="roundRobin">Round Robin</SelectItem>
              <SelectItem value="poolPlay">Pool Play</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || formatFilter !== "all"
                ? "Try adjusting your filters to see more events"
                : "Create your first tournament event to get started"}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onView={() => console.log(`View bracket for ${event.name}`)}
                onEdit={() => console.log(`Edit ${event.name}`)}
                onSeed={() => console.log(`Manage seeding for ${event.name}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
