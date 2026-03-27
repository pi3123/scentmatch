const styles: Record<string, string> = {
  love: "bg-sage/[0.1] text-[#4a6340]",
  like: "bg-amber/[0.08] text-[#8a6d2e]",
  neutral: "bg-cream-200 text-brown-mid",
  dislike: "bg-rose/[0.08] text-[#8a4540]",
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
      className={`inline-flex items-center text-[13px] font-medium py-1 px-3 rounded transition-transform hover:-translate-y-px ${cls}`}
    >
      {name}
    </span>
  );
}
