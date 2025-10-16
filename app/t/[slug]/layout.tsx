import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TournamentProvider } from "./tournament-context";
import { fetchPublicTournament, type PublicTournament } from "./data";

export const revalidate = 30;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.PUBLIC_API_BASE ??
  process.env.API_BASE ??
  "";

type LayoutProps = {
  children: ReactNode;
  params: { slug: string };
};

const NAV_ITEMS = [
  { href: "", label: "Overview" },
  { href: "brackets", label: "Brackets" },
  { href: "standings", label: "Standings" },
  { href: "matches", label: "Matches" },
  { href: "teams", label: "Teams" },
];

export default async function TournamentLayout({ children, params }: LayoutProps) {
  if (!API_BASE) {
    throw new Error("Missing API base URL. Set NEXT_PUBLIC_API_BASE or PUBLIC_API_BASE.");
  }

  let tournament: PublicTournament;
  try {
    tournament = await fetchPublicTournament(params.slug);
  } catch (unknownError) {
    const error = unknownError as { status?: number };
    if (error?.status === 404) {
      notFound();
    }
    throw unknownError;
  }

  return (
    <TournamentProvider value={tournament}>
      <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Tournament
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              {tournament.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {tournament.venue && <span>Venue: {tournament.venue}</span>}
              {tournament.startDate && (
                <span>
                  Starts: {new Date(tournament.startDate).toLocaleDateString()}
                </span>
              )}
              {tournament.endDate && (
                <span>
                  Ends: {new Date(tournament.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-mono text-xs uppercase text-secondary-foreground">
              /t/{params.slug}
            </span>
          </div>
        </div>
        <nav className="border-t">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 text-sm md:px-6">
            {NAV_ITEMS.map((item) => {
              const target = item.href ? `/${item.href}` : "";
              return (
                <li key={item.href || "overview"}>
                  <Link
                    href={`/t/${params.slug}${target}`}
                    className={cn(
                      "inline-flex items-center rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
    </TournamentProvider>
  );
}
