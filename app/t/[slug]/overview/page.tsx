import OverviewClient from "./overviewClient";
import {
  fetchPublicMatches,
  fetchPublicBrackets,
  fetchPublicStandings,
  fetchPublicTournament,
  fetchPublicQueueItems,
  fetchPublicTeamsSafe,
} from "../data";

type PageProps = {
  params: { slug: string };
};

export default async function OverviewPage({ params }: PageProps) {
  const { slug } = params;
  const tournament = await fetchPublicTournament(slug);

  const [matchesResult, bracketsResult, standingsResult, queueResult] = await Promise.allSettled([
      fetchPublicMatches(slug),
      fetchPublicBrackets(slug),
      fetchPublicStandings(slug),
      fetchPublicQueueItems(tournament.id),
    ]);

  const matches = resolveArrayResult(matchesResult);
  const brackets = resolveArrayResult(bracketsResult);
  const standings = resolveArrayResult(standingsResult);
  const queueItems = resolveArrayResult(queueResult);
  const teamsResult = await fetchPublicTeamsSafe(slug);
  const teams = teamsResult.data;
  const teamsStatusMessage = teamsResult.message ?? "";

  return (
    <OverviewClient
      slug={slug}
      tournamentId={tournament.id}
      initialMatches={matches}
      initialBrackets={brackets}
      initialStandings={standings}
      initialTeams={teams}
      teamsStatusMessage={teamsStatusMessage}
      initialQueueItems={queueItems}
    />
  );
}

function resolveArrayResult<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === "fulfilled" ? result.value : [];
}
