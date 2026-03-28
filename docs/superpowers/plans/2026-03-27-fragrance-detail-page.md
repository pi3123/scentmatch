# Fragrance Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-fragrance detail page at `/fragrance/[id]` with personalized match scoring above the fold, scent journey timeline, and taste-based recommendations below.

**Architecture:** Client-side page fetches fragrance data immediately, then fires off match scoring asynchronously. Two new API routes: one for similar fragrances, one reuses existing match endpoint. Three new components (scent-journey, recommendation-card, detail page), plus link updates across existing components.

**Tech Stack:** Next.js App Router, Prisma, Tailwind CSS, existing match engine + LLM adapter.

---

### Task 1: Similar Fragrances API Endpoint

**Files:**
- Create: `src/app/api/fragrances/[id]/similar/route.ts`

- [ ] **Step 1: Create the similar fragrances endpoint**

This endpoint finds fragrances sharing the most notes with the target, scores them lightly against user preferences, and excludes items already in the user's collection.

```typescript
// src/app/api/fragrances/[id]/similar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/get-user-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fragranceId = parseInt(id);

  const userId = await getUserId();

  // Get target fragrance's note IDs
  const targetNotes = await prisma.fragranceNote.findMany({
    where: { fragranceId },
    select: { noteId: true },
  });
  const noteIds = targetNotes.map((n) => n.noteId);

  if (noteIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get user's collection fragrance IDs to exclude
  const collection = await prisma.userCollection.findMany({
    where: { userId },
    select: { fragranceId: true },
  });
  const excludeIds = [fragranceId, ...collection.map((c) => c.fragranceId)];

  // Get user's note preferences for scoring
  const preferences = await prisma.notePreference.findMany({
    where: { userId },
    include: { note: true },
  });
  const prefMap = new Map(preferences.map((p) => [p.note.name, p.preference]));

  // Find fragrances sharing the most notes with target
  const similar = await prisma.fragrance.findMany({
    where: {
      id: { notIn: excludeIds },
      notes: { some: { noteId: { in: noteIds } } },
      imageUrl: { not: null },
    },
    include: {
      notes: { include: { note: true } },
    },
    take: 50,
  });

  // Score and sort by shared note count + preference alignment
  const scored = similar.map((frag) => {
    const fragNoteNames = frag.notes.map((fn) => fn.note.name);
    const sharedCount = frag.notes.filter((fn) => noteIds.includes(fn.noteId)).length;

    let prefScore = 0;
    for (const name of fragNoteNames) {
      const pref = prefMap.get(name);
      if (pref === "love") prefScore += 3;
      else if (pref === "like") prefScore += 1;
      else if (pref === "dislike") prefScore -= 2;
    }

    // Lightweight match score (0-100 scale)
    const maxPossible = fragNoteNames.length * 3;
    const matchScore = maxPossible > 0
      ? Math.round(Math.max(0, Math.min(100, ((prefScore + sharedCount * 2) / (maxPossible + sharedCount * 2)) * 100)))
      : Math.round((sharedCount / noteIds.length) * 50);

    return { ...frag, sharedCount, matchScore };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore || b.sharedCount - a.sharedCount);

  return NextResponse.json(scored.slice(0, 8));
}
```

- [ ] **Step 2: Verify the endpoint works**

Run: `curl http://localhost:3000/api/fragrances/877/similar`
Expected: JSON array of fragrance objects with `sharedCount` and `matchScore` fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/fragrances/[id]/similar/route.ts
git commit -m "feat: add similar fragrances API endpoint"
```

---

### Task 2: Scent Journey Component

**Files:**
- Create: `src/components/scent-journey.tsx`

- [ ] **Step 1: Create the scent journey timeline component**

This component takes fragrance notes grouped by layer and displays them as a visual timeline.

```tsx
// src/components/scent-journey.tsx
"use client";

interface NoteItem {
  name: string;
  layer: string;
}

const layers = [
  {
    key: "top",
    label: "First Spray",
    time: "0 - 30 min",
    color: "#c4973e",
  },
  {
    key: "middle",
    label: "Heart",
    time: "30 min - 3 hrs",
    color: "#6b8060",
  },
  {
    key: "base",
    label: "Dry Down",
    time: "3 hrs +",
    color: "#6b5a45",
  },
];

