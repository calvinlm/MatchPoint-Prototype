"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { UserRole } from "@/lib/types"
import { hasPermission } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Trophy,
  GitBranch,
  Quote as Queue,
  Play,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Megaphone,
  Gamepad2,
  User,
  Monitor,
  Settings,
  Menu,
  X,
} from "lucide-react"

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
  roles?: UserRole[]
}

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { label: "Events & Brackets", href: "/events", icon: Trophy, permission: "manage_events" },
  { label: "Bracket Builder", href: "/brackets", icon: GitBranch, permission: "manage_brackets" },
  { label: "Match Queue", href: "/queue", icon: Queue, permission: "manage_queue" },
  { label: "Live Matches", href: "/matches", icon: Play, permission: "view_matches" },
  { label: "Score Sheets", href: "/score-sheets", icon: FileText, permission: "manage_events" },
  { label: "Players & Teams", href: "/players", icon: Users, permission: "manage_events" },
  { label: "Schedule", href: "/schedule", icon: Calendar, permission: "view_schedule" },
  { label: "Standings", href: "/standings", icon: BarChart3, permission: "view_brackets" },
  { label: "Announcer Console", href: "/announcer", icon: Megaphone, permission: "call_matches" },
  { label: "Referee Pad", href: "/scoring", icon: Gamepad2, permission: "score_matches" },
  { label: "My Matches", href: "/player", icon: User, permission: "view_my_matches" },
  { label: "Scoreboard", href: "/scoreboard", icon: Monitor, permission: "view_matches" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "manage_settings" },
]

interface NavigationProps {
  userRoles: UserRole[]
  isMobile?: boolean
}

export function Navigation({ userRoles, isMobile = false }: NavigationProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const visibleItems = navigationItems.filter((item) => hasPermission(userRoles, item.permission))

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
            <div className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-sidebar-foreground">MatchPoint</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <nav className="hidden md:flex md:flex-col md:w-64 md:bg-sidebar md:border-r md:border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">MatchPoint</h1>
        <p className="text-sm text-sidebar-foreground/70">Tournament Manager</p>
      </div>
      <div className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
