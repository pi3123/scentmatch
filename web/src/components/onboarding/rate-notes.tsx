"use client";

import { useCallback, useEffect, useState } from "react";

interface NoteItem {
  id: number;
  name: string;
  category: string | null;
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

const REQUIRED_RATINGS = 7;

export function OnboardingRateNotes({ onDone }: { onDone: () => void }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [index, setIndex] = useState(0);
  const [ratedCount, setRatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleRate = async (preference: string) => {
    const note = notes[index];
    if (!note) return;

    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: note.id, preference }),
    });

    if (preference !== "dislike") {
      setRatedCount((c) => c + 1);
    }
    setIndex((i) => i + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brown">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown-light" />
      </div>
    );
  }

  const current = notes[index];
  const showDone = ratedCount >= REQUIRED_RATINGS;
  const progress = Math.min(ratedCount / REQUIRED_RATINGS, 1);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brown text-cream-50">
      {/* Progress bar */}
      <div className="fixed left-0 top-0 h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-amber to-[#d4b87a] transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Counter */}
      <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.15em] text-brown-light">
        {ratedCount} of {REQUIRED_RATINGS}
      </p>

      {current ? (
        <>
          {/* Note card */}
          <div className="w-full max-w-[300px] rounded-xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
            <p className="mb-1 font-[family-name:var(--font-heading)] text-[28px] font-medium text-cream-50">
              {current.name}
            </p>
            {current.category && (
              <p className="mb-7 text-[12px] text-brown-light">{current.category}</p>
            )}
            {!current.category && <div className="mb-7" />}

            <div className="flex justify-center gap-2.5">
              {ratingButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleRate(btn.value)}
                  className={`flex h-[50px] w-[50px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border border-white/[0.08] bg-transparent text-brown-light transition-all duration-300 ${btn.hoverClass}`}
                >
                  <span className="text-[15px] font-medium">{btn.icon}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-[0.0625em]">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Done button */}
          {showDone && (
            <button
              onClick={onDone}
              className="mt-8 rounded-lg bg-amber px-8 py-3 text-[13px] font-medium tracking-[0.05em] text-brown transition-colors hover:bg-[#d4b87a]"
            >
              Done
            </button>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="font-[family-name:var(--font-heading)] text-[20px] font-medium">
            All caught up!
          </p>
          <button
            onClick={onDone}
            className="mt-6 rounded-lg bg-amber px-8 py-3 text-[13px] font-medium tracking-[0.05em] text-brown transition-colors hover:bg-[#d4b87a]"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
