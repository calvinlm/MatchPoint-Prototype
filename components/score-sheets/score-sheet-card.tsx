"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, Eye } from "lucide-react";

type ScoreSheetTeam = {
  id: string;
  eventId: string;
  players: Array<{ id: string; firstName: string; lastName: string }>;
};

type ScoreSheetGame = {
  seq: number;
  scoreA: number;
  scoreB: number;
  serving?: "A" | "B";
  timeoutsA?: number;
  timeoutsB?: number;
};

export type ScoreSheetMatch = {
  id: string;
  number: number;
  eventId: string;
  round: number;
  status: "queued" | "live" | "completed";
  teams: ScoreSheetTeam[];
  games: ScoreSheetGame[];
};

interface ScoreSheetCardProps {
  match: ScoreSheetMatch;
  onPrint: (matchId: string) => void;
  onDownload: (matchId: string) => void;
  onPreview: (matchId: string) => void;
}

export function ScoreSheetCard({ match, onPrint, onDownload, onPreview }: ScoreSheetCardProps) {
  const getStatusColor = (status: ScoreSheetMatch["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "live":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "queued":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
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
                {team.players.map((player) => `${player.firstName} ${player.lastName}`).join(", ")}
              </div>
            ))}
          </div>
        </div>

        {match.status === "completed" && match.games.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Final Score</div>
            <div className="text-sm font-medium">
            {match.games.map((game) => (
              <span key={game.seq} className="mr-2">
                Game {game.seq}: {game.scoreA}-{game.scoreB}
              </span>
            ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onPreview(match.id)}>
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPrint(match.id)}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownload(match.id)}>
            <Download className="mr-1 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
