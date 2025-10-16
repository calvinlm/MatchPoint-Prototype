export type UserRole = "director" | "referee" | "announcer" | "player"

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  phone?: string
}

export interface Player {
  id: number
  name: string
  age: number
  gender: "MALE" | "FEMALE"
  address: string
  contactNumber: string
  createdAt: string
  checkedIn?: boolean
  firstName?: string
  lastName?: string
  rating?: number
}

export interface Team {
  id: string
  name?: string
  players: Player[]
  seed?: number
  eventId: string
  entryCode?: string
  registrations?: { divisionId: number | null; entryCode: string }[]
}

export interface Court {
  id: number | string
  name: string
  location?: string
  status: "idle" | "playing" | "hold" | "cleaning"
  displayUrl?: string
}

export interface Game {
  seq: number
  scoreA: number
  scoreB: number
  serving: "A" | "B"
  timeoutsA: number
  timeoutsB: number
}

export interface Match {
  id: number | string
  number: number
  eventId: string
  round: number
  bracketSide?: "W" | "L"
  courtId?: number | null
  refereeId?: string
  teams: [Team, Team]
  status: "queued" | "assigned" | "live" | "completed" | "disputed"
  games: Game[]
  winnerTeamId?: string
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
  meta?: unknown
}

export interface Event {
  id: string
  name: string
  format: "singleElim" | "doubleElim" | "roundRobin" | "poolPlay"
  division: string
  skill: string
  ball?: string
  bestOf: number
  gameTo: number
  winBy: number
}

export interface QueueItem {
  id: number | string
  matchId: number
  courtId?: number | null
  position: number
  version: number
  updatedAt?: string
  priority?: number
  note?: string
}
