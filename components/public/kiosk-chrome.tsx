"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useLiveTournamentContext } from "@/components/public/live-tournament-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { CalendarDays, MapPin, RefreshCw, Tv } from "lucide-react"

interface KioskChromeProps {
  slug: string
  children: ReactNode
}

const DEFAULT_REFRESH_INTERVAL = 60_000

const links = [
  { href: "overview", label: "Overview" },
  { href: "queue", label: "Live Queue" },
  { href: "standings", label: "Standings" },
  { href: "brackets", label: "Brackets" },
  { href: "players", label: "Players" },
  { href: "table", label: "Courts & Tables" },
  { href: "rotation", label: "TV Mode" },
]

export function KioskChrome({ slug, children }: KioskChromeProps) {
  const pathname = usePathname()
  const { snapshot, loading, lastUpdated, refresh } = useLiveTournamentContext()
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshInterval = snapshot?.rotation?.intervalMs ?? DEFAULT_REFRESH_INTERVAL

  useEffect(() => {
    const id = setInterval(() => {
      refresh().catch(() => undefined)
    }, refreshInterval)

    return () => clearInterval(id)
  }, [refresh, refreshInterval])

  const basePath = useMemo(() => `/public/${slug}`, [slug])

  const isActive = (href: string) => {
    const target = `${basePath}/${href}`
    return pathname?.startsWith(target)
  }

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [now],
  )

  const formattedDate = useMemo(
    () =>
      snapshot?.event?.startDate
        ? new Date(snapshot.event.startDate).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : undefined,
    [snapshot?.event?.startDate],
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/95 backdrop-blur px-8 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <span>{snapshot?.event?.name ?? "MatchPoint Public Display"}</span>
              <Badge variant="secondary" className="text-xs font-medium">
                {formattedTime}
              </Badge>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {snapshot?.event?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {snapshot.event.location}
                </span>
              )}
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formattedDate}
                </span>
              )}
              {lastUpdated && (
                <span className="flex items-center gap-1">
                  <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refresh().catch(() => undefined)}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Now
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href={`${basePath}/rotation`}>
                <Tv className="h-4 w-4" />
                Start Rotation
              </Link>
            </Button>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={`${basePath}/${link.href}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-card/80 text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <Separator className="hidden" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
