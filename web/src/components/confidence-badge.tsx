const config: Record<string, { label: string; className: string }> = {
  none: {
    label: "No data",
    className: "bg-rose/[0.1] text-rose",
  },
  low: {
    label: "Early estimate",
    className: "bg-amber/[0.08] text-amber-600",
  },
  medium: {
    label: "Growing confidence",
    className: "bg-sage/[0.1] text-sage",
  },
  high: {
    label: "High confidence",
    className: "bg-sage/[0.1] text-sage",
  },
};

export function ConfidenceBadge({ level }: { level: string }) {
  const c = config[level] ?? config.none;
  // Hide badge when confidence is high — the score speaks for itself
  if (level === "high") return null;

  return (
    <span
      className={`inline-flex items-center text-[11px] uppercase tracking-[0.094em] font-medium py-0.5 px-2.5 rounded-[3px] ${c.className}`}
    >
      {c.label}
    </span>
  );
}
