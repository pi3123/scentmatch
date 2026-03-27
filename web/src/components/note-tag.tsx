const styles: Record<string, string> = {
  love: "bg-sage-400/20 text-sage-600 border-sage-400/30",
  like: "bg-sky-400/20 text-sky-500 border-sky-400/30",
  neutral: "bg-cream-200 text-warm-600 border-cream-300",
  dislike: "bg-rose-400/20 text-rose-500 border-rose-400/30",
};

export function NoteTag({
  name,
  preference = "neutral",
}: {
  name: string;
  preference?: string;
}) {
  const cls = styles[preference] ?? styles.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {name}
    </span>
  );
}
