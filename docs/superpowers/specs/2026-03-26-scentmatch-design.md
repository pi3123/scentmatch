# ScentMatch — Fragrance Blind-Buy Confidence App

**Date:** 2026-03-26
**Status:** Frozen (MVP)

## Overview

ScentMatch is a web application that helps fragrance enthusiasts make confident blind-buy decisions. Users build a collection of fragrances they own or have tried, and the app learns their taste profile from that collection. When they find a new fragrance (from TikTok, forums, etc.), they search for it in ScentMatch and get a match score, a detailed breakdown of why it matches (or doesn't), comparisons to fragrances they already own, and a natural-language explanation — all before spending money.

**Target audience:** Fragrance enthusiasts and collectors who discover fragrances online and want confidence before blind-buying.

**Product scope:** Multi-user product with authentication, not a personal tool.

## Architecture

**Approach:** Next.js + Python Microservice (Option C)

```
Browser
  ↓ HTTPS
Next.js App (Vercel)
  ├── Pages/UI (React components)
  ├── API Routes (orchestration, user CRUD, collection CRUD)
  └── Auth (NextAuth.js, OAuth providers)
       ↓ Internal API        ↓ SQL           ↓ API Call
  Python Service         PostgreSQL       LLM (adapter layer)
  (matching engine)      (all data)       (explanations)
```

### Why this split

- **Next.js** handles the product layer: UI, auth, user data, API orchestration. Fast to build, SSR for SEO, deploy to Vercel.
- **Python microservice** handles the matching engine: note vectors, accord similarity, co-occurrence analysis. Python is the right tool for numerical/data-science work.
- **PostgreSQL** stores users, collections, the Fragrantica dataset, and note taxonomy.
- **LLM via adapter layer** generates casual natural-language explanations. A thin `LLMAdapter` interface abstracts provider differences — each provider (Claude, GPT, etc.) gets its own implementation with provider-specific prompt formatting, error handling, and response parsing. Configured via environment variables (provider name, base URL, API key, model ID). Not a naive "swap the base URL" — providers differ in API shape, token limits, and behavior.

### Request flow

1. User searches a fragrance name
2. Next.js API route receives the request
3. Fetches fragrance data from PostgreSQL (notes, accords, community stats)
4. Sends user's collection + target fragrance to Python service
5. Python computes: match score, note breakdown, accord similarity, note co-occurrence patterns, closest collection matches
6. Next.js sends structured matching results to the LLM for natural-language explanation
7. Returns combined result to user: score + breakdown + comparisons + LLM explanation

## Data Model

### From Fragrantica Dataset

**fragrances**
- id, name, brand, year, gender (men/women/unisex)
- rating_value, rating_count
- main_accords (jsonb — e.g. `{"woody": 0.8, "spicy": 0.6}`)
- longevity_votes (jsonb), sillage_votes (jsonb)
- image_url

**notes**
- id, name, category (woody, floral, citrus, etc.)

**fragrance_notes**
- fragrance_id (FK), note_id (FK), layer (top/middle/base)

### User Data

**users**
- id, email, name, preferred_tone (casual/expert/practical, default: casual)
- created_at

**user_collection**
- user_id (FK), fragrance_id (FK)
- status: own | tried | want
- rating (1-5, nullable)
- added_at

**note_preferences**
- user_id (FK), note_id (FK)
- preference: love | like | neutral | dislike
- source: inferred | explicit

**Uniqueness:** (user_id, fragrance_id) is unique on user_collection. Adding a fragrance that already exists updates the existing row (status/rating). (user_id, note_id) is unique on note_preferences — explicit preferences overwrite inferred ones.

Built two ways:
- **Inferred:** Automatically derived from collection items. **`want` items are always excluded** — they represent aspiration, not experience. Inference rules by status and rating:

  | Status | Rating | Inference |
  |--------|--------|-----------|
  | `own` | null (no rating) | **Positive** — ownership implies you like it enough to keep it |
  | `own` | 4-5 | **Strong positive** — loved notes get `love` |
  | `own` | 3 | **Mild positive** — notes get `like` |
  | `own` | 1-2 | **No inference** — you own it but dislike it; notes are ambiguous (you may dislike the combo, not the individual notes) |
  | `tried` | null | **No inference** — tried without rating is ambiguous |
  | `tried` | 4-5 | **Strong positive** |
  | `tried` | 3 | **Mild positive** |
  | `tried` | 1-2 | **Negative** — notes get `dislike` signal (weighted lower than explicit) |
  | `want` | any | **Excluded** |

- **Explicit:** Swipe-style refinement — user says love/like/neutral/dislike for individual notes. Explicit always overrides inferred.

## Matching Engine (Python Service)

Three-layer scoring system:

### Layer 1: Accord Similarity
Compare the target fragrance's accord profile against the user's aggregate accord profile (built from their collection). High-level "vibe" matching — woody, oriental, fresh, etc.

### Layer 2: Note Co-occurrence Patterns
Learn which note *combinations* the user gravitates toward — not just individual notes, but how notes work together. Oud + amber + sandalwood is a different signal than oud + citrus + aquatic. Score the target fragrance's note groupings against the user's preferred combinations.

**Note:** This layer requires sufficient history to be statistically meaningful. See Cold-Start Handling below.

### Layer 3: Individual Note Preferences
Score each note in the target fragrance against the user's note_preferences (love/like/neutral/dislike). Flag any disliked notes as risks.

### Cold-Start Handling

The matching engine must degrade gracefully for thin profiles:

Confidence is based on **total profile strength**, not collection count alone. Profile strength is a composite of two signals:

- **Collection signal:** number of fragrances with status `own` or `tried` (experienced scents only)
- **Explicit signal:** number of explicit note preferences (from swipes)

### Layer Gating

Each layer has an independent prerequisite. A layer only activates when its prerequisite is met, regardless of overall confidence level.

| Layer | Prerequisite | Rationale |
|-------|-------------|-----------|
| Layer 1 (Accord Similarity) | >= 1 experienced fragrance (own/tried) | Needs at least one fragrance to build an accord profile against |
| Layer 2 (Note Co-occurrence) | >= 5 experienced fragrances | Needs enough history for note combination patterns to be meaningful |
| Layer 3 (Individual Note Prefs) | >= 1 inferred or explicit note preference | Needs at least one data point to score against |

### Confidence Levels

Confidence reflects how many layers are active and how much data backs them:

| Confidence | Condition | UI |
|-----------|-----------|-----|
| None | No layer prerequisites met | No score. Show community stats only. Prompt to add fragrances or swipe. |
| Low | 1-2 layers active | Badge: "Early estimate — add more for better accuracy." |
| Medium | All 3 layers active | Badge: "Getting to know your taste." |
| High | All 3 layers active AND >= 10 experienced fragrances | No badge. |

High confidence requires 10+ experienced fragrances because that's the point where all three layers have enough data to produce stable, reliable scores. Below that, co-occurrence patterns shift significantly with each new addition.

The matching engine response payload (named `MatchResult` in code) always includes both `match_score` (integer 0-100) and `confidence` (`low | medium | high`) as sibling fields. The UI displays confidence alongside the score. The LLM explanation also reflects confidence — e.g., "I don't know your taste super well yet, but based on what I can see..."

### Output Structure

The matching engine returns structured JSON:

```json
{
  "match_score": 91,
  "confidence": "high",
  "accord_similarity": 0.87,
  "note_breakdown": {
    "loved": ["oud", "sandalwood", "amber"],
    "liked": ["tonka bean"],
    "neutral": ["cardamom", "rosewood", "vetiver"],
    "disliked": []
  },
  "co_occurrence_score": 0.82,
  "collection_comparisons": [
    {
      "fragrance": "Dior Sauvage Elixir",
      "similarity": 0.87,
      "shared_notes": ["oud", "amber"],
      "differences": "Oud Wood leans more woody, less spicy"
    }
  ],
  "risk_factors": [],
  "community_stats": {
    "rating": 4.2,
    "longevity": "long-lasting",
    "sillage": "moderate"
  }
}
```

### LLM Explanation

The structured matching result is sent to the LLM with a prompt that asks for a casual, jargon-free explanation. Default tone is casual and approachable — "like a knowledgeable friend." Users can switch tone in settings.

Example output: *"This one's right up your alley. Think of it like your Sauvage Elixir's more refined older brother — same love for oud and amber, but way more smooth and woody. Nothing in here that you've disliked before. Pretty safe blind buy for you."*

## UI Design Direction

**Aesthetic: Warm & Luxe**
- Warm tones, cream/beige backgrounds
- Serif fonts (display headings), refined sans-serif (body)
- Feels like a high-end fragrance boutique — sophisticated and inviting
- Earthy greens for positive signals, warm browns for neutral
- Will use the frontend-design skill during implementation for distinctive, non-generic execution

## Pages (MVP)

### 1. Search & Score (Home)
- Search bar prominently displayed
- Type a fragrance name, autocomplete from the dataset
- Results show: match score, note breakdown, LLM explanation, closest collection matches
- Can add the searched fragrance to collection from results

### 2. My Collection
- Grid view of fragrance cards
- Each card: image, name, brand, status badge (own/tried/want), optional rating
- Add fragrances via search
- Filter by status

### 3. My Taste Profile
- Auto-generated from collection
- Visual breakdown: top notes, favorite accords, preferred note combinations
- Swipe-style refinement: show individual notes, user marks love/like/neutral/dislike
- Updates matching engine in real-time

### 4. Auth & Onboarding
- OAuth only (Google) via NextAuth.js — no email/password for MVP (avoids credentials storage, password reset flows, and security surface area)
- Simple onboarding: "Add a few fragrances you own to get started"
- Search and add fragrances to seed the profile, plus optional note swipes to strengthen thin profiles
- Onboarding details to be refined later

### 5. Fragrance Detail Page (nice-to-have)
- Full page view of a fragrance
- All notes (top/middle/base), accords, community ratings
- Longevity/sillage stats from dataset
- User's match score prominently displayed
- Add to collection button

## Out of Scope (MVP)

- Social features (share collections, follow users)
- Price comparison / where to buy links
- User-written reviews
- Mobile app
- Collaborative filtering (may layer on later)
- Fragrance recommendations ("what should I buy next")

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React), TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js (OAuth) |
| Backend API | Next.js API Routes |
| Matching Engine | Python (FastAPI), numpy |
| Database | PostgreSQL |
| ORM | Prisma (Next.js side) |
| LLM | Adapter layer (Claude/GPT/local, per-provider impl) |
| Deployment | Vercel (Next.js) + Railway/Fly.io (Python) |

