import type { UserRole } from "./types"

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  director: [
    "view_dashboard",
    "manage_events",
    "manage_brackets",
    "manage_queue",
    "manage_courts",
    "manage_users",
    "view_reports",
    "manage_settings",
  ],
  referee: ["view_matches", "score_matches", "view_queue", "manage_timeouts"],
  announcer: ["view_queue", "call_matches", "view_schedule", "manage_announcements"],
  player: ["view_my_matches", "view_brackets", "check_in"],
}

export function hasPermission(userRoles: UserRole[], permission: string): boolean {
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission))
}

export function canAccessRoute(userRoles: UserRole[], route: string): boolean {
  const routePermissions: Record<string, string> = {
    "/dashboard": "view_dashboard",
    "/events": "manage_events",
    "/brackets": "manage_brackets",
    "/queue": "manage_queue",
    "/matches": "view_matches",
    "/scoring": "score_matches",
    "/announcer": "call_matches",
    "/player": "view_my_matches",
    "/settings": "manage_settings",
    "/reports": "view_reports",
  }

  const requiredPermission = routePermissions[route]
  return requiredPermission ? hasPermission(userRoles, requiredPermission) : true
}
