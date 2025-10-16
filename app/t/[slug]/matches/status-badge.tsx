'use client';

type StatusBadgeProps = {
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  ready: "bg-amber-100 text-amber-900",
  in_progress: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-rose-100 text-rose-900",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status ?? "").toLowerCase();
  const label = normalized ? normalized.replace(/_/g, " ") : "unknown";
  const className =
    STATUS_COLORS[normalized as keyof typeof STATUS_COLORS] ?? "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
