# ScentMatch UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the ScentMatch UI from a sparse, static layout to a polished, editorial fragrance app with animations, dense layouts, and real bottle images.

**Architecture:** Update the existing Next.js 16 + Tailwind v4 app in-place. Swap fonts (Playfair→Cormorant Garamond, DM Sans→Inter), update color palette, rewrite all page layouts and components to match the approved mockup. Pure CSS animations, no new dependencies.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (inline theme), TypeScript, CSS animations

---

### Task 1: Update Theme — Fonts, Colors, Animations

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Replace font imports in globals.css**

Replace the existing `@font-face` declarations for Playfair Display and DM Sans with Cormorant Garamond (weights 400-600, italic 400-500) and Inter (weights 300-600). Update the font-face src URLs to Google Fonts CDN. Update `--font-display` to `"Cormorant Garamond", Georgia, serif` and `--font-body` to `"Inter", -apple-system, sans-serif`.

- [ ] **Step 2: Update color palette in @theme inline block**

Replace the existing cream/warm/sage/rose/amber color variables with the new design values:
```css
--color-cream-50: #faf8f5;
--color-cream-100: #f0ece4;
--color-cream-200: #e2d8c8;
--color-brown: #1e1812;
--color-brown-mid: #6b5a45;
--color-brown-light: #a69279;
--color-sage: #6b8060;
--color-rose: #b8605a;
--color-amber: #c4973e;
```

- [ ] **Step 3: Add new keyframe animations**

Add these keyframes to globals.css:
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bottleUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scoreIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 6px 24px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 6px 32px rgba(196,151,62,0.2); }
}
@keyframes barGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

Add utility classes:
```css
.blend { mix-blend-mode: multiply; }
.animate-fadeUp { animation: fadeUp 0.7s ease forwards; }
.animate-bottleUp { animation: bottleUp 0.9s ease forwards; }
.animate-scoreIn { animation: scoreIn 0.6s ease forwards; }
.animate-pulseGlow { animation: pulseGlow 3s infinite; }
.animate-barGrow { animation: barGrow 1.2s ease forwards; transform-origin: left; }
```

- [ ] **Step 4: Update layout.tsx font loading**

Replace the Playfair Display Google Font import with Cormorant Garamond and Inter using `next/font/google`. Update the className on the body element.

- [ ] **Step 5: Run dev server and verify fonts load**

Run: `cd web && npm run dev`
Expected: App loads with Cormorant Garamond headings and Inter body text. No font loading errors in console.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx
git commit -m "feat: update theme with new fonts, colors, and animations"
```

---

### Task 2: Redesign Navigation

**Files:**
- Modify: `web/src/components/nav.tsx`

- [ ] **Step 1: Rewrite Nav component**

Replace the current Nav with a fixed top bar:
- Position fixed, full width, 54px height
- Background: `rgba(250,248,245,0.88)` with `backdrop-filter: blur(20px)`
- Border-bottom: `1px solid rgba(0,0,0,0.05)`
- Left: "ScentMatch" logo in Cormorant Garamond, 20px, weight 600
- Center: Score / Collection / Taste Profile links — 12px, uppercase, letter-spacing 1.8px, weight 500, Inter font
- Right: AuthButton
- Active link has darker color, others use brown-light
- z-index: 100

- [ ] **Step 2: Verify nav renders correctly on all pages**

Navigate to `/`, `/collection`, `/profile` and confirm nav appears fixed, links highlight correctly, and auth button works.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/nav.tsx
git commit -m "feat: redesign nav as fixed frosted-glass top bar"
```

---

### Task 3: Redesign Home Page Hero

**Files:**
- Modify: `web/src/app/page.tsx`
- Modify: `web/src/components/search-bar.tsx`

- [ ] **Step 1: Rewrite the hero section of page.tsx**

Replace the current centered hero with a two-column grid layout:
- CSS grid: `grid-template-columns: 1fr 1.2fr`
- Padding-top: 54px (for fixed nav)
- Height: auto (content-driven, NOT 100vh)

Left column (hero-text):
- Padding: 120px 48px 80px 80px
- "BLIND BUY CONFIDENCE" label: 11px, uppercase, letter-spacing 4px, brown-light, Inter weight 600
- "Will you / *love it?*" heading: 64px Cormorant Garamond weight 500, "love it?" in italic amber
- Body text: 15px Inter, brown-mid, max-width 380px
- SearchBar component below body text

Right column (hero-bottles):
- Background: `#fff` (pure white for clean mix-blend-mode multiply)
- Display flex, align-items center, justify-content center
- Padding: 80px 24px
- 4 bottle images from collection/popular fragrances using Fragrantica CDN URLs
- All images have className "blend" (mix-blend-mode: multiply)
- Staggered bottleUp animations (delays: 0.3s, 0.5s, 0.7s, 0.9s)
- Heights: 280px, 350px, 310px, 260px (natural variation)
- Hover: translateY(-12px) scale(1.06) with cubic-bezier(0.16,1,0.3,1)
- Tooltip label on hover showing fragrance name

