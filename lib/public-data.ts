import type { Court, Match, Player, QueueItem, Team } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

export type MetricTrend = "up" | "down" | "neutral"

export interface OverviewMetric {
  id: string
  title: string
  value: string | number
  change?: { value: string; trend: MetricTrend }
  icon?: string
}

export interface StandingsEntry extends Team {
  position: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  streak: number
  streakType: "win" | "loss"
}

export interface CourtAssignment extends Court {
  currentMatch?: Match | null
  nextMatch?: Match | null
}

export interface TableAssignment {
  id: string
  label: string
  status: Court["status"]
  currentMatch?: Match | null
  nextMatch?: Match | null
}

export interface PublicTournamentSnapshot {
  slug: string
  event: {
    id: string
    name: string
    location?: string
    startDate?: string
    endDate?: string
    description?: string
  }
  overview: {
    metrics: OverviewMetric[]
    announcements?: string[]
    featureMatches?: Match[]
    upcomingMatches?: Match[]
  }
  brackets: {
    matches: Match[]
  }
  standings: {
    eventName: string
    entries: StandingsEntry[]
  }
  queue: {
    items: (QueueItem & { match: Match })[]
    courts: CourtAssignment[]
  }
  players: (Player & { division?: string; skill?: string; hometown?: string })[]
  courts: CourtAssignment[]
  tables: TableAssignment[]
  rotation?: {
    order: string[]
    intervalMs: number
  }
  lastUpdated?: string
}

export type PublicSnapshotPatch = Partial<PublicTournamentSnapshot>

export async function fetchPublicSnapshot(slug: string): Promise<PublicTournamentSnapshot> {
  if (!API_BASE) {
    return getMockSnapshot(slug)
  }

  try {
    const res = await fetch(`${API_BASE}/api/public/${slug}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch public snapshot: ${res.status}`)
    }

    const body = await res.json()
    const payload = (body?.data ?? body) as PublicTournamentSnapshot

    if (!payload || !payload.event?.name) {
      throw new Error("Invalid snapshot payload")
    }

    return normalizeSnapshot(payload)
  } catch (err) {
    console.warn(`[public-data] Falling back to mock data for ${slug}:`, err)
    return getMockSnapshot(slug)
  }
}

export function subscribeToPublicStream(
  slug: string,
  onMessage: (patch: PublicSnapshotPatch) => void,
) {
  if (typeof window === "undefined" || typeof EventSource === "undefined" || !API_BASE) {
    return () => {}
  }

  const source = new EventSource(`${API_BASE}/api/public/${slug}/stream`)

  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      const patch = (payload?.data ?? payload) as PublicSnapshotPatch
      if (patch) {
        onMessage(normalizeSnapshotPatch(patch))
      }
    } catch (err) {
      console.error("[public-data] Failed to parse SSE payload", err)
    }
  }

  source.onerror = () => {
    source.close()
  }

  return () => {
    source.close()
  }
}

export function mergeSnapshots(
  current: PublicTournamentSnapshot | null,
  patch: PublicTournamentSnapshot | PublicSnapshotPatch,
): PublicTournamentSnapshot {
  if (!current) {
    return normalizeSnapshot(patch as PublicTournamentSnapshot)
  }

  return normalizeSnapshot(deepMerge(current, patch))
}

function deepMerge<T extends Record<string, any>>(base: T, patch: any): T {
  if (patch === null || patch === undefined) {
    return base
  }

  if (Array.isArray(patch)) {
    return patch as T
  }

  if (typeof patch !== "object") {
    return patch as T
  }

  const result: Record<string, any> = { ...base }

  for (const key of Object.keys(patch)) {
    const nextValue = patch[key]
    const currentValue = (base as Record<string, any>)[key]
    if (Array.isArray(nextValue)) {
      result[key] = nextValue
    } else if (nextValue && typeof nextValue === "object") {
      result[key] = deepMerge(currentValue ?? {}, nextValue)
    } else {
      result[key] = nextValue
    }
  }

  return result as T
}

