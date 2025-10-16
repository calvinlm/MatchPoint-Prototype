"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  PublicSnapshotPatch,
  PublicTournamentSnapshot,
} from "@/lib/public-data"
import {
  fetchPublicSnapshot,
  mergeSnapshots,
  subscribeToPublicStream,
} from "@/lib/public-data"

interface LiveSnapshotState {
  snapshot: PublicTournamentSnapshot | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

export function useLiveTournamentSnapshot(slug: string): LiveSnapshotState {
  const [snapshot, setSnapshot] = useState<PublicTournamentSnapshot | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPublicSnapshot(slug)
      setSnapshot((prev) => mergeSnapshots(prev, data))
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament data")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === "undefined") return

    const unsubscribe = subscribeToPublicStream(slug, (patch: PublicSnapshotPatch) => {
      setSnapshot((prev) => mergeSnapshots(prev, patch))
      setLastUpdated(new Date())
    })

    return unsubscribe
  }, [slug])

  return useMemo(
    () => ({
      snapshot,
      loading,
      error,
      lastUpdated,
      refresh,
    }),
    [snapshot, loading, error, lastUpdated, refresh],
  )
}
