"use client"

import type { ReactNode } from "react"
import type { UserRole } from "@/lib/types"
import { Navigation } from "./navigation"
import { RoleGuard } from "./role-guard"
import { Button } from "@/components/ui/button"
import { Bell, Search, User } from "lucide-react"

interface AppLayoutProps {
  children: ReactNode
  userRoles: UserRole[]
  userName?: string
}

export function AppLayout({ children, userRoles, userName = "Tournament User" }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <Navigation userRoles={userRoles} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top App Bar */}
          <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Navigation userRoles={userRoles} isMobile />

              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-md px-3 py-2 min-w-64">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search matches, players..."
                  className="bg-transparent border-0 outline-0 text-sm flex-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{userName}</span>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6">
            <RoleGuard userRoles={userRoles}>{children}</RoleGuard>
          </main>
        </div>
      </div>
    </div>
  )
}