function normalizeSnapshot(snapshot: PublicTournamentSnapshot): PublicTournamentSnapshot {
  return {
    ...snapshot,
    overview: {
      metrics: snapshot.overview?.metrics ?? [],
      announcements: snapshot.overview?.announcements ?? [],
      featureMatches: snapshot.overview?.featureMatches ?? [],
      upcomingMatches: snapshot.overview?.upcomingMatches ?? [],
    },
    brackets: {
      matches: snapshot.brackets?.matches ?? [],
    },
    standings: {
      eventName: snapshot.standings?.eventName ?? snapshot.event.name,
      entries: snapshot.standings?.entries ?? [],
    },
    queue: {
      items: snapshot.queue?.items ?? [],
      courts: snapshot.queue?.courts ?? snapshot.courts ?? [],
    },
    players: snapshot.players ?? [],
    courts: snapshot.courts ?? [],
    tables: snapshot.tables ?? [],
    rotation: snapshot.rotation ?? {
      order: ["overview", "queue", "standings", "brackets", "players", "table"],
      intervalMs: 20000,
    },
    lastUpdated: snapshot.lastUpdated ?? new Date().toISOString(),
  }
}

function normalizeSnapshotPatch(patch: PublicSnapshotPatch): PublicSnapshotPatch {
  if (!patch) return patch
  const normalized: PublicSnapshotPatch = { ...patch }

  if (patch.overview) {
    normalized.overview = {
      metrics: patch.overview.metrics ?? [],
      announcements: patch.overview.announcements ?? [],
      featureMatches: patch.overview.featureMatches ?? [],
      upcomingMatches: patch.overview.upcomingMatches ?? [],
    }
  }

  if (patch.brackets) {
    normalized.brackets = {
      matches: patch.brackets.matches ?? [],
    }
  }

  if (patch.standings) {
    normalized.standings = {
      eventName: patch.standings.eventName,
      entries: patch.standings.entries ?? [],
    }
  }

  if (patch.queue) {
    normalized.queue = {
      items: patch.queue.items ?? [],
      courts: patch.queue.courts ?? [],
    }
  }

  if (patch.players && !Array.isArray(patch.players)) {
    normalized.players = []
  }

  if (patch.courts && !Array.isArray(patch.courts)) {
    normalized.courts = []
  }

  if (patch.tables && !Array.isArray(patch.tables)) {
    normalized.tables = []
  }

  return normalized
}

