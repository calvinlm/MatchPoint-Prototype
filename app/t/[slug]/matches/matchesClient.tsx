'use client';

import { useCallback, useState } from "react";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import { useTournament } from "../tournament-context";
import type { PublicMatch } from "../data";
import { fetchPublicMatches } from "../data";
import StatusBadge from "./status-badge";

type MatchesClientProps = {
  slug: string;
  initialMatches: PublicMatch[];
};

export default function MatchesClient({ slug, initialMatches }: MatchesClientProps) {
  const { id: tournamentId } = useTournament();
  const [matches, setMatches] = useState(initialMatches);
  const [loading, setLoading] = useState(false);

  const refreshMatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPublicMatches(slug);
      setMatches(data);
    } catch (error) {
      console.error("[MatchesClient] refresh failed", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: ({ match }) => {
      setMatches((prev) => upsertMatch(prev, match));
    },
    onScoreUpdated: ({ matchId, score }) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, score, updatedAt: new Date().toISOString() } : m))
      );
    },
    onQueueUpdated: () => {
      // no-op on matches page
    },
    onTeamsUpdated: () => {
      // matches page does not display teams
    },
  });

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        Matches will appear here once the schedule is published.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Matches</h2>
          <p className="text-sm text-muted-foreground">
            Public queue of matches with live status and court assignments. Full bracket context will be
            added in a future pass.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshMatches}
          disabled={loading}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Match</th>
              <th className="px-4 py-3 font-medium">Round</th>
              <th className="px-4 py-3 font-medium">Court</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matches.map((match) => (
              <tr key={match.id} className="bg-background">
                <td className="px-4 py-3">
                  <div className="font-medium">Match #{match.matchNumber ?? match.id}</div>
                  <div className="text-xs text-muted-foreground">Bracket #{match.bracketId}</div>
                </td>
                <td className="px-4 py-3">{match.round ?? "—"}</td>
                <td className="px-4 py-3">{match.courtId ?? "TBD"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={match.status} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : "TBD"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {match.updatedAt ? new Date(match.updatedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function upsertMatch(matches: PublicMatch[], incoming: PublicMatch) {
  const exists = matches.findIndex((m) => m.id === incoming.id);
  if (exists === -1) {
    return [...matches, incoming];
  }
  const next = [...matches];
  next[exists] = { ...next[exists], ...incoming };
  return next;
}
