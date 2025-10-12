"use client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Edit, Trash2, UserPlus } from "lucide-react";
import type { Team } from "./types";


interface TeamCardProps {
  team: Team;
  onEdit: (teamId: string) => void;
  onDelete: (teamId: string) => void;
  onAddPlayer: (teamId: string) => void;
}


export function TeamCard({ team, onEdit, onDelete, onAddPlayer }: TeamCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team {team.id}
          </CardTitle>
        </div>
        {team.eventName && (
          <div className="text-sm text-muted-foreground">{team.eventName}</div>
        )}
      </CardHeader>


      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Players</div>
          <div className="space-y-2">
            {team.players.map((player) => (
              <div key={player.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {player.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{player.name}</span>
              </div>
            ))}
          </div>
        </div>


        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onAddPlayer(team.id)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Player
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(team.id)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(team.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}