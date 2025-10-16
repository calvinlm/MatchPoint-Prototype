"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PlayerCard } from "@/components/players/player-card"
import { PlayerRow } from "@/components/players/player-row"
import { TeamCard } from "@/components/players/team-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { UserRole, Player, Team } from "@/lib/types"
import {
  Search,
  UserPlus,
  Users,
  Download,
  Upload,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useCsvImport } from "@/hooks/use-csv-import"


const mockTeams: (Team & { eventName?: string; seed?: number })[] = [
  {
    id: "1",
    players: [
      { id: "1", name: "John Smith" } as unknown as Player,
      { id: "2", name: "Jane Doe" } as unknown as Player,
    ],
    eventId: "1",
    eventName: "Men's Doubles",
    seed: 1,
  },
  {
    id: "2",
    players: [
      { id: "3", name: "Mike Johnson" } as unknown as Player,
      { id: "4", name: "Sarah Wilson" } as unknown as Player,
    ],
    eventId: "2",
    eventName: "Women's Doubles",
    seed: 2,
  },
]

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://matchpoint-prototype.onrender.com"

type ViewMode = "grid" | "list"
type SortKey = "name" | "gender" | "age" | "status"
type SortDir = "asc" | "desc"
type AgeCat = "all" | "junior" | "18plus" | "35plus" | "55plus"
type GenderFilter = "all" | "male" | "female"
type PlayerImportFieldKey = "playerName" | "teamName" | "seed"
type PlayerImportRow = {
  name: string
  teamName?: string | null
  seed?: number
}

