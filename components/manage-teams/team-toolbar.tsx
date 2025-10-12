import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles } from "lucide-react";

interface Props {
  category: string | null;
  onCategoryChange: (val: string | null) => void;
  query: string;
  onQueryChange: (val: string) => void;
  onOrganize: () => void;
}

export function TeamToolbar({ category, onCategoryChange, query, onQueryChange, onOrganize }: Props) {
  return (
    <section className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Filter by category</Label>
        <Select value={category ?? undefined} onValueChange={(v) => onCategoryChange(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="35+">35+ Division</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="mixed">Mixed Doubles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Search teams or players</Label>
        <Input
          placeholder="Search by team code or player nameâ€¦"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="flex items-end justify-end gap-2">
        <Button variant="secondary" className="rounded-xl" onClick={onOrganize}>
          <Sparkles className="mr-2 size-4" /> Organize Teams
        </Button>
        <Button className="rounded-xl">
          <Plus className="mr-2 size-4" /> New Team
        </Button>
      </div>
    </section>
  );
}
