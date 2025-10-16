export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"

interface ApiError {
  error?: string
  message?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new Error(`Failed to parse API response: ${(error as Error).message}`)
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  })

  const payload = await parseJson<T | (ApiError & { data?: T })>(response)

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload && "error" in payload && payload.error) ||
      (typeof payload === "object" && payload && "message" in payload && payload.message) ||
      response.statusText

    throw new Error(message)
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload.data as T
  }

  return payload as T
}

export async function updateMatch(matchId: string, updates: Record<string, unknown>) {
  return apiFetch(`/api/matches/${matchId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
}

export async function startMatch(matchId: string) {
  return apiFetch(`/api/matches/${matchId}/start`, {
    method: "POST",
  })
}

export async function updateCourt(courtId: string, updates: Record<string, unknown>) {
  return apiFetch(`/api/courts/${courtId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
}

export async function reorderQueue(
  queue: Array<{
    id: string
    priority: number
  }>,
) {
  return apiFetch(`/api/queue/reorder`, {
    method: "POST",
    body: JSON.stringify({ queue }),
  })
}
