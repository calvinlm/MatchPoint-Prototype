'use client';

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RefreshCw, ArrowUp, ArrowDown, GripVertical, MoreHorizontal, Send, Check, Undo2 } from "lucide-react";
import type { UserRole } from "@/lib/types";
import {
  fetchPublicMatches,
  fetchPublicQueueItems,
  type PublicMatch,
  type PublicQueueItem,
} from "../t/[slug]/data";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import { cn } from "@/lib/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.PUBLIC_API_BASE ??
  process.env.API_BASE ??
  "";

type QueueClientProps = {
  slug: string;
  tournamentId: number;
  initialMatches: PublicMatch[];
  initialQueueItems: PublicQueueItem[];
};

type QueueEntry = {
  item: PublicQueueItem;
  match: PublicMatch | null;
};

export default function QueueClient({
  slug,
  tournamentId,
  initialMatches,
  initialQueueItems,
}: QueueClientProps) {
  const userRoles: UserRole[] = ["director"];
  const [matches, setMatches] = useState<PublicMatch[]>(initialMatches);
  const [queueItems, setQueueItems] = useState<PublicQueueItem[]>(initialQueueItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendDialog, setSendDialog] = useState<{ entry: QueueEntry; courtId: string } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const matchesMap = useMemo(() => {
    const map = new Map<number, PublicMatch>();
    matches.forEach((match) => map.set(match.id, match));
    return map;
  }, [matches]);

  const knownCourts = useMemo(() => {
    const ids = new Set<number>();
    matches.forEach((match) => {
      if (typeof match.courtId === "number") {
        ids.add(match.courtId);
      }
    });
    queueItems.forEach((item) => {
      if (typeof item.courtId === "number") {
        ids.add(item.courtId);
      }
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [matches, queueItems]);

  const orderedQueueItems = useMemo(() => {
    return [...queueItems].sort((a, b) => a.position - b.position);
  }, [queueItems]);

  const entries: QueueEntry[] = useMemo(() => {
    return orderedQueueItems.map((item) => ({
      item,
      match: matchesMap.get(item.matchId) ?? null,
    }));
  }, [orderedQueueItems, matchesMap]);

  const refreshMatches = useCallback(async () => {
    try {
      const data = await fetchPublicMatches(slug);
      setMatches(data);
    } catch (error) {
      console.error("[QueueClient] refreshMatches failed", error);
    }
  }, [slug]);

  const refreshQueue = useCallback(async () => {
    try {
      const data = await fetchPublicQueueItems(tournamentId);
      setQueueItems(data);
    } catch (error) {
      console.error("[QueueClient] refreshQueue failed", error);
    }
  }, [tournamentId]);

  const refreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [nextMatches, nextQueue] = await Promise.all([
        fetchPublicMatches(slug),
        fetchPublicQueueItems(tournamentId),
      ]);
      setMatches(nextMatches);
      setQueueItems(nextQueue);
    } catch (error) {
      console.error("[QueueClient] refreshAll failed", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [slug, tournamentId]);

  const commitReorder = useCallback(
    async (ordered: PublicQueueItem[], options?: { optimistic?: boolean }) => {
      if (!API_BASE) {
        console.error("[QueueClient] Missing API base URL");
        return;
      }

      if (options?.optimistic) {
        setQueueItems(ordered);
      }

      setIsSubmitting(true);
      try {
        const payload = {
          tournamentId,
          items: ordered.map((item, index) => ({
            id: item.id,
            position: index + 1,
            version: item.version,
          })),
        };
        const response = await fetch(`${API_BASE}/api/queue/reorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 409) {
            console.warn("[QueueClient] Queue reorder version conflict; refreshing queue.");
            await refreshQueue();
            setActionError("Queue changed elsewhere. Reloaded the latest order.");
            return;
          }
          throw new Error(`Queue reorder failed with status ${response.status}`);
        }

        const json = await response.json();
        setQueueItems(json.data);
        setActionError(null);
      } catch (error) {
        console.error("[QueueClient] commitReorder error", error);
        await refreshQueue();
        setActionError("Unable to reorder queue. Latest data reloaded.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [tournamentId, refreshQueue],
  );

  type QueueAction = "MARK_READY" | "PULL" | "SEND_TO_COURT";
  type ActionOutcome = "ok" | "conflict" | "error";

  const performQueueAction = useCallback(
    async (item: PublicQueueItem, action: QueueAction, params?: { courtId?: number }): Promise<ActionOutcome> => {
      if (!API_BASE) {
        console.error("[QueueClient] Missing API base URL");
        return "error";
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_BASE}/api/queue/${item.id}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            version: item.version,
            ...(typeof params?.courtId === "number" ? { courtId: params.courtId } : {}),
          }),
        });

        if (response.status === 409) {
          console.warn("[QueueClient] Queue action version conflict; refreshing data.");
          await Promise.all([refreshQueue(), refreshMatches()]);
          setActionError("Queue changed elsewhere. Reloaded the latest order.");
          return "conflict";
        }

        if (!response.ok) {
          throw new Error(`Queue action ${action} failed with status ${response.status}`);
        }

        const json = await response.json();
        const nextItem = json?.data?.queueItem as PublicQueueItem | undefined;
        const nextMatch = json?.data?.match as PublicMatch | null | undefined;

        if (nextItem) {
          setQueueItems((prev) => upsertQueue(prev, nextItem));
        }
        if (nextMatch) {
          setMatches((prev) => upsertMatchList(prev, nextMatch));
        }

        setActionError(null);
        return "ok";
      } catch (error) {
        console.error(`[QueueClient] action ${action} failed`, error);
        await Promise.all([refreshQueue(), refreshMatches()]);
        setActionError("Unable to apply queue action. Latest data reloaded.");
        return "error";
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshMatches, refreshQueue],
  );

  const handleMove = useCallback(
    async (queueItemId: number, direction: "up" | "down") => {
      const sorted = [...orderedQueueItems];
      const currentIndex = sorted.findIndex((item) => item.id === queueItemId);
      if (currentIndex === -1) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return;

      const nextOrder = [...sorted];
      const [moved] = nextOrder.splice(currentIndex, 1);
      nextOrder.splice(targetIndex, 0, moved);

      const orderedWithPositions = nextOrder.map((item, index) => ({
        ...item,
        position: index + 1,
      }));

      await commitReorder(orderedWithPositions, { optimistic: true });
    },
    [orderedQueueItems, commitReorder],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const rawId = event.active.id;
      if (typeof rawId === "number") {
        setActiveId(rawId);
      } else {
        const parsed = Number.parseInt(String(rawId), 10);
        setActiveId(Number.isNaN(parsed) ? null : parsed);
      }
    },
    [],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveId(null);
      if (!over || active.id === over.id) {
        return;
      }

      const activeIdValue = typeof active.id === "number" ? active.id : Number.parseInt(String(active.id), 10);
      const overIdValue = typeof over.id === "number" ? over.id : Number.parseInt(String(over.id), 10);
      if (Number.isNaN(activeIdValue) || Number.isNaN(overIdValue)) {
        return;
      }

      const oldIndex = orderedQueueItems.findIndex((item) => item.id === activeIdValue);
      const newIndex = orderedQueueItems.findIndex((item) => item.id === overIdValue);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(orderedQueueItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index + 1,
      }));

      await commitReorder(reordered, { optimistic: true });
    },
    [orderedQueueItems, commitReorder],
  );

  const openSendDialog = useCallback((entry: QueueEntry) => {
    setSendDialog({
      entry,
      courtId:
        entry.match?.courtId !== null && entry.match?.courtId !== undefined
          ? String(entry.match.courtId)
          : entry.item.courtId !== null && entry.item.courtId !== undefined
            ? String(entry.item.courtId)
            : "",
    });
    setDialogError(null);
  }, []);

  const closeSendDialog = useCallback(() => {
    setSendDialog(null);
    setDialogError(null);
  }, []);

  const submitSendToCourt = useCallback(async () => {
    if (!sendDialog) return;
    const value = sendDialog.courtId.trim();
    if (!value) {
      setDialogError("Court identifier is required.");
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setDialogError("Provide a valid numeric court identifier.");
      return;
    }

    const outcome = await performQueueAction(sendDialog.entry.item, "SEND_TO_COURT", {
      courtId: numericValue,
    });
    if (outcome === "ok") {
      closeSendDialog();
    } else if (outcome === "conflict") {
      setDialogError("Queue updated elsewhere. Please review and try again.");
    } else {
      setDialogError("Unable to send match to the specified court.");
    }
  }, [closeSendDialog, performQueueAction, sendDialog]);

  const handleMarkReady = useCallback(
    async (entry: QueueEntry) => {
      await performQueueAction(entry.item, "MARK_READY");
    },
    [performQueueAction],
  );

  const handlePullFromCourt = useCallback(
    async (entry: QueueEntry) => {
      await performQueueAction(entry.item, "PULL");
    },
    [performQueueAction],
  );

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: ({ match }) => {
      setMatches((prev) => upsertMatchList(prev, match));
    },
    onScoreUpdated: ({ matchId, score }) => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId ? { ...match, score, updatedAt: new Date().toISOString() } : match,
        ),
      );
    },
    onQueueUpdated: (payload) => {
      if (payload.action === "reordered") {
        setQueueItems(payload.items);
      } else if (payload.action === "enqueued") {
        setQueueItems((prev) => upsertQueue(prev, payload.item));
        if (!matchesMap.has(payload.item.matchId)) {
          void refreshMatches();
        }
      } else if (payload.action === "updated") {
        setQueueItems((prev) => upsertQueue(prev, payload.item));
        if (!matchesMap.has(payload.item.matchId)) {
          void refreshMatches();
        }
      }
    },
    onTeamsUpdated: () => {
      // no-op for now; director queue does not display teams
    },
  });

  return (
    <AppLayout userRoles={userRoles} userName="Tournament Director">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Match Queue</h1>
            <p className="text-sm text-muted-foreground">
              Live view of matches awaiting assignment. Updates automatically or refresh manually when needed.
            </p>
          </div>
          <Button onClick={refreshAll} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Queued Matches" value={entries.length} />
          <StatCard
            label="In Progress"
            value={matches.filter((match) => match.status === "IN_PROGRESS").length}
          />
          <StatCard
            label="Completed"
            value={matches.filter((match) => match.status === "COMPLETED").length}
          />
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Queue</CardTitle>
            {isSubmitting && (
              <span className="text-xs text-muted-foreground">Saving changes…</span>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {actionError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </p>
            )}
            {entries.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Queue is empty. Matches will appear here once scheduled.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={entries.map(({ item }) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {entries.map(({ item, match }, index) => (
                      <SortableQueueListRow
                        key={item.id}
                        entryIndex={index}
                        totalCount={entries.length}
                        item={item}
                        match={match}
                        disabled={isSubmitting}
                        onMove={handleMove}
                        onMarkReady={handleMarkReady}
                        onPullFromCourt={handlePullFromCourt}
                        onSendToCourt={openSendDialog}
                        isActive={activeId === item.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(sendDialog)}
        onOpenChange={(open) => {
          if (!open) {
            closeSendDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send match to court</DialogTitle>
            <DialogDescription>
              {sendDialog
                ? `Assign Match #${sendDialog.entry.match?.matchNumber ?? sendDialog.entry.item.matchId} to a court and mark it in progress.`
                : "Assign the selected match to a court."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="courtId">
                Court identifier
              </label>
              <Input
                id="courtId"
                placeholder="e.g., Court 3"
                value={sendDialog?.courtId ?? ""}
                onChange={(event) =>
                  setSendDialog((prev) =>
                    prev ? { ...prev, courtId: event.target.value } : prev,
                  )
                }
              />
            </div>
            {knownCourts.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Recent courts:</span>
                {knownCourts.map((court) => (
                  <Button
                    key={court}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSendDialog((prev) =>
                        prev ? { ...prev, courtId: String(court) } : prev,
                      )
                    }
                  >
                    {`Court ${court}`}
                  </Button>
                ))}
              </div>
            )}
            {dialogError && <p className="text-sm text-destructive">{dialogError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={closeSendDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={submitSendToCourt} disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send to Court"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function SortableQueueListRow({
  entryIndex,
  totalCount,
  item,
  match,
  disabled,
  onMove,
  onMarkReady,
  onPullFromCourt,
  onSendToCourt,
  isActive,
}: {
  entryIndex: number;
  totalCount: number;
  item: PublicQueueItem;
  match: PublicMatch | null;
  disabled: boolean;
  onMove: (id: number, direction: "up" | "down") => void;
  onMarkReady: (entry: QueueEntry) => void;
  onPullFromCourt: (entry: QueueEntry) => void;
  onSendToCourt: (entry: QueueEntry) => void;
  isActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const matchLabel = match ? `Match #${match.matchNumber ?? match.id}` : `Match #${item.matchId}`;
  const statusLabel = match?.status ?? "PENDING";
  const updatedLabel = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—";
  const entry: QueueEntry = { item, match };
  const isReady = statusLabel === "READY";
  const hasCourt = Boolean(match?.courtId ?? item.courtId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border bg-card px-4 py-3 shadow-sm transition",
        isDragging && "ring-2 ring-primary/60 shadow-lg",
        isActive && !isDragging && "border-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className={cn(
            "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-muted/60 text-muted-foreground transition",
            disabled ? "cursor-not-allowed opacity-60" : "hover:text-foreground",
          )}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Pos {item.position}</Badge>
            <span className="text-sm font-medium">{matchLabel}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Status: {statusLabel.replace(/_/g, " ").toLowerCase()}</span>
            {(match?.courtId ?? item.courtId) && <span>Court: {match?.courtId ?? item.courtId}</span>}
            <span>Updated: {updatedLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || entryIndex === 0}
          onClick={() => onMove(item.id, "up")}
          type="button"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || entryIndex === totalCount - 1}
          onClick={() => onMove(item.id, "down")}
          type="button"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={disabled || isReady}
              onSelect={(event) => {
                event.preventDefault();
                onMarkReady(entry);
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark Ready
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={(event) => {
                event.preventDefault();
                onSendToCourt(entry);
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Court
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={disabled || !hasCourt}
              onSelect={(event) => {
                event.preventDefault();
                onPullFromCourt(entry);
              }}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Pull from Court
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function upsertMatchList(matches: PublicMatch[], incoming: PublicMatch) {
  const index = matches.findIndex((match) => match.id === incoming.id);
  if (index === -1) {
    return [...matches, incoming];
  }
  const next = [...matches];
  next[index] = { ...next[index], ...incoming };
  return next;
}

function upsertQueue(items: PublicQueueItem[], incoming: PublicQueueItem) {
  const index = items.findIndex((item) => item.id === incoming.id);
  if (index === -1) {
    return [...items, incoming];
  }
  const next = [...items];
  next[index] = { ...next[index], ...incoming };
  return next;
}