Bottom stats bar (full-width grid below hero):
- Grid: repeat(4, 1fr), white background, border-top cream-dark
- Stats: Fragrances count, Notes Rated, In Collection, Best Match
- Numbers: 26px Cormorant Garamond weight 600
- Labels: 11px uppercase Inter weight 500, brown-light

- [ ] **Step 2: Update SearchBar styling**

Restyle the search bar:
- White background, 1px border cream-dark, border-radius 6px
- Padding: 14px 20px
- Subtle box-shadow: 0 2px 12px rgba(0,0,0,0.04)
- Hover: border-color brown-light, stronger shadow
- Search icon: 16px, stroke brown-light
- Placeholder: brown-light, 14px Inter
- Dropdown results: keep existing functionality, update styling to match new theme

- [ ] **Step 3: Verify hero renders correctly**

Run dev server, check:
- Two-column layout displays properly
- Bottles blend cleanly on white background (no visible white rectangles)
- Animations fire on load
- Search bar works and dropdown appears
- Stats bar shows at bottom

- [ ] **Step 4: Commit**

```bash
git add web/src/app/page.tsx web/src/components/search-bar.tsx
git commit -m "feat: redesign hero with split layout, bottle display, and stats bar"
```

---

### Task 4: Redesign Score Result

**Files:**
- Modify: `web/src/components/match-result.tsx`

- [ ] **Step 1: Rewrite MatchResult component**

Replace the current centered score ring layout with a two-column grid:

Layout: `grid-template-columns: 400px 1fr`, min-height 580px

Left column (score-img):
- Cream-mid background, flex center
- Fragrance bottle image (380px height, blend mode multiply)
- Hover: scale(1.03)
- Floating score badge: 84px circle, position absolute top-right, dark brown bg
  - Score number: 30px Cormorant weight 600, cream color
  - "Match" label: 9px uppercase
  - Animations: scoreIn (0.6s delay 0.2s) + pulseGlow (3s infinite)

Right column (score-info):
- Padding: 44px 52px, flex column
- Fragrance name: 34px Cormorant weight 500
- Meta row: house name (12px uppercase) + confidence badge (sage bg)
- Verdict: 17px Cormorant italic, cream-mid bg, amber left border (3px), border-radius 6px
- Two sub-columns (grid 1fr 1fr):
  - Note Breakdown: note tags color-coded (loved=sage, liked=amber, risk=rose), 4px radius
  - From Your Collection: similar fragrances with mini bottle images (36x48px, blend mode), shared notes text, percentage in 20px Cormorant sage
- Action buttons: "Add to Collection" (dark primary, flex 1) + "Score Another" (ghost outline)

Keep all existing data fetching and API logic — only change the JSX/styling.

- [ ] **Step 2: Verify score result renders with real data**

