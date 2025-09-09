"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Event } from "@/lib/types"
import { Trophy, Users, Calendar, MoreHorizontal, Eye, Edit, Shuffle } from "lucide-react"

interface EventCardProps {
  event: Event & {
    entries: number
    status: "draft" | "seeded" | "active" | "completed"
    startDate?: Date
  }
  onView?: () => void
  onEdit?: () => void
  onSeed?: () => void
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  seeded: { label: "Seeded", color: "bg-accent text-accent-foreground" },
  active: { label: "Active", color: "bg-primary text-primary-foreground" },
  completed: { label: "Completed", color: "bg-chart-1 text-white" },
}

const formatLabels = {
  singleElim: "Single Elimination",
  doubleElim: "Double Elimination",
  roundRobin: "Round Robin",
  poolPlay: "Pool Play",
}

export function EventCard({ event, onView, onEdit, onSeed }: EventCardProps) {
  const status = statusConfig[event.status]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground leading-tight">{event.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{event.division}</span>
              <span>•</span>
              <span>{event.skill}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Bracket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSeed}>
                <Shuffle className="h-4 w-4 mr-2" />
                Manage Seeding
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={status.color}>{status.label}</Badge>
          <span className="text-sm text-muted-foreground">{formatLabels[event.format]}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">{event.entries}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </div>
          <div>
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">Best of {event.bestOf}</p>
            <p className="text-xs text-muted-foreground">Games to {event.gameTo}</p>
          </div>
          <div>
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">{event.startDate?.toLocaleDateString() || "TBD"}</p>
            <p className="text-xs text-muted-foreground">Start Date</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1 bg-transparent">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onSeed}>
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
