# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-time users see a welcome screen with two paths (rate notes / add collection), complete one, get a sign-in prompt, then land on the homepage with real data and an auto-scored popular fragrance.

**Architecture:** All onboarding screens render inline in `page.tsx` as client-side state transitions (no route changes). Four new components under `src/components/onboarding/`. One new API endpoint for popular fragrances. State detection via API data (0 prefs + 0 collection = show onboarding) plus a cookie fallback.

**Tech Stack:** React 19, Next.js 16, Supabase Auth, existing Prisma/PostgreSQL, Tailwind CSS.

---

## File Structure

### Files to Create
- `web/src/components/onboarding/welcome.tsx` — Two-card path selection (Rate Notes / Add Collection)
- `web/src/components/onboarding/rate-notes.tsx` — Note rating flow with progress counter, wraps NoteSwiper
- `web/src/components/onboarding/add-collection.tsx` — Popular fragrance grid + search + status picker
- `web/src/components/onboarding/sign-in-prompt.tsx` — "Save your progress" screen with Google OAuth + skip
- `web/src/app/api/fragrances/popular/route.ts` — Returns top 20 fragrances by rating_count with images

### Files to Modify
- `web/src/app/page.tsx` — Add onboarding state machine, render onboarding or homepage based on user data

---

## Task 1: Popular Fragrances API Endpoint

**Files:**
- Create: `web/src/app/api/fragrances/popular/route.ts`

- [ ] **Step 1: Create the endpoint**

Create `web/src/app/api/fragrances/popular/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fragrances = await prisma.fragrance.findMany({
    where: {
      imageUrl: { not: null },
      ratingCount: { not: null },
    },
    orderBy: { ratingCount: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      brand: true,
      imageUrl: true,
      ratingValue: true,
    },
  });

  return NextResponse.json(fragrances);
}
```

- [ ] **Step 2: Verify endpoint works**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npx next dev &
sleep 5
curl -s http://localhost:3000/api/fragrances/popular | head -c 200
```

Expected: JSON array of fragrance objects with id, name, brand, imageUrl, ratingValue.

- [ ] **Step 3: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/app/api/fragrances/popular/route.ts
git commit -m "feat: add popular fragrances API endpoint

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Welcome Screen Component

**Files:**
- Create: `web/src/components/onboarding/welcome.tsx`

- [ ] **Step 1: Create the welcome component**

Create `web/src/components/onboarding/welcome.tsx`:

```tsx
"use client";

export type OnboardingPath = "rate-notes" | "add-collection";

