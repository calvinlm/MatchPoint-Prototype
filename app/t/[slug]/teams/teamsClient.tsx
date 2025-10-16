'use client';

import { useCallback, useState } from "react";
import { usePublicTournamentSocket } from "@/hooks/use-public-tournament-socket";
import { fetchPublicTeamsSafe, type PublicTeam } from "../data";
import { useTournament } from "../tournament-context";

type TeamsClientProps = {
  slug: string;
  initialTeams: PublicTeam[] | null;
  initialMessage: string;
};

export default function TeamsClient({ slug, initialTeams, initialMessage }: TeamsClientProps) {
  const { id: tournamentId } = useTournament();
  const [teams, setTeams] = useState<PublicTeam[] | null>(initialTeams);
  const [statusMessage, setStatusMessage] = useState(initialMessage);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTeams = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const result = await fetchPublicTeamsSafe(slug);
      setTeams(result.data);
      setStatusMessage(result.message ?? "");
    } catch (error) {
      console.error("[TeamsClient] refresh failed", error);
      setStatusMessage("Unable to load teams at this time.");
    } finally {
      setIsRefreshing(false);
    }
  }, [slug]);

  usePublicTournamentSocket({
    tournamentId,
    onMatchUpdated: () => {},
    onScoreUpdated: () => {},
    onQueueUpdated: () => {},
    onTeamsUpdated: () => {
      void refreshTeams();
    },
  });

  if (!teams || teams.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-10 text-center text-sm text-muted-foreground">
        {statusMessage || "Teams will appear once rosters are published for this tournament."}
        <div className="mt-4">
          <button
            type="button"
            onClick={refreshTeams}
            disabled={isRefreshing}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    );
  }

  const teamList = teams!;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Teams</h2>
          <p className="text-sm text-muted-foreground">
            Public roster snapshot derived from the `public_teams_v` view.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshTeams}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {teamList.map((team) => (
          <article key={team.id} className="rounded-lg border bg-card p-5 shadow-sm">
            <header className="space-y-1">
              <h3 className="text-lg font-semibold">{team.code}</h3>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {team.ageGroup ?? "—"} • {team.discipline ?? "—"} • {team.level ?? "—"}
              </p>
            </header>
            {team.entryCode && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Entry Code <span className="font-semibold text-foreground">{team.entryCode}</span>
              </p>
            )}
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {team.roster.length === 0 ? (
                <li>No roster published.</li>
              ) : (
                team.roster.map((slot: PublicTeam["roster"][number]) => (
                  <li key={`${team.id}-${slot.slot ?? "?"}-${slot.playerId ?? "?"}`}>
                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {slot.slot ?? "?"}
                    </span>{" "}
                    Player #{slot.playerId ?? "—"}
                  </li>
                ))
              )}
            </ul>
            <footer className="mt-4 text-xs text-muted-foreground space-y-1">
              {team.registrations?.length ? (
                <div>
                  <span className="font-medium text-foreground">Registrations:</span>{" "}
                  {team.registrations
                    .map((reg) => reg.entryCode)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </div>
              ) : null}
              <div>
                Updated {team.updatedAt ? new Date(team.updatedAt).toLocaleString() : "—"}
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
