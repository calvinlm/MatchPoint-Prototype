"use client"

import type { ReactNode } from "react"
import type { UserRole } from "@/lib/types"
import { canAccessRoute } from "@/lib/auth"
import { usePathname } from "next/navigation"

interface RoleGuardProps {
  children: ReactNode
  userRoles: UserRole[]
  fallback?: ReactNode
}

export function RoleGuard({ children, userRoles, fallback }: RoleGuardProps) {
  const pathname = usePathname()

  if (!canAccessRoute(userRoles, pathname)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
