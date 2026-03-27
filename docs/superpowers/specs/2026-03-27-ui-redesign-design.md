# ScentMatch UI Redesign

## Problem

The current UI is functional but feels "vibecoded" — sparse, static, no animations, no flow, no story. Pages feel disconnected and the app lacks the polish of a crafted product experience.

## Design Direction

A mix of **Apple-style cinematic reveals** (smooth animations, immersive hero) with **Aesop/Le Labo editorial warmth** (magazine-style collection grid, narrative scoring, left-aligned typography). Inspired by real luxury fragrance sites (Aesop, Byredo, Diptyque, Le Labo) and Linear's information density.

## Typography

- **Display/headings**: Cormorant Garamond (serif), weight 500-600
- **Body/UI**: Inter, weight 400-500
- **Labels/nav**: Inter, 11-12px, weight 500-600, letter-spacing 2-3px, uppercase
- **No font weight below 400** — everything must be readable
- Scale: 11px labels, 13-15px body, 17px verdict, 22-34px headings, 64px hero

## Color Palette

- `--cream: #faf8f5` (primary bg)
- `--cream-mid: #f0ece4` (card bg, sections)
- `--cream-dark: #e2d8c8` (borders, dividers)
- `--brown: #1e1812` (primary text, dark sections)
- `--brown-mid: #6b5a45` (secondary text)
- `--brown-light: #a69279` (tertiary text, labels)
- `--sage: #6b8060` (loved notes, positive)
- `--rose: #b8605a` (risk notes, negative)
- `--amber: #c4973e` (liked notes, accent)

## Navigation

- Fixed top bar, cream with `backdrop-filter: blur(20px)`
- Logo left (Cormorant Garamond, 20px, weight 600)
- Nav links center (Score, Collection, Taste Profile) — 12px uppercase
- Sign In button right — dark brown pill

## Pages

### 1. Home / Score Page (Hero)

**Layout**: Two-column grid — text left, bottles right.

- Left column: "BLIND BUY CONFIDENCE" label, "Will you / *love it?*" headline (64px Cormorant), body text, search bar (white bg, rounded, subtle shadow)
- Right column: White background (`#fff`) for clean `mix-blend-mode: multiply` on bottle images. 4 bottles centered, different natural heights, aligned center. Bottles animate up on load (staggered 0.3s delays)
- Bottom stats bar: Full-width white strip with 4 stats (1,247 Fragrances | 47 Notes Rated | 12 In Collection | 87% Best Match). Cormorant Garamond numbers at 26px

**Hero height**: Auto (content-driven), NOT 100vh. No dead space.

### 2. Score Result

**Layout**: Two-column grid — bottle image left (400px), details right.

- Left: Cream-mid background, bottle image centered with `mix-blend-mode: multiply`, floating score badge (84px circle, dark brown, Cormorant 30px number) in top-right with pulse animation
- Right: Fragrance name (34px Cormorant), house name (12px uppercase), confidence badge, italic verdict quote (17px Cormorant italic, cream-mid bg, amber left border)
- Two sub-columns below verdict:
  - Note Breakdown: Color-coded tags (loved=sage, liked=amber, risk=rose), 4px rounded
  - From Your Collection: Similar fragrances with mini bottle images, shared notes, percentage match
- Action buttons at bottom: "Add to Collection" (dark primary), "Score Another" (ghost outline)

### 3. Collection

**Layout**: Magazine-style asymmetric grid (1.4fr 1fr 1fr), 2 rows at 270px each, 10px gaps.

- Header: "Your Collection" (30px Cormorant) + "+ Add Fragrance" button (outlined, inverts on hover)
- Filter tabs: ALL (12) | OWN (8) | TRIED (2) | WISHLIST (2) — 12px uppercase, active has underline
- Featured card spans both rows (left column) — large bottle image, vertical layout
- Regular cards: horizontal layout (120px image left, text right)
- Each card shows: status badge, name (Cormorant), house (uppercase), accord tags, star rating
- All bottle images use `mix-blend-mode: multiply` on cream-mid backgrounds
- **Fix needed**: Normalize image sizes within cards — constrain to consistent dimensions

### 4. Taste Profile

**Layout**: Two-column grid on dark brown background (`#1e1812`).

- Left column:
  - "Your Taste DNA" heading + subtitle
  - Stats row: 4-cell grid (Owned/Tried/Wishlist/Notes) with Cormorant numbers at 26px
  - Accord bars: animated fill (barGrow keyframe), 5 accords with percentage labels
  - Note groups: 3-column grid (Love/Like/Avoid) with color-coded chips
- Right column:
  - "Rate Notes" header with remaining count
  - Swipe card: centered, bordered, note name (32px Cormorant), category, 4 action buttons (Love/Like/Meh/Skip) as 54px circles with hover color effects
  - Recently rated chips below with colored dots

- **Fix needed**: Improve text contrast — current light-on-dark is hard to read. Bump cream text colors, increase label opacity, possibly use slightly lighter dark bg

## Image Handling

- All perfume bottle images from Fragrantica CDN (`fimgs.net/mdimg/perfume/375x500.{id}.jpg`)
- Images have white backgrounds — use `mix-blend-mode: multiply` on cream/white surfaces
- Hero bottles: white (`#fff`) background required for clean blend (cream-mid shows edges)
- Score/Collection: cream-mid background works fine with multiply
- No drop-shadow filter when using blend mode (they conflict)
- Hover: `transform: scale(1.03-1.06)` with cubic-bezier easing

## Animations

- Hero text: `fadeUp` (opacity 0 + translateY 16px) with staggered delays (0.2s, 0.4s, 0.7s, 0.9s)
- Hero bottles: `bottleUp` (opacity 0 + translateY 40px) staggered (0.3s, 0.5s, 0.7s, 0.9s)
- Hero stats: `fadeIn` staggered (1.1s-1.4s)
- Score badge: `scoreIn` (scale 0.5 to 1) + `pulseGlow` (box-shadow pulse, 3s infinite)
- Accord bars: `barGrow` (scaleX 0 to 1, 1.2s, staggered by row)
- Collection cards: `transform: scale(0.985)` on hover with cubic-bezier(0.16, 1, 0.3, 1)
- All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` for snappy luxury feel

## Known Issues to Fix During Implementation

1. **Taste profile readability**: Text is too low contrast on dark background. Needs lighter text colors or adjusted background
2. **Collection image sizing**: Bottles aren't consistently sized within cards. Need `object-fit: contain` with fixed dimensions per card type
3. **Mobile responsiveness**: Not addressed yet — will need responsive breakpoints

## Reference Mockup

Working mockup at `.superpowers/brainstorm/2366-*/content/visual-direction-v6.html` with Playwright-injected fixes for the hero section.