export default function PlayersPage() {
  const userRoles: UserRole[] = ["director"]
  const [players, setPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "checked-in" | "not-checked-in">("all")

  // Add Player modal state
  const [addOpen, setAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Edit Player
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<Player | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

type NewPlayerForm = {
  name: string
  gender?: string // "male" | "female"
  age?: number
  contactNumber?: string
  address?: string
  checkedIn: boolean
}

const [form, setForm] = useState<NewPlayerForm>({
  name: "",
  gender: undefined,
  age: undefined,
  contactNumber: "",
  address: "",
  checkedIn: false,
})

function normalizeGenderForAPI(g?: string) {
  if (!g) return undefined
  const v = g.trim().toUpperCase()
  // If your Prisma expects "MALE"/"FEMALE", this will satisfy it.
  // If it expects other values, adjust mapping here.
  if (v === "MALE" || v === "FEMALE") return v
  return undefined
}

async function handleAddSubmit(e: React.FormEvent) {
  e.preventDefault()
  setAddError(null)

  if (!form.name.trim()) {
    setAddError("Name is required.")
    return
  }

  const payload: Record<string, any> = {
    name: form.name.trim(),
    // send uppercase enum if backend expects it
    gender: normalizeGenderForAPI(form.gender),
    age: typeof form.age === "number" ? form.age : undefined,
    contactNumber: form.contactNumber?.trim() || undefined,
    address: form.address?.trim() || undefined,
    checkedIn: !!form.checkedIn,
  }

  setIsSubmitting(true)
  try {
    const res = await fetch(`${API_BASE}/api/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || "Failed to create player.")
    }

    const created = await res.json()

    // Prepend to list so it appears immediately
    setPlayers((prev) => [created, ...prev])

    // Reset and close
    setForm({
      name: "",
      gender: undefined,
      age: undefined,
      contactNumber: "",
      address: "",
      checkedIn: false,
    })
    setAddOpen(false)
  } catch (err: any) {
    setAddError(err?.message || "Failed to create player.")
  } finally {
    setIsSubmitting(false)
  }
}

async function handleEditSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!editTarget) return
  setIsEditing(true)
  setEditError(null)
  try {
    const payload = {
      name: editTarget.name.trim(),
      gender: (editTarget.gender ?? "").toUpperCase(),
      age: Number(editTarget.age),
      contactNumber: editTarget.contactNumber.trim(),
      address: editTarget.address.trim(),
      checkedIn: !!editTarget.checkedIn,
    }

    const res = await fetch(`${API_BASE}/api/players/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || "Failed to update player.")
    }

    const updated = await res.json()
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditOpen(false)
  } catch (err: any) {
    setEditError(err.message)
  } finally {
    setIsEditing(false)
  }
}


  // NEW: category filters
  const [ageCat, setAgeCat] = useState<AgeCat>("all")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")

  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true)
      }
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/api/players`)
        if (!res.ok) throw new Error("Failed to fetch players.")
        const data = await res.json()
        setPlayers(data)
      } catch (err: any) {
        console.error("Error fetching players:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Helpers
  const normGender = (g: any) => String(g ?? "").toLowerCase().trim()
  const inAgeCat = (ageVal: any, cat: AgeCat) => {
    const n = Number(ageVal)
    const age = Number.isFinite(n) ? n : null

    if (cat === "all" || age === null) return cat === "all"
    if (cat === "junior") return age <= 17
    if (cat === "18plus") return age >= 18 && age <= 34
    if (cat === "35plus") return age >= 35 && age <= 54
    if (cat === "55plus") return age >= 55
    return true
  }

  // Filters for players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((p) => {
        if (statusFilter === "all") return true
        const checked = (p as any).checkedIn === true
        return statusFilter === "checked-in" ? checked : !checked
      })
      .filter((p) => {
        if (genderFilter === "all") return true
        const g = normGender((p as any).gender)
        if (genderFilter === "male") return g === "male" || g === "m"
        if (genderFilter === "female") return g === "female" || g === "f"
        return true
      })
      .filter((p) => inAgeCat((p as any).age, ageCat))
  }, [players, searchTerm, statusFilter, genderFilter, ageCat])

  function getComparable(p: Player, key: SortKey) {
    switch (key) {
      case "name":
        return (p.name || "").toLowerCase()
      case "gender":
        return normGender((p as any).gender)
      case "age":
        return Number((p as any).age ?? Number.POSITIVE_INFINITY) // empty age goes last
      case "status": {
        const checked = (p as any).checkedIn ? 1 : 2 // Checked first for ASC
        return checked
      }
    }
  }

  const sortedPlayers = useMemo(() => {
    const arr = [...filteredPlayers]
    arr.sort((a, b) => {
      const av = getComparable(a, sortKey)
      const bv = getComparable(b, sortKey)
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [filteredPlayers, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const SortLabel = ({ label, active }: { label: string; active: boolean }) => (
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

  const handleEditPlayer = (id: string | number) => {
    const found = players.find((p) => String(p.id) === String(id))
    if (found) {
      setEditTarget({ ...(found as any) })
      setEditOpen(true)
    }
  }

  async function handleToggleCheckIn(id: string | number) {
  const p = players.find((x) => String(x.id) === String(id)) as any
  if (!p) return
  const next = !Boolean(p.checkedIn)
  try {
    const res = await fetch(`${API_BASE}/api/players/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkedIn: next }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || "Failed to update check-in status.")
    }
    const updated = await res.json()
    setPlayers((prev) => prev.map((pl) => (pl.id === updated.id ? updated : pl)))
  } catch (e) {
    console.error(e)
    alert("Could not update check-in status.")
  }
}

// When user clicks "Delete" in row/card
const handleDeletePlayer = (id: string | number) => {
  const found = players.find((p) => String(p.id) === String(id)) || null
  setConfirmTarget(found || (null as any))
  setConfirmOpen(true)
}

