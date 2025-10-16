"use client"

import { useEffect, useMemo, useState } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Pause, Play, RefreshCw } from "lucide-react"
import { OverviewView } from "./overview-view"
import { QueueView } from "./queue-view"
import { StandingsView } from "./standings-view"
import { BracketsView } from "./brackets-view"
import { PlayersView } from "./players-view"
import { CourtBoardView } from "./court-board-view"

const VIEW_REGISTRY = [
  { key: "overview", label: "Overview", component: OverviewView },
  { key: "queue", label: "Queue", component: QueueView },
  { key: "standings", label: "Standings", component: StandingsView },
  { key: "brackets", label: "Brackets", component: BracketsView },
  { key: "players", label: "Players", component: PlayersView },
  { key: "table", label: "Courts", component: CourtBoardView },
]

export function RotationView() {
  const { snapshot, refresh } = useLiveTournamentContext()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [remainingMs, setRemainingMs] = useState<number>(snapshot?.rotation?.intervalMs ?? 20000)

  const order = useMemo(() => {
    const requested = snapshot?.rotation?.order?.length
      ? snapshot.rotation.order.filter((key) => VIEW_REGISTRY.some((view) => view.key === key))
      : []
    if (requested.length > 0) return requested
    return VIEW_REGISTRY.map((view) => view.key)
  }, [snapshot?.rotation?.order])

  const intervalMs = snapshot?.rotation?.intervalMs ?? 20000

  useEffect(() => {
    setCurrentIndex(0)
  }, [order.join(",")])

  useEffect(() => {
    setRemainingMs(intervalMs)
  }, [intervalMs, currentIndex])

  useEffect(() => {
    if (order.length === 0 || isPaused) return

    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % order.length)
    }, intervalMs)

    return () => clearInterval(id)
  }, [order, intervalMs, isPaused])

  useEffect(() => {
    if (order.length === 0 || isPaused) return
    const tick = setInterval(() => {
      setRemainingMs((prev) => (prev - 1000 <= 0 ? intervalMs : prev - 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [order, isPaused, intervalMs])

  const activeKey = order[currentIndex] ?? VIEW_REGISTRY[0]?.key
  const activeView = VIEW_REGISTRY.find((view) => view.key === activeKey) ?? VIEW_REGISTRY[0]
  const ActiveComponent = activeView.component

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm uppercase tracking-wide">
            {activeView.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Next update in {Math.ceil(remainingMs / 1000)}s
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => refresh().catch(() => undefined)}
          >
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
          <Button
            variant={isPaused ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setIsPaused((prev) => !prev)}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.map((key) => {
          const view = VIEW_REGISTRY.find((entry) => entry.key === key)
          if (!view) return null
          const isActive = key === activeKey
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => {
                setCurrentIndex(order.indexOf(key))
                setRemainingMs(intervalMs)
              }}
            >
              {view.label}
            </Button>
          )
        })}
      </div>

      <Card className="min-h-[60vh] overflow-hidden border-none bg-transparent shadow-none">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-lg">
          <ActiveComponent key={activeKey} />
        </div>
      </Card>
    </div>
  )
}
