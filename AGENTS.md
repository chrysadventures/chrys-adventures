# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Chrys's Adventures** — a dyscalculia learning web app for children. Features a monkey character named Chrys in a banana-themed world. Two modes planned: Learning Mode (Numbers, Operations, Real World Applications) and Test Mode (4 test types + final combined test).

## Commands

### Frontend (run from `client/`)
```powershell
# Always set this env var first — required on this machine due to SSL cert config
$env:NODE_OPTIONS="--use-system-ca"

npm run dev       # Start Vite dev server → http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

### Backend (run from `server/`)
```powershell
npm run dev       # Start Express with nodemon → http://localhost:3001
npm start         # Start Express without nodemon
```

Both servers must run simultaneously during development. The Vite dev server proxies `/api/*` requests to `http://localhost:3001`, so no CORS handling is needed in the frontend.

## Response handoff

Every final response must include this project handoff block:

```powershell
cd "C:\Users\wanha\OneDrive\Dyscalculia App"
git add -A
git commit -m "Update Chrys dyscalculia app"
git push
```

- Live app: https://jaredtehyh-cell.github.io/chrys-adventures/
- GitHub repository: https://github.com/jaredtehyh-cell/chrys-adventures

## Architecture

### Monorepo structure
```
Dyscalculia App/
├── client/    # React 19 + Vite 8 + Tailwind CSS v4
└── server/    # Node.js + Express 5
```

### Frontend (`client/src/`)
- `main.jsx` → `App.jsx` (React Router root) → `pages/` → `components/`
- Pages live in `pages/` and are thin wrappers that render components
- Components are organized by feature: `auth/`, `common/`, `learning/` (future), `test/` (future)
- `common/` holds reusable themed components: `Button`, `MonkeyDecor`, `BananaDecor`

### Tailwind CSS v4 (important — different from v3)
- **No `tailwind.config.js`** — configuration lives in `src/index.css` inside an `@theme {}` block
- Imported with `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Integrated via `@tailwindcss/vite` Vite plugin (not PostCSS)
- Custom design tokens defined in `src/index.css`:
  - `--color-banana-*`: `#FFF3B0`, `#FFE066`, `#F5C400`
  - `--color-monkey-*`: `#8B5E3C`, `#D4956A`, `#4A2C00`
  - `--color-jungle-*`: `#B7E4C7`, `#52B788`, `#1B4332`
  - `--font-fun`: Nunito (loaded via Google Fonts in `index.html`)

### Adding images for Chrys
Place PNG/SVG files in `client/public/assets/images/`. Pass the path as a `src` prop to `MonkeyDecor`:
```jsx
<MonkeyDecor src="/assets/images/chrys-waving.png" />
```
Without `src`, it renders the 🐒 emoji placeholder.

### Existing recorded math-cue audio
- English: `client/public/audio/plus.wav`, `equals-to.wav`, and `minus.wav`.
- Malay: `client/public/audio/Tambah.mp3`, `Sama dengan.mp3`, and `tolak.mp3`.
- Reuse these recordings through `MATH_CUE_AUDIO_FILES` and `speakMathCue`. Always inspect `client/public/audio/` before using text-to-speech or creating audio, because the required recording may already exist.

### Advanced Adventure visual rule
- Advanced Adventure uses the dark cyber palette. Do not introduce `bg-white`, white image cards, or other white/light panel backgrounds in advanced menus, lessons, practice, feedback, or completion screens.
- Chrys and Alyse assets ending in `_nobg` have transparent backgrounds. Keep them transparent and place them directly on dark slate/cyan/emerald cyber surfaces; never add a white plate behind them.
- When reusing a shared component in Advanced Adventure, provide a cyber variant so its background, borders, text, and interaction states remain consistent with the dark theme.

### Backend (`server/`)
- `server.js` — entry point, starts the HTTP server
- `app.js` — Express app setup (CORS, JSON middleware, routes)
- `src/routes/` and `src/models/` are pre-created stubs for when a database is added
- No database connected yet; only `/api/health` route exists

### React Router
Currently one route: `"/" → LandingPage → AuthPage`. New routes are added in `client/src/App.jsx`.
