"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import type { AlertMessage, Court, Match, QueueItem } from "@/lib/types"

interface ApiResourceState<T> {
  data: T
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T>>
}

function useApiResource<T>(
  path: string,
  defaultValue: T,
  transform?: (payload: unknown) => T,
): ApiResourceState<T> {
  const [data, setData] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const payload = await apiFetch<unknown>(path)
      const nextData = transform ? transform(payload) : (payload as T)
      setData(nextData)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [path, transform])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, isLoading, error, refresh, setData }
}

export function useCourts() {
  return useApiResource<Court[]>("/api/courts", [])
}

export function useMatches() {
  return useApiResource<Match[]>("/api/matches", [], (payload) => {
    if (!Array.isArray(payload)) return []
    return payload as Match[]
  })
}

export function useQueue() {
  return useApiResource<(QueueItem & { match?: Match })[]>("/api/queue", [], (payload) => {
    if (!Array.isArray(payload)) return []
    return payload as (QueueItem & { match?: Match })[]
  })
}

export function useAlerts() {
  return useApiResource<AlertMessage[]>("/api/alerts", [], (payload) => {
    if (!Array.isArray(payload)) return []

    return payload.map((alert) => ({
      ...alert,
      timestamp: new Date((alert as { timestamp?: string | number | Date }).timestamp ?? Date.now()),
    })) as AlertMessage[]
  })
}

export function useMatch(matchId?: string | null) {
  const [match, setMatch] = useState<Match | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!matchId) {
      setMatch(null)
      return
    }

    setIsLoading(true)
    try {
      const payload = await apiFetch<Match>(`/api/matches/${matchId}`)
      setMatch(payload)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { match, setMatch, isLoading, error, refresh }
}
