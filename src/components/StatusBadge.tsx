"use client";

const STYLES: Record<string, string> = {
  created: "bg-muted/20 text-muted",
  pending: "bg-warning/20 text-warning",
  success: "bg-success/20 text-success",
  failed: "bg-danger/20 text-danger",
  active: "bg-info/20 text-info",
  sent: "bg-success/20 text-success",
  filled: "bg-success/20 text-success",
  paused: "bg-muted/20 text-muted",
  completed: "bg-accent/20 text-accent-light",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-muted/20 text-muted";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
