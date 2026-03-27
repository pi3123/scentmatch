"use client";

import type { MatchResponse } from "@/types";
import { ConfidenceBadge } from "./confidence-badge";
import { NoteTag } from "./note-tag";

function ScoreRing({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? "stroke-sage-500"
      : score >= 50
        ? "stroke-amber-400"
        : "stroke-rose-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-cream-200"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ animation: "score-fill 0.8s ease-out" }}
        />
      </svg>
      <span className="absolute font-[family-name:var(--font-display)] text-3xl font-bold text-warm-800">
        {score}
      </span>
    </div>
  );
}

export function MatchResult({
  result,
  onAddToCollection,
}: {
  result: MatchResponse;
  onAddToCollection?: () => void;
}) {
  const { note_breakdown } = result;

  return (
    <div className="animate-fade-up w-full max-w-xl space-y-6 rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-5">
        {result.fragrance.imageUrl ? (
          <img
            src={result.fragrance.imageUrl}
            alt=""
            className="h-20 w-16 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-cream-200 text-warm-600">
            ?
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-warm-800">
            {result.fragrance.name}
          </h2>
          <p className="text-sm text-warm-600">{result.fragrance.brand}</p>
          <div className="mt-1.5">
            <ConfidenceBadge level={result.confidence} />
          </div>
        </div>
        <ScoreRing score={result.match_score} />
      </div>

      {/* Explanation */}
      {result.explanation && (
        <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm leading-relaxed text-warm-700">
          {result.explanation}
        </p>
      )}

      {/* Note Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-600">
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

      {/* Risk Factors */}
      {result.risk_factors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Watch Out
          </h3>
          <ul className="space-y-1">
            {result.risk_factors.map((r) => (
              <li key={r} className="text-sm text-warm-700">
                <span className="mr-1.5 text-rose-400">&bull;</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collection Comparisons */}
      {result.collection_comparisons.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-600">
            From Your Collection
          </h3>
          <div className="space-y-2">
            {result.collection_comparisons.slice(0, 3).map((comp) => (
              <div
                key={comp.fragrance_name}
                className="rounded-lg bg-cream-50 px-3 py-2"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-warm-800">
                    {comp.fragrance_name}
                  </span>
                  <span className="text-xs text-warm-600">
                    {Math.round(comp.similarity * 100)}% similar
                  </span>
                </div>
                {comp.shared_notes.length > 0 && (
                  <p className="mt-0.5 text-xs text-warm-600">
                    Shared: {comp.shared_notes.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Collection CTA */}
      {onAddToCollection && (
        <button
          onClick={onAddToCollection}
          className="w-full rounded-xl bg-warm-700 py-2.5 text-sm font-medium text-cream-50 transition-colors hover:bg-warm-800"
        >
          Add to Collection
        </button>
      )}
    </div>
  );
}