export function Welcome({
  onSelectPath,
}: {
  onSelectPath: (path: OnboardingPath) => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brown text-cream-50">
      <p className="mb-12 font-[family-name:var(--font-heading)] text-[20px] font-semibold text-cream-50">
        ScentMatch
      </p>

      <div className="flex gap-5">
        {/* Rate Notes card */}
        <button
          onClick={() => onSelectPath("rate-notes")}
          className="group w-[220px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:bg-white/[0.06]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[24px] transition-colors group-hover:bg-amber/10 group-hover:text-amber">
            &#9829;
          </div>
          <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[16px] font-medium text-cream-50">
            Rate Notes
          </h3>
          <p className="text-[12px] leading-relaxed text-brown-light">
            Tell us which scent families you love
          </p>
        </button>

        {/* Add Collection card */}
        <button
          onClick={() => onSelectPath("add-collection")}
          className="group w-[220px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:bg-white/[0.06]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[24px] transition-colors group-hover:bg-amber/10 group-hover:text-amber">
            +
          </div>
          <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[16px] font-medium text-cream-50">
            Add Collection
          </h3>
          <p className="text-[12px] leading-relaxed text-brown-light">
            Search fragrances you own or have tried
          </p>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/components/onboarding/welcome.tsx
git commit -m "feat: add onboarding welcome screen component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Rate Notes Onboarding Component

**Files:**
- Create: `web/src/components/onboarding/rate-notes.tsx`

This wraps the existing NoteSwiper pattern but adds a progress counter and a "Done" button that appears after 7 ratings.

- [ ] **Step 1: Create the rate-notes component**

Create `web/src/components/onboarding/rate-notes.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/components/onboarding/rate-notes.tsx
git commit -m "feat: add onboarding rate notes component with progress

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Add Collection Onboarding Component

**Files:**
- Create: `web/src/components/onboarding/add-collection.tsx`

- [ ] **Step 1: Create the add-collection component**

Create `web/src/components/onboarding/add-collection.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import type { FragranceResult } from "@/types";

interface PopularFragrance {
  id: number;
  name: string;
  brand: string;
  imageUrl: string | null;
  ratingValue: number | null;
}

const REQUIRED_ADDS = 4;

export function OnboardingAddCollection({ onDone }: { onDone: () => void }) {
  const [popular, setPopular] = useState<PopularFragrance[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [statusPicker, setStatusPicker] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPopular = useCallback(async () => {
    try {
      const res = await fetch("/api/fragrances/popular");
      if (res.ok) setPopular(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  const addToCollection = async (fragranceId: number, status: string) => {
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fragranceId, status }),
    });
    setAdded((prev) => new Set(prev).add(fragranceId));
    setStatusPicker(null);
  };

  const handleSearchSelect = (fragrance: FragranceResult) => {
    setStatusPicker(fragrance.id);
  };

  const progress = Math.min(added.size / REQUIRED_ADDS, 1);
  const showDone = added.size >= REQUIRED_ADDS;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-brown">
      {/* Progress bar */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-amber to-[#d4b87a] transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-12">
        {/* Header */}
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-[28px] font-medium text-brown">
            Add Your Fragrances
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-[0.125em] text-brown-light">
            {added.size} of {REQUIRED_ADDS}
          </span>
        </div>
        <p className="mb-6 text-[14px] text-brown-mid">
          Tap a fragrance to add it, or search for something specific.
        </p>

        {/* Search bar */}
        <div className="mb-8 max-w-[480px]">
          <SearchBar onSelect={handleSearchSelect} />
        </div>

        {/* Popular grid */}
        <div className="grid grid-cols-4 gap-4">
          {popular.map((frag) => (
            <div key={frag.id} className="relative">
              <button
                onClick={() =>
                  added.has(frag.id) ? null : setStatusPicker(frag.id)
                }
                className={`group flex w-full flex-col items-center rounded-lg border p-4 text-center transition-all ${
                  added.has(frag.id)
                    ? "border-sage/30 bg-sage/5"
                    : "border-cream-200 bg-white hover:border-brown-light hover:shadow-md"
                }`}
              >
                {added.has(frag.id) && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[11px] text-white">
                    &#10003;
                  </div>
                )}
                {frag.imageUrl ? (
                  <img
                    src={frag.imageUrl}
                    alt=""
                    className="mb-3 h-[80px] w-auto object-contain"
                  />
                ) : (
                  <div className="mb-3 h-[80px] w-[56px] rounded bg-cream-200" />
                )}
                <p className="text-[12px] font-medium text-brown leading-tight">
                  {frag.name}
                </p>
                <p className="text-[10px] text-brown-light">{frag.brand}</p>
              </button>

              {/* Status picker popover */}
              {statusPicker === frag.id && (
                <div className="absolute left-1/2 top-full z-10 mt-1 flex -translate-x-1/2 gap-1 rounded-lg border border-cream-200 bg-white p-2 shadow-lg">
                  {["own", "tried", "want"].map((status) => (
                    <button
                      key={status}
                      onClick={() => addToCollection(frag.id, status)}
                      className="rounded px-3 py-1.5 text-[11px] font-medium capitalize text-brown transition-colors hover:bg-cream-100"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Done button */}
        {showDone && (
          <div className="mt-8 text-center">
            <button
              onClick={onDone}
              className="rounded-lg bg-brown px-8 py-3 text-[13px] font-medium tracking-[0.05em] text-cream-50 transition-colors hover:bg-[#2a2218]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/components/onboarding/add-collection.tsx
git commit -m "feat: add onboarding collection component with popular grid

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Sign-in Prompt Component

**Files:**
- Create: `web/src/components/onboarding/sign-in-prompt.tsx`

- [ ] **Step 1: Create the sign-in prompt component**

Create `web/src/components/onboarding/sign-in-prompt.tsx`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";

export function SignInPrompt({
  ratedCount,
  addedCount,
  onSkip,
}: {
  ratedCount: number;
  addedCount: number;
  onSkip: () => void;
}) {
  const supabase = createClient();

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const summary =
    ratedCount > 0 && addedCount > 0
      ? `You rated ${ratedCount} notes and added ${addedCount} fragrances`
      : ratedCount > 0
        ? `You rated ${ratedCount} notes`
        : `You added ${addedCount} fragrances`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brown text-cream-50">
      <p className="mb-2 font-[family-name:var(--font-heading)] text-[28px] font-medium">
        Your taste profile is ready
      </p>
      <p className="mb-10 text-[14px] text-brown-light">{summary}</p>

      <button
        onClick={handleSignIn}
        className="flex items-center gap-3 rounded-lg bg-white px-6 py-3.5 text-[14px] font-medium text-brown transition-colors hover:bg-cream-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      <button
        onClick={onSkip}
        className="mt-6 text-[12px] text-brown-light underline underline-offset-4 transition-colors hover:text-cream-50"
      >
        Continue without signing in
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/components/onboarding/sign-in-prompt.tsx
git commit -m "feat: add onboarding sign-in prompt component

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Wire Onboarding Into Homepage

**Files:**
- Modify: `web/src/app/page.tsx`

This is the integration task. Add an onboarding state machine to page.tsx that conditionally renders onboarding screens or the normal homepage.

- [ ] **Step 1: Add onboarding state and detection to page.tsx**

At the top of `web/src/app/page.tsx`, add these imports after the existing ones:

```typescript
import { Welcome, type OnboardingPath } from "@/components/onboarding/welcome";
import { OnboardingRateNotes } from "@/components/onboarding/rate-notes";
import { OnboardingAddCollection } from "@/components/onboarding/add-collection";
import { SignInPrompt } from "@/components/onboarding/sign-in-prompt";
```

Inside the `Home` component, add this state before the existing state declarations:

```typescript
const [onboardingStep, setOnboardingStep] = useState<
  "loading" | "welcome" | "rate-notes" | "add-collection" | "sign-in" | "done"
>("loading");
const [onboardingStats, setOnboardingStats] = useState({ rated: 0, added: 0 });
```

- [ ] **Step 2: Update fetchData to detect onboarding state**

In the existing `fetchData` callback, after the data is loaded and stats are set, add onboarding detection at the end (before the `catch`):

```typescript
// Detect if user needs onboarding
const hasOnboarded = document.cookie.includes("scentmatch_onboarded=1");
if (!hasOnboarded && collection.length === 0 && prefs.length === 0) {
  setOnboardingStep("welcome");
} else {
  setOnboardingStep("done");
}
```

Also update the catch block to set onboarding to done on error:

```typescript
catch {
  setBottlesReady(true);
  setOnboardingStep("done");
}
```

- [ ] **Step 3: Add onboarding completion handler**

After `handleAddToCollection`, add:

```typescript
const handleOnboardingComplete = async () => {
  document.cookie = "scentmatch_onboarded=1;max-age=31536000;path=/";
  setOnboardingStep("done");
  // Refresh data and auto-score a popular fragrance
  await fetchData();
  try {
    const popRes = await fetch("/api/fragrances/popular");
    if (popRes.ok) {
      const popular = await popRes.json();
      if (popular.length > 0) {
        setLoading(true);
        const matchRes = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fragranceId: popular[0].id }),
        });
        if (matchRes.ok) {
          setMatchResult(await matchRes.json());
        }
        setLoading(false);
      }
    }
  } catch {
    // Auto-score failed, that's fine
  }
};
```

- [ ] **Step 4: Add onboarding renders before the homepage return**

At the beginning of the `return` in `Home`, before the existing `<div className="pt-[54px]">`, add:

```tsx
if (onboardingStep === "loading") {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brown">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-brown-light" />
    </div>
  );
}

if (onboardingStep === "welcome") {
  return (
    <Welcome
      onSelectPath={(path: OnboardingPath) => setOnboardingStep(path)}
    />
  );
}

if (onboardingStep === "rate-notes") {
  return (
    <OnboardingRateNotes
      onDone={() => {
        setOnboardingStats((s) => ({ ...s, rated: 7 }));
        setOnboardingStep("sign-in");
      }}
    />
  );
}

if (onboardingStep === "add-collection") {
  return (
    <OnboardingAddCollection
      onDone={() => {
        setOnboardingStats((s) => ({ ...s, added: 4 }));
        setOnboardingStep("sign-in");
      }}
    />
  );
}

if (onboardingStep === "sign-in") {
  return (
    <SignInPrompt
      ratedCount={onboardingStats.rated}
      addedCount={onboardingStats.added}
      onSkip={handleOnboardingComplete}
    />
  );
}
```

The existing homepage JSX stays unchanged after these early returns.

- [ ] **Step 5: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/app/page.tsx
git commit -m "feat: wire onboarding flow into homepage with state machine

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: End-to-End Verification

- [ ] **Step 1: Test onboarding flow locally**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npx next dev
```

Open `http://localhost:3000` in an incognito window (no cookies, no user data).

1. Should see the Welcome screen (dark, two cards)
2. Click "Rate Notes" -> should see note swiper with progress counter
3. Rate 7 notes -> "Done" button should appear
4. Click Done -> should see sign-in prompt with summary
5. Click "Continue without signing in" -> should land on homepage with stats and an auto-scored fragrance

- [ ] **Step 2: Test the Add Collection path**

Clear cookies and reload.

1. Click "Add Collection" -> should see popular fragrance grid + search bar
2. Tap a fragrance -> status picker (own/tried/want) appears
3. Add 4 fragrances -> "Done" button appears
4. Complete flow -> homepage with collection data

- [ ] **Step 3: Verify returning users skip onboarding**

Reload the page (same browser, cookie set). Should go straight to homepage, no onboarding.

- [ ] **Step 4: Push and deploy**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git push origin master
cd web && vercel --prod --yes
```
