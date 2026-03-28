# ScentMatch Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy ScentMatch to production using Vercel (frontend) + Supabase (DB + Auth) + Railway (Python engine).

**Architecture:** Next.js 16 on Vercel calls Supabase PostgreSQL for data and Supabase Auth for sessions. Match scoring calls a FastAPI container on Railway. OpenAI provides match explanations.

**Tech Stack:** Next.js 16.2.1, Supabase (@supabase/ssr + @supabase/supabase-js), Prisma with PostgreSQL, FastAPI on Docker/Railway, OpenAI API.

**CRITICAL: Next.js 16 Breaking Change:** This project runs Next.js 16 which renamed `middleware.ts` to `proxy.ts` and `middleware()` to `proxy()`. All middleware code must use the new convention. See `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

---

## File Structure

### Files to Create
- `web/src/lib/supabase/client.ts` — Browser Supabase client for client components
- `web/src/lib/supabase/server.ts` — Server Supabase client for API routes and server components
- `web/src/proxy.ts` — Refreshes Supabase auth session on each request (Next.js 16 proxy, NOT middleware)
- `web/src/app/auth/callback/route.ts` — Handles OAuth redirect from Supabase
- `engine/Dockerfile` — Python 3.12 slim image for Railway deployment
- `engine/.dockerignore` — Exclude non-production files from Docker image

### Files to Modify
- `web/prisma/schema.prisma` — sqlite -> postgresql, remove NextAuth models (Account, Session)
- `web/src/lib/prisma.ts` — Remove better-sqlite3 adapter
- `web/src/lib/get-user-id.ts` — Replace NextAuth session with Supabase getUser()
- `web/src/components/auth-button.tsx` — Replace NextAuth signIn/signOut with Supabase OAuth
- `web/src/components/providers.tsx` — Remove SessionProvider (no longer needed)
- `web/src/app/layout.tsx` — Remove Providers wrapper
- `web/package.json` — Remove NextAuth/sqlite deps, add Supabase deps
- `web/.env.example` — Update with Supabase env vars

### Files to Delete
- `web/src/lib/auth.ts` — NextAuth config
- `web/src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- `web/dev.db` — SQLite database file
- `web/prisma/migrations/20260327034750_init/` — SQLite migration

---

## Task 1: Database Migration — Schema and Prisma Client

**Files:**
- Modify: `web/prisma/schema.prisma`
- Modify: `web/src/lib/prisma.ts`

- [ ] **Step 1: Update Prisma schema provider to PostgreSQL**

In `web/prisma/schema.prisma`, change the datasource block:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

The `directUrl` is needed for Supabase — it provides a non-pooled connection for migrations while `DATABASE_URL` uses the connection pooler for runtime queries.

- [ ] **Step 2: Remove NextAuth models from schema**

In `web/prisma/schema.prisma`, delete the `Account` model (lines 63-80) and `Session` model (lines 82-90) entirely. Also remove the `accounts` and `sessions` relations from the `User` model:

The `User` model should become:

```prisma
model User {
  id            String           @id @default(cuid())
  email         String           @unique
  name          String?
  image         String?
  preferredTone String           @default("casual") @map("preferred_tone")
  createdAt     DateTime         @default(now()) @map("created_at")
  collection    UserCollection[]
  preferences   NotePreference[]

  @@map("users")
}
```

- [ ] **Step 3: Replace Prisma client with standard PrismaClient**

Replace the entire contents of `web/src/lib/prisma.ts` with:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Delete SQLite migration and database file**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
rm -f web/dev.db
rm -rf web/prisma/migrations/20260327034750_init
```

- [ ] **Step 5: Commit**

```bash
git add web/prisma/schema.prisma web/src/lib/prisma.ts
git rm web/dev.db
git rm -r web/prisma/migrations/20260327034750_init
git commit -m "feat: migrate from SQLite to PostgreSQL, remove NextAuth models"
```

---

## Task 2: Remove SQLite and NextAuth Dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Remove old packages**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npm uninstall better-sqlite3 @prisma/adapter-better-sqlite3 @types/better-sqlite3 next-auth @auth/prisma-adapter
```

- [ ] **Step 2: Install Supabase packages**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/package.json web/package-lock.json
git commit -m "chore: swap SQLite/NextAuth deps for Supabase"
```

---

## Task 3: Create Supabase Client Utilities

**Files:**
- Create: `web/src/lib/supabase/client.ts`
- Create: `web/src/lib/supabase/server.ts`

- [ ] **Step 1: Create browser client**

Create `web/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server client**

Create `web/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // as long as proxy.ts handles session refresh.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/lib/supabase/client.ts web/src/lib/supabase/server.ts
git commit -m "feat: add Supabase client utilities for browser and server"
```

