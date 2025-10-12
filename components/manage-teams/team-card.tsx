"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Edit, Trash2 } from "lucide-react"
import type { GeneratedTeam } from "./team-builder-dialog"

type TeamCardProps = {
  team: GeneratedTeam
  onEdit: (team: GeneratedTeam) => void
  onDelete: (teamId: string) => void
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "?"
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {team.id}
          </CardTitle>
          {/* Level chip to mirror “Seed” vibe */}
          <Badge variant="outline" className="capitalize">{team.level}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {team.ageGroup} • {team.category}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Players</div>

            {/* HORIZONTAL avatars + names (wraps on small screens) */}
            <div className="flex flex-wrap gap-3">
            {team.players.map((name) => (
                <div key={name} className="inline-flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initialsOf(name)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm">{name}</span>
                </div>
            ))}
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(team)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(team.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
            </Button>
        </div>
        </CardContent>
    </Card>
  )
}
