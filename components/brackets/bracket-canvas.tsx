"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"
import { BracketNode } from "./bracket-node"
import { Button } from "@/components/ui/button"
import type { Match } from "@/lib/types"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface BracketCanvasProps {
  matches: Match[]
  onMatchClick?: (match: Match) => void
  className?: string
}

interface ViewState {
  scale: number
  translateX: number
  translateY: number
}

export function BracketCanvas({ matches, onMatchClick, className }: BracketCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Calculate bracket layout positions
  const calculatePositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    const rounds = Math.max(...matches.map((m) => m.round))
    const horizontalSpacing = 280
    const verticalSpacing = 140

    // Group matches by round
    const matchesByRound: Record<number, Match[]> = {}
    matches.forEach((match) => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = []
      }
      matchesByRound[match.round].push(match)
    })

    // Position matches for each round
    for (let round = 1; round <= rounds; round++) {
      const roundMatches = matchesByRound[round] || []
      const startY = -(roundMatches.length * verticalSpacing) / 2

      roundMatches.forEach((match, index) => {
        positions[match.id] = {
          x: (round - 1) * horizontalSpacing,
          y: startY + index * verticalSpacing,
        }
      })
    }

    return positions
  }, [matches])

  const positions = calculatePositions()

  // Handle mouse events for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - viewState.translateX, y: e.clientY - viewState.translateY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setViewState((prev) => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y,
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta)),
    }))
  }

  const zoomIn = () => {
    setViewState((prev) => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))
  }

  const zoomOut = () => {
    setViewState((prev) => ({ ...prev, scale: Math.max(0.1, prev.scale / 1.2) }))
  }

  const resetView = () => {
    setViewState({ scale: 1, translateX: 0, translateY: 0 })
  }

  // Draw connection lines between matches
  const renderConnections = () => {
    const connections: JSX.Element[] = []

    matches.forEach((match) => {
      if (match.round > 1) {
        const currentPos = positions[match.id]
        if (currentPos) {
          // Find previous round matches that feed into this match
          const prevRoundMatches = matches.filter((m) => m.round === match.round - 1)

          prevRoundMatches.slice(0, 2).forEach((prevMatch) => {
            const prevPos = positions[prevMatch.id]
            if (prevPos) {
              const key = `${prevMatch.id}-${match.id}`
              connections.push(
                <svg
                  key={key}
                  className="absolute pointer-events-none"
                  style={{
                    left: prevPos.x + 200,
                    top: Math.min(prevPos.y, currentPos.y) + 60,
                    width: 80,
                    height: Math.abs(currentPos.y - prevPos.y) + 60,
                  }}
                >
                  <path
                    d={`M 0 ${prevPos.y < currentPos.y ? 0 : Math.abs(currentPos.y - prevPos.y)} 
                        L 40 ${prevPos.y < currentPos.y ? 0 : Math.abs(currentPos.y - prevPos.y)}
                        L 40 ${prevPos.y < currentPos.y ? Math.abs(currentPos.y - prevPos.y) : 0}
                        L 80 ${prevPos.y < currentPos.y ? Math.abs(currentPos.y - prevPos.y) : 0}`}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>,
              )
            }
          })
        }
      }
    })

    return connections
  }

  return (
    <div className={`relative w-full h-full bg-muted/20 rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={resetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${viewState.translateX}px, ${viewState.translateY}px) scale(${viewState.scale})`,
            transformOrigin: "0 0",
            width: "200%",
            height: "200%",
          }}
        >
          {/* Connection lines */}
          {renderConnections()}

          {/* Match nodes */}
          {matches.map((match) => {
            const position = positions[match.id]
            if (!position) return null

            return (
              <BracketNode key={match.id} match={match} position={position} onClick={() => onMatchClick?.(match)} />
            )
          })}
        </div>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {Math.round(viewState.scale * 100)}%
      </div>
    </div>
  )
}
