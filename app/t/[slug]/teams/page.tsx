import TeamsClient from "./teamsClient";
import { fetchPublicTeamsSafe } from "../data";

type PageProps = {
  params: { slug: string };
};

export default async function TeamsPage({ params }: PageProps) {
  const result = await fetchPublicTeamsSafe(params.slug);
  return (
    <TeamsClient
      slug={params.slug}
      initialTeams={result.data}
      initialMessage={result.message ?? ""}
    />
  );
}
