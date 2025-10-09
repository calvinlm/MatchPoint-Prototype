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
  Users,
  GitBranch,
  Clock3,
  FileText,
  User as UserIcon,
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
  { label: "Player Details", href: "/players", icon: UserIcon, permission: "manage_events" },
  { label: "Manage Teams", href: "/teams", icon: Users, permission: "manage_events" },
  { label: "Bracket Setup", href: "/brackets", icon: GitBranch, permission: "manage_brackets" },
  { label: "Match Queue", href: "/queue", icon: Clock3, permission: "manage_queue" },
  { label: "Score Sheet", href: "/score-sheets", icon: FileText, permission: "manage_events" },
]

interface NavigationProps {
  userRoles: UserRole[]
  isMobile?: boolean
}

const baseItem =
  "group flex items-center gap-3 pl-8 pr-4 py-3 text-nav leading-6 font-medium text-brand hover:opacity-80"

export function Navigation({ userRoles, isMobile = false }: NavigationProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const visibleItems = navigationItems.filter((i) => hasPermission(userRoles, i.permission))

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
                <img 
                  src="/logo.svg"
                  alt="Matchpoint Logo"
                  className="w-40 h-auto mb-1"  // you can adjust w-40 as needed
                />
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
      <div className="pt-6 px-6 pb-0 flex flex-col items-start">
        <img 
          src="/logo.svg"
          alt="Matchpoint Logo"
          className="w-70 h-auto mb-1"  // you can adjust w-40 as needed
        />
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
