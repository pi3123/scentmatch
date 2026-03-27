"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { MatchResult } from "@/components/match-result";
import type { FragranceResult, MatchResponse } from "@/types";

const bottles = [
  {
    name: "Acqua di Gio",
    src: "https://fimgs.net/mdimg/perfume/375x500.410.jpg",
    height: 280,
    delay: "0.3s",
  },
  {
    name: "Tobacco Vanille",
    src: "https://fimgs.net/mdimg/perfume/375x500.1825.jpg",
    height: 350,
    delay: "0.5s",
  },
  {
    name: "Sauvage",
    src: "https://fimgs.net/mdimg/perfume/375x500.31861.jpg",
    height: 310,
    delay: "0.7s",
  },
  {
    name: "Aventus",
    src: "https://fimgs.net/mdimg/perfume/375x500.9828.jpg",
    height: 260,
    delay: "0.9s",
  },
];

const stats = [
  { value: "1,247", label: "Fragrances", delay: "1.1s" },
  { value: "47", label: "Notes Rated", delay: "1.2s" },
  { value: "12", label: "In Collection", delay: "1.3s" },
  { value: "87%", label: "Best Match", delay: "1.4s" },
];

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
    <div className="pt-[54px]">
      {/* Hero: two-column split */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 1.2fr" }}
      >
        {/* Left column: text + search */}
        <div className="flex flex-col justify-center" style={{ padding: "120px 48px 80px 80px" }}>
          <p
            className="text-[11px] uppercase font-semibold text-brown-light opacity-0 animate-fadeUp"
            style={{ letterSpacing: "0.25em", animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            BLIND BUY CONFIDENCE
          </p>

          <h1
            className="font-[family-name:var(--font-display)] text-[64px] font-medium text-brown leading-none tracking-tight opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
          >
            Will you
            <br />
            <em className="text-amber">love it?</em>
          </h1>

          <p
            className="text-[15px] text-brown-mid mt-5 max-w-[380px] leading-relaxed opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            Search any fragrance and we&apos;ll match it against your taste profile.
            No more guessing, no more regret.
          </p>

          <div
            className="mt-7 opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
          >
            <SearchBar onSelect={handleSelect} />
          </div>
        </div>

        {/* Right column: bottles */}
        <div className="flex items-center justify-center bg-white" style={{ padding: "80px 24px" }}>
          {bottles.map((bottle) => (
            <div
              key={bottle.name}
              className="group relative flex flex-col items-center mx-2 opacity-0 animate-bottleUp"
              style={{
                animationDelay: bottle.delay,
                animationFillMode: "forwards",
              }}
            >
              <div className="transition-transform duration-500 group-hover:-translate-y-3 group-hover:scale-[1.06]" style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}>
                <img
                  src={bottle.src}
                  alt={bottle.name}
                  className="blend object-contain"
                  style={{ height: `${bottle.height}px` }}
                />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-brown px-3 py-1.5 text-[11px] font-medium text-cream-50 opacity-0 transition-opacity group-hover:opacity-100">
                {bottle.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 bg-white border-t border-cream-200">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`py-5 px-8 opacity-0 animate-fadeUp${i < stats.length - 1 ? " border-r border-cream-200" : ""}`}
            style={{ animationDelay: stat.delay, animationFillMode: "forwards" }}
          >
            <div className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-brown">
              {stat.value}
            </div>
            <div className="text-[11px] uppercase font-medium text-brown-light mt-0.5" style={{ letterSpacing: "0.125em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Score result area */}
      <div className="mx-auto mt-10 w-full max-w-xl px-4">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
            <p className="text-sm text-brown-mid">Analyzing fragrance...</p>
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
            <p className="text-sm text-brown-mid">
              Search above to score a fragrance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
