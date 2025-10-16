'use client';

import { useCallback, useEffect, useState } from "react";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import { useTournament } from "../tournament-context";
import { fetchPublicStandings, type PublicStanding } from "../data";

type StandingsClientProps = {
  slug: string;
  initialStandings: PublicStanding[];
};

type RefreshOptions = {
  silent?: boolean;
};

export default function StandingsClient({ slug, initialStandings }: StandingsClientProps) {
  const { id: tournamentId } = useTournament();
  const [standings, setStandings] = useState(initialStandings);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStandings = useCallback(
    async ({ silent }: RefreshOptions = {}) => {
      if (!silent) {
        setIsRefreshing(true);
      }
      try {
        const data = await fetchPublicStandings(slug, { cache: "no-store", next: { revalidate: 0 } });
        setStandings(data);
      } catch (error) {
        console.error("[StandingsClient] refresh failed", error);
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
      void refreshStandings({ silent: true });
    }, 45_000);

    return () => window.clearInterval(interval);
  }, [refreshStandings]);

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: () => {
      void refreshStandings({ silent: true });
    },
    onScoreUpdated: () => {
      void refreshStandings({ silent: true });
    },
    onQueueUpdated: () => {},
    onTeamsUpdated: () => {},
  });

  if (standings.length === 0) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Standings</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated standings per bracket. Detailed ranking tables will replace this summary after
            the standings engine is wired in.
          </p>
        </header>

        <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Standings will appear once match results are published.
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void refreshStandings()}
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
          <h2 className="text-xl font-semibold">Standings</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated standings per bracket. Detailed ranking tables will replace this summary after
            the standings engine is wired in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshStandings()}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {standings.map((item) => (
          <article
            key={`${item.bracket.id}-${item.division?.id ?? "unknown"}`}
            className="rounded-lg border bg-card p-5 shadow-sm"
          >
            <header className="space-y-1">
              <h3 className="text-lg font-semibold">
                {item.division?.name ??
                  `${item.division?.ageGroup ?? "—"} ${item.division?.discipline ?? ""}`.trim()}
              </h3>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Bracket #{item.bracket.id} • {formatLabel(item.bracket.type)}
              </p>
            </header>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <SummaryLine label="Matches Total" value={item.matchSummary.matchesTotal} />
              <SummaryLine label="Completed" value={item.matchSummary.matchesCompleted} />
              <SummaryLine label="In Progress" value={item.matchSummary.matchesInProgress} />
              <SummaryLine label="Ready" value={item.matchSummary.matchesReady} />
            </dl>

            <footer className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
              <span>
                Quotient:{" "}
                <strong className="font-semibold text-foreground">
                  {typeof item.quotient === "number" ? item.quotient.toFixed(2) : "—"}
                </strong>
              </span>
              <span>
                Last update: {item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleString() : "—"}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-base font-medium">{value}</dd>
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