---

## Task 4: Create Auth Proxy and Callback Route

**Files:**
- Create: `web/src/proxy.ts`
- Create: `web/src/app/auth/callback/route.ts`

**IMPORTANT:** Next.js 16 renamed `middleware.ts` to `proxy.ts` and the export from `middleware()` to `proxy()`. Do NOT create a `middleware.ts` file.

- [ ] **Step 1: Create proxy for session refresh**

Create `web/src/proxy.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must use getUser() not getSession() for security
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Create OAuth callback route**

Create `web/src/app/auth/callback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
```

- [ ] **Step 3: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/proxy.ts web/src/app/auth/callback/route.ts
git commit -m "feat: add Supabase auth proxy and OAuth callback route"
```

---

## Task 5: Migrate Auth Components and User ID

**Files:**
- Modify: `web/src/components/auth-button.tsx`
- Modify: `web/src/lib/get-user-id.ts`
- Modify: `web/src/components/providers.tsx`
- Modify: `web/src/app/layout.tsx`
- Delete: `web/src/lib/auth.ts`
- Delete: `web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Replace auth-button with Supabase OAuth**

Replace the entire contents of `web/src/components/auth-button.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-8 w-16 animate-pulse rounded-lg bg-cream-200" />
    );
  }

  if (user) {
    return (
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-brown-light hover:text-brown text-[12px] uppercase tracking-[0.094em] font-medium transition-colors"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      }
      className="bg-brown text-cream-50 rounded py-[7px] px-[18px] text-[12px] uppercase tracking-[0.094em] font-medium transition-colors hover:bg-[#2a2218]"
    >
      Sign in
    </button>
  );
}
```

- [ ] **Step 2: Replace get-user-id with Supabase server client**

Replace the entire contents of `web/src/lib/get-user-id.ts` with:

```typescript
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "./prisma";

