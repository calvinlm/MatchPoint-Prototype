"use client"

import { useState, useMemo } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Player } from "@/lib/types"

const AGE_GROUPS = ["Junior (17 below)", "18+", "35+", "55+"] as const
const CATEGORIES = [
  "Mens Singles",
  "Mens Doubles",
  "Womens Singles",
  "Womens Doubles",
  "Mixed Doubles",
] as const
const LEVELS = ["Novice", "Intermediate", "Advanced"] as const

type AgeGroup = typeof AGE_GROUPS[number]
type Category = typeof CATEGORIES[number]
type Level = typeof LEVELS[number]

export type TeamFormData = {
  ageGroup: AgeGroup
  category: Category
  level: Level
  player1: string
  player2: string
}

export type GeneratedTeam = {
  id: string
  ageGroup: AgeGroup
  category: Category
  level: Level
  players: string[]
  timestamp: number
}

type TeamBuilderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: Player[]
  onSave: (team: GeneratedTeam) => void
  editingTeam?: GeneratedTeam | null
  existingTeams?: GeneratedTeam[]
}

export function TeamBuilderDialog({
  open,
  onOpenChange,
  players,
  onSave,
  editingTeam,
  existingTeams = [],
}: TeamBuilderDialogProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    ageGroup: "18+",
    category: "Mens Doubles",
    level: "Intermediate",
    player1: "",
    player2: "",
  })

  // Reset form when dialog opens with editing team
  useState(() => {
    if (editingTeam && open) {
      const player1 = players.find((p) => p.name === editingTeam.players[0])
      const player2 = editingTeam.players[1]
        ? players.find((p) => p.name === editingTeam.players[1])
        : null

      setFormData({
        ageGroup: editingTeam.ageGroup,
        category: editingTeam.category,
        level: editingTeam.level,
        player1: player1 ? String(player1.id) : "",
        player2: player2 ? String(player2.id) : "",
      })
    } else if (!editingTeam && open) {
      // Reset to defaults when opening for new team
      setFormData({
        ageGroup: "18+",
        category: "Mens Doubles",
        level: "Intermediate",
        player1: "",
        player2: "",
      })
    }
  })

  const isDoubles = formData.category.includes("Doubles")

  // Filter players based on age group and category
  const eligiblePlayers = useMemo(() => {
    return players.filter((player) => {
      // Age group filter
      const age = player.age ?? 0
      let ageMatch = false

      if (formData.ageGroup === "Junior (17 below)") {
        ageMatch = age <= 17
      } else if (formData.ageGroup === "18+") {
        ageMatch = age >= 18 && age < 35
      } else if (formData.ageGroup === "35+") {
        ageMatch = age >= 35 && age < 55
      } else if (formData.ageGroup === "55+") {
        ageMatch = age >= 55
      }

      if (!ageMatch) return false

      // Gender filter - Mixed Doubles allows any gender
      if (formData.category === "Mixed Doubles") {
        return true
      }

      const gender = String(player.gender ?? "").toLowerCase()
      if (formData.category.includes("Mens")) {
        return gender === "male"
      }

      if (formData.category.includes("Womens")) {
        return gender === "female"
      }

      return true
    })
  }, [players, formData.ageGroup, formData.category])

  // For Mixed Doubles, ensure one male and one female
  const getEligiblePlayersForSlot = (slotNumber: number) => {
    if (formData.category !== "Mixed Doubles") {
      return eligiblePlayers
    }

    // For Mixed Doubles, if player1 is selected, filter player2 options
    if (slotNumber === 2 && formData.player1) {
      const player1Data = players.find((p) => String(p.id) === formData.player1)
      if (player1Data) {
        const player1Gender = String(player1Data.gender ?? "").toLowerCase()
        const oppositeGender = player1Gender === "male" ? "female" : "male"
        return eligiblePlayers.filter(
          (p) => String(p.gender ?? "").toLowerCase() === oppositeGender
        )
      }
    }

    return eligiblePlayers
  }

  const codeMaps = {
  age: (age: AgeGroup) => {
    if (age === "Junior (17 below)") return "Jr"
    if (age === "18+") return "18"
    if (age === "35+") return "35"
    return "55"
  },
  category: (cat: Category) => {
    if (cat === "Mens Singles") return "MS"
    if (cat === "Mens Doubles") return "MD"
    if (cat === "Womens Singles") return "WS"
    if (cat === "Womens Doubles") return "WD"
    return "XD"
  },
  level: (lvl: Level) => (lvl === "Novice" ? "Nov" : lvl === "Intermediate" ? "Int" : "Adv"),
}

    const generateTeamId = (savedTeamsCount: number = 0) => {
    const count = savedTeamsCount + 1
    const age = codeMaps.age(formData.ageGroup)
    const cat = codeMaps.category(formData.category)
    const lvl = codeMaps.level(formData.level)
    const prefix = `${age}${cat}${lvl}_` // e.g., 18MDInt_
  // find existing with same prefix and compute max
    const maxSeq = existingTeams
        .filter(t => t.id.startsWith(prefix))
        .map(t => {
        const n = parseInt(t.id.slice(prefix.length), 10)
        return Number.isFinite(n) ? n : 0
        })
        .reduce((a, b) => Math.max(a, b), 0)

    const next = String(maxSeq + 1).padStart(3, "0")
    return `${prefix}${next}`    
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.player1) {
      alert("Please select at least one player")
      return
    }

    if (isDoubles && !formData.player2) {
      alert("Please select two players for doubles category")
      return
    }

    // Check for Mixed Doubles gender requirement
    if (
      formData.category === "Mixed Doubles" &&
      formData.player1 &&
      formData.player2
    ) {
      const p1 = players.find((p) => String(p.id) === formData.player1)
      const p2 = players.find((p) => String(p.id) === formData.player2)
      if (p1 && p2) {
        const g1 = String(p1.gender ?? "").toLowerCase()
        const g2 = String(p2.gender ?? "").toLowerCase()
        if (g1 === g2) {
          alert("Mixed Doubles requires one male and one female player")
          return
        }
      }
    }

    const player1Data = players.find((p) => String(p.id) === formData.player1)
    const player2Data = formData.player2
      ? players.find((p) => String(p.id) === formData.player2)
      : null

    if (!player1Data) return

    const newTeam: GeneratedTeam = {
    id: editingTeam ? editingTeam.id : generateTeamId(),
    ageGroup: formData.ageGroup,
    category: formData.category,
    level: formData.level,
    players: player2Data ? [player1Data.name, player2Data.name] : [player1Data.name],
    timestamp: Date.now(),
    }

    onSave(newTeam)
    onOpenChange(false)
  }

  const handleFormChange = (field: keyof TeamFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      // Reset players when category or age changes
      if (field === "category" || field === "ageGroup") {
        updated.player1 = ""
        updated.player2 = ""
      }
      return updated
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingTeam ? "Edit Team" : "Configure Team"}
          </DialogTitle>
          <DialogDescription>
            {editingTeam
              ? "Update team information below"
              : "Select category and players to create a team"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Configure Category Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="h-px flex-1 bg-border" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Configure category
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageGroup" className="text-sm font-medium">
                  Age Group
                </Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(v) => handleFormChange("ageGroup", v)}
                >
                  <SelectTrigger id="ageGroup" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((age) => (
                      <SelectItem key={age} value={age}>
                        {age}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleFormChange("category", v)}
                >
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium">
                  Level
                </Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) => handleFormChange("level", v)}
                >
                  <SelectTrigger id="level" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <div className="h-px flex-1 bg-border" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Players{" "}
                {isDoubles && (
                  <span className="text-xs font-normal normal-case">
                    (both required for doubles)
                  </span>
                )}
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className={`grid ${isDoubles ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="player1" className="text-sm font-medium">
                  Player 1
                </Label>
                <Select
                  value={formData.player1}
                  onValueChange={(v) => handleFormChange("player1", v)}
                >
                  <SelectTrigger id="player1" className="h-11">
                    <SelectValue placeholder="Select Player 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {getEligiblePlayersForSlot(1).length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No eligible players
                      </div>
                    ) : (
                      getEligiblePlayersForSlot(1).map((player) => (
                        <SelectItem key={player.id} value={String(player.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {player.age}y • {String(player.gender ?? "").toLowerCase()}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {isDoubles && (
                <div className="space-y-2">
                  <Label htmlFor="player2" className="text-sm font-medium">
                    Player 2
                  </Label>
                  <Select
                    value={formData.player2}
                    onValueChange={(v) => handleFormChange("player2", v)}
                  >
                    <SelectTrigger id="player2" className="h-11">
                      <SelectValue placeholder="Select Player 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEligiblePlayersForSlot(2).filter((p) => String(p.id) !== formData.player1).length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          {formData.player1 ? "No eligible partners" : "Select Player 1 first"}
                        </div>
                      ) : (
                        getEligiblePlayersForSlot(2)
                          .filter((p) => String(p.id) !== formData.player1)
                          .map((player) => (
                            <SelectItem key={player.id} value={String(player.id)}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{player.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {player.age}y • {String(player.gender ?? "").toLowerCase()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {eligiblePlayers.length === 0 && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive font-medium">
                  No eligible players found for the selected age group and category.
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  Try selecting a different age group or category, or add more players to your roster.
                </p>
              </div>
            )}

            {formData.category === "Mixed Doubles" && formData.player1 && !formData.player2 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-900">
                  💡 Mixed Doubles requires one male and one female player
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
              disabled={!formData.player1 || (isDoubles && !formData.player2)}
            >
              {editingTeam ? "Update Team" : "Generate Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}