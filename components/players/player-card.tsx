"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, MapPin, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import type { Player } from "@/lib/types"

interface PlayerCardProps {
  player: Player & {
    checkedIn?: boolean
  }
  onEdit: (playerId: string | number) => void
  onDelete: (playerId: string | number) => void
  onToggleCheckIn: (playerId: string | number) => void
}

export function PlayerCard({ player, onEdit, onDelete, onToggleCheckIn }: PlayerCardProps) {
  // Safely derive initials from player.name
  const initials = player.name
    ? player.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{player.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {player.gender && (
                  <span className="capitalize">{player.gender.toLowerCase()}</span>
                )}
                {player.age ? ` • Age ${player.age}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {player.checkedIn ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Checked In
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Not Checked In
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {player.contactNumber && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {player.contactNumber}
          </div>
        )}

        {player.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {player.address}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant={player.checkedIn ? "outline" : "default"}
            onClick={() => onToggleCheckIn(player.id)}
          >
            {player.checkedIn ? "Check Out" : "Check In"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(player.id)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(player.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