async function confirmDelete() {
  if (!confirmTarget) return
  setIsDeleting(true)
  try {
    const id = confirmTarget.id as any
    const res = await fetch(`${API_BASE}/api/players/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete player.")
    setPlayers((prev) => prev.filter((p) => String(p.id) !== String(id)))
    setConfirmOpen(false)
    setConfirmTarget(null)
  } catch (err: any) {
    alert(err.message || "Delete failed.")
  } finally {
    setIsDeleting(false)
  }
}

  const handleEditTeam = (id: string) => console.log(`[v1] Edit team ${id}`)
  const handleDeleteTeam = (id: string) => console.log(`[v1] Delete team ${id}`)
  const handleAddPlayerToTeam = (id: string) => console.log(`[v1] Add player to team ${id}`)

  const playerImportFields = useMemo(
    () => [
      {
        key: "playerName" as const,
        label: "Player name",
        description: "Required. Each row should include the participant's full name.",
        required: true,
      },
      {
        key: "teamName" as const,
        label: "Team name",
        description:
          "Optional. Players with the same team name will be grouped together when teams are created.",
      },
      {
        key: "seed" as const,
        label: "Seed",
        description: "Optional numeric seed that will be stored on the player or related team.",
      },
    ],
    []
  )

  const playerTemplateDescription = useMemo(
    () => (
      <div className="space-y-2">
        <p>
          Include a header row with clear column names. The simplest template uses columns such as{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Player Name</code>,{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Team Name</code>, and{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">Seed</code>.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li><strong>Player Name</strong> is required for every row.</li>
          <li>
            <strong>Team Name</strong> is optional; leave blank if the player has no team or if teams are
            managed separately.
          </li>
          <li>
            <strong>Seed</strong> accepts whole numbers. Non-numeric values will be flagged during validation.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Save the sheet as a UTF-8 CSV file before uploading. Column selections are saved for your next import.
        </p>
      </div>
    ),
    []
  )

  const transformPlayerRow = useCallback(
    ({ row, mapping }: { row: Record<string, string>; mapping: Record<PlayerImportFieldKey, string | null> }) => {
      const readValue = (field: PlayerImportFieldKey) => {
        const column = mapping[field]
        if (!column) return ""
        const value = row[column]
        if (value == null) return ""
        return String(value).trim()
      }

      const errors: string[] = []
      const name = readValue("playerName")
      const teamNameValue = readValue("teamName")
      const seedValue = readValue("seed")

      if (!name) {
        errors.push("Player name is required.")
      }

      let seedNumber: number | undefined
      if (seedValue) {
        const numericSeed = Number(seedValue)
        if (!Number.isFinite(numericSeed)) {
          errors.push(`Seed must be numeric (received "${seedValue}").`)
        } else {
          seedNumber = numericSeed
        }
      }

      const data: PlayerImportRow = {
        name,
      }

      if (teamNameValue) {
        data.teamName = teamNameValue
      }
      if (seedNumber !== undefined) {
        data.seed = seedNumber
      }

      return {
        data: errors.length ? undefined : data,
        errors,
      }
    },
    []
  )

  const handlePlayerImportSubmit = useCallback(
    async (rows: PlayerImportRow[]) => {
      const res = await fetch(`${API_BASE}/api/players/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: rows }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || "Failed to import players.")
      }

      let updatedFromResponse = false
      try {
        const json = await res.json()
        if (Array.isArray(json)) {
          setPlayers(json)
          updatedFromResponse = true
        } else if (json && Array.isArray(json.players)) {
          setPlayers(json.players)
          updatedFromResponse = true
        }
      } catch (err) {
        // Some endpoints may not return JSON on success; fall back to refetching.
        console.warn("Bulk import response was not JSON", err)
      }

      if (!updatedFromResponse) {
        await fetchPlayers({ silent: true })
      }

      const count = rows.length
      return {
        message: `Imported ${count} player${count === 1 ? "" : "s"}.`,
      }
    },
    [fetchPlayers]
  )

  const {
    triggerImport: triggerPlayerImport,
    FileInput: playerFileInput,
    ImportDialog: playerImportDialog,
  } = useCsvImport<PlayerImportFieldKey, PlayerImportRow>({
    contextKey: "players",
    fields: playerImportFields,
    transformRow: ({ row, mapping }) => transformPlayerRow({ row, mapping }),
    onSubmit: handlePlayerImportSubmit,
    templateDescription: playerTemplateDescription,
    title: "Import players",
    description: "Preview and validate player data before sending it to the bulk import API.",
  })

  const totalPlayers = players.length
  const playerImportElements = (
    <>
      {playerFileInput}
      {playerImportDialog}
    </>
  )

  if (loading) {
    return (
      <>
        {playerImportElements}
        <AppLayout userRoles={userRoles} userName="Tournament Director">
          <div className="p-10 text-muted-foreground">Loading players...</div>
        </AppLayout>
      </>
    )
  }

  if (error) {
    return (
      <>
        {playerImportElements}
        <AppLayout userRoles={userRoles} userName="Tournament Director">
          <div className="p-10 text-red-600">Error: {error}</div>
        </AppLayout>
      </>
    )
  }

  return (
    <>
      {playerImportElements}
      <AppLayout userRoles={userRoles} userName="Tournament Director">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Players & Teams</h1>
            <p className="text-muted-foreground">Manage tournament participants and team assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={triggerPlayerImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <Button asChild>
                <DialogTrigger>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Player
                </DialogTrigger>
              </Button>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Player</DialogTitle>
                  <DialogDescription>Enter the player details and save.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name<span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        required
                        placeholder="e.g., John Smith"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) => setForm((s) => ({ ...s, gender: v }))}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        min={0}
                        value={form.age ?? ""}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, age: e.target.value ? Number(e.target.value) : undefined }))
                        }
                        placeholder="e.g., 24"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input
                        id="contact"
                        value={form.contactNumber}
                        onChange={(e) => setForm((s) => ({ ...s, contactNumber: e.target.value }))}
                        placeholder="e.g., +63 912 345 6789"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                        placeholder="e.g., Makati City, PH"
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        id="checkedIn"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={form.checkedIn}
                        onChange={(e) => setForm((s) => ({ ...s, checkedIn: e.target.checked }))}
                      />
                      <Label htmlFor="checkedIn">Mark as checked in</Label>
                    </div>
                  </div>

                  {addError && (
                    <p className="text-sm text-destructive">{addError}</p>
                  )}

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Player"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {/* Edit Player Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Player</DialogTitle>
                  <DialogDescription>Modify player information below.</DialogDescription>
                </DialogHeader>

                {editTarget && (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={editTarget.name}
                          onChange={(e) => setEditTarget((s) => s ? { ...s, name: e.target.value } : s)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={editTarget?.gender ?? ""}
                          onValueChange={(v) =>
                            setEditTarget((s) => (s ? { ...s, gender: v as "MALE" | "FEMALE" } : s))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          type="number"
                          value={editTarget.age ?? ""}
                          onChange={(e) => setEditTarget((s) => s ? { ...s, age: Number(e.target.value) } : s)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input
                          value={editTarget.contactNumber}
                          onChange={(e) => setEditTarget((s) => s ? { ...s, contactNumber: e.target.value } : s)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address</Label>
                        <Input
                          value={editTarget.address}
                          onChange={(e) => setEditTarget((s) => s ? { ...s, address: e.target.value } : s)}
                        />
                      </div>
                    </div>

                    {editError && <p className="text-sm text-destructive">{editError}</p>}

                    <DialogFooter className="gap-2">
                      <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={isEditing}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isEditing}>
                        {isEditing ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            {/* 🗑️ Delete Confirmation */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete player?</DialogTitle>
                  <DialogDescription>
                    This action can’t be undone. The player{" "}
                    <span className="font-medium text-foreground">
                      {confirmTarget?.name || "Unnamed"}
                    </span>{" "}
                    will be permanently removed.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 rounded-md border p-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="capitalize">{String((confirmTarget as any)?.gender ?? "—").toLowerCase()}</span>
                    <span className="text-muted-foreground">Age</span>
                    <span>{(confirmTarget as any)?.age ?? "—"}</span>
                    <span className="text-muted-foreground">Contact</span>
                    <span>{(confirmTarget as any)?.contactNumber || "—"}</span>
                    <span className="text-muted-foreground">Address</span>
                    <span className="truncate">{(confirmTarget as any)?.address || "—"}</span>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters + View toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status */}
          <Select
            value={statusFilter}
            onValueChange={(v: "all" | "checked-in" | "not-checked-in") => setStatusFilter(v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Check-in Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              <SelectItem value="checked-in">Checked In</SelectItem>
              <SelectItem value="not-checked-in">Not Checked In</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={ageCat}
            onValueChange={(v: AgeCat) => setAgeCat(v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Age Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="junior">Junior (≤17)</SelectItem>
              <SelectItem value="18plus">18+</SelectItem>
              <SelectItem value="35plus">35+</SelectItem>
              <SelectItem value="55plus">55+</SelectItem>
            </SelectContent>
          </Select>

          {/* NEW: Gender */}
          <Select
            value={genderFilter}
            onValueChange={(v: GenderFilter) => setGenderFilter(v)}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-md overflow-hidden border">
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{totalPlayers} Total Players</Badge>
          <Badge variant="outline">{mockTeams.length} Teams (mock)</Badge>
          <Badge variant="outline" className="capitalize">View: {viewMode}</Badge>
          <Badge variant="outline" className="capitalize">Sort: {sortKey} ({sortDir})</Badge>
          {ageCat !== "all" && <Badge variant="secondary">Age: {ageCat === "junior" ? "≤17" : ageCat === "18plus" ? "18+" : "55+"}</Badge>}
          {genderFilter !== "all" && <Badge variant="secondary">Gender: {genderFilter}</Badge>}
          {statusFilter !== "all" && <Badge variant="secondary">Status: {statusFilter}</Badge>}
          {(ageCat !== "all" || genderFilter !== "all" || statusFilter !== "all" || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setAgeCat("all")
                setGenderFilter("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams (Mock)</TabsTrigger>
          </TabsList>

          {/* 🔹 Real Players */}
          <TabsContent value="players" className="space-y-4">
            {sortedPlayers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No players found</h3>
                <p className="text-muted-foreground">Try adjusting your search or add new players</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player as any}
                    onEdit={handleEditPlayer}
                    onDelete={handleDeletePlayer}
                    onToggleCheckIn={handleToggleCheckIn}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-clip">
                {/* Sticky header (sm+) */}
                <div
                  className="hidden sm:grid sticky top-0 z-10 bg-background border-b px-4 py-2 text-xs font-medium text-muted-foreground
                             grid-cols-[2fr_.9fr_.7fr_1.4fr_2fr_1fr_1.2fr]"
                >
                  <button
                    onClick={() => toggleSort("name")}
                    className="text-left hover:text-foreground transition-colors"
                  >
                    <SortLabel label="Name" active={sortKey === "name"} />
                  </button>
                  <button
                    onClick={() => toggleSort("gender")}
                    className="text-left hover:text-foreground transition-colors"
                  >
                    <SortLabel label="Gender" active={sortKey === "gender"} />
                  </button>
                  <button
                    onClick={() => toggleSort("age")}
                    className="text-left hover:text-foreground transition-colors"
                  >
                    <SortLabel label="Age" active={sortKey === "age"} />
                  </button>
                  <div className="truncate">Contact</div>
                  <div className="truncate">Address</div>
                  <button
                    onClick={() => toggleSort("status")}
                    className="text-left hover:text-foreground transition-colors"
                  >
                    <SortLabel label="Status" active={sortKey === "status"} />
                  </button>
                  <div className="truncate text-right pr-1">Actions</div>
                </div>

                <div className="divide-y">
                  {sortedPlayers.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player as any}
                      onEdit={handleEditPlayer}
                      onDelete={handleDeletePlayer}
                      onToggleCheckIn={handleToggleCheckIn}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 🔹 Mock Teams (temporary) */}
          <TabsContent value="teams" className="space-y-4">
            {mockTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground">Team feature coming soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                    onAddPlayer={handleAddPlayerToTeam}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </AppLayout>
    </>
  )
}
