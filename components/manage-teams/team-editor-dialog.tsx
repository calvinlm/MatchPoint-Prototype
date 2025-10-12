"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Prisma enums mapping in UI
export type AgeBracket = "A18" | "A35" | "A55" | "JUNIOR";
export type Division = "MS" | "MD" | "WS" | "WD" | "XD"; // S=Singles, D=Doubles
export type Level = "NOV" | "INT" | "ADV" | "OPN";

const divisionRequires = (d: Division) => (d.endsWith("S") ? 1 : 2);

interface TeamEditorProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  players: { id: number; name: string }[];
  initialValue?: { id?: number; categoryId?: number; eventName?: string; playerIds?: number[] };
  onSubmit: (data: { categoryId: number; playerIds: number[]; eventName?: string }) => Promise<void> | void;
}

export function TeamEditorDialog({ mode, open, onOpenChange, players, initialValue, onSubmit }: TeamEditorProps) {
  // category fields (if editing and you already have categoryId, you might lock these)
  const [age, setAge] = useState<AgeBracket | undefined>(undefined);
  const [division, setDivision] = useState<Division | undefined>(undefined);
  const [level, setLevel] = useState<Level | undefined>(undefined);
  const [eventName, setEventName] = useState<string>(initialValue?.eventName || "");

  // player selections
  const [picks, setPicks] = useState<number[]>(initialValue?.playerIds || []);
  const requiredCount = division ? divisionRequires(division) : 0;

  // if you have a categoryId in initial value, you could prefill based on a lookup
  // for demo simplicity we leave it manual; in production feed a Category select bound to categoryId

  const [categoryId, setCategoryId] = useState<number | undefined>(initialValue?.categoryId);

  const isValid = useMemo(() => {
    return Boolean(categoryId) && picks.length === requiredCount;
  }, [categoryId, picks.length, requiredCount]);

  useEffect(() => {
    // normalize picks length to required count when division changes
    if (requiredCount === 1 && picks.length > 1) setPicks((arr) => [arr[0]]);
  }, [requiredCount]);

  // Simple player combobox
  function PlayerCombo({ index }: { index: number }) {
    const value = picks[index];
    const [openPop, setOpenPop] = useState(false);

    const selected = players.find((p) => p.id === value);

    return (
      <div className="space-y-2">
        <Label>Player {index + 1}</Label>
        <Popover open={openPop} onOpenChange={setOpenPop}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selected ? selected.name : "Select player"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
            <Command>
              <CommandInput placeholder="Search players..." />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup>
                  {players.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        const next = [...picks];
                        next[index] = p.id;
                        setPicks(next);
                        setOpenPop(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", p.id === value ? "opacity-100" : "opacity-0")} />
                      {p.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Team" : "Edit Team"}</DialogTitle>
          <DialogDescription>Pick a category and required players. You cannot create a team without players.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isValid || !categoryId) return;
            await onSubmit({ categoryId, playerIds: picks, eventName: eventName || undefined });
            onOpenChange(false);
          }}
        >
          {/* Category selection (simplified to a Category ID select for now) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category (ID)</Label>
              <Input
                type="number"
                min={1}
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g., 1"
              />
              <p className="text-xs text-muted-foreground">Hook this up to a Category dropdown later.</p>
            </div>

            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={division} onValueChange={(v) => (setDivision(v as Division))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MS">Men's Singles</SelectItem>
                  <SelectItem value="MD">Men's Doubles</SelectItem>
                  <SelectItem value="WS">Women's Singles</SelectItem>
                  <SelectItem value="WD">Women's Doubles</SelectItem>
                  <SelectItem value="XD">Mixed Doubles</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Required players: {requiredCount || "—"}</p>
            </div>
          </div>

          {/* Event name */}
          <div className="space-y-2">
            <Label>Event Name (optional)</Label>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., 35+ Men's Doubles Intermediate" />
          </div>

          {/* Players selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: requiredCount || 0 }).map((_, i) => (
              <PlayerCombo key={i} index={i} />
            ))}
          </div>

          {requiredCount > 0 && picks.length !== requiredCount && (
            <p className="text-sm text-destructive">Select {requiredCount} player(s) to continue.</p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {mode === "create" ? "Save Team" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}