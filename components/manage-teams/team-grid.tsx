import { Team } from "./types";
import { TeamCard } from "./team-card";

interface GridProps {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamGrid({ teams, onEdit, onDelete }: GridProps) {
  if (teams.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border bg-muted/30 py-16 text-center text-muted-foreground">
        <div>
          <p className="text-lg font-medium">No teams found</p>
          <p className="text-sm">Adjust your search or create a new team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {teams.map((t) => (
        <TeamCard key={t.id} team={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} />
      ))}
    </div>
  );
}
