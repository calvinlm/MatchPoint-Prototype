"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, UserX, X } from "lucide-react"
import type { AlertMessage } from "@/lib/types"

interface AlertsPanelProps {
  alerts: (AlertMessage & {
    onAction?: () => void
    onDismiss?: () => void
  })[]
  onDismissAlert?: (alertId: string) => void
}

const alertConfig = {
  conflict: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-destructive text-destructive-foreground",
  },
  missing_ref: {
    icon: <UserX className="h-4 w-4" />,
    color: "bg-accent text-accent-foreground",
  },
  delay: {
    icon: <Clock className="h-4 w-4" />,
    color: "bg-chart-3 text-white",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-chart-3 text-white",
  },
}

export function AlertsPanel({ alerts, onDismissAlert }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">All clear! No active alerts.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = alertConfig[alert.type]
            return (
              <div key={alert.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>
                      {config.icon}
                      {alert.type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onDismissAlert?.(alert.id)} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
                {alert.actionLabel && alert.onAction && (
                  <Button size="sm" variant="outline" onClick={alert.onAction} className="w-full bg-transparent">
                    {alert.actionLabel}
                  </Button>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
