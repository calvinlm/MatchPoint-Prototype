import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Team } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  onSave: (team: Team) => void;
}

export function EditTeamDialog({ open, onOpenChange, team, onSave }: Props) {
  const [id, setId] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  useEffect(() => {
    setId(team?.id ?? "");
    setP1(team?.player1 ?? "");
    setP2(team?.player2 ?? "");
  }, [team]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>Update team code and player names.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="team-id">Team Code</Label>
            <Input id="team-id" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p1">Player 1</Label>
            <Input id="p1" value={p1} onChange={(e) => setP1(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p2">Player 2</Label>
            <Input id="p2" value={p2} onChange={(e) => setP2(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => team && onSave({ id, player1: p1, player2: p2 })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