export async function getUserId(): Promise<string> {
  // Try authenticated user first
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Ensure user row exists in our DB (first-login sync)
      await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email!, name: user.user_metadata?.full_name },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name,
          image: user.user_metadata?.avatar_url,
        },
      });
      return user.id;
    }
  } catch {
    // auth not configured, fall through
  }

  // Per-browser anonymous user via cookie
  const cookieStore = await cookies();
  let anonId = cookieStore.get("scentmatch_uid")?.value;

  if (!anonId) {
    anonId = `anon-${crypto.randomUUID()}`;
    cookieStore.set("scentmatch_uid", anonId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // Ensure user row exists
  await prisma.user.upsert({
    where: { id: anonId },
    update: {},
    create: {
      id: anonId,
      email: `${anonId}@scentmatch.local`,
      name: "Guest",
    },
  });

  return anonId;
}
```

- [ ] **Step 3: Remove SessionProvider from providers.tsx**

Replace the entire contents of `web/src/components/providers.tsx` with:

```tsx
"use client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Note: We keep the Providers component as a shell so layout.tsx doesn't need structural changes. If you want to add any client-side providers later (e.g., toast notifications), this is where they go.

- [ ] **Step 4: Delete NextAuth files**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
rm web/src/lib/auth.ts
rm -rf web/src/app/api/auth
```

- [ ] **Step 5: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/src/components/auth-button.tsx web/src/lib/get-user-id.ts web/src/components/providers.tsx
git rm web/src/lib/auth.ts
git rm -r web/src/app/api/auth
git commit -m "feat: migrate auth from NextAuth to Supabase Auth"
```

---

## Task 6: Update Environment Configuration

**Files:**
- Modify: `web/.env.example`

- [ ] **Step 1: Update .env.example with Supabase vars**

Replace the entire contents of `web/.env.example` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database (from Supabase > Settings > Database)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Matching Engine
MATCHING_ENGINE_URL="http://localhost:8000"

# LLM (for match explanations)
LLM_PROVIDER="openai"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY=""
LLM_MODEL="gpt-4o-mini"
```

- [ ] **Step 2: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add web/.env.example
git commit -m "chore: update .env.example for Supabase deployment"
```

---

## Task 7: Create Engine Dockerfile for Railway

**Files:**
- Create: `engine/Dockerfile`
- Create: `engine/.dockerignore`

- [ ] **Step 1: Create Dockerfile**

Create `engine/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create .dockerignore**

Create `engine/.dockerignore`:

```
__pycache__
*.pyc
.env
.env.*
.venv
venv
tests/
.pytest_cache
.git
*.md
```

- [ ] **Step 3: Test Docker build locally (optional but recommended)**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/engine
docker build -t scentmatch-engine .
docker run --rm -p 8000:8000 scentmatch-engine
# In another terminal: curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

- [ ] **Step 4: Commit**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app
git add engine/Dockerfile engine/.dockerignore
git commit -m "feat: add Dockerfile for Railway deployment"
```

---

## Task 8: Supabase Project Setup (Manual)

These steps are performed in the browser, not in code.

- [ ] **Step 1: Create Supabase project**

Go to supabase.com, create a new project. Pick a region close to Vercel's default (us-east-1). Note the project URL and anon key from Settings > API.

- [ ] **Step 2: Get connection strings**

Go to Settings > Database > Connection string. Copy:
- **Pooled connection string** (port 6543) -> this is your `DATABASE_URL`
- **Direct connection string** (port 5432) -> this is your `DIRECT_URL`

- [ ] **Step 3: Set local environment variables**

Create or update `web/.env.local` with the real values:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-real-anon-key"
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
MATCHING_ENGINE_URL="http://localhost:8000"
LLM_PROVIDER="synthetic"
```

- [ ] **Step 4: Run Prisma migration against Supabase**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npx prisma migrate dev --name init
```

Expected: Prisma creates a new PostgreSQL migration and applies it to Supabase.

- [ ] **Step 5: Seed the database**

```bash
cd /e/Meta_intervew/fragrantica_blind_buy_app/web
npx prisma db seed
```

Expected: ~68k fragrances imported. Takes 2-3 minutes over the network.

- [ ] **Step 6: Verify in Supabase dashboard**

Go to Table Editor in Supabase dashboard. Check:
- `fragrances` table has ~68k rows
- `notes` table has hundreds of rows
- `fragrance_notes` table has thousands of rows

- [ ] **Step 7: Configure Google OAuth in Supabase**

Go to Authentication > Providers > Google:
1. Enable Google provider
2. Add your Google Cloud OAuth client ID and secret
3. Set the redirect URL shown in Supabase to your Google Cloud OAuth consent screen's authorized redirect URIs

---

## Task 9: Deploy Engine to Railway (Manual)

- [ ] **Step 1: Create Railway project**

Go to railway.app, create a new project. Connect it to the `pi3123/scentmatch` GitHub repo.

- [ ] **Step 2: Configure service**

- Set root directory to `engine/`
- Railway auto-detects the Dockerfile
- Set the PORT variable to `8000` (Railway injects its own PORT, but uvicorn listens on 8000 — Railway handles the mapping)

- [ ] **Step 3: Generate public domain**

In Railway service settings, generate a public domain. Note the URL (e.g., `scentmatch-engine.up.railway.app`).

- [ ] **Step 4: Verify engine health**

```bash
curl https://scentmatch-engine.up.railway.app/health
```

Expected: `{"status":"ok"}`

---

## Task 10: Deploy Frontend to Vercel (Manual)

- [ ] **Step 1: Connect repo on Vercel**

Go to vercel.com, import the `pi3123/scentmatch` repo. Set root directory to `web/`.

- [ ] **Step 2: Set environment variables**

In Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooled connection string (port 6543) |
| `DIRECT_URL` | Supabase direct connection string (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `MATCHING_ENGINE_URL` | Railway public URL from Task 9 |
| `LLM_PROVIDER` | `openai` |
| `LLM_MODEL` | `gpt-4o-mini` |
| `LLM_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | Your OpenAI API key |

Note: `LLM_API_KEY` in the codebase maps to `OPENAI_API_KEY` — check `web/src/lib/llm/adapter.ts` to confirm which env var name the code reads.

- [ ] **Step 3: Deploy**

Push to main or trigger a deploy from the Vercel dashboard. Vercel auto-builds Next.js.

- [ ] **Step 4: Update Supabase redirect URL**

In Supabase > Authentication > URL Configuration:
- Set Site URL to `https://your-app.vercel.app`
- Add `https://your-app.vercel.app/auth/callback` to Redirect URLs

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Home page loads**

Visit `https://your-app.vercel.app`. The home page should render with the search bar and hero section.

- [ ] **Step 2: Fragrance search works**

Type "Sauvage" in the search bar. Autocomplete should return results from Supabase.

- [ ] **Step 3: Google sign-in works**

Click "Sign in" -> redirects to Google -> returns to app with session. The button should change to "Sign out".

- [ ] **Step 4: Add to collection**

Search for a fragrance, add it to collection. Navigate to /collection — it should appear.

- [ ] **Step 5: Match scoring works**

Score a fragrance — the request should hit Railway engine and return a match result with breakdown.

- [ ] **Step 6: LLM explanation renders**

If OPENAI_API_KEY is set, the match result should include a natural language explanation below the score.

- [ ] **Step 7: Taste profile works**

Navigate to /profile. The note swiper should show popular notes for onboarding.
