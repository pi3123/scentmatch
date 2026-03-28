# ScentMatch Deployment Design

## Architecture

```
User -> Vercel (Next.js frontend + API routes)
            |
            ├── Supabase Postgres (fragrance data, user data)
            ├── Supabase Auth (Google OAuth, session management)
            ├── Railway (Python FastAPI engine, always-on container)
            └── OpenAI API (match explanations)
```

### Services

| Service  | Role                                    | Free Tier               |
|----------|-----------------------------------------|-------------------------|
| Vercel   | Next.js hosting, API routes, edge CDN   | 100GB bandwidth/mo      |
| Supabase | PostgreSQL DB + Auth                    | 500MB DB, 50k MAU       |
| Railway  | Python matching engine (Docker)         | 500 hrs/mo trial, ~$5/mo after |

### Cost

$0/mo at launch (all free tiers). ~$5-7/mo once Railway trial ends. Supabase Pro ($25/mo) when you outgrow 500MB.

---

## Phase 1: Database Migration (SQLite to PostgreSQL)

### Files Changed

| File | Change |
|------|--------|
| `web/prisma/schema.prisma` | Change `provider = "sqlite"` to `provider = "postgresql"` |
| `web/src/lib/prisma.ts` | Remove `better-sqlite3` adapter, use plain `new PrismaClient()` |
| `web/prisma/seed.ts` | Remove `better-sqlite3` adapter, use plain `new PrismaClient()` |
| `web/package.json` | Remove `better-sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3` |
| `web/.env.example` | Update with Supabase connection string format |

### Files Deleted

- `web/dev.db` (SQLite database file)
- `web/prisma/migrations/20260327034750_init/` (SQLite migration)

### Notes

- Prisma models are database-agnostic; no schema changes needed beyond the provider switch.
- Seeding 69k fragrances over the network takes ~2-3 minutes (one-time).
- New migration generated with `npx prisma migrate dev --name init`.

---

## Phase 2: Auth Migration (NextAuth to Supabase Auth)

### Files Removed

| File | Reason |
|------|--------|
| `web/src/lib/auth.ts` | NextAuth configuration |
| `web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |

### Packages Removed

- `next-auth`

### Packages Added

- `@supabase/supabase-js`
- `@supabase/ssr`

### Files Added

| File | Purpose |
|------|---------|
| `web/src/lib/supabase/client.ts` | Browser Supabase client (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `web/src/lib/supabase/server.ts` | Server Supabase client for API routes and server components |
| `web/src/middleware.ts` | Refreshes Supabase auth session on each request |
| `web/src/app/auth/callback/route.ts` | Handles OAuth redirect from Supabase |

### Files Modified

| File | Change |
|------|--------|
| `web/src/components/auth-button.tsx` | Rewire to `supabase.auth.signInWithOAuth()` / `supabase.auth.signOut()` |
| `web/src/lib/get-user-id.ts` | Use Supabase server client instead of `getServerSession()` |
| `web/src/app/api/collection/route.ts` | Swap from NextAuth session to Supabase `getUser()` |
| `web/src/app/api/preferences/route.ts` | Swap from NextAuth session to Supabase `getUser()` |
| `web/src/app/api/match/route.ts` | Swap from NextAuth session to Supabase `getUser()` |

### Auth Flow

1. User clicks sign in -> `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Supabase redirects to Google consent screen
3. Google redirects back to `/auth/callback`
4. Callback exchanges code for session, sets cookies
5. Middleware refreshes session on subsequent requests

### User Table Sync

Supabase Auth manages `auth.users`. On first login, create a row in the Prisma `User` table keyed by the Supabase auth user ID. This bridges Supabase Auth with application data (collections, preferences).

### Env Vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for client) |

Removed: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

Google OAuth credentials are configured in Supabase dashboard (Authentication > Providers > Google), not in env vars.

---

## Phase 3: Engine Deployment (Railway)

### Files Added

| File | Purpose |
|------|---------|
| `engine/Dockerfile` | Python 3.12 slim, install deps, run uvicorn |
| `engine/.dockerignore` | Exclude tests, venv, __pycache__, .env |

### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ src/
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Railway Setup

1. Connect GitHub repo on railway.app
2. Set root directory to `engine/`
3. Railway auto-detects Dockerfile and deploys
4. Public URL generated (e.g., `scentmatch-engine.up.railway.app`)

### No engine code changes required

The FastAPI app already exposes `/health` (GET) and `/match` (POST). Just containerize and deploy.

---

## Phase 4: Vercel Deployment

### Setup

1. Connect GitHub repo on vercel.com
2. Set root directory to `web/`
3. Vercel auto-detects Next.js and configures build
4. Set environment variables (see below)
5. Auto-deploys on push to main

### Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooled connection string (port 6543) |
| `DIRECT_URL` | Supabase direct connection string (port 5432, for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase dashboard |
| `MATCHING_ENGINE_URL` | Railway public URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `LLM_PROVIDER` | `openai` |
| `LLM_MODEL` | `gpt-4o-mini` (or preferred model) |

### Build

Prisma client generated at build time via `prisma generate` in the build command. Vercel's default Next.js builder handles this automatically if `prisma generate` is in the `postinstall` script (already standard with Prisma).

---

## Phase 5: End-to-End Verification

1. Home page loads on Vercel URL
2. Google sign-in works via Supabase Auth
3. Fragrance search returns results (Supabase DB)
4. Add to collection persists (Supabase DB)
5. Score a fragrance returns match result (Railway engine)
6. Match explanation renders (OpenAI)
7. Taste profile swiper works with popular notes

---

## Env Vars Summary

| Service  | Variable                        | Source                    |
|----------|---------------------------------|---------------------------|
| Vercel   | `DATABASE_URL`                  | Supabase > Settings > Database |
| Vercel   | `DIRECT_URL`                    | Supabase > Settings > Database |
| Vercel   | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase > Settings > API |
| Vercel   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API |
| Vercel   | `MATCHING_ENGINE_URL`           | Railway project URL       |
| Vercel   | `OPENAI_API_KEY`                | OpenAI dashboard          |
| Vercel   | `LLM_PROVIDER`                  | `openai`                  |
| Vercel   | `LLM_MODEL`                     | `gpt-4o-mini`             |
| Railway  | (none)                          | Engine is stateless       |

---

## Deployment Order

1. **Create Supabase project** (DB + Auth ready)
2. **Migrate database** (code changes + `prisma migrate dev` against Supabase)
3. **Seed database** (69k fragrances)
4. **Migrate auth** (swap NextAuth for Supabase Auth)
5. **Deploy engine to Railway** (Dockerfile + connect repo)
6. **Deploy frontend to Vercel** (connect repo + env vars)
7. **Configure Google OAuth** in Supabase dashboard
8. **Verify end-to-end**
