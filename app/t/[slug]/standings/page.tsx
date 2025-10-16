import StandingsClient from "./standingsClient";
import { fetchPublicStandings } from "../data";

type PageProps = {
  params: { slug: string };
};

export default async function StandingsPage({ params }: PageProps) {
  const { slug } = params;
  const standings = await fetchPublicStandings(slug);
  return <StandingsClient slug={slug} initialStandings={standings} />;
}
