"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { BracketBuilder } from "@/components/brackets/bracket-builder"
import type { UserRole } from "@/lib/types"

export default function BracketBuilderPage() {
  const userRoles: UserRole[] = ["director"]

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bracket Builder</h1>
          <p className="text-muted-foreground">Create and configure tournament brackets</p>
        </div>

        <BracketBuilder
          onCreateBracket={(eventData) => {
            console.log("Creating bracket with:", eventData)
            // Handle bracket creation
          }}
        />
      </div>
    </AppLayout>
  )
}
