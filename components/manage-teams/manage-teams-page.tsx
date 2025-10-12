"use client";

import { useMemo, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { TeamCard } from "@/components/players/team-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Users, Upload, Download, UserPlus } from "lucide-react";
import type { Team } from "@/components/manage-teams/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://matchpoint-prototype.onrender.com";

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ id: "", eventName: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch(`${API_BASE}/api/teams`);
        if (!res.ok) throw new Error("Failed to fetch teams.");
        const data = await res.json();
        setTeams(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

type AgeBracket = "JUN" | "18" | "35" | "55";
type Division = "M" | "W" | "X";
type Category = "S" | "D";
type Level = "NOV" | "INT" | "ADV";

type NewTeamForm = {
  ageBracket?: AgeBracket;
  division?: Division;
  category?: Category;
  level?: Level;
  eventName?: string;
};

const [isSubmitting, setIsSubmitting] = useState(false);
const [editOpen, setEditOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Team | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmTarget, setConfirmTarget] = useState<Team | null>(null);

// Build the 4-part prefix
function makePrefix(f: NewTeamForm) {
  const { ageBracket, division, category, level } = f;
  if (!ageBracket || !division || !category || !level) return "";
  return `${ageBracket}-${division}-${category}-${level}`;
}

// Extract max suffix from existing teams for this prefix
function nextSequence(teams: Team[], prefix: string) {
  const nums = teams
    .map(t => t.id)
    .filter(id => id.startsWith(prefix + "-"))
    .map(id => {
      const n = id.split("-").pop();
      const num = Number(n);
      return Number.isFinite(num) ? num : 0;
    });
  const max = nums.length ? Math.max(...nums) : 0;
  return (max + 1).toString().padStart(3, "0");
}

const prefix = makePrefix(form);
const previewId = prefix ? `${prefix}-${nextSequence(teams, prefix)}` : "";

async function handleAddSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!prefix) return;

  setIsSubmitting(true);
  try {
    const id = `${prefix}-${nextSequence(teams, prefix)}`;
    const payload = {
      id,
      eventName: form.eventName?.trim() || undefined,
      players: [], // start empty; you can add via “Add Player” later
    };

    const res = await fetch(`${API_BASE}/api/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to create team."));

    const created = await res.json();
    setTeams(prev => [created, ...prev]);
    setAddOpen(false);
    setForm({});
  } catch (err: any) {
    alert(err.message || "Failed to create team.");
  } finally {
    setIsSubmitting(false);
  }
}


  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchSearch = `${t.id} ${t.eventName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEvent = eventFilter ? t.eventName?.toLowerCase().includes(eventFilter.toLowerCase()) : true;
      return matchSearch && matchEvent;
    });
  }, [teams, searchTerm, eventFilter]);

  if (loading) {
    return (
      <AppLayout userRoles={["director"]} userName="Tournament Director">
        <div className="p-10 text-muted-foreground">Loading teams...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRoles={["director"]} userName="Tournament Director">
        <div className="p-10 text-red-600">Error: {error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRoles={["director"]} userName="Tournament Director">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Teams</h1>
            <p className="text-muted-foreground">View, create, and edit team assignments.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <Button asChild>
                <DialogTrigger>
                  <UserPlus className="h-4 w-4 mr-2" /> Add Team
                </DialogTrigger>
              </Button>
              <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age */}
                    <div className="space-y-2">
                      <Label>Age Bracket</Label>
                      <Select value={form.ageBracket} onValueChange={(v) => setForm((s) => ({ ...s, ageBracket: v as AgeBracket }))}>
                        <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JUN">Junior (≤17)</SelectItem>
                          <SelectItem value="18">18+</SelectItem>
                          <SelectItem value="35">35+</SelectItem>
                          <SelectItem value="55">55+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Division */}
                    <div className="space-y-2">
                      <Label>Division</Label>
                      <Select value={form.division} onValueChange={(v) => setForm((s) => ({ ...s, division: v as Division }))}>
                        <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Men</SelectItem>
                          <SelectItem value="W">Women</SelectItem>
                          <SelectItem value="X">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm((s) => ({ ...s, category: v as Category }))}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">Singles</SelectItem>
                          <SelectItem value="D">Doubles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level */}
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={form.level} onValueChange={(v) => setForm((s) => ({ ...s, level: v as Level }))}>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOV">Novice</SelectItem>
                          <SelectItem value="INT">Intermediate</SelectItem>
                          <SelectItem value="ADV">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Optional event name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Event Name (optional)</Label>
                      <Input
                        value={form.eventName ?? ""}
                        onChange={(e) => setForm((s) => ({ ...s, eventName: e.target.value }))}
                        placeholder="e.g., Men's Doubles 35+ Intermediate"
                      />
                    </div>

                    {/* Preview (read-only) */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Team ID (auto)</Label>
                      <Input value={previewId} readOnly className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">Generated from your selections. Sequence auto-increments per combination.</p>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || !previewId}>
                      {isSubmitting ? "Saving..." : "Save Team"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={eventFilter ?? ""} onValueChange={(v) => setEventFilter(v)}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Events</SelectItem>
              <SelectItem value="Men's Doubles">Men's Doubles</SelectItem>
              <SelectItem value="Women's Doubles">Women's Doubles</SelectItem>
              <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{teams.length} Total Teams</Badge>
          {eventFilter && <Badge variant="secondary">Event: {eventFilter}</Badge>}
          {searchTerm && (
            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setSearchTerm(""); setEventFilter(null); }}>
              Clear filters
            </Button>
          )}
        </div>

        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>
          <TabsContent value="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground">Try adjusting your search or add a team.</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={(id) => console.log("edit", id)}
                  onDelete={(id) => console.log("delete", id)}
                  onAddPlayer={(id) => console.log("add player", id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}