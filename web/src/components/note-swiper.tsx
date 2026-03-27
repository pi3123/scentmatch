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

const preferenceButtons = [
  { value: "love", label: "Love", emoji: "&#10084;&#65039;", color: "bg-sage-500 hover:bg-sage-600 text-white" },
  { value: "like", label: "Like", emoji: "&#128077;", color: "bg-sky-500 hover:bg-sky-400 text-white" },
  { value: "neutral", label: "Meh", emoji: "&#128528;", color: "bg-cream-300 hover:bg-cream-400 text-warm-700" },
  { value: "dislike", label: "Dislike", emoji: "&#128078;", color: "bg-rose-500 hover:bg-rose-400 text-white" },
];

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

  if (unrated.length === 0 || index >= unrated.length) {
    return (
      <div className="rounded-xl border border-cream-200 bg-white p-8 text-center">
        <p className="text-4xl">&#127942;</p>
        <p className="mt-3 text-sm font-medium text-warm-800">All caught up!</p>
        <p className="mt-1 text-xs text-warm-600">
          You&apos;ve rated all available notes. Add more fragrances to discover new ones.
        </p>
      </div>
    );
  }

  const current = unrated[index];

  const handleSwipe = async (preference: string) => {
    onPreferenceSet(current.id, preference);
    setIndex((i) => i + 1);
  };

  return (
    <div className="rounded-xl border border-cream-200 bg-white p-6">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-600">
          Rate This Note
        </h3>
        <span className="text-xs text-cream-500">
          {unrated.length - index} remaining
        </span>
      </div>

      <div className="my-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-warm-800">
          {current.name}
        </p>
        {current.category && (
          <p className="mt-1 text-xs text-warm-600">{current.category}</p>
        )}
      </div>

      <div className="flex justify-center gap-2">
        {preferenceButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleSwipe(btn.value)}
            className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-95 ${btn.color}`}
          >
            <span dangerouslySetInnerHTML={{ __html: btn.emoji }} />
            <span className="text-xs">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
