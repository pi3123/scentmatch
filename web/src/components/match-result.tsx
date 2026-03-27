"use client";

import type { MatchResponse } from "@/types";
import { ConfidenceBadge } from "./confidence-badge";
import { NoteTag } from "./note-tag";

export function MatchResult({
  result,
  onAddToCollection,
}: {
  result: MatchResponse;
  onAddToCollection?: () => void;
}) {
  const { note_breakdown } = result;

  return (
    <div
      className="animate-fade-up w-full border-b border-cream-200"
      style={{
        display: "grid",
        gridTemplateColumns: "400px 1fr",
        minHeight: "580px",
      }}
    >
      {/* Left column — score image */}
      <div className="group relative flex items-center justify-center bg-white p-12">
        {result.fragrance.imageUrl ? (
          <img
            src={result.fragrance.imageUrl}
            alt=""
            className="blend h-[380px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            style={{
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        ) : (
          <div className="h-[380px] w-[260px] rounded bg-cream-200" />
        )}

        {/* Floating score badge */}
        <div
          className="absolute right-7 top-7 flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-brown"
          style={{
            animation:
              "scoreIn 0.6s 0.2s ease forwards, pulseGlow 3s 1s infinite",
            opacity: 0,
            boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
          }}
        >
          <span className="font-[family-name:var(--font-heading)] text-[30px] font-semibold text-cream-50">
            {result.match_score}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.125em] text-brown-light">
            Match
          </span>
        </div>
      </div>

      {/* Right column — score info */}
      <div className="flex flex-col p-11 px-[52px]">
        {/* Fragrance name */}
        <h2 className="font-[family-name:var(--font-heading)] text-[34px] font-medium leading-tight text-brown">
          {result.fragrance.name}
        </h2>

        {/* Meta row */}
        <div className="mb-5 mt-1.5 flex items-center gap-3.5">
          <span className="text-[12px] font-medium uppercase tracking-[0.156em] text-brown-mid">
            {result.fragrance.brand}
          </span>
          <ConfidenceBadge level={result.confidence} />
        </div>

        {/* Verdict / explanation */}
        {result.explanation && (
          <p className="mb-6 rounded-md border-l-[3px] border-amber bg-cream-100 p-4 font-[family-name:var(--font-heading)] text-[17px] italic leading-relaxed text-brown-mid">
            {result.explanation}
          </p>
        )}

        {/* Two sub-columns */}
        <div className="grid flex-1 grid-cols-2">
          {/* Left panel — Note Breakdown */}
          <div className="border-r border-cream-100 pr-6">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.156em] text-brown-mid">
              Note Breakdown
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {note_breakdown.loved.map((n) => (
                <NoteTag key={n} name={n} preference="love" />
              ))}
              {note_breakdown.liked.map((n) => (
                <NoteTag key={n} name={n} preference="like" />
              ))}
              {note_breakdown.neutral.map((n) => (
                <NoteTag key={n} name={n} preference="neutral" />
              ))}
              {note_breakdown.disliked.map((n) => (
                <NoteTag key={n} name={n} preference="dislike" />
              ))}
            </div>
          </div>

          {/* Right panel — From Your Collection */}
          <div className="pl-6">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.156em] text-brown-mid">
              From Your Collection
            </h3>
            {result.collection_comparisons.length > 0 ? (
              <div>
                {result.collection_comparisons.map((comp, i) => (
                  <div
                    key={comp.fragrance_name}
                    className={`flex cursor-pointer items-center gap-3 border-b border-cream-100 py-2.5 transition-all hover:pl-1 ${
                      i === result.collection_comparisons.length - 1
                        ? "border-0"
                        : ""
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-[14px] font-medium text-brown">
                        {comp.fragrance_name}
                      </span>
                      {comp.shared_notes.length > 0 && (
                        <p className="text-[12px] text-brown-mid">
                          {comp.shared_notes.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto font-[family-name:var(--font-heading)] text-[20px] font-semibold text-sage">
                      {Math.round(comp.similarity * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-brown-mid">
                No comparisons available yet.
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {onAddToCollection && (
          <div className="mt-auto flex gap-2.5 pt-5">
            <button
              onClick={onAddToCollection}
              className="flex-1 rounded-[5px] bg-brown px-6 py-3.5 text-[13px] font-medium tracking-[0.0625em] text-cream-50 transition hover:bg-[#2a2218]"
            >
              Add to Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
