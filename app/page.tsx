"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // For demo purposes, redirect to director dashboard
    // In real app, this would check user authentication and role
    router.push("/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">MatchPoint</h1>
        <p className="text-muted-foreground">Loading tournament system...</p>
      </div>
    </div>
  )
}
