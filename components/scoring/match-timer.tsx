"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw } from "lucide-react"

interface MatchTimerProps {
  onPause?: () => void
  onResume?: () => void
  onReset?: () => void
  disabled?: boolean
}

export function MatchTimer({ onPause, onResume, onReset, disabled = false }: MatchTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false)
      onPause?.()
    } else {
      setIsRunning(true)
      onResume?.()
    }
  }

  const handleReset = () => {
    setSeconds(0)
    setIsRunning(false)
    onReset?.()
  }

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-lg font-mono px-3 py-1">
        {formatTime(seconds)}
      </Badge>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleToggle} disabled={disabled}>
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button variant="outline" size="sm" onClick={handleReset} disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