function getMockSnapshot(slug: string): PublicTournamentSnapshot {
  const now = new Date()
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
  const matches: Match[] = [
    {
      id: "m1",
      number: 101,
      eventId: "e1",
      round: 1,
      teams: [
        {
          id: "t1",
          name: "Smith / Johnson",
          players: [
            { id: 1, name: "John Smith", age: 32, gender: "MALE", address: "", contactNumber: "", createdAt: now.toISOString() },
            { id: 2, name: "Mike Johnson", age: 31, gender: "MALE", address: "", contactNumber: "", createdAt: now.toISOString() },
          ],
          eventId: "e1",
          seed: 1,
        },
        {
          id: "t2",
          name: "Garcia / Patel",
          players: [
            { id: 3, name: "Ana Garcia", age: 29, gender: "FEMALE", address: "", contactNumber: "", createdAt: now.toISOString() },
            { id: 4, name: "Priya Patel", age: 30, gender: "FEMALE", address: "", contactNumber: "", createdAt: now.toISOString() },
          ],
          eventId: "e1",
          seed: 8,
        },
      ],
      status: "live",
      games: [
        { seq: 1, scoreA: 7, scoreB: 5, serving: "A", timeoutsA: 0, timeoutsB: 0 },
        { seq: 2, scoreA: 6, scoreB: 7, serving: "B", timeoutsA: 1, timeoutsB: 0 },
      ],
      startedAt: now,
    },
    {
      id: "m2",
      number: 102,
      eventId: "e1",
      round: 1,
      teams: [
        {
          id: "t3",
          name: "Lee / Nguyen",
          players: [
            { id: 5, name: "Chris Lee", age: 26, gender: "MALE", address: "", contactNumber: "", createdAt: now.toISOString() },
            { id: 6, name: "Mai Nguyen", age: 27, gender: "FEMALE", address: "", contactNumber: "", createdAt: now.toISOString() },
          ],
          eventId: "e1",
          seed: 4,
        },
        {
          id: "t4",
          name: "Baker / Chen",
          players: [
            { id: 7, name: "Sam Baker", age: 34, gender: "MALE", address: "", contactNumber: "", createdAt: now.toISOString() },
            { id: 8, name: "Lin Chen", age: 33, gender: "FEMALE", address: "", contactNumber: "", createdAt: now.toISOString() },
          ],
          eventId: "e1",
          seed: 5,
        },
      ],
      status: "queued",
      games: [],
    },
  ]

  const queueItems: (QueueItem & { match: Match })[] = [
    { id: "qi1", matchId: "m2", priority: 1, match: matches[1] },
    {
      id: "qi2",
      matchId: "m3",
      priority: 2,
      match: {
        ...matches[1],
        id: "m3",
        number: 103,
        teams: matches[1].teams.map((team, index) => ({
          ...team,
          id: `t${index + 5}`,
          name: index === 0 ? "Lopez / Martin" : "Hernandez / Davis",
        })) as [Team, Team],
      },
    },
  ]

  const courts: CourtAssignment[] = [
    {
      id: "c1",
      name: "Court 1",
      location: "Championship",
      status: "playing",
      currentMatch: matches[0],
    },
    {
      id: "c2",
      name: "Court 2",
      location: "North Wing",
      status: "idle",
      currentMatch: null,
    },
    {
      id: "c3",
      name: "Court 3",
      location: "South Wing",
      status: "hold",
      currentMatch: null,
    },
  ]

  const standingsEntries: StandingsEntry[] = [
    {
      id: "t1",
      name: "Smith / Johnson",
      players: courts[0].currentMatch?.teams[0].players ?? [],
      eventId: "e1",
      position: 1,
      wins: 5,
      losses: 1,
      pointsFor: 132,
      pointsAgainst: 98,
      pointDifferential: 34,
      streak: 3,
      streakType: "win",
    },
    {
      id: "t2",
      name: "Garcia / Patel",
      players: courts[0].currentMatch?.teams[1].players ?? [],
      eventId: "e1",
      position: 2,
      wins: 4,
      losses: 2,
      pointsFor: 118,
      pointsAgainst: 105,
      pointDifferential: 13,
      streak: 1,
      streakType: "loss",
    },
    {
      id: "t3",
      name: "Lee / Nguyen",
      players: matches[1].teams[0].players,
      eventId: "e1",
      position: 3,
      wins: 4,
      losses: 2,
      pointsFor: 110,
      pointsAgainst: 101,
      pointDifferential: 9,
      streak: 2,
      streakType: "win",
    },
  ]

  const players: PublicTournamentSnapshot["players"] = [
    ...matches.flatMap((match) =>
      match.teams.flatMap((team) =>
        team.players.map((player) => ({
          ...player,
          division: "Mixed Doubles",
          skill: "4.0",
          hometown: "San Diego, CA",
        })),
      ),
    ),
  ]

  const tables: TableAssignment[] = [
    {
      id: "t1",
      label: "Table 1",
      status: "playing",
      currentMatch: matches[0],
    },
    {
      id: "t2",
      label: "Table 2",
      status: "idle",
      currentMatch: null,
      nextMatch: matches[1],
    },
    {
      id: "t3",
      label: "Table 3",
      status: "cleaning",
      currentMatch: null,
    },
  ]

  return {
    slug,
    event: {
      id: "e1",
      name: "MatchPoint Open Series",
      location: "Sunrise Sports Complex",
      startDate: now.toISOString(),
      endDate: nextHour.toISOString(),
    },
    overview: {
      metrics: [
        { id: "active-courts", title: "Courts Active", value: "3 / 5", change: { value: "+1", trend: "up" } },
        { id: "queue", title: "Matches in Queue", value: queueItems.length, change: { value: "-2", trend: "down" } },
        { id: "live", title: "Live Matches", value: 4, change: { value: "+1", trend: "up" } },
        { id: "completed", title: "Completed Today", value: 27, change: { value: "+5", trend: "up" } },
      ],
      announcements: ["Welcome to finals day!", "Remember to report scores promptly."],
      featureMatches: matches.slice(0, 1),
      upcomingMatches: matches.slice(1),
    },
    brackets: {
      matches,
    },
    standings: {
      eventName: "Mixed Doubles 4.0",
      entries: standingsEntries,
    },
    queue: {
      items: queueItems,
      courts,
    },
    players,
    courts,
    tables,
    rotation: {
      order: ["overview", "queue", "standings", "brackets", "players", "table"],
      intervalMs: 20000,
    },
    lastUpdated: now.toISOString(),
  }
}
