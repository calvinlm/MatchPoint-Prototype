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
  /**
   * Legacy full name field returned by the backend. Optional for forward
   * compatibility with split first/last name fields.
   */
  name?: string
  firstName?: string
  lastName?: string
  displayName?: string
  age?: number
  gender?: "MALE" | "FEMALE"
  address?: string
  contactNumber?: string
  rating?: number
  createdAt?: string
  checkedIn?: boolean
}

export interface Team {
  id: string
  name?: string
  players: Player[]
  seed?: number
  eventId: string
}

export interface Court {
  id: string
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
  id: string
  number: number
  eventId: string
  round: number
  bracketSide?: "W" | "L"
  courtId?: string
  refereeId?: string
  teams: [Team, Team]
  status: "queued" | "assigned" | "live" | "completed" | "disputed"
  games: Game[]
  winnerTeamId?: string
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
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
  id: string
  matchId: string
  priority: number
  note?: string
}
