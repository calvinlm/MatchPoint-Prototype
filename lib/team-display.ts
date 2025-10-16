import type { Player, Team } from "@/lib/types"

type ExtendedPlayer = Player & {
  firstName?: string | null
  lastName?: string | null
}

type ExtendedTeam = Team & {
  players: ExtendedPlayer[]
}

function hasContent(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function formatPlayerName(player?: ExtendedPlayer | null): string {
  if (!player) {
    return "Player"
  }

  if (hasContent(player.name)) {
    return player.name.trim()
  }

  const parts = [player.firstName, player.lastName].filter(hasContent)

  if (parts.length > 0) {
    return parts.join(" ")
  }

  return "Player"
}

export function formatTeamName(team?: ExtendedTeam | null): string {
  if (!team) {
    return "TBD"
  }

  if (hasContent(team.name)) {
    return team.name.trim()
  }

  if (Array.isArray(team.players) && team.players.length > 0) {
    const playerNames = team.players.map((player) => formatPlayerName(player)).filter(Boolean)

    if (playerNames.length > 0) {
      return playerNames.join(" / ")
    }
  }

  return "TBD"
}
