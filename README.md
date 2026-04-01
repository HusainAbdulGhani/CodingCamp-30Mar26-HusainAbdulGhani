# CodingCamp-30Mar26-HusainAbdulGhani

A web-based daily expense tracker that is lightweight, mobile-friendly, and requires no backend or build tools — just open and use.

---

## Project Overview

**Expense & Budget Visualizer** is a single-page application (SPA) for tracking daily personal expenses. Users can log transactions by name, amount, and category, then instantly see a visual breakdown of their spending. All data is stored locally in the browser, so nothing is lost on page refresh.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Styling, theming (CSS variables), responsive layout |
| Vanilla JavaScript | Application logic, DOM manipulation, state management |
| LocalStorage API | Client-side data persistence |
| Chart.js (CDN) | Doughnut chart for spending distribution |

---

## Core Features (MVP)

- **Input Form** — Add a transaction with item name, amount, and category (Makanan, Transportasi, Hiburan). All fields are required with inline validation feedback.
- **Transaction List** — Scrollable list of all recorded transactions. Each item can be individually deleted.
- **Auto Total** — Header displays the running total of all expenses, updated in real-time on every add or delete.
- **Pie Chart** — Doughnut chart (Chart.js) visualizes spending distribution per category. Updates efficiently using `chart.update()` — no full re-render on each change.

---

## Additional Features

- **Dark / Light Mode** — Toggle between themes via the header button. Preference is saved to localStorage and restored on next visit.
- **Sorting** — Sort the transaction list by: latest first, amount ascending, amount descending, or category A–Z.
- **High-Spend Highlight** — Any transaction exceeding **Rp 500,000** is automatically highlighted with a warning badge (⚠ Pengeluaran Besar) for quick visual identification.

---

## Folder Structure

```
/
├── index.html        ← Entry point (GitHub Pages compatible)
├── README.md
├── css/
│   └── style.css     ← All styles: layout, components, themes, responsive
└── js/
    └── app.js        ← All logic: state, storage, rendering, event handling
```

The project intentionally uses a single CSS file and a single JS file to keep the codebase simple and easy to navigate. The JS module is wrapped in an IIFE to avoid polluting the global scope.

---

## Getting Started

No installation or build step required.

1. Clone or download this repository.
2. Open `index.html` in any modern browser.

To deploy on **GitHub Pages**: push to your repository and enable Pages from the `main` branch root. The `index.html` at the root will be detected automatically.

---

## License

This project was built as part of a coding camp exercise. Free to use and modify.
