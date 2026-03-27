# ScentMatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fragrance blind-buy confidence web app that scores how likely a user is to enjoy a fragrance based on their collection and taste profile.

**Architecture:** Next.js frontend + API orchestration layer, Python FastAPI microservice for the matching engine, PostgreSQL for all data, LLM adapter for natural-language explanations. Two deployable services communicating via internal HTTP API.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, NextAuth.js, Prisma, Python 3.12, FastAPI, numpy, PostgreSQL 16

**Spec:** `docs/superpowers/specs/2026-03-26-scentmatch-design.md`

---

## File Structure

### Next.js App (`/web`)

```
web/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # Dataset import script
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout, fonts, global styles
│   │   ├── page.tsx               # Home — search & score
│   │   ├── globals.css            # Tailwind + custom theme
│   │   ├── collection/
│   │   │   └── page.tsx           # My Collection page
│   │   ├── profile/
│   │   │   └── page.tsx           # My Taste Profile page
│   │   ├── fragrance/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Fragrance detail page
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # NextAuth handler
│   │       ├── fragrances/
│   │       │   ├── route.ts       # Search fragrances
│   │       │   └── [id]/
│   │       │       └── route.ts   # Get fragrance by ID
│   │       ├── collection/
│   │       │   └── route.ts       # CRUD user collection
│   │       ├── match/
│   │       │   └── route.ts       # Orchestrates: Python service + LLM
│   │       └── preferences/
│   │           └── route.ts       # CRUD note preferences (swipes)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config
│   │   ├── matching-client.ts     # HTTP client for Python service
│   │   └── llm/
│   │       ├── adapter.ts         # LLMAdapter interface + factory
│   │       ├── openai-provider.ts # OpenAI-compatible provider (works with GPT, local models)
│   │       └── prompt.ts          # Prompt templates
│   ├── components/
│   │   ├── search-bar.tsx         # Fragrance search with autocomplete
│   │   ├── match-result.tsx       # Score + breakdown + explanation card
│   │   ├── confidence-badge.tsx   # Low/medium/high confidence indicator
│   │   ├── note-tag.tsx           # Colored note pill (loved/liked/neutral/disliked)
│   │   ├── fragrance-card.tsx     # Collection grid card
│   │   ├── collection-grid.tsx    # Grid of fragrance cards with filters
│   │   ├── taste-profile.tsx      # Taste profile visualization
│   │   ├── note-swiper.tsx        # Swipe-style note preference UI
│   │   ├── nav.tsx                # Top navigation bar
│   │   └── auth-button.tsx        # Sign in/out button
│   └── types/
│       └── index.ts               # Shared TypeScript types
└── tests/
    ├── api/
    │   ├── fragrances.test.ts
    │   ├── collection.test.ts
    │   ├── match.test.ts
    │   └── preferences.test.ts
    └── lib/
        ├── matching-client.test.ts
        └── llm/
            └── adapter.test.ts
```

### Python Matching Service (`/engine`)

```
engine/
├── pyproject.toml
├── requirements.txt
├── .env.example
├── src/
│   ├── main.py                    # FastAPI app entry
│   ├── models.py                  # Pydantic request/response models
│   ├── matching/
│   │   ├── scorer.py              # Top-level scorer (orchestrates layers)
│   │   ├── accord_similarity.py   # Layer 1
│   │   ├── co_occurrence.py       # Layer 2
│   │   ├── note_preferences.py    # Layer 3
│   │   ├── confidence.py          # Layer gating + confidence calculation
│   │   └── collection_compare.py  # "Similar to X in your collection"
│   └── inference/
│       └── preference_builder.py  # Build note_preferences from collection
└── tests/
    ├── test_scorer.py
    ├── test_accord_similarity.py
    ├── test_co_occurrence.py
    ├── test_note_preferences.py
    ├── test_confidence.py
    ├── test_collection_compare.py
    └── test_preference_builder.py
```

---

## Phase 1: Foundation (Database + Project Scaffolding)

### Task 1: Initialize Next.js project

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/tailwind.config.ts`, `web/next.config.ts`, `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/globals.css`, `web/.env.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd E:/Meta_intervew/fragrantica_blind_buy_app
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Verify it runs**

```bash
cd web && npm run dev
```

Expected: App runs on localhost:3000

- [ ] **Step 3: Create .env.example**

Create `web/.env.example`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/scentmatch"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MATCHING_ENGINE_URL="http://localhost:8000"
LLM_PROVIDER="openai"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY=""
LLM_MODEL="gpt-4o-mini"
```

- [ ] **Step 4: Commit**

```bash
git init
echo "node_modules/\n.next/\n.env\n.env.local" > .gitignore
git add -A
git commit -m "feat: scaffold Next.js app with TypeScript and Tailwind"
```

---

### Task 2: Initialize Python matching engine project

**Files:**
- Create: `engine/pyproject.toml`, `engine/requirements.txt`, `engine/src/main.py`, `engine/src/models.py`, `engine/.env.example`

- [ ] **Step 1: Create project structure**

```bash
cd E:/Meta_intervew/fragrantica_blind_buy_app
mkdir -p engine/src/matching engine/src/inference engine/tests
touch engine/src/__init__.py engine/src/matching/__init__.py engine/src/inference/__init__.py
```

- [ ] **Step 2: Create requirements.txt**

Create `engine/requirements.txt`:
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
numpy==2.2.3
pydantic==2.10.5
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.3
```

- [ ] **Step 3: Create pyproject.toml**

Create `engine/pyproject.toml`:
```toml
[project]
name = "scentmatch-engine"
version = "0.1.0"
requires-python = ">=3.12"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

- [ ] **Step 4: Create Pydantic models**

Create `engine/src/models.py`:
```python
from pydantic import BaseModel


class NoteInfo(BaseModel):
    name: str
    category: str
    layer: str  # top, middle, base


class FragranceProfile(BaseModel):
    id: int
    name: str
    brand: str
    notes: list[NoteInfo]
    main_accords: dict[str, float]  # e.g. {"woody": 0.8, "spicy": 0.6}


class CollectionItem(BaseModel):
    fragrance: FragranceProfile
    status: str  # own, tried, want
    rating: int | None = None


class NotePreference(BaseModel):
    note_name: str
    category: str
    preference: str  # love, like, neutral, dislike
    source: str  # inferred, explicit


class MatchRequest(BaseModel):
    target: FragranceProfile
    collection: list[CollectionItem]
    note_preferences: list[NotePreference]
    community_stats: CommunityStats | None = None


class CollectionComparison(BaseModel):
    fragrance_name: str
    fragrance_brand: str
    similarity: float
    shared_notes: list[str]
    differences: str


class NoteBreakdown(BaseModel):
    loved: list[str]
    liked: list[str]
    neutral: list[str]
    disliked: list[str]


class CommunityStats(BaseModel):
    rating: float | None = None
    longevity: str | None = None
    sillage: str | None = None


class MatchResult(BaseModel):
    match_score: int  # 0-100
    confidence: str  # none, low, medium, high
    accord_similarity: float | None = None
    note_breakdown: NoteBreakdown
    co_occurrence_score: float | None = None
    collection_comparisons: list[CollectionComparison]
    risk_factors: list[str]
    active_layers: list[int]  # which layers were used [1, 2, 3]
    community_stats: CommunityStats | None = None
```

- [ ] **Step 5: Create FastAPI app skeleton**

Create `engine/src/main.py`:
```python
from fastapi import FastAPI
from .models import MatchRequest, MatchResult

