// components/manage-teams/types.ts
export type Team = {
id: string; // team code / label
eventId?: string;
eventName?: string;
players: { id: string; name: string }[];
};