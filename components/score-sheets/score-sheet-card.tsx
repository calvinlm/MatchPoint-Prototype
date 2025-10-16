"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Printer, Eye } from "lucide-react"
import type { Match } from "@/lib/types"
import { getPlayerDisplayName } from "@/lib/player"

interface ScoreSheetCardProps {
  match: Match
  onPrint: (matchId: string) => void
  onDownload: (matchId: string) => void
  onPreview: (matchId: string) => void
}

export function ScoreSheetCard({ match, onPrint, onDownload, onPreview }: ScoreSheetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "live":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "queued":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Match #{match.number}
          </CardTitle>
          <Badge className={getStatusColor(match.status)}>{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Teams</div>
          <div className="space-y-1">
            {match.teams.map((team, index) => (
              <div key={team.id} className="text-sm">
                <span className="font-medium">Team {index + 1}:</span>{" "}
                {team.players
                  .map((player) => getPlayerDisplayName(player))
                  .filter((name) => name !== "TBD")
                  .join(", ")}
              </div>
            ))}
          </div>
        </div>

        {match.status === "completed" && match.games.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Final Score</div>
            <div className="text-sm font-medium">
              {match.games.map((game, index) => (
                <span key={index} className="mr-2">
                  Game {index + 1}: {game.scoreA}-{game.scoreB}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onPreview(match.id)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPrint(match.id)}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownload(match.id)}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