Search for a fragrance, confirm the two-column result displays correctly with the bottle image, score badge, notes, and collection comparisons.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/match-result.tsx
git commit -m "feat: redesign score result as two-column editorial layout"
```

---

### Task 5: Redesign Collection Page

**Files:**
- Modify: `web/src/app/collection/page.tsx`
- Modify: `web/src/components/fragrance-card.tsx`

- [ ] **Step 1: Rewrite collection page layout**

Replace the current simple grid with a magazine-style layout:

Header section:
- Flex row: "Your Collection" (30px Cormorant weight 500) + "+ Add Fragrance" button (outlined, 12px uppercase, inverts on hover)
- Filter tabs: ALL / OWN / TRIED / WISHLIST with counts — 12px uppercase, active has underline border-bottom

Magazine grid: `grid-template-columns: 1.4fr 1fr 1fr`, rows at 270px, gap 10px
- First item: featured card spanning 2 rows (grid-row: 1 / 3), vertical layout with large image
- Remaining items: horizontal layout (120px image left, text right)

- [ ] **Step 2: Rewrite FragranceCard component**

Create two card variants based on a `featured` prop:

Featured card (vertical):
- Full height, flex column
- Image area: flex 1, padding 16px, centered bottle with blend mode multiply, max-height 360px
- Text area: padding 0 22px 22px — status badge (10px uppercase), name (22px Cormorant), house (11px uppercase), accord tags, star rating

Regular card (horizontal):
- Flex row, 270px height
- Image area: 120px wide, padding 10px, bottle with blend mode multiply
- Text area: flex 1, padding 14px 18px, justify-end — status (10px), name (17px Cormorant), house (11px), accords, stars

Both cards:
- Cream-mid background, 8px border-radius
- Hover: scale(0.985) with box-shadow, cubic-bezier transition
- Image hover: scale(1.04)
- Ensure all bottle images use consistent sizing within their containers using `object-fit: contain` with `max-height` and `max-width: 100%`

- [ ] **Step 3: Verify collection page with real data**

Navigate to `/collection`, confirm:
- Magazine grid renders with featured card on left
- All bottle images are consistently sized within their card types
- Filter tabs work
- Add/remove fragrance still works

- [ ] **Step 4: Commit**

```bash
git add web/src/app/collection/page.tsx web/src/components/fragrance-card.tsx
git commit -m "feat: redesign collection as magazine grid with featured card"
```

---

### Task 6: Redesign Taste Profile Page

**Files:**
- Modify: `web/src/app/profile/page.tsx`
- Modify: `web/src/components/taste-profile.tsx`
- Modify: `web/src/components/note-swiper.tsx`

- [ ] **Step 1: Rewrite profile page layout**

Replace current layout with a full-width dark section:
- Background: brown (#1e1812), text cream (#faf8f5)
- CSS grid: `grid-template-columns: 1.1fr 0.9fr`
- Left column: TasteProfile component
- Right column: NoteSwiper component
- Border between columns: 1px solid rgba(255,255,255,0.06)

- [ ] **Step 2: Rewrite TasteProfile component**

Left column content:
- "Your Taste DNA" heading: 30px Cormorant weight 500, cream
- Subtitle: 14px Inter, brown-light
- Stats grid: 4 columns (Owned/Tried/Wishlist/Notes), bordered cells with rgba(255,255,255,0.06)
  - Numbers: 26px Cormorant weight 500, cream — **ensure these are large and readable**
  - Labels: 10px uppercase, brown-light
- Accord bars: 5 rows, each with name (13px, right-aligned, 100px wide), animated fill bar (4px height), percentage label (16px Cormorant)
  - Bar colors: amber (92%), sage (78%), brown-light (65%), rose (52%), blue #7a9aad (38%)
  - Animated with barGrow keyframe, staggered delays
- Note groups: 3-column grid (Love/Like/Avoid)
  - Headers: 10px uppercase, brown-light, letter-spacing 2.5px
  - Chips: 12px, 4px radius — love (sage bg 15% opacity, light sage text), like (amber bg 12%, light amber text), avoid (rose bg 12%, light rose text)

**Important — readability fix:** Use cream (#faf8f5) for primary text, brown-light (#a69279) for secondary. For labels, use at minimum `rgba(201,184,152,0.6)` not the 0.35 opacity from the mockup. Bump all text that was hard to read.

- [ ] **Step 3: Rewrite NoteSwiper component**

Right column content:
- Header: "Rate Notes" (22px Cormorant weight 500) + "16 Remaining" count (11px uppercase, brown-light)
- Swipe card: centered, max-width 320px, 1px border rgba(255,255,255,0.07), 12px radius, rgba(255,255,255,0.02) bg
  - Note name: 32px Cormorant weight 500, cream
  - Category: 13px Inter, brown-light
  - 4 action buttons: 54px circles, 1px border rgba(255,255,255,0.08)
    - Love (+): hover sage bg/border
    - Like (~): hover amber bg/border
    - Meh (–): hover white 6% bg
    - Skip (x): hover rose bg/border
    - All: scale(1.1) on hover with cubic-bezier
- Recently rated: chips below card with colored dots (6px circles: sage=love, amber=like, rose=avoid)

Keep all existing rating logic and API calls — only change JSX/styling.

- [ ] **Step 4: Verify profile page with real data**

Navigate to `/profile`, confirm:
- Dark section renders edge-to-edge
- All text is readable (no low-contrast issues)
- Stats numbers are prominent
- Accord bars animate on load
- Note swiper works — clicking ratings calls API and advances to next note
- Recently rated list updates

- [ ] **Step 5: Commit**

```bash
git add web/src/app/profile/page.tsx web/src/components/taste-profile.tsx web/src/components/note-swiper.tsx
git commit -m "feat: redesign taste profile as dark two-column layout with animated accords"
```

---

### Task 7: Polish and Integration Check

**Files:**
- Modify: `web/src/components/confidence-badge.tsx`
- Modify: `web/src/components/note-tag.tsx`
- Potentially modify: any component with lingering old styles

- [ ] **Step 1: Update ConfidenceBadge styling**

Update to match new design: 11px, uppercase, letter-spacing 1.5px, weight 500, sage bg with 10% opacity, 3px border-radius.

- [ ] **Step 2: Update NoteTag styling**

Update to match new tag design: 13px weight 500, 4px border-radius, color-coded backgrounds at 8-10% opacity with solid text colors (sage for loved, amber for liked, rose for risk).

- [ ] **Step 3: Full integration test**

Walk through the complete user flow:
1. Load home page — hero renders with bottles, search bar works
2. Search for a fragrance — dropdown appears with results
3. Click a result — score displays in two-column layout
4. Add to collection — navigate to collection page, verify it appears in magazine grid
5. Navigate to profile — dark section renders, rate some notes, verify they save
6. Return to home — search and score again, verify collection comparisons show

- [ ] **Step 4: Fix any remaining old-style components**

Check all components for any lingering references to old color classes (warm-600, warm-700, warm-800, warm-900) or old font classes (font-display with Playfair). Update to new equivalents.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish remaining components and verify full integration"
```
