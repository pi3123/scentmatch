const config: Record<string, { label: string; className: string }> = {
  none: {
    label: "No data",
    className: "bg-cream-200 text-warm-600",
  },
  low: {
    label: "Early estimate",
    className: "bg-amber-400/20 text-amber-500",
  },
  medium: {
    label: "Growing confidence",
    className: "bg-sky-400/20 text-sky-500",
  },
  high: {
    label: "High confidence",
    className: "bg-sage-400/20 text-sage-600",
  },
};

export function ConfidenceBadge({ level }: { level: string }) {
  const c = config[level] ?? config.none;
  // Hide badge when confidence is high — the score speaks for itself
  if (level === "high") return null;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.className}`}
    >
      {c.label}
    </span>
  );
}
