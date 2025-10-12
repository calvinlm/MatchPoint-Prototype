"use client";

import { useMemo, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { TeamCard } from "@/components/players/team-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Search, Users, Upload, Download, UserPlus } from "lucide-react";
import type { Team } from "@/components/manage-teams/types";
import { TeamEditorDialog } from "@/components/manage-teams/team-editor-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://matchpoint-prototype.onrender.com";

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<any[]>([]); // minimal typing for integration
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string | null>(null);

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Team | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load teams + players
  useEffect(() => {
    (async () => {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch(`${API_BASE}/api/teams`),
          fetch(`${API_BASE}/api/players`),
        ]);
        if (!tRes.ok) throw new Error("Failed to fetch teams.");
        if (!pRes.ok) throw new Error("Failed to fetch players.");
        const t = await tRes.json();
        const p = await pRes.json();
        setTeams(t);
        setPlayers(p);
      } catch (e: any) {
        setError(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchSearch = `${t.id} ${t.teamCode ?? ""} ${t.eventName ?? ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchEvent = eventFilter ? t.eventName?.toLowerCase().includes(eventFilter.toLowerCase()) : true;
      return matchSearch && matchEvent;
    });
  }, [teams, searchTerm, eventFilter]);

  // CRUD handlers
  async function handleCreateTeam(payload: {
    categoryId: number;
    playerIds: number[]; // 1 for singles, 2 for doubles
    eventName?: string;
  }) {
    // Single-request create (backend should create Team + TeamMember)
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to create team."));
    const created = await res.json();
    setTeams((prev) => [created, ...prev]);
  }

  async function handleEditTeam(payload: {
    id: number;
    categoryId: number;
    playerIds?: number[]; // optional changes
    eventName?: string;
  }) {
    const res = await fetch(`${API_BASE}/api/teams/${payload.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to update team."));
    const updated = await res.json();
    setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    const res = await fetch(`${API_BASE}/api/teams/${confirmTarget.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text().catch(() => "Failed to delete team."));
    setTeams((prev) => prev.filter((t) => t.id !== confirmTarget.id));
    setConfirmOpen(false);
    setConfirmTarget(null);
  }

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Teams</h1>
            <p className="text-muted-foreground">Create teams by selecting a category and players. Team code is generated by the server.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Team
            </Button>
          </div>
        </div>

        {/* Filters */}
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

          <Select value={eventFilter ?? undefined} onValueChange={(v) => setEventFilter(v)}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Men's Doubles">Men's Doubles</SelectItem>
              <SelectItem value="Women's Doubles">Women's Doubles</SelectItem>
              <SelectItem value="Mixed Doubles">Mixed Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{teams.length} Total Teams</Badge>
          {eventFilter && <Badge variant="secondary">Event: {eventFilter}</Badge>}
          {searchTerm && (
            <Button variant="ghost" size="sm" className="h-7" onClick={() => { setSearchTerm(""); setEventFilter(null); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Grid */}
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
                  onEdit={() => { setEditTarget(team); setEditOpen(true); }}
                  onDelete={() => { setConfirmTarget(team); setConfirmOpen(true); }}
                  onAddPlayer={() => { setEditTarget(team); setEditOpen(true); }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Add / Edit Dialogs */}
        <TeamEditorDialog
          mode="create"
          open={addOpen}
          onOpenChange={setAddOpen}
          players={players}
          onSubmit={async (data) => {
            await handleCreateTeam(data);
          }}
        />

        {editTarget && (
          <TeamEditorDialog
            mode="edit"
            open={editOpen}
            onOpenChange={setEditOpen}
            players={players}
            initialValue={{
              id: editTarget.id,
              categoryId: (editTarget as any).categoryId, // ensure your API returns this
              playerIds: (editTarget as any).members?.map((m: any) => m.playerId) ?? [],
              eventName: editTarget.eventName,
            }}
            onSubmit={async (data) => {
              await handleEditTeam({ id: editTarget.id as any, ...data });
            }}
          />
        )}

        {/* Simple delete confirm (reuse your existing AlertDialog if you have one) */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <div />
        </Dialog>
      </div>
    </AppLayout>
  );
}