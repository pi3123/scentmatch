"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { MatchResult } from "@/components/match-result";
import type { FragranceResult, MatchResponse } from "@/types";

export default function Home() {
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (fragrance: FragranceResult) => {
    setLoading(true);
    setError(null);
    setMatchResult(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragranceId: fragrance.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setMatchResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get match score");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!matchResult) return;
    try {
      await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragranceId: matchResult.fragrance.id,
          status: "want",
        }),
      });
    } catch {
      // silently fail for now
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-warm-800">
          Will you love it?
        </h1>
        <p className="mt-2 text-warm-600">
          Search any fragrance and see how it matches your taste.
        </p>
      </div>

      <SearchBar onSelect={handleSelect} />

      <div className="mt-10 w-full max-w-xl">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-warm-600" />
            <p className="text-sm text-warm-600">Analyzing fragrance...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        {matchResult && !loading && (
          <MatchResult
            result={matchResult}
            onAddToCollection={handleAddToCollection}
          />
        )}

        {!matchResult && !loading && !error && (
          <div className="py-16 text-center">
            <p className="text-5xl">&#127902;</p>
            <p className="mt-4 text-sm text-warm-600">
              Search above to score a fragrance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
