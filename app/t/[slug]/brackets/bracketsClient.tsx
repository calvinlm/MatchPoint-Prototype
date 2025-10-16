'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import { useTournament } from "../tournament-context";
import { fetchPublicBrackets, type PublicBracket } from "../data";

type BracketsClientProps = {
  slug: string;
  initialBrackets: PublicBracket[];
};

type RefreshOptions = {
  silent?: boolean;
};

export default function BracketsClient({ slug, initialBrackets }: BracketsClientProps) {
  const { id: tournamentId } = useTournament();
  const [brackets, setBrackets] = useState(initialBrackets);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasPublishedBrackets = brackets.length > 0;

  const refreshBrackets = useCallback(
    async ({ silent }: RefreshOptions = {}) => {
      if (!silent) {
        setIsRefreshing(true);
      }
      try {
        const data = await fetchPublicBrackets(slug, { cache: "no-store", next: { revalidate: 0 } });
        setBrackets(data);
      } catch (error) {
        console.error("[BracketsClient] refresh failed", error);
      } finally {
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [slug],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshBrackets({ silent: true });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [refreshBrackets]);

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: ({ action }) => {
      if (action === "created") {
        void refreshBrackets({ silent: true });
      }
    },
    onScoreUpdated: () => {
      // standings page handles standings refresh; brackets metadata unlikely to change per score update.
    },
    onQueueUpdated: () => {},
    onTeamsUpdated: () => {},
  });

  const rows = useMemo(() => {
    return brackets.map((bracket) => {
      const division = bracket.division;
      const label =
        division?.name ??
        `${division?.ageGroup ?? "—"} ${division?.discipline ?? ""}`.trim();
      return {
        ...bracket,
        divisionLabel: label,
      };
    });
  }, [brackets]);

  if (!hasPublishedBrackets) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Brackets</h2>
          <p className="text-sm text-muted-foreground">
            Publicly visible brackets grouped by division. Detailed bracket rendering will land in a
            follow-up iteration.
          </p>
        </header>

        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          No brackets published yet for this tournament.
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void refreshBrackets()}
              disabled={isRefreshing}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Brackets</h2>
          <p className="text-sm text-muted-foreground">
            Publicly visible brackets grouped by division. Detailed bracket rendering will land in a
            follow-up iteration.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshBrackets()}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Division</th>
              <th className="px-4 py-3 font-medium">Format</th>
              <th className="px-4 py-3 font-medium text-right">Locked</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((bracket) => (
              <tr key={bracket.id} className="bg-background">
                <td className="px-4 py-3">
                  <div className="font-medium">{bracket.divisionLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {bracket.division?.ageGroup ?? "—"} • {bracket.division?.discipline ?? "—"} •{" "}
                    {bracket.division?.level ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{formatLabel(bracket.type)}</div>
                  <div className="text-xs text-muted-foreground">#{bracket.id}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  {bracket.locked ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                      Locked
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Open</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {bracket.updatedAt ? new Date(bracket.updatedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatLabel(format: string) {
  switch (format) {
    case "SINGLE_ELIM":
      return "Single Elimination";
    case "DOUBLE_ELIM":
      return "Double Elimination";
    case "ROUND_ROBIN":
      return "Round Robin";
    default:
      return format;
  }
}
