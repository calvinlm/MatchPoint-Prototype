import type {
  PublicTournament,
  PublicMatch,
  PublicBracket,
  PublicStanding,
  PublicTeam,
  PublicQueueItem,
} from "@matchpoint/types/public";

export type {
  PublicTournament,
  PublicMatch,
  PublicBracket,
  PublicStanding,
  PublicTeam,
  PublicQueueItem,
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "";

const DEFAULT_REVALIDATE_SECONDS = 30;

export class PublicApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

function headersToObject(headers?: HeadersInit) {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function mergeFetchOptions(base: FetchOptions, override?: FetchOptions): FetchOptions {
  if (!override) {
    return base;
  }

  const mergedHeaders = {
    ...headersToObject(base.headers),
    ...headersToObject(override.headers),
  };
  const hasHeaders = Object.keys(mergedHeaders).length > 0;

  const mergedNext =
    base.next || override.next
      ? {
          ...(base.next ?? {}),
          ...(override.next ?? {}),
        }
      : undefined;

  const merged: FetchOptions = {
    ...base,
    ...override,
    ...(hasHeaders ? { headers: mergedHeaders } : {}),
  };

  if (mergedNext) {
    merged.next = mergedNext;
  }

  return merged;
}

async function request<T>(path: string, init?: FetchOptions): Promise<T> {
  if (!API_BASE) {
    throw new Error("Missing API base URL. Set NEXT_PUBLIC_API_BASE or PUBLIC_API_BASE.");
  }

  const url = `${API_BASE}${path}`;
  const isServer = typeof window === "undefined";
  const runtimeDefault = isServer
    ? ({ next: { revalidate: DEFAULT_REVALIDATE_SECONDS } } satisfies FetchOptions)
    : ({ cache: "no-store" } satisfies FetchOptions);

  const finalInit = mergeFetchOptions(runtimeDefault, init);

  const res = await fetch(url, finalInit);
  if (!res.ok) {
    const message = `Request to ${path} failed with ${res.status}`;
    throw new PublicApiError(message, res.status);
  }
  const json = await res.json();
  return json?.data as T;
}

function withTags(slug: string, resource: string, options?: FetchOptions) {
  const base: FetchOptions = {
    next: {
      tags: [
        "public:tournament",
        `public:tournament:${slug}`,
        `public:tournament:${slug}:${resource}`,
      ],
    },
  };
  return mergeFetchOptions(base, options);
}

export async function fetchPublicTournament(slug: string, options?: FetchOptions) {
  return request<PublicTournament>(`/api/public/tournaments/${slug}`, withTags(slug, "tournament", options));
}

export async function fetchPublicMatches(slug: string, options?: FetchOptions) {
  return request<PublicMatch[]>(`/api/public/tournaments/${slug}/matches`, withTags(slug, "matches", options));
}

export async function fetchPublicBrackets(slug: string, options?: FetchOptions) {
  return request<PublicBracket[]>(`/api/public/tournaments/${slug}/brackets`, withTags(slug, "brackets", options));
}

export async function fetchPublicStandings(slug: string, options?: FetchOptions) {
  return request<PublicStanding[]>(`/api/public/tournaments/${slug}/standings`, withTags(slug, "standings", options));
}

export async function fetchPublicTeams(slug: string, options?: FetchOptions) {
  return request<PublicTeam[]>(`/api/public/tournaments/${slug}/teams`, withTags(slug, "teams", options));
}

export async function fetchPublicQueueItems(tournamentId: number, options?: FetchOptions) {
  return request<PublicQueueItem[]>(
    `/api/queue/${tournamentId}`,
    mergeFetchOptions({ cache: "no-store", next: { revalidate: 0 } }, options),
  );
}

export async function fetchPublicTeamsSafe(slug: string): Promise<{ data: PublicTeam[] | null; message?: string }> {
  try {
    const data = await fetchPublicTeams(slug);
    return { data };
  } catch (unknownError) {
    if (unknownError instanceof PublicApiError && unknownError.status === 501) {
      return { data: null, message: "Teams endpoint coming soon." };
    }
    return { data: null, message: "Teams data unavailable." };
  }
}
