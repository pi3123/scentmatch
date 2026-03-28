# CI Pipeline Design

## Overview

Single GitHub Actions workflow with two parallel jobs that runs on PRs targeting `main`. Combined with GitHub branch protection rules to prevent merging failing code.

## Trigger

```yaml
on:
  pull_request:
    branches: [main]
```

## Jobs

### Job 1: `engine-tests`

- **Runner:** ubuntu-latest
- **Python:** 3.12
- **Working directory:** `fragrantica_blind_buy_app/engine`
- **Steps:**
  1. Checkout repository
  2. Setup Python 3.12
  3. Install dependencies: `pip install -r requirements.txt`
  4. Run tests: `pytest`

The engine tests are self-contained unit tests that create in-memory data objects and test the matching/recommendation logic. No database, API keys, or external services required.

### Job 2: `web-checks`

- **Runner:** ubuntu-latest
- **Node:** 20
- **Working directory:** `fragrantica_blind_buy_app/web`
- **Steps:**
  1. Checkout repository
  2. Setup Node 20
  3. Install dependencies: `npm ci`
  4. Run linter: `npm run lint`
  5. Run build: `npm run build`

The build step runs `prisma generate && next build`, which validates TypeScript compilation and Prisma client generation. A dummy `DATABASE_URL` env var is needed for Prisma generate to succeed without a real database connection.

## Branch Protection Rules

Configure in GitHub repo settings (Settings > Branches > Add rule):

- **Branch name pattern:** `main`
- **Require status checks to pass before merging:** enabled
  - Required checks: `engine-tests`, `web-checks`
- **Require branches to be up to date before merging:** enabled

## File Location

`.github/workflows/ci.yml` at the repository root (inside `fragrantica_blind_buy_app/`).
