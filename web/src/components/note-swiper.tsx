"use client";

import { useState } from "react";

interface NoteForSwipe {
  id: number;
  name: string;
  category: string | null;
}

interface NotePreferenceItem {
  noteId: number;
  preference: string;
  note: { id: number; name: string; category: string | null };
}

const ratingButtons = [
  {
    value: "love",
    icon: "+",
    label: "Love",
    hoverClass: "hover:bg-sage/[0.2] hover:border-sage hover:text-sage hover:scale-110",
  },
  {
    value: "like",
    icon: "~",
    label: "Like",
    hoverClass: "hover:bg-amber/[0.2] hover:border-amber hover:text-amber hover:scale-110",
  },
  {
    value: "neutral",
    icon: "\u2013",
    label: "Meh",
    hoverClass: "hover:bg-white/[0.06] hover:border-white/[0.15] hover:scale-110",
  },
  {
    value: "dislike",
    icon: "\u00d7",
    label: "Skip",
    hoverClass: "hover:bg-rose/[0.2] hover:border-rose hover:text-rose hover:scale-110",
  },
];

const dotColors: Record<string, string> = {
  love: "bg-sage",
  like: "bg-amber",
  dislike: "bg-rose",
};

export function NoteSwiper({
  notes,
  existingPreferences,
  onPreferenceSet,
}: {
  notes: NoteForSwipe[];
  existingPreferences: NotePreferenceItem[];
  onPreferenceSet: (noteId: number, preference: string) => void;
}) {
  const ratedIds = new Set(existingPreferences.map((p) => p.noteId));
  const unrated = notes.filter((n) => !ratedIds.has(n.id));
  const [index, setIndex] = useState(0);

  // Recently rated (last 6)
  const recentlyRated = existingPreferences
    .filter((p) => p.preference !== "neutral")
    .slice(-6);

  if (unrated.length === 0 || index >= unrated.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-[family-name:var(--font-heading)] text-[20px] font-medium text-cream-50">
          All caught up!
        </p>
        <p className="mt-2 text-[13px] text-brown-light">
          You&apos;ve rated all available notes. Add more fragrances to discover new ones.
        </p>
      </div>
    );
  }

  const current = unrated[index];
  const remaining = unrated.length - index;

  const handleSwipe = (preference: string) => {
    onPreferenceSet(current.id, preference);
    setIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-baseline justify-between">
        <h3 className="font-[family-name:var(--font-heading)] text-[22px] font-medium text-cream-50">
          Rate Notes
        </h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.125em] text-brown-light">
          {remaining} Remaining
        </span>
      </div>

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center">
        {/* Card */}
        <div className="w-full max-w-[320px] rounded-xl border border-white/[0.07] bg-white/[0.02] p-11 pb-9 pt-11 text-center transition-transform duration-300 hover:-translate-y-[3px]">
          <p className="mb-1 font-[family-name:var(--font-heading)] text-[32px] font-medium text-cream-50">
            {current.name}
          </p>
          {current.category && (
            <p className="mb-8 text-[13px] text-brown-light">{current.category}</p>
          )}
          {!current.category && <div className="mb-8" />}

          {/* Rating buttons */}
          <div className="flex justify-center gap-2.5">
            {ratingButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleSwipe(btn.value)}
                className={`flex h-[54px] w-[54px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-white/[0.08] bg-transparent text-brown-light transition-all duration-300 ${btn.hoverClass}`}
              >
                <span className="text-[16px] font-medium">{btn.icon}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.0625em]">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recently rated */}
        {recentlyRated.length > 0 && (
          <div className="mt-6 w-full max-w-[320px]">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.125em] text-brown-light/[0.35]">
              Recently Rated
            </p>
            <div className="flex flex-wrap gap-1">
              {recentlyRated.map((p) => (
                <span
                  key={p.noteId}
                  className="flex items-center gap-1.5 rounded border border-white/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-brown-light"
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[p.preference] || "bg-brown-light"}`}
                  />
                  {p.note.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
