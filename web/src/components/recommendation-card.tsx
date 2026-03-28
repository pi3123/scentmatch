// src/components/recommendation-card.tsx
"use client";

import Link from "next/link";

interface RecommendationFragrance {
  id: number;
  name: string;
  brand: string;
  year: number | null;
  imageUrl: string | null;
  matchScore: number;
  notes: {
    note: { name: string; category: string | null };
  }[];
}

export function RecommendationCard({
  fragrance,
  notePreferences,
}: {
  fragrance: RecommendationFragrance;
  notePreferences: Map<string, string>;
}) {
  const topNotes = fragrance.notes.slice(0, 3);

  const prefColor = (name: string) => {
    const pref = notePreferences.get(name);
    if (pref === "love") return "bg-sage/[0.15] text-[#4a6340]";
    if (pref === "like") return "bg-amber/[0.12] text-[#8a6d2e]";
    if (pref === "dislike") return "bg-rose/[0.12] text-[#8a4540]";
    return "bg-cream-200 text-brown-mid";
  };

  return (
    <Link href={`/fragrance/${fragrance.id}`} className="block">
      <div className="group rounded-[10px] overflow-hidden border border-cream-200 bg-cream-50 cursor-pointer transition duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.97] hover:shadow-[0_12px_40px_rgba(30,24,18,0.08)]">
        <div className="h-[160px] bg-white flex items-center justify-center relative">
          {fragrance.imageUrl ? (
            <img
              src={fragrance.imageUrl}
              alt=""
              className="blend max-h-[130px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="h-[100px] w-[60px] rounded bg-cream-200" />
          )}
          <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-brown flex items-center justify-center">
            <span className="font-heading text-[13px] font-semibold text-amber">
              {fragrance.matchScore}
            </span>
          </div>
        </div>
        <div className="p-3 px-3.5">
          <p className="text-[13px] font-medium text-brown truncate">{fragrance.name}</p>
          <p className="text-[10px] text-brown-light mt-0.5">
            {fragrance.brand}
            {fragrance.year ? ` \u00b7 ${fragrance.year}` : ""}
          </p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {topNotes.map((fn) => (
              <span
                key={fn.note.name}
                className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium ${prefColor(fn.note.name)}`}
              >
                {fn.note.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
