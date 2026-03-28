"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { MatchResult } from "@/components/match-result";
import type { CollectionItem, FragranceResult, MatchResponse } from "@/types";

interface HeroBottle {
  name: string;
  src: string;
  height: number;
  delay: string;
  label?: string;
}

const heights = [280, 350, 310, 260, 290, 320];
const delays = ["0.3s", "0.5s", "0.7s", "0.9s", "1.1s", "1.3s"];

function buildBottles(collection: CollectionItem[]): HeroBottle[] {
  const withImages = collection.filter((c) => c.fragrance.imageUrl);
  if (withImages.length === 0) return [];

  return withImages.slice(0, 3).map((item, i) => ({
    name: item.fragrance.name,
    src: item.fragrance.imageUrl!,
    height: heights[i % heights.length],
    delay: delays[i % delays.length],
    label: item.status,
  }));
}

export default function Home() {
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bottles, setBottles] = useState<HeroBottle[]>([]);
  const [bottlesReady, setBottlesReady] = useState(false);
  const [stats, setStats] = useState([
    { value: "--", label: "In Database", delay: "1.1s" },
    { value: "--", label: "Notes Rated", delay: "1.2s" },
    { value: "--", label: "In Collection", delay: "1.3s" },
    { value: "--", label: "Taste Profile", delay: "1.4s" },
  ]);

  const fetchData = useCallback(async () => {
    try {
      const [collRes, prefsRes, statsRes] = await Promise.all([
        fetch("/api/collection"),
        fetch("/api/preferences"),
        fetch("/api/stats"),
      ]);
      const collection: CollectionItem[] = collRes.ok ? await collRes.json() : [];
      const prefs = prefsRes.ok ? await prefsRes.json() : [];
      const dbStats = statsRes.ok ? await statsRes.json() : { fragranceCount: 0 };

      // Build hero bottles from user's collection only
      setBottles(buildBottles(collection));
      setBottlesReady(true);

      const loved = prefs.filter((p: { preference: string }) => p.preference === "love").length;
      const total = prefs.length;
      const profileStrength = total === 0 ? "New" : total < 5 ? "Building" : total < 15 ? "Growing" : "Strong";

      setStats([
        { value: dbStats.fragranceCount.toLocaleString(), label: "In Database", delay: "1.1s" },
        { value: String(total), label: loved > 0 ? `Notes Rated \u00b7 ${loved} loved` : "Notes Rated", delay: "1.2s" },
        { value: String(collection.length), label: "In Collection", delay: "1.3s" },
        { value: profileStrength, label: "Taste Profile", delay: "1.4s" },
      ]);
    } catch {
      setBottlesReady(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      {/* Hero — compact when match result is showing */}
      {matchResult && !loading ? (
        <div className="bg-white py-5 px-8">
          <div className="w-full max-w-[480px]">
            <SearchBar onSelect={handleSelect} />
          </div>
        </div>
      ) : bottlesReady && bottles.length > 0 ? (
        /* Two-column: text + collection bottles */
        <div className="grid" style={{ gridTemplateColumns: "1fr 1.2fr" }}>
          <div className="flex flex-col justify-center" style={{ padding: "100px 48px 60px 80px" }}>
            <p
              className="text-[11px] uppercase font-semibold text-brown-light opacity-0 animate-fadeUp"
              style={{ letterSpacing: "0.25em", animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              BLIND BUY CONFIDENCE
            </p>
            <h1
              className="font-[family-name:var(--font-heading)] text-[64px] font-medium text-brown leading-none tracking-tight opacity-0 animate-fadeUp"
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
          <div className="flex items-center justify-center bg-white" style={{ padding: "80px 24px" }}>
            {bottles.map((bottle) => (
              <div
                key={bottle.name}
                className="group relative flex flex-col items-center mx-2 opacity-0 animate-bottleUp"
                style={{ animationDelay: bottle.delay, animationFillMode: "forwards" }}
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
      ) : (
        /* Full-width hero: no collection yet */
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: "120px 40px 80px" }}>
          <p
            className="text-[11px] uppercase font-semibold text-brown-light opacity-0 animate-fadeUp"
            style={{ letterSpacing: "0.25em", animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            BLIND BUY CONFIDENCE
          </p>
          <h1
            className="font-[family-name:var(--font-heading)] text-[72px] font-medium text-brown leading-none tracking-tight opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
          >
            Will you <em className="text-amber">love it?</em>
          </h1>
          <p
            className="text-[16px] text-brown-mid mt-6 max-w-[460px] leading-relaxed opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            Search any fragrance and we&apos;ll tell you how well it matches your taste.
            Build your collection, rate notes, and never regret a blind buy again.
          </p>
          <div
            className="mt-8 w-full max-w-[480px] opacity-0 animate-fadeUp"
            style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
          >
            <SearchBar onSelect={handleSelect} />
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-4 bg-white border-t border-cream-200">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`py-5 px-8 opacity-0 animate-fadeUp${i < stats.length - 1 ? " border-r border-cream-200" : ""}`}
            style={{ animationDelay: stat.delay, animationFillMode: "forwards" }}
          >
            <div className="font-[family-name:var(--font-heading)] text-[26px] font-semibold text-brown">
              {stat.value}
            </div>
            <div className="text-[11px] uppercase font-medium text-brown-light mt-0.5" style={{ letterSpacing: "0.125em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Score result area — full width for the two-column grid */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
          <p className="text-sm text-brown-mid">Analyzing fragrance...</p>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-xl px-4">
          <div className="rounded-md border border-rose/20 bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        </div>
      )}

      {matchResult && !loading && (
        <MatchResult
          result={matchResult}
          onAddToCollection={handleAddToCollection}
        />
      )}

      {!matchResult && !loading && !error && null}
    </div>
  );
}
