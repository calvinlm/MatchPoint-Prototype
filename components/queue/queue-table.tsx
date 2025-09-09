"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { QueueItem, Match, Court } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  GripVertical,
  Clock,
  MapPin,
  MoreHorizontal,
  UserCheck,
  Printer,
  Monitor,
  Play,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

interface QueueTableProps {
  queueItems: (QueueItem & { match: Match })[]
  courts: Court[]
  onAssignCourt?: (matchId: string, courtId: string) => void
  onAssignReferee?: (matchId: string) => void
  onPrintScoreSheet?: (matchId: string) => void
  onOpenScoreboard?: (matchId: string) => void
  onReorderQueue?: (items: QueueItem[]) => void
  onStartMatch?: (matchId: string) => void
}

export function QueueTable({
  queueItems,
  courts,
  onAssignCourt,
  onAssignReferee,
  onPrintScoreSheet,
  onOpenScoreboard,
  onReorderQueue,
  onStartMatch,
}: QueueTableProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  const availableCourts = courts.filter((court) => court.status === "idle")

  const filteredItems = queueItems.filter((item) => {
    if (filter === "all") return true
    if (filter === "ready") return item.match.courtId && item.match.refereeId
    if (filter === "needs_court") return !item.match.courtId
    if (filter === "needs_ref") return !item.match.refereeId
    return true
  })

  const getTeamName = (team: any) => {
    return team.name || `${team.players[0]?.firstName} ${team.players[0]?.lastName}` || "TBD"
  }

  const getEstimatedTime = (priority: number) => {
    const baseTime = new Date()
    baseTime.setMinutes(baseTime.getMinutes() + (priority - 1) * 15)
    return baseTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetItemId) return

    const draggedIndex = filteredItems.findIndex((item) => item.id === draggedItem)
    const targetIndex = filteredItems.findIndex((item) => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...filteredItems]
    const [draggedItemData] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItemData)

    // Update priorities
    newItems.forEach((item, index) => {
      item.priority = index + 1
    })

    onReorderQueue?.(newItems)
    setDraggedItem(null)
  }

  const movePriority = (itemId: string, direction: "up" | "down") => {
    const currentIndex = filteredItems.findIndex((item) => item.id === itemId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= filteredItems.length) return

    const newItems = [...filteredItems]
    const [item] = newItems.splice(currentIndex, 1)
    newItems.splice(newIndex, 0, item)

    // Update priorities
    newItems.forEach((item, index) => {
      item.priority = index + 1
    })

    onReorderQueue?.(newItems)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Match Queue ({filteredItems.length})
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              <SelectItem value="ready">Ready to Start</SelectItem>
              <SelectItem value="needs_court">Needs Court</SelectItem>
              <SelectItem value="needs_ref">Needs Referee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No matches in queue</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const match = item.match
              const isReady = match.courtId && match.refereeId
              const assignedCourt = courts.find((c) => c.id === match.courtId)

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 border-b border-border hover:bg-muted/50 transition-colors cursor-move",
                    draggedItem === item.id && "opacity-50",
                    isReady && "bg-primary/5 border-l-4 border-l-primary",
                  )}
                >
                  {/* Drag Handle & Priority */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-6 p-0"
                        disabled={index === 0}
                        onClick={() => movePriority(item.id, "up")}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium text-center w-6">{item.priority}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-6 p-0"
                        disabled={index === filteredItems.length - 1}
                        onClick={() => movePriority(item.id, "down")}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Match #{match.number}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Round {match.round}</span>
                      {isReady && <Badge className="bg-primary text-primary-foreground text-xs">Ready</Badge>}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {getTeamName(match.teams[0])} vs {getTeamName(match.teams[1])}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ETA: {getEstimatedTime(item.priority)}
                      </span>
                      {assignedCourt && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {assignedCourt.name}
                        </span>
                      )}
                      {match.refereeId && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Ref Assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {!match.courtId && availableCourts.length > 0 && (
                      <Select onValueChange={(courtId) => onAssignCourt?.(match.id, courtId)}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue placeholder="Court" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {isReady && (
                      <Button size="sm" onClick={() => onStartMatch?.(match.id)} className="h-8">
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAssignReferee?.(match.id)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign Referee
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrintScoreSheet?.(match.id)}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Score Sheet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenScoreboard?.(match.id)}>
                          <Monitor className="h-4 w-4 mr-2" />
                          Open Scoreboard
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
