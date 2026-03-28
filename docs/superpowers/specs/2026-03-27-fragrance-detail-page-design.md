# Fragrance Detail Page Design

## Overview

A dedicated per-fragrance detail page at `/fragrance/[id]` that puts the user's personalized match score and decision tools front and center, with discovery content (scent journey, recommendations) below.

## Route & Navigation

- Route: `/fragrance/[id]` (dynamic Next.js route)
- Reachable from: search results, collection cards, recommendation cards, match results on homepage
- Page title: `{name} by {brand} | ScentMatch`
- All fragrance names/cards across the app become links to this page

## Hero Section (Above the Fold)

Two-column grid layout: left sidebar (200px fixed) + right content area.

### Left Sidebar (white background)

- Bottle image (large, mix-blend-mode: multiply)
- Brand subtitle (10px uppercase tracking) + year + gender
- Fragrance name (serif, 24px)
- Community star rating with count (e.g. "3.9 -- 12,847 ratings")
- Longevity progress bar with label (e.g. "7-10 hrs")
- Sillage progress bar with label (e.g. "Moderate")
- Main accords as horizontal bars (parsed from mainAccords JSON field)

### Right Content Area (cream background)

- Match score circle (72px, amber border, serif number) + quality label ("Good Match") + confidence level + basis ("based on 7 rated notes")
- AI explanation block (cream background, amber left border, 12px text)
- Note breakdown as colored tags:
  - Green (#6b8060) = love
  - Amber (#c4973e) = like
  - Cream (#e2d8c8) = neutral
  - Rose (#b8605a) = avoid
  - Legend row below tags
- "From Your Collection" section: cards showing similar fragrances from user's collection with similarity percentage and shared notes list
- "Add to Collection" button (brown, full-width at bottom)
  - If already in collection: show current status (own/tried/want) with option to change

### Data Loading Strategy

- Fragrance data fetched server-side or on mount from `/api/fragrances/[id]` -- renders left sidebar immediately
- Match score fetched client-side from `/api/match` after page load -- right side shows skeleton/spinner while processing
- Collection status checked via `/api/collection` to show correct button state

## Below the Fold

### Section 1: The Scent Journey

Visual timeline showing how the fragrance unfolds over time, using the `layer` field from FragranceNote data.

Three columns connected by a gradient line (amber -> sage -> brown):

- **First Spray** (0-30 min): Top notes, amber circle icon
- **Heart** (30 min - 3 hrs): Middle notes, sage circle icon
- **Dry Down** (3 hrs+): Base notes, brown circle icon

Each column shows note names as pill-shaped tags. Section header: "The Scent Journey" / "How {name} unfolds".

### Section 2: You Might Also Love

Personalized recommendations -- fragrances from the DB that share notes with this one, scored against the user's taste profile.

- 4-column grid of recommendation cards
- Each card shows: bottle image, match score badge (top-right corner, dark circle with amber number), fragrance name, brand + year, note tags colored by user preference
- Cards link to their own `/fragrance/[id]` detail page
- Section header: "Based on Your Taste" / "You might also love"

### Recommendation Engine

New API endpoint: `/api/fragrances/[id]/similar`

Query strategy:
1. Find fragrances that share the most notes with the target fragrance
2. Exclude fragrances already in user's collection
3. Return top 8 (display 4, could paginate later)
4. Each result includes a lightweight match score from the user's note preferences (not the full matching engine -- just count loved/liked/disliked notes)

## New Files Required

- `src/app/fragrance/[id]/page.tsx` -- the detail page
- `src/app/api/fragrances/[id]/similar/route.ts` -- similar fragrances endpoint
- `src/components/scent-journey.tsx` -- the timeline visualization
- `src/components/recommendation-card.tsx` -- the recommendation card

## Components to Modify

- `src/components/search-bar.tsx` -- search results should link to detail page (or keep current select behavior + add a "view details" affordance)
- `src/components/fragrance-card.tsx` -- collection cards should link to detail page
- `src/components/match-result.tsx` -- match result on homepage should link to detail page

## Longevity/Sillage Data

The `longevity` and `sillage` fields are empty/null for all fragrances in the current DB. These bars should only render when data exists -- omit them entirely for now. The left sidebar will show: image, brand/year/gender, name, community rating, and accords. Longevity/sillage can be added later when the data is populated.

## Edge Cases

- **No match data yet** (new user, no preferences): Show the left sidebar fully, right side shows "Rate some notes to get your match score" with link to /profile
- **Fragrance not found**: 404 page
- **No similar fragrances**: Hide the recommendation section
- **No notes by layer**: Show all notes in a flat list instead of the timeline
- **Already in collection**: "Add to Collection" button changes to show current status with dropdown to change