export function ScentJourney({
  notes,
  fragranceName,
}: {
  notes: NoteItem[];
  fragranceName: string;
}) {
  const grouped = {
    top: notes.filter((n) => n.layer === "top"),
    middle: notes.filter((n) => n.layer === "middle"),
    base: notes.filter((n) => n.layer === "base"),
  };

  // If no layer data, show flat list
  const hasLayers = grouped.top.length > 0 || grouped.middle.length > 0 || grouped.base.length > 0;
  if (!hasLayers) {
    return (
      <div className="py-10 px-12">
        <p className="text-[10px] uppercase tracking-[0.2em] text-brown-light mb-1">Notes</p>
        <p className="font-heading text-[24px] text-brown mb-6">
          What&apos;s inside {fragranceName}
        </p>
        <div className="flex flex-wrap gap-2">
          {notes.map((n) => (
            <span
              key={n.name}
              className="rounded-full border border-cream-200 bg-white px-3.5 py-1.5 text-[12px] text-brown"
            >
              {n.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-12">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brown-light mb-1">
        The Scent Journey
      </p>
      <p className="font-heading text-[24px] text-brown mb-8">
        How {fragranceName} unfolds
      </p>

      <div className="grid grid-cols-3 gap-0 relative">
        {/* Connecting gradient line */}
        <div
          className="absolute top-[20px] h-[2px] z-0"
          style={{
            left: "16.67%",
            right: "16.67%",
            background: "linear-gradient(to right, #c4973e, #6b8060, #6b5a45)",
          }}
        />

        {layers.map((layer) => {
          const layerNotes = grouped[layer.key as keyof typeof grouped];
          return (
            <div key={layer.key} className="relative z-[1] text-center px-4">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: layer.color }}
              >
                {layer.key === "top" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <path d="M12 2L8 8h8L12 2z" /><path d="M12 8v14" />
                  </svg>
                )}
                {layer.key === "middle" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                )}
                {layer.key === "base" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <p
                className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-0.5"
                style={{ color: layer.color }}
              >
                {layer.label}
              </p>
              <p className="text-[10px] text-brown-light mb-3">{layer.time}</p>
              <div className="flex flex-col gap-1.5 items-center">
                {layerNotes.map((n) => (
                  <span
                    key={n.name}
                    className="rounded-full border border-cream-200 bg-white px-3 py-1 text-[11px] text-brown"
                  >
                    {n.name}
                  </span>
                ))}
                {layerNotes.length === 0 && (
                  <span className="text-[11px] text-brown-light italic">none listed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/scent-journey.tsx
git commit -m "feat: add scent journey timeline component"
```

---

### Task 3: Recommendation Card Component

**Files:**
- Create: `src/components/recommendation-card.tsx`

- [ ] **Step 1: Create the recommendation card component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/recommendation-card.tsx
git commit -m "feat: add recommendation card component"
```

---

### Task 4: Fragrance Detail Page

**Files:**
- Create: `src/app/fragrance/[id]/page.tsx`

- [ ] **Step 1: Create the detail page**

This is the main page component. It fetches fragrance data on mount, then asynchronously fetches the match score, collection status, preferences, and similar fragrances.

```tsx
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
              {matchResult.collection_comparisons.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brown-mid mb-2">
                    From Your Collection
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {matchResult.collection_comparisons.map((comp) => (
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
```

- [ ] **Step 2: Verify the page renders**

Navigate to `http://localhost:3000/fragrance/877` (Sauvage). Should see:
- Left sidebar with bottle, brand, rating, accords
- Right side with match score loading, then result
- Scent journey timeline below
- Recommendation cards at bottom

- [ ] **Step 3: Commit**

```bash
git add src/app/fragrance/[id]/page.tsx
git commit -m "feat: add fragrance detail page"
```

---

### Task 5: Link Existing Components to Detail Page

**Files:**
- Modify: `src/components/fragrance-card.tsx`
- Modify: `src/components/match-result.tsx`

- [ ] **Step 1: Make collection cards link to detail page**

In `src/components/fragrance-card.tsx`, wrap the card content with a Next.js Link. Add the import at the top:

```tsx
import Link from "next/link";
```

For the **featured** card, wrap the outer div's content in a Link. Replace the outermost `<div>` with:

```tsx
<Link href={`/fragrance/${f.id}`} className="block h-full">
```

Replace the opening `<div` of the featured card (line 43-45):
```tsx
    return (
      <Link
        href={`/fragrance/${f.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white cursor-pointer transition duration-[400ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.985] hover:shadow-[0_12px_40px_rgba(30,24,18,0.08)]"
      >
```

And change the closing `</div>` on line 96 to `</Link>`.

For the **regular** card (line 100-153), same approach: change the outer `<div` to `<Link href={...}` and the closing `</div>` to `</Link>`.

- [ ] **Step 2: Add "View Details" link to match result**

In `src/components/match-result.tsx`, add import:

```tsx
import Link from "next/link";
```

Add a link next to or below the fragrance name. After the meta row div (around line 71), add:

```tsx
<Link
  href={`/fragrance/${result.fragrance.id}`}
  className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-brown-mid hover:text-brown transition"
>
  View full details &rarr;
</Link>
```

- [ ] **Step 3: Verify links work**

- Go to `/collection`, click a fragrance card -- should navigate to `/fragrance/[id]`
- Go to `/`, search and select a fragrance, see match result -- "View full details" link should appear and navigate correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/fragrance-card.tsx src/components/match-result.tsx
git commit -m "feat: link collection cards and match results to detail page"
```

---

### Task 6: Page Title

**Files:**
- Modify: `src/app/fragrance/[id]/page.tsx`

- [ ] **Step 1: Add dynamic page title**

At the top of the `FragranceDetailPage` component, after the fragrance is loaded, update the document title. Add this inside the component after the `fragrance` state check:

```tsx
useEffect(() => {
  if (fragrance) {
    document.title = `${fragrance.name} by ${fragrance.brand} | ScentMatch`;
  }
  return () => { document.title = "ScentMatch - Blind Buy Confidence"; };
}, [fragrance]);
```

Add this after the existing `useEffect` that calls `fetchFragrance`.

- [ ] **Step 2: Commit**

```bash
git add src/app/fragrance/[id]/page.tsx
git commit -m "feat: dynamic page title for fragrance detail"
```
