import MatchesClient from "./matchesClient";
import { fetchPublicMatches } from "../data";

type PageProps = {
  params: { slug: string };
};

export default async function MatchesPage({ params }: PageProps) {
  const matches = await fetchPublicMatches(params.slug);
  return <MatchesClient slug={params.slug} initialMatches={matches} />;
}
