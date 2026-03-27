"use client";

interface NotePreferenceItem {
  noteId: number;
  preference: string;
  note: { id: number; name: string; category: string | null };
}

interface CollectionStats {
  total: number;
  own: number;
  tried: number;
  want: number;
}

const barColors = [
  "bg-amber",
  "bg-sage",
  "bg-brown-light",
  "bg-rose",
  null, // index 4 uses inline style
];

export function TasteProfile({
  preferences,
  stats,
}: {
  preferences: NotePreferenceItem[];
  stats: CollectionStats;
}) {
  const loved = preferences.filter((p) => p.preference === "love");
  const liked = preferences.filter((p) => p.preference === "like");
  const disliked = preferences.filter((p) => p.preference === "dislike");

  // Build category breakdown
  const categoryMap = new Map<string, number>();
  for (const p of [...loved, ...liked]) {
    const cat = p.note.category || "Other";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  }
  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCat = topCategories[0]?.[1] ?? 1;

  const noteGroups = [
    { label: "Love", items: loved, chipBg: "bg-sage/[0.15]", chipText: "text-[#a3c497]" },
    { label: "Like", items: liked, chipBg: "bg-amber/[0.12]", chipText: "text-[#d4b870]" },
    { label: "Avoid", items: disliked, chipBg: "bg-rose/[0.12]", chipText: "text-[#d49690]" },
  ];

  return (
    <div>
      {/* Heading */}
      <h2 className="font-[family-name:var(--font-heading)] text-[30px] font-medium text-cream-50">
        Your Taste DNA
      </h2>
      <p className="mb-7 text-[14px] text-brown-light">
        Built from {stats.total} fragrances and {preferences.length} rated notes
      </p>

      {/* Stats grid */}
      <div className="mb-7 grid grid-cols-4 overflow-hidden rounded-md border border-white/[0.06]">
        {[
          { label: "Owned", value: stats.own },
          { label: "Tried", value: stats.tried },
          { label: "Wishlist", value: stats.want },
          { label: "Notes", value: preferences.length },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className={`border-white/[0.06] p-4 text-center${i < 3 ? " border-r" : ""}`}
          >
            <p className="font-[family-name:var(--font-heading)] text-[26px] font-medium text-cream-50">
              {value}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.125em] text-brown-light">
              {label}
            </p>
          </div>
        ))}
      </div>

      {preferences.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-[14px] text-brown-light">
            Rate some notes to build your taste profile.
          </p>
        </div>
      )}

      {/* Accord bars */}
      {topCategories.length > 0 && (
        <div className="mb-7 flex flex-col gap-3">
          {topCategories.map(([cat, count], idx) => {
            const pct = Math.round((count / maxCat) * 100);
            const colorClass = barColors[idx] ?? null;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-[100px] text-right text-[13px] text-brown-light">
                  {cat}
                </span>
                <div className="flex-1 h-1 rounded-sm overflow-hidden bg-white/[0.04]">
                  <div
                    className={`h-full rounded-sm${colorClass ? ` ${colorClass}` : ""}`}
                    style={{
                      width: `${pct}%`,
                      animation: "barGrow 1.2s ease forwards",
                      animationDelay: `${idx * 0.1}s`,
                      transformOrigin: "left",
                      ...(colorClass ? {} : { backgroundColor: "#7a9aad" }),
                    }}
                  />
                </div>
                <span className="w-9 font-[family-name:var(--font-heading)] text-[16px] font-medium text-brown-light">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Note groups */}
      <div className="grid grid-cols-3 gap-3.5">
        {noteGroups.map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.label}>
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.156em] text-brown-light">
                  {group.label}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {group.items.map((p) => (
                    <span
                      key={p.noteId}
                      className={`rounded px-2.5 py-0.5 text-[12px] font-medium ${group.chipBg} ${group.chipText}`}
                    >
                      {p.note.name}
                    </span>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
