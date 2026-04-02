# Task List — Expensio Budget Visualizer

Complete checklist of all features, technical requirements, and documentation for this project.

---

## Setup & Structure

- [x] Create folder structure: `css/`, `js/` at root
- [x] `index.html` at root (GitHub Pages compatible)
- [x] Link `css/style.css` and `js/app.js`
- [x] Integrate Chart.js v4.4.0 via CDN with `defer`
- [x] Load Inter font via Google Fonts

---

## MVP — Core Features

### Input Form
- [x] Field: Item Name (text, max 60 chars)
- [x] Field: Amount (number, min $0.01, step $0.01)
- [x] Field: Category — pill button selector (Food, Transportation, Fun)
- [x] Hidden `<select>` synced to pill state for form value
- [x] Inline validation — error message per field
- [x] `is-invalid` class on invalid inputs (red border + glow)
- [x] Form resets after successful submit
- [x] Focus returns to Item Name after submit

### Transaction List
- [x] Render list from state using `DocumentFragment`
- [x] Category emoji icon per item
- [x] Item name with ellipsis overflow
- [x] Category badge with neon color per category
- [x] Amount right-aligned, tabular numerals
- [x] Delete button per item (event delegation)
- [x] Scrollable list (`max-height: 360px`)
- [x] Empty state with icon when no transactions
- [x] Slide-up entry animation on new items

### Real-time Total
- [x] Calculate total from state on every add/delete
- [x] Display in header badge with USD format
- [x] Micro-animation bump on update

### Doughnut Chart
- [x] Initialize Chart.js once on app start
- [x] `cutout: 68%` wide ring style
- [x] Center label showing compact total
- [x] `chart.update('active')` — no destroy/recreate
- [x] Chart only updates when data changes
- [x] Empty state message when no data
- [x] Legend color syncs with active theme

### Data Persistence
- [x] Save transactions to `localStorage` on every add/delete
- [x] Load transactions from `localStorage` on page load
- [x] Data survives page refresh
- [x] Graceful fallback to `[]` on parse error
- [x] Auto-migrate old `"Entertainment"` category to `"Fun"`

---

## Optional Challenges (3 of 5)

### Sort Transactions ✅
- [x] Sort dropdown: Latest, Amount ↓, Amount ↑, Category A–Z
- [x] Sort does not mutate original state array
- [x] Re-renders list on sort change

### High-Spend Highlight ✅
- [x] Detect transactions with `amount > $500`
- [x] Apply `is-high` class — amber background tint
- [x] Amount text turns amber
- [x] "⚠ High Spend" badge appears
- [x] Toast notification warns on add

### Dark / Light Mode ✅
- [x] Toggle button in header (🌙 / ☀️)
- [x] `data-theme` attribute on `<html>` controls all colors via CSS variables
- [x] Preference saved to `localStorage` key `evb_theme`
- [x] Theme applied before first render (no flash)
- [x] Chart legend color re-syncs after theme change

---

## UI / UX & Design

- [x] Glassmorphism cards with `backdrop-filter: blur(24px)`
- [x] Aurora orb background animations (3 orbs, slow drift)
- [x] Deep navy dark theme as default
- [x] Neon cyan / lime / purple category color system
- [x] Inter font — weights 400–900
- [x] 2-column grid layout (desktop): `1fr 320px`
- [x] Single column layout (≤900px)
- [x] Mobile responsive (≤640px, ≤420px breakpoints)
- [x] Chart sticky on desktop, static on mobile
- [x] Toast notification on add/delete
- [x] Dynamic tip card based on dominant spending category
- [x] Stats row showing per-category totals

---

## Code Quality

- [x] IIFE module pattern — no global scope pollution
- [x] Single Responsibility per function
- [x] Event delegation for delete buttons
- [x] XSS-safe rendering via `textContent`
- [x] Descriptive variable and function names
- [x] Section comments throughout `app.js`
- [x] `'use strict'` mode

---

## Documentation

- [x] `README.md` — project overview, tech stack, features, setup guide
- [x] `DESIGN.md` — color system, layout, component design, architecture
- [x] `TASKS.md` — this file

---

## Backlog (Not implemented — future ideas)

- [ ] Custom category creation
- [ ] Monthly summary / filter by month
- [ ] Export transactions to CSV
- [ ] Budget limit per category with progress bar
- [ ] PWA support (Service Worker for offline use)
