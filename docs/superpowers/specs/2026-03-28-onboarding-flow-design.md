# ScentMatch Onboarding Flow Design

## Goal

First-time users land on a welcome screen that guides them to provide enough data (7 notes rated OR 4 fragrances added) for meaningful match scores, then optionally sign in, then land on the homepage with real data and an auto-scored popular fragrance.

## Flow

```
First visit -> Welcome screen (two paths)
  -> Path A: Rate 7+ notes (existing swiper UI, dark theme)
  -> Path B: Popular grid + search bar, add 4+ fragrances
-> Sign-in prompt ("Save your progress")
-> Homepage with real data + auto-scored popular fragrance result
```

## State Detection

Show onboarding when ALL of these are true:
- User has 0 note preferences
- User has 0 collection items
- Cookie `scentmatch_onboarded` is not set

Once either path is completed (or user signs in), set `scentmatch_onboarded=1` cookie and never show onboarding again.

---

## Screen 1: Welcome

**Route:** `/` (conditional render in `page.tsx`, not a separate route)

**Layout:** Full-screen, dark background (#1e1812), centered content.

**Content:**
- "ScentMatch" brand text at top
- Two path cards side by side:
  - **"Rate Notes"** — icon (heart), subtitle "Tell us which scent families you love"
  - **"Add Collection"** — icon (plus), subtitle "Search fragrances you own or have tried"
- No skip link
- No tagline or "Let's find your signature scent" text
- Just the brand and two cards

**Behavior:** Clicking a card navigates to the corresponding path (rendered inline, not a route change).

---

## Screen 2A: Rate Notes Path

**Layout:** Full-screen dark background, reuses the note swiper interaction pattern from `/profile`.

**Content:**
- Progress counter at top: "3 of 7"
- Progress bar (thin, gold, spans full width)
- Current note card: note name (large, Playfair Display), category below
- Four action buttons: Love (+), Like (~), Meh (-), Skip (x)
- "Done" button appears after 7 notes are rated (not counting skips)
- Notes sourced from `/api/notes` (popular notes, same as profile page)

**Behavior:**
- Each rating calls `POST /api/preferences` (same as existing profile page)
- After rating, animate to next note
- After 7 rated, show "Done" button prominently
- User can keep rating beyond 7 if they want
- Clicking "Done" advances to sign-in prompt

---

## Screen 2B: Add Collection Path

**Layout:** Full-screen, cream/light background.

**Content:**
- Progress counter at top: "2 of 4"
- Search bar at top (reuse existing `SearchBar` component)
- Below search: grid of ~20 popular fragrances
  - Each shows: fragrance image, name, brand
  - Arranged in a responsive grid (4 columns on desktop)
  - Sourced from a new API endpoint or inline data (top-rated fragrances with images)
- Tapping a fragrance shows a quick status picker: own / tried / want
- Selected fragrances get a checkmark overlay
- "Done" button appears after 4 fragrances added

**Behavior:**
- Search works the same as homepage (calls `/api/fragrances?q=...`)
- Adding a fragrance calls `POST /api/collection` with selected status
- After 4 added, show "Done" button
- User can keep adding beyond 4
- Clicking "Done" advances to sign-in prompt

**Popular fragrances source:** Query fragrances with highest `rating_count` that have images. Top 20. Can be fetched from a new endpoint `GET /api/fragrances/popular`.

---

## Screen 3: Sign-in Prompt

**Layout:** Full-screen, dark background.

**Content:**
- "Your taste profile is ready"
- Summary: "You rated X notes" or "You added X fragrances"
- Google sign-in button (Supabase OAuth)
- Below: "Continue without signing in" link (smaller, subdued)

**Behavior:**
- Sign-in triggers Supabase OAuth flow
- "Continue without signing in" sets `scentmatch_onboarded=1` cookie and proceeds
- Either path leads to the homepage landing

---

## Screen 4: Homepage Landing

**Layout:** Normal homepage, but with two differences for post-onboarding:

1. **Stats are populated** — real numbers from their just-completed onboarding
2. **Auto-scored match result** — automatically score a popular fragrance (e.g., highest-rated fragrance in DB with an image) and show the match result below the stats bar

**Behavior:**
- On first load after onboarding, call `POST /api/match` with a popular fragrance ID
- Display the match result as if the user had searched for it
- This shows immediate payoff: "You rated notes, and here's what that means for Sauvage"

---

## Components

### New Components
- `web/src/components/onboarding/welcome.tsx` — the two-card welcome screen
- `web/src/components/onboarding/rate-notes.tsx` — note rating flow with progress
- `web/src/components/onboarding/add-collection.tsx` — popular grid + search + status picker
- `web/src/components/onboarding/sign-in-prompt.tsx` — sign-in or continue screen

### Modified Components
- `web/src/app/page.tsx` — conditional render: onboarding vs homepage based on state detection

### New API Endpoint
- `GET /api/fragrances/popular` — returns top 20 fragrances by rating_count with images

---

## Design Language

- Welcome + Rate Notes + Sign-in: dark background (#1e1812), cream text, gold accents (#c4a265)
- Add Collection: cream background (#faf8f5), matching existing app aesthetic
- Typography: Playfair Display for headings, Inter/system for body
- Transitions: smooth crossfade between screens (no page navigation)
- All screens are client-side state transitions within `page.tsx`, not separate routes
