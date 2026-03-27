"use client";

import { NoteTag } from "./note-tag";

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
    .slice(0, 6);
  const maxCat = topCategories[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Owned", value: stats.own },
          { label: "Tried", value: stats.tried },
          { label: "Wishlist", value: stats.want },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-cream-200 bg-white p-4 text-center"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-warm-800">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-warm-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Loved Notes */}
      {loved.length > 0 && (
        <div className="rounded-xl border border-cream-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-600">
            Notes You Love
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {loved.map((p) => (
              <NoteTag key={p.noteId} name={p.note.name} preference="love" />
            ))}
          </div>
        </div>
      )}

      {/* Liked Notes */}
      {liked.length > 0 && (
        <div className="rounded-xl border border-cream-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-600">
            Notes You Like
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {liked.map((p) => (
              <NoteTag key={p.noteId} name={p.note.name} preference="like" />
            ))}
          </div>
        </div>
      )}

      {/* Disliked Notes */}
      {disliked.length > 0 && (
        <div className="rounded-xl border border-cream-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-600">
            Notes to Avoid
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {disliked.map((p) => (
              <NoteTag key={p.noteId} name={p.note.name} preference="dislike" />
            ))}
          </div>
        </div>
      )}

      {/* Favorite Accord Categories */}
      {topCategories.length > 0 && (
        <div className="rounded-xl border border-cream-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-warm-600">
            Top Accord Families
          </h3>
          <div className="space-y-2">
            {topCategories.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-20 truncate text-xs text-warm-700">
                  {cat}
                </span>
                <div className="flex-1">
                  <div
                    className="h-2.5 rounded-full bg-warm-700/80"
                    style={{ width: `${(count / maxCat) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-warm-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preferences.length === 0 && (
        <div className="rounded-xl border border-cream-200 bg-white p-8 text-center">
          <p className="text-4xl">&#127803;</p>
          <p className="mt-3 text-sm text-warm-600">
            Rate some notes below to build your taste profile.
          </p>
        </div>
      )}
    </div>
  );
}