## Dataset Provenance & Licensing

**Source:** Fragrantica Complete Perfume Dataset (Kaggle, user: jerry1000)

**Licensing risk:** This is a scraped dataset. Fragrantica's terms of service may restrict commercial use of their data. For MVP/prototype this is acceptable, but before any public launch:
- Review Fragrantica's ToS for data usage restrictions
- Consider building an original dataset or partnering with a data provider
- Evaluate whether the app's use constitutes fair use or requires licensing

**Refresh cadence:** The dataset is a static snapshot. New fragrances released after the dataset was created will be missing. For MVP, this is acceptable. Post-MVP options:
- Periodic re-import if the dataset is updated
- Manual addition of popular new releases
- Build a scraping pipeline (with legal review)

**Data integrity:** Import the dataset once into PostgreSQL via a migration script. Validate column completeness and handle missing fields (some fragrances may lack notes, accords, or images).

## Design Principles

- **Modular:** Each piece (UI, API, matching engine, LLM) has clear boundaries and can be changed independently
- **Explainable:** The user always understands *why* a score is what it is — no black boxes
- **Note synergies matter:** Matching considers how notes work together (accords, co-occurrence), not just individual ingredients
- **Casual by default:** Language is approachable. No fragrance jargon without explanation.
- **YAGNI:** Ship the MVP, add features based on real user feedback
