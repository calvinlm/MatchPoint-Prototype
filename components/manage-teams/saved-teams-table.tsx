"use client"

import { Edit, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GeneratedTeam } from "./team-builder-dialog"

type SortKey = "id" | "category" | "level" | "players"
type SortDir = "asc" | "desc"

type SavedTeamsListProps = {
  teams: GeneratedTeam[]
  onEdit: (team: GeneratedTeam) => void
  onDelete: (teamId: string) => void
  sortKey?: SortKey
  sortDir?: SortDir
  onToggleSort?: (k: SortKey) => void
}

export function SavedTeamsList({
  teams,
  onEdit,
  onDelete,
  sortKey = "id",
  sortDir = "asc",
  onToggleSort,
}: SavedTeamsListProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p>No teams saved yet. Click “Add Team” to create your first team.</p>
      </div>
    )
  }

  const cols = "grid grid-cols-12 gap-4"

  const SortLabel = ({ k, label }: { k: SortKey; label: string }) => {
    const active = sortKey === k
    return (
      <span className="inline-flex items-center gap-1">
        {label}
        {!active ? (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
        ) : sortDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </span>
    )
  }

  return (
    <div className="rounded-md border overflow-clip">
      {/* sticky header */}
      <div
        className={`${cols} hidden sm:grid sticky top-0 z-10 bg-background border-b px-6 py-2 text-xs font-medium text-muted-foreground`}
      >
        <button onClick={() => onToggleSort?.("id")} className="col-span-3 md:col-span-2 text-left hover:text-foreground">
          <SortLabel k="id" label="Team #" />
        </button>
        <button onClick={() => onToggleSort?.("category")} className="col-span-4 md:col-span-3 text-left hover:text-foreground">
          <SortLabel k="category" label="Category" />
        </button>
        <button onClick={() => onToggleSort?.("level")} className="col-span-2 md:col-span-2 text-left hover:text-foreground">
          <SortLabel k="level" label="Level" />
        </button>
        <button onClick={() => onToggleSort?.("players")} className="col-span-3 md:col-span-4 text-left hover:text-foreground">
          <SortLabel k="players" label="Players" />
        </button>
        <div className="hidden md:block md:col-span-1 text-right">Actions</div>
      </div>

      {/* rows */}
      <div className="divide-y">
        {teams.map((team) => (
          <div key={team.id} className={`${cols} px-6 py-4 hover:bg-muted/30`}>
            <div className="col-span-12 sm:col-span-3 md:col-span-2 text-sm font-semibold">{team.id}</div>
            <div className="col-span-12 sm:col-span-4 md:col-span-3 text-sm text-muted-foreground">
              {team.ageGroup} • {team.category}
            </div>
            <div className="col-span-12 sm:col-span-2 md:col-span-2 text-sm text-muted-foreground">{team.level}</div>
            <div className="col-span-12 sm:col-span-3 md:col-span-4 text-sm text-muted-foreground">
              {team.players.join(" • ")}
            </div>
            <div className="col-span-12 md:col-span-1 flex items-center gap-2 justify-start md:justify-end">
              <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(team)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(team.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
            </Button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
