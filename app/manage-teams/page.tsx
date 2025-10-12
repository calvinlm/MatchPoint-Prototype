"use client"

import { useState, useEffect, useMemo } from "react"
import { Users, Upload, Download, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/app-layout"
import { TeamBuilderDialog, type GeneratedTeam } from "@/components/manage-teams/team-builder-dialog"
import { SavedTeamsList } from "@/components/manage-teams/saved-teams-table"
import { TeamCard } from "@/components/manage-teams/team-card"
import type { Player, UserRole } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://matchpoint-prototype.onrender.com"

type ViewMode = "list" | "grid"
type SortKey = "id" | "category" | "level" | "players"
type SortDir = "asc" | "desc"
type AgeGroupFilter = "all" | "Junior (17 below)" | "18+" | "35+" | "55+"
type CategoryFilter =
  | "all"
  | "Mens Singles"
  | "Mens Doubles"
  | "Womens Singles"
  | "Womens Doubles"
  | "Mixed Doubles"
type LevelFilter = "all" | "Novice" | "Intermediate" | "Advanced"

export default function ManageTeamsPage() {
  const userRoles: UserRole[] = ["director"]
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // local-only teams (same as before)
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<GeneratedTeam | null>(null)
  const [savedTeams, setSavedTeams] = useState<GeneratedTeam[]>([])

  // toolbar state
  const [search, setSearch] = useState("")
  const [ageFilter, setAgeFilter] = useState<AgeGroupFilter>("all")
  const [catFilter, setCatFilter] = useState<CategoryFilter>("all")
  const [lvlFilter, setLvlFilter] = useState<LevelFilter>("all")
  const [view, setView] = useState<ViewMode>("list")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  useEffect(() => {
    async function loadPlayersAndTeams() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch(`${API_BASE}/api/players`),
          fetch(`${API_BASE}/api/teams`),
        ])
        if (!pRes.ok) throw new Error("Failed to fetch players.")
        if (!tRes.ok) throw new Error("Failed to fetch teams.")
        const [pData, tData] = await Promise.all([pRes.json(), tRes.json()])
        setPlayers(pData)
        setSavedTeams(tData) // <- now from backend
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadPlayersAndTeams()
  }, [])

    // —— CRUD handlers (unchanged, just lifted here) ——
    const handleSaveTeam = async (team: GeneratedTeam) => {
    if (editingTeam) {
      // EDIT
      const p1 = players.find((p) => p.name === team.players[0])
      const p2 = players.find((p) => p.name === team.players[1])
      const body = {
        ageGroup: team.ageGroup,
        category: team.category,
        level: team.level,
        playerIds: [p1?.id, p2?.id].filter(Boolean).map(Number),
      }
      const res = await fetch(`${API_BASE}/api/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        alert("Failed to update team")
        return
      }
      const updated = await res.json()
      setSavedTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? updated : t)))
    } else {
      // CREATE
      const p1 = players.find((p) => p.name === team.players[0])
      const p2 = players.find((p) => p.name === team.players[1])
      const body = {
        ageGroup: team.ageGroup,
        category: team.category,
        level: team.level,
        playerIds: [p1?.id, p2?.id].filter(Boolean).map(Number),
      }
      const res = await fetch(`${API_BASE}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        alert("Failed to create team")
        return
      }
      const created = await res.json()
      setSavedTeams((prev) => [...prev, created])
    }
    setEditingTeam(null)
  }

  const handleEditTeam = (team: GeneratedTeam) => {
    setEditingTeam(team)
    setTeamBuilderOpen(true)
  }
  
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return
    const res = await fetch(`${API_BASE}/api/teams/${teamId}`, { method: "DELETE" })
    if (!res.ok) {
      alert("Delete failed")
      return
    }
    setSavedTeams((prev) => prev.filter((t) => t.id !== teamId))
  }

  const handleClearAllTeams = async () => {
    if (!confirm("Clear all saved teams?")) return
    try {
      await fetch(`${API_BASE}/api/teams`, { method: "DELETE" })
    } finally {
      setSavedTeams([])
    }
  }

  // —— FILTER + SORT like Players page ——
  const filtered = useMemo(() => {
    return savedTeams
      .filter((t) => {
        if (ageFilter !== "all" && t.ageGroup !== ageFilter) return false
        if (catFilter !== "all" && t.category !== catFilter) return false
        if (lvlFilter !== "all" && t.level !== lvlFilter) return false
        if (search.trim()) {
          const s = search.toLowerCase()
          const inId = t.id.toLowerCase().includes(s)
          const inPlayers = t.players.join(" ").toLowerCase().includes(s)
          const inCat = `${t.ageGroup} ${t.category} ${t.level}`.toLowerCase().includes(s)
          return inId || inPlayers || inCat
        }
        return true
      })
  }, [savedTeams, ageFilter, catFilter, lvlFilter, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const get = (t: GeneratedTeam) =>
        sortKey === "id"
          ? t.id
          : sortKey === "category"
          ? `${t.ageGroup} ${t.category}`
          : sortKey === "level"
          ? t.level
          : t.players.join(" ")
      const av = get(a).toLowerCase()
      const bv = get(b).toLowerCase()
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(k)
      setSortDir("asc")
    }
  }

  if (loading) {
    return (
      <AppLayout userRoles={userRoles} userName="Tournament Director">
        <div className="p-10 text-muted-foreground">Loading...</div>
      </AppLayout>
    )
  }
  if (error) {
    return (
      <AppLayout userRoles={userRoles} userName="Tournament Director">
        <div className="p-10 text-red-600">Error: {error}</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teams</h1>
            <p className="text-muted-foreground">Manage generated pairings and team assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button onClick={() => setTeamBuilderOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>
        </div>

        {/* Toolbar: search + filters + view toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search by team id, players, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3"
            />
          </div>

          {/* Category Filter */}
          <Select value={catFilter} onValueChange={(v: CategoryFilter) => setCatFilter(v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Category</SelectItem>
              <SelectItem value="Mens Singles">Mens Singles</SelectItem>
              <SelectItem value="Mens Doubles">Mens Doubles</SelectItem>
              <SelectItem value="Womens Singles">Womens Singles</SelectItem>
              <SelectItem value="Womens Doubles">Womens Doubles</SelectItem>
              <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
            </SelectContent>
          </Select>

          {/* Age Filter */}
          <Select value={ageFilter} onValueChange={(v: AgeGroupFilter) => setAgeFilter(v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="Junior (17 below)">Junior (≤17)</SelectItem>
              <SelectItem value="18+">18+</SelectItem>
              <SelectItem value="35+">35+</SelectItem>
              <SelectItem value="55+">55+</SelectItem>
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={lvlFilter} onValueChange={(v: LevelFilter) => setLvlFilter(v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Novice">Novice</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden border">
            <Button
              type="button"
              variant={view === "list" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setView("list")}
              aria-label="List view"
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "grid" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats + Clear */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{savedTeams.length} Total Teams</Badge>
          {(ageFilter !== "all" || catFilter !== "all" || lvlFilter !== "all" || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setSearch("")
                setAgeFilter("all")
                setCatFilter("all")
                setLvlFilter("all")
              }}
            >
              Clear filters
            </Button>
          )}
          {savedTeams.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAllTeams}>
              Clear All
            </Button>
          )}
        </div>

        {/* Content */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDelete={handleDeleteTeam}
              />
            ))}
          </div>
        ) : (
          <SavedTeamsList
            teams={sorted}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
          />
        )}

        {/* Dialog */}
        <TeamBuilderDialog
          open={teamBuilderOpen}
          onOpenChange={(open) => {
            setTeamBuilderOpen(open)
            if (!open) setEditingTeam(null)
          }}
          players={players}
          onSave={handleSaveTeam}      // your create/update logic
          editingTeam={editingTeam}
          existingTeams={savedTeams}   // if you still use local previewing
        />
      </div>
    </AppLayout>
  )
}
