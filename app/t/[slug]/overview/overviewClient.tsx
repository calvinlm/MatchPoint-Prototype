'use client';

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import {
  fetchPublicMatches,
  fetchPublicBrackets,
  fetchPublicStandings,
  fetchPublicTeamsSafe,
  fetchPublicQueueItems,
  type PublicMatch,
  type PublicBracket,
  type PublicStanding,
  type PublicTeam,
  type PublicQueueItem,
} from "../data";

type OverviewClientProps = {
  slug: string;
  tournamentId: number;
  initialMatches: PublicMatch[];
  initialBrackets: PublicBracket[];
  initialStandings: PublicStanding[];
  initialTeams: PublicTeam[] | null;
  teamsStatusMessage: string;
  initialQueueItems: PublicQueueItem[];
};

export default function OverviewClient({
  slug,
  tournamentId,
  initialMatches,
  initialBrackets,
  initialStandings,
  initialTeams,
  teamsStatusMessage,
  initialQueueItems,
}: OverviewClientProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [brackets, setBrackets] = useState(initialBrackets);
  const [standings, setStandings] = useState(initialStandings);
  const [teams, setTeams] = useState<PublicTeam[] | null>(initialTeams);
  const [teamMessage, setTeamMessage] = useState(teamsStatusMessage);
  const [queueItems, setQueueItems] = useState(initialQueueItems);
  const [refreshing, setRefreshing] = useState(false);

  const completedMatches = useMemo(
    () => standings.reduce((sum, row) => sum + row.matchSummary.matchesCompleted, 0),
    [standings]
  );
  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === "IN_PROGRESS").length,
    [matches]
  );
  const readyMatches = useMemo(
    () => matches.filter((m) => m.status === "READY").length,
    [matches]
  );

  const queuePreview = useMemo(() => {
    return queueItems
      .slice()
      .sort((a, b) => a.position - b.position)
      .slice(0, 5)
      .map((item) => ({
        item,
        match: matches.find((m) => m.id === item.matchId) ?? null,
      }));
  }, [queueItems, matches]);

  const refreshAll = useCallback(async () => {
    try {
      setRefreshing(true);
      const [nextMatches, nextBrackets, nextStandings, nextTeams, nextQueue] = await Promise.all([
        fetchPublicMatches(slug),
        fetchPublicBrackets(slug),
        fetchPublicStandings(slug),
        fetchPublicTeamsSafe(slug),
        fetchPublicQueueItems(tournamentId),
      ]);
      setMatches(nextMatches);
      setBrackets(nextBrackets);
      setStandings(nextStandings);
      setTeams(nextTeams.data);
      setTeamMessage(nextTeams.message ?? "");
      setQueueItems(nextQueue);
    } catch (error) {
      console.error("[OverviewClient] refreshAll failed", error);
    } finally {
      setRefreshing(false);
    }
  }, [slug, tournamentId]);

  const refreshStandings = useCallback(async () => {
    try {
      const next = await fetchPublicStandings(slug);
      setStandings(next);
    } catch (error) {
      console.error("[OverviewClient] refreshStandings failed", error);
    }
  }, [slug]);

  const refreshTeams = useCallback(async () => {
    const result = await fetchPublicTeamsSafe(slug);
    setTeams(result.data);
    setTeamMessage(result.message ?? "");
  }, [slug]);

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: ({ match }) => {
      setMatches((prev) => upsertMatch(prev, match));
      void refreshStandings();
    },
    onScoreUpdated: ({ matchId, score }) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, score, updatedAt: new Date().toISOString() } : m))
      );
      void refreshStandings();
    },
    onQueueUpdated: (payload) => {
      if (payload.action === "reordered") {
        setQueueItems(payload.items);
      } else if (payload.action === "enqueued") {
        setQueueItems((prev) => upsertQueue(prev, payload.item));
      } else if (payload.action === "updated") {
        setQueueItems((prev) => upsertQueue(prev, payload.item));
      }
    },
    onTeamsUpdated: () => {
      void refreshTeams();
    },
  });

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <OverviewCard
          title="Brackets"
          value={brackets.length}
          href={`/t/${slug}/brackets`}
          description="Active brackets visible to the public."
        />
        <OverviewCard
          title="Matches"
          value={matches.length}
          href={`/t/${slug}/matches`}
          description="Queued, live, and completed matches."
        />
        <OverviewCard
          title="Standings"
          value={standings.length}
          href={`/t/${slug}/standings`}
          description="Categories with published standings."
        />
        <OverviewCard
          title="Teams"
          value={teams ? teams.length : "—"}
          href={`/t/${slug}/teams`}
          description={
            teams
              ? teams.length > 0
                ? "Roster snapshots synced from tournament teams."
                : "No teams published yet."
              : teamMessage || "Teams data pending configuration."
          }
        />
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Live Snapshot</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Public-facing status for the tournament. Data refreshes automatically when new socket events
              arrive.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <SnapshotCard label="Completed Matches" value={completedMatches} />
          <SnapshotCard label="Live Matches" value={liveMatches} />
          <SnapshotCard label="Ready In Queue" value={readyMatches} />
          <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Teams visibility
            </dt>
            <dd className="mt-2">
              {teams ? `${teams.length} teams available publicly.` : teamMessage || "Teams data pending configuration."}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Queue Snapshot</h3>
          <Link href={`/t/${slug}/matches`} className="text-sm text-primary hover:underline">
            View all matches
          </Link>
        </div>
        {queuePreview.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Queue is currently empty.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Position</th>
                  <th className="px-3 py-2 font-medium">Match</th>
                  <th className="px-3 py-2 font-medium">Court</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queuePreview.map(({ item, match }) => (
                  <tr key={item.id} className="bg-background">
                    <td className="px-3 py-2 font-semibold">{item.position}</td>
                    <td className="px-3 py-2">
                      {match ? (
                        <div>
                          <div className="font-medium">Match #{match.matchNumber ?? match.id}</div>
                          <div className="text-xs text-muted-foreground">Bracket #{match.bracketId}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Match #{item.matchId}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{item.courtId ?? match?.courtId ?? "Unassigned"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewCard({ title, value, description, href }: { title: string; value: number | string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground">{description}</p>
    </Link>
  );
}

function SnapshotCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function upsertMatch(matches: PublicMatch[], incoming: PublicMatch) {
  const index = matches.findIndex((m) => m.id === incoming.id);
  if (index === -1) return [...matches, incoming];
  const next = [...matches];
  next[index] = { ...next[index], ...incoming };
  return next;
}

function upsertQueue(items: PublicQueueItem[], incoming: PublicQueueItem) {
  const index = items.findIndex((item) => item.id === incoming.id);
  if (index === -1) return [...items, incoming];
  const next = [...items];
  next[index] = { ...next[index], ...incoming };
  return next;
}