app = FastAPI(title="ScentMatch Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest) -> MatchResult:
    # Placeholder — will be implemented in Phase 2
    return MatchResult(
        match_score=0,
        confidence="none",
        note_breakdown={"loved": [], "liked": [], "neutral": [], "disliked": []},
        collection_comparisons=[],
        risk_factors=[],
        active_layers=[],
    )
```

- [ ] **Step 6: Create .env.example**

Create `engine/.env.example`:
```env
HOST=0.0.0.0
PORT=8000
```

- [ ] **Step 7: Install dependencies and verify**

```bash
cd engine
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Expected: FastAPI runs on localhost:8000, `/health` returns `{"status": "ok"}`

- [ ] **Step 8: Commit**

```bash
git add engine/
git commit -m "feat: scaffold Python matching engine with FastAPI"
```

---

### Task 3: Set up Prisma schema and database

**Files:**
- Create: `web/prisma/schema.prisma`

- [ ] **Step 1: Install Prisma**

```bash
cd web
npm install prisma @prisma/client
npx prisma init
```

- [ ] **Step 2: Write the Prisma schema**

Replace `web/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Fragrance {
  id           Int              @id @default(autoincrement())
  name         String
  brand        String
  year         Int?
  gender       String?          // men, women, unisex
  ratingValue  Float?           @map("rating_value")
  ratingCount  Int?             @map("rating_count")
  mainAccords  Json?            @map("main_accords")
  longevity    Json?            @map("longevity_votes")
  sillage      Json?            @map("sillage_votes")
  imageUrl     String?          @map("image_url")
  notes        FragranceNote[]
  collections  UserCollection[]

  @@map("fragrances")
}

model Note {
  id         Int             @id @default(autoincrement())
  name       String          @unique
  category   String?
  fragrances FragranceNote[]
  preferences NotePreference[]

  @@map("notes")
}

model FragranceNote {
  fragranceId Int       @map("fragrance_id")
  noteId      Int       @map("note_id")
  layer       String    // top, middle, base
  fragrance   Fragrance @relation(fields: [fragranceId], references: [id])
  note        Note      @relation(fields: [noteId], references: [id])

  @@id([fragranceId, noteId])
  @@map("fragrance_notes")
}

model User {
  id            String           @id @default(cuid())
  email         String           @unique
  name          String?
  image         String?
  preferredTone String           @default("casual") @map("preferred_tone")
  createdAt     DateTime         @default(now()) @map("created_at")
  accounts      Account[]
  sessions      Session[]
  collection    UserCollection[]
  preferences   NotePreference[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model UserCollection {
  userId      String    @map("user_id")
  fragranceId Int       @map("fragrance_id")
  status      String    // own, tried, want
  rating      Int?      // 1-5
  addedAt     DateTime  @default(now()) @map("added_at")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  fragrance   Fragrance @relation(fields: [fragranceId], references: [id])

  @@id([userId, fragranceId])
  @@map("user_collection")
}

model NotePreference {
  userId     String @map("user_id")
  noteId     Int    @map("note_id")
  preference String // love, like, neutral, dislike
  source     String // inferred, explicit
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  note       Note   @relation(fields: [noteId], references: [id])

  @@id([userId, noteId])
  @@map("note_preferences")
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `web/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Run migration**

```bash
cd web
npx prisma migrate dev --name init
```

Expected: Migration runs successfully, tables created in PostgreSQL

- [ ] **Step 5: Commit**

```bash
git add web/prisma/ web/src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all tables"
```

---

### Task 4: Import Fragrantica dataset

**Files:**
- Create: `web/prisma/seed.ts`

**Prerequisite:** Download the Fragrantica dataset CSV from Kaggle and place it at `data/fragrantica.csv` in the project root.

- [ ] **Step 1: Install seed dependencies**

```bash
cd web
npm install csv-parse
npm install -D tsx
```

- [ ] **Step 2: Write the seed script**

Create `web/prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

async function main() {
  const csvPath = resolve(__dirname, "../../data/fragrantica.csv");
  const raw = readFileSync(csvPath, "utf-8");
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`Found ${records.length} fragrances to import`);

  const noteCache = new Map<string, number>();

  async function getOrCreateNote(
    name: string,
    category?: string
  ): Promise<number> {
    const key = name.toLowerCase().trim();
    if (noteCache.has(key)) return noteCache.get(key)!;

    const note = await prisma.note.upsert({
      where: { name: key },
      update: {},
      create: { name: key, category: category ?? null },
    });
    noteCache.set(key, note.id);
    return note.id;
  }

  let imported = 0;
  let skipped = 0;

  for (const row of records) {
    try {
      const name = row["Name"]?.trim();
      const brand = row["Brand"]?.trim();
      if (!name || !brand) {
        skipped++;
        continue;
      }

      // Parse accords — format varies by dataset version
      let mainAccords: Record<string, number> = {};
      if (row["main_accords"]) {
        try {
          mainAccords = JSON.parse(row["main_accords"].replace(/'/g, '"'));
        } catch {
          // Try parsing as comma-separated
        }
      }

      const fragrance = await prisma.fragrance.create({
        data: {
          name,
          brand,
          year: row["Year"] ? parseInt(row["Year"]) || null : null,
          gender: row["Gender"]?.trim() || null,
          ratingValue: row["Rating"] ? parseFloat(row["Rating"]) || null : null,
          ratingCount: row["Rating_Count"]
            ? parseInt(row["Rating_Count"]) || null
            : null,
          mainAccords: Object.keys(mainAccords).length > 0 ? mainAccords : null,
          imageUrl: row["Image_URL"]?.trim() || null,
        },
      });

      // Parse and link notes by layer
      for (const layer of ["top", "middle", "base"] as const) {
        const columnName =
          layer === "top"
            ? "Top"
            : layer === "middle"
              ? "Middle"
              : "Base";
        const notesStr = row[columnName] || row[`${columnName}_Notes`] || "";
        if (!notesStr.trim()) continue;

        const noteNames = notesStr
          .split(",")
          .map((n: string) => n.trim())
          .filter(Boolean);

        for (const noteName of noteNames) {
          const noteId = await getOrCreateNote(noteName);
          await prisma.fragranceNote.create({
            data: {
              fragranceId: fragrance.id,
              noteId,
              layer,
            },
          });
        }
      }

      imported++;
      if (imported % 500 === 0) {
        console.log(`Imported ${imported} fragrances...`);
      }
    } catch (err) {
      console.error(`Error importing row: ${err}`);
      skipped++;
    }
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`);
  console.log(`Total notes in database: ${noteCache.size}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Note:** The exact CSV column names may differ. The seed script should be adjusted after inspecting the actual dataset headers. Run `head -1 data/fragrantica.csv` to check.

- [ ] **Step 3: Add seed command to package.json**

Add to `web/package.json` under `"prisma"`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Run the seed**

```bash
cd web
npx prisma db seed
```

Expected: Fragrances and notes imported. Log shows count.

- [ ] **Step 5: Verify data**

```bash
cd web
npx prisma studio
```

Check that fragrances, notes, and fragrance_notes tables are populated.

- [ ] **Step 6: Commit**

```bash
git add web/prisma/seed.ts web/package.json
git commit -m "feat: add dataset import seed script"
```

---

## Phase 2: Matching Engine (Python Service)

### Task 5: Implement Layer 3 — Individual Note Preferences

**Files:**
- Create: `engine/src/matching/note_preferences.py`, `engine/tests/test_note_preferences.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_note_preferences.py`:
```python
from src.matching.note_preferences import score_note_preferences
from src.models import FragranceProfile, NoteInfo, NotePreference


def _make_target(note_names: list[str]) -> FragranceProfile:
    return FragranceProfile(
        id=1,
        name="Test",
        brand="Test",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords={},
    )


def test_all_loved_notes_scores_high():
    target = _make_target(["oud", "sandalwood", "amber"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="sandalwood", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="amber", category="woody", preference="love", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert result.score >= 0.9
    assert result.breakdown.loved == ["oud", "sandalwood", "amber"]
    assert result.breakdown.disliked == []


def test_disliked_note_lowers_score():
    target = _make_target(["oud", "rose"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="rose", category="floral", preference="dislike", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert result.score < 0.7
    assert "rose" in result.breakdown.disliked
    assert "rose" in result.risk_factors


def test_unknown_notes_are_neutral():
    target = _make_target(["oud", "cardamom"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
    ]
    result = score_note_preferences(target, prefs)
    assert "cardamom" in result.breakdown.neutral


def test_empty_preferences_returns_all_neutral():
    target = _make_target(["oud", "rose"])
    result = score_note_preferences(target, [])
    assert result.score == 0.5  # neutral baseline
    assert result.breakdown.neutral == ["oud", "rose"]
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_note_preferences.py -v
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement note_preferences scoring**

Create `engine/src/matching/note_preferences.py`:
```python
from dataclasses import dataclass
from ..models import FragranceProfile, NotePreference, NoteBreakdown

PREFERENCE_WEIGHTS = {
    "love": 1.0,
    "like": 0.7,
    "neutral": 0.5,
    "dislike": 0.1,
}


@dataclass
class NotePreferenceResult:
    score: float  # 0.0 - 1.0
    breakdown: NoteBreakdown
    risk_factors: list[str]


def score_note_preferences(
    target: FragranceProfile,
    preferences: list[NotePreference],
) -> NotePreferenceResult:
    pref_map = {p.note_name.lower(): p.preference for p in preferences}

    loved, liked, neutral, disliked = [], [], [], []
    risk_factors = []
    weights = []

    for note in target.notes:
        name = note.name.lower()
        pref = pref_map.get(name, "neutral")

        if pref == "love":
            loved.append(name)
        elif pref == "like":
            liked.append(name)
        elif pref == "dislike":
            disliked.append(name)
            risk_factors.append(name)
        else:
            neutral.append(name)

        weights.append(PREFERENCE_WEIGHTS[pref])

    score = sum(weights) / len(weights) if weights else 0.5

    return NotePreferenceResult(
        score=round(score, 3),
        breakdown=NoteBreakdown(
            loved=loved, liked=liked, neutral=neutral, disliked=disliked
        ),
        risk_factors=risk_factors,
    )
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd engine
python -m pytest tests/test_note_preferences.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/matching/note_preferences.py engine/tests/test_note_preferences.py
git commit -m "feat(engine): implement Layer 3 — individual note preference scoring"
```

---

### Task 6: Implement Layer 1 — Accord Similarity

**Files:**
- Create: `engine/src/matching/accord_similarity.py`, `engine/tests/test_accord_similarity.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_accord_similarity.py`:
```python
from src.matching.accord_similarity import score_accord_similarity
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(accords: dict[str, float], name: str = "Test") -> FragranceProfile:
    return FragranceProfile(id=1, name=name, brand="B", notes=[], main_accords=accords)


def _item(accords: dict[str, float], status: str = "own", rating: int | None = None) -> CollectionItem:
    return CollectionItem(fragrance=_frag(accords), status=status, rating=rating)


def test_identical_accords_score_1():
    target = _frag({"woody": 0.8, "spicy": 0.6})
    collection = [_item({"woody": 0.8, "spicy": 0.6})]
    score = score_accord_similarity(target, collection)
    assert score >= 0.95


def test_completely_different_accords_score_low():
    target = _frag({"aquatic": 0.9, "citrus": 0.8})
    collection = [_item({"leather": 0.9, "oud": 0.8})]
    score = score_accord_similarity(target, collection)
    assert score < 0.3


def test_want_items_excluded():
    target = _frag({"woody": 0.8})
    collection = [
        _item({"woody": 0.8}, status="want"),
        _item({"citrus": 0.9}, status="own"),
    ]
    score = score_accord_similarity(target, collection)
    # Should only compare against the citrus one (own), not the woody (want)
    assert score < 0.5


def test_empty_collection_returns_none():
    target = _frag({"woody": 0.8})
    score = score_accord_similarity(target, [])
    assert score is None
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_accord_similarity.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement accord similarity**

Create `engine/src/matching/accord_similarity.py`:
```python
import numpy as np
from ..models import FragranceProfile, CollectionItem


def _accords_to_vector(accords: dict[str, float], all_keys: list[str]) -> np.ndarray:
    return np.array([accords.get(k, 0.0) for k in all_keys])


def score_accord_similarity(
    target: FragranceProfile,
    collection: list[CollectionItem],
) -> float | None:
    # Filter to experienced fragrances only
    experienced = [
        item for item in collection if item.status in ("own", "tried")
    ]

    if not experienced:
        return None

    # Build unified key set from all fragrances
    all_keys = sorted(
        set(target.main_accords.keys())
        | {k for item in experienced for k in item.fragrance.main_accords.keys()}
    )

    if not all_keys:
        return None

    target_vec = _accords_to_vector(target.main_accords, all_keys)

    # Build aggregate user accord profile (average across collection)
    collection_vecs = [
        _accords_to_vector(item.fragrance.main_accords, all_keys)
        for item in experienced
    ]
    user_profile = np.mean(collection_vecs, axis=0)

    # Cosine similarity
    dot = np.dot(target_vec, user_profile)
    norm_t = np.linalg.norm(target_vec)
    norm_u = np.linalg.norm(user_profile)

    if norm_t == 0 or norm_u == 0:
        return 0.0

    similarity = float(dot / (norm_t * norm_u))
    return round(max(0.0, similarity), 3)
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_accord_similarity.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/matching/accord_similarity.py engine/tests/test_accord_similarity.py
git commit -m "feat(engine): implement Layer 1 — accord similarity scoring"
```

---

### Task 7: Implement Layer 2 — Note Co-occurrence

**Files:**
- Create: `engine/src/matching/co_occurrence.py`, `engine/tests/test_co_occurrence.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_co_occurrence.py`:
```python
from src.matching.co_occurrence import score_co_occurrence
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(note_names: list[str], name: str = "Test") -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="B",
        notes=[NoteInfo(name=n, category="", layer="base") for n in note_names],
        main_accords={},
    )


def _item(note_names: list[str], status: str = "own") -> CollectionItem:
    return CollectionItem(fragrance=_frag(note_names), status=status)


def test_target_shares_common_pairs():
    # User owns fragrances that all have oud+amber together
    collection = [
        _item(["oud", "amber", "vanilla"]),
        _item(["oud", "amber", "sandalwood"]),
        _item(["oud", "amber", "musk"]),
    ]
    target = _frag(["oud", "amber", "cedar"])
    score = score_co_occurrence(target, collection)
    assert score is not None
    assert score >= 0.7


def test_target_has_no_common_pairs():
    collection = [
        _item(["oud", "amber", "vanilla"]),
        _item(["oud", "amber", "sandalwood"]),
    ]
    target = _frag(["citrus", "aquatic", "mint"])
    score = score_co_occurrence(target, collection)
    assert score is not None
    assert score < 0.3


def test_insufficient_collection_returns_none():
    collection = [_item(["oud", "amber"])]  # only 1 fragrance
    target = _frag(["oud", "amber"])
    score = score_co_occurrence(target, collection)
    assert score is None  # needs >= 5


def test_want_items_excluded():
    collection = [_item(["oud", "amber"], status="want")] * 6
    target = _frag(["oud", "amber"])
    score = score_co_occurrence(target, collection)
    assert score is None  # all want, no experienced
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_co_occurrence.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement co-occurrence scoring**

Create `engine/src/matching/co_occurrence.py`:
```python
from collections import Counter
from itertools import combinations
from ..models import FragranceProfile, CollectionItem

MIN_EXPERIENCED_FOR_CO_OCCURRENCE = 5


def score_co_occurrence(
    target: FragranceProfile,
    collection: list[CollectionItem],
) -> float | None:
    experienced = [
        item for item in collection if item.status in ("own", "tried")
    ]

    if len(experienced) < MIN_EXPERIENCED_FOR_CO_OCCURRENCE:
        return None

    # Count note pair frequencies across user's collection
    pair_counts: Counter[tuple[str, str]] = Counter()
    total_fragrances = len(experienced)

    for item in experienced:
        note_names = sorted(set(n.name.lower() for n in item.fragrance.notes))
        for pair in combinations(note_names, 2):
            pair_counts[pair] += 1

    if not pair_counts:
        return 0.0

    # Normalize pair frequencies (0-1 scale)
    pair_freq = {pair: count / total_fragrances for pair, count in pair_counts.items()}

    # Score target's note pairs against user's preferred pairs
    target_notes = sorted(set(n.name.lower() for n in target.notes))
    target_pairs = list(combinations(target_notes, 2))

    if not target_pairs:
        return 0.0

    pair_scores = []
    for pair in target_pairs:
        # Check both orderings
        freq = pair_freq.get(pair, pair_freq.get((pair[1], pair[0]), 0.0))
        pair_scores.append(freq)

    return round(sum(pair_scores) / len(pair_scores), 3) if pair_scores else 0.0
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_co_occurrence.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/matching/co_occurrence.py engine/tests/test_co_occurrence.py
git commit -m "feat(engine): implement Layer 2 — note co-occurrence scoring"
```

---

### Task 8: Implement confidence calculation and layer gating

**Files:**
- Create: `engine/src/matching/confidence.py`, `engine/tests/test_confidence.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_confidence.py`:
```python
from src.matching.confidence import calculate_confidence, get_active_layers
from src.models import CollectionItem, FragranceProfile, NotePreference


def _item(status: str = "own") -> CollectionItem:
    frag = FragranceProfile(id=1, name="T", brand="B", notes=[], main_accords={"woody": 0.5})
    return CollectionItem(fragrance=frag, status=status)


def _pref(source: str = "explicit") -> NotePreference:
    return NotePreference(note_name="oud", category="woody", preference="love", source=source)


def test_no_data_returns_none():
    layers = get_active_layers(experienced_count=0, has_note_prefs=False)
    conf = calculate_confidence(layers, experienced_count=0)
    assert layers == []
    assert conf == "none"


def test_one_fragrance_activates_layer_1_only():
    layers = get_active_layers(experienced_count=1, has_note_prefs=False)
    assert 1 in layers
    assert 2 not in layers
    assert 3 not in layers


def test_one_fragrance_with_prefs_activates_1_and_3():
    layers = get_active_layers(experienced_count=1, has_note_prefs=True)
    assert 1 in layers
    assert 3 in layers
    assert 2 not in layers


def test_five_fragrances_with_prefs_activates_all():
    layers = get_active_layers(experienced_count=5, has_note_prefs=True)
    assert layers == [1, 2, 3]


def test_low_confidence_with_partial_layers():
    layers = [1, 3]  # 2 layers
    conf = calculate_confidence(layers, experienced_count=3)
    assert conf == "low"


def test_medium_confidence_all_layers():
    layers = [1, 2, 3]
    conf = calculate_confidence(layers, experienced_count=7)
    assert conf == "medium"


def test_high_confidence_all_layers_10_plus():
    layers = [1, 2, 3]
    conf = calculate_confidence(layers, experienced_count=10)
    assert conf == "high"


def test_want_items_not_counted_as_experienced():
    # This is a logic test — experienced_count should exclude want
    # The caller is responsible for filtering, but we test the boundary
    layers = get_active_layers(experienced_count=0, has_note_prefs=True)
    assert 1 not in layers  # no experienced fragrances
    assert 3 in layers      # has prefs though
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_confidence.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement confidence module**

Create `engine/src/matching/confidence.py`:
```python
def get_active_layers(experienced_count: int, has_note_prefs: bool) -> list[int]:
    layers = []

    # Layer 1: >= 1 experienced fragrance
    if experienced_count >= 1:
        layers.append(1)

    # Layer 2: >= 5 experienced fragrances
    if experienced_count >= 5:
        layers.append(2)

    # Layer 3: >= 1 note preference (inferred or explicit)
    if has_note_prefs:
        layers.append(3)

    return layers


def calculate_confidence(active_layers: list[int], experienced_count: int) -> str:
    if not active_layers:
        return "none"

    all_active = len(active_layers) == 3

    if all_active and experienced_count >= 10:
        return "high"
    elif all_active:
        return "medium"
    else:
        return "low"
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_confidence.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/matching/confidence.py engine/tests/test_confidence.py
git commit -m "feat(engine): implement layer gating and confidence calculation"
```

---

### Task 9: Implement collection comparison ("similar to X")

**Files:**
- Create: `engine/src/matching/collection_compare.py`, `engine/tests/test_collection_compare.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_collection_compare.py`:
```python
from src.matching.collection_compare import find_collection_comparisons
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(name: str, note_names: list[str], accords: dict[str, float] | None = None) -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="Brand",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords=accords or {},
    )


def test_finds_similar_fragrances():
    target = _frag("Oud Wood", ["oud", "sandalwood", "amber"])
    collection = [
        CollectionItem(fragrance=_frag("Sauvage", ["oud", "amber", "pepper"]), status="own"),
        CollectionItem(fragrance=_frag("Light Blue", ["citrus", "apple", "cedar"]), status="own"),
    ]
    comparisons = find_collection_comparisons(target, collection, max_results=2)
    assert len(comparisons) >= 1
    assert comparisons[0].fragrance_name == "Sauvage"  # more similar
    assert "oud" in comparisons[0].shared_notes


def test_excludes_want_items():
    target = _frag("Oud Wood", ["oud", "sandalwood"])
    collection = [
        CollectionItem(fragrance=_frag("Sauvage", ["oud", "sandalwood"]), status="want"),
    ]
    comparisons = find_collection_comparisons(target, collection)
    assert len(comparisons) == 0


def test_empty_collection():
    target = _frag("Oud Wood", ["oud"])
    comparisons = find_collection_comparisons(target, [])
    assert comparisons == []
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_collection_compare.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement collection comparison**

Create `engine/src/matching/collection_compare.py`:
```python
from ..models import FragranceProfile, CollectionItem, CollectionComparison


def _note_set(frag: FragranceProfile) -> set[str]:
    return {n.name.lower() for n in frag.notes}


def _jaccard_similarity(set_a: set[str], set_b: set[str]) -> float:
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union) if union else 0.0


def find_collection_comparisons(
    target: FragranceProfile,
    collection: list[CollectionItem],
    max_results: int = 3,
) -> list[CollectionComparison]:
    experienced = [item for item in collection if item.status in ("own", "tried")]

    if not experienced:
        return []

    target_notes = _note_set(target)
    scored = []

    for item in experienced:
        item_notes = _note_set(item.fragrance)
        similarity = _jaccard_similarity(target_notes, item_notes)
        shared = sorted(target_notes & item_notes)
        unique_to_target = sorted(target_notes - item_notes)
        unique_to_item = sorted(item_notes - target_notes)

        diff_parts = []
        if unique_to_target:
            diff_parts.append(f"{target.name} adds {', '.join(unique_to_target[:3])}")
        if unique_to_item:
            diff_parts.append(f"without {', '.join(unique_to_item[:3])}")

        scored.append(
            CollectionComparison(
                fragrance_name=item.fragrance.name,
                fragrance_brand=item.fragrance.brand,
                similarity=round(similarity, 3),
                shared_notes=shared,
                differences="; ".join(diff_parts) if diff_parts else "very similar note profiles",
            )
        )

    scored.sort(key=lambda c: c.similarity, reverse=True)
    return scored[:max_results]
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_collection_compare.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/matching/collection_compare.py engine/tests/test_collection_compare.py
git commit -m "feat(engine): implement collection comparison — 'similar to X'"
```

---

### Task 10: Implement preference builder (infer preferences from collection)

**Files:**
- Create: `engine/src/inference/preference_builder.py`, `engine/tests/test_preference_builder.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_preference_builder.py`:
```python
from src.inference.preference_builder import build_inferred_preferences
from src.models import FragranceProfile, NoteInfo, CollectionItem


def _frag(note_names: list[str]) -> FragranceProfile:
    return FragranceProfile(
        id=1, name="T", brand="B",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in note_names],
        main_accords={},
    )


def test_own_no_rating_positive():
    collection = [CollectionItem(fragrance=_frag(["oud", "amber"]), status="own", rating=None)]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    assert pref_map["oud"] == "like"  # positive, not strong positive
    assert pref_map["amber"] == "like"


def test_own_high_rating_strong_positive():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "love"


def test_own_rating_3_mild_positive():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=3)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "like"


def test_own_low_rating_no_inference():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=1)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0  # ambiguous, no inference


def test_tried_no_rating_no_inference():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=None)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0


def test_tried_low_rating_negative():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=1)]
    prefs = build_inferred_preferences(collection)
    assert prefs[0].preference == "dislike"


def test_want_excluded():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="want", rating=None)]
    prefs = build_inferred_preferences(collection)
    assert len(prefs) == 0


def test_multiple_fragrances_aggregates():
    collection = [
        CollectionItem(fragrance=_frag(["oud", "amber"]), status="own", rating=5),
        CollectionItem(fragrance=_frag(["oud", "rose"]), status="own", rating=5),
    ]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    # oud appears in 2 loved fragrances — should be love
    assert pref_map["oud"] == "love"


def test_mixed_signals_weighted_aggregation():
    """A single dislike from tried+low-rating shouldn't override multiple strong positives."""
    collection = [
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5),  # love
        CollectionItem(fragrance=_frag(["oud"]), status="tried", rating=1),  # dislike
    ]
    prefs = build_inferred_preferences(collection)
    pref_map = {p.note_name: p.preference for p in prefs}
    # 4x love (3.0) + 1x dislike (0.0) = avg 2.4 -> "like", NOT "dislike"
    assert pref_map["oud"] == "like"


def test_all_inferred_source():
    collection = [CollectionItem(fragrance=_frag(["oud"]), status="own", rating=5)]
    prefs = build_inferred_preferences(collection)
    assert all(p.source == "inferred" for p in prefs)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_preference_builder.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement preference builder**

Create `engine/src/inference/preference_builder.py`:
```python
from collections import defaultdict
from ..models import CollectionItem, NotePreference


def _get_signal(status: str, rating: int | None) -> str | None:
    """Returns preference signal based on spec inference rules."""
    if status == "want":
        return None

    if status == "own":
        if rating is None:
            return "like"       # positive — kept it
        elif rating >= 4:
            return "love"       # strong positive
        elif rating == 3:
            return "like"       # mild positive
        else:
            return None         # own + low rating = ambiguous

    if status == "tried":
        if rating is None:
            return None         # ambiguous
        elif rating >= 4:
            return "love"
        elif rating == 3:
            return "like"
        else:
            return "dislike"    # negative signal

    return None


# Numeric scores for aggregation. Dislike from tried+low-rating is weighted
# lower than explicit, so we use fractional scores and average them.
SIGNAL_SCORE = {"love": 3.0, "like": 2.0, "neutral": 1.0, "dislike": 0.0}

# Thresholds for mapping average score back to preference
# >= 2.5 -> love, >= 1.5 -> like, >= 0.75 -> neutral, < 0.75 -> dislike
def _score_to_preference(avg: float) -> str:
    if avg >= 2.5:
        return "love"
    elif avg >= 1.5:
        return "like"
    elif avg >= 0.75:
        return "neutral"
    else:
        return "dislike"


def build_inferred_preferences(
    collection: list[CollectionItem],
) -> list[NotePreference]:
    # Gather all signals per note
    note_signals: dict[str, list[str]] = defaultdict(list)
    note_categories: dict[str, str] = {}

    for item in collection:
        signal = _get_signal(item.status, item.rating)
        if signal is None:
            continue

        for note in item.fragrance.notes:
            name = note.name.lower()
            note_signals[name].append(signal)
            if note.category:
                note_categories[name] = note.category

    # Aggregate by averaging signal scores.
    # A single dislike from tried+low-rating won't override multiple strong positives.
    # e.g., 4x love + 1x dislike = avg 2.4 -> "like" (not "dislike")
    result = []
    for note_name, signals in note_signals.items():
        scores = [SIGNAL_SCORE[s] for s in signals]
        avg = sum(scores) / len(scores)
        final = _score_to_preference(avg)

        result.append(
            NotePreference(
                note_name=note_name,
                category=note_categories.get(note_name, ""),
                preference=final,
                source="inferred",
            )
        )

    return result
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_preference_builder.py -v
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add engine/src/inference/preference_builder.py engine/tests/test_preference_builder.py
git commit -m "feat(engine): implement preference builder with spec inference rules"
```

---

### Task 11: Implement top-level scorer (orchestrates all layers)

**Files:**
- Create: `engine/src/matching/scorer.py`, `engine/tests/test_scorer.py`

- [ ] **Step 1: Write failing tests**

Create `engine/tests/test_scorer.py`:
```python
from src.matching.scorer import compute_match
from src.models import FragranceProfile, NoteInfo, CollectionItem, NotePreference


def _frag(name: str, notes: list[str], accords: dict[str, float] | None = None) -> FragranceProfile:
    return FragranceProfile(
        id=1, name=name, brand="Brand",
        notes=[NoteInfo(name=n, category="woody", layer="base") for n in notes],
        main_accords=accords or {"woody": 0.5},
    )


def _item(notes: list[str], accords: dict[str, float] | None = None, status: str = "own", rating: int | None = None) -> CollectionItem:
    return CollectionItem(fragrance=_frag("Owned", notes, accords), status=status, rating=rating)


def test_empty_profile_returns_none_confidence():
    target = _frag("Target", ["oud"])
    result = compute_match(target, [], [])
    assert result.confidence == "none"
    assert result.match_score == 0
    assert result.active_layers == []


def test_single_fragrance_low_confidence():
    target = _frag("Target", ["oud", "amber"], {"woody": 0.8})
    collection = [_item(["oud", "amber"], {"woody": 0.8})]
    prefs = [NotePreference(note_name="oud", category="woody", preference="love", source="inferred")]
    result = compute_match(target, collection, prefs)
    assert result.confidence == "low"
    assert 1 in result.active_layers
    assert 2 not in result.active_layers
    assert result.match_score > 0


def test_full_profile_high_confidence():
    accords = {"woody": 0.8, "amber": 0.6}
    notes = ["oud", "sandalwood", "amber", "vanilla", "musk"]
    collection = [_item(notes, accords) for _ in range(12)]
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="sandalwood", category="woody", preference="love", source="explicit"),
    ]
    target = _frag("Target", ["oud", "sandalwood", "cedar"], accords)
    result = compute_match(target, collection, prefs)
    assert result.confidence == "high"
    assert result.active_layers == [1, 2, 3]
    assert result.match_score > 50


def test_result_includes_comparisons():
    target = _frag("Target", ["oud", "amber"])
    collection = [_item(["oud", "amber"])]
    prefs = [NotePreference(note_name="oud", category="woody", preference="love", source="explicit")]
    result = compute_match(target, collection, prefs)
    assert len(result.collection_comparisons) > 0


def test_result_includes_note_breakdown():
    target = _frag("Target", ["oud", "rose"])
    prefs = [
        NotePreference(note_name="oud", category="woody", preference="love", source="explicit"),
        NotePreference(note_name="rose", category="floral", preference="dislike", source="explicit"),
    ]
    collection = [_item(["oud"])]
    result = compute_match(target, collection, prefs)
    assert "oud" in result.note_breakdown.loved
    assert "rose" in result.note_breakdown.disliked
    assert "rose" in result.risk_factors
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd engine
python -m pytest tests/test_scorer.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement top-level scorer**

Create `engine/src/matching/scorer.py`:
```python
from ..models import (
    CommunityStats,
    FragranceProfile,
    CollectionItem,
    NotePreference,
    MatchResult,
    NoteBreakdown,
)
from .accord_similarity import score_accord_similarity
from .co_occurrence import score_co_occurrence
from .note_preferences import score_note_preferences
from .confidence import get_active_layers, calculate_confidence
from .collection_compare import find_collection_comparisons

# Layer weights for final score
LAYER_WEIGHTS = {1: 0.3, 2: 0.3, 3: 0.4}


def compute_match(
    target: FragranceProfile,
    collection: list[CollectionItem],
    note_prefs: list[NotePreference],
    community_stats: CommunityStats | None = None,
) -> MatchResult:
    experienced = [i for i in collection if i.status in ("own", "tried")]
    experienced_count = len(experienced)
    has_note_prefs = len(note_prefs) > 0

    active_layers = get_active_layers(experienced_count, has_note_prefs)
    confidence = calculate_confidence(active_layers, experienced_count)

    if not active_layers:
        return MatchResult(
            match_score=0,
            confidence="none",
            note_breakdown=NoteBreakdown(loved=[], liked=[], neutral=[], disliked=[]),
            collection_comparisons=[],
            risk_factors=[],
            active_layers=[],
            community_stats=community_stats,  # Still show community data even with no profile
        )

    # Run active layers
    layer_scores: dict[int, float] = {}

    if 1 in active_layers:
        accord_score = score_accord_similarity(target, collection)
        if accord_score is not None:
            layer_scores[1] = accord_score

    if 2 in active_layers:
        co_occ_score = score_co_occurrence(target, collection)
        if co_occ_score is not None:
            layer_scores[2] = co_occ_score

    note_result = None
    if 3 in active_layers:
        note_result = score_note_preferences(target, note_prefs)
        layer_scores[3] = note_result.score

    # Weighted average of active layer scores
    if layer_scores:
        total_weight = sum(LAYER_WEIGHTS[l] for l in layer_scores)
        weighted_sum = sum(LAYER_WEIGHTS[l] * s for l, s in layer_scores.items())
        final_score = int(round((weighted_sum / total_weight) * 100))
    else:
        final_score = 0

    # Note breakdown (from Layer 3, or empty)
    breakdown = note_result.breakdown if note_result else NoteBreakdown(
        loved=[], liked=[], neutral=[], disliked=[]
    )
    risk_factors = note_result.risk_factors if note_result else []

    # Collection comparisons
    comparisons = find_collection_comparisons(target, collection)

    return MatchResult(
        match_score=max(0, min(100, final_score)),
        confidence=confidence,
        accord_similarity=layer_scores.get(1),
        note_breakdown=breakdown,
        co_occurrence_score=layer_scores.get(2),
        collection_comparisons=comparisons,
        risk_factors=risk_factors,
        active_layers=sorted(active_layers),
        community_stats=community_stats,
    )
```

- [ ] **Step 4: Run tests**

```bash
cd engine
python -m pytest tests/test_scorer.py -v
```

Expected: All PASS

- [ ] **Step 5: Run all engine tests**

```bash
cd engine
python -m pytest tests/ -v
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add engine/src/matching/scorer.py engine/tests/test_scorer.py
git commit -m "feat(engine): implement top-level scorer orchestrating all layers"
```

---

### Task 12: Wire up the FastAPI /match endpoint

**Files:**
- Modify: `engine/src/main.py`

- [ ] **Step 1: Update main.py to use the scorer**

Replace the placeholder `/match` endpoint in `engine/src/main.py`:
```python
from fastapi import FastAPI
from .models import MatchRequest, MatchResult
from .matching.scorer import compute_match

app = FastAPI(title="ScentMatch Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest) -> MatchResult:
    return compute_match(
        request.target, request.collection, request.note_preferences,
        community_stats=request.community_stats,
    )
```

- [ ] **Step 2: Verify endpoint works**

```bash
cd engine
uvicorn src.main:app --reload --port 8000
```

Test with curl:
```bash
curl -X POST http://localhost:8000/match \
  -H "Content-Type: application/json" \
  -d '{"target":{"id":1,"name":"Test","brand":"B","notes":[],"main_accords":{}},"collection":[],"note_preferences":[]}'
```

Expected: Returns `{"match_score":0,"confidence":"none",...}`

- [ ] **Step 3: Commit**

```bash
git add engine/src/main.py
git commit -m "feat(engine): wire scorer to /match endpoint"
```

---

## Phase 3: Next.js API Layer

### Task 13: Set up NextAuth with Google OAuth

**Files:**
- Create: `web/src/lib/auth.ts`, `web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Install NextAuth**

```bash
cd web
npm install next-auth @auth/prisma-adapter
```

- [ ] **Step 2: Create auth config**

Create `web/src/lib/auth.ts`:
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
```

- [ ] **Step 3: Create auth route handler**

Create `web/src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 4: Add session type augmentation**

Create `web/src/types/next-auth.d.ts`:
```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/auth.ts web/src/app/api/auth/ web/src/types/
git commit -m "feat(web): set up NextAuth with Google OAuth"
```

---

### Task 14: Build fragrance search API

**Files:**
- Create: `web/src/app/api/fragrances/route.ts`, `web/src/app/api/fragrances/[id]/route.ts`

- [ ] **Step 1: Create search endpoint**

Create `web/src/app/api/fragrances/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const fragrances = await prisma.fragrance.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      notes: { include: { note: true } },
    },
    take: 20,
    orderBy: { ratingCount: "desc" },
  });

  return NextResponse.json(fragrances);
}
```

- [ ] **Step 2: Create get-by-id endpoint**

Create `web/src/app/api/fragrances/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fragrance = await prisma.fragrance.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      notes: { include: { note: true } },
    },
  });

  if (!fragrance) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(fragrance);
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/fragrances/
git commit -m "feat(web): add fragrance search and detail API routes"
```

---

### Task 15: Build collection CRUD API

**Files:**
- Create: `web/src/app/api/collection/route.ts`

- [ ] **Step 1: Create collection endpoint**

Create `web/src/app/api/collection/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
    include: {
      fragrance: {
        include: { notes: { include: { note: true } } },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(collection);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fragranceId, status, rating } = body;

  if (!fragranceId || !["own", "tried", "want"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Upsert — unique on (userId, fragranceId)
  const item = await prisma.userCollection.upsert({
    where: {
      userId_fragranceId: {
        userId: session.user.id,
        fragranceId: parseInt(fragranceId),
      },
    },
    update: { status, rating: rating ?? null },
    create: {
      userId: session.user.id,
      fragranceId: parseInt(fragranceId),
      status,
      rating: rating ?? null,
    },
    include: {
      fragrance: true,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fragranceId } = await request.json();

  await prisma.userCollection.delete({
    where: {
      userId_fragranceId: {
        userId: session.user.id,
        fragranceId: parseInt(fragranceId),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/collection/
git commit -m "feat(web): add collection CRUD API with upsert"
```

---

### Task 16: Build note preferences API

**Files:**
- Create: `web/src/app/api/preferences/route.ts`

- [ ] **Step 1: Create preferences endpoint**

Create `web/src/app/api/preferences/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await prisma.notePreference.findMany({
    where: { userId: session.user.id },
    include: { note: true },
  });

  return NextResponse.json(preferences);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { noteId, preference } = body;

  if (!noteId || !["love", "like", "neutral", "dislike"].includes(preference)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Explicit always overwrites inferred
  const pref = await prisma.notePreference.upsert({
    where: {
      userId_noteId: {
        userId: session.user.id,
        noteId: parseInt(noteId),
      },
    },
    update: { preference, source: "explicit" },
    create: {
      userId: session.user.id,
      noteId: parseInt(noteId),
      preference,
      source: "explicit",
    },
    include: { note: true },
  });

  return NextResponse.json(pref);
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/api/preferences/
git commit -m "feat(web): add note preferences API with explicit-overrides-inferred"
```

---

### Task 17: Build matching client and match orchestration API

**Files:**
- Create: `web/src/lib/matching-client.ts`, `web/src/lib/llm/adapter.ts`, `web/src/lib/llm/openai-provider.ts`, `web/src/lib/llm/prompt.ts`, `web/src/app/api/match/route.ts`

- [ ] **Step 1: Create matching engine HTTP client**

Create `web/src/lib/matching-client.ts`:
```typescript
export interface MatchResult {
  match_score: number;
  confidence: string;
  accord_similarity: number | null;
  note_breakdown: {
    loved: string[];
    liked: string[];
    neutral: string[];
    disliked: string[];
  };
  co_occurrence_score: number | null;
  collection_comparisons: {
    fragrance_name: string;
    fragrance_brand: string;
    similarity: number;
    shared_notes: string[];
    differences: string;
  }[];
  risk_factors: string[];
  active_layers: number[];
}

const ENGINE_URL = process.env.MATCHING_ENGINE_URL || "http://localhost:8000";

export async function getMatch(payload: {
  target: unknown;
  collection: unknown;
  note_preferences: unknown;
}): Promise<MatchResult> {
  const res = await fetch(`${ENGINE_URL}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Matching engine error: ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 2: Create LLM adapter interface**

Create `web/src/lib/llm/adapter.ts`:
```typescript
export interface LLMAdapter {
  generateExplanation(
    matchResult: unknown,
    tone: string
  ): Promise<string>;
}

export async function createLLMAdapter(): Promise<LLMAdapter> {
  const provider = process.env.LLM_PROVIDER || "openai";

  switch (provider) {
    case "openai": {
      const { OpenAIProvider } = await import("./openai-provider");
      return new OpenAIProvider();
    }
    default:
      throw new Error(
        `Unknown LLM provider: ${provider}. ` +
        `Supported: "openai". Add a new provider implementation to extend.`
      );
  }
}
```

- [ ] **Step 3: Create OpenAI-compatible provider**

Create `web/src/lib/llm/openai-provider.ts`:
```typescript
import { LLMAdapter } from "./adapter";
import { buildPrompt } from "./prompt";

export class OpenAIProvider implements LLMAdapter {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
    this.apiKey = process.env.LLM_API_KEY || "";
    this.model = process.env.LLM_MODEL || "gpt-4o-mini";
  }

  async generateExplanation(
    matchResult: unknown,
    tone: string
  ): Promise<string> {
    const prompt = buildPrompt(matchResult, tone);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error(`LLM error: ${res.status}`);
      return "Couldn't generate an explanation right now. Check the score and breakdown above.";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No explanation available.";
  }
}
```

- [ ] **Step 4: Create prompt templates**

Create `web/src/lib/llm/prompt.ts`:
```typescript
export function buildPrompt(
  matchResult: unknown,
  tone: string
): { system: string; user: string } {
  const toneInstructions: Record<string, string> = {
    casual:
      "You're a knowledgeable friend giving fragrance advice. Be casual, warm, and use everyday language. No jargon without explaining it. Use comparisons to things in their collection.",
    expert:
      "You're a fragrance sommelier. Use sophisticated but clear language. Reference note families and composition techniques, but remain accessible.",
    practical:
      "Be direct and practical. Focus on whether this is a good buy. State facts, risks, and your bottom line recommendation clearly.",
  };

  const system = `You are a fragrance advisor helping someone decide whether to blind-buy a fragrance.

${toneInstructions[tone] || toneInstructions.casual}

Rules:
- Keep it to 2-4 sentences
- Reference specific fragrances from their collection when comparing
- If confidence is low, acknowledge you don't know their taste well yet
- If there are risk factors (disliked notes), mention them honestly
- Never make up information not in the data provided`;

  const user = `Here is the matching analysis. Write a brief, helpful explanation.

${JSON.stringify(matchResult, null, 2)}`;

  return { system, user };
}
```

- [ ] **Step 5: Create match orchestration endpoint**

Create `web/src/app/api/match/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMatch } from "@/lib/matching-client";
import { createLLMAdapter } from "@/lib/llm/adapter";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fragranceId } = await request.json();
  if (!fragranceId) {
    return NextResponse.json({ error: "fragranceId required" }, { status: 400 });
  }

  // Fetch target fragrance
  const fragrance = await prisma.fragrance.findUnique({
    where: { id: parseInt(fragranceId) },
    include: { notes: { include: { note: true } } },
  });

  if (!fragrance) {
    return NextResponse.json({ error: "Fragrance not found" }, { status: 404 });
  }

  // Fetch user's collection
  const collection = await prisma.userCollection.findMany({
    where: { userId: session.user.id },
    include: {
      fragrance: { include: { notes: { include: { note: true } } } },
    },
  });

  // Fetch user's note preferences
  const preferences = await prisma.notePreference.findMany({
    where: { userId: session.user.id },
    include: { note: true },
  });

  // Transform to engine format
  const target = {
    id: fragrance.id,
    name: fragrance.name,
    brand: fragrance.brand,
    notes: fragrance.notes.map((fn) => ({
      name: fn.note.name,
      category: fn.note.category || "",
      layer: fn.layer,
    })),
    main_accords: (fragrance.mainAccords as Record<string, number>) || {},
  };

  const collectionPayload = collection.map((item) => ({
    fragrance: {
      id: item.fragrance.id,
      name: item.fragrance.name,
      brand: item.fragrance.brand,
      notes: item.fragrance.notes.map((fn) => ({
        name: fn.note.name,
        category: fn.note.category || "",
        layer: fn.layer,
      })),
      main_accords:
        (item.fragrance.mainAccords as Record<string, number>) || {},
    },
    status: item.status,
    rating: item.rating,
  }));

  const prefsPayload = preferences.map((p) => ({
    note_name: p.note.name,
    category: p.note.category || "",
    preference: p.preference,
    source: p.source,
  }));

  // Call matching engine
  const matchResult = await getMatch({
    target,
    collection: collectionPayload,
    note_preferences: prefsPayload,
  });

  // Generate LLM explanation
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const tone = user?.preferredTone || "casual";

  let explanation = "";
  try {
    const llm = await createLLMAdapter();
    explanation = await llm.generateExplanation(matchResult, tone);
  } catch (err) {
    console.error("LLM explanation failed:", err);
    explanation =
      "Couldn't generate an explanation right now. Check the score and breakdown above.";
  }

  return NextResponse.json({
    ...matchResult,
    explanation,
    fragrance: {
      id: fragrance.id,
      name: fragrance.name,
      brand: fragrance.brand,
      imageUrl: fragrance.imageUrl,
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/matching-client.ts web/src/lib/llm/ web/src/app/api/match/
git commit -m "feat(web): add match orchestration API with LLM adapter"
```

---

## Phase 4: Frontend UI

> **Note:** Use the `frontend-design` skill for all component implementation. The aesthetic direction is **Warm & Luxe** — cream/beige tones, serif display fonts, refined sans-serif body, earthy greens for positive signals, high-end fragrance boutique feel.

### Task 18: Set up theme, fonts, and shared components

**Files:**
- Modify: `web/src/app/globals.css`, `web/src/app/layout.tsx`, `web/tailwind.config.ts`
- Create: `web/src/components/nav.tsx`, `web/src/components/auth-button.tsx`, `web/src/components/confidence-badge.tsx`, `web/src/components/note-tag.tsx`

- [ ] **Step 1: Configure Tailwind theme with Warm & Luxe palette**

Use `frontend-design` skill to design and implement the custom Tailwind config, global CSS, and root layout with:
- Serif display font (e.g., Playfair Display or similar)
- Refined sans-serif body font
- Cream/beige/warm brown color palette
- Earthy green for positive signals
- CSS variables for the theme

- [ ] **Step 2: Build Nav component**

Navigation bar with logo, links (Home, Collection, Profile), and auth button.

- [ ] **Step 3: Build ConfidenceBadge component**

Small badge showing low/medium/high confidence. Hidden when high.

- [ ] **Step 4: Build NoteTag component**

Colored pill for notes: green for loved, blue for liked, gray for neutral, red for disliked.

- [ ] **Step 5: Build AuthButton component**

Sign in / sign out button using NextAuth's `signIn()` / `signOut()`.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx web/tailwind.config.ts web/src/components/
git commit -m "feat(web): set up Warm & Luxe theme and shared components"
```

---

### Task 19: Build Search & Score page (Home)

**Files:**
- Modify: `web/src/app/page.tsx`
- Create: `web/src/components/search-bar.tsx`, `web/src/components/match-result.tsx`

- [ ] **Step 1: Build SearchBar component**

Use `frontend-design` skill. Features:
- Input with autocomplete dropdown
- Calls `GET /api/fragrances?q=...` on debounced input
- Shows matching fragrances as selectable items
- On select, triggers the match API call

- [ ] **Step 2: Build MatchResult component**

Use `frontend-design` skill. Displays:
- Match score (large number with color coding)
- Confidence badge
- LLM explanation text
- Note breakdown (using NoteTag pills)
- Collection comparisons ("Similar to X in your collection")
- Risk factors highlighted
- "Add to collection" button

- [ ] **Step 3: Wire up the home page**

Update `web/src/app/page.tsx`:
- SearchBar at top
- MatchResult below when a fragrance is selected
- Loading state while match is computing
- Empty state when no search

- [ ] **Step 4: Commit**

```bash
git add web/src/app/page.tsx web/src/components/search-bar.tsx web/src/components/match-result.tsx
git commit -m "feat(web): build Search & Score home page"
```

---

### Task 20: Build My Collection page

**Files:**
- Create: `web/src/app/collection/page.tsx`, `web/src/components/fragrance-card.tsx`, `web/src/components/collection-grid.tsx`

- [ ] **Step 1: Build FragranceCard component**

Use `frontend-design` skill. Card showing:
- Fragrance image (or placeholder)
- Name and brand
- Status badge (own/tried/want)
- Star rating (if set)
- Remove button

- [ ] **Step 2: Build CollectionGrid component**

Grid layout with status filter tabs (All / Own / Tried / Want). Search within collection.

- [ ] **Step 3: Build collection page with add-fragrance flow**

Wire up at `web/src/app/collection/page.tsx`. Include a search modal to add new fragrances.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/collection/ web/src/components/fragrance-card.tsx web/src/components/collection-grid.tsx
git commit -m "feat(web): build My Collection page with grid and filters"
```

---

### Task 21: Build My Taste Profile page

**Files:**
- Create: `web/src/app/profile/page.tsx`, `web/src/components/taste-profile.tsx`, `web/src/components/note-swiper.tsx`

- [ ] **Step 1: Build TasteProfile component**

Use `frontend-design` skill. Displays:
- Top loved/liked notes as visual pills
- Favorite accords as a bar chart or tag cloud
- Collection stats (how many owned, tried, confidence level)

- [ ] **Step 2: Build NoteSwiper component**

Swipe-style UI for refining note preferences. Show a note name + category, user taps love/like/neutral/dislike. Calls `POST /api/preferences`.

- [ ] **Step 3: Wire up profile page**

Combine TasteProfile and NoteSwiper at `web/src/app/profile/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/profile/ web/src/components/taste-profile.tsx web/src/components/note-swiper.tsx
git commit -m "feat(web): build Taste Profile page with note swiper"
```

---

## Phase 5: Integration & Polish

### Task 22: End-to-end integration test

- [ ] **Step 1: Start all services**

```bash
# Terminal 1: PostgreSQL (should already be running)
# Terminal 2: Python engine
cd engine && uvicorn src.main:app --reload --port 8000
# Terminal 3: Next.js
cd web && npm run dev
```

- [ ] **Step 2: Test the full flow manually**

1. Open http://localhost:3000
2. Sign in with Google
3. Add 3-5 fragrances to collection (mark as "own")
4. Go to home page, search for a fragrance not in your collection
5. Verify: match score appears, note breakdown shows, LLM explanation renders
6. Check confidence badge shows "Early estimate"
7. Add more fragrances, verify confidence improves

- [ ] **Step 3: Fix any integration issues discovered**

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```

---

### Task 23: Add error handling and loading states

- [ ] **Step 1: Add error boundaries and fallback UI**

- Handle matching engine being unavailable (show community stats only)
- Handle LLM failure gracefully (show score without explanation)
- Add loading skeletons for search results and match computation
- Add toast notifications for collection add/remove actions

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(web): add error handling, loading states, and fallbacks"
```

---

## Execution Order Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1: Foundation | 1-4 | Project scaffolding (incl. `__init__.py`), database, dataset import |
| 2: Matching Engine | 5-12 | All Python scoring layers, tests, API endpoint |
| 3: Next.js API | 13-17 | Auth, CRUD routes, match orchestration |
| 4: Frontend UI | 18-21 | Theme, pages, components (use frontend-design skill) |
| 5: Integration | 22-23 | E2E testing, error handling, polish |

**Critical path:** Phase 1 → Phase 2 and Phase 3 (can be parallelized) → Phase 4 → Phase 5
