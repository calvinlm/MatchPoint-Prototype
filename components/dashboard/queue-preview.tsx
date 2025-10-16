"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { QueueItem, Match } from "@/lib/types"
import { Clock, Users, ArrowRight } from "lucide-react"

interface QueuePreviewProps {
  queueItems: (QueueItem & { match: Match })[]
  onViewFullQueue?: () => void
  onAssignToCourt?: (matchId: number | string) => void
}

export function QueuePreview({ queueItems, onViewFullQueue, onAssignToCourt }: QueuePreviewProps) {
  const topItems = queueItems.slice(0, 10)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Match Queue</CardTitle>
        <Button variant="outline" size="sm" onClick={onViewFullQueue}>
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {topItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No matches in queue</p>
          </div>
        ) : (
          topItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Match #{item.match.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.match.teams[0].name || `Team ${item.match.teams[0].players[0]?.firstName}`} vs{" "}
                    {item.match.teams[1].name || `Team ${item.match.teams[1].players[0]?.firstName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />R{item.match.round}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onAssignToCourt?.(item.match.id)}>
                  Assign
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
