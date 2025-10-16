import type { ReactNode } from "react"
import { LiveTournamentProvider } from "@/components/public/live-tournament-provider"
import { KioskChrome } from "@/components/public/kiosk-chrome"

interface PublicKioskLayoutProps {
  children: ReactNode
  params: { slug: string }
}

export default function PublicKioskLayout({ children, params }: PublicKioskLayoutProps) {
  return (
    <LiveTournamentProvider slug={params.slug}>
      <KioskChrome slug={params.slug}>{children}</KioskChrome>
    </LiveTournamentProvider>
  )
}
