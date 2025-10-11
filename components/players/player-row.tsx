"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Phone, MapPin, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import type { Player } from "@/lib/types"

interface PlayerRowProps {
  player: (Player & { checkedIn?: boolean })
  onEdit: (playerId: string) => void
  onDelete: (playerId: string) => void
  onToggleCheckIn: (playerId: string) => void
}

export function PlayerRow({ player, onEdit, onDelete, onToggleCheckIn }: PlayerRowProps) {
  const initials = player.name
    ? player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  const genderLabel =
    (player as any).gender ? String((player as any).gender).toLowerCase() : "—"
  const ageLabel = (player as any).age ?? "—"

  return (
    // Mobile: stacked; sm+: 7-column grid aligned with header
    <div
      className="p-4 flex flex-col gap-3 sm:grid sm:items-center sm:gap-2
                 sm:grid-cols-[2fr_.9fr_.7fr_1.4fr_2fr_1fr_1.2fr]"
    >
      {/* Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate">{player.name || "Unnamed Player"}</div>
          {/* keep line for potential future subtext, but empty now 
          <div className="text-xs text-muted-foreground truncate">&nbsp;</div> */}
        </div>
      </div>

      {/* Gender */}
      <div className="text-sm text-muted-foreground min-w-0 capitalize">
        {genderLabel}
      </div>

      {/* Age */}
      <div className="text-sm text-muted-foreground min-w-0">
        {ageLabel}
      </div>

      {/* Contact */}
      <div className="text-sm text-muted-foreground min-w-0">
        {player.contactNumber ? (
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{player.contactNumber}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        )}
      </div>

      {/* Address */}
      <div className="text-sm text-muted-foreground min-w-0">
        {player.address ? (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{player.address}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center">
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

      {/* Actions */}
      <div className="flex items-center gap-2 sm:justify-end">
        <Button
          size="sm"
          variant={player.checkedIn ? "outline" : "default"}
          onClick={() => onToggleCheckIn(String(player.id))}
        >
          {player.checkedIn ? "Check Out" : "Check In"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(String(player.id))}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(String(player.id))}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}
