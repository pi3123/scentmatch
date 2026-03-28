// src/app/fragrance/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScentJourney } from "@/components/scent-journey";
import { RecommendationCard } from "@/components/recommendation-card";
import { NoteTag } from "@/components/note-tag";
import { ConfidenceBadge } from "@/components/confidence-badge";
import type { FragranceResult, MatchResponse, CollectionItem } from "@/types";

function parseAccords(mainAccords: string | null): string[] {
  if (!mainAccords) return [];
  try {
    const parsed = JSON.parse(mainAccords);
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.keys(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function matchLabel(score: number): string {
  if (score >= 80) return "Great Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Decent Match";
  return "Weak Match";
}

export default function FragranceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [fragrance, setFragrance] = useState<FragranceResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [notePreferences, setNotePreferences] = useState<Map<string, string>>(new Map());
  const [notFound, setNotFound] = useState(false);
  const [prefsCount, setPrefsCount] = useState(0);

  const fetchFragrance = useCallback(async () => {
    const res = await fetch(`/api/fragrances/${id}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    setFragrance(await res.json());
  }, [id]);

  const fetchMatch = useCallback(async () => {
    setMatchLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragranceId: parseInt(id) }),
      });
      if (res.ok) {
        setMatchResult(await res.json());
      }
    } catch {
      // match unavailable
    } finally {
      setMatchLoading(false);
    }
  }, [id]);

  const fetchSideData = useCallback(async () => {
    const [collRes, prefsRes, simRes] = await Promise.all([
      fetch("/api/collection"),
      fetch("/api/preferences"),
      fetch(`/api/fragrances/${id}/similar`),
    ]);

    if (collRes.ok) {
      const coll: CollectionItem[] = await collRes.json();
      const item = coll.find((c) => c.fragranceId === parseInt(id));
      if (item) setCollectionStatus(item.status);
    }

    if (prefsRes.ok) {
      const prefs = await prefsRes.json();
      setPrefsCount(prefs.length);
      const map = new Map<string, string>();
      for (const p of prefs) {
        map.set(p.note.name, p.preference);
      }
      setNotePreferences(map);
    }

    if (simRes.ok) {
      setSimilar(await simRes.json());
    }
  }, [id]);

  useEffect(() => {
    fetchFragrance();
    fetchMatch();
    fetchSideData();
  }, [fetchFragrance, fetchMatch, fetchSideData]);

  const handleAddToCollection = async (status: string) => {
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId: parseInt(id), status }),
    });
    setCollectionStatus(status);
  };

  if (notFound) {
    return (
      <div className="pt-[54px] flex flex-col items-center justify-center min-h-[60vh]">
        <p className="font-heading text-[28px] text-brown">Fragrance not found</p>
        <Link href="/" className="mt-4 text-[13px] text-brown-mid hover:text-brown underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (!fragrance) {
    return (
      <div className="pt-[54px] flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
      </div>
    );
  }

  const accords = parseAccords(fragrance.mainAccords);
  const notes = fragrance.notes.map((fn) => ({
    name: fn.note.name,
    layer: fn.layer,
  }));

  return (
    <div className="pt-[54px]">
      {/* ===== HERO ===== */}
      <div
        className="grid border-b border-cream-200"
        style={{ gridTemplateColumns: "220px 1fr", minHeight: "520px" }}
      >
        {/* Left sidebar */}
        <div className="bg-white border-r border-cream-200 p-7 flex flex-col items-center">
          {fragrance.imageUrl ? (
            <img
              src={fragrance.imageUrl}
              alt=""
              className="blend max-h-[200px] w-auto object-contain"
            />
          ) : (
            <div className="h-[200px] w-[120px] rounded bg-cream-200" />
          )}

          <p className="text-[10px] uppercase tracking-[0.15em] text-brown-light mt-5">
            {fragrance.brand}
            {fragrance.year ? ` \u00b7 ${fragrance.year}` : ""}
            {fragrance.gender ? ` \u00b7 ${fragrance.gender}` : ""}
          </p>
          <p className="font-heading text-[24px] text-brown mt-0.5 text-center">
            {fragrance.name}
          </p>

          {/* Community rating */}
          {fragrance.ratingValue && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-[13px] text-amber">
                  {"★".repeat(Math.round(fragrance.ratingValue))}
                </span>
                <span className="text-[13px] text-cream-200">
                  {"★".repeat(5 - Math.round(fragrance.ratingValue))}
                </span>
                <span className="font-heading text-[18px] font-semibold text-brown ml-1">
                  {fragrance.ratingValue.toFixed(1)}
                </span>
              </div>
              {fragrance.ratingCount && (
                <p className="text-[10px] text-brown-light mt-0.5">
                  {fragrance.ratingCount.toLocaleString()} ratings
                </p>
              )}
            </div>
          )}

          {/* Accords */}
          {accords.length > 0 && (
            <div className="mt-5 w-full">
              <p className="text-[10px] uppercase tracking-[0.08em] text-brown-light mb-2">
                Main Accords
              </p>
              <div className="flex flex-col gap-1.5">
                {accords.slice(0, 5).map((accord, i) => (
                  <div key={accord} className="flex items-center gap-2 text-[11px] text-brown-mid">
                    <div className="h-[5px] flex-1 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brown-mid rounded-full"
                        style={{ width: `${Math.max(30, 95 - i * 15)}%` }}
                      />
                    </div>
                    <span className="min-w-[60px] text-right capitalize">{accord}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: match analysis */}
        <div className="p-8 px-10 flex flex-col">
          {matchLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
              <p className="text-sm text-brown-mid">Analyzing match...</p>
            </div>
          ) : matchResult ? (
            <>
              {/* Score + label */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-[72px] h-[72px] rounded-full border-[3px] border-amber flex items-center justify-center">
                  <span className="font-heading text-[28px] font-semibold text-brown">
                    {matchResult.match_score}
                  </span>
                </div>
                <div>
                  <p className="font-heading text-[20px] text-brown">
                    {matchLabel(matchResult.match_score)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ConfidenceBadge level={matchResult.confidence} />
                    <span className="text-[11px] text-brown-light">
                      based on {prefsCount} rated notes
                    </span>
                  </div>
                </div>
              </div>

              {/* AI explanation */}
              {matchResult.explanation && (
                <p className="rounded-md border-l-[3px] border-amber bg-cream-100 p-4 text-[13px] leading-relaxed text-brown-mid mb-5">
                  {matchResult.explanation}
                </p>
              )}

              {/* Note breakdown */}
              <div className="mb-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brown-mid mb-2">
                  Note Breakdown
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.note_breakdown.loved.map((n) => (
                    <NoteTag key={n} name={n} preference="love" />
                  ))}
                  {matchResult.note_breakdown.liked.map((n) => (
                    <NoteTag key={n} name={n} preference="like" />
                  ))}
                  {matchResult.note_breakdown.neutral.map((n) => (
                    <NoteTag key={n} name={n} preference="neutral" />
                  ))}
                  {matchResult.note_breakdown.disliked.map((n) => (
                    <NoteTag key={n} name={n} preference="dislike" />
                  ))}
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-brown-light">
                  <span><span className="inline-block w-2 h-2 rounded-sm bg-sage mr-1" />Love</span>
                  <span><span className="inline-block w-2 h-2 rounded-sm bg-amber mr-1" />Like</span>
                  <span><span className="inline-block w-2 h-2 rounded-sm bg-cream-200 mr-1" />Neutral</span>
                  <span><span className="inline-block w-2 h-2 rounded-sm bg-rose mr-1" />Avoid</span>
                </div>
              </div>

              {/* Collection comparisons */}
              {matchResult.collection_comparisons.filter((c) => c.fragrance_name !== fragrance.name).length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brown-mid mb-2">
                    From Your Collection
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {matchResult.collection_comparisons.filter((c) => c.fragrance_name !== fragrance.name).map((comp) => (
                      <div
                        key={comp.fragrance_name}
                        className="flex justify-between items-center px-3 py-2 bg-white border border-cream-200 rounded-md"
                      >
                        <div>
                          <p className="text-[13px] font-medium text-brown">{comp.fragrance_name}</p>
                          <p className="text-[10px] text-brown-light">
                            {comp.shared_notes.join(", ")}
                          </p>
                        </div>
                        <span className="font-heading text-[16px] text-brown-mid">
                          {Math.round(comp.similarity * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to collection */}
              <div className="mt-auto pt-4">
                {collectionStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-brown-light">In collection as</span>
                    {["own", "tried", "want"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleAddToCollection(s)}
                        className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.05em] font-medium transition-colors ${
                          collectionStatus === s
                            ? "bg-brown text-cream-50"
                            : "bg-cream-100 text-brown-mid hover:bg-cream-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {["own", "tried", "want"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleAddToCollection(s)}
                        className="flex-1 rounded-[5px] bg-brown px-4 py-3 text-[12px] font-medium uppercase tracking-[0.06em] text-cream-50 transition hover:bg-[#2a2218]"
                      >
                        {s === "own" ? "I Own This" : s === "tried" ? "I\u2019ve Tried This" : "I Want This"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No match data -- new user */
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
              <p className="font-heading text-[22px] text-brown mb-2">
                Get your match score
              </p>
              <p className="text-[13px] text-brown-mid max-w-[320px] mb-5">
                Rate some fragrance notes so we can tell you how well this matches your taste.
              </p>
              <Link
                href="/profile"
                className="rounded-[5px] bg-brown px-6 py-3 text-[12px] font-medium uppercase tracking-[0.06em] text-cream-50 transition hover:bg-[#2a2218]"
              >
                Build Your Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===== SCENT JOURNEY ===== */}
      <ScentJourney notes={notes} fragranceName={fragrance.name} />

      {/* ===== RECOMMENDATIONS ===== */}
      {similar.length > 0 && (
        <div className="bg-white border-t border-cream-200 py-12 px-12">
          <p className="text-[10px] uppercase tracking-[0.2em] text-brown-light mb-1">
            Based on Your Taste
          </p>
          <p className="font-heading text-[24px] text-brown mb-7">
            You might also love
          </p>
          <div className="grid grid-cols-4 gap-3">
            {similar.slice(0, 4).map((frag) => (
              <RecommendationCard
                key={frag.id}
                fragrance={frag}
                notePreferences={notePreferences}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
