'use client';

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { Match } from "@matchpoint/types/match";
import type { QueueItem } from "@matchpoint/types/queue";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.PUBLIC_API_BASE ??
  process.env.API_BASE ??
  "";

type MatchUpdatedPayload = {
  action: "created" | "updated" | "completed";
  match: Match;
};

type ScoreUpdatedPayload = {
  matchId: number;
  score: unknown;
};

type QueueUpdatedPayload =
  | {
      action: "enqueued";
      item: QueueItem;
    }
  | {
      action: "reordered";
      items: QueueItem[];
    }
  | {
      action: "updated";
      item: QueueItem;
    };

type TeamsUpdatedPayload = {
  action: "created" | "updated" | "deleted";
  teamId: number;
  code: string;
};

type Options = {
  tournamentId: number | null;
  onMatchUpdated?: (payload: MatchUpdatedPayload) => void;
  onScoreUpdated?: (payload: ScoreUpdatedPayload) => void;
  onQueueUpdated?: (payload: QueueUpdatedPayload) => void;
  onTeamsUpdated?: (payload: TeamsUpdatedPayload) => void;
};

export function usePublicTournamentSocket(options: Options) {
  const handlersRef = useRef(options);
  handlersRef.current = options;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_BASE) {
      console.error("[usePublicTournamentSocket] Missing API base URL");
      return;
    }
    const tournamentId = options.tournamentId;
    if (!tournamentId) return;

    const socket: Socket = io(API_BASE, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("join_public_tournament", tournamentId);

    socket.on("match.updated", (payload: MatchUpdatedPayload) => {
      handlersRef.current.onMatchUpdated?.(payload);
    });

    socket.on("score.updated", (payload: ScoreUpdatedPayload) => {
      handlersRef.current.onScoreUpdated?.(payload);
    });

    socket.on("queue.updated", (payload: QueueUpdatedPayload) => {
      handlersRef.current.onQueueUpdated?.(payload);
    });

    socket.on("teams.updated", (payload: TeamsUpdatedPayload) => {
      handlersRef.current.onTeamsUpdated?.(payload);
    });

    return () => {
      socket.emit("leave_public_tournament", tournamentId);
      socket.disconnect();
    };
  }, [options.tournamentId]);
}
