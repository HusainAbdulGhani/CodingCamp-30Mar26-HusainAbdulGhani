# CodingCamp-30Mar26-HusainAbdulGhani

A web-based daily expense tracker built as a single-page application. No backend, no framework — just clean Vanilla JavaScript, persistent localStorage, and an interactive doughnut chart.

---

## Project Overview

**Expensio — Budget Visualizer** lets users log daily expenses by name, amount, and category, then instantly see a visual breakdown of their spending. All data is stored in the browser, so nothing is lost on page refresh. The UI features a dark-first glassmorphism design with aurora background effects, fully responsive across desktop and mobile.

---

## Tech Stack

| Technology | Role |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Glassmorphism design, CSS variables, responsive grid |
| Vanilla JavaScript (ES6+) | App logic, DOM manipulation, state management |
| LocalStorage API | Client-side data persistence |
| Chart.js v4.4.0 (CDN) | Doughnut chart for spending distribution |
| Inter (Google Fonts) | Typography |

---

## Core Features (MVP)

- **Input Form** — Add a transaction with item name, amount ($), and category. All fields are required with inline validation feedback per field.
- **Transaction List** — Scrollable list of all recorded transactions. Each item shows a category icon, name, category badge, amount, and a delete button.
- **Real-time Total** — Header displays the running total of all expenses, updated instantly on every add or delete with a micro-animation bump.
- **Doughnut Chart** — Chart.js visualizes spending distribution per category. Updates efficiently via `chart.update()` — no full re-render on each change. Shows compact total in the center.

---

## Optional Challenges (3 of 5 completed)

- **Sort Transactions** — Sort the transaction list by: Latest, Amount ↓, Amount ↑, or Category A–Z.
- **High-Spend Highlight** — Any transaction exceeding **$500** is automatically highlighted with a warning badge (⚠ High Spend) and amber-colored amount.
- **Dark / Light Mode** — Toggle between themes via the header button. Preference is saved to localStorage and restored on next visit. Chart legend color syncs with the active theme.

---

## Folder Structure

```
/
├── index.html        ← Entry point (GitHub Pages compatible)
├── README.md
├── DESIGN.md         ← Design decisions and architecture
├── TASKS.md          ← Full task checklist
├── css/
│   └── style.css     ← All styles: tokens, layout, components, responsive
└── js/
    └── app.js        ← All logic: state, storage, rendering, events
```

One CSS file, one JS file — intentionally minimal per project rules.

---

## Getting Started

No installation or build step required.

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

To deploy on **GitHub Pages**: push to your repository, go to Settings → Pages, and set the source to the `main` branch root. The `index.html` at root will be detected automatically.

---

## License

Built as a coding camp project. Free to use and modify.
