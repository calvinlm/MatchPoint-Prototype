import type { Player, Team } from "./types"

const FALLBACK_NAME = "TBD"

export function getPlayerDisplayName(player?: Player | null) {
  if (!player) {
    return FALLBACK_NAME
  }

  const first = player.firstName?.trim()
  const last = player.lastName?.trim()
  if (first && last) {
    return `${first} ${last}`
  }

  if (first) {
    return first
  }

  if (last) {
    return last
  }

  const display = player.displayName?.trim() || player.name?.trim()
  return display || FALLBACK_NAME
}

export function getTeamDisplayName(team?: Team | null) {
  if (!team) {
    return FALLBACK_NAME
  }

  const teamName = team.name?.trim()
  if (teamName) {
    return teamName
  }

  const playerNames = team.players
    .map((player) => getPlayerDisplayName(player))
    .filter((name) => name && name !== FALLBACK_NAME)

  if (playerNames.length === 0) {
    return FALLBACK_NAME
  }

  if (playerNames.length === 1) {
    return playerNames[0]
  }

  return playerNames.join(" & ")
}
