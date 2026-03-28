# CI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a GitHub Actions CI workflow that runs engine tests and web checks on PRs to main, plus branch protection guidance.

**Architecture:** Single workflow file with two parallel jobs -- `engine-tests` (pytest) and `web-checks` (lint + build). Branch protection configured manually in GitHub settings.

**Tech Stack:** GitHub Actions, Python 3.12, Node 20, pytest, ESLint, Next.js build, Prisma

---

## File Structure

- **Create:** `.github/workflows/ci.yml` -- the CI workflow
- **Create:** `docs/branch-protection-setup.md` -- guide for configuring branch protection rules in GitHub

---

### Task 1: Create the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  engine-tests:
    name: Engine Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: engine
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest -v

  web-checks:
    name: Web Checks
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: "postgresql://placeholder:placeholder@localhost:5432/placeholder"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
```

- [ ] **Step 2: Verify the YAML is valid**

Run: `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`
Expected: No errors (silent success)

If `yaml` module not available, run: `pip install pyyaml` first.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow with engine tests and web checks"
```

---

### Task 2: Create branch protection setup guide

**Files:**
- Create: `docs/branch-protection-setup.md`

- [ ] **Step 1: Write the guide**

```markdown
# Branch Protection Setup for `main`

## Steps

1. Go to your GitHub repo > **Settings** > **Branches**
2. Click **Add branch protection rule** (or **Add classic branch protection rule**)
3. Set **Branch name pattern** to: `main`
4. Enable **Require a pull request before merging**
5. Enable **Require status checks to pass before merging**
6. Check **Require branches to be up to date before merging**
7. In the search box, add these required status checks:
   - `Engine Tests`
   - `Web Checks`
8. Click **Save changes**

## Note

The status checks (`Engine Tests` and `Web Checks`) will only appear in the search
after the CI workflow has run at least once. Create a test PR first to trigger the
workflow, then configure the branch protection rules.
```

- [ ] **Step 2: Commit**

```bash
git add docs/branch-protection-setup.md
git commit -m "docs: add branch protection setup guide"
```

---

### Task 3: Verify the pipeline works

- [ ] **Step 1: Run engine tests locally to confirm they pass**

Run from `engine/` directory:
```bash
cd engine && pip install -r requirements.txt && pytest -v
```
Expected: All 7+ tests pass.

- [ ] **Step 2: Run web lint locally to confirm it passes**

Run from `web/` directory:
```bash
cd web && npm ci && npm run lint
```
Expected: No lint errors.

- [ ] **Step 3: Run web build locally to confirm it passes**

Run from `web/` directory:
```bash
DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
npm run build
```
Expected: Build succeeds (Prisma generate + Next.js build).
