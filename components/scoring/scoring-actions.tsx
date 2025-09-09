"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Undo2, FileText, AlertTriangle, CheckCircle } from "lucide-react"

interface ScoringAction {
  id: string
  timestamp: Date
  action: string
  description: string
}

interface ScoringActionsProps {
  actions: ScoringAction[]
  notes: string
  onNotesChange: (notes: string) => void
  onUndo: () => void
  onReportScore: () => void
  onDispute: () => void
  canUndo: boolean
  canSubmit: boolean
  disabled?: boolean
}

export function ScoringActions({
  actions,
  notes,
  onNotesChange,
  onUndo,
  onReportScore,
  onDispute,
  canUndo,
  canSubmit,
  disabled = false,
}: ScoringActionsProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="space-y-4">
      {/* Action History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Actions</CardTitle>
            <Button variant="outline" size="sm" onClick={onUndo} disabled={disabled || !canUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No actions yet</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {actions
                .slice(-5)
                .reverse()
                .map((action) => (
                  <div key={action.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{action.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {action.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Match Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about the match, incidents, or disputes..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={disabled}
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" onClick={onDispute} disabled={disabled} className="w-full bg-transparent">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Dispute
        </Button>

        <Button onClick={onReportScore} disabled={disabled || !canSubmit} className="w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          Submit Score
        </Button>
      </div>

      {/* Detailed Actions Toggle */}
      <Button variant="ghost" size="sm" onClick={() => setShowActions(!showActions)} className="w-full text-xs">
        <FileText className="h-3 w-3 mr-2" />
        {showActions ? "Hide" : "Show"} All Actions ({actions.length})
      </Button>

      {/* Detailed Actions List */}
      {showActions && actions.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {actions.map((action) => (
                <div key={action.id} className="text-xs border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{action.action}</span>
                    <span className="text-muted-foreground">{action.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{action.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
