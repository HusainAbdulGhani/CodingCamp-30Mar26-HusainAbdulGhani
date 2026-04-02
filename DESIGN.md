# Design Document — Expensio Budget Visualizer

## Design Philosophy

Three prompts merged into one aesthetic:
- **Glassmorphism** — frosted glass cards with backdrop blur, subtle borders, and top-edge shimmer lines
- **Minimalist hierarchy** — generous spacing, clear typographic scale, no decorative noise
- **Tech / neon** — deep navy background, neon cyan/lime/purple category accents, aurora orb animations

---

## Color System

### Dark Theme (default)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#06080f` | Page background |
| `--s2` | `#111827` | Input backgrounds |
| `--s3` | `#1a2235` | Focused input background |
| `--g` | `rgba(255,255,255,0.04)` | Card glass background |
| `--gb` | `rgba(255,255,255,0.08)` | Card borders |
| `--t1` | `#eef2ff` | Primary text |
| `--t2` | `#7b8db0` | Secondary text, labels |
| `--t3` | `#3a4a65` | Muted text, placeholders |
| `--violet` | `#7c3aed` | Brand primary |
| `--blue` | `#2563eb` | Brand secondary |

### Light Theme

Overrides the same tokens — white surfaces, indigo borders, dark text. Aurora orbs reduced to 6% opacity.

### Category Neon Colors

| Category | Color | Token |
|---|---|---|
| Food | Cyan `#22d3ee` | `--cyan` |
| Transportation | Lime `#a3e635` | `--lime` |
| Fun | Purple `#c084fc` | `--purple` |

Each category has a matching `-d` (dim) variant at 13% opacity for backgrounds.

---

## Typography

- Font: **Inter** (Google Fonts) — weights 400–900
- Brand name: `1.35rem / 800`
- Card titles: `0.92rem / 700`
- Field labels: `0.67rem / 700 / uppercase`
- Body / inputs: `0.88rem / 400`
- Stat values: `0.78rem / 800`
- Badges / meta: `0.62–0.68rem / 700`

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo + Brand Name + Date  │  Total Badge  🌙   │
├──────────────────────────────────┬──────────────────────┤
│  LEFT COLUMN (1fr)               │  RIGHT COLUMN (320px)│
│  ┌──────────────────────────┐    │  ┌──────────────────┐│
│  │  New Transaction (form)  │    │  │  Stats Row (3)   ││
│  └──────────────────────────┘    │  ├──────────────────┤│
│  ┌──────────────────────────┐    │  │  Doughnut Chart  ││
│  │  Transaction History     │    │  ├──────────────────┤│
│  │  (scrollable list)       │    │  │  Tip Card        ││
│  └──────────────────────────┘    │  └──────────────────┘│
└──────────────────────────────────┴──────────────────────┘
```

At ≤900px: collapses to single column, right panel moves above left panel.
At ≤640px: header stacks vertically, form row becomes single column.
At ≤420px: stats grid becomes 2-column.

---

## Component Design

### Glass Card
- `backdrop-filter: blur(24px)` with `rgba(255,255,255,0.04)` background
- 1px border at `rgba(255,255,255,0.08)`
- Top-edge shimmer via `::after` pseudo-element
- `box-shadow: 0 8px 32px rgba(0,0,0,0.25)`

### Category Pills (form)
- Pill buttons with `aria-pressed` state
- Selected state: neon color border + dim background + glow `box-shadow`
- Hidden `<select>` synced via JS for form value

### Transaction Item
- Category emoji icon in a rounded square with dim neon background
- Name + category badge + optional high-spend badge
- Amount right-aligned, amber color when `> $500`
- Hover: `translateX(3px)` slide + glass background
- Entry animation: `translateY(8px) → 0` fade-in

### Doughnut Chart
- `cutout: 68%` — wide ring
- Center label shows compact total (e.g. `$1.2K`)
- `borderWidth: 0` — no gaps between segments
- Legend: bottom, circle point style, color syncs with active theme

### Aurora Background
- 3 fixed `position: fixed` orbs with `blur(100px)` and `opacity: 0.13`
- Animated with `drift` keyframes — slow, organic movement
- Colors: violet, blue, cyan — matching brand palette

---

## Architecture

### State Flow
```
transactions[]  ←→  localStorage (key: evb_transactions)
      ↓
  renderAll()
  ├── renderTotal()       — header badge + chart center label
  ├── renderStats()       — 3 category chips
  ├── renderList()        — transaction list DOM
  ├── updateChart()       — chart.update('active') only on data change
  └── renderTip()         — dynamic insight based on dominant category
```

### Key Decisions
- **IIFE module pattern** — no global scope pollution
- **Event delegation** — single click listener on `.tx-list` handles all delete buttons
- **DocumentFragment** — batch DOM inserts for list rendering
- **XSS-safe** — user input set via `textContent`, never `innerHTML`
- **localStorage migration** — old `"Entertainment"` keys auto-converted to `"Fun"` on load
- **chart.update('active')** — called only when data changes, not on every render cycle

---

## Theme Implementation

Controlled via `data-theme` attribute on `<html>`:

```css
:root          { --bg: #06080f; }   /* dark default */
[data-theme="light"] { --bg: #f0f2fa; }
```

Preference stored in `localStorage` key `evb_theme` and applied before first render to prevent flash of wrong theme.
