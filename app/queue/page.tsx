import { notFound } from "next/navigation";
import QueueClient from "./queueClient";
import {
  fetchPublicMatches,
  fetchPublicQueueItems,
  fetchPublicTournament,
} from "../t/[slug]/data";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function QueuePage({ searchParams }: PageProps) {
  const searchSlug = searchParams?.slug;
  const slug =
    (Array.isArray(searchSlug) ? searchSlug[0] : searchSlug) ??
    process.env.NEXT_PUBLIC_TOURNAMENT_SLUG ??
    null;

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Provide a tournament slug via ?slug= or NEXT_PUBLIC_TOURNAMENT_SLUG.</p>
      </div>
    );
  }

  let tournament;
  try {
    tournament = await fetchPublicTournament(slug);
  } catch (unknownError) {
    const error = unknownError as { status?: number };
    if (error?.status === 404) {
      notFound();
    }
    throw unknownError;
  }

  const [matches, queueItems] = await Promise.all([
    fetchPublicMatches(slug),
    fetchPublicQueueItems(tournament.id),
  ]);

  return (
    <QueueClient
      slug={slug}
      tournamentId={tournament.id}
      initialMatches={matches}
      initialQueueItems={queueItems}
    />
  );
}
